# 🏙️ Civic Voice — Hyperlocal Community Problem Solver

> A hackathon project built for the **Community Hero** problem statement.

Civic Voice is an AI-powered civic issue reporting platform that enables citizens to identify, report, verify, track, and resolve hyperlocal community problems — from potholes to broken streetlights — through collaboration, intelligent automation, and gamification.

---

## 🚀 Live Demo

- **Deployed Application:** `https://civic-voice-30697673088.asia-southeast1.run.app`  
- **GitHub Repository:** `https://github.com/JanviPrajapati0210/Civic_Voice`

---

## 🧩 Problem Statement

Communities frequently face issues such as potholes, water leakages, damaged streetlights, waste management concerns, and public infrastructure challenges. Reporting these issues is often fragmented, difficult to track, and lacks transparency. Citizens have no easy way to collaborate, validate, or follow the resolution of local problems.

---

## 💡 Solution Overview

Civic Voice bridges the gap between citizens and local authorities by providing a unified platform where:
- Citizens can **report issues** with photo evidence and GPS location
- Neighbours can **verify and upvote** reports to confirm legitimacy
- Gemini AI **automatically categorises and describes** issues from photos
- A live **map and dashboard** track issue status transparently
- A **gamification system** (XP, badges, leaderboard) drives community participation
- VMC/CMC Officials get a dedicated **admin portal** to moderate, verify, and resolve issues
- **Predictive AI insights** highlight at-risk categories before they escalate
- An **autonomous AI agent** runs silently on every submission — detecting duplicates, scoring priority, and posting a dispatch note without any human trigger
- All reported issues are **stored server-side and shared in real time** across every user, so the entire community sees the same live data

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📸 Image-based Reporting | Upload photo evidence; Gemini Vision auto-fills title, category, and severity |
| 🤖 AI Auto-categorisation | Gemini 2.0 Flash analyses images and text to classify issues intelligently with a local fallback heuristic when API is unavailable |
| 🗺️ Geo-location & Map | Interactive Leaflet map with OpenStreetMap; click to pin exact GPS coordinates |
| ✅ Community Verification | Citizens verify reports made by others to confirm real, authentic issues |
| 👍 Community Upvoting | Residents upvote issues to signal priority to authorities |
| 🔔 Issue Following | Follow any issue to receive in-app notifications on status changes and updates |
| 📊 Real-time Tracking | Issues move through Pending → Verifying → In Progress → Resolved with full update history |
| 🔍 Filter & Search | Filter issues by category and status on both the map and the issue cards list |
| 📈 Impact Dashboard | Recharts-powered analytics: category breakdown, status distribution, resolution stats |
| 🔮 Predictive Insights | Gemini-powered analysis identifies at-risk categories and suggests preventive actions |
| 🤖 Autonomous AI Agent | On every issue submission, a background agent autonomously runs duplicate detection, computes a priority score (0–100), and posts a professional dispatch note — no user action needed |
| 🌐 Real-Time Shared Data | Issues are stored server-side and synced across all users — anyone reporting an issue is instantly visible to every other user on any device or browser, with automatic polling every 30 seconds |
| 🏅 Gamification | XP points on every action, 6 unlockable badges, and a community leaderboard |
| 🏛️ VMC/CMC Official Portal | Admin dashboard for authorities to verify issues, post dispatch updates, flag spam, and manage resolution |
| 🚫 Spam Detection | Officials can flag fraudulent reports; spam issues are hidden from public map views |
| 👤 User Profile | Edit name, email, and avatar; view XP progress, level, and badge unlock progress |
| 🔐 Auth System | Register, login, forgot password, and reset password flows with SHA-256 hashed passwords |
| 🌓 Light / Dark Theme | Full light and dark mode with persistent theme preference |
| 🔔 Push Banners | Real-time in-app notification banners for new updates on followed issues |

---

## 🛠️ Technologies Used

### Frontend
- **React 19** — UI framework
- **TypeScript** — Type-safe development
- **Tailwind CSS v4** — Styling
- **Leaflet.js + OpenStreetMap** — Interactive maps (no API key required)
- **Recharts** — Dashboard charts and data visualisation
- **Lucide React** — Icon system
- **Motion** — Animations

### Backend
- **Express.js** — API server
- **Node.js + TypeScript (tsx)** — Server runtime

### Google Technologies
- **Gemini 2.0 Flash (`@google/genai`)** — Image analysis, issue categorisation, severity prediction, predictive insights
- **Google AI Studio** — Development and deployment platform
- **Google Cloud Run** — Hosting and deployment

### Storage & Auth
- **Server-side shared JSON store** — issues are persisted on the server (`server.ts`) and synced in real time across all users via `/api/issues`, with 30-second polling so every user sees community-wide reports instantly
- **localStorage** — Personal data (auth, badges, XP, theme preference) stored per browser, plus compressed image thumbnails (120×120, ~3KB per issue)
- **Client-side image compression** — Canvas API compresses uploads before storage to prevent quota crashes
- **SHA-256 hashing** (custom pure-JS implementation) — Secure password storage; auto-upgrades legacy plain-text passwords

---

## 🗂️ Project Structure

```
civic-voice/
├── server.ts                  # Express server + Gemini API routes
├── src/
│   ├── App.tsx                # Main application, state management, routing
│   ├── mockData.ts            # Seed data and localStorage helpers
│   ├── types.ts               # TypeScript interfaces
│   ├── components/
│   │   ├── AuthPage.tsx       # Login / Register / Forgot & Reset Password
│   │   ├── HomeView.tsx       # Landing/home screen
│   │   ├── ReportForm.tsx     # Issue reporting with Gemini AI auto-fill
│   │   ├── InteractiveMap.tsx # Leaflet map with issue markers and location picker
│   │   ├── Dashboard.tsx      # Analytics, charts, and predictive insights
│   │   ├── Leaderboard.tsx    # Community XP rankings
│   │   ├── Profile.tsx        # User profile, badge progress, settings
│   │   ├── VmcPortal.tsx      # Official CMC admin portal with spam controls
│   │   └── IssueDetailsModal.tsx # Issue detail, updates, verify, upvote, follow
│   └── utils/
│       ├── crypto.ts          # SHA-256 password hashing
│       └── imageCompressor.ts # Client-side canvas image compression
├── .env.example
├── package.json
└── vite.config.ts
```

---

## ⚙️ Running Locally

**Prerequisites:** Node.js 18+

```bash
# 1. Clone the repository
git clone https://github.com/JanviPrajapati0210/Civic_Voice
cd civic-voice

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# 4. Start the development server
npm run dev
```

App runs at `http://localhost:3000`

**Demo credentials:**
- Email: `admin@vmc.gov.in` | Password: `password123` (CMC Official / Admin access)
- Or register a new citizen account from the login screen

---

## 🌐 Deployment

Deployed via **Google AI Studio** to **Google Cloud Run**.

---

## 👤 Author

**Janvi Prajapati**
