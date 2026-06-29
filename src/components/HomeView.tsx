import React from "react";
import {
  MapPin,
  Sparkles,
  ShieldCheck,
  Trophy,
  ChevronRight,
  TrendingUp,
  Activity,
  FileText,
  Vote,
  Compass,
} from "lucide-react";

interface HomeViewProps {
  onNavigate: (tab: "map" | "dashboard" | "report" | "leaderboard" | "profile") => void;
  theme: "light" | "dark";
  userName: string;
}

export default function HomeView({ onNavigate, theme, userName }: HomeViewProps) {
  const isDark = theme === "dark";

  return (
    <div className="space-y-12 pb-12">
      {/* 1. Hero Welcomer */}
      <div
        className={`relative rounded-3xl p-8 md:p-12 overflow-hidden transition-all duration-300 border ${
          isDark
            ? "bg-gradient-to-br from-blue-950/20 via-slate-900/40 to-purple-950/20 border-white/10 shadow-2xl"
            : "bg-gradient-to-br from-blue-50 via-white to-pink-50/30 border-slate-200/50 shadow-md"
        }`}
      >
        {/* Decorative pastel circles behind content */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-pink-300/10 dark:bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-300/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl text-left space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider font-mono border bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-500 dark:text-blue-300 border-blue-200 dark:border-blue-500/20">
            <Sparkles className="h-3.5 w-3.5 text-blue-500 dark:text-blue-300" />
            Empowering Global Citizens
          </div>

          <h1
            className={`text-3xl md:text-5xl font-black font-display tracking-tight leading-tight ${
              isDark
                ? "bg-gradient-to-r from-blue-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent"
                : "text-slate-800"
            }`}
          >
            Hello {userName.split(" ")[0]}, Welcome to <span className="text-blue-600 dark:text-blue-400">Civic Voice</span>
          </h1>

          <p className={`text-sm md:text-base leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            A crowdsourced hyperlocal civic platform designed for any city or neighborhood in the world. Identify municipal challenges like road potholes, dark streetlights, or sanitation blockages, verify reports with fellow citizens, and earn badges as a global civic guardian.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => onNavigate("report")}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:opacity-95 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] cursor-pointer text-sm"
            >
              Report New Issue
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate("map")}
              className={`flex items-center gap-2 font-bold px-6 py-3 rounded-2xl border transition-all hover:scale-[1.01] cursor-pointer text-sm ${
                isDark
                  ? "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
              }`}
            >
              <Compass className="h-4 w-4 text-blue-500" />
              Explore Live Map
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Step-by-Step Guide */}
      <div className="space-y-6">
        <div className="text-left">
          <h2 className={`text-xl md:text-2xl font-bold font-display ${isDark ? "text-slate-100" : "text-slate-800"}`}>
            How Civic Voice Works
          </h2>
          <p className={`text-xs md:text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            An automated, gamified pipeline driving immediate civic reporting to local resolutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Discover & Snap",
              description: "Spot a broken streetlight, pothole, or trash pile in your city or neighborhood and take a photo.",
              icon: MapPin,
              color: "bg-blue-500/10 text-blue-500 dark:text-blue-300 border-blue-500/20",
              pastelBg: "bg-blue-50/50 dark:bg-blue-950/10",
            },
            {
              step: "02",
              title: "AI Analysis",
              description: "Our Gemini-3.5-powered pipeline automatically suggests labels, categories, and priority.",
              icon: Sparkles,
              color: "bg-pink-500/10 text-pink-500 dark:text-pink-300 border-pink-500/20",
              pastelBg: "bg-pink-50/50 dark:bg-pink-950/10",
            },
            {
              step: "03",
              title: "Verify & Support",
              description: "Other residents verify your coordinates and upvote to alert municipal teams.",
              icon: ShieldCheck,
              color: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-300 border-emerald-500/20",
              pastelBg: "bg-emerald-50/50 dark:bg-emerald-950/10",
            },
            {
              step: "04",
              title: "Gain Reputation",
              description: "Earn Experience Points (XP), unlock civic badges, and rise on the global leaderboard.",
              icon: Trophy,
              color: "bg-amber-500/10 text-amber-500 dark:text-amber-300 border-amber-500/20",
              pastelBg: "bg-amber-50/50 dark:bg-amber-950/10",
            },
          ].map((item, index) => (
            <div
              key={index}
              className={`rounded-2xl p-6 border text-left relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200/60 shadow-sm"
              }`}
            >
              {/* Subtle pastel block */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-40 pointer-events-none ${item.pastelBg}`} />

              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl border ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-black font-mono text-slate-300 dark:text-slate-800/80">
                  {item.step}
                </span>
              </div>

              <h3 className={`text-sm font-bold mb-2 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                {item.title}
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Core App Mission Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Mission Card Left */}
        <div
          className={`rounded-3xl p-6 md:p-8 border text-left flex flex-col justify-between ${
            isDark ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-200/60 shadow-sm"
          }`}
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
              <Activity className="h-3 w-3" />
              Transparent Governance
            </div>
            <h3 className={`text-lg md:text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
              Collaborative Municipal Action
            </h3>
            <p className={`text-xs md:text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              By connecting citizens directly with neighborhood infrastructure, we decrease municipal turnaround times. Every reported issue becomes a public, trackable ticket where anybody can post onsite photos or write status log updates.
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-6 border-t border-slate-200/50 dark:border-white/5 pt-4">
            {[
              { text: "Full case history from submission to resolution", icon: FileText },
              { text: "Dynamic upvotes to indicate community consensus", icon: Vote },
              { text: "Collaborative verification prevents fraudulent reports", icon: ShieldCheck },
            ].map((bullet, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs">
                <bullet.icon className="h-4 w-4 text-purple-500 shrink-0" />
                <span className={isDark ? "text-slate-300" : "text-slate-700"}>{bullet.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gamified Card Right */}
        <div
          className={`rounded-3xl p-6 md:p-8 border text-left flex flex-col justify-between ${
            isDark ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-200/60 shadow-sm"
          }`}
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-500/10 text-pink-600 dark:text-pink-300 border border-pink-500/20">
              <TrendingUp className="h-3 w-3" />
              Gamification Framework
            </div>
            <h3 className={`text-lg md:text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
              Become a Verified Guardian
            </h3>
            <p className={`text-xs md:text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Civic responsibility doesn't have to be dull. Earn experience scores for filing reports, helping to verify other people's complaints, or logging updates. Higher tiers unlock prestigious badges and list you high up the city leaderboard.
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-6 border-t border-slate-200/50 dark:border-white/5 pt-4">
            {[
              { text: "+50 XP on every new verified issue filing", icon: Sparkles },
              { text: "+30 XP for verifying other neighborhood complaints", icon: ShieldCheck },
              { text: "Unlock custom badges (First Responder, Truth Seeker)", icon: Trophy },
            ].map((bullet, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs">
                <bullet.icon className="h-4 w-4 text-pink-500 shrink-0" />
                <span className={isDark ? "text-slate-300" : "text-slate-700"}>{bullet.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
