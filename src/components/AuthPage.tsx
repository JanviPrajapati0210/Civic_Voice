import React, { useState, useEffect } from "react";
import { User } from "../types";
import { hashPassword, isHex64 } from "../utils/crypto";
import { 
  Mail, 
  User as UserIcon, 
  Sparkles, 
  Check, 
  LogIn, 
  UserPlus, 
  ShieldAlert, 
  ShieldCheck, 
  Info,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  Send,
  HelpCircle,
  Clock,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthPageProps {
  users: User[];
  onLogin: (email: string, name?: string, avatarUrl?: string, password?: string) => void;
  onResetPassword: (email: string, newPassword: string) => void;
  theme: "light" | "dark";
  isForOfficial?: boolean;
}

const AVATAR_PRESETS = [
  { name: "Active Citizen", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120" },
  { name: "Tech Helper", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120" },
  { name: "Civic Explorer", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120" },
  { name: "Local Volunteer", url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120" },
  { name: "Youth Advocate", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" },
  { name: "Senior Leader", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120" }
];

export default function AuthPage({ users, onLogin, onResetPassword, theme, isForOfficial = false }: AuthPageProps) {
  const [activeMode, setActiveMode] = useState<"signin" | "signup" | "forgot" | "reset-password">("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (isForOfficial) {
      setActiveMode("signin");
    }
  }, [isForOfficial]);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);
  
  // Simulated State for password reset
  const [resetEmailSentTo, setResetEmailSentTo] = useState<string | null>(null);
  const [simulationTimer, setSimulationTimer] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (activeMode === "signin") {
      if (isForOfficial) {
        const isValidOfficial = trimmedEmail.endsWith("@vmc.gov.in") ||
                                trimmedEmail.endsWith(".gov") ||
                                trimmedEmail.endsWith(".org") ||
                                trimmedEmail.includes("@municipal") ||
                                trimmedEmail.includes("@city") ||
                                trimmedEmail.includes("admin") ||
                                trimmedEmail === "admin@vmc.gov.in";
        if (!isValidOfficial) {
          setError("Access Denied: Only authorized municipal admin accounts (.gov, .org, or vmc.gov.in) can access the official dashboard.");
          return;
        }

        const existingUser = users.find(u => u.email.toLowerCase() === trimmedEmail);
        if (!existingUser) {
          // Auto-register official account in sandbox
          onLogin(trimmedEmail, "Official Moderator", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120", password || "password123");
          return;
        }
      }

      const existingUser = users.find(u => u.email.toLowerCase() === trimmedEmail);
      if (!existingUser) {
        setError("This email is not registered. Switch to 'Register' to sign up your profile!");
        return;
      }

      // If user has a password in state, we check it.
      // If they don't have password set yet (fallback from old mock users), we accept password123.
      const typedHashed = hashPassword(password);
      const userPassword = existingUser.password || hashPassword("password123");
      const isCorrect = (typedHashed === userPassword) || (password === userPassword);
      if (!isCorrect) {
        setError("Incorrect password. (Try 'password123' for default seeded accounts).");
        return;
      }

      onLogin(trimmedEmail, undefined, undefined, password);
    } 
    else if (activeMode === "signup") {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Please enter your name.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      const emailTaken = users.some(u => u.email.toLowerCase() === trimmedEmail);
      if (emailTaken) {
        setError("This email is already registered. Please sign in instead!");
        return;
      }

      onLogin(trimmedEmail, trimmedName, selectedAvatar, password);
    } 
    else if (activeMode === "forgot") {
      const userExists = users.some(u => u.email.toLowerCase() === trimmedEmail);
      if (!userExists) {
        setError("No account found with this email address.");
        return;
      }

      setSimulationTimer(true);
      setError("");
      
      // Simulate sending emails in 1 second
      setTimeout(() => {
        setResetEmailSentTo(trimmedEmail);
        setSimulationTimer(false);
        setSuccess(`A password regeneration link has been sent to ${trimmedEmail}!`);
      }, 1000);
    }
    else if (activeMode === "reset-password") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      onResetPassword(email, password);
      setSuccess("Your password has been securely regenerated! Please log in with your new password.");
      setActiveMode("signin");
      setPassword("");
      setConfirmPassword("");
    }
  };

  const handleQuickLogin = (seededUser: User) => {
    setError("");
    setSuccess("");
    // Quick login uses password of that user (or password123 as fallback)
    onLogin(seededUser.email, undefined, undefined, seededUser.password || "password123");
  };

  return (
    <div className={`min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative ${
      theme === "dark" ? "text-slate-100" : "text-slate-800"
    }`}>
      {/* Decorative background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-[120px] opacity-20 ${
          theme === "dark" ? "bg-blue-500" : "bg-blue-300"
        }`} />
        <div className={`absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-[120px] opacity-20 ${
          theme === "dark" ? "bg-indigo-500" : "bg-pink-300"
        }`} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-6 relative z-10"
      >
        <div className="text-center">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
            {isForOfficial ? "CMC Official Portal" : "Citizen Civic Voice"}
          </h2>
          <p className={`mt-2 text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            {isForOfficial ? "City Municipal Council Authorized Moderator Console" : "Global Civic Action & Gamified Rewards"}
          </p>
        </div>

        <div className={`rounded-3xl shadow-2xl border backdrop-blur-md overflow-hidden ${
          theme === "dark" ? "bg-slate-900/60 border-white/10" : "bg-white/95 border-slate-200"
        }`}>
          {/* Header tabs (Only visible when not resetting password) */}
          {isForOfficial ? (
            <div className="bg-blue-600/10 border-b border-blue-500/20 px-6 py-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-500 font-mono text-sm">
                🛡️
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500 font-mono">Official Credentials Required</h3>
                <p className="text-[10px] text-slate-400">CMC Authorized Personnel Only</p>
              </div>
            </div>
          ) : (
            activeMode !== "reset-password" && (
              <div className="flex border-b border-slate-100 dark:border-white/5 bg-slate-950/20">
                <button
                  onClick={() => { setActiveMode("signin"); setError(""); setSuccess(""); }}
                  className={`flex-1 py-4 text-xs font-bold font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    activeMode === "signin"
                      ? "border-b-2 border-blue-500 text-blue-500 bg-transparent"
                      : "text-slate-400 hover:text-slate-200 bg-slate-950/10"
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={() => { setActiveMode("signup"); setError(""); setSuccess(""); }}
                  className={`flex-1 py-4 text-xs font-bold font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    activeMode === "signup"
                      ? "border-b-2 border-blue-500 text-blue-500 bg-transparent"
                      : "text-slate-400 hover:text-slate-200 bg-slate-950/10"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Register
                </button>
              </div>
            )
          )}

          <div className="p-8 space-y-6">
            <AnimatePresence mode="wait">
              <motion.form
                key={activeMode}
                initial={{ opacity: 0, x: activeMode === "signin" ? -15 : 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: activeMode === "signin" ? 15 : -15 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Header message for recovery flow */}
                {activeMode === "forgot" && (
                  <div className="space-y-1.5 pb-2">
                    <button
                      type="button"
                      onClick={() => { setActiveMode("signin"); setError(""); setSuccess(""); }}
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1.5 font-bold font-mono"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Sign In
                    </button>
                    <h3 className="text-base font-bold font-display mt-2">Reset Password</h3>
                    <p className="text-xs text-slate-400">
                      Enter your account's email address below and we'll send a password regeneration link to simulate the reset process.
                    </p>
                  </div>
                )}

                {activeMode === "reset-password" && (
                  <div className="space-y-1.5 pb-2">
                    <h3 className="text-base font-bold font-display">Create New Password</h3>
                    <p className="text-xs text-slate-400">
                      You are regenerating the password for <strong className="text-blue-500">{email}</strong>.
                    </p>
                  </div>
                )}

                {/* Status messages */}
                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </div>
                )}

                {/* FIELDS */}
                {activeMode === "signup" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="John"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                          theme === "dark" 
                            ? "bg-slate-950 border-white/10 text-slate-200 placeholder-slate-500" 
                            : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                        }`}
                      />
                    </div>
                  </div>
                )}

                {activeMode !== "reset-password" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                      {isForOfficial ? "Official Municipal Email" : "Email Address"}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder={isForOfficial ? "admin@vmc.gov.in" : "abc123@gmail.com"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                          theme === "dark" 
                            ? "bg-slate-950 border-white/10 text-slate-200 placeholder-slate-500" 
                            : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Password input for signin / signup / reset-password */}
                {activeMode !== "forgot" && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">
                        {activeMode === "reset-password" ? "New Password" : "Password"}
                      </label>
                      {activeMode === "signin" && (
                        <button
                          type="button"
                          onClick={() => { setActiveMode("forgot"); setError(""); setSuccess(""); }}
                          className="text-[10px] font-bold font-mono text-blue-500 hover:underline uppercase tracking-wider"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                          theme === "dark" 
                            ? "bg-slate-950 border-white/10 text-slate-200 placeholder-slate-500" 
                            : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Password input for reset password */}
                {activeMode === "reset-password" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Confirm New Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                          theme === "dark" 
                            ? "bg-slate-950 border-white/10 text-slate-200 placeholder-slate-500" 
                            : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                        }`}
                      />
                    </div>
                  </div>
                )}

                {activeMode === "signup" && (
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Choose Hero Avatar</label>
                    <div className="grid grid-cols-6 gap-2">
                      {AVATAR_PRESETS.map((preset) => {
                        const isSelected = selectedAvatar === preset.url;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setSelectedAvatar(preset.url)}
                            title={preset.name}
                            className={`relative h-10 w-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                              isSelected ? "border-blue-500 scale-105" : "border-transparent hover:border-slate-400"
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white drop-shadow" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={simulationTimer}
                  className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {simulationTimer ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating Secure Link...
                    </div>
                  ) : activeMode === "signin" ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign In to Portal
                    </>
                  ) : activeMode === "signup" ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Register Profile
                    </>
                  ) : activeMode === "forgot" ? (
                    <>
                      <Send className="w-4 h-4" />
                      Send Reset Link
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm New Password
                    </>
                  )}
                  {!simulationTimer && <ArrowRight className="w-4 h-4" />}
                </button>
              </motion.form>
            </AnimatePresence>

            {/* Simulated email inbox simulator when reset link is sent */}
            <AnimatePresence>
              {activeMode === "forgot" && resetEmailSentTo && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className={`mt-4 p-4.5 rounded-2xl border ${
                    theme === "dark" 
                      ? "bg-slate-950/80 border-blue-500/20 text-slate-300" 
                      : "bg-blue-50/70 border-blue-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold font-mono tracking-wider text-blue-500 uppercase flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Inbound Mail Simulator (Local Mock)
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    To maintain fully compliant server-side mechanics in the developer environment, we have mocked the outbound email server. You can click the regenerated link below to safely reset the password:
                  </p>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMode("reset-password");
                        setError("");
                        setSuccess("");
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold font-mono text-[10px] rounded-lg tracking-wider shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      https://vadodara.gov.in/auth/regenerate?email={encodeURIComponent(resetEmailSentTo)}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isForOfficial && (
              <div className="border-t border-slate-100 dark:border-white/5 pt-5 space-y-2.5 text-left">
                <div className="flex items-center gap-1.5 text-blue-500">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-black font-mono uppercase tracking-wider">Official Access Information</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Authorized credentials must match official municipal domains (<code className="text-blue-400 font-mono">@vmc.gov.in</code>, <code className="text-blue-400 font-mono">.gov</code>, <code className="text-blue-400 font-mono">.org</code>, or containing <code className="text-blue-400 font-mono">admin</code>).
                </p>
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 flex justify-between items-center mt-1">
                  <div className="text-left">
                    <span className="text-[9px] text-slate-500 block uppercase font-mono">Instant Sandbox Credentials</span>
                    <span className="text-xs font-bold text-slate-300 font-mono">admin@vmc.gov.in</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("admin@vmc.gov.in");
                      setPassword("password123");
                      setError("");
                      setSuccess("");
                    }}
                    className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/20 transition-colors cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>
            )}

            {/* Quick Login Section / Demo credentials info removed as requested */}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
