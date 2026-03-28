import React from "react";

function ChatbotPage({ isDarkMode }) {
  return (
    <div
      className={`min-h-screen transition-colors ${
        isDarkMode
          ? "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <section
          className={`rounded-lg p-8 mb-8 border transition-colors ${
            isDarkMode
              ? "border-slate-700 bg-slate-800/50"
              : "border-slate-200 bg-white"
          } shadow-lg`}
        >
          <h1
            className={`text-4xl font-bold mb-2 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Query Yelp with Natural Language
          </h1>
          <p
            className={`text-lg ${
              isDarkMode ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Ask anything about restaurants, reviews, users, and check-ins. Watch
            as AI converts your question to SQL instantly.
          </p>
        </section>

        {/* Chat Area Placeholder */}
        <div
          className={`rounded-lg border-2 border-dashed transition-colors ${
            isDarkMode
              ? "border-slate-600 bg-slate-800/30"
              : "border-slate-300 bg-slate-50"
          } p-12 text-center`}
        >
          <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
            Chat interface will be loaded here...
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;
