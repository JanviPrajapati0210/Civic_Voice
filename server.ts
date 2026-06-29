import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" })); // allow larger payload for base64 images

const PORT = 3000;

// Initialize Gemini client on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to fetch external image URLs and convert them to base64 for Gemini
async function getBase64FromUrl(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return {
      data: buffer.toString("base64"),
      mimeType: contentType,
    };
  } catch (error) {
    console.warn("Notice: Error fetching image URL:", error);
    return null;
  }
}

// Fallback Helper Functions for high-availability resilience when Gemini API is busy/unavailable
function generateFallbackAnalyze(text: string) {
  const normalized = (text || "").toLowerCase();
  
  let category = "Others";
  if (normalized.includes("road") || normalized.includes("pothole") || normalized.includes("pavement") || normalized.includes("crack") || normalized.includes("driveway") || normalized.includes("asphalt")) {
    category = "Road Hazards";
  } else if (normalized.includes("water") || normalized.includes("leak") || normalized.includes("pipe") || normalized.includes("clog") || normalized.includes("drain") || normalized.includes("flood") || normalized.includes("sewage")) {
    category = "Water & Sanitation";
  } else if (normalized.includes("light") || normalized.includes("bulb") || normalized.includes("dark") || normalized.includes("street-light") || normalized.includes("lamp") || normalized.includes("electricity")) {
    category = "Streetlights";
  } else if (normalized.includes("garbage") || normalized.includes("trash") || normalized.includes("waste") || normalized.includes("dump") || normalized.includes("litter") || normalized.includes("bin")) {
    category = "Waste Management";
  } else if (normalized.includes("park") || normalized.includes("bench") || normalized.includes("library") || normalized.includes("hall") || normalized.includes("playground") || normalized.includes("facility")) {
    category = "Public Facilities";
  } else if (normalized.includes("graffiti") || normalized.includes("vandal") || normalized.includes("broken glass") || normalized.includes("stolen") || normalized.includes("theft") || normalized.includes("safety")) {
    category = "Vandals & Safety";
  }

  let severity = "Low";
  if (normalized.includes("urgent") || normalized.includes("critical") || normalized.includes("danger") || normalized.includes("hazard") || normalized.includes("risk") || normalized.includes("emergency") || normalized.includes("blocking")) {
    severity = "Critical";
  } else if (normalized.includes("accident") || normalized.includes("high") || normalized.includes("severe") || normalized.includes("broken") || normalized.includes("damage")) {
    severity = "High";
  } else if (normalized.includes("medium") || normalized.includes("moderate") || normalized.includes("prevent")) {
    severity = "Medium";
  }

  let title = text ? (text.length > 50 ? text.substring(0, 47) + "..." : text) : "New Community Issue";
  title = title.charAt(0).toUpperCase() + title.slice(1);

  let description = text || "No detailed description was provided. The issue has been registered with our community team.";
  if (description.length < 20) {
    description = `Reported ${category} complaint: ${description}. Inspection scheduled for municipal resolution.`;
  }

  const estimatedResolutionDays = severity === "Critical" ? 2 : severity === "High" ? 4 : severity === "Medium" ? 7 : 14;

  return {
    title,
    category,
    severity,
    description: `[Diagnostic Fallback] ${description}`,
    estimatedResolutionDays,
  };
}

function generateFallbackInsights(issues: any[]) {
  const counts: Record<string, number> = {};
  const validIssues = (issues || []).filter(i => !i.isSpam);
  validIssues.forEach((i) => {
    const cat = i.category || "Others";
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const primaryAtRisk = sorted[0]?.[0] || "Road Hazards";
  const secondaryAtRisk = sorted[1]?.[0] || "Water & Sanitation";

  return {
    generalTrend: `Community activity analysis shows active reports concentrated in "${primaryAtRisk}". Proactive municipal team response is stabilizing local zones.`,
    categoriesAtRisk: [
      {
        category: primaryAtRisk,
        riskLevel: sorted[0]?.[1] && sorted[0][1] > 3 ? "High" : "Medium",
        reason: `High concentration of community reports (${sorted[0]?.[1] || 1} cases) indicates elevated maintenance needs in this sector.`,
      },
      {
        category: secondaryAtRisk,
        riskLevel: "Medium",
        reason: "Steady inflow of civic logs calls for preventive maintenance to avoid degradation.",
      },
    ],
    suggestedActions: [
      `Deploy targeted repair crews to hotspots identified in "${primaryAtRisk}".`,
      "Enforce rigorous municipal checks before season changes to minimize infrastructure stress.",
      "Incentivize local citizen hero sign-ups to report issues before they become critical."
    ],
    communityTip: "Help keep our neighborhood safe! Snap a clear, well-lit picture when reporting issues to help our municipal teams locate and analyze problems faster.",
  };
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// 1. Analyze Issue Endpoint: Auto-fill, Categorization, and Severity Prediction
app.post("/api/gemini/analyze-issue", async (req, res) => {
  try {
    const { text, imageBase64, mimeType } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      console.warn("Gemini API Key missing, generating fallback analysis.");
      return res.json(generateFallbackAnalyze(text));
    }

    let contents: any[] = [];

    if (imageBase64) {
      if (imageBase64.startsWith("http://") || imageBase64.startsWith("https://")) {
        const imgRes = await getBase64FromUrl(imageBase64);
        if (imgRes) {
          contents.push({
            inlineData: {
              mimeType: imgRes.mimeType,
              data: imgRes.data,
            },
          });
        }
      } else {
        const cleanBase64 = imageBase64.startsWith("data:") 
          ? imageBase64.replace(/^data:image\/\w+;base64,/, "")
          : imageBase64;
        const resolvedMime = imageBase64.startsWith("data:")
          ? (imageBase64.match(/^data:([^;]+);base64,/)?.[1] || "image/jpeg")
          : (mimeType || "image/jpeg");
        
        contents.push({
          inlineData: {
            mimeType: resolvedMime,
            data: cleanBase64,
          },
        });
      }
    }

    // Prepare the system instructions/prompt
    const promptText = `
      You are an advanced AI Community Infrastructure assistant. Analyze this reported local community issue.
      ${text ? `User Description of the issue: "${text}"` : ""}
      ${imageBase64 ? "An image has been provided. Analyze the visual elements to understand the issue." : ""}

      Categorize it, predict the severity level, and refine the description so that local municipality workers can action it easily.
      Provide an estimated resolution days (an integer value) based on typical city repair workflows.
    `;

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are an expert civic engineer and hyperlocal community issue resolver. Your role is to classify, assess, and suggest actionable repair timelines for citizen complaints.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A concise, professional title summarizing the issue." },
            category: { type: Type.STRING, description: "Must be exactly one of: 'Road Hazards', 'Water & Sanitation', 'Streetlights', 'Waste Management', 'Public Facilities', 'Vandals & Safety', or 'Others'." },
            severity: { type: Type.STRING, description: "The urgency of the issue. Must be exactly one of: 'Low', 'Medium', 'High', 'Critical'." },
            description: { type: Type.STRING, description: "A clean, grammatically polished, professional, and descriptive paragraph outlining the issue clearly for maintenance crews." },
            estimatedResolutionDays: { type: Type.INTEGER, description: "A realistic repair estimate in days (integer)." },
          },
          required: ["title", "category", "severity", "description", "estimatedResolutionDays"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response returned from Gemini API");
    }

    const resultJson = JSON.parse(resultText.trim());
    return res.json(resultJson);
  } catch (error: any) {
    console.log("[Civic Hub Service Status] Gemini API is currently offline or busy. Safely routing to local civic heuristic model.");
    return res.json(generateFallbackAnalyze(req.body.text));
  }
});

// 3. Smart Scene Extraction: Detailed visual hazard telemetry analysis using Gemini API
app.post("/api/gemini/extract-scene", async (req, res) => {
  const { title, description, category, severity, imageBase64, mimeType } = req.body;
  
  const fallbackResponse = {
    elements: [
      category || "General civic issue",
      "Structural integrity evaluation",
      "Community space hazard assessment"
    ],
    riskScore: severity === "Critical" ? 92 : severity === "High" ? 74 : severity === "Medium" ? 48 : 18,
    recommendedActions: [
      "Inspect matching physical coordinates on site.",
      `Dispatch standard ${category || "civic"} team for visual audit.`,
      "Check adjacent property lines for public asset risks."
    ],
    officialSummary: `[Resilient Analysis Fallback] Dispatch scheduled. Physical evaluation recommended based on local category risk profiles. (Category: ${category || "Others"})`
  };

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Gemini API Key missing, generating fallback scene extraction.");
      return res.json(fallbackResponse);
    }

    let contents: any[] = [];

    if (imageBase64) {
      if (imageBase64.startsWith("http://") || imageBase64.startsWith("https://")) {
        const imgRes = await getBase64FromUrl(imageBase64);
        if (imgRes) {
          contents.push({
            inlineData: {
              mimeType: imgRes.mimeType,
              data: imgRes.data,
            },
          });
        }
      } else {
        const cleanBase64 = imageBase64.startsWith("data:") 
          ? imageBase64.replace(/^data:image\/\w+;base64,/, "")
          : imageBase64;
        const resolvedMime = imageBase64.startsWith("data:")
          ? (imageBase64.match(/^data:([^;]+);base64,/)?.[1] || "image/jpeg")
          : (mimeType || "image/jpeg");
        
        contents.push({
          inlineData: {
            mimeType: resolvedMime,
            data: cleanBase64,
          },
        });
      }
    }

    const promptText = `
      You are a senior municipal safety auditor for the City Municipal Council (CMC).
      Analyze the reported community issue:
      Title: "${title || ""}"
      Description: "${description || ""}"
      Category: "${category || ""}"
      Claimed Severity: "${severity || ""}"

      Perform a rigorous, professional scene extraction and hazard breakdown.
      Identify key physical, structural, or environmental elements detected in the scene (especially if an image is provided).
      Calculate a realistic numerical hazard risk score between 0 and 100 based on public risk metrics.
      Suggest 3 practical, actionable preventative action plans or dispatch instructions for municipal repair crews.
      Write a concise, professional engineering assessment summary (1-2 sentences).
    `;

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are an expert civic engineer and safety risk assessment auditor. Evaluate reported community issues and extract structural risks and dispatch directives.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            elements: {
              type: Type.ARRAY,
              description: "Detected physical, safety, or structural elements (e.g. cracked asphalt, flooded trench, missing safety barrier).",
              items: { type: Type.STRING },
            },
            riskScore: {
              type: Type.INTEGER,
              description: "A computed hazard severity score between 0 and 100."
            },
            recommendedActions: {
              type: Type.ARRAY,
              description: "Recommended immediate actions for municipal workers.",
              items: { type: Type.STRING },
            },
            officialSummary: {
              type: Type.STRING,
              description: "Official summary assessment from the municipal inspector's desk."
            }
          },
          required: ["elements", "riskScore", "recommendedActions", "officialSummary"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response returned from Gemini API during scene extraction");
    }

    const resultJson = JSON.parse(resultText.trim());
    return res.json(resultJson);
  } catch (error: any) {
    console.log("[Civic Hub Service Status] Gemini scene extractor is busy or offline. Activating resilient local safety profile.");
    return res.json(fallbackResponse);
  }
});

// 2. Predictive Insights Endpoint: Analyze all issues to generate future risk analysis
app.post("/api/gemini/predictive-insights", async (req, res) => {
  const { issues } = req.body;

  if (!issues || !Array.isArray(issues)) {
    return res.status(400).json({ error: "Issues array is required." });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Gemini API Key missing, generating fallback insights.");
      return res.json(generateFallbackInsights(issues));
    }

    const issuesSummary = issues.map((issue) => ({
      title: issue.title,
      category: issue.category,
      severity: issue.severity,
      status: issue.status,
      upvotes: issue.upvotes,
      date: issue.createdAt,
    }));

    const promptText = `
      Analyze the following list of active and resolved community issues:
      ${JSON.stringify(issuesSummary, null, 2)}

      Based on these issues, generate community-wide predictive insights, risk analysis, and hotspots.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: "You are a senior Urban Planner and Smart Cities Advisor. Analyze the community complaint logs to find hidden trends, upcoming infrastructure bottlenecks, and actionable recommendations.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            generalTrend: { type: Type.STRING, description: "A high-level urban trend summary (2-3 sentences)." },
            categoriesAtRisk: {
              type: Type.ARRAY,
              description: "List of problem categories predicted to increase in frequency or risk.",
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "The infrastructure category (e.g. Road Hazards, Waste Management)." },
                  riskLevel: { type: Type.STRING, description: "Must be Low, Medium, High, or Critical." },
                  reason: { type: Type.STRING, description: "A short, data-backed explanation for this risk prediction." },
                },
                required: ["category", "riskLevel", "reason"],
              },
            },
            suggestedActions: {
              type: Type.ARRAY,
              description: "Preventative actions the community can take to avoid these issues scaling up.",
              items: { type: Type.STRING },
            },
            communityTip: { type: Type.STRING, description: "An inspiring, positive tip for local citizens to act as community heroes." },
          },
          required: ["generalTrend", "categoriesAtRisk", "suggestedActions", "communityTip"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response returned from Gemini API");
    }

    const resultJson = JSON.parse(resultText.trim());
    return res.json(resultJson);
  } catch (error: any) {
    console.log("[Civic Hub Service Status] Gemini predictive insights are offline or rate-limited. Activating local smart-trend aggregator.");
    return res.json(generateFallbackInsights(issues));
  }
});

// 4. Auto-Agent Endpoint: Autonomous multi-step analysis triggered on every new issue submission
// Steps: (1) duplicate detection, (2) priority scoring, (3) auto dispatch note generation
app.post("/api/gemini/auto-agent", async (req, res) => {
  const { newIssue, existingIssues } = req.body;

  // Fallback if Gemini is unavailable
  const fallbackAgent = () => {
    const severityScore: Record<string, number> = { Critical: 95, High: 72, Medium: 45, Low: 18 };
    const priorityScore = severityScore[newIssue.severity] || 45;

    // Simple duplicate check: same category within ~1km
    const nearby = (existingIssues || []).filter((iss: any) => {
      if (iss.id === newIssue.id || iss.isSpam) return false;
      const dist = Math.sqrt(
        Math.pow((iss.latitude - newIssue.latitude) * 111, 2) +
        Math.pow((iss.longitude - newIssue.longitude) * 111, 2)
      );
      return dist < 1 && iss.category === newIssue.category;
    });

    const isDuplicate = nearby.length > 0;
    const dispatchNote = isDuplicate
      ? `[Auto-Agent] ⚠️ Possible duplicate detected — ${nearby.length} similar ${newIssue.category} issue(s) reported within 1km. Cross-referencing with case ${nearby[0].id}. Priority score: ${priorityScore}/100. Awaiting citizen verification before dispatch.`
      : `[Auto-Agent] ✅ Issue registered and scanned — no nearby duplicates found. Priority score: ${priorityScore}/100. Recommended action: assign ${newIssue.severity === "Critical" || newIssue.severity === "High" ? "immediate" : "standard"} dispatch team for ${newIssue.category}.`;

    return { priorityScore, isDuplicate, nearbyIssueIds: nearby.map((i: any) => i.id), dispatchNote };
  };

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json(fallbackAgent());
    }

    // Summarise existing issues compactly to stay within token limits
    const existingSummary = (existingIssues || [])
      .filter((i: any) => !i.isSpam)
      .slice(0, 20)
      .map((i: any) => ({
        id: i.id,
        title: i.title,
        category: i.category,
        severity: i.severity,
        status: i.status,
        latitude: i.latitude,
        longitude: i.longitude,
      }));

    const prompt = `
You are an autonomous Civic Issue Management Agent for the Civic Voice platform.
A new community issue has just been submitted. Perform the following 3 steps autonomously:

STEP 1 — DUPLICATE DETECTION:
Check if any existing issue is likely a duplicate of the new issue.
A duplicate means: same category AND within approximately 1km geographic distance (use lat/lng to estimate).
List the IDs of any duplicates found. If none, return an empty array.

STEP 2 — PRIORITY SCORING:
Calculate a priority score from 0–100 for this new issue based on:
- Severity level (Critical=90-100, High=65-85, Medium=35-60, Low=10-30)
- Category risk (Road Hazards and Water & Sanitation are highest risk)
- Whether duplicates exist (duplicate = higher community urgency, +10 points)

STEP 3 — AUTO DISPATCH NOTE:
Write a concise, professional first status update (1-2 sentences) for the issue.
Mention the priority score, whether duplicates were found, and recommend a dispatch action.
Prefix it with "[Auto-Agent]".

NEW ISSUE:
${JSON.stringify({ id: newIssue.id, title: newIssue.title, category: newIssue.category, severity: newIssue.severity, latitude: newIssue.latitude, longitude: newIssue.longitude, description: newIssue.description }, null, 2)}

EXISTING ISSUES (last 20):
${JSON.stringify(existingSummary, null, 2)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an autonomous civic infrastructure management agent. Analyse submitted issues, detect duplicates, compute priority scores, and generate professional dispatch notes without any human intervention.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorityScore: { type: Type.INTEGER, description: "Priority score 0-100." },
            isDuplicate: { type: Type.BOOLEAN, description: "True if a likely duplicate exists." },
            nearbyIssueIds: {
              type: Type.ARRAY,
              description: "IDs of duplicate or nearby similar issues.",
              items: { type: Type.STRING },
            },
            dispatchNote: { type: Type.STRING, description: "Professional auto-generated first status update prefixed with [Auto-Agent]." },
          },
          required: ["priorityScore", "isDuplicate", "nearbyIssueIds", "dispatchNote"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from Gemini auto-agent");

    const result = JSON.parse(resultText.trim());
    return res.json(result);
  } catch (error: any) {
    console.log("[Auto-Agent] Gemini unavailable, running local agent fallback.");
    return res.json(fallbackAgent());
  }
});

// Configure Vite or Static Assets serving
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully booted on http://localhost:${PORT}`);
  });
}

initializeServer();