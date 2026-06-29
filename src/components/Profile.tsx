import React, { useState, useEffect } from "react";
import { User, Badge } from "../types";
import { 
  Zap, 
  ShieldCheck, 
  FileSpreadsheet, 
  Lock, 
  Sparkles, 
  Mail, 
  UserCheck, 
  Trophy, 
  Edit3, 
  UserPlus, 
  LogIn, 
  Check, 
  X, 
  Users,
  Image as ImageIcon
} from "lucide-react";
import { INITIAL_BADGES } from "../mockData";

interface ProfileProps {
  currentUser: User;
  onUpdateUser: (userData: Partial<User>) => void;
  onResetData: () => void;
  users?: User[];
  onLogin?: (email: string, name?: string) => void;
  onLogout?: () => void;
}

const AVATAR_PRESETS = [
  { name: "Active Citizen", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120" },
  { name: "Tech Helper", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120" },
  { name: "Civic Explorer", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120" },
  { name: "Local Volunteer", url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120" },
  { name: "Youth Advocate", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" },
  { name: "Senior Leader", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120" }
];

export default function Profile({ currentUser, onUpdateUser, onResetData, users = [], onLogin, onLogout }: ProfileProps) {

  
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editEmail, setEditEmail] = useState(currentUser.email);
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser.avatarUrl || "");

  // Login/Registration state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginName, setLoginName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Sync edits when active user shifts
  useEffect(() => {
    setEditName(currentUser.name);
    setEditEmail(currentUser.email);
    setEditAvatarUrl(currentUser.avatarUrl || "");
  }, [currentUser]);

  // Experience math
  const xpNeededForNextLevel = currentUser.level * 100;
  const xpProgress = (currentUser.xp % 100);
  const xpProgressPercent = Math.min((xpProgress / 100) * 100, 100);



  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert("Profile name cannot be empty!");
      return;
    }
    if (!editEmail.trim() || !editEmail.includes("@")) {
      alert("Please enter a valid email address!");
      return;
    }

    onUpdateUser({
      name: editName.trim(),
      email: editEmail.trim(),
      avatarUrl: editAvatarUrl.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!loginEmail.trim() || !loginEmail.includes("@")) {
      setAuthError("Please provide a valid email address.");
      return;
    }

    if (onLogin) {
      onLogin(loginEmail, loginName || undefined);
      setAuthSuccess(`Signed in successfully!`);
      setLoginEmail("");
      setLoginName("");
      setTimeout(() => setAuthSuccess(""), 3000);
    }
  };

  const handleSwitchAccount = (email: string) => {
    if (onLogin) {
      onLogin(email);
    }
  };

  // Check progress criteria for locked badges
  const getBadgeProgress = (badge: Badge) => {
    if (badge.reportedRequired) {
      return {
        current: currentUser.reportedCount,
        required: badge.reportedRequired,
        label: "Issues Reported",
      };
    }
    if (badge.verifiedRequired) {
      return {
        current: currentUser.verifiedCount,
        required: badge.verifiedRequired,
        label: "Issues Verified",
      };
    }
    if (badge.xpRequired) {
      return {
        current: currentUser.xp,
        required: badge.xpRequired,
        label: "XP Earned",
      };
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Top Profile Header with glassmorphism container */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden transition-all duration-300">
        {/* Subtle radial glow */}
        <div className="absolute top-0 left-0 h-32 w-32 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

        {isEditing ? (
          /* Profile Edit Mode Form */
          <form onSubmit={handleSaveProfile} className="space-y-5 z-10 relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-sm font-black text-blue-600 dark:text-blue-300 font-mono uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="h-4 w-4" /> Edit Profile Details
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono block">Custom Avatar URL (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="https://images.unsplash.com/... or leave blank for initials"
                />
                {editAvatarUrl && (
                  <button 
                    type="button" 
                    onClick={() => setEditAvatarUrl("")}
                    className="px-3 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5 text-rose-500 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Avatar Preset Options */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono block">OR SELECT A VISUAL PRESET</span>
                <div className="flex flex-wrap gap-2.5">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setEditAvatarUrl(preset.url)}
                      className={`flex items-center gap-1.5 p-1 px-2.5 rounded-xl border text-[11px] font-medium transition-all ${
                        editAvatarUrl === preset.url
                          ? "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/10"
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-5 h-5 rounded-full object-cover" />
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2 justify-end border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:opacity-95 shadow-md flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" /> Save Changes
              </button>
            </div>
          </form>
        ) : (
          /* Profile Viewer Mode Header */
          <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex flex-col md:flex-row items-center gap-5 z-10">
              <div className="relative shrink-0">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-20 h-20 rounded-full border-2 border-blue-500 object-cover shadow-lg shadow-blue-500/15"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-blue-500 bg-gradient-to-br from-pink-400 to-indigo-400 flex items-center justify-center text-white text-2xl font-bold font-mono shadow-lg shadow-blue-500/15">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-blue-500 to-purple-600 border border-white/10 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md font-mono">
                  Level {currentUser.level}
                </div>
              </div>

              <div className="text-center md:text-left space-y-1.5">
                <div className="flex flex-col md:flex-row items-center gap-2 justify-center md:justify-start">
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {currentUser.name}
                  </h2>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                    <UserCheck className="h-3 w-3" /> VERIFIED
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center md:justify-start gap-1">
                  <Mail className="h-3.5 w-3.5 text-blue-500/70" /> {currentUser.email}
                </p>
                <div className="flex flex-wrap gap-2 pt-1 justify-center md:justify-start">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 uppercase font-mono">
                    Civic Guard Tier
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[10px] font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit3 className="h-3 w-3" /> Edit Profile Details
                  </button>
                </div>
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex flex-col gap-2 w-full md:w-auto z-10">
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-950/5"
                >
                  <Lock className="h-4 w-4 text-rose-500" />
                  Sign Out of Account
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm("Reset current localStorage demo data back to default seed?")) {
                    onResetData();
                  }
                }}
                className="text-[10px] text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 hover:underline text-center cursor-pointer pt-1"
              >
                Reset Database & Stats
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats and Level Tracker Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* XP Progress Bar Card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Experience Point (XP) Level Progression</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Gain XP by filing reports (+50 XP), upvoting (+10 XP), and verifying complaints (+30 XP).</p>
          </div>

          <div className="space-y-3 mt-6">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-500 dark:text-slate-400">LVL {currentUser.level}</span>
              <span className="text-blue-600 dark:text-blue-300 flex items-center gap-1">
                <Zap className="h-4.5 w-4.5 text-amber-500 dark:text-amber-400 shrink-0" />
                {currentUser.xp} / {currentUser.level * 100} XP
              </span>
              <span className="text-slate-500 dark:text-slate-400">LVL {currentUser.level + 1}</span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-full overflow-hidden">
              <div
                style={{ width: `${xpProgressPercent}%` }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg shadow-blue-500/20 transition-all duration-500"
              />
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-right font-mono font-bold">
              {(currentUser.level * 100) - currentUser.xp} XP needed to Level Up
            </p>
          </div>
        </div>

        {/* High-Level Counters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-xl flex flex-col items-center justify-center text-center space-y-1">
            <FileSpreadsheet className="h-6 w-6 text-blue-500 dark:text-blue-400" />
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight">{currentUser.reportedCount}</span>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Reports filed</span>
          </div>
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-xl flex flex-col items-center justify-center text-center space-y-1">
            <ShieldCheck className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight">{currentUser.verifiedCount}</span>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Issues Verified</span>
          </div>
        </div>
      </div>



      {/* Badges and Milestones System Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Trophy className="h-5 w-5 text-amber-500" />
            Community Milestones & Badges
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your earned community badges. Locked badges show criteria progress indicators.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INITIAL_BADGES.map((badge) => {
            const isUnlocked = currentUser.badges.includes(badge.id);
            const progress = getBadgeProgress(badge);

            return (
              <div
                key={badge.id}
                className={`border rounded-2xl p-4 backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:scale-[1.02] flex gap-4 ${
                  isUnlocked
                    ? `bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-lg hover:border-blue-500/30`
                    : "bg-slate-50 dark:bg-slate-950/60 border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-500 grayscale opacity-60"
                }`}
              >
                {/* Decorative corner flash */}
                {isUnlocked && (
                  <div className="absolute top-0 right-0 h-10 w-10 bg-blue-500/10 blur-xl rounded-full" />
                )}

                {/* Badge Icon container */}
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border shadow-inner text-white ${
                    isUnlocked
                      ? `bg-gradient-to-r ${badge.color} ${badge.borderColor}`
                      : "bg-slate-200 dark:bg-slate-900 border-slate-300 dark:border-white/10"
                  }`}
                >
                  {isUnlocked ? (
                    <Sparkles className="h-5 w-5 text-white" />
                  ) : (
                    <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div>
                    <span className={`text-xs font-bold block ${isUnlocked ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
                      {badge.title}
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">{badge.description}</p>
                  </div>

                  {/* Progress info for locked or unlocked */}
                  {progress && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-mono font-bold">
                        <span>Progress</span>
                        <span className={isUnlocked ? "text-emerald-500 dark:text-emerald-400" : "text-blue-500 dark:text-blue-400"}>
                          {Math.min(progress.current, progress.required)} / {progress.required}
                        </span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min((progress.current / progress.required) * 100, 100)}%` }}
                          className={`h-full rounded-full ${isUnlocked ? "bg-emerald-500" : "bg-blue-500"}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}