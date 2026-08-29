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
  penaltySettings?: any;
  events?: any[];
  nudges?: any[];
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

// Resilient server household store initializer
function getPrimaryServerHousehold(): ServerHouseholdRecord | null {
  const values = Object.values(householdsMemoryStore);
  if (values.length === 0) return null;
  // Return the most recently updated or first household
  return values.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0];
}

// Get the primary / active household for new devices connecting for the first time
app.get("/api/household/primary", (req, res) => {
  try {
    const primary = getPrimaryServerHousehold();
    if (!primary) {
      return res.status(404).json({ error: "No primary household found" });
    }
    return res.json({ success: true, household: primary });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

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
    if (req.body.penaltySettings !== undefined) existing.penaltySettings = req.body.penaltySettings;
    if (Array.isArray(req.body.events)) existing.events = req.body.events;
    if (Array.isArray(req.body.nudges)) existing.nudges = req.body.nudges;

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

// Daily penalty settle job endpoint (triggered by schedule/cron or background heartbeat)
app.post("/api/household/:id/settle-penalties", (req, res) => {
  try {
    const hhId = req.params.id;
    const hh = householdsMemoryStore[hhId];
    if (!hh) {
      return res.status(404).json({ error: "Household not found" });
    }

    const members = hh.members || [];
    const chores = hh.chores || [];
    const logs = hh.logs || [];
    const events = hh.events || [];
    const penaltySettings = hh.penaltySettings || {
      shipDate: "2026-08-29T00:00:00.000Z",
      allowNegativeBalance: false,
      latenessTiers: {
        tier1MaxDays: 1,
        tier2MaxDays: 2,
        tier3MaxDays: 6,
        tier3DeductionPercent: 0.25,
        tier4MinDays: 7,
        tier4DeductionPercent: 1.0,
      },
    };

    const now = new Date();
    const shipDate = new Date(penaltySettings.shipDate || "2026-08-29T00:00:00.000Z");
    const deductionsApplied: any[] = [];

    // Helper: calculate days late
    function getDaysLate(dateStr: string, extDateStr?: string) {
      const targetStr = extDateStr || dateStr;
      const [y, m, d] = targetStr.split("-").map(Number);
      const dueDate = new Date(y, m - 1, d, 23, 59, 59);
      if (now.getTime() <= dueDate.getTime()) return 0;
      const baseDate = dueDate.getTime() < shipDate.getTime() ? shipDate : dueDate;
      return Math.max(0, Math.floor((now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Process all active logs and chores
    for (const log of logs) {
      if (log.status === "approved" || log.penaltyWaived) continue;

      const chore = chores.find((c: any) => c.id === log.choreId);
      if (!chore) continue;

      const daysLate = getDaysLate(log.originalDueDate || log.date, log.extendedDueDate);
      log.daysLate = daysLate;

      // Check if 7+ days late -> mark missed
      if (daysLate >= (penaltySettings.latenessTiers?.tier4MinDays || 7) && !log.isMissed) {
        log.isMissed = true;
      }

      // Check tier deductions
      let targetTier = 0;
      let deductionPct = 0;
      if (daysLate >= 7 || log.isMissed) {
        targetTier = 4;
        deductionPct = penaltySettings.latenessTiers?.tier4DeductionPercent || 1.0;
      } else if (daysLate >= 3) {
        targetTier = 3;
        deductionPct = penaltySettings.latenessTiers?.tier3DeductionPercent || 0.25;
      }

      if (targetTier > 0) {
        const eventId = `${log.choreId}_tier_${targetTier}_${log.date}`;
        // Verify this specific tier deduction has not already been applied
        const alreadyApplied = events.some((e: any) => e.id === eventId);
        if (!alreadyApplied) {
          const memberIndex = members.findIndex((m: any) => m.id === log.memberId);
          if (memberIndex !== -1) {
            const member = members[memberIndex];
            const rawDeduction = Math.round(chore.defaultPoints * deductionPct);
            const pointsBefore = member.currentPoints || 0;
            let pointsAfter = pointsBefore - rawDeduction;

            if (!penaltySettings.allowNegativeBalance && pointsAfter < 0) {
              pointsAfter = 0;
            }
            const actualDelta = pointsAfter - pointsBefore;

            member.currentPoints = pointsAfter;
            log.deductionApplied = (log.deductionApplied || 0) + Math.abs(actualDelta);

            const newEvent = {
              id: eventId,
              householdId: hhId,
              type: "penalty_applied",
              memberId: member.id,
              memberName: member.name,
              choreId: chore.id,
              choreTitle: chore.title,
              pointsBefore,
              pointsAfter,
              pointsDelta: actualDelta,
              tier: targetTier,
              reason: `${daysLate} days late penalty tier ${targetTier} (${Math.round(deductionPct * 100)}% deduction)`,
              weekNumber: Math.ceil(now.getDate() / 7),
              year: now.getFullYear(),
              createdAt: now.toISOString(),
            };

            events.unshift(newEvent);
            deductionsApplied.push(newEvent);
          }
        }
      }
    }

    hh.updatedAt = now.toISOString();
    hh.version = (hh.version || 0) + 1;
    saveHouseholdStore();

    return res.json({
      success: true,
      deductionsCount: deductionsApplied.length,
      deductions: deductionsApplied,
      updatedAt: hh.updatedAt,
    });
  } catch (err: any) {
    console.error("Settle penalties error:", err);
    return res.status(500).json({ error: err.message || "Failed to settle penalties" });
  }
});

// Post a Nudge to a member
app.post("/api/household/:id/nudge", (req, res) => {
  try {
    const hhId = req.params.id;
    const { memberId, memberName, senderRole, senderName, message, choreId, choreTitle } = req.body;
    const hh = householdsMemoryStore[hhId];
    if (!hh) return res.status(404).json({ error: "Household not found" });

    const now = new Date().toISOString();
    const nudgeId = "nudge_" + Math.random().toString(36).substring(2, 10);
    const newNudge = {
      id: nudgeId,
      householdId: hhId,
      memberId,
      memberName,
      senderRole: senderRole || "parent",
      senderName: senderName || "Mom",
      message: message || "Hey! Please check your chores before tonight! ⭐",
      choreId,
      choreTitle,
      createdAt: now,
      acknowledged: false,
    };

    if (!Array.isArray(hh.nudges)) hh.nudges = [];
    hh.nudges.unshift(newNudge);

    // Also log to events
    if (!Array.isArray(hh.events)) hh.events = [];
    hh.events.unshift({
      id: "evt_" + nudgeId,
      householdId: hhId,
      type: "nudge_sent",
      memberId,
      memberName,
      choreId,
      choreTitle,
      reason: message,
      weekNumber: Math.ceil(new Date().getDate() / 7),
      year: new Date().getFullYear(),
      createdAt: now,
    });

    hh.updatedAt = now;
    hh.version = (hh.version || 0) + 1;
    saveHouseholdStore();

    return res.json({ success: true, nudge: newNudge });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
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
