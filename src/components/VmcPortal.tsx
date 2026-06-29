import React, { useState } from "react";
import { Issue, User } from "../types";
import { 
  Building, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  Ban, 
  Cpu, 
  Search, 
  Clock, 
  MessageSquare, 
  ThumbsUp, 
  Sparkles, 
  RefreshCw, 
  ChevronRight, 
  User as UserIcon,
  XCircle,
  FileText
} from "lucide-react";

interface VmcPortalProps {
  issues: Issue[];
  currentUser: User;
  onVmcVerify: (issueId: string, verified: boolean, notes: string) => void;
  onVmcUpdateStatus: (issueId: string, status: Issue["status"], updateText: string) => void;
  theme?: "light" | "dark";
}

export default function VmcPortal({ issues, currentUser, onVmcVerify, onVmcUpdateStatus, theme = "dark" }: VmcPortalProps) {
  const isDark = theme === "dark";

  // Login simulation states
  const [isAuthorized, setIsAuthorized] = useState(() => {
    const emailLower = currentUser.email.toLowerCase();
    return emailLower.endsWith("@vmc.gov.in") || emailLower.endsWith(".gov") || emailLower.endsWith(".org") || emailLower.includes("@municipal") || emailLower.includes("@city") || emailLower === "admin@vmc.gov.in";
  });
  
  const [vmcEmail, setVmcEmail] = useState("");
  const [vmcCode, setVmcCode] = useState("");
  const [loginError, setLoginError] = useState("");

  // Portal view states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All"); // All, Pending, Verifying, In Progress, Resolved, Spam
  const [selectedVmcIssue, setSelectedVmcIssue] = useState<Issue | null>(null);

  // Verification dialog states
  const [verificationNotes, setVerificationNotes] = useState("");
  const [customStatusText, setCustomStatusText] = useState("");

  // AI analyzer states
  const [aiAnalyzingId, setAiAnalyzingId] = useState<string | null>(null);
  const [extractedSceneData, setExtractedSceneData] = useState<{
    elements: string[];
    riskScore: number;
    recommendedActions: string[];
    officialSummary: string;
  } | null>(null);

  // Bypass and log in as default VMC Official
  const handleVmcBypassLogin = () => {
    setIsAuthorized(true);
    setLoginError("");
  };

  const handleVmcLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vmcEmail.trim() || !vmcEmail.includes("@")) {
      setLoginError("Please enter a valid official email address.");
      return;
    }
    const lowerEmail = vmcEmail.toLowerCase();
    if (!lowerEmail.endsWith("@vmc.gov.in") && !lowerEmail.includes(".gov") && !lowerEmail.includes(".org") && !lowerEmail.includes("municipal") && !lowerEmail.includes("city")) {
      setLoginError("Access denied. Only official municipal (.gov, .org, or city domains) emails can log into the municipal portal.");
      return;
    }
    if (vmcCode !== "VMC1982" && vmcCode !== "CITY1982") {
      setLoginError("Invalid Security PIN. (Hint: Use CITY1982 or VMC1982 for testing).");
      return;
    }

    setIsAuthorized(true);
    setLoginError("");
  };

  // Perform AI-powered Smart Scene Extraction
  const handleExtractSmartScene = async (issue: Issue) => {
    setAiAnalyzingId(issue.id);
    setExtractedSceneData(null);

    try {
      const response = await fetch("/api/gemini/extract-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: issue.title,
          description: issue.description,
          category: issue.category,
          severity: issue.severity,
          imageBase64: issue.imageUrl,
          mimeType: "image/jpeg"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract scene details using Gemini API");
      }

      const responseData = await response.json();

      setExtractedSceneData({
        elements: responseData.elements && responseData.elements.length > 0 ? responseData.elements : ["Inspection completed"],
        riskScore: typeof responseData.riskScore === "number" ? responseData.riskScore : 50,
        recommendedActions: responseData.recommendedActions && responseData.recommendedActions.length > 0 ? responseData.recommendedActions : ["Monitor the location for changes."],
        officialSummary: responseData.officialSummary || "Automated diagnostic audit successfully generated."
      });
    } catch (err) {
      console.error(err);
      // Robust elegant fallback
      setExtractedSceneData({
        elements: [
          issue.category,
          "Structural check needed",
          "Public area inspection required"
        ],
        riskScore: issue.severity === "Critical" ? 95 : issue.severity === "High" ? 75 : issue.severity === "Medium" ? 45 : 20,
        recommendedActions: [
          "Dispatch area maintenance engineers.",
          "Verify report authenticity with coordinates.",
          "Assess immediate community hazard factor."
        ],
        officialSummary: `Diagnostic audit fallback generated. Ensure Gemini API key is configured in secrets for full-fidelity AI visual scene analysis. (Detail: ${issue.title})`
      });
    } finally {
      setAiAnalyzingId(null);
    }
  };

  const handleVerifyAction = (issueId: string, verified: boolean) => {
    const notes = verificationNotes.trim() || (verified ? "Approved and verified as an active, authentic civic complaint." : "Flagged as fraudulent/spam complaint. Removed from general map views.");
    onVmcVerify(issueId, verified, notes);
    setVerificationNotes("");
    
    // Refresh local selection view
    if (selectedVmcIssue && selectedVmcIssue.id === issueId) {
      setSelectedVmcIssue({
        ...selectedVmcIssue,
        vmcVerified: verified,
        isSpam: !verified,
        vmcVerificationNotes: notes,
        vmcVerifiedAt: new Date().toISOString()
      });
    }
  };

  const handleStatusUpdate = (issueId: string, status: Issue["status"]) => {
    const text = customStatusText.trim() || `Official Status update: docket marked as ${status}.`;
    onVmcUpdateStatus(issueId, status, text);
    setCustomStatusText("");

    // Refresh local selection view
    if (selectedVmcIssue && selectedVmcIssue.id === issueId) {
      setSelectedVmcIssue({
        ...selectedVmcIssue,
        status,
        updates: [
          ...selectedVmcIssue.updates,
          {
            id: Date.now().toString(),
            text,
            date: new Date().toISOString(),
            author: "City Municipal Council (CMC)",
            status
          }
        ]
      });
    }
  };

  // Filter logic
  const filteredIssuesList = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.creatorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "All" || issue.category === filterCategory;
    
    let matchesStatus = true;
    if (filterStatus !== "All") {
      if (filterStatus === "Spam") {
        matchesStatus = issue.isSpam === true;
      } else if (filterStatus === "Verified") {
        matchesStatus = issue.vmcVerified === true && !issue.isSpam;
      } else if (filterStatus === "Unverified") {
        matchesStatus = !issue.vmcVerified && !issue.isSpam;
      } else {
        matchesStatus = issue.status === filterStatus && !issue.isSpam;
      }
    } else {
      // By default show everything but filter active vs spam depending on context
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const pendingCount = issues.filter(i => !i.vmcVerified && !i.isSpam).length;
  const verifiedCount = issues.filter(i => i.vmcVerified && !i.isSpam).length;
  const spamCount = issues.filter(i => i.isSpam).length;

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/10 blur-2xl rounded-full" />
        
        <div className="text-center space-y-4 relative z-10">
          <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-500">
            <Building className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 font-display">Municipal Official Admin Gate</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Authorized portal for City Municipal Council (CMC) officials globally to moderate reported cases, run scene diagnostic extractions, and block spam.
            </p>
          </div>

          <form onSubmit={handleVmcLogin} className="space-y-4 pt-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Official Municipal Email</label>
              <input
                type="email"
                required
                value={vmcEmail}
                onChange={(e) => setVmcEmail(e.target.value)}
                placeholder="officer.name@city.gov"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Security PIN</label>
              <input
                type="password"
                required
                value={vmcCode}
                onChange={(e) => setVmcCode(e.target.value)}
                placeholder="Enter PIN (Testing PIN: CITY1982)"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/50 outline-none font-mono"
              />
            </div>

            {loginError && (
              <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-2 rounded-xl text-xs hover:opacity-95 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" /> Authenticate Credentials
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Sandbox Testing Bypass:</span>
            <button
              onClick={handleVmcBypassLogin}
              className="text-xs text-blue-500 hover:text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Access with 1-Click Sandbox Bypass
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper Status Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-950/20 to-slate-900 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-blue-500/10 blur-3xl rounded-full" />
        <div className="flex items-center gap-4 relative z-10 text-left">
          <div className="h-12 w-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-100 font-display">Municipal Official Moderator Console</h2>
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[9px] font-bold font-mono rounded">
                SECURE ACCESS ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              City Municipal Command Center. Perform official verification, filter spam, and analyze visual telemetry globally.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 z-10">
          <div className="bg-slate-800/60 dark:bg-slate-950/60 border border-white/10 dark:border-white/5 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[9px] text-amber-500 font-mono font-bold block">UNVERIFIED CASES</span>
            <span className="text-lg font-black text-white dark:text-slate-100 font-mono">{pendingCount}</span>
          </div>
          <div className="bg-slate-800/60 dark:bg-slate-950/60 border border-white/10 dark:border-white/5 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[9px] text-emerald-500 font-mono font-bold block">CMC VERIFIED</span>
            <span className="text-lg font-black text-white dark:text-slate-100 font-mono">{verifiedCount}</span>
          </div>
          <div className="bg-slate-800/60 dark:bg-slate-950/60 border border-white/10 dark:border-white/5 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[9px] text-rose-500 font-mono font-bold block">SPAM BLOCKED</span>
            <span className="text-lg font-black text-white dark:text-slate-100 font-mono">{spamCount}</span>
          </div>
          <button
            onClick={() => setIsAuthorized(false)}
            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 rounded-xl text-[10px] font-bold cursor-pointer transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Side: Audit List Table / Panel */}
        <div className="xl:col-span-7 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Community Docket Audit List</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Select any record to view evidence and enforce municipal updates.</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Road Hazards">Road Hazards</option>
                <option value="Water & Sanitation">Water & Sanitation</option>
                <option value="Streetlights">Streetlights</option>
                <option value="Waste Management">Waste Management</option>
                <option value="Public Facilities">Public Facilities</option>
                <option value="Vandals & Safety">Vandals & Safety</option>
                <option value="Others">Others</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="All">All Audit Filter</option>
                <option value="Unverified">Unverified Cases</option>
                <option value="Verified">CMC Verified</option>
                <option value="Spam">Flagged as Spam</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, description, reporter..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-blue-500/50 outline-none"
            />
          </div>

          {/* Complaints list */}
          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
            {filteredIssuesList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-white/5 rounded-xl">
                <p className="text-xs">No matching citizen complaints in audit register.</p>
              </div>
            ) : (
              filteredIssuesList.map((issue) => {
                const isSelected = selectedVmcIssue?.id === issue.id;
                return (
                  <button
                    key={issue.id}
                    onClick={() => {
                      setSelectedVmcIssue(issue);
                      setExtractedSceneData(null);
                    }}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-blue-500/5 dark:bg-blue-500/10 border-blue-500 text-slate-800 dark:text-slate-100 shadow-md scale-[1.01]"
                        : "bg-slate-50/60 dark:bg-slate-950/20 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                    }`}
                  >
                    {/* Tiny thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                      {issue.imageUrl ? (
                        <img src={issue.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-slate-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase font-mono text-slate-500 dark:text-slate-400 tracking-wider">
                          {issue.category}
                        </span>
                        <span className={`px-1 rounded text-[8px] font-bold text-white uppercase ${
                          issue.severity === "Critical" ? "bg-rose-500" : issue.severity === "High" ? "bg-orange-500" : issue.severity === "Medium" ? "bg-yellow-500" : "bg-emerald-500"
                        }`}>
                          {issue.severity}
                        </span>

                        {issue.isSpam ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[8px] font-bold font-mono">
                            SPAM BLOCKED
                          </span>
                        ) : issue.vmcVerified ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[8px] font-bold font-mono flex items-center gap-0.5">
                            <ShieldCheck className="h-2 w-2" /> CMC VERIFIED
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-500/10 border border-slate-500/20 text-slate-400 text-[8px] font-bold font-mono">
                            UNVERIFIED
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold block truncate text-slate-800 dark:text-slate-200">
                        {issue.title}
                      </h4>

                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-relaxed">
                        {issue.description}
                      </p>

                      <div className="flex items-center gap-3 text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                        <span>Reporter: {issue.creatorName}</span>
                        <span>•</span>
                        <span>❤️ {issue.upvotes} Upvotes</span>
                        <span>•</span>
                        <span className="text-blue-500 dark:text-blue-400 font-semibold">{issue.status}</span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Action Console & Diagnostics */}
        <div className="xl:col-span-5 space-y-6">
          {selectedVmcIssue ? (
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl space-y-5 text-left">
              {/* Card Header details */}
              <div className="border-b border-slate-100 dark:border-white/5 pb-4 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] text-blue-500 dark:text-blue-400 font-mono font-bold uppercase tracking-wider block">
                    ACTIVE AUDIT CASE FILE
                  </span>
                  <button 
                    onClick={() => setSelectedVmcIssue(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                  >
                    Clear Selection
                  </button>
                </div>
                
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {selectedVmcIssue.title}
                </h3>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {selectedVmcIssue.description}
                </p>

                {/* Picture or GPS info */}
                {selectedVmcIssue.imageUrl && (
                  <div className="relative h-32 rounded-xl bg-slate-200 dark:bg-slate-950 overflow-hidden">
                    <img src={selectedVmcIssue.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                
                <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-white/5 flex justify-between text-[10px] font-mono text-slate-400">
                  <span>GPS: {selectedVmcIssue.latitude.toFixed(5)}, {selectedVmcIssue.longitude.toFixed(5)}</span>
                  <span>Reported By: {selectedVmcIssue.creatorName}</span>
                </div>
              </div>

               {/* CMC OFFICIAL ANTI-SPAM AUDIT CONTROLS */}
              <div className="space-y-3.5 bg-blue-500/5 dark:bg-blue-500/10 p-4 border border-blue-500/20 rounded-xl">
                <div>
                  <h4 className="text-xs font-black text-blue-600 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <ShieldCheck className="h-4.5 w-4.5" /> Enforce Official CMC Verification
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Verify this issue as real and authentic to dispatch repair crews, or block it immediately as fraudulent spam.
                  </p>
                </div>

                {/* Audit notes text */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Auditor Assessment Notes</label>
                  <textarea
                    rows={2}
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Provide official notes (e.g., Road hazard confirmed. Submitting work order...)"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleVerifyAction(selectedVmcIssue.id, true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs cursor-pointer shadow-md flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Approve & Verify
                  </button>
                  <button
                    onClick={() => handleVerifyAction(selectedVmcIssue.id, false)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-lg text-xs cursor-pointer shadow-md flex items-center justify-center gap-1"
                  >
                    <Ban className="h-3.5 w-3.5" /> Flag as Spam
                  </button>
                </div>

                {selectedVmcIssue.vmcVerified !== undefined && (
                  <div className="pt-2 border-t border-slate-200 dark:border-white/5 text-[10px] leading-relaxed">
                    <span className="font-bold text-slate-500 block uppercase font-mono">Current CMC Audit Status:</span>
                    <p className={selectedVmcIssue.isSpam ? "text-rose-500 font-bold" : "text-emerald-500 font-bold"}>
                      {selectedVmcIssue.isSpam 
                        ? `[SPAM DETECTED] Notes: "${selectedVmcIssue.vmcVerificationNotes}"` 
                        : `[APPROVED] Notes: "${selectedVmcIssue.vmcVerificationNotes}"`
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* MUNICIPAL STATUS CONTROL WORKFLOW */}
              <div className="space-y-3.5 bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-100 dark:border-white/5 rounded-xl">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Clock className="h-4.5 w-4.5" /> Dispatch Work Order & Status
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Advance the docket's progress status in the municipal maintenance log.
                  </p>
                </div>

                {/* Custom status update note */}
                <div className="space-y-1">
                  <input
                    type="text"
                    value={customStatusText}
                    onChange={(e) => setCustomStatusText(e.target.value)}
                    placeholder="Optional update text (e.g., Crew dispatched to repair site...)"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["Pending", "Verifying", "In Progress", "Resolved"] as Issue["status"][]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusUpdate(selectedVmcIssue.id, st)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        selectedVmcIssue.status === st
                          ? "bg-blue-600/20 border-blue-500 text-blue-500"
                          : "bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* SMART AI-POWERED SCENE EXTRACTION TELEMETRY */}
              <div className="space-y-3 bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Cpu className="h-4.5 w-4.5 animate-pulse text-indigo-400" /> Smart AI Scene Diagnostician
                  </h4>
                  <button
                    onClick={() => handleExtractSmartScene(selectedVmcIssue)}
                    disabled={aiAnalyzingId !== null}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
                  >
                    {aiAnalyzingId === selectedVmcIssue.id ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        Run Telemetry
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 leading-snug">
                  Extract hyperlocal safety risks, identify structural elements, and generate preventative actions using Gemini AI Vision.
                </p>

                {extractedSceneData && (
                  <div className="space-y-2.5 pt-2 border-t border-indigo-500/10 text-[11px]">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-400">Estimated Hazard Score:</span>
                      <span className={`font-black ${
                        extractedSceneData.riskScore > 75 ? "text-rose-400" : extractedSceneData.riskScore > 40 ? "text-yellow-400" : "text-emerald-400"
                      }`}>
                        {extractedSceneData.riskScore}/100
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase font-mono block">Detected Structural Elements</span>
                      <div className="flex flex-wrap gap-1.5">
                        {extractedSceneData.elements.map((el, i) => (
                          <span key={i} className="bg-slate-900 border border-white/5 rounded px-2 py-0.5 text-[9px] text-slate-300 font-mono">
                            {el}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase font-mono block">Preventative Action Plans</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-300 leading-snug text-[10px]">
                        {extractedSceneData.recommendedActions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>

                    <p className="p-2 bg-slate-950/80 rounded-lg text-[9px] font-mono text-indigo-300 border border-indigo-500/10 leading-snug italic">
                      {extractedSceneData.officialSummary}
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-white/10 rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 backdrop-blur-md h-64 flex flex-col justify-center items-center gap-3">
              <FileText className="h-10 w-10 text-slate-500 animate-pulse" />
              <div>
                <p className="text-sm font-bold">No Audit Case Selected</p>
                <p className="text-xs text-slate-500 mt-1">Select any resident complaint from the dockets registry to enforce municipal verifications or filter spam.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}