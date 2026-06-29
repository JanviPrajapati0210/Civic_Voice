export interface IssueUpdate {
  id: string;
  text: string;
  date: string;
  author: string;
  status: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: "Road Hazards" | "Water & Sanitation" | "Streetlights" | "Waste Management" | "Public Facilities" | "Vandals & Safety" | "Others";
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "Verifying" | "In Progress" | "Resolved";
  upvotes: number;
  upvotedBy: string[]; // List of user emails
  verifiedBy: string[]; // List of citizen verification user emails
  latitude: number;
  longitude: number;
  imageUrl?: string;
  createdAt: string; // ISO date
  creatorEmail: string;
  creatorName: string;
  estimatedResolutionDays: number;
  updates: IssueUpdate[];
  // VMC Official parameters
  vmcVerified?: boolean;
  vmcVerificationNotes?: string;
  vmcVerifiedAt?: string;
  isSpam?: boolean;
  followedBy?: string[]; // Users explicitly following this issue
}

export interface User {
  email: string;
  name: string;
  xp: number;
  badges: string[]; // ids of badges
  reportedCount: number;
  verifiedCount: number;
  level: number;
  avatarUrl?: string;
  password?: string; // Optional field for authentication
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string; // Lucide icon
  color: string; // tailwind classes
  borderColor: string;
  unlockedAt?: string;
  xpRequired?: number;
  verifiedRequired?: number;
  reportedRequired?: number;
}

export interface PredictiveInsights {
  generalTrend: string;
  categoriesAtRisk: Array<{
    category: string;
    riskLevel: "Low" | "Medium" | "High" | "Critical";
    reason: string;
  }>;
  suggestedActions: string[];
  communityTip: string;
}

export interface AppNotification {
  id: string;
  userId: string; // Recipient user email
  title: string;
  message: string;
  type: "status_change" | "new_comment" | "resolved" | "general";
  issueId?: string;
  issueTitle?: string;
  createdAt: string;
  read: boolean;
}

