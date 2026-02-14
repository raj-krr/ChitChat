import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-[#0b0d12] text-white min-h-screen overflow-x-hidden">

      {/* ================= NAVBAR ================= */}
      <header
  className="
    fixed top-4 left-1/2 -translate-x-1/2
    w-[94%] max-w-6xl
    z-50
    bg-[#0b0d12]/80 backdrop-blur-xl
    border border-white/10
    shadow-xl shadow-black/30
    rounded-2xl
  "
>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <h1
            className="text-lg sm:text-xl font-bold tracking-wide cursor-pointer"
            onClick={() => scrollTo("hero")}
          >
            ChitChat
          </h1>

          {/* DESKTOP NAV */}
          <nav className="hidden sm:flex items-center gap-6 text-sm text-white/80">
            <button onClick={() => scrollTo("features")} className="nav-link">
              Features
            </button>
            <button onClick={() => scrollTo("about")} className="nav-link">
              How it works
            </button>
            <button onClick={() => scrollTo("contact")} className="nav-link">
              Contact
            </button>

            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-md bg-white text-black font-medium hover:bg-gray-200 hover:-translate-y-0.5 transition"
            >
              Login
            </button>
          </nav>

          {/* MOBILE HAMBURGER */}
          <button
            className="sm:hidden flex flex-col gap-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className="w-6 h-[2px] bg-white rounded" />
            <span className="w-6 h-[2px] bg-white rounded" />
            <span className="w-6 h-[2px] bg-white rounded" />
          </button>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="sm:hidden bg-[#0b0d12] border-t border-white/10">
            <div className="px-4 py-4 flex flex-col gap-4 text-sm text-white/80">
              <button onClick={() => scrollTo("features")}>Features</button>
              <button onClick={() => scrollTo("about")}>How it work?</button>
              <button onClick={() => scrollTo("contact")}>Contact</button>
              <button
                onClick={() => navigate("/login")}
                className="mt-2 px-4 py-2 rounded-md bg-white text-black font-medium"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ================= HERO ================= */}
      <section id="hero" className="relative overflow-hidden pt-12 sm:pt-24">
        {/* background glow (UNCHANGED) */}
        <div className="absolute -top-40 -left-40 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-indigo-600/20 blur-[140px]" />
        <div className="absolute top-40 -right-40 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-blue-500/20 blur-[140px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 grid grid-cols-1 md:grid-cols-2 gap-16 sm:gap-20 items-center">

          {/* LEFT */}
          <div className="fade-in">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Chat instantly. <br />
              <span className="text-indigo-400">No noise.</span> <br />
              Just people.
            </h2>

            <p className="text-base sm:text-lg text-white/70 max-w-xl mb-8 sm:mb-10">
              ChitChat helps you stay connected without distractions.
              Clean conversations, smooth experience, and privacy by default.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/register")}
                className="px-6 py-3 rounded-md bg-indigo-600 font-semibold hover:bg-indigo-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-600/30 transition"
              >
                Get Started
              </button>
              <button className="px-6 py-3 rounded-md border border-white/20 hover:bg-white/5 hover:-translate-y-0.5 transition">
                Live Demo
              </button>
            </div>
          </div>

          {/* RIGHT MOCK */}
          <div className="flex justify-center md:justify-end float">
            <div className="w-full max-w-sm sm:max-w-md rounded-xl bg-[#121520] border border-white/10 shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>

              <div className="p-4 space-y-3 text-sm">
                <div className="max-w-[75%] bg-indigo-600/20 p-3 rounded-lg">
                  Did you try the new chat app?
                </div>
                <div className="max-w-[75%] ml-auto bg-white/10 p-3 rounded-lg">
                  Yeah, it’s clean and super smooth.
                </div>
                <div className="max-w-[75%] bg-indigo-600/20 p-3 rounded-lg">
                  Finally something simple 😌
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TRUST ================= */}
      <section className="border-y border-white/10 bg-[#0f1118]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm text-white/80">
          {[
            "Private by default",
            "Fast & smooth chats",
            "No ads. Ever.",
            "Built for real conversations",
          ].map((t) => (
            <div key={t}>{t}</div>
          ))}
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <h3 className="text-2xl sm:text-3xl font-bold text-center mb-12 sm:mb-14">
          Everything you need. Nothing extra.
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
         {[
  [
    "Instant Messaging",
    "Send and receive messages instantly, without waiting or refreshing."
  ],
  [
    "Reply to Messages",
    "Reply to specific messages so conversations stay clear and easy to follow."
  ],
  [
    "Share Photos & Files",
    "Send images and files effortlessly, right inside the chat."
  ],
  [
    "Clean, Organized Chats",
    "Messages are neatly grouped by date, so nothing feels messy."
  ],
  [
    "Smooth Scrolling",
    "Scroll naturally through older messages without sudden jumps."
  ],
  [
    "AI Chat Assistance",
    "Get smart reply suggestions, improve your messages, or chat with an AI assistant anytime."
  ],
].map(([title, desc]) => (
  <Feature key={title} title={title} desc={desc} />
))}

        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="about" className="bg-[#0f1118] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-12 sm:mb-16">
            How it works
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-12 text-white/80">
            <Step step="1" text="Create your account" />
            <Step step="2" text="Find friends and start chats" />
            <Step step="3" text="Talk freely, without noise" />
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="text-center py-20 sm:py-28 px-4 sm:px-6">
        <h3 className="text-3xl sm:text-4xl font-extrabold mb-6">
          Ready to start chatting?
        </h3>
        <p className="text-white/70 mb-8 sm:mb-10">
          Join ChitChat and enjoy messaging without distractions.
        </p>
        <button
          onClick={() => navigate("/register")}
          className="px-8 py-4 rounded-md bg-indigo-600 font-semibold hover:bg-indigo-500 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30 transition"
        >
          Create Free Account
        </button>
      </section>

      {/* ================= FOOTER ================= */}
       <footer id="contact" className="border-t border-white/10 bg-[#0b0d12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row gap-4 justify-between items-center text-sm text-white/60">
          <span>© {new Date().getFullYear()} ChitChat</span>

          <div className="flex gap-6 items-center">
            <a
              href="https://github.com/raj-krr/chitchat"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              GitHub
            </a>

            <a
              href="mailto:mr.rajkumar2468@gmail.com"
              className="hover:text-white"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 rounded-xl border border-white/10 bg-[#121520] transition hover:-translate-y-1 hover:border-indigo-500/40">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-white/60 mt-2">{desc}</p>
    </div>
  );
}

function Step({ step, text }: { step: string; text: string }) {
  return (
    <div className="transition hover:-translate-y-1">
      <div className="text-4xl font-bold mb-4">{step}</div>
      <p>{text}</p>
    </div>
  );
}
