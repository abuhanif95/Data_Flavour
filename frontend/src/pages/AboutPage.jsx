import React from "react";

function AboutPage({ isDarkMode }) {
  return (
    <div
      className={`min-h-screen transition-colors ${
        isDarkMode
          ? "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50"
      }`}
    >
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="text-center mb-16">
          <h1
            className={`text-4xl md:text-5xl font-bold mb-4 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            About FlavourAI
          </h1>
          <p
            className={`text-xl ${
              isDarkMode ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Bridging the gap between natural language and SQL queries
          </p>
        </section>

        {/* Mission */}
        <section
          className={`rounded-lg p-8 mb-8 border transition-colors ${
            isDarkMode
              ? "border-slate-700 bg-slate-800/50"
              : "border-slate-200 bg-white"
          }`}
        >
          <h2
            className={`text-2xl font-bold mb-4 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Our Mission
          </h2>
          <p
            className={`text-lg leading-relaxed ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            FlavourAI democratizes data access by making SQL queries accessible
            to everyone, regardless of technical expertise. Using advanced AI
            and natural language processing, we transform casual questions into
            powerful database queries in milliseconds.
          </p>
        </section>

        {/* Technology */}
        <section
          className={`rounded-lg p-8 mb-8 border transition-colors ${
            isDarkMode
              ? "border-slate-700 bg-slate-800/50"
              : "border-slate-200 bg-white"
          }`}
        >
          <h2
            className={`text-2xl font-bold mb-6 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Technology Stack
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { category: "Frontend", tech: "React 19, Vite, Tailwind CSS v4" },
              {
                category: "Backend",
                tech: "Express.js, Node.js, better-sqlite3",
              },
              { category: "Database", tech: "SQLite with Yelp business data" },
              { category: "AI", tech: "OpenAI GPT-4 for query generation" },
            ].map((item, idx) => (
              <div
                key={idx}
                className={isDarkMode ? "text-slate-300" : "text-slate-700"}
              >
                <p className="font-semibold">{item.category}</p>
                <p className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
                  {item.tech}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section
          className={`rounded-lg p-8 mb-8 border transition-colors ${
            isDarkMode
              ? "border-slate-700 bg-slate-800/50"
              : "border-slate-200 bg-white"
          }`}
        >
          <h2
            className={`text-2xl font-bold mb-6 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Core Features
          </h2>
          <ul
            className={`space-y-3 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
          >
            <li>
              ✅ <strong>Natural Language Processing:</strong> Ask questions in
              plain English
            </li>
            <li>
              ✅ <strong>Intelligent Query Generation:</strong> AI-powered SQL
              conversion
            </li>
            <li>
              ✅ <strong>Real-time Results:</strong> Instant data retrieval and
              visualization
            </li>
            <li>
              ✅ <strong>Safety First:</strong> Automatic validation prevents
              harmful operations
            </li>
            <li>
              ✅ <strong>Dark & Light Modes:</strong> Comfortable for all
              lighting conditions
            </li>
            <li>
              ✅ <strong>Mobile Responsive:</strong> Works seamlessly on all
              devices
            </li>
            <li>
              ✅ <strong>Rich Data Visualization:</strong> Sortable tables with
              pagination
            </li>
            <li>
              ✅ <strong>Copy to Clipboard:</strong> Export queries and results
              with one click
            </li>
          </ul>
        </section>

        {/* About Developer */}
        <section
          className={`rounded-lg p-8 border transition-colors ${
            isDarkMode
              ? "border-slate-700 bg-slate-800/50"
              : "border-slate-200 bg-white"
          }`}
        >
          <h2
            className={`text-2xl font-bold mb-4 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Built With ❤️
          </h2>
          <p
            className={`text-lg leading-relaxed ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            FlavourAI is actively developed and maintained. We're constantly
            improving the platform based on user feedback. Follow us on GitHub
            for the latest updates and contributing opportunities.
          </p>
          <div className="mt-6">
            <a
              href="https://github.com/abuhanif95/Data_Flavour"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
            >
              View on GitHub →
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AboutPage;
