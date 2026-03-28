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
HDFS_MAX_FILES_PER_DATASET = int(os.getenv("HDFS_MAX_FILES_PER_DATASET", "40"))
HDFS_OPEN_LENGTH_BYTES = int(os.getenv("HDFS_OPEN_LENGTH_BYTES", "4194304"))
HDFS_TIMEOUT_SECONDS = float(os.getenv("HDFS_TIMEOUT_SECONDS", "12"))
HDFS_REMOTE_MAX_LINES = int(os.getenv("HDFS_REMOTE_MAX_LINES", "100000"))
HDFS_ENRICHMENT_BASE_PATHS = [
    p.strip()
    for p in os.getenv(
        "HDFS_ENRICHMENT_BASE_PATHS",
        "/user/hanif/yelp,/user/hanif/yelp_external",
    ).split(",")
    if p.strip()
]
ENRICHMENT_MAX_ROWS_PER_SOURCE = int(os.getenv("ENRICHMENT_MAX_ROWS_PER_SOURCE", "1200"))

UBUNTU_SSH_ENABLED = os.getenv("UBUNTU_SSH_ENABLED", "true").lower() == "true"
UBUNTU_HOST = os.getenv("UBUNTU_HOST", "")
UBUNTU_PORT = int(os.getenv("UBUNTU_PORT", "22"))
UBUNTU_USERNAME = os.getenv("UBUNTU_USERNAME", "")
UBUNTU_PASSWORD = os.getenv("UBUNTU_PASSWORD", "")
UBUNTU_ZIP_PATH = os.getenv("UBUNTU_ZIP_PATH", "/home/hanif/Yelp-JSON.zip")
UBUNTU_ZIP_MAX_ROWS = int(os.getenv("UBUNTU_ZIP_MAX_ROWS", "5000"))
STARTUP_SYNC = os.getenv("STARTUP_SYNC", "false").lower() == "true"

LOCAL_DATA_DIR = Path(os.getenv("LOCAL_DATA_DIR", "./data/raw")).resolve()
CHAT_MAX_ROWS = int(os.getenv("CHAT_MAX_ROWS", "80"))
CHAT_MAX_ROW_VALUE_CHARS = int(os.getenv("CHAT_MAX_ROW_VALUE_CHARS", "220"))
CHAT_MAX_ROW_COLUMNS = int(os.getenv("CHAT_MAX_ROW_COLUMNS", "16"))
CHART_MAX_POINTS = int(os.getenv("CHART_MAX_POINTS", "40"))

LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.deepseek.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "deepseek-chat")

KEYWORD_FILE_PATH = Path(__file__).resolve().parent / "keywords.json"

STOP_WORDS = {
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "into",
    "have",
    "show",
    "find",
    "what",
    "where",
    "when",
    "how",
    "about",
    "based",
    "top",
    "most",
    "count",
}


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
        "rating": "rating",
        "ratings": "rating",
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


def load_keyword_profiles() -> list[dict[str, Any]]:
    if not KEYWORD_FILE_PATH.exists():
        return []
    try:
        payload = json.loads(KEYWORD_FILE_PATH.read_text(encoding="utf-8"))
        profiles = payload.get("profiles", [])
        if isinstance(profiles, list):
            return [p for p in profiles if isinstance(p, dict)]
    except Exception:
        return []
    return []


KEYWORD_PROFILES = load_keyword_profiles()


def detect_keyword_profile(question: str) -> dict[str, Any] | None:
    q = question.lower()
    for profile in KEYWORD_PROFILES:
        terms = [str(t).lower() for t in profile.get("terms", [])]
        if any(re.search(rf"\b{re.escape(term)}\b", q) for term in terms if term):
            return profile
    return None


def dataset_candidates(dataset: str) -> list[str]:
    if dataset == "comprehensive":
        return [d for d in HDFS_DATASETS if d in {"business", "user", "checkin", "review", "tip"}]
    if dataset == "rating":
        return ["review", "tip"]
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
    files: list[str] = []
    queue = [dataset_path.rstrip("/")]

    while queue:
        current = queue.pop(0)
        url = build_webhdfs_url(current, "LISTSTATUS")
        resp = requests.get(url, timeout=HDFS_TIMEOUT_SECONDS)
        if resp.status_code != 200:
            raise RuntimeError(f"WebHDFS LISTSTATUS failed: {resp.status_code} {resp.text[:200]}")
        payload = resp.json()
        statuses = payload.get("FileStatuses", {}).get("FileStatus", [])

        for item in statuses:
            suffix = item.get("pathSuffix", "")
            full_path = f"{current}/{suffix}".rstrip("/")
            if item.get("type") == "DIRECTORY":
                queue.append(full_path)
                continue
            if item.get("type") == "FILE" and re.search(r"^(part-|.*\.(json|jsonl|csv|txt))", suffix):
                files.append(full_path)

            if HDFS_MAX_FILES_PER_DATASET > 0 and len(files) >= HDFS_MAX_FILES_PER_DATASET:
                files.sort()
                return files[: HDFS_MAX_FILES_PER_DATASET]

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

    original_url = location or open_url
    rewritten_url = rewrite_location_host(original_url)

    try:
        file_resp = requests.get(rewritten_url, timeout=max(20.0, HDFS_TIMEOUT_SECONDS))
        if file_resp.status_code == 200:
            return file_resp.text
    except Exception:
        pass

    if original_url != rewritten_url:
        try:
            file_resp = requests.get(original_url, timeout=max(20.0, HDFS_TIMEOUT_SECONDS))
            if file_resp.status_code == 200:
                return file_resp.text
        except Exception:
            pass

    if UBUNTU_SSH_ENABLED:
        candidates = [original_url]
        if rewritten_url != original_url:
            candidates.append(rewritten_url)

        for candidate in candidates:
            escaped = candidate.replace('"', '\\"')
            cmd = (
                "bash -lc '"
                f"wget -qO- \"{escaped}\" 2>/dev/null | head -n {HDFS_REMOTE_MAX_LINES}"
                " || "
                f"curl -fsSL \"{escaped}\" 2>/dev/null | head -n {HDFS_REMOTE_MAX_LINES}'"
            )
            fetched = ssh_run(cmd, timeout=120.0)
            if fetched.strip():
                return fetched

    raise RuntimeError("WebHDFS redirected OPEN failed and SSH URL fallback returned no data.")


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
        f"do $c dfs -ls -R \"{escaped}\" 2>/dev/null && exit 0; done; "
        "for c in $HADOOP_HOME/bin/hadoop /usr/local/hadoop/bin/hadoop /opt/hadoop/bin/hadoop hadoop; "
        f"do $c fs -ls -R \"{escaped}\" 2>/dev/null && exit 0; done; exit 127'"
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
        f"do $c dfs -cat \"{escaped}\" 2>/dev/null | head -n {HDFS_REMOTE_MAX_LINES} && exit 0; done; "
        "for c in $HADOOP_HOME/bin/hadoop /usr/local/hadoop/bin/hadoop /opt/hadoop/bin/hadoop hadoop; "
        f"do $c fs -cat \"{escaped}\" 2>/dev/null | head -n {HDFS_REMOTE_MAX_LINES} && exit 0; done; exit 127'"
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


def load_rows_from_base_path(base_path: str, dataset: str, row_limit: int) -> list[dict[str, Any]]:
    dataset_path = f"{base_path.rstrip('/')}/{dataset}"
    files: list[str] = []

    try:
        files = list_hdfs_files_via_webhdfs(dataset_path)
    except Exception:
        try:
            files = list_hdfs_files_via_ssh(dataset_path)
        except Exception:
            return []

    if not files:
        return []

    rows: list[dict[str, Any]] = []
    for path in files:
        try:
            try:
                content = open_hdfs_file_via_webhdfs(path)
            except Exception:
                content = open_hdfs_file_via_ssh(path)
            parsed_rows = parse_dataset_text(content)
            if parsed_rows:
                rows.extend(parsed_rows)
            if row_limit > 0 and len(rows) >= row_limit:
                return rows[:row_limit]
        except Exception:
            continue

    return rows[:row_limit] if row_limit > 0 else rows


def load_rows_from_ubuntu_zip(dataset: str) -> list[dict[str, Any]]:
    if not UBUNTU_SSH_ENABLED:
        return []

    target_map = {
        "business": "business",
        "user": "user",
        "checkin": "checkin",
        "review": "review",
        "tip": "tip",
    }
    target = target_map.get(dataset)
    if not target:
        return []

    zip_path = UBUNTU_ZIP_PATH.replace('"', '\\"')
    py_cmd = (
        "python3 - <<'PY'\n"
        "import io\n"
        "import tarfile\n"
        "import zipfile\n"
        f"zip_path = \"{zip_path}\"\n"
        f"target = \"{target}\"\n"
        f"max_rows = {UBUNTU_ZIP_MAX_ROWS}\n"
        "count = 0\n"
        "def emit_lines(stream):\n"
        "    global count\n"
        "    for raw in stream:\n"
        "        line = raw.decode('utf-8', 'ignore').strip()\n"
        "        if not line:\n"
        "            continue\n"
        "        print(line)\n"
        "        count += 1\n"
        "        if count >= max_rows:\n"
        "            return True\n"
        "    return False\n"
        "with zipfile.ZipFile(zip_path, 'r') as zf:\n"
        "    names = zf.namelist()\n"
        "    json_names = [n for n in names if target in n.lower() and n.lower().endswith('.json')]\n"
        "    if json_names:\n"
        "        with zf.open(json_names[0]) as fh:\n"
        "            emit_lines(fh)\n"
        "    else:\n"
        "        tar_names = [n for n in names if n.lower().endswith('.tar')]\n"
        "        for tar_name in tar_names:\n"
        "            with zf.open(tar_name) as tar_stream:\n"
        "                with tarfile.open(fileobj=tar_stream, mode='r:*') as tf:\n"
        "                    members = [m for m in tf.getmembers() if m.isfile() and target in m.name.lower() and m.name.lower().endswith('.json')]\n"
        "                    if not members:\n"
        "                        continue\n"
        "                    member = members[0]\n"
        "                    extracted = tf.extractfile(member)\n"
        "                    if extracted is None:\n"
        "                        continue\n"
        "                    done = emit_lines(extracted)\n"
        "                    if done:\n"
        "                        break\n"
        "            if count >= max_rows:\n"
        "                break\n"
        "PY"
    )
    output = ssh_run(py_cmd, timeout=240.0)
    return parse_dataset_text(output)


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

    if not files:
        rows = load_rows_from_ubuntu_zip(dataset)
        with output_file.open("w", encoding="utf-8") as f:
            for row in rows:
                f.write(json.dumps(row, ensure_ascii=True) + "\n")
        sampled = sample_rows_for_index(rows, 5000)
        return sampled, len(rows)

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

    if not sampled:
        zip_rows = load_rows_from_ubuntu_zip(dataset)
        if zip_rows:
            with output_file.open("w", encoding="utf-8") as f:
                for row in zip_rows:
                    f.write(json.dumps(row, ensure_ascii=True) + "\n")
            sampled = sample_rows_for_index(zip_rows, 5000)
            return sampled, len(zip_rows)

    return sampled, len(rows)


def sync_dataset_into_store(dataset: str) -> None:
    sample, total_count = sync_single_dataset(dataset)
    with store.lock:
        store.rows_by_dataset[dataset] = sample
        store.row_count_by_dataset[dataset] = total_count


def sync_all_datasets() -> None:
    with store.lock:
        if store.sync_running:
            return
        store.sync_running = True
        store.last_sync_started = utc_now()
        store.last_sync_error = None

    try:
        for dataset in HDFS_DATASETS:
            sync_dataset_into_store(dataset)

        with store.lock:
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


def ensure_dataset_loaded(dataset: str) -> None:
    normalized = normalize_dataset(dataset)
    if not normalized:
        return

    targets = dataset_candidates(normalized)
    missing = [name for name in targets if not get_dataset_rows(name)]
    if not missing:
        return

    with store.lock:
        if store.sync_running:
            return

    for name in missing:
        try:
            sync_dataset_into_store(name)
        except Exception as exc:
            with store.lock:
                store.last_sync_error = str(exc)


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


def extract_query_terms(question: str) -> list[str]:
    quoted = [term.strip().lower() for term in re.findall(r'"([^"]+)"', question)]
    plain_tokens = [
        token.lower()
        for token in re.findall(r"[a-zA-Z0-9_]{3,}", question)
        if token.lower() not in STOP_WORDS
    ]
    terms: list[str] = []
    for term in quoted + plain_tokens:
        if term and term not in terms:
            terms.append(term)
    return terms[:8]


def exact_match_rows(rows: list[dict[str, Any]], terms: list[str], limit: int = CHAT_MAX_ROWS) -> list[dict[str, Any]]:
    if not rows or not terms:
        return []

    matched: list[dict[str, Any]] = []
    for row in rows:
        blob = serialize_row(row)
        if all(term in blob for term in terms):
            matched.append(row)
            if len(matched) >= limit:
                break
    return matched


def pick_fields(rows: list[dict[str, Any]], fields: list[str]) -> list[dict[str, Any]]:
    if not rows or not fields:
        return rows
    out: list[dict[str, Any]] = []
    field_set = [str(f) for f in fields]
    for row in rows:
        selected = {k: row.get(k) for k in field_set if k in row}
        if selected:
            out.append(selected)
        else:
            out.append(row)
    return out


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


def has_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(pattern, text) for pattern in patterns)


def top_by_numeric(
    rows: list[dict[str, Any]],
    label_keys: list[str],
    value_keys: list[str],
    limit: int = CHART_MAX_POINTS,
) -> list[dict[str, Any]]:
    ranked: list[tuple[str, float]] = []
    for idx, row in enumerate(rows, start=1):
        label = None
        for key in label_keys:
            candidate = row.get(key)
            if candidate is not None and str(candidate).strip():
                label = str(candidate).strip()
                break
        if not label:
            label = f"P{idx}"

        value = None
        for key in value_keys:
            parsed = numeric(row.get(key))
            if parsed is not None:
                value = parsed
                break
        if value is None:
            continue
        ranked.append((label, value))

    ranked.sort(key=lambda item: item[1], reverse=True)
    return [to_chart_point(label, value) for label, value in ranked[:limit]]


def top_categories(rows: list[dict[str, Any]], limit: int = CHART_MAX_POINTS) -> list[dict[str, Any]]:
    counter: Counter[str] = Counter()
    for row in rows:
        categories = str(row.get("categories", ""))
        for cat in [c.strip() for c in categories.split(",") if c.strip()]:
            counter[cat] += 1
    return [to_chart_point(k, v) for k, v in counter.most_common(limit)]


def grouped_average(
    rows: list[dict[str, Any]],
    group_key: str,
    value_key: str,
    limit: int = CHART_MAX_POINTS,
) -> list[dict[str, Any]]:
    agg: dict[str, list[float]] = {}
    for row in rows:
        label = str(row.get(group_key, "")).strip()
        value = numeric(row.get(value_key))
        if not label or value is None:
            continue
        agg.setdefault(label, []).append(value)

    avg_rows: list[tuple[str, float]] = []
    for label, values in agg.items():
        if values:
            avg_rows.append((label, sum(values) / len(values)))

    avg_rows.sort(key=lambda item: item[1], reverse=True)
    return [to_chart_point(label, value) for label, value in avg_rows[:limit]]


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


def count_checkin_events(checkin_rows: list[dict[str, Any]]) -> int:
    total = 0
    for row in checkin_rows:
        date_blob = str(row.get("date", "")).strip()
        if not date_blob:
            continue
        parts = [p.strip() for p in date_blob.split(",") if p.strip()]
        if parts:
            total += len(parts)
        else:
            total += 1
    return total


def estimate_negative_sentiment(review_rows: list[dict[str, Any]]) -> tuple[int, int]:
    negative_terms = {
        "bad",
        "worst",
        "awful",
        "terrible",
        "slow",
        "rude",
        "cold",
        "dirty",
        "disappointed",
        "poor",
    }
    negative = 0
    total = 0
    for row in review_rows:
        text = str(row.get("text", "")).lower()
        stars = numeric(row.get("stars"))
        if not text and stars is None:
            continue
        total += 1
        if stars is not None and stars <= 2:
            negative += 1
            continue
        if any(term in text for term in negative_terms):
            negative += 1
    return negative, total


def build_weather_impact_chart(
    review_rows: list[dict[str, Any]],
    checkin_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    total_checkins = count_checkin_events(checkin_rows)
    ratings = [numeric(r.get("stars")) for r in review_rows]
    valid_ratings = [r for r in ratings if r is not None]
    avg_rating = (sum(valid_ratings) / len(valid_ratings)) if valid_ratings else 0.0
    one_star_reviews = sum(1 for r in valid_ratings if r <= 1.5)
    negative_reviews, total_reviews = estimate_negative_sentiment(review_rows)
    sentiment_share = (negative_reviews / total_reviews * 100.0) if total_reviews else 0.0

    points = [
        to_chart_point("Check-in events", float(total_checkins)),
        to_chart_point("Average rating", round(avg_rating, 2)),
        to_chart_point("1-star reviews", float(one_star_reviews)),
        to_chart_point("Negative sentiment %", round(sentiment_share, 2)),
        to_chart_point("Reviews analyzed", float(total_reviews)),
    ]
    return points[:CHART_MAX_POINTS]


def build_weather_hypothesis_chart(
    review_rows: list[dict[str, Any]],
    checkin_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    one_star_by_year: Counter[str] = Counter()
    total_by_year: Counter[str] = Counter()
    for row in review_rows:
        year = year_from_text(row.get("date")) or "Unknown"
        stars = numeric(row.get("stars"))
        if stars is None:
            continue
        total_by_year[year] += 1
        if stars <= 1.5:
            one_star_by_year[year] += 1

    spike_candidates = []
    for year, count in one_star_by_year.items():
        total = total_by_year.get(year, 0)
        ratio = (count / total) if total else 0.0
        spike_candidates.append((year, count, ratio))

    spike_candidates.sort(key=lambda x: (x[1], x[2]), reverse=True)
    spike_candidates = spike_candidates[: max(3, min(8, CHART_MAX_POINTS - 2))]

    chart = []
    for year, count, ratio in spike_candidates:
        chart.append(to_chart_point(f"{year} 1-star spike", float(count)))
        chart.append(to_chart_point(f"{year} 1-star ratio %", round(ratio * 100.0, 2)))

    total_checkins = count_checkin_events(checkin_rows)
    checkin_rows_count = len(checkin_rows)
    avg_checkins_per_row = (total_checkins / checkin_rows_count) if checkin_rows_count else 0.0
    chart.append(to_chart_point("Avg check-ins per business", round(avg_checkins_per_row, 2)))
    chart.append(to_chart_point("Total check-in events", float(total_checkins)))
    return chart[:CHART_MAX_POINTS]


def build_chart_data(rows: list[dict[str, Any]], dataset: str, question: str) -> list[dict[str, Any]]:
    if not rows:
        return []

    q = (question or "").lower()

    if dataset == "comprehensive":
        business_rows = [
            row for row in rows if any(key in row for key in ("city", "state", "categories", "name"))
        ]
        user_rows = [
            row for row in rows if any(key in row for key in ("yelping_since", "fans", "average_stars"))
        ]
        review_rows = [
            row for row in rows if any(key in row for key in ("text", "useful", "funny", "cool", "date", "stars"))
        ]
        checkin_rows = [
            row
            for row in rows
            if "date" in row and isinstance(row.get("date"), str) and "," in str(row.get("date", ""))
        ]

        if has_any(q, [r"weather", r"climate", r"storm", r"rain", r"snow"]):
            if has_any(q, [r"hypothesis", r"extreme", r"spike", r"1-?star", r"one star"]):
                candidate = build_weather_hypothesis_chart(review_rows, checkin_rows)
                if candidate:
                    return candidate
            candidate = build_weather_impact_chart(review_rows, checkin_rows)
            if candidate:
                return candidate
        if has_any(q, [r"check-?in", r"checkins", r"hour", r"peak"]):
            candidate = build_chart_data(checkin_rows or review_rows, "checkin", question)
            if candidate:
                return candidate
        if has_any(q, [r"rating", r"ratings", r"star", r"distribution"]):
            candidate = build_chart_data(review_rows, "rating", question)
            if candidate:
                return candidate
        if has_any(q, [r"review", r"sentiment", r"negative", r"positive", r"year", r"trend"]):
            candidate = build_chart_data(review_rows, "review", question)
            if candidate:
                return candidate
        if has_any(q, [r"user", r"reviewer", r"fans", r"elite"]):
            candidate = build_chart_data(user_rows, "user", question)
            if candidate:
                return candidate
        if has_any(q, [r"city", r"cities", r"state", r"states", r"merchant", r"category", r"categories"]):
            candidate = build_chart_data(business_rows, "business", question)
            if candidate:
                return candidate

    if dataset == "business":
        if has_any(q, [r"\bcity\b", r"\bcities\b"]):
            return group_count(rows, lambda r: r.get("city"))
        if has_any(q, [r"\bstate\b", r"\bstates\b"]):
            return group_count(rows, lambda r: r.get("state"))
        if has_any(q, [r"\bmerchant\b", r"\bmerchants\b", r"\bcommon\b"]):
            if has_any(q, [r"average", r"avg", r"rating", r"star"]):
                return grouped_average(rows, "name", "stars")
            return group_count(rows, lambda r: r.get("name"))
        if has_any(q, [r"\bcategory\b", r"\bcategories\b", r"cuisine"]):
            return top_categories(rows)
        if has_any(q, [r"\btop\b", r"highest", r"most"]):
            return top_by_numeric(rows, ["name"], ["review_count", "stars"])

    if dataset == "user":
        if has_any(q, [r"\byear\b", r"joining", r"join", r"yelping"]):
            return group_count(rows, lambda r: year_from_text(r.get("yelping_since")))
        if has_any(q, [r"reviewer", r"reviewers", r"review_count", r"top"]):
            return top_by_numeric(rows, ["name", "user_id"], ["review_count"])
        if has_any(q, [r"fan", r"fans", r"popular"]):
            return top_by_numeric(rows, ["name", "user_id"], ["fans"])
        if has_any(q, [r"elite"]):
            return top_by_numeric(rows, ["name", "user_id"], ["review_count", "fans"])

    if dataset == "review":
        if has_any(q, [r"\byear\b", r"trend", r"per year", r"yearly"]):
            return group_count(rows, lambda r: year_from_text(r.get("date")))
        if has_any(q, [r"\buseful\b", r"\bfunny\b", r"\bcool\b"]):
            totals = {
                "useful": 0.0,
                "funny": 0.0,
                "cool": 0.0,
            }
            for row in rows:
                for key in totals:
                    totals[key] += numeric(row.get(key)) or 0.0
            return [to_chart_point(k, v) for k, v in totals.items()]
        if has_any(q, [r"word", r"bigram", r"negative", r"positive"]):
            word_counter: Counter[str] = Counter()
            for row in rows:
                text_value = str(row.get("text", "")).lower()
                for token in re.findall(r"[a-z]{3,}", text_value):
                    if token in {"the", "and", "for", "with", "this", "that", "was", "are", "you", "they"}:
                        continue
                    word_counter[token] += 1
            return [to_chart_point(k, v) for k, v in word_counter.most_common(CHART_MAX_POINTS)]

    if dataset == "checkin":
        if has_any(q, [r"hour", r"busiest", r"peak", r"24"]):
            counter: Counter[str] = Counter()
            for row in rows:
                text = str(row.get("date", ""))
                for match in re.findall(r"\b(\d{1,2}):(\d{2})\b", text):
                    hour = str(int(match[0])).zfill(2)
                    counter[hour] += 1
            return [to_chart_point(k, v) for k, v in sorted(counter.items())][:CHART_MAX_POINTS]
        if has_any(q, [r"\byear\b", r"trend"]):
            counter: Counter[str] = Counter()
            for row in rows:
                text = str(row.get("date", ""))
                for year in re.findall(r"\b(19\d{2}|20\d{2})\b", text):
                    counter[year] += 1
            return [to_chart_point(k, v) for k, v in sorted(counter.items())][:CHART_MAX_POINTS]
        if has_any(q, [r"city", r"popular"]):
            return group_count(rows, lambda r: r.get("city"))

    if dataset in {"tip", "rating"}:
        if has_any(q, [r"star", r"rating", r"distribution"]):
            counter: Counter[str] = Counter()
            for row in rows:
                s = numeric(row.get("stars"))
                if s is None:
                    continue
                bucket = int(max(1, min(5, round(s))))
                counter[f"{bucket} star"] += 1
            if counter:
                return [to_chart_point(k, v) for k, v in sorted(counter.items())][:CHART_MAX_POINTS]
        if has_any(q, [r"weekday", r"week", r"monday", r"sunday"]):
            weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            counter: Counter[str] = Counter({day: 0 for day in weekdays})
            for row in rows:
                date_str = str(row.get("date", ""))
                try:
                    dt = datetime.fromisoformat(date_str.replace("Z", ""))
                    counter[weekdays[dt.weekday()]] += 1
                except Exception:
                    continue
            return [to_chart_point(day, counter[day]) for day in weekdays]

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
    if STARTUP_SYNC:
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
    profile = detect_keyword_profile(question)
    if profile and profile.get("dataset"):
        dataset = normalize_dataset(str(profile.get("dataset"))) or dataset

    ensure_dataset_loaded(dataset)
    rows = retrieve_rows(question, dataset)

    search_terms = extract_query_terms(question)
    matched_rows = exact_match_rows(rows, search_terms)
    if matched_rows:
        rows = matched_rows

    if profile:
        rows = pick_fields(rows, [str(f) for f in profile.get("fields", [])])

    compact = compact_rows(rows)
    columns = list(compact[0].keys()) if compact else []
    summary = create_llm_summary(question, rows, dataset)

    notes = ["Backend connected.", "Answered using Python retrieval over Ubuntu dataset cache."]
    if profile:
        notes.append(f"Keyword profile: {profile.get('name', 'matched')}")
        explanation = str(profile.get("explanation", "")).strip()
        if explanation:
            notes.append(explanation)
    if matched_rows:
        notes.append(f"Exact keyword match rows: {len(matched_rows)}")
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
def analysis_chart(
    dataset: str = Query(...),
    question: str = Query(default=""),
    section: str = Query(default="dataAnalysis"),
) -> dict[str, Any]:
    normalized = normalize_dataset(dataset)
    if not normalized:
        raise HTTPException(
            status_code=400,
            detail="Invalid dataset. Use one of: business, user, checkin, review, tip, rating, comprehensive.",
        )

    source_datasets = dataset_candidates(normalized)
    rows: list[dict[str, Any]] = []
    source_paths: list[str] = []

    if section == "dataEnrichment":
        for base_path in HDFS_ENRICHMENT_BASE_PATHS:
            for d in source_datasets:
                source_paths.append(f"{base_path.rstrip('/')}/{d}")
                rows.extend(load_rows_from_base_path(base_path, d, ENRICHMENT_MAX_ROWS_PER_SOURCE))

        if not rows:
            ensure_dataset_loaded(normalized)
            for d in source_datasets:
                rows.extend(get_dataset_rows(d))
    else:
        ensure_dataset_loaded(normalized)
        for d in source_datasets:
            source_paths.append(f"{HDFS_BASE_PATH.rstrip('/')}/{d}")
            rows.extend(get_dataset_rows(d))

    chart_data = build_chart_data(rows, normalized, question)
    source_note = (
        "Data loaded by mixing Ubuntu paths /user/hanif/yelp and /user/hanif/yelp_external."
        if section == "dataEnrichment"
        else "Data loaded from Ubuntu via Python backend sync cache."
    )
    return {
        "dataset": normalized,
        "question": question,
        "section": section,
        "sourcePaths": source_paths,
        "chartData": chart_data,
        "points": len(chart_data),
        "notes": [
            source_note
            if chart_data
            else "No chart rows in cache yet. Run /api/sync and retry."
        ],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=API_PORT, reload=False)
