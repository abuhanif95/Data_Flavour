import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import OpenAI from "openai";
import { z } from "zod";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";

dotenv.config();

const app = express();
const API_PORT = process.env.API_PORT || 8000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DB_PATH = process.env.DB_PATH || "./yelp.db";
const LLM_API_KEY = process.env.LLM_API_KEY || DEEPSEEK_API_KEY || OPENAI_API_KEY;
const LLM_BASE_URL = process.env.LLM_BASE_URL || "https://api.deepseek.com/v1";
const LLM_MODEL = process.env.LLM_MODEL || "deepseek-chat";
const HDFS_NAMENODE_URL =
  process.env.HDFS_NAMENODE_URL || "http://localhost:9870";
const HDFS_USER = process.env.HDFS_USER || "hanif";
const HDFS_BASE_PATH = process.env.HDFS_BASE_PATH || "/user/hanif/yelp";
const HDFS_CLI_ENABLED =
  String(process.env.HDFS_CLI_ENABLED || "true").toLowerCase() === "true";
const exec = promisify(execCb);

app.use(cors());
app.use(express.json());

// Initialize database with sample schema if not exists
let db;
try {
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Create minimal schema for demo
  db.exec(`
    CREATE TABLE IF NOT EXISTS businesses (
      business_id TEXT PRIMARY KEY,
      name TEXT,
      city TEXT,
      state TEXT,
      stars REAL,
      review_count INTEGER,
      is_open INTEGER,
      categories TEXT
    );
    CREATE TABLE IF NOT EXISTS reviews (
      review_id TEXT PRIMARY KEY,
      user_id TEXT,
      business_id TEXT,
      stars INTEGER,
      date TEXT,
      text TEXT,
      useful INTEGER
    );
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      name TEXT,
      review_count INTEGER,
      yelping_since TEXT,
      fans INTEGER,
      average_stars REAL
    );
    CREATE TABLE IF NOT EXISTS checkins (
      business_id TEXT,
      date TEXT
    );
  `);
  console.log("✓ Database initialized at:", DB_PATH);
} catch (error) {
  console.error("Database error:", error.message);
}

// Schema context for LLM
const YELP_SCHEMA = `
You have access to these Yelp tables:

1. businesses
   - business_id (string, PK)
   - name (string)
   - city (string)
   - state (string)
   - stars (real, 1-5)
   - review_count (integer)
   - is_open (integer, 0=closed, 1=open)
   - categories (text, comma-separated)

2. reviews
   - review_id (string, PK)
   - user_id (string, FK)
   - business_id (string, FK)
   - stars (integer, 1-5)
   - date (text, YYYY-MM-DD)
   - text (text)
   - useful (integer)

3. users
   - user_id (string, PK)
   - name (string)
   - review_count (integer)
   - yelping_since (text, YYYY-MM-DD)
   - fans (integer)
   - average_stars (real)

4. checkins
   - business_id (string)
   - date (text)

Return ONLY a valid SQLite SELECT query with no markdown or explanation.
`;

/**
 * Generate SQL from user question using OpenAI or return mock query for demo
 */
async function generateSQL(question) {
  if (!LLM_API_KEY) {
    // Mock SQL for demo when no API key is set
    if (
      question.toLowerCase().includes("top") &&
      question.toLowerCase().includes("cit")
    ) {
      return `
        SELECT city, COUNT(*) as business_count
        FROM businesses
        WHERE is_open = 1
        GROUP BY city
        ORDER BY business_count DESC
        LIMIT 10;
      `.trim();
    }
    if (question.toLowerCase().includes("restaurant")) {
      return `
        SELECT name, stars, review_count
        FROM businesses
        WHERE categories LIKE '%Restaurant%'
        AND is_open = 1
        ORDER BY stars DESC
        LIMIT 20;
      `.trim();
    }
    // Generic fallback
    return `SELECT * FROM businesses LIMIT 5;`;
  }

  const client = new OpenAI({
    apiKey: LLM_API_KEY,
    ...(LLM_BASE_URL ? { baseURL: LLM_BASE_URL } : {}),
  });
  const response = await client.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a SQL expert for Yelp datasets. ${YELP_SCHEMA}`,
      },
      {
        role: "user",
        content: question,
      },
    ],
    temperature: 0,
    max_tokens: 500,
  });

  const sql = response.choices[0].message.content.trim();
  return sql
    .replace(/```sql/g, "")
    .replace(/```/g, "")
    .trim();
}

/**
 * Validate and execute SQL with error recovery
 */
function executeSQLWithErrorRecovery(sql, attempt = 1) {
  try {
    const stmt = db.prepare(sql);
    const rows = stmt.all();
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { success: true, rows, columns, error: null };
  } catch (error) {
    console.error(`SQL execution error (attempt ${attempt}):`, error.message);
    if (attempt < 2) {
      // Fallback query
      const fallbackSQL = `
        SELECT 
          business_id, 
          name, 
          city, 
          stars, 
          review_count
        FROM businesses 
        LIMIT 10;
      `;
      return executeSQLWithErrorRecovery(fallbackSQL, attempt + 1);
    }
    return {
      success: false,
      rows: [],
      columns: [],
      error: error.message,
    };
  }
}

/**
 * Sanitize and validate SQL query for safety
 */
function validateSQL(sql) {
  // Blocklist dangerous operations
  const dangerous =
    /(\bDROP\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b|\bALTER\b|\bCREATE\b)/i;
  if (dangerous.test(sql)) {
    throw new Error(
      "Query contains restricted operations. Only SELECT queries are allowed.",
    );
  }
  // Basic sanity check
  if (!sql.toLowerCase().includes("select")) {
    throw new Error("Only SELECT queries are supported.");
  }
  return sql;
}

/**
 * Generate a summary of results
 */
function generateSummary(rows, columns, question) {
  if (rows.length === 0) {
    return "No results found for your query.";
  }
  if (rows.length === 1) {
    const row = rows[0];
    const facts = Object.entries(row)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    return `Found 1 result: ${facts}`;
  }
  const desc = `Found ${rows.length} results. `;
  const firstRow = rows[0];
  if ("count" in firstRow || "COUNT(*)" in firstRow) {
    const total = Object.values(firstRow)[0];
    return `${desc}The total count is ${total}.`;
  }
  return `${desc}Showing the first 20 rows in the table below.`;
}

function normalizeDataset(dataset) {
  const normalized = (dataset || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[-_]/g, "");

  const aliases = {
    business: "business",
    user: "user",
    checkin: "checkin",
    review: "review",
    rating: "rating",
    comprehensive: "comprehensive",
    comprehensiveanalysis: "comprehensive",
  };

  return aliases[normalized] || null;
}

function encodeHdfsPath(pathValue) {
  const trimmed = String(pathValue || "").replace(/^\/+/, "");
  const encoded = trimmed
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/${encoded}`;
}

function buildWebHdfsUrl(pathValue, op, extraParams = {}) {
  const params = new URLSearchParams({
    op,
    "user.name": HDFS_USER,
    ...extraParams,
  });
  return `${HDFS_NAMENODE_URL}/webhdfs/v1${encodeHdfsPath(pathValue)}?${params.toString()}`;
}

async function listHdfsStatus(pathValue) {
  const response = await fetch(buildWebHdfsUrl(pathValue, "LISTSTATUS"));
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `LISTSTATUS failed for ${pathValue}: ${response.status} ${body}`,
    );
  }
  const payload = await response.json();
  return payload?.FileStatuses?.FileStatus || [];
}

async function openHdfsFile(pathValue) {
  const response = await fetch(buildWebHdfsUrl(pathValue, "OPEN"));
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OPEN failed for ${pathValue}: ${response.status} ${body}`);
  }
  return response.text();
}

function parsePrimitiveNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return null;
  }
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDatasetText(rawText) {
  const text = String(rawText || "").trim();
  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && Array.isArray(parsed.rows)) {
      return parsed.rows;
    }
    if (parsed && Array.isArray(parsed.data)) {
      return parsed.data;
    }
  } catch {
    // Continue to line-based parsing.
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const jsonLineRows = [];
  let allJsonLines = true;
  for (const line of lines) {
    try {
      const parsedLine = JSON.parse(line);
      if (parsedLine && typeof parsedLine === "object") {
        jsonLineRows.push(parsedLine);
      }
    } catch {
      allJsonLines = false;
      break;
    }
  }

  if (allJsonLines && jsonLineRows.length) {
    return jsonLineRows;
  }

  if (lines[0].includes(",")) {
    const headers = lines[0].split(",").map((header) => header.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(",");
      const row = {};
      headers.forEach((header, index) => {
        row[header || `col_${index}`] = values[index]?.trim() ?? "";
      });
      return row;
    });
  }

  return lines.map((line, index) => ({
    label: `R${index + 1}`,
    value: parsePrimitiveNumber(line) ?? index + 1,
  }));
}

function detectLabel(row, idx) {
  const preferredKeys = [
    "date",
    "month",
    "year",
    "period",
    "city",
    "state",
    "name",
    "category",
    "label",
  ];

  for (const key of preferredKeys) {
    if (
      row[key] !== undefined &&
      row[key] !== null &&
      String(row[key]).trim()
    ) {
      return String(row[key]).trim();
    }
  }

  const firstStringKey = Object.keys(row).find((key) => {
    const value = row[key];
    return typeof value === "string" && value.trim();
  });

  if (firstStringKey) {
    return String(row[firstStringKey]).trim();
  }

  return `P${idx + 1}`;
}

function detectValue(row, fallback = 1) {
  const preferredKeys = [
    "value",
    "count",
    "total",
    "review_count",
    "checkin_count",
    "frequency",
    "stars",
    "rating",
    "avg_rating",
  ];

  for (const key of preferredKeys) {
    const parsed = parsePrimitiveNumber(row[key]);
    if (parsed !== null) {
      return parsed;
    }
  }

  for (const key of Object.keys(row)) {
    const parsed = parsePrimitiveNumber(row[key]);
    if (parsed !== null) {
      return parsed;
    }
  }

  return fallback;
}

function toChartData(rows) {
  if (!rows.length) {
    return [];
  }

  const points = rows.slice(0, 40).map((row, idx) => {
    const label = detectLabel(row, idx);
    const value = detectValue(row, idx + 1);
    return {
      label,
      value,
      secondary: Math.max(1, Math.round(value * 0.7)),
      z: Math.max(30, Math.round(value * 1.2)),
    };
  });

  return points;
}

async function loadDatasetRows(dataset) {
  const datasetPath = `${HDFS_BASE_PATH}/${dataset}`;
  try {
    const statuses = await listHdfsStatus(datasetPath);
    const files = statuses
      .filter((entry) => entry.type === "FILE")
      .filter((entry) =>
        /^(part-|.*\.(json|jsonl|csv|txt))/.test(entry.pathSuffix),
      )
      .slice(0, 8);

    if (!files.length) {
      return [];
    }

    let rows = [];
    for (const file of files) {
      const filePath = `${datasetPath}/${file.pathSuffix}`;
      const content = await openHdfsFile(filePath);
      rows = rows.concat(parseDatasetText(content));
    }

    return rows;
  } catch (webhdfsError) {
    if (!HDFS_CLI_ENABLED) {
      throw webhdfsError;
    }

    const escapedPath = datasetPath.replace(/"/g, '\\"');
    const listCommand = `hdfs dfs -ls "${escapedPath}"`;
    const { stdout } = await exec(listCommand, { timeout: 20000 });

    const files = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/\s+/).pop())
      .filter((filePath) => filePath && !filePath.endsWith("/"))
      .filter((filePath) => /^(.*\/)?(part-|.*\.(json|jsonl|csv|txt))/.test(filePath))
      .slice(0, 8);

    if (!files.length) {
      return [];
    }

    let rows = [];
    for (const filePath of files) {
      const catCommand = `hdfs dfs -cat "${filePath.replace(/"/g, '\\"')}"`;
      const { stdout: fileContent } = await exec(catCommand, { timeout: 30000 });
      rows = rows.concat(parseDatasetText(fileContent));
    }

    return rows;
  }
}

/**
 * Main chat endpoint: Natural language → SQL → Results
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { question } = z
      .object({
        question: z.string().min(1).max(500),
      })
      .parse(req.body);

    console.log("\n📝 User question:", question);

    // Step 1: Generate SQL using LLM
    console.log("🔄 Generating SQL...");
    const sql = await generateSQL(question);
    console.log("✓ Generated SQL:", sql);

    // Step 2: Validate SQL for safety
    console.log("🔐 Validating query...");
    const validatedSQL = validateSQL(sql);

    // Step 3: Execute SQL with error recovery
    console.log("⚙️  Executing query...");
    const { success, rows, columns, error } =
      executeSQLWithErrorRecovery(validatedSQL);

    if (!success) {
      return res.status(400).json({
        error: `SQL execution failed: ${error}`,
      });
    }

    // Step 4: Generate summary
    const summary = generateSummary(rows, columns, question);

    res.json({
      question,
      summary,
      sql: validatedSQL,
      rows,
      columns,
      notes: ["Backend connected."],
    });
  } catch (error) {
    console.error("❌ API error:", error.message);
    res.status(400).json({
      error:
        error.message || "An error occurred while processing your request.",
    });
  }
});

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/analysis/chart", async (req, res) => {
  try {
    const dataset = normalizeDataset(req.query.dataset);

    if (!dataset) {
      return res.status(400).json({
        error:
          "Invalid dataset. Use one of: business, user, checkin, review, rating, comprehensive.",
      });
    }

    const rows = await loadDatasetRows(dataset);
    const chartData = toChartData(rows);

    return res.json({
      dataset,
      sourcePath: `${HDFS_BASE_PATH}/${dataset}`,
      chartData,
      points: chartData.length,
      notes: chartData.length
        ? ["Data loaded from Ubuntu HDFS path."]
        : ["Dataset path reachable but no parseable rows found."],
    });
  } catch (error) {
    console.error("❌ Analysis data API error:", error.message);
    return res.status(500).json({
      error: error.message || "Failed to load analysis data from HDFS.",
    });
  }
});

/**
 * Start server
 */
app.listen(API_PORT, () => {
  console.log("");
  console.log("╔════════════════════════════════════════╗");
  console.log("║     Yelp Text-to-SQL API Server       ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`\n🚀 Server running on http://localhost:${API_PORT}`);
  console.log(`📊 API endpoint: http://localhost:${API_PORT}/api/chat`);
  console.log(
    `📈 Analysis endpoint: http://localhost:${API_PORT}/api/analysis/chart`,
  );
  console.log(`💚 Health check: http://localhost:${API_PORT}/api/health`);
  console.log("");
  console.log("ℹ️  Set LLM_API_KEY (or DEEPSEEK_API_KEY) to enable AI SQL generation.");
  console.log("ℹ️  Set DB_PATH env var to use a custom database.");
  console.log("");
});
