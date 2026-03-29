import React, { useState } from "react";

const SUGGESTED_QUESTIONS = [
  "Find restaurants with the highest average rating in Philadelphia",
  "How many reviews are in the dataset?",
  "List the top 5 most reviewed businesses",
  "Find all users with more than 100 reviews",
  "Show businesses with 5-star ratings",
  "Count restaurants by city",
];

function ChatbotPage({ isDarkMode }) {
  const [question, setQuestion] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (suggestedQuestion) => {
    setQuestion(suggestedQuestion);
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { bubbles: true }));
      }
    }, 0);
  };

  return (
    <div
      className={`flex flex-col h-screen transition-colors ${
        isDarkMode
          ? "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50"
      }`}
    >
      {/* Search Bar Section - Fixed at top */}
      <div
        className="border-b transition-colors px-4 py-4 sm:px-6 lg:px-8"
        style={{
          borderBottomColor: isDarkMode
            ? "rgb(71, 85, 105)"
            : "rgb(226, 232, 240)",
          backgroundColor: isDarkMode
            ? "rgb(30, 41, 59)"
            : "rgb(248, 250, 252)",
        }}
      >
        <div className="mx-auto max-w-4xl">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about restaurants, reviews, or users..."
                className={`flex-1 px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? "border-slate-600 bg-slate-700 text-white placeholder-slate-400"
                    : "border-slate-300 bg-white text-slate-900 placeholder-slate-500"
                }`}
              />
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  loading
                    ? isDarkMode
                      ? "bg-slate-600 text-slate-400"
                      : "bg-slate-300 text-slate-500"
                    : isDarkMode
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {loading ? "Loading..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Data Display Section - Shows only when results exist */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        {!results && !loading && (
          <div className="mx-auto max-w-4xl">
            <div
              className={`rounded-lg p-6 border transition-colors ${
                isDarkMode
                  ? "border-slate-700 bg-slate-800/50"
                  : "border-slate-200 bg-white"
              } shadow-lg`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Most Asked Questions
              </h3>
              <div className="space-y-2">
                {SUGGESTED_QUESTIONS.map((sq, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(sq)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors border ${
                      isDarkMode
                        ? "border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-600 hover:border-blue-500"
                        : "border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 hover:border-blue-400"
                    }`}
                  >
                    {sq}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {results && (
          <div className="mx-auto max-w-4xl">
            <div
              className={`rounded-lg p-6 border transition-colors ${
                isDarkMode
                  ? "border-slate-700 bg-slate-800/50"
                  : "border-slate-200 bg-white"
              } shadow-lg mb-6`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Summary
              </h2>
              <p className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                {results.summary}
              </p>
            </div>

            {results.rows && results.rows.length > 0 && (
              <div
                className={`rounded-lg p-6 border transition-colors ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-800/50"
                    : "border-slate-200 bg-white"
                } shadow-lg`}
              >
                <h2
                  className={`text-xl font-semibold mb-4 ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  Results ({results.rows.length} rows)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className={`border-b ${
                          isDarkMode
                            ? "border-slate-600 bg-slate-700"
                            : "border-slate-300 bg-slate-100"
                        }`}
                      >
                        {results.columns && results.columns.length > 0
                          ? results.columns.map((col, i) => (
                              <th
                                key={i}
                                className={`px-4 py-2 text-left font-semibold ${
                                  isDarkMode
                                    ? "text-slate-100"
                                    : "text-slate-900"
                                }`}
                              >
                                {col}
                              </th>
                            ))
                          : Object.keys(results.rows[0] || {}).map((key, i) => (
                              <th
                                key={i}
                                className={`px-4 py-2 text-left font-semibold ${
                                  isDarkMode
                                    ? "text-slate-100"
                                    : "text-slate-900"
                                }`}
                              >
                                {key}
                              </th>
                            ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.rows.map((row, i) => (
                        <tr
                          key={i}
                          className={`border-b ${
                            isDarkMode
                              ? "border-slate-700 hover:bg-slate-700/50"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {Object.values(row).map((val, j) => (
                            <td
                              key={j}
                              className={`px-4 py-2 ${
                                isDarkMode ? "text-slate-300" : "text-slate-700"
                              }`}
                            >
                              {String(val).substring(0, 50)}
                              {String(val).length > 50 ? "..." : ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatbotPage;
