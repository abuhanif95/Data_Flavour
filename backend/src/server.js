import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import OpenAI from "openai";
import { z } from "zod";

dotenv.config();

const app = express();
const API_PORT = process.env.API_PORT || 8000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const DB_PATH = process.env.DB_PATH || "./yelp.db";

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
  if (!OPENAI_API_KEY) {
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

  const client = new OpenAI({ apiKey: OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4-turbo",
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
  console.log(`💚 Health check: http://localhost:${API_PORT}/api/health`);
  console.log("");
  console.log("ℹ️  Set OPENAI_API_KEY env var to enable AI SQL generation.");
  console.log("ℹ️  Set DB_PATH env var to use a custom database.");
  console.log("");
});
