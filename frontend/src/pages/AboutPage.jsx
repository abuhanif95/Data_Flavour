import { FaGithub, FaLinkedinIn, FaFacebookF } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FaArrowRight } from "react-icons/fa6";
import abuHanifImage from "../assets/abu_hanif.jpg";
import shiruImage from "../assets/shiru.jpg";

const members = [
  {
    initials: "AH",
    name: "Abu Hanif",
    role: "Big Data Engineer & Full-Stack Dev",
    university: "Sichuan University",
    image: abuHanifImage,
    color: "blue",
    github: "https://github.com/abuhanif95",
    linkedin: "https://linkedin.com",
    facebook: "https://facebook.com",
    email: "mailto:abuhanif@gmail.com",
  },
  {
    initials: "SM",
    name: "Shirsha Mitra",
    role: "Data Analyst & Enrichment Specialist",
    university: "Sichuan University",
    image: shiruImage,
    color: "purple",
    github: "https://github.com/shirsha2002",
    linkedin: "https://linkedin.com",
    facebook: "https://facebook.com",
    email: "mailto:shirsha@gmail.com",
  },
];

const colorMap = {
  blue: {
    bar: "from-blue-600 to-cyan-400",
    ring: "from-blue-700 to-blue-400",
    avatar: "bg-blue-100 text-blue-700",
    badge: "bg-blue-100/90 text-blue-700",
    dot: "bg-blue-700",
    btn: "from-blue-600 to-cyan-500",
  },
  purple: {
    bar: "from-fuchsia-600 to-violet-500",
    ring: "from-purple-700 to-purple-400",
    avatar: "bg-purple-100 text-purple-700",
    badge: "bg-purple-100/90 text-purple-700",
    dot: "bg-purple-700",
    btn: "from-fuchsia-600 to-violet-500",
  },
};

export default function AboutSection({ isDarkMode }) {
  return (
    <section className="py-16 px-4 font-sans">
      {/* Header */}
      <div className="text-center mb-12">
        <p
          className={`text-xs font-medium tracking-[0.22em] uppercase mb-2 ${
            isDarkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Meet the team
        </p>
        <h2
          className={`text-3xl md:text-4xl font-semibold mb-3 ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          The <span className="text-cyan-500">Rapinha</span> Team
        </h2>
        <div className="w-20 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mx-auto" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 max-w-3xl mx-auto">
        {members.map((m) => {
          const c = colorMap[m.color];
          return (
            <div
              key={m.name}
              className={`group rounded-3xl overflow-hidden transition-all duration-300 relative hover:-translate-y-2 ${
                isDarkMode
                  ? "bg-slate-900/70 border border-white/10 shadow-[0_22px_60px_-24px_rgba(8,145,178,0.5)]"
                  : "bg-white/90 border border-slate-200/70 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)]"
              }`}
            >
              {/* Top accent glow */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${c.bar}`} />

              {/* Badge */}
              <span
                className={`absolute top-4 right-4 text-xs font-medium px-3 py-1 rounded-full backdrop-blur ${
                  isDarkMode ? "bg-white/10 text-slate-100" : c.badge
                }`}
              >
                Core Team
              </span>

              {/* Avatar */}
              <div
                className={`flex justify-center pt-8 pb-4 ${
                  isDarkMode ? "bg-white/5" : "bg-slate-50/80"
                }`}
              >
                <div
                  className={`p-0.5 rounded-full bg-gradient-to-br ${c.ring} shadow-lg`}
                >
                  {m.image ? (
                    <img
                      src={m.image}
                      alt={m.name}
                      className="w-24 h-24 rounded-full border-2 border-white/90 object-cover"
                    />
                  ) : (
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-medium border-2 border-white ${c.avatar}`}
                    >
                      {m.initials}
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="px-6 pb-6 pt-4 text-center">
                <p
                  className={`text-2xl font-semibold tracking-tight mb-2 ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {m.name}
                </p>
                <p
                  className={`text-sm mb-4 ${
                    isDarkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {m.role}
                </p>

                {/* University */}
                <div
                  className={`inline-flex items-center gap-2 text-xs rounded-full px-4 py-2 mb-6 border ${
                    isDarkMode
                      ? "text-slate-200 bg-white/5 border-white/10"
                      : "text-slate-600 bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                  {m.university}
                </div>

                <hr
                  className={`mb-5 ${
                    isDarkMode ? "border-white/10" : "border-slate-200"
                  }`}
                />

                {/* Social icons */}
                <div className="flex justify-center gap-2.5 mb-5">
                  {[
                    {
                      href: m.github,
                      icon: <FaGithub />,
                      hover: isDarkMode
                        ? "hover:border-slate-300 hover:text-white hover:bg-white/10"
                        : "hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800",
                    },
                    {
                      href: m.linkedin,
                      icon: <FaLinkedinIn />,
                      hover: isDarkMode
                        ? "hover:border-cyan-300 hover:text-cyan-300 hover:bg-cyan-400/10"
                        : "hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600",
                    },
                    {
                      href: m.facebook,
                      icon: <FaFacebookF />,
                      hover: isDarkMode
                        ? "hover:border-cyan-300 hover:text-cyan-300 hover:bg-cyan-400/10"
                        : "hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600",
                    },
                    {
                      href: m.email,
                      icon: <MdEmail />,
                      hover: isDarkMode
                        ? "hover:border-rose-300 hover:text-rose-300 hover:bg-rose-400/10"
                        : "hover:bg-red-50 hover:border-red-400 hover:text-red-500",
                    },
                  ].map(({ href, icon, hover }, i) => (
                    <a
                      key={i}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 hover:scale-110 ${hover} ${
                        isDarkMode
                          ? "text-slate-300 border-white/15 bg-white/5"
                          : "text-gray-400 border-gray-200 bg-gray-50"
                      }`}
                    >
                      <span className="text-sm">{icon}</span>
                    </a>
                  ))}
                </div>

                {/* CTA button */}
                <a
                  href="#"
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r ${c.btn} shadow-md hover:opacity-90`}
                >
                  View Profile <FaArrowRight className="text-xs" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
