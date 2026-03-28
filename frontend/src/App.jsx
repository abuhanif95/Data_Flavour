import { useMemo, useState } from "react";

function App() {
  const [input, setInput] = useState(
    "Show me the top 5 cities by number of restaurants.",
  );
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I am your AI Data Analyst. Ask me anything about the Yelp dataset.",
      sql: "",
      rows: [],
      columns: [],
      notes: ["Backend connected mode will appear once the API responds."],
    },
  ]);

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

    const userMessage = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: input.trim() }),
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
      setInput("");
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `I could not process that request: ${error.message}`,
          sql: "",
          rows: [],
          columns: [],
          notes: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink text-mist">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col">
        <header className="relative border-b border-white/10 bg-gradient-to-r from-midnight via-ink to-midnight px-6 py-4 md:px-10">
          <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.2),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.18),transparent_45%)]"></div>
          <div className="relative flex items-center justify-between">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Flavour Rating
            </h1>
            <nav className="hidden items-center gap-8 text-base text-slate-200 md:flex">
              <a className="transition hover:text-white" href="#">
                Home
              </a>
              <a className="transition hover:text-white" href="#">
                Dashboard
              </a>
              <a
                className="rounded-lg bg-cyan-400/20 px-4 py-2 text-cyan-300"
                href="#"
              >
                Chatbot
              </a>
              <a className="transition hover:text-white" href="#">
                About Us
              </a>
            </nav>
          </div>
        </header>

        <section className="flex items-center justify-between bg-midnight px-6 py-8 md:px-10">
          <div>
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
              Text-to-SQL Engine
            </h2>
            <p className="mt-1 text-slate-200">
              Transform natural English into database insights
            </p>
          </div>
          <div className="rounded-md border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300">
            {backendConnected ? "BACKEND CONNECTED" : "WAITING FOR BACKEND"}
          </div>
        </section>

        <main className="flex flex-1 flex-col justify-between bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 px-4 pb-8 pt-6 md:px-8">
          <div className="mx-auto w-full max-w-6xl space-y-5">
            {messages.map((message, index) => (
              <article
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                key={`${message.role}-${index}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl px-5 py-4 shadow-xl md:max-w-[78%] ${
                    message.role === "user"
                      ? "border border-cyan-600/40 bg-cyan-950 text-cyan-100"
                      : "border border-slate-700/40 bg-midnight text-white"
                  }`}
                >
                  <p className="text-lg leading-relaxed">{message.text}</p>

                  {message.sql && (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-600/70 bg-black/40 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">
                        Generated SQL
                      </p>
                      <pre className="text-sm text-emerald-200">
                        {message.sql}
                      </pre>
                    </div>
                  )}

                  {message.rows?.length > 0 && (
                    <div className="mt-4 overflow-auto rounded-xl border border-white/10 bg-white/5">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-white/10 text-cyan-200">
                          <tr>
                            {message.columns.map((column) => (
                              <th
                                className="px-3 py-2 font-semibold"
                                key={column}
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {message.rows.slice(0, 20).map((row, rowIndex) => (
                            <tr
                              className="border-t border-white/10"
                              key={rowIndex}
                            >
                              {message.columns.map((column) => (
                                <td
                                  className="px-3 py-2 text-slate-100"
                                  key={`${rowIndex}-${column}`}
                                >
                                  {row[column] ?? ""}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {message.notes?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.notes.map((note) => (
                        <span
                          className="rounded-md bg-white/10 px-2 py-1 text-xs text-slate-200"
                          key={note}
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
              <div className="flex justify-start">
                <div className="rounded-xl border border-slate-700/40 bg-midnight px-4 py-3 text-slate-200 shadow-xl">
                  Analyzing Yelp data and executing SQL...
                </div>
              </div>
            )}
          </div>

          <form
            className="mx-auto mt-8 w-full max-w-5xl"
            onSubmit={askQuestion}
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-midnight p-3 shadow-2xl">
              <input
                className="w-full bg-transparent px-3 py-3 text-lg text-slate-100 outline-none placeholder:text-slate-400"
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a question about Yelp (e.g. top cities by check-ins)"
                value={input}
              />
              <button
                className="rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-800"
                disabled={loading}
                type="submit"
              >
                Send
              </button>
            </div>
            <p className="mt-3 text-center text-sm text-slate-300">
              Powered by Large Language Models and your Yelp data execution
              layer.
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}

export default App;
