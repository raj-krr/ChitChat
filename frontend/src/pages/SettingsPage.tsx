import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme, type ThemeMode } from "../context/ThemeContext";
import {
  Sun,
  Moon,
  Zap,
  Laptop,
  Palette,
  Bell,
  User,
  Check,
  Volume2,
  VolumeX,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("chitchat_sound") !== "false";
  });

  const [wallpaper, setWallpaper] = useState(() => {
    return localStorage.getItem("chitchat_wallpaper") || "default";
  });

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("chitchat_sound", String(next));
  };

  const handleWallpaperChange = (key: string) => {
    setWallpaper(key);
    localStorage.setItem("chitchat_wallpaper", key);
  };

  const themeOptions: { key: ThemeMode; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      key: "dark",
      label: "Dark Mode",
      desc: "Sleek obsidian theme for low-light environments",
      icon: <Moon size={22} />,
      color: "from-slate-900 to-indigo-950 border-indigo-500/50",
    },
    {
      key: "light",
      label: "Light Mode",
      desc: "Clean, high-contrast theme for bright daylight",
      icon: <Sun size={22} />,
      color: "from-sky-50 to-blue-100 border-blue-400/50 text-slate-900",
    },
    {
      key: "cyberpunk",
      label: "Cyberpunk",
      desc: "Vibrant neon cyan & magenta electric aesthetic",
      icon: <Zap size={22} />,
      color: "from-purple-950 via-slate-950 to-pink-950 border-cyan-400/60",
    },
    {
      key: "system",
      label: "System Auto",
      desc: "Automatically match your operating system theme",
      icon: <Laptop size={22} />,
      color: "from-slate-800 to-slate-900 border-slate-600/50",
    },
  ];

  const wallpaperOptions = [
    { key: "default", label: "Default Mesh", gradient: "from-slate-950 to-indigo-950" },
    { key: "nebula", label: "Deep Nebula", gradient: "from-purple-950 via-indigo-950 to-slate-950" },
    { key: "cybergrid", label: "Cyber Grid", gradient: "from-blue-950 via-slate-950 to-pink-950" },
    { key: "solid", label: "Pure Pitch Dark", gradient: "from-slate-950 to-black" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 flex flex-col items-center">
      {/* Container */}
      <div className="w-full max-w-4xl space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Preferences & Settings</h1>
              <p className="text-sm text-white/60">Customize your ChitChat experience, theme, and sounds</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition text-sm font-medium"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || "/avatar-placeholder.png"}
              alt={user?.username}
              className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/50 shadow-lg"
            />
            <div>
              <h3 className="text-lg font-semibold text-white">{user?.username}</h3>
              <p className="text-sm text-white/60">{user?.email}</p>
              <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Account
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Appearance & Theme Engine */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-lg">
            <Palette size={20} />
            <h2>Theme & Appearance</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {themeOptions.map((opt) => {
              const isSelected = theme === opt.key;
              return (
                <div
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  className={`
                    relative p-5 rounded-2xl cursor-pointer transition-all duration-200
                    bg-gradient-to-br ${opt.color} border-2 backdrop-blur-xl
                    hover:scale-[1.02] active:scale-[0.98]
                    ${isSelected ? "ring-2 ring-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.4)]" : "opacity-80 hover:opacity-100"}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-xl bg-white/10 text-white backdrop-blur-md">
                      {opt.icon}
                    </div>
                    {isSelected && (
                      <span className="p-1.5 rounded-full bg-indigo-500 text-white shadow-md">
                        <Check size={16} />
                      </span>
                    )}
                  </div>
                  <h4 className="mt-4 font-bold text-base text-white">{opt.label}</h4>
                  <p className="mt-1 text-xs text-white/70 leading-relaxed">{opt.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Chat Wallpaper Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-lg">
            <User size={20} />
            <h2>Chat Wallpaper</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {wallpaperOptions.map((wp) => {
              const isSelected = wallpaper === wp.key;
              return (
                <button
                  key={wp.key}
                  onClick={() => handleWallpaperChange(wp.key)}
                  className={`
                    p-4 rounded-xl border transition flex flex-col items-center gap-3
                    bg-gradient-to-b ${wp.gradient}
                    ${isSelected ? "border-indigo-400 ring-2 ring-indigo-500/50" : "border-white/10 hover:border-white/30"}
                  `}
                >
                  <div className="w-full h-16 rounded-lg bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                    {isSelected && <Check size={20} className="text-indigo-400" />}
                  </div>
                  <span className="text-xs font-medium text-white/80">{wp.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Audio & Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-lg">
            <Bell size={20} />
            <h2>Sound & Notifications</h2>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/10 text-indigo-400">
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </div>
              <div>
                <h4 className="font-semibold text-white">Audio Sound Effects</h4>
                <p className="text-xs text-white/60">Play ringtone and message notification sound effects</p>
              </div>
            </div>

            <button
              onClick={handleSoundToggle}
              className={`
                w-12 h-6 rounded-full transition-colors p-1 flex items-center
                ${soundEnabled ? "bg-indigo-500 justify-end" : "bg-slate-700 justify-start"}
              `}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
