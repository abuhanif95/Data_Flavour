import React from "react";
import AnimatedSphere from "../components/AnimatedSphere";

function HomePage({ isDarkMode, setCurrentPage }) {
  return (
    <div
      className={`min-h-screen transition-colors ${
        isDarkMode
          ? "bg-gradient-to-b from-black via-slate-950 to-black"
          : "bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50"
      }`}
    >
      {/* Hero Section with 3D Animation */}
      <section
        className={`relative overflow-hidden transition-colors ${
          isDarkMode ? "bg-black/50" : "bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="space-y-6">
                <div>
                  <p
                    className={`text-sm font-semibold uppercase tracking-widest mb-2 ${
                      isDarkMode ? "text-cyan-400" : "text-cyan-600"
                    }`}
                  >
                    Flavour Rating
                  </p>
                  <h1
                    className={`text-5xl md:text-6xl font-bold mb-6 leading-tight ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Discover Local{" "}
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      Taste
                    </span>
                    <br />
                    Through Data
                  </h1>
                </div>

                <p
                  className={`text-lg max-w-xl ${
                    isDarkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  A complete black-theme analytics experience for Yelp-style
                  insights. Explore business, user, review, rating, and check-in
                  intelligence in one place.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={() => setCurrentPage("chatbot")}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
                  >
                    Start Querying →
                  </button>
                  <button
                    onClick={() => setCurrentPage("dashboard")}
                    className={`px-8 py-4 font-semibold rounded-lg transition-all duration-300 border ${
                      isDarkMode
                        ? "border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
                        : "border-cyan-400 text-cyan-600 hover:bg-cyan-50"
                    }`}
                  >
                    View Dashboard
                  </button>
                </div>
              </div>

              {/* Key Features Grid */}
              <div className="mt-16 pt-8 border-t border-slate-700/50">
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { icon: "🤖", label: "AI-Powered" },
                    { icon: "⚡", label: "Instant" },
                    { icon: "🔒", label: "Secure" },
                  ].map((feature, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-3xl mb-2">{feature.icon}</div>
                      <p
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-slate-400" : "text-slate-600"
                        }`}
                      >
                        {feature.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Content - 3D Sphere */}
            <div className="hidden lg:block">
              <AnimatedSphere isDarkMode={isDarkMode} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className={`py-20 transition-colors ${
          isDarkMode
            ? "border-t border-slate-800 bg-black/30"
            : "border-t border-slate-200 bg-white/50"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            className={`text-3xl font-bold text-center mb-16 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Powerful Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "📊",
                title: "Advanced Analytics",
                description:
                  "Dive deep into restaurant metrics, user behavior, and review trends with powerful analytics",
              },
              {
                icon: "🎯",
                title: "Precise Insights",
                description:
                  "Get actionable insights through natural language queries converted to optimized SQL",
              },
              {
                icon: "🚀",
                title: "Lightning Fast",
                description:
                  "Results in milliseconds with intelligent caching and optimized database queries",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-xl border backdrop-blur transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 ${
                  isDarkMode
                    ? "border-slate-700/50 bg-slate-900/30 hover:border-cyan-500/30"
                    : "border-slate-200/50 bg-white/30 hover:border-cyan-400"
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
      </section>

      {/* Sample Queries Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            className={`text-3xl font-bold text-center mb-16 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Try These Queries
          </h2>
          <div className="space-y-3">
            {[
              "What are the top 10 highest-rated restaurants?",
              "Show me all Italian restaurants with more than 4 stars",
              "How many reviews does McDonald's have?",
              "List users who left reviews in the last 30 days",
            ].map((query, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentPage("chatbot")}
                className={`p-4 rounded-lg cursor-pointer border transition-all duration-200 hover:shadow-md group ${
                  isDarkMode
                    ? "border-slate-700/50 bg-slate-900/20 hover:bg-slate-900/40 hover:border-cyan-500/30"
                    : "border-slate-200 bg-slate-50 hover:bg-white hover:border-cyan-400"
                }`}
              >
                <p
                  className={`flex items-center gap-2 ${
                    isDarkMode ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                  {query}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`py-20 transition-colors ${
          isDarkMode
            ? "bg-gradient-to-r from-black via-blue-950/20 to-black border-t border-slate-800"
            : "bg-gradient-to-r from-slate-50 to-white border-t border-slate-200"
        }`}
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className={`text-3xl font-bold mb-4 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Ready to Explore Your Data?
          </h2>
          <p
            className={`text-lg mb-8 ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Ask questions in plain English and get instant insights from your
            Yelp data
          </p>
          <button
            onClick={() => setCurrentPage("chatbot")}
            className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
          >
            Launch Chatbot →
          </button>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
