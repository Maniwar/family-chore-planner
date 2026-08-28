import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Gemini client helper
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// OAuth Client ID config endpoints
app.get(["/api/auth/client-id", "/api/oauth/client-id"], (req, res) => {
  let clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.OAUTH_CLIENT_ID ||
    process.env.CLIENT_ID ||
    process.env.GOOGLE_OAUTH_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        if (config.oAuthClientId) {
          clientId = config.oAuthClientId;
        }
      }
    } catch (e) {
      console.warn("Could not read firebase-applet-config.json:", e);
    }
  }

  if (!clientId) {
    clientId = "695929293431-nsu6ggrtjokv5ififpepebt5su3rtsmp.apps.googleusercontent.com";
  }

  res.json({ clientId, client_id: clientId });
});

// AI Smart Auto-Assignment Endpoint
app.post("/api/ai/auto-assign", async (req, res) => {
  try {
    const { members, chores, focusGoal, includeParents } = req.body;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "Household members are required" });
    }
    if (!chores || !Array.isArray(chores) || chores.length === 0) {
      return res.status(400).json({ error: "Chores list is required" });
    }

    const ai = getGeminiClient();

    const prompt = `
You are an expert pediatric child development specialist and family household organization coach.
Analyze the following household members and household chores to intelligently and fairly auto-assign each chore based on age, developmental stage, difficulty, and balanced workload.

Household Members:
${JSON.stringify(members, null, 2)}

Chores to Assign:
${JSON.stringify(chores, null, 2)}

Configuration Options:
- Focus Goal: ${focusGoal || 'balanced_developmental'} (e.g. balanced_developmental, skill_building, rotation)
- Include Parents in Routine Chores: ${includeParents ? 'Yes' : 'No (assign primarily to children/teens, only give parents complex supervisory/safety tasks if necessary)'}

Rules for Age-Based Assignment:
1. Age 3-5 (Toddlers & Preschoolers, e.g. Sven): Simple playful 1-step motor tasks (put toys/blocks into bins, fluff couch cushions & pillows, align teddy bears).
2. Age 6-9 (Elementary, e.g. Layla): Multi-step routine tasks (water garden flower pots, unload silverware & dishes, make bed, clear dinner table & sweep under chairs, restock bathroom towels).
3. Age 10-17 (Pre-teens & High School): Responsible multi-room chores (load dishwasher, sweep patio/driveway, dust consoles/shelves, fold laundry, scrub bathroom sinks).
4. Age 18-21+ (Young Adults & Teens, e.g. Theena, Ashbelle): Comprehensive household duties (hand-wash pots & pans, disinfect toilet bowls & bases, pull garden weeds, strip bed linens, vacuum rugs & stairs).
5. Parents / Adults (e.g. Mani, Hilda): Major home upkeep, power lawn mowing & edging, deep counter/cooktop degreasing, curbside trash/recycling bins, and master laundry cycles.
6. Ensure an age-appropriate balance of points and effort so every family member feels appreciated and not overwhelmed.
7. Provide an encouraging, developmental reason for each assignment explaining why it fits that specific member's age and skills.

Return your response strictly adhering to the JSON schema.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fairnessSummary: {
              type: Type.STRING,
              description: "A friendly 2-3 sentence overview explaining how this chore schedule promotes teamwork and age-appropriate growth.",
            },
            fairnessRating: {
              type: Type.NUMBER,
              description: "A score from 1 to 100 assessing how well balanced the chore distribution is.",
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  choreId: { type: Type.STRING },
                  choreTitle: { type: Type.STRING },
                  assignedMemberId: { type: Type.STRING },
                  assignedMemberName: { type: Type.STRING },
                  reason: { type: Type.STRING, description: "Why this chore is ideal for this member based on their age, role, and capabilities." },
                  developmentalFocus: { type: Type.STRING, description: "E.g. Motor Skills, Responsibility, Independence, Teamwork" },
                  confidenceScore: { type: Type.NUMBER, description: "Score 1-100" },
                  recommendedTimeOfDay: { type: Type.STRING, description: "morning, afternoon, evening, bedtime, or anytime" },
                },
                required: ["choreId", "choreTitle", "assignedMemberId", "assignedMemberName", "reason", "developmentalFocus", "confidenceScore"],
              },
            },
            ageTierInsights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  memberId: { type: Type.STRING },
                  memberName: { type: Type.STRING },
                  age: { type: Type.NUMBER },
                  assignedChoresCount: { type: Type.NUMBER },
                  totalPoints: { type: Type.NUMBER },
                  insight: { type: Type.STRING, description: "Specific encouraging developmental feedback for this child." },
                },
                required: ["memberId", "memberName", "assignedChoresCount", "totalPoints", "insight"],
              },
            },
          },
          required: ["fairnessSummary", "fairnessRating", "suggestions", "ageTierInsights"],
        },
      },
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);
    return res.json(result);
  } catch (error: any) {
    console.error("AI Auto-Assign error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate AI auto-assignment",
    });
  }
});

// AI Household Coach / Chore Advice Endpoint
app.post("/api/ai/chore-advice", async (req, res) => {
  try {
    const { question, members, chores } = req.body;
    const ai = getGeminiClient();

    const prompt = `
You are a warm, practical family organization coach and child behavior expert helping a parent manage household chores smoothly.
Family Members: ${JSON.stringify(members || [])}
Current Chores: ${JSON.stringify(chores || [])}

Parent Question: "${question}"

Provide helpful, empathetic, concise, and structured advice. Use bullet points and practical suggestions for routines, positive reinforcement, allowance, or age-appropriate chore checklists.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    return res.json({ advice: response.text || "Here is your household guidance." });
  } catch (error: any) {
    console.error("AI Advice error:", error);
    return res.status(500).json({ error: error.message || "Failed to get AI advice" });
  }
});

// ==========================================
// RESILIENT SERVER-BACKED CLOUD HOUSEHOLD SYNC
// ==========================================

const HOUSEHOLD_DATA_DIR = path.join(process.cwd(), ".data");
const HOUSEHOLD_STORE_FILE = path.join(HOUSEHOLD_DATA_DIR, "households.json");

interface ServerHouseholdRecord {
  id: string;
  householdCode: string;
  familyName: string;
  houseAddressOrMotto?: string;
  housePhotoUrl?: string;
  adminPin?: string;
  pinProtectionEnabled?: boolean;
  joinPassphrase?: string;
  members?: any[];
  chores?: any[];
  logs?: any[];
  rewards?: any[];
  claims?: any[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

let householdsMemoryStore: Record<string, ServerHouseholdRecord> = {};

function initHouseholdStore() {
  try {
    if (!fs.existsSync(HOUSEHOLD_DATA_DIR)) {
      fs.mkdirSync(HOUSEHOLD_DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(HOUSEHOLD_STORE_FILE)) {
      const data = fs.readFileSync(HOUSEHOLD_STORE_FILE, "utf-8");
      householdsMemoryStore = JSON.parse(data);
    }
  } catch (e) {
    console.warn("Could not load stored households file, using memory store:", e);
  }
}

function saveHouseholdStore() {
  try {
    if (!fs.existsSync(HOUSEHOLD_DATA_DIR)) {
      fs.mkdirSync(HOUSEHOLD_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(HOUSEHOLD_STORE_FILE, JSON.stringify(householdsMemoryStore, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not persist households to disk:", e);
  }
}

initHouseholdStore();

// Create a new household on server
app.post("/api/household/create", (req, res) => {
  try {
    const { id, householdCode, familyName, houseAddressOrMotto, housePhotoUrl, adminPin, pinProtectionEnabled, joinPassphrase, members, chores, logs, rewards, claims } = req.body;
    const now = new Date().toISOString();
    const hhId = id || "hh_" + Math.random().toString(36).substring(2, 11);
    const code = (householdCode || "NEST-" + Math.random().toString(36).substring(2, 6)).toUpperCase();

    const record: ServerHouseholdRecord = {
      id: hhId,
      householdCode: code,
      familyName: familyName || "Our Family Home",
      houseAddressOrMotto: houseAddressOrMotto || "Clean spaces, happy smiles & teamwork! ✨",
      housePhotoUrl: housePhotoUrl || "",
      adminPin: adminPin || "1234",
      pinProtectionEnabled: pinProtectionEnabled !== undefined ? Boolean(pinProtectionEnabled) : true,
      joinPassphrase: joinPassphrase || undefined,
      members: Array.isArray(members) ? members : [],
      chores: Array.isArray(chores) ? chores : [],
      logs: Array.isArray(logs) ? logs : [],
      rewards: Array.isArray(rewards) ? rewards : [],
      claims: Array.isArray(claims) ? claims : [],
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    householdsMemoryStore[hhId] = record;
    saveHouseholdStore();

    return res.json({ success: true, household: record });
  } catch (err: any) {
    console.error("Create household API error:", err);
    return res.status(500).json({ error: err.message || "Failed to create household" });
  }
});

// Look up household by code or ID flexibly
app.get("/api/household/by-code/:code", (req, res) => {
  try {
    const raw = (req.params.code || "").trim();
    const searchCode = raw.toUpperCase();
    const cleanSearch = searchCode.replace(/[^A-Z0-9]/g, "");

    const found = Object.values(householdsMemoryStore).find((h) => {
      if (!h) return false;
      const hCode = (h.householdCode || "").toUpperCase();
      const hCleanCode = hCode.replace(/[^A-Z0-9]/g, "");
      const hId = (h.id || "").toLowerCase();

      return (
        hCode === searchCode ||
        hCleanCode === cleanSearch ||
        hId === raw.toLowerCase() ||
        h.id === raw
      );
    });

    if (!found) {
      return res.status(404).json({ error: "Household not found" });
    }

    return res.json({ success: true, household: found });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to search household" });
  }
});

// Fetch full household by ID
app.get("/api/household/:id", (req, res) => {
  try {
    const hh = householdsMemoryStore[req.params.id];
    if (!hh) {
      return res.status(404).json({ error: "Household not found" });
    }
    return res.json({ success: true, household: hh });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Sync / update household data across all devices
app.post("/api/household/:id/sync", (req, res) => {
  try {
    const hhId = req.params.id;
    const { familyName, houseAddressOrMotto, housePhotoUrl, householdCode, adminPin, pinProtectionEnabled, joinPassphrase, members, chores, logs, rewards, claims, version } = req.body;
    
    let existing = householdsMemoryStore[hhId];
    const now = new Date().toISOString();

    if (!existing) {
      existing = {
        id: hhId,
        householdCode: householdCode || "HERO-8K2Q",
        familyName: familyName || "Our Family Home",
        houseAddressOrMotto: houseAddressOrMotto || "",
        housePhotoUrl: housePhotoUrl || "",
        adminPin: adminPin || "1234",
        pinProtectionEnabled: pinProtectionEnabled !== undefined ? Boolean(pinProtectionEnabled) : true,
        createdAt: now,
        updatedAt: now,
        version: 1,
      };
    }

    if (familyName !== undefined) existing.familyName = familyName;
    if (houseAddressOrMotto !== undefined) existing.houseAddressOrMotto = houseAddressOrMotto;
    if (housePhotoUrl !== undefined) existing.housePhotoUrl = housePhotoUrl;
    if (adminPin !== undefined) existing.adminPin = adminPin;
    if (pinProtectionEnabled !== undefined) existing.pinProtectionEnabled = Boolean(pinProtectionEnabled);
    if (joinPassphrase !== undefined) existing.joinPassphrase = joinPassphrase;
    if (Array.isArray(members)) existing.members = members;
    if (Array.isArray(chores)) existing.chores = chores;
    if (Array.isArray(logs)) existing.logs = logs;
    if (Array.isArray(rewards)) existing.rewards = rewards;
    if (Array.isArray(claims)) existing.claims = claims;

    existing.updatedAt = now;
    existing.version = (existing.version || 0) + 1;

    householdsMemoryStore[hhId] = existing;
    saveHouseholdStore();

    return res.json({ success: true, household: existing });
  } catch (err: any) {
    console.error("Household sync API error:", err);
    return res.status(500).json({ error: err.message || "Failed to sync household" });
  }
});

// Long-polling / fast poll endpoint for multi-device live sync
app.get("/api/household/:id/poll", (req, res) => {
  try {
    const hhId = req.params.id;
    const since = req.query.since ? String(req.query.since) : null;
    const hh = householdsMemoryStore[hhId];

    if (!hh) {
      return res.status(404).json({ error: "Household not found" });
    }

    // Return if changed since provided timestamp or version
    if (!since || hh.updatedAt !== since) {
      return res.json({ hasUpdate: true, household: hh });
    }

    return res.json({ hasUpdate: false, updatedAt: hh.updatedAt });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Start server function with Vite middleware for dev / static for prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
