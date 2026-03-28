import React from "react";

function HomePage({ isDarkMode, setCurrentPage }) {
  return (
    <div
      className={`min-h-screen transition-colors ${
        isDarkMode
          ? "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50"
      }`}
    >
      {/* Hero Section */}
      <section
        className={`relative overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-white"} transition-colors`}
      >
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1
              className={`text-5xl md:text-6xl font-bold mb-6 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              🍽️{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                FlavourAI
              </span>
            </h1>
            <p
              className={`text-xl md:text-2xl mb-8 ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Text-to-SQL Query Engine for Yelp Data
            </p>
            <p
              className={`text-lg max-w-2xl mx-auto mb-12 ${
                isDarkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Ask natural language questions about restaurants, reviews, and
              users. FlavourAI instantly converts your queries to SQL and
              fetches real data.
            </p>
            <button
              onClick={() => setCurrentPage("chatbot")}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
            >
              Start Querying →
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2
            className={`text-3xl font-bold text-center mb-16 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🤖",
                title: "AI-Powered",
                description:
                  "GPT-4 converts natural language to optimized SQL queries",
              },
              {
                icon: "⚡",
                title: "Instant Results",
                description:
                  "Get data in milliseconds with intelligent caching",
              },
              {
                icon: "🔒",
                title: "Safe & Secure",
                description: "Advanced validation blocks dangerous operations",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-lg border transition-all duration-300 hover:shadow-lg ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-800 hover:border-cyan-500"
                    : "border-slate-200 bg-white hover:border-cyan-400"
                }`}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {feature.title}
                </h3>
                <p className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Queries Section */}
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2
            className={`text-3xl font-bold text-center mb-16 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Try These Queries
          </h2>
          <div className="space-y-4">
            {[
              "What are the top 10 highest-rated restaurants?",
              "Show me all Italian restaurants with more than 4 stars",
              "How many reviews does McDonald's have?",
              "List users who left reviews in the last 30 days",
            ].map((query, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentPage("chatbot")}
                className={`p-4 rounded-lg cursor-pointer border transition-all duration-200 hover:shadow-md ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-800 hover:bg-slate-750 hover:border-cyan-500"
                    : "border-slate-200 bg-slate-50 hover:bg-white hover:border-cyan-400"
                }`}
              >
                <p
                  className={`${isDarkMode ? "text-slate-200" : "text-slate-700"}`}
                >
                  {query}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
