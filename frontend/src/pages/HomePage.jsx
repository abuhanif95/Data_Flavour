import React from "react";

function HomePage({ isDarkMode, setCurrentPage }) {
  return (
    <div
      className={`h-screen transition-colors ${
        isDarkMode
          ? "bg-gradient-to-b from-black via-slate-950 to-black"
          : "bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50"
      }`}
    >
      {/* Hero Section with 3D Animation */}
      <section
        className={`relative overflow-hidden transition-colors h-screen flex items-center ${
          isDarkMode ? "bg-black/50" : "bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <div className="max-w-2xl">
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
            </div>

            {/* Right Content - Growth Chart Image */}
            <div className="hidden lg:block">
              <img
                src={
                  isDarkMode ? "/growth-chart.svg" : "/growth-chart-light.svg"
                }
                alt="Growth chart"
                className="mx-auto w-full max-w-xl rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
