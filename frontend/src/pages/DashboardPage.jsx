import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

function DashboardPage({ isDarkMode }) {
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedAnalysisName, setSelectedAnalysisName] = useState(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedChartType, setSelectedChartType] = useState("bar");
  const [remoteChartData, setRemoteChartData] = useState([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState("");

  const analysisModules = {
    dataAnalysis: {
      title: "Data Analysis and Visualization",
      description: "Analyze and visualize Yelp data insights",
      imageDark: "/card-data-analysis.svg",
      imageLight: "/card-data-analysis-light.svg",
      hoverGlowDark: "hover:shadow-cyan-500/35",
      hoverGlowLight: "hover:shadow-cyan-300/70",
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
      imageDark: "/card-data-enrichment.svg",
      imageLight: "/card-data-enrichment-light.svg",
      hoverGlowDark: "hover:shadow-fuchsia-500/35",
      hoverGlowLight: "hover:shadow-purple-300/70",
      modules: [
        { id: 7, name: "The Weather-Mood Hypothesis", icon: "🌦️" },
        {
          id: 8,
          name: "The Cursed Storefronts and Multi-Dimensional Attribution",
          icon: "🏚️",
        },
        { id: 9, name: "The Review Manipulation Syndicate", icon: "🕵️" },
        { id: 10, name: "The Open-World Data Safari", icon: "🧭" },
      ],
    },
  };

  const moduleQuestions = {
    "User Analysis": [
      "Analyze the number of users joining each year.",
      "Identify top reviewers based on review_count.",
      "Identify the most popular users based on fans.",
      "Calculate the ratio of elite users to regular users each year.",
      "Display the proportion of total users and silent users (users who have not written reviews) each year.",
      "Compute the yearly statistics of new users, number of reviews, elite users, tips, and check-ins.",
      "Identify early adopters (tastemakers): users who frequently wrote one of the first 5 reviews for restaurants that eventually achieved a 4.5+ star average with over 100 reviews.",
      "Analyze user rating evolution: compare the average star rating users give during their first year on the platform versus their third year.",
      "Segment users by dining diversity: count the number of distinct cuisine categories each user has reviewed and rank the top 50 most adventurous eaters (minimum 20 reviews).",
      "Identify elite status impact: calculate the average review length (word count) and average useful votes received by users before they became Elite versus after they achieved Elite status.",
    ],
    "Business Analysis": [
      "Identify the 20 most common merchants in the U.S.",
      "Identify the top 10 cities with the most merchants in the U.S.",
      "Identify the top 5 states with the most merchants in the U.S.",
      "Identify the 20 most common merchants in the U.S. and display their average ratings.",
      "Count the number of different categories.",
      "Identify the top 10 most frequent categories and their count.",
      "Identify the top 20 merchants that received the most five-star reviews.",
      "Count the number of restaurant types (Chinese, American, Mexican).",
      "Count the number of reviews for each restaurant type (Chinese, American, Mexican).",
      "Analyze the rating distribution for different restaurant types (Chinese, American, Mexican).",
      "Identify turnaround merchants: find businesses whose average rating in the last 12 months increased by at least 1 star compared to their historical average.",
      "Analyze category synergy: identify the top 10 pairs of distinct business categories that most frequently co-occur in the same merchant profile.",
      "Identify polarizing businesses: find merchants with high review volume but the highest rating standard deviation (many 1-star and 5-star reviews, very few 3-star reviews).",
    ],
    "Rating Analysis": [
      "Analyze the distribution of ratings (1-5 stars).",
      "Analyze the weekly rating frequency (Monday to Sunday).",
      "Identify the top businesses with the most five-star ratings.",
      "Identify the top 10 cities with the highest ratings.",
      "Calculate rating differential: compare each merchant average rating against the overall average rating of its cuisine category within the same city.",
      "Compare weekend versus weekday satisfaction: calculate average rating on Saturday/Sunday versus weekdays for the Nightlife category.",
    ],
    "Review Analysis": [
      "Count the number of reviews per year.",
      "Count the number of useful, funny, and cool reviews.",
      "Rank users by the total number of reviews each year.",
      "Extract the top 20 most common words from all reviews.",
      "Extract the top 10 words from positive reviews (rating > 3).",
      "Extract the top 10 words from negative reviews (rating <= 3).",
      "Perform word cloud analysis by filtering words based on part-of-speech tagging.",
      "Construct a word association graph for term relationships.",
      "Extract the top 15 bigrams associated with 1-star and 2-star reviews to identify common pain points.",
      "Analyze correlation between review length and rating by calculating average word count for each star tier (1 to 5).",
      "Identify mixed-signal reviews: low-star reviews with predominantly positive keywords.",
      "Extract and rank the most frequently mentioned menu items for the top 5 most popular Chinese restaurants.",
    ],
    "Check-in Analysis": [
      "Count the number of check-ins per year.",
      "Count the number of check-ins per hour within a 24-hour period.",
      "Identify the most popular city for check-ins.",
      "Rank all businesses based on check-in counts.",
      "Calculate month-over-month check-in growth rate for the top 50 restaurants in a specific city.",
      "Analyze review seasonality by cuisine to identify peak months for reviews/check-ins in seasonal categories.",
    ],
    "Comprehensive Analysis": [
      "Identify the top 5 merchants in each city based on combined metrics of rating frequency, average rating, and check-in frequency.",
      "Calculate review conversion rate for top checked-in businesses: ratio of total check-ins to total reviews.",
      "Analyze post-review check-in drop-off after sudden weekly spikes in 1-star reviews.",
    ],
    "The Weather-Mood Hypothesis": [
      "Business hypothesis: test whether extreme weather causes spikes in 1-star reviews or changes check-in behavior for food categories.",
      "Analyze the impact of weather fluctuations on check-ins, ratings, and review sentiment.",
      "Output actionable recommendations for inventory management and staff scheduling based on weather forecasts.",
      "Internal data (Yelp): extract time-stamped reviews, ratings, review text, and daily check-ins for a specific city.",
      "External data: acquire historical daily weather data for the same city and year from NOAA, Kaggle, or local meteorological sources.",
    ],
    "The Cursed Storefronts and Multi-Dimensional Attribution": [
      "Business hypothesis: identify cursed storefronts that repeatedly fail and golden locations that consistently succeed.",
      "Track business lifecycle using geolocation and is_open history to detect repeated failure/survival patterns.",
      "Attribute diagnosis: compare features like parking, noise level, and service attributes across failing and successful addresses.",
      "Review autopsy: extract final 6 months of reviews before closure and identify high-frequency pain points with NLP.",
      "Cross-validate with external sources such as Street View, Walk Score API, Zillow/LoopNet, or municipal zoning maps.",
      "Deliver post-mortem diagnosis on why specific addresses fail or thrive.",
    ],
    "The Review Manipulation Syndicate": [
      "Business hypothesis: detect merchants suspected of buying coordinated fake 5-star reviews.",
      "Build a filtering mechanism using review timeline bursts, account credibility, geographic anomalies, and extreme rating ratios.",
      "Reverse-engineer network characteristics of suspicious review behavior.",
      "Assess long-term consequences of manipulation on merchant lifecycle and trust outcomes.",
      "Cross-validate with external evidence from Yelp, Google Reviews, BBB archives, or official consumer alert records.",
    ],
    "The Open-World Data Safari": [
      "Define a macro-level business hypothesis of your choice with social or economic significance.",
      "Design rigorous metrics and validate or debunk the hypothesis with Yelp data plus one authoritative public dataset.",
      "Internal data: extract required business, user, spatial, and temporal dimensions from Yelp.",
      "External data (mandatory): integrate at least one source such as Data.gov, US Census, city open data portals, or transit authority data.",
      "Deliver a personalized advanced data insight report.",
    ],
  };

  const chartTabs = ["bar", "line", "area", "pie", "scatter"];
  const pieColors = ["#2563eb", "#3b82f6", "#06b6d4", "#8b5cf6", "#14b8a6"];

  const moduleDatasetMap = {
    "User Analysis": "user",
    "Business Analysis": "business",
    "Rating Analysis": "rating",
    "Review Analysis": "review",
    "Check-in Analysis": "checkin",
    "Comprehensive Analysis": "comprehensive",
    "The Weather-Mood Hypothesis": "comprehensive",
    "The Cursed Storefronts and Multi-Dimensional Attribution": "comprehensive",
    "The Review Manipulation Syndicate": "comprehensive",
    "The Open-World Data Safari": "comprehensive",
  };

  const selectedService = selectedModule
    ? analysisModules[
        selectedModule === "dataAnalysis" ? "dataAnalysis" : "dataEnrichment"
      ]
    : null;

  const activeModule =
    selectedService && selectedAnalysisName
      ? selectedService.modules.find((m) => m.name === selectedAnalysisName)
      : null;

  const activeQuestions = activeModule
    ? moduleQuestions[activeModule.name] || []
    : [];

  const safeQuestionIndex =
    selectedQuestionIndex >= 0 && selectedQuestionIndex < activeQuestions.length
      ? selectedQuestionIndex
      : -1;
  const selectedQuestion =
    safeQuestionIndex >= 0 ? activeQuestions[safeQuestionIndex] : "";

  const selectedDataset = activeModule
    ? moduleDatasetMap[activeModule.name] || "comprehensive"
    : "comprehensive";

  const fallbackChartData = useMemo(() => {
    const seed =
      selectedQuestion
        .split("")
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1234;

    return Array.from({ length: 12 }).map((_, index) => {
      const month = index + 1;
      const value =
        80 +
        Math.floor(
          (Math.sin((seed % 31) * 0.11 + month * 0.55) + 1) * 85 +
            ((seed + month * 17) % 35),
        );

      return {
        label: `M${month}`,
        value,
        secondary: Math.max(
          15,
          Math.floor(value * (0.55 + ((seed + month) % 25) / 100)),
        ),
        z: 40 + ((seed + month * 13) % 160),
      };
    });
  }, [selectedQuestion]);

  useEffect(() => {
    if (!selectedQuestion) {
      setRemoteChartData([]);
      setChartError("");
      setIsChartLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchChartData() {
      try {
        setIsChartLoading(true);
        setChartError("");

        const response = await fetch(
          `/api/analysis/chart?dataset=${encodeURIComponent(selectedDataset)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Unable to fetch chart data.");
        }

        const payload = await response.json();
        const points = Array.isArray(payload.chartData)
          ? payload.chartData
          : [];

        setRemoteChartData(points);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }
        setRemoteChartData([]);
        setChartError(error.message || "Failed to load chart data.");
      } finally {
        if (!controller.signal.aborted) {
          setIsChartLoading(false);
        }
      }
    }

    fetchChartData();

    return () => controller.abort();
  }, [selectedDataset, selectedQuestion]);

  const chartData = remoteChartData.length
    ? remoteChartData
    : fallbackChartData;

  const pieData = useMemo(
    () =>
      chartData.slice(0, 5).map((item, idx) => ({
        name: `Segment ${idx + 1}`,
        value: item.value,
      })),
    [chartData],
  );

  const ServiceCard = ({ service, type }) => (
    <div
      className={`group rounded-lg overflow-hidden border transform-gpu transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
        isDarkMode
          ? `border-slate-700 bg-slate-900/50 hover:border-cyan-500 ${service.hoverGlowDark}`
          : `border-slate-200 bg-white hover:border-cyan-400 ${service.hoverGlowLight}`
      }`}
    >
      {/* Image Area */}
      <div
        className={`h-52 flex items-center justify-center p-6 ${
          isDarkMode
            ? "bg-slate-800/50"
            : "bg-gradient-to-b from-slate-100 to-slate-50"
        }`}
      >
        <img
          src={isDarkMode ? service.imageDark : service.imageLight}
          alt={service.title}
          className="h-full w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
        />
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
          onClick={() => {
            setSelectedModule(type);
            setSelectedAnalysisName(analysisModules[type].modules[0].name);
            setSelectedQuestionIndex(0);
            setSelectedChartType("bar");
          }}
          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
        >
          See Analysis →
        </button>
      </div>
    </div>
  );

  // Show module details view when a module is selected
  if (selectedModule) {
    const service = selectedService;

    return (
      <div
        className={`min-h-screen transition-colors ${
          isDarkMode
            ? "bg-gradient-to-b from-black via-slate-950 to-black"
            : "bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50"
        }`}
      >
        <div className="mx-auto w-full max-w-[1700px] px-2 py-4 sm:px-4 lg:px-6">
          {/* Two Div Layout: Left Sidebar + Right Questions */}
          <div
            className={`flex flex-nowrap overflow-hidden rounded-xl border ${
              isDarkMode
                ? "border-slate-700 bg-slate-950/70"
                : "border-slate-200 bg-white"
            }`}
          >
            {/* Left Div: All Analysis Sidebar */}
            <div
              className={`w-[360px] shrink-0 p-4 ${
                isDarkMode
                  ? "border-r border-slate-700 bg-gradient-to-b from-slate-900/90 to-slate-950/90"
                  : "border-r border-slate-200 bg-slate-50"
              }`}
            >
              <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                {service.modules.map((module) => {
                  const isActive = module.name === selectedAnalysisName;
                  return (
                    <button
                      key={module.id}
                      onClick={() => {
                        setSelectedAnalysisName(module.name);
                        setSelectedQuestionIndex(0);
                        setSelectedChartType("bar");
                      }}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transform-gpu transition-all duration-300 hover:-translate-y-0.5 ${
                        isActive
                          ? isDarkMode
                            ? "bg-blue-600/20 text-white border border-blue-500/40"
                            : "bg-blue-100 text-blue-700 border border-blue-300"
                          : isDarkMode
                            ? "text-slate-300 hover:bg-slate-800 hover:shadow-md hover:shadow-cyan-500/15"
                            : "text-slate-700 hover:bg-slate-100 hover:shadow-md hover:shadow-blue-300/50"
                      }`}
                    >
                      <span className="text-2xl">{module.icon}</span>
                      <span className="font-medium">{module.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setSelectedModule(null)}
                  className={`w-full rounded-lg border px-4 py-2 text-left transition-all ${
                    isDarkMode
                      ? "border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>

            {/* Right Div: All Questions */}
            <div className="min-w-0 flex-1 p-2 sm:p-3">
              <div
                className={`h-[82vh] min-h-[560px] space-y-3 overflow-y-auto rounded-lg border p-3 ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-900/70"
                    : "border-slate-200 bg-white"
                }`}
              >
                {activeQuestions.map((question, index) => {
                  const isExpanded = index === safeQuestionIndex;

                  return (
                    <div
                      key={question}
                      className={`overflow-hidden rounded-lg border transition-all ${
                        isExpanded
                          ? isDarkMode
                            ? "border-blue-500/50 bg-slate-900"
                            : "border-blue-300 bg-slate-50"
                          : isDarkMode
                            ? "border-slate-700 bg-slate-900/60"
                            : "border-slate-200 bg-white"
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedQuestionIndex((prev) =>
                            prev === index ? -1 : index,
                          );
                          if (selectedQuestionIndex !== index) {
                            setSelectedChartType("bar");
                          }
                        }}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors ${
                          isDarkMode
                            ? "hover:bg-slate-800/60"
                            : "hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                              isDarkMode
                                ? "bg-blue-600/20 text-blue-300"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {activeModule?.icon || "📊"}
                          </span>
                          <p
                            className={`truncate text-lg font-semibold ${
                              isDarkMode ? "text-slate-100" : "text-slate-900"
                            }`}
                          >
                            {`${index + 1}. ${question}`}
                          </p>
                        </div>

                        <span
                          className={`text-2xl leading-none ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                          aria-hidden
                        >
                          {isExpanded ? "^" : "v"}
                        </span>
                      </button>

                      {isExpanded && (
                        <div
                          className={`border-t px-4 pb-4 pt-3 ${
                            isDarkMode ? "border-slate-700" : "border-slate-200"
                          }`}
                        >
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            {isChartLoading && (
                              <span
                                className={`rounded-md px-2 py-1 text-xs font-medium ${
                                  isDarkMode
                                    ? "bg-cyan-500/20 text-cyan-300"
                                    : "bg-cyan-100 text-cyan-700"
                                }`}
                              >
                                Loading data from Ubuntu...
                              </span>
                            )}
                            {chartError && (
                              <span
                                className={`rounded-md px-2 py-1 text-xs font-medium ${
                                  isDarkMode
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {`${chartError} (showing fallback preview data)`}
                              </span>
                            )}
                          </div>

                          <div className="mb-3 flex flex-wrap gap-2">
                            {chartTabs.map((tab) => {
                              const isActiveTab = selectedChartType === tab;
                              return (
                                <button
                                  key={tab}
                                  onClick={() => setSelectedChartType(tab)}
                                  className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all ${
                                    isActiveTab
                                      ? "bg-blue-600 text-white"
                                      : isDarkMode
                                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  }`}
                                >
                                  {tab}
                                </button>
                              );
                            })}
                          </div>

                          <div
                            className={`h-[460px] rounded-lg p-3 ${
                              isDarkMode ? "bg-slate-800/90" : "bg-slate-50"
                            }`}
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              {selectedChartType === "bar" ? (
                                <BarChart data={chartData}>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={isDarkMode ? "#334155" : "#cbd5e1"}
                                  />
                                  <XAxis
                                    dataKey="label"
                                    stroke={isDarkMode ? "#cbd5e1" : "#475569"}
                                  />
                                  <YAxis
                                    stroke={isDarkMode ? "#cbd5e1" : "#475569"}
                                  />
                                  <Tooltip />
                                  <Bar
                                    dataKey="value"
                                    fill="#3b82f6"
                                    radius={[6, 6, 0, 0]}
                                  />
                                </BarChart>
                              ) : selectedChartType === "line" ? (
                                <LineChart data={chartData}>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={isDarkMode ? "#334155" : "#cbd5e1"}
                                  />
                                  <XAxis
                                    dataKey="label"
                                    stroke={isDarkMode ? "#cbd5e1" : "#475569"}
                                  />
                                  <YAxis
                                    stroke={isDarkMode ? "#cbd5e1" : "#475569"}
                                  />
                                  <Tooltip />
                                  <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#06b6d4"
                                    strokeWidth={3}
                                    dot={false}
                                  />
                                </LineChart>
                              ) : selectedChartType === "area" ? (
                                <AreaChart data={chartData}>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={isDarkMode ? "#334155" : "#cbd5e1"}
                                  />
                                  <XAxis
                                    dataKey="label"
                                    stroke={isDarkMode ? "#cbd5e1" : "#475569"}
                                  />
                                  <YAxis
                                    stroke={isDarkMode ? "#cbd5e1" : "#475569"}
                                  />
                                  <Tooltip />
                                  <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#2563eb"
                                    fill="#60a5fa"
                                    fillOpacity={0.5}
                                  />
                                </AreaChart>
                              ) : selectedChartType === "pie" ? (
                                <PieChart>
                                  <Tooltip />
                                  <Legend />
                                  <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={130}
                                    label
                                  >
                                    {pieData.map((entry, idx) => (
                                      <Cell
                                        key={entry.name}
                                        fill={pieColors[idx % pieColors.length]}
                                      />
                                    ))}
                                  </Pie>
                                </PieChart>
                              ) : (
                                <ScatterChart>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={isDarkMode ? "#334155" : "#cbd5e1"}
                                  />
                                  <XAxis
                                    dataKey="value"
                                    name="Value"
                                    stroke={isDarkMode ? "#cbd5e1" : "#475569"}
                                  />
                                  <YAxis
                                    dataKey="secondary"
                                    name="Secondary"
                                    stroke={isDarkMode ? "#cbd5e1" : "#475569"}
                                  />
                                  <ZAxis dataKey="z" range={[40, 260]} />
                                  <Tooltip
                                    cursor={{ strokeDasharray: "3 3" }}
                                  />
                                  <Scatter data={chartData} fill="#8b5cf6" />
                                </ScatterChart>
                              )}
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
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
