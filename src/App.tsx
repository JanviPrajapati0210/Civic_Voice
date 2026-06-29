import React, { useState, useEffect } from "react";
import { getStoredData, saveStoredData, INITIAL_BADGES, INITIAL_USERS } from "./mockData";
import { hashPassword, isHex64 } from "./utils/crypto";
import { Issue, User, Badge, IssueUpdate, AppNotification } from "./types";
import InteractiveMap from "./components/InteractiveMap";
import Dashboard from "./components/Dashboard";
import ReportForm from "./components/ReportForm";
import Leaderboard from "./components/Leaderboard";
import Profile from "./components/Profile";
import IssueDetailsModal from "./components/IssueDetailsModal";
import HomeView from "./components/HomeView";
import VmcPortal from "./components/VmcPortal";
import AuthPage from "./components/AuthPage";
import {
  Map,
  BarChart3,
  PlusCircle,
  Trophy,
  User as UserIcon,
  Heart,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertOctagon,
  Wrench,
  X,
  FileText,
  Home,
  Sun,
  Moon,
  LogIn,
  Bell,
  BellOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Load local persistent states
  const [data, setData] = useState(() => getStoredData());
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("community_hero_theme");
      return (savedTheme as "light" | "dark") || "dark"; // Default to dark theme
    }
    return "light";
  });

  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<"home" | "map" | "dashboard" | "report" | "leaderboard" | "profile" | "vmc">("home");

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("community_hero_is_logged_in") === "true";
    }
    return false;
  });

  // Dynamically configure document element and body classes based on active theme
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#0b0f19";
      document.body.style.color = "#f8fafc";
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#f4f6f9";
      document.body.style.color = "#1e293b";
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("community_hero_theme", next);
      return next;
    });
  };

  // Filter States (Map / Cards)
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Selected Issue for Inspect Modal
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Push Notifications state
  const [pushBanners, setPushBanners] = useState<AppNotification[]>([]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  const addPushBanner = (notif: AppNotification) => {
    setPushBanners((prev) => [notif, ...prev]);
    setTimeout(() => {
      setPushBanners((prev) => prev.filter((item) => item.id !== notif.id));
    }, 4500);
  };

  const sendNotification = (
    recipientEmail: string,
    title: string,
    message: string,
    type: "status_change" | "new_comment" | "resolved" | "general",
    issueId?: string,
    issueTitle?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: recipientEmail.toLowerCase(),
      title,
      message,
      type,
      issueId,
      issueTitle,
      createdAt: new Date().toISOString(),
      read: false,
    };

    // If recipient is the currently logged-in user, trigger in-app toast/native push
    if (recipientEmail.toLowerCase() === data.currentUser.email.toLowerCase()) {
      // Show browser alert if permitted
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(title, { body: message });
        } catch (e) {
          console.warn("Native Notification failed:", e);
        }
      }
      addPushBanner(newNotif);
    }

    return newNotif;
  };

  const handleMarkAllNotificationsRead = () => {
    if (!isLoggedIn) return;
    const userEmail = data.currentUser.email.toLowerCase();
    const updatedNotifs = (data.notifications || []).map((n) => {
      if (n.userId.toLowerCase() === userEmail) {
        return { ...n, read: true };
      }
      return n;
    });
    setData({
      ...data,
      notifications: updatedNotifs,
    });
  };

  const handleClearNotifications = () => {
    if (!isLoggedIn) return;
    const userEmail = data.currentUser.email.toLowerCase();
    const updatedNotifs = (data.notifications || []).filter((n) => n.userId.toLowerCase() !== userEmail);
    setData({
      ...data,
      notifications: updatedNotifs,
    });
  };

  const handleNotificationClick = (notif: AppNotification) => {
    // Mark as read
    const updatedNotifs = (data.notifications || []).map((n) => {
      if (n.id === notif.id) {
        return { ...n, read: true };
      }
      return n;
    });

    setData({
      ...data,
      notifications: updatedNotifs,
    });

    // If it has an issueId, open that issue in modal
    if (notif.issueId) {
      const target = data.issues.find((i) => i.id === notif.issueId);
      if (target) {
        setSelectedIssue(target);
      }
    }
    setShowNotificationsMenu(false);
  };

  const handleToggleFollowIssue = (issueId: string) => {
    if (!isLoggedIn) return;
    const userEmail = data.currentUser.email.toLowerCase();

    const updatedIssues = data.issues.map((issue) => {
      if (issue.id === issueId) {
        const currentFollowedBy = issue.followedBy || [];
        const isFollowing = currentFollowedBy.map((e) => e.toLowerCase()).includes(userEmail);

        const nextFollowedBy = isFollowing
          ? currentFollowedBy.filter((e) => e.toLowerCase() !== userEmail)
          : [...currentFollowedBy, userEmail];

        return {
          ...issue,
          followedBy: nextFollowedBy,
        };
      }
      return issue;
    });

    setData({
      ...data,
      issues: updatedIssues,
    });

    const refreshedSelected = updatedIssues.find((i) => i.id === issueId);
    if (refreshedSelected) setSelectedIssue(refreshedSelected);

    // Provide visual reward/feedback
    const refreshedIssue = updatedIssues.find((i) => i.id === issueId);
    if (refreshedIssue) {
      const currentFollowedBy = refreshedIssue.followedBy || [];
      const isNowFollowing = currentFollowedBy.map((e) => e.toLowerCase()).includes(userEmail);
      if (isNowFollowing) {
        triggerXpPop(5, "Following Case");
      }
    }
  };


  // Gamification floating overlays
  const [floatingXps, setFloatingXps] = useState<Array<{ id: number; text: string; x: number; y: number }>>([]);
  const [recentBadgeUnlocked, setRecentBadgeUnlocked] = useState<Badge | null>(null);

  // Sync to local storage when state changes
  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  // Floating XP trigger
  const triggerXpPop = (amount: number, label: string = "XP") => {
    const id = Date.now() + Math.random();
    // Position random close to center viewport
    const x = window.innerWidth / 2 + (Math.random() * 100 - 50);
    const y = window.innerHeight / 2 + (Math.random() * 100 - 50);

    setFloatingXps((prev) => [...prev, { id, text: `+${amount} ${label}`, x, y }]);
    setTimeout(() => {
      setFloatingXps((prev) => prev.filter((item) => item.id !== id));
    }, 1500);
  };

  // Gamification Milestone Checker
  const checkBadgeUnlocks = (updatedUser: User, updatedIssues: Issue[]) => {
    const newlyUnlockedBadgeIds: string[] = [];

    INITIAL_BADGES.forEach((badge) => {
      // Skip if already unlocked
      if (updatedUser.badges.includes(badge.id)) return;

      let meetsCriteria = false;

      if (badge.reportedRequired && updatedUser.reportedCount >= badge.reportedRequired) {
        meetsCriteria = true;
      }
      if (badge.verifiedRequired && updatedUser.verifiedCount >= badge.verifiedRequired) {
        meetsCriteria = true;
      }
      if (badge.xpRequired && updatedUser.xp >= badge.xpRequired) {
        meetsCriteria = true;
      }

      if (meetsCriteria) {
        newlyUnlockedBadgeIds.push(badge.id);
      }
    });

    if (newlyUnlockedBadgeIds.length > 0) {
      // Unlock them
      const updatedBadges = [...updatedUser.badges, ...newlyUnlockedBadgeIds];
      const nextLevel = Math.floor(updatedUser.xp / 100) + 1;

      // Show the last unlocked badge popup
      const lastBadgeId = newlyUnlockedBadgeIds[newlyUnlockedBadgeIds.length - 1];
      const lastBadgeObj = INITIAL_BADGES.find((b) => b.id === lastBadgeId);
      if (lastBadgeObj) {
        setRecentBadgeUnlocked(lastBadgeObj);
        setTimeout(() => setRecentBadgeUnlocked(null), 5000); // clear after 5s
      }

      // Award +100 bonus XP per badge unlocked!
      const bonusXp = newlyUnlockedBadgeIds.length * 100;
      triggerXpPop(bonusXp, "Badge Unlock Bonus!");

      return {
        ...updatedUser,
        badges: updatedBadges,
        xp: updatedUser.xp + bonusXp,
        level: Math.floor((updatedUser.xp + bonusXp) / 100) + 1,
      };
    }

    return updatedUser;
  };

  // Handle reporting an issue
  const handleAddIssue = (issueData: Partial<Issue>) => {
    const newIssue: Issue = {
      id: `iss-${Date.now().toString().slice(-4)}`,
      title: issueData.title || "Reported Issue",
      description: issueData.description || "",
      category: issueData.category || "Road Hazards",
      severity: issueData.severity || "Medium",
      status: "Pending",
      upvotes: 0,
      upvotedBy: [],
      verifiedBy: [],
      latitude: issueData.latitude ?? 37.7749,
      longitude: issueData.longitude ?? -122.4194,
      imageUrl: issueData.imageUrl,
      createdAt: new Date().toISOString(),
      creatorEmail: data.currentUser.email,
      creatorName: data.currentUser.name,
      estimatedResolutionDays: issueData.estimatedResolutionDays ?? 5,
      updates: [],
    };

    const nextIssues = [newIssue, ...data.issues];

    // Award +50 XP on report
    const nextUser: User = {
      ...data.currentUser,
      reportedCount: data.currentUser.reportedCount + 1,
      xp: data.currentUser.xp + 50,
      level: Math.floor((data.currentUser.xp + 50) / 100) + 1,
    };

    // Check unlocks
    const verifiedUser = checkBadgeUnlocks(nextUser, nextIssues);

    // Update global list of users as well for the Leaderboard
    const nextUsers = data.users.map((u) => (u.email === verifiedUser.email ? verifiedUser : u));

    setData({
      ...data,
      issues: nextIssues,
      currentUser: verifiedUser,
      users: nextUsers,
    });

    triggerXpPop(50, "XP for Reporting!");
    setActiveTab("map"); // redirect to map to see it live!

    // 🤖 Fire Auto-Agent in the background (non-blocking)
    // Runs autonomously: duplicate detection → priority scoring → dispatch note
    (async () => {
      try {
        const agentRes = await fetch("/api/gemini/auto-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newIssue,
            existingIssues: nextIssues.filter((i) => i.id !== newIssue.id),
          }),
        });

        if (!agentRes.ok) return;
        const agent = await agentRes.json();

        // Patch the issue with agent results: add dispatch note as first update
        setData((prev) => {
          const agentUpdate = {
            id: `upd-agent-${Date.now()}`,
            text: agent.dispatchNote,
            date: new Date().toISOString(),
            author: "🤖 Civic AI Agent",
            status: "Pending",
          };

          const patchedIssues = prev.issues.map((iss) => {
            if (iss.id !== newIssue.id) return iss;
            return {
              ...iss,
              updates: [agentUpdate, ...iss.updates],
              // Flag potential duplicates visually via a note in updates
              ...(agent.isDuplicate && agent.nearbyIssueIds?.length > 0
                ? { vmcVerificationNotes: `Possible duplicate of: ${agent.nearbyIssueIds.join(", ")}` }
                : {}),
            };
          });

          const patchedData = { ...prev, issues: patchedIssues };
          saveStoredData(patchedData);
          return patchedData;
        });
      } catch (err) {
        console.warn("[Auto-Agent] Agent call failed silently:", err);
      }
    })();
  };

  // Heart Upvoting
  const handleUpvoteIssue = (issueId: string) => {
    const updatedIssues = data.issues.map((issue) => {
      if (issue.id === issueId) {
        const isUpvoted = issue.upvotedBy.includes(data.currentUser.email);
        const nextUpvotedBy = isUpvoted
          ? issue.upvotedBy.filter((e) => e !== data.currentUser.email)
          : [...issue.upvotedBy, data.currentUser.email];

        return {
          ...issue,
          upvotedBy: nextUpvotedBy,
          upvotes: isUpvoted ? issue.upvotes - 1 : issue.upvotes + 1,
        };
      }
      return issue;
    });

    // Award +10 XP for engaging!
    const updatedCurrentUser = {
      ...data.currentUser,
      xp: data.currentUser.xp + 10,
      level: Math.floor((data.currentUser.xp + 10) / 100) + 1,
    };

    const finalCurrentUser = checkBadgeUnlocks(updatedCurrentUser, updatedIssues);
    const updatedUsersList = data.users.map((u) => (u.email === finalCurrentUser.email ? finalCurrentUser : u));

    setData({
      ...data,
      issues: updatedIssues,
      currentUser: finalCurrentUser,
      users: updatedUsersList,
    });

    // Update selected issue inside active modal if open
    const refreshedSelected = updatedIssues.find((i) => i.id === issueId);
    if (refreshedSelected) setSelectedIssue(refreshedSelected);
  };

  // Citizen Verification
  const handleVerifyIssue = (issueId: string) => {
    const updatedIssues = data.issues.map((issue) => {
      if (issue.id === issueId) {
        const isVerified = issue.verifiedBy.includes(data.currentUser.email);
        if (isVerified) return issue;

        return {
          ...issue,
          verifiedBy: [...issue.verifiedBy, data.currentUser.email],
        };
      }
      return issue;
    });

    // Award +30 XP for verified action
    const updatedCurrentUser = {
      ...data.currentUser,
      verifiedCount: data.currentUser.verifiedCount + 1,
      xp: data.currentUser.xp + 30,
      level: Math.floor((data.currentUser.xp + 30) / 100) + 1,
    };

    const finalCurrentUser = checkBadgeUnlocks(updatedCurrentUser, updatedIssues);
    const updatedUsersList = data.users.map((u) => (u.email === finalCurrentUser.email ? finalCurrentUser : u));

    setData({
      ...data,
      issues: updatedIssues,
      currentUser: finalCurrentUser,
      users: updatedUsersList,
    });

    const refreshedSelected = updatedIssues.find((i) => i.id === issueId);
    if (refreshedSelected) setSelectedIssue(refreshedSelected);
  };

  // Case Timeline Update appending
  const handleAddUpdate = (issueId: string, updateText: string, status: string) => {
    const oldIssue = data.issues.find((i) => i.id === issueId);
    if (!oldIssue) return;

    const emailLower = data.currentUser.email.toLowerCase();
    const isOfficial = emailLower.endsWith("@vmc.gov.in") ||
                       emailLower.endsWith(".gov") ||
                       emailLower.endsWith(".org") ||
                       emailLower.includes("@municipal") ||
                       emailLower.includes("@city") ||
                       emailLower.includes("admin") ||
                       emailLower === "admin@vmc.gov.in";

    // Enforce that only official/admin can change status
    const finalStatus = isOfficial ? status : oldIssue.status;

    const newUpdate: IssueUpdate = {
      id: `upd-${Date.now()}`,
      text: updateText,
      date: new Date().toISOString(),
      author: isOfficial ? `${data.currentUser.name} (Official)` : `${data.currentUser.name} (Citizen)`,
      status: finalStatus,
    };

    const updatedIssues = data.issues.map((issue) => {
      if (issue.id === issueId) {
        return {
          ...issue,
          status: finalStatus as Issue["status"],
          updates: [newUpdate, ...issue.updates],
        };
      }
      return issue;
    });

    // Generate notifications
    const newNotifications: AppNotification[] = [];
    const statusChanged = oldIssue.status !== finalStatus;
    const isResolved = finalStatus === "Resolved";

    // 1. Notify followers about comment/update (Scenario 2)
    const followers = new Set<string>();
    if (oldIssue.creatorEmail) followers.add(oldIssue.creatorEmail.toLowerCase());
    oldIssue.upvotedBy.forEach((e) => followers.add(e.toLowerCase()));
    oldIssue.verifiedBy.forEach((e) => followers.add(e.toLowerCase()));
    if (oldIssue.followedBy) {
      oldIssue.followedBy.forEach((e) => followers.add(e.toLowerCase()));
    }
    followers.delete(data.currentUser.email.toLowerCase()); // exclude comment author

    followers.forEach((email) => {
      const notif = sendNotification(
        email,
        "New Case Update",
        `New update on '${oldIssue.title}': "${updateText}"`,
        "new_comment",
        issueId,
        oldIssue.title
      );
      newNotifications.push(notif);
    });

    // 2. Notify creator about status change (Scenario 1 & 3)
    if (statusChanged && oldIssue.creatorEmail) {
      const creatorEmail = oldIssue.creatorEmail.toLowerCase();
      if (isResolved) {
        const notif = sendNotification(
          creatorEmail,
          "Issue Resolved! 🎉",
          `Good news! Your reported issue '${oldIssue.title}' has been successfully resolved. Thank you for your support!`,
          "resolved",
          issueId,
          oldIssue.title
        );
        newNotifications.push(notif);
      } else {
        const notif = sendNotification(
          creatorEmail,
          "Case Status Updated",
          `The status of your reported issue '${oldIssue.title}' has changed to '${status}'.`,
          "status_change",
          issueId,
          oldIssue.title
        );
        newNotifications.push(notif);
      }
    }

    // Award +20 XP for providing updates
    const updatedCurrentUser = {
      ...data.currentUser,
      xp: data.currentUser.xp + 20,
      level: Math.floor((data.currentUser.xp + 20) / 100) + 1,
    };

    const finalCurrentUser = checkBadgeUnlocks(updatedCurrentUser, updatedIssues);
    const updatedUsersList = data.users.map((u) => (u.email === finalCurrentUser.email ? finalCurrentUser : u));

    setData({
      ...data,
      issues: updatedIssues,
      currentUser: finalCurrentUser,
      users: updatedUsersList,
      notifications: [...newNotifications, ...(data.notifications || [])],
    });

    const refreshedSelected = updatedIssues.find((i) => i.id === issueId);
    if (refreshedSelected) setSelectedIssue(refreshedSelected);
  };

  const handleUpdateUser = (userData: Partial<User>) => {
    const oldEmail = data.currentUser.email;
    const updatedUser = {
      ...data.currentUser,
      ...userData,
      level: Math.floor((userData.xp ?? data.currentUser.xp) / 100) + 1,
    };

    const finalUser = checkBadgeUnlocks(updatedUser, data.issues);
    const updatedUsers = data.users.map((u) => (u.email === oldEmail ? finalUser : u));

    setData({
      ...data,
      currentUser: finalUser,
      users: updatedUsers,
    });
  };

  const handleVmcVerify = (issueId: string, verified: boolean, notes: string) => {
    const oldIssue = data.issues.find((i) => i.id === issueId);
    if (!oldIssue) return;

    const updatedIssues = data.issues.map((issue) => {
      if (issue.id === issueId) {
        const officialUpdate: IssueUpdate = {
          id: `upd-vmc-${Date.now()}`,
          text: `[CMC OFFICIAL MODERATION] ${verified ? "Approved & Verified" : "Flagged as FRAUDULENT / SPAM"}. Notes: ${notes}`,
          date: new Date().toISOString(),
          author: "City Municipal Council (CMC)",
          status: verified ? issue.status : "Pending",
        };

        return {
          ...issue,
          vmcVerified: verified,
          isSpam: !verified,
          vmcVerificationNotes: notes,
          vmcVerifiedAt: new Date().toISOString(),
          updates: [officialUpdate, ...issue.updates],
        };
      }
      return issue;
    });

    const newNotifications: AppNotification[] = [];
    if (oldIssue.creatorEmail) {
      const creatorEmail = oldIssue.creatorEmail.toLowerCase();
      const title = verified ? "Case Officially Verified! ✓" : "Case Flagged as Spam ⚠";
      const message = verified 
        ? `CMC officially verified your reported issue '${oldIssue.title}'. Notes: "${notes}"` 
        : `CMC reviewed and flagged your issue '${oldIssue.title}' as spam. Notes: "${notes}"`;
        
      const notif = sendNotification(
        creatorEmail,
        title,
        message,
        verified ? "status_change" : "general",
        issueId,
        oldIssue.title
      );
      newNotifications.push(notif);
    }

    // Notify other followers about the CMC update
    const followers = new Set<string>();
    oldIssue.upvotedBy.forEach((e) => followers.add(e.toLowerCase()));
    oldIssue.verifiedBy.forEach((e) => followers.add(e.toLowerCase()));
    if (oldIssue.followedBy) {
      oldIssue.followedBy.forEach((e) => followers.add(e.toLowerCase()));
    }
    if (oldIssue.creatorEmail) followers.delete(oldIssue.creatorEmail.toLowerCase()); // creator is already notified above
    followers.delete(data.currentUser.email.toLowerCase());

    followers.forEach((email) => {
      const followerNotif = sendNotification(
        email,
        "Official Moderation Update",
        `CMC Admin posted a moderation update on '${oldIssue.title}': ${verified ? "Approved & Verified" : "Flagged as Spam"}. Notes: "${notes}"`,
        "new_comment",
        issueId,
        oldIssue.title
      );
      newNotifications.push(followerNotif);
    });

    let updatedUsersList = [...data.users];
    let finalCurrentUser = { ...data.currentUser };

    if (verified) {
      const targetIssue = data.issues.find((i) => i.id === issueId);
      if (targetIssue) {
        const creatorEmail = targetIssue.creatorEmail;
        updatedUsersList = data.users.map((u) => {
          if (u.email.toLowerCase() === creatorEmail.toLowerCase()) {
            const updatedUser = {
              ...u,
              xp: u.xp + 50,
              level: Math.floor((u.xp + 50) / 100) + 1,
            };
            return checkBadgeUnlocks(updatedUser, updatedIssues);
          }
          return u;
        });

        if (creatorEmail.toLowerCase() === data.currentUser.email.toLowerCase()) {
          finalCurrentUser = updatedUsersList.find((u) => u.email.toLowerCase() === data.currentUser.email.toLowerCase()) || data.currentUser;
          triggerXpPop(50, "CMC Verified Complaint Bonus!");
        }
      }
    }

    setData({
      ...data,
      issues: updatedIssues,
      users: updatedUsersList,
      currentUser: finalCurrentUser,
      notifications: [...newNotifications, ...(data.notifications || [])],
    });

    const refreshedSelected = updatedIssues.find((i) => i.id === issueId);
    if (refreshedSelected) setSelectedIssue(refreshedSelected);
  };

  const handleVmcUpdateStatus = (issueId: string, status: Issue["status"], updateText: string) => {
    const oldIssue = data.issues.find((i) => i.id === issueId);
    if (!oldIssue) return;

    const officialUpdate: IssueUpdate = {
      id: `upd-vmc-${Date.now()}`,
      text: `[CMC DISPATCH UPDATE] ${updateText}`,
      date: new Date().toISOString(),
      author: "City Municipal Council (CMC)",
      status: status,
    };

    const updatedIssues = data.issues.map((issue) => {
      if (issue.id === issueId) {
        return {
          ...issue,
          status: status,
          updates: [officialUpdate, ...issue.updates],
        };
      }
      return issue;
    });

    const newNotifications: AppNotification[] = [];
    const statusChanged = oldIssue.status !== status;
    const isResolved = status === "Resolved";

    // 1. Notify followers about comment/dispatch update (Scenario 2)
    const followers = new Set<string>();
    if (oldIssue.creatorEmail) followers.add(oldIssue.creatorEmail.toLowerCase());
    oldIssue.upvotedBy.forEach((e) => followers.add(e.toLowerCase()));
    oldIssue.verifiedBy.forEach((e) => followers.add(e.toLowerCase()));
    if (oldIssue.followedBy) {
      oldIssue.followedBy.forEach((e) => followers.add(e.toLowerCase()));
    }
    followers.delete(data.currentUser.email.toLowerCase());

    followers.forEach((email) => {
      const notif = sendNotification(
        email,
        "Official Dispatch Update",
        `CMC dispatch updated followed case '${oldIssue.title}': "${updateText}"`,
        "new_comment",
        issueId,
        oldIssue.title
      );
      newNotifications.push(notif);
    });

    // 2. Notify creator about status change (Scenario 1 & 3)
    if (statusChanged && oldIssue.creatorEmail) {
      const creatorEmail = oldIssue.creatorEmail.toLowerCase();
      if (isResolved) {
        const notif = sendNotification(
          creatorEmail,
          "Issue Resolved! 🎉",
          `Good news! Your reported issue '${oldIssue.title}' has been successfully resolved by CMC. Notes: "${updateText}"`,
          "resolved",
          issueId,
          oldIssue.title
        );
        newNotifications.push(notif);
      } else {
        const notif = sendNotification(
          creatorEmail,
          "Case Status Updated",
          `Your reported issue '${oldIssue.title}' has been updated to status: '${status}'. Notes: "${updateText}"`,
          "status_change",
          issueId,
          oldIssue.title
        );
        newNotifications.push(notif);
      }
    }

    setData({
      ...data,
      issues: updatedIssues,
      notifications: [...newNotifications, ...(data.notifications || [])],
    });

    const refreshedSelected = updatedIssues.find((i) => i.id === issueId);
    if (refreshedSelected) setSelectedIssue(refreshedSelected);
  };

  const handleResetData = () => {
    localStorage.removeItem("community_hero_issues");
    localStorage.removeItem("community_hero_badges");
    localStorage.removeItem("community_hero_users");
    localStorage.removeItem("community_hero_current_user");
    window.location.reload();
  };

  const handleLogin = (userEmail: string, userName?: string, avatarUrl?: string, password?: string) => {
    const trimmedEmail = userEmail.trim().toLowerCase();
    const existingUser = data.users.find(
      (u) => u.email.toLowerCase() === trimmedEmail
    );

    if (existingUser) {
      let finalUser = existingUser;
      if (password) {
        const hashedPassword = isHex64(password) ? password : hashPassword(password);
        finalUser = { ...existingUser, password: hashedPassword };
      }
      const updatedUsers = data.users.map((u) => u.email.toLowerCase() === trimmedEmail ? finalUser : u);
      setData({
        ...data,
        currentUser: finalUser,
        users: updatedUsers,
      });
      triggerXpPop(10, `Logged in: ${finalUser.name}`);
      setIsLoggedIn(true);
      localStorage.setItem("community_hero_is_logged_in", "true");
    } else {
      const nameToUse = userName ? userName.trim() : userEmail.split("@")[0];
      const rawPassword = password || "password123";
      const hashedPassword = isHex64(rawPassword) ? rawPassword : hashPassword(rawPassword);
      const newUser: User = {
        email: trimmedEmail,
        name: nameToUse,
        xp: 0,
        badges: [],
        reportedCount: 0,
        verifiedCount: 0,
        level: 1,
        avatarUrl: avatarUrl,
        password: hashedPassword,
      };

      setData({
        ...data,
        currentUser: newUser,
        users: [...data.users, newUser],
      });
      triggerXpPop(10, `Created account for ${nameToUse}`);
      setIsLoggedIn(true);
      localStorage.setItem("community_hero_is_logged_in", "true");
    }
  };

  const handleResetPassword = (email: string, newPassword: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const hashedNewPassword = hashPassword(newPassword);
    const updatedUsers = data.users.map((u) => {
      if (u.email.toLowerCase() === trimmedEmail) {
        return { ...u, password: hashedNewPassword };
      }
      return u;
    });

    const updatedCurrentUser = data.currentUser.email.toLowerCase() === trimmedEmail
      ? { ...data.currentUser, password: hashedNewPassword }
      : data.currentUser;

    setData({
      ...data,
      currentUser: updatedCurrentUser,
      users: updatedUsers,
    });
    triggerXpPop(15, "Password reset successfully!");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("community_hero_is_logged_in");
    triggerXpPop(5, "Signed Out Successfully");
    setActiveTab("home");
  };

  // Helper calculation for severity color borders
  const getSeverityColorBar = (sev: Issue["severity"]) => {
    if (sev === "Critical") return "bg-rose-500 shadow-rose-500/30";
    if (sev === "High") return "bg-orange-500 shadow-orange-500/30";
    if (sev === "Medium") return "bg-yellow-500 shadow-yellow-500/30";
    return "bg-emerald-500 shadow-emerald-500/30";
  };

  // Helper for "time ago"
  const getTimeAgo = (isoStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
  };

  // Filter Issues List
  const filteredIssuesList = data.issues.filter((issue) => {
    if (issue.isSpam) return false;
    const matchesCategory = selectedCategory === "All" || issue.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || issue.status === selectedStatus;
    return matchesCategory && matchesStatus;
  });

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 relative min-h-screen font-sans z-10 transition-colors duration-300 ${
      theme === "dark" ? "text-slate-100" : "text-slate-800"
    }`}>
      
      {/* Absolute top/bottom glows for theme */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full blur-[130px] transition-colors duration-500 ${
          theme === "dark" ? "bg-blue-900/15" : "bg-blue-250/10"
        }`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full blur-[130px] transition-colors duration-500 ${
          theme === "dark" ? "bg-purple-900/15" : "bg-pink-300/10"
        }`} />
      </div>

      {/* Floating XP Canvas Pops */}
      <AnimatePresence>
        {floatingXps.map((xp) => (
          <motion.div
            key={xp.id}
            initial={{ opacity: 1, y: xp.y, scale: 0.8 }}
            animate={{ opacity: 0, y: xp.y - 120, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ left: xp.x }}
            className={`absolute z-50 pointer-events-none font-mono font-black text-sm px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border ${
              theme === "dark"
                ? "text-blue-300 bg-slate-950/90 border-white/10 shadow-blue-500/10"
                : "text-blue-600 bg-white/95 border-blue-100 shadow-blue-500/5"
            }`}
          >
            <Sparkles className="h-4 w-4 text-purple-400 animate-spin" />
            <span>{xp.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Floating Badge Unlock Panel Toast */}
      <AnimatePresence>
        {recentBadgeUnlocked && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`fixed top-20 right-6 z-50 p-5 rounded-2xl shadow-2xl flex gap-4 w-80 backdrop-blur-md border ${
              theme === "dark" ? "bg-slate-950/95 border-white/10 text-white" : "bg-white/95 border-slate-200 text-slate-800"
            }`}
          >
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 text-white bg-gradient-to-r border ${recentBadgeUnlocked.color} ${recentBadgeUnlocked.borderColor}`}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest font-mono">Milestone Unlocked!</span>
              <h4 className={`text-sm font-black ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>{recentBadgeUnlocked.title}</h4>
              <p className={`text-[11px] mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{recentBadgeUnlocked.description}</p>
              <span className="inline-block bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-600 dark:text-blue-300 font-bold px-2 py-0.5 rounded mt-2 font-mono">+100 XP Badge Bonus Added</span>
            </div>
            <button onClick={() => setRecentBadgeUnlocked(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glassmorphism Header */}
      <nav className={`sticky top-4 z-40 p-3 rounded-2xl backdrop-blur-md shadow-lg flex items-center justify-between mb-8 transition-all border ${
        theme === "dark" ? "bg-slate-950/80 border-white/10 text-slate-100" : "bg-white/85 border-slate-200/60 text-slate-800"
      }`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab("home")} className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md cursor-pointer hover:opacity-95 transition-opacity">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <div className="text-left">
            <span className="text-[10px] font-mono font-bold tracking-widest text-blue-500 block uppercase">Global Citizen</span>
            <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">Civic Voice</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl shrink-0 border ${
          theme === "dark" ? "bg-white/5 border-white/5" : "bg-slate-100 border-slate-200/50"
        }`}>
          {[
            { id: "home", label: "Home", icon: Home },
            { id: "map", label: "Map Tracker", icon: Map },
            { id: "dashboard", label: "Analytics", icon: BarChart3 },
            { id: "report", label: "Report Issue", icon: PlusCircle },
            { id: "leaderboard", label: "Leaderboard", icon: Trophy },
            { id: "profile", label: "Hero Stats", icon: UserIcon },
            { id: "vmc", label: "CMC Portal", icon: ShieldCheck },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  isActive
                    ? theme === "dark"
                      ? "bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold shadow-inner"
                      : "bg-blue-50 border border-blue-200 text-blue-600 font-bold shadow-sm"
                    : theme === "dark"
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons & User mini-status */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm hover:scale-[1.03] ${
              theme === "dark" ? "bg-white/5 border-white/10 text-amber-300 hover:bg-white/10" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notification Center Trigger Bell */}
          {isLoggedIn && (
            <div className="relative">
              <button
                onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
                title="Notifications Hub"
                className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm hover:scale-[1.03] relative ${
                  showNotificationsMenu
                    ? "bg-blue-600/15 border-blue-500/50 text-blue-400"
                    : theme === "dark"
                      ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                      : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Bell className="h-4 w-4" />
                {/* Count badge */}
                {(data.notifications || []).filter((n) => n.userId.toLowerCase() === data.currentUser.email.toLowerCase() && !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-extrabold text-white shadow-md shadow-rose-500/20 animate-pulse">
                    {(data.notifications || []).filter((n) => n.userId.toLowerCase() === data.currentUser.email.toLowerCase() && !n.read).length}
                  </span>
                )}
              </button>

              {/* Notification Center Dropdown */}
              <AnimatePresence>
                {showNotificationsMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }}
                    className={`absolute right-0 mt-3 w-80 md:w-96 rounded-2xl shadow-2xl border backdrop-blur-lg z-50 p-4 flex flex-col max-h-[420px] overflow-hidden ${
                      theme === "dark" ? "bg-slate-950/95 border-white/10 text-slate-200 shadow-slate-950/40" : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/50"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/5 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs uppercase tracking-wider font-mono">Civic Alert Hub</span>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold">
                          {(data.notifications || []).filter((n) => n.userId.toLowerCase() === data.currentUser.email.toLowerCase() && !n.read).length} New
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleMarkAllNotificationsRead}
                          className="text-[10px] text-blue-500 hover:text-blue-400 font-bold font-mono uppercase cursor-pointer"
                        >
                          Mark Read
                        </button>
                        <span className="text-slate-400 dark:text-white/5 text-[9px] font-mono">•</span>
                        <button
                          onClick={handleClearNotifications}
                          className="text-[10px] text-rose-500 hover:text-rose-400 font-bold font-mono uppercase cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Browser Alerts Toggle Option */}
                    <div className="py-2 px-3 my-2 rounded-xl bg-blue-500/5 dark:bg-blue-500/5 border border-blue-500/10 flex items-center justify-between text-[11px] leading-tight text-left">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Desktop Push Alerts</span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">Receive native system-wide indicators.</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (typeof window !== "undefined" && "Notification" in window) {
                            if (Notification.permission === "default") {
                              const res = await Notification.requestPermission();
                              if (res === "granted") {
                                triggerXpPop(10, "Browser Alerts Configured!");
                                sendNotification(
                                  data.currentUser.email,
                                  "Alerts Activated! 🚀",
                                  "You will now receive instant desktop push updates for reported or followed community issues.",
                                  "general"
                                );
                              }
                            } else if (Notification.permission === "granted") {
                              sendNotification(
                                data.currentUser.email,
                                "Alert Status Active 🔔",
                                "This is a quick system test confirming native push alerts are fully active.",
                                "general"
                              );
                            } else {
                              alert("Notification permission is currently blocked. Please enable permission in your browser URL bar to receive desktop notifications.");
                            }
                          } else {
                            alert("This browser is restricted or does not support Web Push notifications.");
                          }
                        }}
                        className="text-[9px] font-extrabold font-mono px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer uppercase tracking-wider"
                      >
                        {typeof window !== "undefined" && "Notification" in window
                          ? Notification.permission === "granted"
                            ? "Test Alert"
                            : "Configure"
                          : "Unsupported"}
                      </button>
                    </div>

                    {/* Notification List Container */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-1 max-h-64">
                      {((data.notifications || []).filter((n) => n.userId.toLowerCase() === data.currentUser.email.toLowerCase())).length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-2 text-slate-400">
                            <BellOff className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                          </div>
                          <p className="text-xs font-semibold text-slate-400 dark:text-slate-300">All caught up!</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 max-w-[200px] mx-auto">Receive updates when issues you report change status or receive comments.</p>
                        </div>
                      ) : (
                        (data.notifications || [])
                          .filter((n) => n.userId.toLowerCase() === data.currentUser.email.toLowerCase())
                          .map((notif) => {
                            const iconMap = {
                              status_change: "⚙️",
                              new_comment: "💬",
                              resolved: "🎉",
                              general: "🔔",
                            };
                            return (
                              <button
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`w-full text-left p-2.5 rounded-xl transition-all flex gap-2.5 border border-transparent hover:border-blue-500/10 cursor-pointer ${
                                  notif.read
                                    ? "bg-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
                                    : theme === "dark"
                                      ? "bg-blue-500/5 hover:bg-blue-500/10 text-slate-100"
                                      : "bg-blue-500/5 hover:bg-blue-500/10 text-slate-800"
                                }`}
                              >
                                <span className="text-base select-none shrink-0 pt-0.5">{iconMap[notif.type] || "🔔"}</span>
                                <div className="flex-1 min-w-0 leading-tight">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[11px] font-bold block truncate ${notif.read ? "text-slate-400 dark:text-slate-500" : "text-blue-500 dark:text-blue-400"}`}>
                                      {notif.title}
                                    </span>
                                    {!notif.read && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 block shrink-0" />
                                    )}
                                  </div>
                                  <p className={`text-[10px] mt-0.5 leading-snug ${notif.read ? "text-slate-500 dark:text-slate-500" : theme === "dark" ? "text-slate-300" : "text-slate-600"} line-clamp-2`}>
                                    {notif.message}
                                  </p>
                                  <span className="text-[8px] text-slate-400 dark:text-slate-600 font-mono block mt-1">
                                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • View Case File
                                  </span>
                                </div>
                              </button>
                            );
                          })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User Mini status */}
          {isLoggedIn ? (
            <div className={`hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl border ${
              theme === "dark" ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="text-right leading-none">
                <span className={`text-xs font-bold block ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}>{data.currentUser.name}</span>
                <span className="text-[10px] text-blue-500 font-mono font-semibold">Lvl {data.currentUser.level} • {data.currentUser.xp} XP</span>
              </div>
              {data.currentUser.avatarUrl ? (
                <img
                  src={data.currentUser.avatarUrl}
                  alt={data.currentUser.name}
                  className="w-8 h-8 rounded-full border border-blue-500 object-cover shadow-md shadow-blue-500/10"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border border-blue-500 bg-gradient-to-br from-pink-400 to-indigo-400 flex items-center justify-center text-white text-xs font-bold font-mono shadow-md shadow-blue-500/10">
                  {data.currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="ml-1 p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013-3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab("profile")}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono uppercase bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/15 cursor-pointer transition-all"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Main Tab Rendering Page transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {/* 1. MAP TAB VIEW */}
          {activeTab === "map" && (
            <div className="space-y-6">
              {/* Category Filters row */}
              <div className={`flex flex-wrap items-center justify-between gap-4 p-4 border rounded-2xl backdrop-blur-md shadow-xl ${isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Category Filter */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-slate-500 font-bold font-mono uppercase tracking-wider">Division Category</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className={`bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-all font-semibold cursor-pointer`}
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
                  </div>

                  {/* Status Filter */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-slate-500 font-bold font-mono uppercase tracking-wider">Case Status</span>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className={`bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-all font-semibold cursor-pointer`}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Verifying">Verifying</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400 font-mono">
                  Displaying <span className="text-blue-400 font-bold">{filteredIssuesList.length}</span> active complaints
                </div>
              </div>

              {/* Map Layout */}
              <div className="h-[450px] w-full">
                <InteractiveMap
                  issues={data.issues}
                  selectedCategory={selectedCategory}
                  selectedStatus={selectedStatus}
                  onSelectIssue={(issue) => setSelectedIssue(issue)}
                  theme={theme}
                />
              </div>

              {/* Staggered Cards List underneath */}
              <div className="space-y-4">
                <div className="text-left border-b border-white/10 pb-3">
                  <h3 className={`text-base font-bold font-display ${isDark ? "text-slate-200" : "text-slate-800"}`}>Community Complaint Records</h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Click on any card to inspect full timeline updates, verify records, or upvote.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredIssuesList.map((issue, idx) => (
                      <motion.div
                        key={issue.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.08 }}
                        onClick={() => setSelectedIssue(issue)}
                        className={`border rounded-2xl overflow-hidden cursor-pointer shadow-xl backdrop-blur-md flex flex-col justify-between group transition-all hover:scale-[1.02] hover:border-blue-500/30 ${isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}
                      >
                        {/* Upper image/fallback */}
                        <div className={`relative h-44 w-full overflow-hidden flex items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-100"}`}>
                          {issue.imageUrl ? (
                            <img
                              src={issue.imageUrl}
                              alt={issue.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="text-slate-600 flex flex-col items-center gap-1.5 p-4 text-center">
                              <AlertOctagon className="h-10 w-10 text-slate-500 animate-pulse" />
                              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Photo Pending</span>
                            </div>
                          )}

                          {/* Status overlay badge */}
                          <div className="absolute top-3 left-3 bg-slate-900/80 border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded-md text-white font-mono uppercase tracking-wider">
                            {issue.status}
                          </div>

                          {/* Category Badge right side */}
                          <div className="absolute top-3 right-3 bg-blue-950/80 border border-blue-500/30 text-[9px] font-bold px-2 py-0.5 rounded-md text-blue-300 font-mono">
                            {issue.category}
                          </div>

                          {/* Severity Colored strip at bottom of image container */}
                          <div className={`absolute bottom-0 inset-x-0 h-1.5 shadow-md ${getSeverityColorBar(issue.severity)}`} />
                        </div>

                        {/* Text detail block */}
                        <div className="p-5 flex-1 flex flex-col justify-between text-left space-y-4">
                          <div className="space-y-1.5">
                            <h4 className={`text-sm font-bold line-clamp-1 group-hover:text-blue-400 transition-colors ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                              {issue.title}
                            </h4>
                            <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              {issue.description}
                            </p>
                          </div>

                          {/* Metadata row */}
                          <div className={`border-t pt-3 flex items-center justify-between text-[10px] font-mono ${isDark ? "border-white/5 text-slate-500" : "border-slate-100 text-slate-400"}`}>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-0.5 text-rose-400">
                                <Heart className="h-3.5 w-3.5 fill-rose-500/20" /> {issue.upvotes}
                              </span>
                              <span className="flex items-center gap-0.5 text-emerald-500">
                                <ShieldCheck className="h-3.5 w-3.5" /> {issue.verifiedBy.length} verified
                              </span>
                            </div>
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${isDark ? "bg-slate-950/60 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                              <Clock className="h-3 w-3 text-blue-400 shrink-0" />
                              <span>{getTimeAgo(issue.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {/* 0. HOME TAB VIEW */}
          {activeTab === "home" && (
            <HomeView
              onNavigate={(tab) => setActiveTab(tab as any)}
              theme={theme}
              userName={isLoggedIn ? data.currentUser.name : "Guest Resident"}
            />
          )}

          {/* 2. ANALYTICS TAB */}
          {activeTab === "dashboard" && <Dashboard issues={data.issues} theme={theme} />}

          {/* 3. REPORT TAB */}
          {activeTab === "report" && (
            isLoggedIn ? (
              <ReportForm onSubmitIssue={handleAddIssue} issues={data.issues} theme={theme} />
            ) : (
              <AuthPage users={data.users} onLogin={handleLogin} onResetPassword={handleResetPassword} theme={theme} />
            )
          )}

          {/* 4. LEADERBOARD TAB */}
          {activeTab === "leaderboard" && (
            isLoggedIn ? (
              <Leaderboard users={data.users} currentUser={data.currentUser} theme={theme} />
            ) : (
              <AuthPage users={data.users} onLogin={handleLogin} onResetPassword={handleResetPassword} theme={theme} />
            )
          )}

          {/* 5. PROFILE TAB */}
          {activeTab === "profile" && (
            isLoggedIn ? (
              <Profile
                currentUser={data.currentUser}
                onUpdateUser={handleUpdateUser}
                onResetData={handleResetData}
                users={data.users}
                onLogin={handleLogin}
                onLogout={handleLogout}
                theme={theme}
              />
            ) : (
              <AuthPage users={data.users} onLogin={handleLogin} onResetPassword={handleResetPassword} theme={theme} />
            )
          )}

          {/* VMC PORTAL TAB */}
          {activeTab === "vmc" && (
            isLoggedIn ? (
              <VmcPortal
                issues={data.issues}
                currentUser={data.currentUser}
                onVmcVerify={handleVmcVerify}
                onVmcUpdateStatus={handleVmcUpdateStatus}
                theme={theme}
              />
            ) : (
              <AuthPage users={data.users} onLogin={handleLogin} onResetPassword={handleResetPassword} theme={theme} isForOfficial={true} />
            )
          )}
        </motion.div>
      </AnimatePresence>

      {/* 6. INSPECT DETAILS OVERLAY MODAL */}
      <AnimatePresence>
        {selectedIssue && (
          <IssueDetailsModal
            issue={selectedIssue}
            currentUserEmail={data.currentUser.email}
            onClose={() => setSelectedIssue(null)}
            onUpvote={handleUpvoteIssue}
            onVerify={handleVerifyIssue}
            onAddUpdate={handleAddUpdate}
            onTriggerXpPop={triggerXpPop}
            isLoggedIn={isLoggedIn}
            onRequireLogin={() => {
              setSelectedIssue(null);
              setActiveTab("profile");
            }}
            onToggleFollow={handleToggleFollowIssue}
          />
        )}
      </AnimatePresence>

      {/* 7. FLOATING PUSH TOAST ALERTS */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-auto">
        <AnimatePresence>
          {pushBanners.map((banner) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }}
              className="bg-slate-900/95 dark:bg-slate-950/95 border border-blue-500/30 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md flex gap-3 relative overflow-hidden"
              onClick={() => handleNotificationClick(banner)}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500" />
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 h-fit">
                <Bell className="h-5 w-5 animate-bounce" />
              </div>
              <div className="flex-1 text-left select-none cursor-pointer">
                <h4 className="text-xs font-bold font-sans text-slate-100 flex items-center gap-1.5">
                  {banner.title}
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                </h4>
                <p className="text-[10.5px] text-slate-300 mt-0.5 leading-snug">{banner.message}</p>
                <span className="text-[8.5px] text-slate-500 font-mono mt-1 block">Click to view case file</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPushBanners((prev) => prev.filter((item) => item.id !== banner.id));
                }}
                className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}