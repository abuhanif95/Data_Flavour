import { useMemo, useState, useRef, useEffect } from "react";

const SAMPLE_QUERIES = [
  "Show me the top 10 cities by number of restaurants",
  "What are the highest-rated businesses in New York?",
  "Count the number of reviews per year",
  "Find the most popular reviewers by fan count",
  "List businesses with over 500 reviews",
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 rounded px-2 py-1 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"
      title="Copy SQL to clipboard"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400"></div>
      <div
        className="h-2 w-2 animate-bounce rounded-full bg-cyan-400"
        style={{ animationDelay: "0.2s" }}
      ></div>
      <div
        className="h-2 w-2 animate-bounce rounded-full bg-cyan-400"
        style={{ animationDelay: "0.4s" }}
      ></div>
    </div>
  );
}

function DataTable({ columns, rows }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  if (!rows || rows.length === 0) return null;

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortCol) return 0;
    const aVal = a[sortCol] ?? "";
    const bVal = b[sortCol] ?? "";

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }

    const strA = String(aVal).toLowerCase();
    const strB = String(bVal).toLowerCase();
    return sortDir === "asc"
      ? strA.localeCompare(strB)
      : strB.localeCompare(strA);
  });

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-white/5">
      <div className="inline-block min-w-full">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-white/15 text-cyan-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  onClick={() => {
                    if (sortCol === column) {
                      setSortDir(sortDir === "asc" ? "desc" : "asc");
                    } else {
                      setSortCol(column);
                      setSortDir("asc");
                    }
                  }}
                  className="cursor-pointer select-none px-4 py-3 font-semibold transition hover:bg-white/20"
                >
                  {column}
                  {sortCol === column && (
                    <span className="ml-2">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedRows.slice(0, 50).map((row, idx) => (
              <tr key={idx} className="transition hover:bg-white/10">
                {columns.map((col) => (
                  <td
                    key={`${idx}-${col}`}
                    className="px-4 py-2 text-slate-100"
                  >
                    {typeof row[col] === "number"
                      ? Number.isInteger(row[col])
                        ? row[col]
                        : row[col].toFixed(2)
                      : (row[col] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {sortedRows.length > 50 && (
          <div className="border-t border-white/10 bg-white/5 px-4 py-2 text-center text-xs text-slate-300">
            Showing 50 of {sortedRows.length} results
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [input, setInput] = useState(
    "Show me the top 5 cities by number of restaurants.",
  );
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I am your AI Data Analyst. Ask me anything about the Yelp dataset. Try asking about cities, restaurants, reviews, or users!",
      sql: "",
      rows: [],
      columns: [],
      notes: ["Backend connected mode will appear once the API responds."],
    },
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const backendConnected = useMemo(
    () =>
      messages.some(
        (m) =>
          m.role === "assistant" && m.notes?.includes("Backend connected."),
      ),
    [messages],
  );

  async function askQuestion(event) {
    event.preventDefault();

    if (!input.trim() || loading) {
      return;
    }

    const question = input.trim();
    const userMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to query backend.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.summary,
          sql: data.sql,
          rows: data.rows,
          columns: data.columns,
          notes: data.notes || [],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `⚠️ Error: ${error.message || "Failed to process your request. Make sure the backend server is running on port 8000."}`,
          sql: "",
          rows: [],
          columns: [],
          notes: ["error"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestionClick(query) {
    setInput(query);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-sm px-4 py-3 md:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600"></div>
              <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                Flavour<span className="text-cyan-400">AI</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                backendConnected
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-amber-500/20 text-amber-300"
              }`}>
                {backendConnected ? "🟢 Connected" : "🟡 Connecting..."}
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="border-b border-white/5 bg-gradient-to-b from-slate-800 to-slate-900 px-4 py-8 md:px-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Query Yelp with Natural Language
            </h2>
            <p className="text-slate-300">
              Ask anything about restaurants, reviews, users, and check-ins. Watch as AI converts your question to SQL instantly.
            </p>
          </div>
        </section>

        {/* Main Chat Area */}
        <main className="flex flex-1 flex-col bg-gradient-to-b from-slate-800 via-slate-900 to-slate-900 px-4 py-6 md:px-8">
          <div className="mx-auto w-full max-w-4xl flex-1 space-y-4">
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-full rounded-2xl px-4 py-3 md:max-w-[85%] ${
                    message.role === "user"
                      ? "rounded-br-none border border-cyan-500/50 bg-gradient-to-br from-cyan-900/50 to-cyan-950/50 text-cyan-50 shadow-lg shadow-cyan-500/10"
                      : "rounded-bl-none border border-slate-600/50 bg-gradient-to-br from-slate-750/50 to-slate-800/50 text-slate-100 shadow-lg shadow-slate-950/50"
                  }`}
                >
                  <p className="leading-relaxed">{message.text}</p>

                  {message.sql && (
                    <div className="mt-3 space-y-2 rounded-lg border border-slate-600/50 bg-black/30 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                          Generated SQL
                        </p>
                        <CopyButton text={message.sql} />
                      </div>
                      <pre className="overflow-x-auto text-xs text-emerald-300 md:text-sm">
                        <code>{message.sql}</code>
                      </pre>
                    </div>
                  )}

                  {message.rows && message.rows.length > 0 && (
                    <div className="mt-3">
                      <DataTable
                        columns={message.columns}
                        rows={message.rows}
                      />
                    </div>
                  )}

                  {message.notes && message.notes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.notes.map((note) => (
                        <span
                          key={note}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            note === "error"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-slate-700/50 text-slate-300"
                          }`}
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}

            {loading && (
              <article className="flex justify-start animate-in fade-in duration-300">
                <div className="rounded-2xl rounded-bl-none border border-slate-600/50 bg-gradient-to-br from-slate-750/50 to-slate-800/50 px-4 py-3 text-slate-300">
                  <div className="flex items-center gap-2">
                    <LoadingSpinner />
                    <span>Analyzing your question...</span>
                  </div>
                </div>
              </article>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sample Queries */}
          {messages.length === 1 && !loading && (
            <div className="mx-auto w-full max-w-4xl">
              <div className="space-y-3">
                <p className="text-center text-sm text-slate-400">
                  Try asking about the Yelp dataset:
                </p>
                <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                  {SAMPLE_QUERIES.map((query) => (
                    <button
                      key={query}
                      onClick={() => handleSuggestionClick(query)}
                      className="rounded-full border border-slate-600/50 bg-slate-800/50 px-4 py-2 text-xs text-slate-300 transition hover:border-cyan-500/50 hover:bg-slate-700/50 hover:text-cyan-200 md:text-sm"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={askQuestion}
            className="mx-auto mt-8 w-full max-w-4xl"
          >
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 rounded-xl border border-slate-600/50 bg-slate-800/50 p-1 shadow-lg shadow-slate-950/50 backdrop-blur-sm transition focus-within:border-cyan-500/50">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me about restaurants, reviews, cities, or users..."
                  disabled={loading}
                  className="flex-1 bg-transparent px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="mr-1 flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-semibold text-white transition hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  ) : (
                    <>
                      <span>Send</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-center text-xs text-slate-400">
                Powered by AI-powered SQL generation and Yelp data
              </p>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default App;
