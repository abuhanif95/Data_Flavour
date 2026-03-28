import { useState } from "react";

function Navbar({ isDarkMode, toggleTheme, currentPage, setCurrentPage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", page: "home", icon: "🏠" },
    { name: "Dashboard", page: "dashboard", icon: "📊" },
    { name: "Chatbot", page: "chatbot", icon: "💬" },
    { name: "About Us", page: "about", icon: "ℹ️" },
  ];

  const handleNavClick = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-colors ${
        isDarkMode
          ? "border-slate-900 bg-black"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-white`}
            >
              F
            </div>
            <h1
              className={`text-2xl font-bold tracking-tight hidden sm:inline ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Flavour<span className="text-cyan-500">AI</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => handleNavClick(item.page)}
                className={`px-4 py-2 rounded-lg transition-all font-medium text-sm ${
                  currentPage === item.page
                    ? isDarkMode
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-700"
                    : isDarkMode
                      ? "text-slate-300 hover:bg-blue-600 hover:text-white"
                      : "text-slate-600 hover:bg-blue-100 hover:text-blue-700"
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
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "bg-slate-900 text-yellow-400 hover:bg-blue-600"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
              title={isDarkMode ? "Light mode" : "Dark mode"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "bg-slate-900 text-slate-300 hover:bg-blue-600 hover:text-white"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
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
              isDarkMode ? "border-slate-900" : "border-slate-200"
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
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-700"
                      : isDarkMode
                        ? "text-slate-300 hover:bg-blue-600 hover:text-white"
                        : "text-slate-600 hover:bg-blue-100 hover:text-blue-700"
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
