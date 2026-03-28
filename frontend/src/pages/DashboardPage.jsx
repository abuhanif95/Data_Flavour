import React from "react";

function DashboardPage({ isDarkMode }) {
  return (
    <div
      className={`min-h-screen transition-colors ${
        isDarkMode
          ? "bg-gradient-to-b from-black via-slate-950 to-black"
          : "bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <section
          className={`rounded-lg p-8 mb-8 border transition-colors ${
            isDarkMode
              ? "border-slate-800 bg-black/50"
              : "border-slate-200 bg-white"
          } shadow-lg`}
        >
          <h1
            className={`text-4xl font-bold mb-2 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Analytics Dashboard
          </h1>
          <p
            className={`text-lg ${
              isDarkMode ? "text-slate-300" : "text-slate-600"
            }`}
          >
            View insights and statistics from the Yelp dataset
          </p>
        </section>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Businesses", value: "150K+", icon: "🏢" },
            { label: "Total Reviews", value: "1.2M", icon: "⭐" },
            { label: "Active Users", value: "25K+", icon: "👥" },
            { label: "Check-ins", value: "500K+", icon: "📍" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-6 border transition-all duration-300 ${
                isDarkMode
                  ? "border-slate-800 bg-black/50 hover:border-cyan-500"
                  : "border-slate-200 bg-white hover:border-cyan-400"
              } shadow-md hover:shadow-lg text-center`}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {stat.label}
              </p>
              <p
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-cyan-400" : "text-cyan-600"
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Analytics Sections */}
        <div className="space-y-8">
          {/* Top Restaurants */}
          <section
            className={`rounded-lg p-8 border transition-colors ${
              isDarkMode
                ? "border-slate-700 bg-slate-800/50"
                : "border-slate-200 bg-white"
            } shadow-md`}
          >
            <h2
              className={`text-2xl font-bold mb-6 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Top Rated Restaurants
            </h2>
            <div className="space-y-3">
              {[
                { name: "Joe's Pizza", rating: 4.8, reviews: 324 },
                { name: "The Steakhouse", rating: 4.7, reviews: 512 },
                { name: "Sushi Paradise", rating: 4.6, reviews: 278 },
                { name: "Mediterranean Bistro", rating: 4.5, reviews: 401 },
              ].map((restaurant, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg flex justify-between items-center border ${
                    isDarkMode
                      ? "border-slate-800 bg-slate-950/50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div>
                    <p
                      className={`font-semibold ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {restaurant.name}
                    </p>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {restaurant.reviews} reviews
                    </p>
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      isDarkMode ? "text-cyan-400" : "text-cyan-600"
                    }`}
                  >
                    ⭐ {restaurant.rating}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Category Distribution */}
          <section
            className={`rounded-lg p-8 border transition-colors ${
              isDarkMode
                ? "border-slate-700 bg-slate-800/50"
                : "border-slate-200 bg-white"
            } shadow-md`}
          >
            <h2
              className={`text-2xl font-bold mb-6 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Restaurant Categories
            </h2>
            <div className="space-y-4">
              {[
                { category: "Italian", count: 850, percentage: 28 },
                { category: "Chinese", count: 720, percentage: 24 },
                { category: "Mexican", count: 650, percentage: 22 },
                { category: "Japanese", count: 480, percentage: 16 },
                { category: "Others", count: 300, percentage: 10 },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <p
                      className={
                        isDarkMode ? "text-slate-300" : "text-slate-700"
                      }
                    >
                      {item.category}
                    </p>
                    <p
                      className={`font-semibold ${
                        isDarkMode ? "text-cyan-400" : "text-cyan-600"
                      }`}
                    >
                      {item.count} ({item.percentage}%)
                    </p>
                  </div>
                  <div
                    className={`w-full h-2 rounded-full overflow-hidden ${
                      isDarkMode ? "bg-slate-800" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-600"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Stats */}
          <section
            className={`rounded-lg p-8 border transition-colors ${
              isDarkMode
                ? "border-slate-700 bg-slate-800/50"
                : "border-slate-200 bg-white"
            } shadow-md`}
          >
            <h2
              className={`text-2xl font-bold mb-6 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Quick Insights
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Average rating across all restaurants: 4.2 ⭐",
                "Most reviewed restaurant has 2,480 reviews 📝",
                "Latest review was 2 hours ago 🕐",
                "New restaurants added this month: 42 🆕",
              ].map((insight, idx) => (
                <p
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    isDarkMode
                      ? "border-slate-800 bg-slate-950/30 text-slate-300"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {insight}
                </p>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
