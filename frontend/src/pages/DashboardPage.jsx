import React, { useState } from "react";

function DashboardPage({ isDarkMode }) {
  const [selectedModule, setSelectedModule] = useState(null);

  const analysisModules = {
    dataAnalysis: {
      title: "Data Analysis and Visualization",
      description: "Analyze and visualize Yelp data insights",
      icon: "📊",
      modules: [
        { id: 1, name: "User Analysis", icon: "👥" },
        { id: 2, name: "Business Analysis", icon: "📈" },
        { id: 3, name: "Rating Analysis", icon: "⭐" },
        { id: 4, name: "Review Analysis", icon: "💬" },
        { id: 5, name: "Check-in Analysis", icon: "📍" },
        { id: 6, name: "Comprehensive Analysis", icon: "📑" },
      ],
    },
    dataEnrichment: {
      title: "Data Enrichment and Exploration",
      description: "Explore and enrich your dataset with advanced queries",
      icon: "🔍",
      modules: [
        { id: 7, name: "Data Enrichment", icon: "✨" },
        { id: 8, name: "Advanced Queries", icon: "🔎" },
        { id: 9, name: "Data Integration", icon: "🔗" },
        { id: 10, name: "Custom Reports", icon: "📊" },
        { id: 11, name: "Export Tools", icon: "💾" },
        { id: 12, name: "API Explorer", icon: "🌐" },
      ],
    },
  };

  const ServiceCard = ({ service, type }) => (
    <div
      className={`rounded-lg overflow-hidden border transition-all duration-300 hover:shadow-xl ${
        isDarkMode
          ? "border-slate-700 bg-slate-900/50 hover:border-cyan-500"
          : "border-slate-200 bg-white hover:border-cyan-400"
      }`}
    >
      {/* Image/Icon Area */}
      <div
        className={`h-48 flex items-center justify-center text-8xl ${
          isDarkMode
            ? "bg-slate-800/50"
            : "bg-gradient-to-b from-slate-100 to-slate-50"
        }`}
      >
        {service.icon}
      </div>

      {/* Content Area */}
      <div className="p-8">
        <h3
          className={`text-2xl font-bold mb-3 ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          {service.title}
        </h3>
        <p
          className={`mb-6 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
        >
          {service.description}
        </p>
        <button
          onClick={() => setSelectedModule(type)}
          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
        >
          See Analysis →
        </button>
      </div>
    </div>
  );

  // Show module details view when a module is selected
  if (selectedModule) {
    const service =
      analysisModules[
        selectedModule === "dataAnalysis" ? "dataAnalysis" : "dataEnrichment"
      ];

    return (
      <div
        className={`min-h-screen transition-colors ${
          isDarkMode
            ? "bg-gradient-to-b from-black via-slate-950 to-black"
            : "bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => setSelectedModule(null)}
            className={`mb-8 px-4 py-2 rounded-lg border transition-all ${
              isDarkMode
                ? "border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white"
                : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-900"
            }`}
          >
            ← Back to Dashboard
          </button>

          {/* Header */}
          <section
            className={`rounded-lg p-8 mb-12 border transition-colors ${
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
              {service.title}
            </h1>
            <p
              className={`text-lg ${
                isDarkMode ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Select one module to open detailed task cards and charts.
            </p>
          </section>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.modules.map((module) => (
              <div
                key={module.id}
                className={`rounded-lg p-6 border transition-all duration-300 cursor-pointer hover:shadow-lg ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-900/50 hover:border-cyan-500 hover:bg-slate-900/80"
                    : "border-slate-200 bg-white hover:border-cyan-400 hover:bg-slate-50"
                }`}
              >
                <div className="text-4xl mb-3">{module.icon}</div>
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {module.name}
                </h3>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-cyan-400" : "text-cyan-600"
                  }`}
                >
                  Open details →
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show main dashboard view with two cards
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
          className={`rounded-lg p-8 mb-12 border transition-colors ${
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
            Choose a service to explore and analyze your data
          </p>
        </section>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ServiceCard
            service={analysisModules.dataAnalysis}
            type="dataAnalysis"
          />
          <ServiceCard
            service={analysisModules.dataEnrichment}
            type="dataEnrichment"
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
