import { Issue, Badge, User, AppNotification } from "./types";
import { hashPassword, isHex64 } from "./utils/crypto";

// Seed coordinates centered globally as default
export const DEFAULT_MAP_CENTER: [number, number] = [20, 0];

export const INITIAL_BADGES: Badge[] = [
  {
    id: "first_report",
    title: "First Responder",
    description: "Report your first local community issue.",
    iconName: "FileSpreadsheet",
    color: "from-blue-500 to-indigo-600",
    borderColor: "border-blue-500",
    reportedRequired: 1,
  },
  {
    id: "civic_pillar",
    title: "Civic Pillar",
    description: "Report 5 community issues.",
    iconName: "Home",
    color: "from-emerald-500 to-teal-600",
    borderColor: "border-emerald-500",
    reportedRequired: 5,
  },
  {
    id: "verifier",
    title: "Truth Seeker",
    description: "Verify your first issue reported by someone else.",
    iconName: "ShieldCheck",
    color: "from-amber-500 to-orange-600",
    borderColor: "border-amber-500",
    verifiedRequired: 1,
  },
  {
    id: "community_guardian",
    title: "Community Guardian",
    description: "Successfully verify 10 community issues.",
    iconName: "HeartHandshake",
    color: "from-violet-500 to-purple-600",
    borderColor: "border-purple-500",
    verifiedRequired: 10,
  },
  {
    id: "xp_novice",
    title: "Rising Hero",
    description: "Reach 100 Experience Points (XP).",
    iconName: "Zap",
    color: "from-cyan-500 to-blue-600",
    borderColor: "border-cyan-500",
    xpRequired: 100,
  },
  {
    id: "xp_master",
    title: "Hyperlocal Champion",
    description: "Reach 500 Experience Points (XP) and become a local legend.",
    iconName: "Crown",
    color: "from-rose-500 to-pink-600",
    borderColor: "border-rose-500",
    xpRequired: 500,
  },
];

export const INITIAL_USERS: User[] = [];

export const INITIAL_ISSUES: Issue[] = [
  {
    id: "iss-001",
    title: "Severe Road Surface Potholes (London)",
    description: "Multiple critical potholes on the main junction in Westminster, near the parliament building. Cars are swerving into oncoming traffic to avoid them, causing a severe hazard during commute hours.",
    category: "Road Hazards",
    severity: "High",
    status: "In Progress",
    upvotes: 48,
    upvotedBy: ["anonymous@hero.org"],
    verifiedBy: ["amit.patel@vmc.gov.in"],
    latitude: 51.5007,
    longitude: -0.1246,
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date(Date.now() - 36 * 3600000).toISOString(), // 36h ago
    creatorEmail: "anonymous@hero.org",
    creatorName: "Anonymous Resident",
    estimatedResolutionDays: 4,
    updates: [
      {
        id: "upd-1",
        text: "Municipal team has inspected the site and spray-marked the target area.",
        date: new Date(Date.now() - 24 * 3600000).toISOString(),
        author: "City Council Admin",
        status: "In Progress",
      },
      {
        id: "upd-2",
        text: "Contractor assigned. Repair scheduled for tomorrow morning.",
        date: new Date(Date.now() - 4 * 3600000).toISOString(),
        author: "City Road Department",
        status: "In Progress",
      },
    ],
  },
  {
    id: "iss-002",
    title: "Broken Streetlight near Golden Gate Park (San Francisco)",
    description: "An entire section of the community pedestrian walkway in Golden Gate Park is completely pitch black. Extremely dangerous at night, safety concern for walking students and evening runners.",
    category: "Streetlights",
    severity: "High",
    status: "Pending",
    upvotes: 32,
    upvotedBy: [],
    verifiedBy: [],
    latitude: 37.7694,
    longitude: -122.4862,
    imageUrl: "https://images.unsplash.com/photo-1509024644558-2f060d04b1a3?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(), // 12h ago
    creatorEmail: "anonymous@hero.org",
    creatorName: "Anonymous Resident",
    estimatedResolutionDays: 5,
    updates: [],
  },
  {
    id: "iss-003",
    title: "Clogged Storm Drain Water Leakage (Vadodara)",
    description: "Water has backed up into the sidewalk in Alkapuri due to heavy leaves blockage and plastic waste clogging the storm drain. Minor flooding starting near local shops.",
    category: "Water & Sanitation",
    severity: "Medium",
    status: "Verifying",
    upvotes: 18,
    upvotedBy: [],
    verifiedBy: [],
    latitude: 22.3120,
    longitude: 73.1780,
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(), // 6h ago
    creatorEmail: "rajesh@shahfamily.org", // reported by current user
    creatorName: "Rajesh Shah (Akota Resident)",
    estimatedResolutionDays: 3,
    updates: [
      {
        id: "upd-3",
        text: "Citizen reported. Dispatch requested.",
        date: new Date(Date.now() - 5 * 3600000).toISOString(),
        author: "Automated System",
        status: "Verifying",
      }
    ],
  },
  {
    id: "iss-004",
    title: "Illegal Trash Dumping near Shibuya Crossing (Tokyo)",
    description: "Old mattresses, tires, and broken television sets dumped right at a pedestrian alleyway near Shibuya Crossing. Attracting vermin and blocking sidewalk access.",
    category: "Waste Management",
    severity: "High",
    status: "Resolved",
    upvotes: 54,
    upvotedBy: ["rajesh@shahfamily.org"],
    verifiedBy: ["rajesh@shahfamily.org"],
    latitude: 35.6595,
    longitude: 139.7004,
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(), // 3 days ago
    creatorEmail: "anonymous@hero.org",
    creatorName: "Anonymous Resident",
    estimatedResolutionDays: 2,
    updates: [
      {
        id: "upd-4",
        text: "Sanitation squad scheduled.",
        date: new Date(Date.now() - 48 * 3600000).toISOString(),
        author: "Municipal Sanitation Department",
        status: "In Progress",
      },
      {
        id: "upd-5",
        text: "Trash cleared and recycled successfully. Alleyway reopened!",
        date: new Date(Date.now() - 10 * 3600000).toISOString(),
        author: "Municipal Sanitation Department",
        status: "Resolved",
      },
    ],
  },
  {
    id: "iss-005",
    title: "Damaged Public Park Benches near Eiffel Tower (Paris)",
    description: "Main seating park benches in Champ de Mars near the Eiffel Tower have been spray-painted over and one bench has broken wooden panels which could cause injury.",
    category: "Public Facilities",
    severity: "Low",
    status: "Pending",
    upvotes: 9,
    upvotedBy: [],
    verifiedBy: [],
    latitude: 48.8556,
    longitude: 2.2986,
    imageUrl: undefined, // Demonstrating fallback category icon
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(), // 3h ago
    creatorEmail: "anonymous@hero.org",
    creatorName: "Anonymous Resident",
    estimatedResolutionDays: 10,
    updates: [],
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    userId: "rajesh@shahfamily.org",
    title: "Case Status Updated",
    message: "Your reported case 'Clogged Storm Drain Water Leakage (Vadodara)' has been moved to Verifying.",
    type: "status_change",
    issueId: "iss-003",
    issueTitle: "Clogged Storm Drain Water Leakage (Vadodara)",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    read: false,
  },
  {
    id: "notif-2",
    userId: "rajesh@shahfamily.org",
    title: "New Dispatch Update",
    message: "City Road Department posted an update on 'Severe Road Surface Potholes (London)' which you follow.",
    type: "new_comment",
    issueId: "iss-001",
    issueTitle: "Severe Road Surface Potholes (London)",
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    read: true,
  }
];

export function getStoredData() {
  const defaultUser: User = {
    email: "admin@vmc.gov.in",
    name: "Official Admin",
    xp: 0,
    badges: [],
    reportedCount: 0,
    verifiedCount: 0,
    level: 1,
    avatarUrl: undefined,
    password: hashPassword("password123"),
  };

  if (typeof window === "undefined") {
    return {
      issues: INITIAL_ISSUES,
      badges: INITIAL_BADGES,
      users: [defaultUser],
      currentUser: defaultUser,
      notifications: INITIAL_NOTIFICATIONS,
    };
  }

  const storedIssues = localStorage.getItem("community_hero_issues");
  const storedBadges = localStorage.getItem("community_hero_badges");
  const storedUsers = localStorage.getItem("community_hero_users");
  const storedCurrentUser = localStorage.getItem("community_hero_current_user");
  const storedNotifications = localStorage.getItem("community_hero_notifications");

  let parsedUsers: User[] = storedUsers ? JSON.parse(storedUsers) : [];
  parsedUsers = parsedUsers.filter(u => {
    const emailLower = u.email.toLowerCase();
    const nameLower = u.name.toLowerCase();
    return !emailLower.includes("elena") && 
           !emailLower.includes("marcus") && 
           !emailLower.includes("sarah") &&
           !emailLower.includes("janup") &&
           !emailLower.includes("janvi") &&
           !emailLower.includes("amit") &&
           !emailLower.includes("rajesh") &&
           !emailLower.includes("pooja") &&
           !emailLower.includes("david") &&
           !nameLower.includes("elena") &&
           !nameLower.includes("marcus") &&
           !nameLower.includes("sarah") &&
           !nameLower.includes("janup") &&
           !nameLower.includes("janvi") &&
           !nameLower.includes("amit") &&
           !nameLower.includes("rajesh") &&
           !nameLower.includes("pooja") &&
           !nameLower.includes("david");
  });

  // Upgrade pre-existing plain text passwords to secure hashed versions
  parsedUsers = parsedUsers.map(u => {
    if (u.password && !isHex64(u.password)) {
      return { ...u, password: hashPassword(u.password) };
    }
    return u;
  });

  if (parsedUsers.length === 0) {
    parsedUsers = [defaultUser];
  }

  let parsedCurrentUser: User = storedCurrentUser ? JSON.parse(storedCurrentUser) : defaultUser;
  const isCUExtra = parsedCurrentUser.email.toLowerCase().includes("elena") ||
                    parsedCurrentUser.email.toLowerCase().includes("marcus") ||
                    parsedCurrentUser.email.toLowerCase().includes("sarah") ||
                    parsedCurrentUser.email.toLowerCase().includes("janup") ||
                    parsedCurrentUser.email.toLowerCase().includes("janvi") ||
                    parsedCurrentUser.email.toLowerCase().includes("amit") ||
                    parsedCurrentUser.email.toLowerCase().includes("rajesh") ||
                    parsedCurrentUser.email.toLowerCase().includes("pooja") ||
                    parsedCurrentUser.email.toLowerCase().includes("david") ||
                    parsedCurrentUser.name.toLowerCase().includes("elena") ||
                    parsedCurrentUser.name.toLowerCase().includes("marcus") ||
                    parsedCurrentUser.name.toLowerCase().includes("sarah") ||
                    parsedCurrentUser.name.toLowerCase().includes("janup") ||
                    parsedCurrentUser.name.toLowerCase().includes("janvi") ||
                    parsedCurrentUser.name.toLowerCase().includes("amit") ||
                    parsedCurrentUser.name.toLowerCase().includes("rajesh") ||
                    parsedCurrentUser.name.toLowerCase().includes("pooja") ||
                    parsedCurrentUser.name.toLowerCase().includes("david");
  if (isCUExtra) {
    parsedCurrentUser = parsedUsers[0] || defaultUser;
  }

  if (parsedCurrentUser.password && !isHex64(parsedCurrentUser.password)) {
    parsedCurrentUser.password = hashPassword(parsedCurrentUser.password);
  }

  return {
    issues: storedIssues ? JSON.parse(storedIssues) : INITIAL_ISSUES,
    badges: storedBadges ? JSON.parse(storedBadges) : INITIAL_BADGES,
    users: parsedUsers,
    currentUser: parsedCurrentUser,
    notifications: storedNotifications ? JSON.parse(storedNotifications) : INITIAL_NOTIFICATIONS,
  };
}

export function saveStoredData(data: {
  issues: Issue[];
  badges: Badge[];
  users: User[];
  currentUser: User;
  notifications?: AppNotification[];
}) {
  if (typeof window !== "undefined") {
    localStorage.setItem("community_hero_issues", JSON.stringify(data.issues));
    localStorage.setItem("community_hero_badges", JSON.stringify(data.badges));
    localStorage.setItem("community_hero_users", JSON.stringify(data.users));
    localStorage.setItem("community_hero_current_user", JSON.stringify(data.currentUser));
    if (data.notifications) {
      localStorage.setItem("community_hero_notifications", JSON.stringify(data.notifications));
    }
  }
}
