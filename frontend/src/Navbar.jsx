import { useState } from "react";

function Navbar({ isDarkMode, toggleTheme, currentPage, setCurrentPage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", page: "home", icon: "🏠" },
    { name: "Dashboard", page: "dashboard", icon: "📊" },
    { name: "Chatbot", page: "chatbot", icon: "💬" },
  ];

  const rightNavItems = [
    { name: "Folder", page: "folder", icon: "📁" },
    { name: "Repo", page: "repo", icon: "📦" },
    { name: "About", page: "about", icon: "ℹ️" },
  ];

  const handleNavClick = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-colors ${
        isDarkMode
          ? "border-purple-900/50 bg-gradient-to-r from-slate-950 via-blue-950/40 to-purple-950/40"
          : "border-purple-200 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white`}
            >
              F
            </div>
            <h1
              className={`text-2xl font-bold tracking-tight hidden sm:inline ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Flavour<span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">AI</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => handleNavClick(item.page)}
                className={`px-4 py-2 rounded-lg transition-all font-medium text-sm ${
                  currentPage === item.page
                    ? isDarkMode
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-gradient-to-r from-blue-200 to-purple-200 text-blue-700"
                    : isDarkMode
                      ? "text-slate-200 hover:bg-gradient-to-r hover:from-blue-600/60 hover:to-purple-600/60 hover:text-white"
                      : "text-slate-700 hover:bg-gradient-to-r hover:from-blue-100/60 hover:to-purple-100/60 hover:text-purple-700"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Right Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {rightNavItems.map((item) => (
              <button
                key={item.page}
                onClick={() => handleNavClick(item.page)}
                className={`px-4 py-2 rounded-lg transition-all font-medium text-sm ${
                  currentPage === item.page
                    ? isDarkMode
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-gradient-to-r from-blue-200 to-purple-200 text-blue-700"
                    : isDarkMode
                      ? "text-slate-200 hover:bg-gradient-to-r hover:from-blue-600/60 hover:to-purple-600/60 hover:text-white"
                      : "text-slate-700 hover:bg-gradient-to-r hover:from-blue-100/60 hover:to-purple-100/60 hover:text-purple-700"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Right Side: Theme Toggle and Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${
                isDarkMode
                  ? "bg-slate-800/50 text-yellow-400 hover:bg-gradient-to-r hover:from-blue-600/60 hover:to-purple-600/60"
                  : "bg-slate-200 text-slate-600 hover:bg-gradient-to-r hover:from-blue-200/60 hover:to-purple-200/60"
              }`}
              title={isDarkMode ? "Light mode" : "Dark mode"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-all ${
                isDarkMode
                  ? "bg-slate-800/50 text-slate-300 hover:bg-gradient-to-r hover:from-blue-600/60 hover:to-purple-600/60 hover:text-white"
                  : "bg-slate-200 text-slate-600 hover:bg-gradient-to-r hover:from-blue-200/60 hover:to-purple-200/60"
              }`}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div
            className={`md:hidden border-t transition-colors ${
              isDarkMode ? "border-purple-900/50" : "border-purple-200"
            }`}
          >
            <div className="space-y-1 px-2 py-4">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all font-medium ${
                    currentPage === item.page
                      ? isDarkMode
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "bg-gradient-to-r from-blue-200 to-purple-200 text-blue-700"
                      : isDarkMode
                        ? "text-slate-300 hover:bg-gradient-to-r hover:from-blue-600/60 hover:to-purple-600/60 hover:text-white"
                        : "text-slate-700 hover:bg-gradient-to-r hover:from-blue-100/60 hover:to-purple-100/60 hover:text-purple-700"
                  }`}
                >
                  {item.name}
                </button>
              ))}
              {rightNavItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all font-medium ${
                    currentPage === item.page
                      ? isDarkMode
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "bg-gradient-to-r from-blue-200 to-purple-200 text-blue-700"
                      : isDarkMode
                        ? "text-slate-300 hover:bg-gradient-to-r hover:from-blue-600/60 hover:to-purple-600/60 hover:text-white"
                        : "text-slate-700 hover:bg-gradient-to-r hover:from-blue-100/60 hover:to-purple-100/60 hover:text-purple-700"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
