import React, { useState } from "react";
import { Issue, IssueUpdate } from "../types";
import {
  X,
  Heart,
  ShieldCheck,
  Calendar,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileText,
  User,
  Wrench,
  Construction,
  Bell,
  BellOff,
} from "lucide-react";

interface IssueDetailsModalProps {
  issue: Issue;
  currentUserEmail: string;
  onClose: () => void;
  onUpvote: (issueId: string) => void;
  onVerify: (issueId: string) => void;
  onAddUpdate: (issueId: string, updateText: string, status: string) => void;
  // Trigger floating XP popups in parent
  onTriggerXpPop: (xp: number) => void;
  isLoggedIn: boolean;
  onRequireLogin: () => void;
  onToggleFollow?: (issueId: string) => void;
}

export default function IssueDetailsModal({
  issue,
  currentUserEmail,
  onClose,
  onUpvote,
  onVerify,
  onAddUpdate,
  onTriggerXpPop,
  isLoggedIn,
  onRequireLogin,
  onToggleFollow,
}: IssueDetailsModalProps) {
  const [newUpdateText, setNewUpdateText] = useState("");
  const [newUpdateStatus, setNewUpdateStatus] = useState(issue.status);
  const [isBouncing, setIsBouncing] = useState(false);

  const hasUpvoted = issue.upvotedBy.includes(currentUserEmail);
  const hasVerified = issue.verifiedBy.includes(currentUserEmail);
  const isCreator = issue.creatorEmail.toLowerCase() === currentUserEmail.toLowerCase();
  const isFollowing = issue.followedBy?.map(e => e.toLowerCase()).includes(currentUserEmail.toLowerCase()) || false;
  const isAutoFollowing = isCreator || hasUpvoted || hasVerified;

  const emailLower = currentUserEmail.toLowerCase();
  const isOfficial = emailLower.endsWith("@vmc.gov.in") ||
                     emailLower.endsWith(".gov") ||
                     emailLower.endsWith(".org") ||
                     emailLower.includes("@municipal") ||
                     emailLower.includes("@city") ||
                     emailLower.includes("admin") ||
                     emailLower === "admin@vmc.gov.in";


  const handleUpvoteClick = () => {
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    setIsBouncing(true);
    onUpvote(issue.id);
    onTriggerXpPop(10); // heart gives 10 XP
    setTimeout(() => setIsBouncing(false), 500);
  };

  const handleVerifyClick = () => {
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    if (hasVerified) return;
    onVerify(issue.id);
    onTriggerXpPop(30); // verify gives 30 XP
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    if (!newUpdateText.trim()) return;

    // Only officials/admins can change the status
    const finalStatus = isOfficial ? newUpdateStatus : issue.status;
    onAddUpdate(issue.id, newUpdateText.trim(), finalStatus);
    onTriggerXpPop(20); // updates give 20 XP
    setNewUpdateText("");
  };

  // Color mappings
  const severityColors = {
    Low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  };

  const statusColors = {
    Pending: "bg-slate-800 text-slate-300 border-slate-700",
    Verifying: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "In Progress": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  // Format Date
  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate "time ago" string
  const getTimeAgo = (isoStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 864000;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-[#0a0d14] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-slate-950/60 hover:bg-slate-950 hover:text-white border border-white/10 p-1.5 rounded-full text-slate-400 transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Half: Image evidence or Fallback */}
        <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-950/40 relative flex items-center justify-center border-r border-white/10 shrink-0">
          {issue.imageUrl ? (
            <img
              src={issue.imageUrl}
              alt={issue.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-8 space-y-3">
              <div className="h-20 w-20 rounded-full bg-blue-950/20 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                <AlertTriangle className="h-10 w-10 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">{issue.category}</p>
                <p className="text-xs text-slate-500">Official Evidence Photo Pending</p>
              </div>
            </div>
          )}

          {/* Severity Overlay chip */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${severityColors[issue.severity]}`}>
              {issue.severity} severity
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColors[issue.status]}`}>
              {issue.status}
            </span>
          </div>

          {/* Time & Creator banner bottom */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 to-transparent p-4 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 text-xs font-mono font-bold">
                {issue.creatorName.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left leading-tight">
                <span className="text-[10px] text-slate-400 block font-mono">Reported by</span>
                <span className="text-xs font-bold text-slate-200">{issue.creatorName}</span>
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-950/80 border border-white/5 px-2 py-1 rounded-lg">
              <Clock className="h-3.5 w-3.5" />
              <span>{getTimeAgo(issue.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right Half: Details, Verification, Timeline Actions */}
        <div className="w-full md:w-1/2 flex flex-col p-6 overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="space-y-1 pb-4 border-b border-white/10 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              {issue.category} division
            </span>
            <h2 className="text-lg font-bold text-slate-100 leading-tight">
              {issue.title}
            </h2>
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono mt-2">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              <span>GPS: {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}</span>
            </div>
          </div>

          {/* Description */}
          <div className="py-4 border-b border-white/10 space-y-1.5 text-left">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Detailed Case File</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {issue.description}
            </p>
            {/* Resolution Days Info */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-slate-400 mt-2">
              <Clock className="h-4 w-4 text-blue-400 shrink-0" />
              <p className="text-[11px] leading-tight">
                AI estimated repair timeframe: <span className="font-bold text-slate-200">{issue.estimatedResolutionDays} days</span> from filing.
              </p>
            </div>
          </div>

          {/* Quick Citizen Controls: Upvote, Verify & Follow */}
          <div className="space-y-2 py-4 border-b border-white/10 shrink-0">
            <div className="grid grid-cols-3 gap-2">
              {/* Heart Upvote */}
              <button
                onClick={handleUpvoteClick}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  hasUpvoted
                    ? "bg-rose-500/10 border-rose-500 text-rose-400"
                    : "bg-slate-950 border-white/10 text-slate-400 hover:border-rose-500/30 hover:text-rose-400"
                } ${isBouncing ? "scale-105" : ""}`}
              >
                <Heart className={`h-4.5 w-4.5 ${hasUpvoted ? "fill-rose-500" : ""}`} />
                <span>{issue.upvotes} {hasUpvoted ? "Upvoted" : "Upvote"}</span>
              </button>

              {/* Citizen Verify */}
              <button
                onClick={handleVerifyClick}
                disabled={hasVerified}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  hasVerified
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 disabled:opacity-100"
                    : "bg-slate-950 border-white/10 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400"
                }`}
              >
                <ShieldCheck className="h-4.5 w-4.5" />
                <span>
                  {hasVerified
                    ? `Verified (${issue.verifiedBy.length})`
                    : `Verify`}
                </span>
              </button>

              {/* Follow Case for Notifications */}
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    onRequireLogin();
                    return;
                  }
                  if (onToggleFollow) onToggleFollow(issue.id);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isFollowing
                    ? "bg-blue-500/15 border-blue-500 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.2)]"
                    : "bg-slate-950 border-white/10 text-slate-400 hover:border-blue-500/30 hover:text-blue-400"
                }`}
              >
                {isFollowing ? (
                  <>
                    <Bell className="h-4.5 w-4.5 fill-blue-500 text-blue-400 animate-bounce" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <BellOff className="h-4.5 w-4.5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            </div>

            {/* Notification Follow Status Context Banner */}
            {isLoggedIn && (
              <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-lg text-[10px] text-blue-400 font-mono">
                <Bell className="h-3 w-3 shrink-0 text-blue-400" />
                <span>
                  {isAutoFollowing
                    ? "You are receiving notifications because you reported, upvoted, or verified this case."
                    : isFollowing
                      ? "You are following this case and will receive real-time updates."
                      : "Click 'Follow' to receive real-time notifications about updates to this case."}
                </span>
              </div>
            )}
          </div>

          {/* Case History Timeline */}
          <div className="py-4 flex-1 space-y-4 text-left">
            <div>
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Updates & Timeline</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Chronological record of citizens and municipal operations.</p>
            </div>

            {/* Timeline track */}
            <div className="relative border-l border-white/10 pl-4 ml-2.5 space-y-4 max-h-48 overflow-y-auto pr-1">
              {/* Initial Report Node */}
              <div className="relative">
                <span className="absolute -left-6.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 border border-white/5 text-[8px] text-slate-400">
                  📁
                </span>
                <div>
                  <span className="text-[10px] font-semibold text-slate-200 block">Complaint Docket Opened</span>
                  <p className="text-[9px] text-slate-500 font-mono">{formatDate(issue.createdAt)} • Reported by {issue.creatorName}</p>
                </div>
              </div>

              {/* Updates list */}
              {issue.updates.map((update) => (
                <div key={update.id} className="relative">
                  <span className="absolute -left-6.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 border border-blue-500/30 text-[8px] text-blue-400">
                    🛠️
                  </span>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-200 block">{update.text}</span>
                    <p className="text-[9px] text-slate-500 font-mono">
                      {formatDate(update.date)} • {update.author} • <span className="text-blue-400">{update.status}</span>
                    </p>
                  </div>
                </div>
              ))}

              {/* Verified Node */}
              {issue.verifiedBy.length > 0 && (
                <div className="relative">
                  <span className="absolute -left-6.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 border border-emerald-500/30 text-[8px] text-emerald-400">
                    ✓
                  </span>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-200 block">Citizen Verified Log</span>
                    <p className="text-[9px] text-slate-500 font-mono">
                      Confirmed genuine hazard by {issue.verifiedBy.length} independent community members.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add simulated update form */}
          <div className="border-t border-white/10 pt-4 shrink-0">
            <form onSubmit={handleUpdateSubmit} className="space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono block">
                  {isOfficial ? "Official Dispatch / Update" : "Citizen Discussion / Comment (+20 XP)"}
                </span>
                {!isOfficial && (
                  <span className="text-[9px] text-slate-500 font-mono">Only Admin can change case status</span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={isOfficial ? "e.g., Road crew scheduled for Thursday asphalt repave..." : "Add to discussion or report update on this issue..."}
                  value={newUpdateText}
                  onChange={(e) => setNewUpdateText(e.target.value)}
                  className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                />

                {isOfficial ? (
                  <select
                    value={newUpdateStatus}
                    onChange={(e) => setNewUpdateStatus(e.target.value as Issue["status"])}
                    className="bg-slate-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-all font-semibold cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Verifying">Verifying</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                ) : (
                  <div className="bg-slate-950/80 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-slate-400 flex items-center justify-center font-mono shrink-0 select-none">
                    🔒 {issue.status}
                  </div>
                )}

                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
