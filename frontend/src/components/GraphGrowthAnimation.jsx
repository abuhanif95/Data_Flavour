import React from "react";

function GraphGrowthAnimation({ isDarkMode }) {
  const bars = [42, 56, 74, 88, 112, 136];

  return (
    <div
      className={`relative mx-auto w-full max-w-xl rounded-2xl border p-6 shadow-2xl ${
        isDarkMode
          ? "border-cyan-500/20 bg-slate-900/40"
          : "border-cyan-300/60 bg-white/80"
      }`}
    >
      <div
        className={`mb-6 flex items-center justify-between border-b pb-3 ${
          isDarkMode ? "border-slate-700/60" : "border-slate-200"
        }`}
      >
        <h3
          className={`text-lg font-semibold ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Growth Analytics
        </h3>
        <span
          className={`text-xs font-medium ${
            isDarkMode ? "text-cyan-300" : "text-cyan-700"
          }`}
        >
          Live Trend
        </span>
      </div>

      <div className="relative h-64 overflow-hidden rounded-xl px-4 pb-4 pt-2">
        <div
          className={`absolute inset-0 rounded-xl ${
            isDarkMode
              ? "bg-gradient-to-b from-cyan-500/5 to-blue-500/5"
              : "bg-gradient-to-b from-cyan-100/60 to-blue-100/60"
          }`}
        ></div>

        <div className="absolute inset-0 px-4 pb-4 pt-2">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className={`h-1/4 border-b ${
                isDarkMode ? "border-slate-700/40" : "border-slate-300/70"
              }`}
            ></div>
          ))}
        </div>

        <div className="relative z-10 flex h-full items-end gap-3">
          {bars.map((bar, index) => (
            <div key={index} className="flex-1">
              <div
                className={`w-full rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400 shadow-lg ${
                  isDarkMode ? "shadow-cyan-500/30" : "shadow-cyan-500/20"
                }`}
                style={{
                  height: `${bar}px`,
                  animation: `growBar 1.1s ease-out ${index * 0.14}s both`,
                }}
              ></div>
            </div>
          ))}
        </div>

        <svg
          viewBox="0 0 320 180"
          className="pointer-events-none absolute inset-0 z-20 h-full w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="url(#lineStroke)"
            strokeWidth="3"
            points="20,150 70,126 120,112 170,96 220,74 270,52 305,34"
            style={{
              strokeDasharray: 420,
              strokeDashoffset: 420,
              animation: "drawLine 1.8s ease-out 0.2s forwards",
            }}
          />
          <circle
            cx="305"
            cy="34"
            r="5"
            fill="#22d3ee"
            style={{ animation: "pulseDot 1.6s ease-in-out 1.6s infinite" }}
          />
        </svg>
      </div>

      <style>{`
        @keyframes growBar {
          from {
            height: 0;
            opacity: 0.3;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes pulseDot {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}

export default GraphGrowthAnimation;
