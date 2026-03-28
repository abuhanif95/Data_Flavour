import { FaGithub, FaLinkedinIn, FaFacebookF } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FaArrowRight } from "react-icons/fa6";

const members = [
  {
    initials: "AH",
    name: "Abu Hanif",
    role: "Big Data Engineer & Full-Stack Dev",
    university: "Sichuan University",
    modules: ["Business Analysis", "Review NLP", "Text-to-SQL"],
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
    modules: ["User Analysis", "Rating Analysis", "Check-in", "Data Enrichment"],
    color: "purple",
    github: "https://github.com/abuhanif95/BigData-Yelp_Analysis",
    linkedin: "https://linkedin.com",
    facebook: "https://facebook.com",
    email: "mailto:shirsha@gmail.com",
  },
];

const colorMap = {
  blue:   { bar: "bg-blue-700", ring: "from-blue-700 to-blue-400", avatar: "bg-blue-100 text-blue-700", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-700", btn: "text-blue-700 border-blue-700 bg-blue-50" },
  purple: { bar: "bg-purple-700", ring: "from-purple-700 to-purple-400", avatar: "bg-purple-100 text-purple-700", badge: "bg-purple-100 text-purple-700", dot: "bg-purple-700", btn: "text-purple-700 border-purple-700 bg-purple-50" },
};

export default function AboutSection() {
  return (
    <section className="py-16 px-4 font-sans">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">Meet the team</p >
        <h2 className="text-3xl font-medium text-gray-900 mb-3">
          The <span className="text-blue-600">Rapinha</span> Team
        </h2>
        <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {members.map((m) => {
          const c = colorMap[m.color];
          return (
            <div
              key={m.name}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:-translate-y-1.5 transition-transform duration-300 relative"
            >
              {/* Top accent bar */}
              <div className={`h-1 w-full ${c.bar}`} />

              {/* Badge */}
              <span className={`absolute top-4 right-4 text-xs font-medium px-3 py-1 rounded-full ${c.badge}`}>
                Developer
              </span>

              {/* Avatar */}
              <div className="flex justify-center pt-6 pb-3 bg-gray-50">
                <div className={`p-0.5 rounded-full bg-gradient-to-br ${c.ring}`}>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-medium border-2 border-white ${c.avatar}`}>
                    {m.initials}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 pb-5 pt-3 text-center">
                <p className="text-base font-medium text-gray-900 mb-1">{m.name}</p >
                <p className="text-sm text-gray-500 mb-3">{m.role}</p >

                {/* University */}
                <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 mb-4">
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                  {m.university}
                </div>

                {/* Modules */}
                <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                  {m.modules.map((mod) => (
                    <span key={mod} className="text-xs px-2.5 py-1 rounded-md border border-gray-100 text-gray-500 bg-gray-50">
                      {mod}
                    </span>
                  ))}
                </div>

                <hr className="border-gray-100 mb-4" />

                {/* Social icons */}
                <div className="flex justify-center gap-2.5 mb-4">
                  {[
                    { href: m.github,   icon: <FaGithub />,    hover: "hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800" },
                    { href: m.linkedin, icon: <FaLinkedinIn />, hover: "hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600" },
                    { href: m.facebook, icon: <FaFacebookF />,  hover: "hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600" },
                    { href: m.email,    icon: <MdEmail />,      hover: "hover:bg-red-50 hover:border-red-400 hover:text-red-500" },
                  ].map(({ href, icon, hover }, i) => (
                    <a key={i} href= "_blank" rel="noreferrer"
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-400 border border-gray-200 bg-gray-50 transition-all duration-200 hover:scale-110 ${hover}`}>
                      <span className="text-sm">{icon}</span>
                    </a >
                  ))}        
                </div>

                {/* View Details button */}
                <a href="#" className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-80 ${c.btn}`}>
                  View Details <FaArrowRight className="text-xs" />
                </a >
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}