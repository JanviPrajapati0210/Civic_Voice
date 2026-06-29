import React from "react";
import { User, Badge } from "../types";
import { Award, Zap, ShieldCheck, FileSpreadsheet, Trophy } from "lucide-react";
import { INITIAL_BADGES } from "../mockData";

interface LeaderboardProps {
  theme?: "light" | "dark";
  users: User[];
  currentUser: User;
}

export default function Leaderboard({ users, currentUser, theme = "dark" }: LeaderboardProps) {
  const isDark = theme === "dark";
  // Sort users by XP descending
  const sortedUsers = [...users].sort((a, b) => b.xp - a.xp);

  // Helper to resolve badge details
  const getBadgeDetails = (badgeId: string): Badge | undefined => {
    return INITIAL_BADGES.find((b) => b.id === badgeId);
  };

  // Helper to determine Level Color scheme
  const getLevelBadgeStyles = (level: number) => {
    if (level >= 5) {
      return "bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border-amber-500/40 shadow-md shadow-amber-500/10";
    }
    if (level >= 3) {
      return "bg-slate-800 text-purple-300 border-purple-500/30";
    }
    return "bg-slate-950 text-slate-400 border-slate-800";
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-3xl font-bold font-display tracking-tight bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
          Civic Voice Leaderboard
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Celebrating the top active citizens identifying, verifying, and resolving local infrastructure challenges.
        </p>
      </div>

      {/* Podium for Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
        {sortedUsers.slice(0, 3).map((user, idx) => {
          const totalPodium = Math.min(sortedUsers.length, 3);
          
          // Compute correct podium styles dynamically
          const getPodiumConfig = (index: number, total: number) => {
            if (total === 1) {
              return {
                rank: 1,
                orderClass: "order-1 md:col-start-2",
                heightClass: "h-48",
                icon: "🥇",
                glow: "shadow-amber-500/15 border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent",
                color: "text-amber-400 font-bold",
              };
            }
            if (total === 2) {
              if (index === 0) {
                return {
                  rank: 1,
                  orderClass: "order-1 md:order-1",
                  heightClass: "h-48",
                  icon: "🥇",
                  glow: "shadow-amber-500/15 border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent",
                  color: "text-amber-400 font-bold",
                };
              } else {
                return {
                  rank: 2,
                  orderClass: "order-2 md:order-2",
                  heightClass: "h-40",
                  icon: "🥈",
                  glow: "shadow-slate-500/10 border-slate-700/60",
                  color: "text-slate-300",
                };
              }
            }
            // Standard 3-podium layout
            if (index === 0) {
              return {
                rank: 1,
                orderClass: "order-1 md:order-2",
                heightClass: "h-48",
                icon: "🥇",
                glow: "shadow-amber-500/15 border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent",
                color: "text-amber-400 font-bold",
              };
            } else if (index === 1) {
              return {
                rank: 2,
                orderClass: "order-2 md:order-1",
                heightClass: "h-40 md:mt-6",
                icon: "🥈",
                glow: "shadow-slate-500/10 border-slate-700/60",
                color: "text-slate-300",
              };
            } else {
              return {
                rank: 3,
                orderClass: "order-3 md:order-3",
                heightClass: "h-36 md:mt-10",
                icon: "🥉",
                glow: "shadow-orange-500/10 border-orange-700/40",
                color: "text-orange-400",
              };
            }
          };

          const pos = getPodiumConfig(idx, totalPodium);

          return (
            <div
              key={user.email}
              className={`border rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-2xl bg-white dark:bg-white/5 backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${pos.orderClass} ${pos.heightClass} ${pos.glow}`}
            >
              {/* Podium Rank Floating Badge */}
              <div className="absolute top-3 right-3 text-2xl">{pos.icon}</div>

              {/* Avatar circle */}
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-14 h-14 rounded-full border-2 border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full border-2 border-slate-700 bg-gradient-to-br from-pink-400 to-indigo-400 flex items-center justify-center text-white text-lg font-bold font-mono">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 dark:bg-slate-950 border border-slate-600 dark:border-slate-800 text-[9px] font-bold text-amber-400">
                  L{user.level}
                </span>
              </div>

              <div className="mt-3">
                <h4 className={`text-sm ${pos.color} truncate max-w-[150px]`}>{user.name}</h4>
                <div className="flex items-center justify-center gap-1 mt-1 text-slate-500 dark:text-slate-400 text-xs">
                  <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0 animate-pulse" />
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{user.xp} XP</span>
                </div>
              </div>

              {/* Stats overview */}
              <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500 font-mono">
                <div className="flex items-center gap-0.5">
                  <FileSpreadsheet className="h-3 w-3 text-blue-400" />
                  <span>R: {user.reportedCount}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>V: {user.verifiedCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Leaderboard List */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-4 md:col-span-5">Hero / Email</div>
          <div className="col-span-2 text-center">Level</div>
          <div className="col-span-3 md:col-span-2 text-center">Engagement Stats</div>
          <div className="col-span-2 text-right">Reputation Score</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {sortedUsers.map((user, index) => {
            const isMe = user.email === currentUser.email;

            return (
              <div
                key={user.email}
                className={`grid grid-cols-12 gap-2 px-5 py-4 items-center transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${
                  isMe ? "bg-blue-500/10 border-l-2 border-blue-500" : ""
                }`}
              >
                {/* Rank */}
                <div className="col-span-1 text-center font-mono font-bold text-sm text-slate-500 dark:text-slate-400">
                  {index + 1}
                </div>

                {/* Name & Badges */}
                <div className="col-span-4 md:col-span-5 flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 bg-gradient-to-br from-pink-400 to-indigo-400 flex items-center justify-center text-white text-[10px] font-bold font-mono">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="truncate">
                    <span className={`text-xs font-semibold block ${isDark ? (isMe ? "text-blue-300 font-bold" : "text-slate-200") : (isMe ? "text-blue-600 font-bold" : "text-slate-700")}`}>
                      {user.name}
                    </span>
                    <div className="flex items-center gap-1 mt-1 overflow-x-hidden max-w-[150px] md:max-w-[250px]">
                      {user.badges.map((bId) => {
                        const b = getBadgeDetails(bId);
                        if (!b) return null;
                        return (
                          <div
                            key={bId}
                            title={b.title}
                            className={`h-4 px-1 rounded text-[8px] font-bold bg-gradient-to-r border flex items-center gap-0.5 text-white ${b.color} ${b.borderColor}`}
                          >
                            <span>{b.title.split(" ")[0]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Level */}
                <div className="col-span-2 text-center">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getLevelBadgeStyles(
                      user.level
                    )}`}
                  >
                    Level {user.level}
                  </span>
                </div>

                {/* Stats */}
                <div className="col-span-3 md:col-span-2 grid grid-cols-2 gap-2 text-center text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[9px] font-semibold text-slate-500 block">Reported</span>
                    <span className="text-blue-400">{user.reportedCount}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[9px] font-semibold text-slate-500 block">Verified</span>
                    <span className="text-emerald-400">{user.verifiedCount}</span>
                  </div>
                </div>

                {/* XP Score */}
                <div className="col-span-2 text-right">
                  <div className="flex items-center justify-end gap-1 text-slate-100 font-mono font-bold text-xs">
                    <Zap className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                    <span>{user.xp} XP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}