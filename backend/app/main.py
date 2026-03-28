import csv
import io
import json
import os
import random
import re
import threading
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.parse import quote
from urllib.parse import urlparse
from urllib.parse import urlunparse

import paramiko
import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import Query
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel


load_dotenv()

API_PORT = int(os.getenv("API_PORT", "8000"))
HDFS_NAMENODE_URL = os.getenv("HDFS_NAMENODE_URL", "http://localhost:9870").rstrip("/")
HDFS_USER = os.getenv("HDFS_USER", "hanif")
HDFS_BASE_PATH = os.getenv("HDFS_BASE_PATH", "/user/hanif/yelp")
HDFS_DATASETS = [
    d.strip().lower()
    for d in os.getenv("HDFS_DATASETS", "business,user,checkin,review,tip").split(",")
    if d.strip()
]
HDFS_MAX_FILES_PER_DATASET = int(os.getenv("HDFS_MAX_FILES_PER_DATASET", "200"))
HDFS_OPEN_LENGTH_BYTES = int(os.getenv("HDFS_OPEN_LENGTH_BYTES", "0"))
HDFS_TIMEOUT_SECONDS = float(os.getenv("HDFS_TIMEOUT_SECONDS", "12"))

UBUNTU_SSH_ENABLED = os.getenv("UBUNTU_SSH_ENABLED", "true").lower() == "true"
UBUNTU_HOST = os.getenv("UBUNTU_HOST", "")
UBUNTU_PORT = int(os.getenv("UBUNTU_PORT", "22"))
UBUNTU_USERNAME = os.getenv("UBUNTU_USERNAME", "")
UBUNTU_PASSWORD = os.getenv("UBUNTU_PASSWORD", "")

LOCAL_DATA_DIR = Path(os.getenv("LOCAL_DATA_DIR", "./data/raw")).resolve()
CHAT_MAX_ROWS = int(os.getenv("CHAT_MAX_ROWS", "80"))
CHAT_MAX_ROW_VALUE_CHARS = int(os.getenv("CHAT_MAX_ROW_VALUE_CHARS", "220"))
CHAT_MAX_ROW_COLUMNS = int(os.getenv("CHAT_MAX_ROW_COLUMNS", "16"))
CHART_MAX_POINTS = int(os.getenv("CHART_MAX_POINTS", "40"))

LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.deepseek.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "deepseek-chat")


class ChatRequest(BaseModel):
    question: str


class DataStore:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.sync_running = False
        self.last_sync_started: str | None = None
        self.last_sync_finished: str | None = None
        self.last_sync_error: str | None = None
        self.rows_by_dataset: dict[str, list[dict[str, Any]]] = {}
        self.row_count_by_dataset: dict[str, int] = {}


store = DataStore()

app = FastAPI(title="Yelp Python Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def utc_now() -> str:
    return datetime.utcnow().isoformat() + "Z"


def normalize_dataset(dataset: str | None) -> str | None:
    if not dataset:
        return None
    k = re.sub(r"[\s_\-]+", "", dataset.lower())
    aliases = {
        "business": "business",
        "businesses": "business",
        "user": "user",
        "users": "user",
        "checkin": "checkin",
        "checkins": "checkin",
        "review": "review",
        "reviews": "review",
        "tip": "tip",
        "tips": "tip",
        "rating": "tip",
        "comprehensive": "comprehensive",
    }
    return aliases.get(k)


def infer_dataset_from_question(question: str) -> str:
    q = question.lower()
    if re.search(r"\b(user|fans|yelping|elite)\b", q):
        return "user"
    if re.search(r"\b(check\s*-?in|hour|peak time)\b", q):
        return "checkin"
    if re.search(r"\b(review|sentiment|text|useful|funny|cool)\b", q):
        return "review"
    if re.search(r"\b(tip|rating|star|stars)\b", q):
        return "tip"
    return "business"


def dataset_candidates(dataset: str) -> list[str]:
    if dataset == "comprehensive":
        return [d for d in HDFS_DATASETS if d in {"business", "user", "checkin", "review", "tip"}]
    return [dataset]


def encode_hdfs_path(path_value: str) -> str:
    clean = str(path_value).strip().lstrip("/")
    encoded = "/".join(quote(part, safe="") for part in clean.split("/") if part)
    return "/" + encoded


def build_webhdfs_url(path_value: str, op: str, extra: dict[str, str] | None = None) -> str:
    params = {"op": op, "user.name": HDFS_USER}
    if extra:
        params.update(extra)
    return f"{HDFS_NAMENODE_URL}/webhdfs/v1{encode_hdfs_path(path_value)}?{urlencode(params)}"


def rewrite_location_host(location: str) -> str:
    if not location or not UBUNTU_HOST:
        return location
    parsed = urlparse(location)
    if not parsed.hostname:
        return location
    if parsed.hostname in {"localhost", "127.0.0.1"} or parsed.hostname != UBUNTU_HOST:
        host = UBUNTU_HOST
        if parsed.port:
            netloc = f"{host}:{parsed.port}"
        else:
            netloc = host
        return urlunparse((parsed.scheme, netloc, parsed.path, parsed.params, parsed.query, parsed.fragment))
    return location


def list_hdfs_files_via_webhdfs(dataset_path: str) -> list[str]:
    url = build_webhdfs_url(dataset_path, "LISTSTATUS")
    resp = requests.get(url, timeout=HDFS_TIMEOUT_SECONDS)
    if resp.status_code != 200:
        raise RuntimeError(f"WebHDFS LISTSTATUS failed: {resp.status_code} {resp.text[:200]}")
    payload = resp.json()
    statuses = payload.get("FileStatuses", {}).get("FileStatus", [])
    files = []
    for item in statuses:
        if item.get("type") != "FILE":
            continue
        suffix = item.get("pathSuffix", "")
        if re.search(r"^(part-|.*\.(json|jsonl|csv|txt))", suffix):
            files.append(f"{dataset_path.rstrip('/')}/{suffix}")
    files.sort()
    if HDFS_MAX_FILES_PER_DATASET > 0:
        return files[: HDFS_MAX_FILES_PER_DATASET]
    return files


def open_hdfs_file_via_webhdfs(file_path: str) -> str:
    extra = {"noredirect": "true"}
    if HDFS_OPEN_LENGTH_BYTES > 0:
        extra["length"] = str(HDFS_OPEN_LENGTH_BYTES)

    open_url = build_webhdfs_url(file_path, "OPEN", extra)
    resp = requests.get(open_url, timeout=HDFS_TIMEOUT_SECONDS)
    if resp.status_code != 200:
        raise RuntimeError(f"WebHDFS OPEN failed: {resp.status_code} {resp.text[:200]}")

    location = resp.headers.get("Location", "")
    if not location:
        try:
            location = resp.json().get("Location", "")
        except Exception:
            location = ""

    final_url = rewrite_location_host(location) if location else open_url
    file_resp = requests.get(final_url, timeout=max(20.0, HDFS_TIMEOUT_SECONDS))
    if file_resp.status_code != 200:
        raise RuntimeError(
            f"WebHDFS redirected OPEN failed: {file_resp.status_code} {file_resp.text[:200]}"
        )
    return file_resp.text


def ssh_run(command: str, timeout: float = 30.0) -> str:
    if not (UBUNTU_SSH_ENABLED and UBUNTU_HOST and UBUNTU_USERNAME and UBUNTU_PASSWORD):
        raise RuntimeError("SSH fallback is not configured.")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(
            hostname=UBUNTU_HOST,
            port=UBUNTU_PORT,
            username=UBUNTU_USERNAME,
            password=UBUNTU_PASSWORD,
            timeout=timeout,
        )
        _, stdout, stderr = client.exec_command(command, timeout=timeout)
        out = stdout.read().decode("utf-8", errors="ignore")
        err = stderr.read().decode("utf-8", errors="ignore")
        if err.strip() and not out.strip():
            raise RuntimeError(err.strip())
        return out
    finally:
        client.close()


def list_hdfs_files_via_ssh(dataset_path: str) -> list[str]:
    escaped = dataset_path.replace('"', '\\"')
    cmd = (
        "bash -lc '"
        "for c in $HADOOP_HOME/bin/hdfs /usr/local/hadoop/bin/hdfs /opt/hadoop/bin/hdfs hdfs; "
        f"do $c dfs -ls \"{escaped}\" 2>/dev/null && exit 0; done; "
        "for c in $HADOOP_HOME/bin/hadoop /usr/local/hadoop/bin/hadoop /opt/hadoop/bin/hadoop hadoop; "
        f"do $c fs -ls \"{escaped}\" 2>/dev/null && exit 0; done; exit 127'"
    )
    output = ssh_run(cmd, timeout=40.0)
    files = []
    for line in output.splitlines():
        line = line.strip()
        if not line:
            continue
        parts = re.split(r"\s+", line)
        file_path = parts[-1] if parts else ""
        if not file_path or file_path.endswith("/"):
            continue
        if re.search(r"^(.*\/)?(part-|.*\.(json|jsonl|csv|txt))", file_path):
            files.append(file_path)
    files.sort()
    if HDFS_MAX_FILES_PER_DATASET > 0:
        return files[: HDFS_MAX_FILES_PER_DATASET]
    return files


def open_hdfs_file_via_ssh(file_path: str) -> str:
    escaped = file_path.replace('"', '\\"')
    cmd = (
        "bash -lc '"
        "for c in $HADOOP_HOME/bin/hdfs /usr/local/hadoop/bin/hdfs /opt/hadoop/bin/hdfs hdfs; "
        f"do $c dfs -cat \"{escaped}\" 2>/dev/null && exit 0; done; "
        "for c in $HADOOP_HOME/bin/hadoop /usr/local/hadoop/bin/hadoop /opt/hadoop/bin/hadoop hadoop; "
        f"do $c fs -cat \"{escaped}\" 2>/dev/null && exit 0; done; exit 127'"
    )
    return ssh_run(cmd, timeout=120.0)


def parse_dataset_text(text: str) -> list[dict[str, Any]]:
    raw = (text or "").strip()
    if not raw:
        return []

    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [r for r in parsed if isinstance(r, dict)]
        if isinstance(parsed, dict):
            if isinstance(parsed.get("rows"), list):
                return [r for r in parsed["rows"] if isinstance(r, dict)]
            if isinstance(parsed.get("data"), list):
                return [r for r in parsed["data"] if isinstance(r, dict)]
    except Exception:
        pass

    rows: list[dict[str, Any]] = []
    lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]

    jsonl_rows = []
    for line in lines:
        try:
            item = json.loads(line)
            if isinstance(item, dict):
                jsonl_rows.append(item)
        except Exception:
            continue
    if jsonl_rows:
        return jsonl_rows

    if lines and "," in lines[0]:
        reader = csv.DictReader(io.StringIO("\n".join(lines)))
        for row in reader:
            rows.append(dict(row))
        return rows

    for i, line in enumerate(lines, start=1):
        rows.append({"label": f"R{i}", "value": line})
    return rows


def serialize_row(row: dict[str, Any]) -> str:
    parts = []
    for k, v in row.items():
        parts.append(f"{k}:{v}")
    return " ".join(parts).lower()


def tokens(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9_]{2,}", text.lower())}


def compact_value(value: Any, max_len: int = CHAT_MAX_ROW_VALUE_CHARS) -> Any:
    if value is None:
        return None
    if isinstance(value, (int, float, bool)):
        return value
    s = str(value).strip()
    if len(s) <= max_len:
        return s
    return s[:max_len] + "..."


def compact_rows(rows: list[dict[str, Any]], row_limit: int = CHAT_MAX_ROWS) -> list[dict[str, Any]]:
    out = []
    for row in rows[:row_limit]:
        item: dict[str, Any] = {}
        for i, (k, v) in enumerate(row.items()):
            if i >= CHAT_MAX_ROW_COLUMNS:
                break
            item[k] = compact_value(v)
        out.append(item)
    return out


def sample_rows_for_index(rows: list[dict[str, Any]], max_items: int = 5000) -> list[dict[str, Any]]:
    if len(rows) <= max_items:
        return rows
    return random.sample(rows, k=max_items)


def sync_single_dataset(dataset: str) -> tuple[list[dict[str, Any]], int]:
    dataset_path = f"{HDFS_BASE_PATH.rstrip('/')}/{dataset}"
    rows: list[dict[str, Any]] = []

    files: list[str] = []
    try:
        files = list_hdfs_files_via_webhdfs(dataset_path)
    except Exception:
        if UBUNTU_SSH_ENABLED:
            files = list_hdfs_files_via_ssh(dataset_path)
        else:
            raise

    output_file = LOCAL_DATA_DIR / f"{dataset}.jsonl"
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with output_file.open("w", encoding="utf-8") as f:
        for path in files:
            try:
                try:
                    content = open_hdfs_file_via_webhdfs(path)
                except Exception:
                    content = open_hdfs_file_via_ssh(path)
                parsed_rows = parse_dataset_text(content)
                for row in parsed_rows:
                    f.write(json.dumps(row, ensure_ascii=True) + "\n")
                rows.extend(parsed_rows)
            except Exception:
                continue

    sampled = sample_rows_for_index(rows, 5000)
    return sampled, len(rows)


def sync_all_datasets() -> None:
    with store.lock:
        if store.sync_running:
            return
        store.sync_running = True
        store.last_sync_started = utc_now()
        store.last_sync_error = None

    try:
        new_rows: dict[str, list[dict[str, Any]]] = {}
        new_counts: dict[str, int] = {}

        for dataset in HDFS_DATASETS:
            sample, total_count = sync_single_dataset(dataset)
            new_rows[dataset] = sample
            new_counts[dataset] = total_count

        with store.lock:
            store.rows_by_dataset = new_rows
            store.row_count_by_dataset = new_counts
            store.last_sync_finished = utc_now()
    except Exception as exc:
        with store.lock:
            store.last_sync_error = str(exc)
            store.last_sync_finished = utc_now()
    finally:
        with store.lock:
            store.sync_running = False


def run_sync_in_background() -> None:
    thread = threading.Thread(target=sync_all_datasets, daemon=True)
    thread.start()


def get_dataset_rows(dataset: str) -> list[dict[str, Any]]:
    with store.lock:
        if dataset == "comprehensive":
            out: list[dict[str, Any]] = []
            for d in HDFS_DATASETS:
                out.extend(store.rows_by_dataset.get(d, []))
            return out
        return store.rows_by_dataset.get(dataset, [])


def score_row(question_tokens: set[str], row: dict[str, Any]) -> int:
    blob_tokens = tokens(serialize_row(row))
    return len(question_tokens & blob_tokens)


def retrieve_rows(question: str, dataset: str) -> list[dict[str, Any]]:
    rows = get_dataset_rows(dataset)
    if not rows:
        return []
    q_tokens = tokens(question)
    scored = [(score_row(q_tokens, r), r) for r in rows]
    scored.sort(key=lambda item: item[0], reverse=True)

    best = [r for s, r in scored if s > 0][: CHAT_MAX_ROWS]
    if best:
        return best
    return rows[: CHAT_MAX_ROWS]


def numeric(value: Any) -> float | None:
    try:
        if value is None:
            return None
        s = str(value).replace(",", "").strip()
        if not s:
            return None
        return float(s)
    except Exception:
        return None


def year_from_text(value: Any) -> str | None:
    match = re.search(r"\b(19\d{2}|20\d{2})\b", str(value))
    return match.group(1) if match else None


def to_chart_point(label: str, value: float) -> dict[str, Any]:
    v = float(value)
    return {
        "label": str(label),
        "value": v,
        "secondary": max(1.0, round(v * 0.7, 2)),
        "z": max(30.0, round(v * 1.2, 2)),
    }


def group_count(rows: list[dict[str, Any]], key_fn) -> list[dict[str, Any]]:
    counter: Counter[str] = Counter()
    for row in rows:
        key = key_fn(row)
        if key:
            counter[str(key)] += 1
    items = counter.most_common(CHART_MAX_POINTS)
    return [to_chart_point(lbl, val) for lbl, val in items]


def build_chart_data(rows: list[dict[str, Any]], dataset: str, question: str) -> list[dict[str, Any]]:
    if not rows:
        return []

    q = (question or "").lower()

    if dataset == "business":
        if re.search(r"city", q):
            return group_count(rows, lambda r: r.get("city"))
        if re.search(r"state", q):
            return group_count(rows, lambda r: r.get("state"))
        if re.search(r"categor", q):
            counter: Counter[str] = Counter()
            for row in rows:
                categories = str(row.get("categories", ""))
                for cat in [c.strip() for c in categories.split(",") if c.strip()]:
                    counter[cat] += 1
            return [to_chart_point(k, v) for k, v in counter.most_common(CHART_MAX_POINTS)]

    if dataset == "user" and re.search(r"year|join|yelping", q):
        return group_count(rows, lambda r: year_from_text(r.get("yelping_since")))

    if dataset == "review" and re.search(r"year|trend", q):
        return group_count(rows, lambda r: year_from_text(r.get("date")))

    if dataset == "checkin" and re.search(r"hour|busiest|peak", q):
        counter: Counter[str] = Counter()
        for row in rows:
            text = str(row.get("date", ""))
            for match in re.findall(r"\b(\d{1,2}):(\d{2})\b", text):
                hour = str(int(match[0])).zfill(2)
                counter[hour] += 1
        return [to_chart_point(k, v) for k, v in sorted(counter.items())][:CHART_MAX_POINTS]

    if dataset in {"tip", "rating"} and re.search(r"star|rating|distribution", q):
        counter: Counter[str] = Counter()
        for row in rows:
            s = numeric(row.get("stars"))
            if s is None:
                continue
            key = f"{int(round(s))} star"
            counter[key] += 1
        return [to_chart_point(k, v) for k, v in sorted(counter.items())][:CHART_MAX_POINTS]

    chart_rows = []
    for idx, row in enumerate(rows[:CHART_MAX_POINTS], start=1):
        label = (
            row.get("name")
            or row.get("city")
            or row.get("state")
            or row.get("date")
            or row.get("label")
            or f"P{idx}"
        )
        value = (
            numeric(row.get("value"))
            or numeric(row.get("count"))
            or numeric(row.get("review_count"))
            or numeric(row.get("stars"))
            or float(idx)
        )
        chart_rows.append(to_chart_point(str(label), value))
    return chart_rows


def create_local_summary(question: str, rows: list[dict[str, Any]], dataset: str) -> str:
    if not rows:
        return (
            "I could not find rows in the cached Ubuntu dataset yet. "
            "Use /api/sync and then ask again."
        )

    keys = []
    for row in rows[:10]:
        for key in row.keys():
            if key not in keys:
                keys.append(key)
            if len(keys) >= 8:
                break
        if len(keys) >= 8:
            break

    return (
        f"I found {len(rows)} relevant rows in the {dataset} dataset for your question. "
        f"Top available fields include: {', '.join(keys)}. "
        "You can ask a narrower follow-up like top cities, yearly trend, or rating distribution."
    )


def create_llm_summary(question: str, rows: list[dict[str, Any]], dataset: str) -> str:
    if not LLM_API_KEY:
        return create_local_summary(question, rows, dataset)

    client = OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)
    prompt_rows = compact_rows(rows[:8], row_limit=8)
    response = client.chat.completions.create(
        model=LLM_MODEL,
        temperature=0.2,
        max_tokens=350,
        messages=[
            {
                "role": "system",
                "content": "You are a helpful Yelp analyst. Use only provided rows and be concise.",
            },
            {
                "role": "user",
                "content": (
                    f"Question: {question}\n"
                    f"Dataset: {dataset}\n"
                    f"Rows: {json.dumps(prompt_rows, ensure_ascii=True)}"
                ),
            },
        ],
    )
    text = response.choices[0].message.content or ""
    text = text.strip()
    return text or create_local_summary(question, rows, dataset)


@app.on_event("startup")
def startup_sync() -> None:
    LOCAL_DATA_DIR.mkdir(parents=True, exist_ok=True)
    run_sync_in_background()


@app.get("/api/health")
def health() -> dict[str, Any]:
    with store.lock:
        return {
            "status": "ok",
            "timestamp": utc_now(),
            "syncRunning": store.sync_running,
            "lastSyncStarted": store.last_sync_started,
            "lastSyncFinished": store.last_sync_finished,
            "lastSyncError": store.last_sync_error,
            "datasets": list(store.row_count_by_dataset.keys()),
            "rowCountByDataset": store.row_count_by_dataset,
        }


@app.post("/api/sync")
def sync_now() -> dict[str, Any]:
    with store.lock:
        if store.sync_running:
            return {"status": "running", "message": "Sync is already in progress."}
    run_sync_in_background()
    return {"status": "started", "message": "Background sync started."}


@app.post("/api/chat")
def chat(req: ChatRequest) -> dict[str, Any]:
    question = (req.question or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    dataset = infer_dataset_from_question(question)
    rows = retrieve_rows(question, dataset)
    compact = compact_rows(rows)
    columns = list(compact[0].keys()) if compact else []
    summary = create_llm_summary(question, rows, dataset)

    notes = ["Backend connected.", "Answered using Python retrieval over Ubuntu dataset cache."]
    with store.lock:
        if store.sync_running:
            notes.append("Background sync is still running.")
        if store.last_sync_error:
            notes.append(f"Last sync warning: {store.last_sync_error}")

    return {
        "question": question,
        "summary": summary,
        "sql": f"-- PYTHON DATA RETRIEVAL MODE ({dataset})",
        "rows": compact,
        "columns": columns,
        "notes": notes,
    }


@app.get("/api/analysis/chart")
def analysis_chart(dataset: str = Query(...), question: str = Query(default="")) -> dict[str, Any]:
    normalized = normalize_dataset(dataset)
    if not normalized:
        raise HTTPException(
            status_code=400,
            detail="Invalid dataset. Use one of: business, user, checkin, review, tip, rating, comprehensive.",
        )

    source_datasets = dataset_candidates(normalized)
    rows: list[dict[str, Any]] = []
    for d in source_datasets:
        rows.extend(get_dataset_rows(d))

    chart_data = build_chart_data(rows, normalized, question)
    return {
        "dataset": normalized,
        "question": question,
        "sourcePaths": [f"{HDFS_BASE_PATH.rstrip('/')}/{d}" for d in source_datasets],
        "chartData": chart_data,
        "points": len(chart_data),
        "notes": [
            "Data loaded from Ubuntu via Python backend sync cache."
            if chart_data
            else "No chart rows in cache yet. Run /api/sync and retry."
        ],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=API_PORT, reload=False)
