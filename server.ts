import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Firebase SDK for server-side persistence
let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (e) {
  console.warn("Could not load firebase-applet-config.json:", e);
}

const fbApp = !getApps().length && firebaseConfig ? initializeApp(firebaseConfig) : (getApps().length ? getApp() : null);
const db = fbApp ? getFirestore(fbApp, firebaseConfig?.firestoreDatabaseId) : null;


// Lazy Gemini client helper (supports Bring Your Own Key or server-configured key)
function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = (customApiKey && customApiKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("No Gemini API key provided. Please enter your Google Gemini API key in Settings or contact the household administrator.");
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

// Resilient Gemini model caller with automatic model fallback for 503 / high demand spikes
const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

async function callGeminiWithFallback(contents: any, config?: any, customApiKey?: string) {
  const ai = getGeminiClient(customApiKey);
  let lastError: any = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[Gemini] Model ${modelName} encountered: ${errMsg.slice(0, 100)}. Escalating to next fallback model...`);
      await new Promise(r => setTimeout(r, 250));
    }
  }

  throw lastError || new Error("All Gemini models temporarily busy.");
}

// Fallback generator for smart chores in case of temporary API quota/demand spikes
function generateCuratedChoresFallback(userPrompt: string, roomCategory: string, targetMemberName?: string, targetAge?: number, count = 3) {
  const age = targetAge || 10;
  const isYoung = age <= 6;
  const isTeen = age >= 13;

  const catalog = [
    {
      title: isYoung ? "Toy Box Tidy Up & Stuffed Animal Lineup" : isTeen ? "Deep Clean & Dust Bedroom Shelves" : "Neatly Make Bed & Organize Desk",
      description: "Keep the personal bedroom space organized, fresh, and welcoming.",
      category: "Bedrooms",
      difficulty: isYoung ? "easy" : isTeen ? "medium" : "easy",
      defaultPoints: isYoung ? 10 : isTeen ? 25 : 15,
      estimatedMinutes: isYoung ? 8 : isTeen ? 20 : 12,
      frequency: "daily",
      timeOfDay: "morning",
      scheduledTime: "08:00",
      qualityChecklist: [
        "Bed sheet pulled smooth and pillows fluffed at head of bed",
        "Floor clear of clothes, books, and stray toys",
        "Desk surface cleared and pens placed in organizer",
      ],
      rationale: `Builds personal ownership and proud morning habits for ${targetMemberName || 'helper'}.`
    },
    {
      title: isYoung ? "Clear Dinner Placemat & Carry Cup to Sink" : isTeen ? "Scrub Kitchen Sinks & Wipe Countertops" : "Unload Silverware & Wipe Dining Table",
      description: "Pitch in together to keep the heart of the home spotless after family meals.",
      category: "Kitchen",
      difficulty: isYoung ? "easy" : isTeen ? "hard" : "medium",
      defaultPoints: isYoung ? 10 : isTeen ? 30 : 20,
      estimatedMinutes: isYoung ? 5 : isTeen ? 25 : 15,
      frequency: "daily",
      timeOfDay: "evening",
      scheduledTime: "18:45",
      qualityChecklist: [
        "Counters or dining tabletop wiped clean of crumbs with a damp cloth",
        "Dirty dishes rinsed and placed in dishwasher",
        "Sink basin rinsed and free of food debris",
      ],
      rationale: "Essential teamwork contribution that keeps family meal spaces gleaming."
    },
    {
      title: isYoung ? "Sock Matching Game & Hamper Loading" : isTeen ? "Fold & Put Away Clean Laundry Baskets" : "Sort Dark & Light Clothes for Laundry",
      description: "Help make laundry a breeze by sorting, folding, and putting clothes in their drawers.",
      category: "Laundry",
      difficulty: isYoung ? "easy" : isTeen ? "medium" : "medium",
      defaultPoints: isYoung ? 10 : isTeen ? 25 : 15,
      estimatedMinutes: isYoung ? 10 : isTeen ? 20 : 15,
      frequency: "weekdays",
      timeOfDay: "afternoon",
      scheduledTime: "16:00",
      qualityChecklist: [
        "Shirts and pants folded squarely with no messy bunches",
        "Socks paired and placed in drawer",
        "Empty laundry baskets returned to laundry area",
      ],
      rationale: "Fosters self-sufficiency in maintaining personal clothing and wardrobe order."
    },
    {
      title: isYoung ? "Fluff Living Room Pillows & Pick Up Books" : isTeen ? "Vacuum Area Rugs & Sweep Entryway" : "Dust TV Stand & Neatly Align Remote Controls",
      description: "Maintain the common family relaxation space so everyone can relax in comfort.",
      category: "Living Room",
      difficulty: isYoung ? "easy" : isTeen ? "medium" : "easy",
      defaultPoints: isYoung ? 10 : isTeen ? 25 : 15,
      estimatedMinutes: isYoung ? 8 : isTeen ? 20 : 12,
      frequency: "daily",
      timeOfDay: "evening",
      scheduledTime: "19:30",
      qualityChecklist: [
        "Couch cushions and pillows upright and straightened",
        "Coffee table free of stray cups, mugs, and wrappers",
        "Rugs or hardwood floor swept clean of visible dust",
      ],
      rationale: "Teaches shared responsibility for household common areas."
    }
  ];

  let filtered = catalog;
  if (roomCategory && roomCategory !== 'Any' && roomCategory !== 'General') {
    const match = catalog.filter(c => c.category.toLowerCase() === roomCategory.toLowerCase());
    if (match.length > 0) filtered = match;
  }

  return filtered.slice(0, Math.max(1, count));
}

// ==========================================
// RESILIENT SERVER-BACKED CLOUD HOUSEHOLD SYNC & AUTH
// ==========================================

const HOUSEHOLD_DATA_DIR = path.join(process.cwd(), ".data");
const HOUSEHOLD_STORE_FILE = path.join(HOUSEHOLD_DATA_DIR, "households.json");

interface ServerHouseholdRecord {
  id: string;
  householdCode: string;
  authKey?: string;
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
  customHouseXp?: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

let householdsMemoryStore: Record<string, ServerHouseholdRecord> = {};
let activeFirestoreListeners: Record<string, Function> = {};

// Rate limiting store for brute-force and abuse protection (B7)
const ipRateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = ipRateLimits.get(key);
  if (!entry || now > entry.resetTime) {
    ipRateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count++;
  return true;
}

// Timing-safe string comparison hygiene (B7)
function safeEqual(a: string | undefined | null, b: string | undefined | null): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Random household code generator - no hardcoded defaults (B4)
function generateHouseholdCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "NEST-";
  for (let i = 0; i < 4; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return code;
}

// Random admin PIN generator - no hardcoded defaults (B4)
function generateAdminPin(): string {
  return crypto.randomInt(1000, 10000).toString();
}

// Sanitize household: strip credentials from all response bodies (B2)
function sanitizeHousehold(hh: ServerHouseholdRecord) {
  const { adminPin, joinPassphrase, householdCode, authKey, ...safe } = hh;
  return safe;
}

function ensureFirestoreListener(id: string) {
  if (!db || activeFirestoreListeners[id]) return;
  const unsub = onSnapshot(doc(db, "households", id), (snap) => {
    if (snap.exists()) {
      householdsMemoryStore[id] = snap.data() as ServerHouseholdRecord;
    }
  }, (err) => {
    console.warn("Firestore listener error:", err);
  });
  activeFirestoreListeners[id] = unsub;
}

async function saveHouseholdStore(hhId?: string) {
  // Save to disk cache (optional fallback)
  try {
    if (!fs.existsSync(HOUSEHOLD_DATA_DIR)) {
      fs.mkdirSync(HOUSEHOLD_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(HOUSEHOLD_STORE_FILE, JSON.stringify(householdsMemoryStore, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not persist households to disk:", e);
  }

  // Save to Firestore
  if (db && hhId && householdsMemoryStore[hhId]) {
    try {
      const cleaned = JSON.parse(JSON.stringify(householdsMemoryStore[hhId]));
      await setDoc(doc(db, "households", hhId), cleaned);
    } catch (e) {
      console.error("Firestore setDoc error:", e);
    }
  }
}

async function initHouseholdStore() {
  try {
    if (!fs.existsSync(HOUSEHOLD_DATA_DIR)) {
      fs.mkdirSync(HOUSEHOLD_DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(HOUSEHOLD_STORE_FILE)) {
      const data = fs.readFileSync(HOUSEHOLD_STORE_FILE, "utf-8");
      householdsMemoryStore = JSON.parse(data);

      // B6: Delete stray probe records
      if (householdsMemoryStore["hh_doesnotexist000"]) {
        delete householdsMemoryStore["hh_doesnotexist000"];
      }

      let modified = false;
      for (const h of Object.values(householdsMemoryStore)) {
        if (!h) continue;
        // Ensure unguessable authKey
        if (!h.authKey) {
          h.authKey = crypto.randomBytes(32).toString("hex");
          modified = true;
        }
        // B5: Backfill missing or empty passphrases
        if (!h.joinPassphrase || !h.joinPassphrase.trim()) {
          h.joinPassphrase = crypto.randomBytes(16).toString("base64url");
          modified = true;
        }
      }

      if (modified) {
        saveHouseholdStore();
      }

      // Migrate to Firestore if needed
      if (db) {
        for (const [id, hh] of Object.entries(householdsMemoryStore)) {
          ensureFirestoreListener(id);
          // If the server restarted, we push the local cache to Firestore just in case it wasn't saved
          try {
            const snap = await getDoc(doc(db, "households", id));
            if (!snap.exists()) {
              await setDoc(doc(db, "households", id), JSON.parse(JSON.stringify(hh)));
            } else {
              // Prefer Firestore data if it exists
              householdsMemoryStore[id] = snap.data() as ServerHouseholdRecord;
            }
          } catch (e) {
            console.error("Error migrating to Firestore:", e);
          }
        }
      }
    }
  } catch (e) {
    console.warn("Could not load stored households file, using memory store:", e);
  }
}

initHouseholdStore();

// Token extraction: B7 - Remove query parameter ?auth= support to prevent token leakage in URLs
function getRequestAuthToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const xAuth = req.headers["x-household-auth"];
  if (typeof xAuth === "string" && xAuth.trim()) {
    return xAuth.trim();
  }
  return null;
}

// B3: Bearer token is the ONLY accepted credential.
function verifyHouseholdAuth(req: express.Request, hh: ServerHouseholdRecord): boolean {
  if (!hh || !hh.authKey) return false;
  const clientToken = getRequestAuthToken(req);
  if (!clientToken) return false;
  return safeEqual(clientToken, hh.authKey);
}

// AI Endpoint Protection Middleware:
// Gated against anonymous abuse with per-IP rate limiting.
function authenticateHouseholdAiRequest(req: express.Request, res: express.Response): boolean {
  const customKeyHeader = req.headers["x-gemini-api-key"] || req.headers["x-api-key"];
  const hasCustomKey = typeof customKeyHeader === "string" && customKeyHeader.trim().length > 0;

  // If not bringing their own key, they MUST authenticate via a valid household session
  if (!hasCustomKey) {
    const hhId = req.headers["x-household-id"] as string;
    if (!hhId) {
      res.status(401).json({ error: "Unauthorized. Missing household ID or custom API key." });
      return false;
    }
    const hh = householdsMemoryStore[hhId];
    if (!verifyHouseholdAuth(req, hh)) {
      res.status(401).json({ error: "Unauthorized. Invalid household credentials." });
      return false;
    }
  }

  const rawIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress || "unknown";

  // Per-IP rate limit: maximum 20 requests per minute
  if (!checkRateLimit(`ai_ip_${rawIp}`, 20, 60000)) {
    res.status(429).json({ error: "Rate limit exceeded. Too many requests from this IP." });
    return false;
  }
  return true;
}

const requireAiHouseholdAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!authenticateHouseholdAiRequest(req, res)) return;

  // Extract custom client-provided Gemini API key if present
  const customKeyHeader = req.headers["x-gemini-api-key"] || req.headers["x-api-key"];
  if (typeof customKeyHeader === "string" && customKeyHeader.trim()) {
    (req as any).userGeminiApiKey = customKeyHeader.trim();
  }
  next();
};

// Gate ALL /api/ai/* routes behind household authentication and rate limits
app.use("/api/ai", requireAiHouseholdAuth);

// BYOK Validation Endpoint: Verify a user-provided Gemini API key
app.post("/api/ai/verify-key", async (req, res) => {
  try {
    const keyToTest = (req as any).userGeminiApiKey || req.body?.key;
    if (!keyToTest || typeof keyToTest !== "string" || !keyToTest.trim()) {
      return res.status(400).json({ valid: false, error: "Please provide an API key to verify." });
    }

    const testAi = getGeminiClient(keyToTest.trim());
    // Run a minimal, ultra-low-latency verification probe
    const testResponse = await testAi.models.generateContent({
      model: "gemini-3.8-flash",
      contents: "Ping! Please reply with 'pong'.",
      config: {
        maxOutputTokens: 10,
        temperature: 0.1,
      },
    });

    if (testResponse && testResponse.text) {
      return res.json({
        valid: true,
        message: "Your Google Gemini API key is valid and connected! ✨",
      });
    } else {
      return res.status(400).json({
        valid: false,
        error: "API key responded with empty output. Please verify permissions.",
      });
    }
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.warn("User Gemini key verification failed:", msg);
    let friendlyError = "Invalid API key or unauthorized. Please check that the key is copied correctly.";
    if (msg.includes("API_KEY_INVALID") || msg.includes("403") || msg.includes("Forbidden")) {
      friendlyError = "The provided key is not recognized as a valid Google Gemini API key (HTTP 403).";
    } else if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
      friendlyError = "Your API key has exceeded its quota or rate limit (HTTP 429).";
    }
    return res.status(400).json({ valid: false, error: friendlyError });
  }
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

    const userKey = (req as any).userGeminiApiKey;

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
1. Age 3-5 (Toddlers & Preschoolers, e.g. Leo): Simple playful 1-step motor tasks (put toys/blocks into bins, fluff couch cushions & pillows, align teddy bears).
2. Age 6-9 (Elementary, e.g. Maya): Multi-step routine tasks (water garden flower pots, unload silverware & dishes, make bed, clear dinner table & sweep under chairs, restock bathroom towels).
3. Age 10-17 (Pre-teens & High School): Responsible multi-room chores (load dishwasher, sweep patio/driveway, dust consoles/shelves, fold laundry, scrub bathroom sinks).
4. Age 18-21+ (Young Adults & Teens, e.g. Jordan, Emma): Comprehensive household duties (hand-wash pots & pans, disinfect toilet bowls & bases, pull garden weeds, strip bed linens, vacuum rugs & stairs).
5. Parents / Adults (e.g. David, Sarah): Major home upkeep, power lawn mowing & edging, deep counter/cooktop degreasing, curbside trash/recycling bins, and master laundry cycles.
6. Ensure an age-appropriate balance of points and effort so every family member feels appreciated and not overwhelmed.
7. Provide an encouraging, developmental reason for each assignment explaining why it fits that specific member's age and skills.

Return your response strictly adhering to the JSON schema.
`;

    let response;
    try {
      response = await callGeminiWithFallback(prompt, {
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
      }, userKey);

      const text = response.text || "{}";
      const result = JSON.parse(text);
      return res.json(result);
    } catch (modelErr: any) {
      console.warn("AI Auto-Assign model spike, falling back to rule-based logic:", modelErr?.message);
      const nonParents = (members || []).filter((m: any) => m.role !== 'parent');
      const pool = nonParents.length > 0 ? nonParents : (members || []);
      const suggestions = (chores || []).map((chore: any, idx: number) => {
        const assigned = pool[idx % pool.length] || members[0];
        return {
          choreId: chore.id,
          choreTitle: chore.title,
          assignedMemberId: assigned?.id,
          assignedMemberName: assigned?.name,
          reason: `Balanced task suited for ${assigned?.name}'s age and routine.`,
          developmentalFocus: "Responsibility & Independence",
          confidenceScore: 92,
          recommendedTimeOfDay: chore.timeOfDay || "morning",
        };
      });
      return res.json({
        fairnessSummary: "Balanced chore distribution based on age-appropriate household routine.",
        fairnessRating: 90,
        suggestions,
        ageTierInsights: pool.map((m: any) => ({
          memberId: m.id,
          memberName: m.name,
          age: m.age || 10,
          assignedChoresCount: suggestions.filter((s: any) => s.assignedMemberId === m.id).length,
          totalPoints: suggestions.filter((s: any) => s.assignedMemberId === m.id).reduce((sum: number, s: any) => {
            const chore = chores.find((c: any) => c.id === s.choreId);
            return sum + (chore?.defaultPoints || 15);
          }, 0),
          insight: `${m.name} has tasks tailored to their current skill level and family routine.`
        }))
      });
    }
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

    const prompt = `
You are a warm, practical family organization coach and child behavior expert helping a parent manage household chores smoothly.
Family Members: ${JSON.stringify(members || [])}
Current Chores: ${JSON.stringify(chores || [])}

Parent Question: "${question}"

Provide helpful, empathetic, concise, and structured advice. Use bullet points and practical suggestions for routines, positive reinforcement, allowance, or age-appropriate chore checklists.
`;

    const userKey = (req as any).userGeminiApiKey;
    const response = await callGeminiWithFallback(prompt, undefined, userKey);

    return res.json({ advice: response.text || "Here is your household guidance." });
  } catch (error: any) {
    console.error("AI Advice error:", error);
    return res.status(500).json({ error: error.message || "Failed to get AI advice" });
  }
});

// AI Smart Chore Creator / Template Generator Endpoint
app.post("/api/ai/generate-chores", async (req, res) => {
  try {
    const { prompt: userPrompt, roomCategory, targetAge, targetMemberName, memberRole, count = 3 } = req.body;

    const systemPrompt = `
You are an expert pediatric child development specialist and home management organizer.
Generate ${count} highly practical, motivating, age-appropriate household chores with clear step-by-step quality inspection criteria.

Context & Preferences:
- User Prompt / Goal: ${userPrompt || 'Standard family routine chores'}
- Target Room / Category: ${roomCategory || 'Any'}
- Target Child / Helper: ${targetMemberName || 'General helper'} (Age: ${targetAge || 'all ages'}, Role: ${memberRole || 'child'})

Requirements for each generated chore:
1. Title: Crisp, clear, actionable (e.g. "Fold & Put Away Laundry Hamper", "Scrub Kitchen Sinks & Polish Faucets").
2. Description: 1-2 friendly sentences with clear boundaries.
3. Category: One of ["Kitchen", "Living Room", "Bedrooms", "Bathrooms", "Pets", "Laundry", "Yard & Outdoor", "Daily Routine", "General"].
4. Difficulty: "easy" | "medium" | "hard" matched to age.
5. DefaultPoints: Fair star points (e.g. 5-10 for easy/toddler, 15-20 for standard elementary/teen, 25-35 for deep cleaning).
6. EstimatedMinutes: 5 to 45 mins.
7. Frequency: "daily" | "weekdays" | "weekends" | "weekly" | "custom_days".
8. TimeOfDay: "morning" | "afternoon" | "evening" | "bedtime" | "anytime".
9. ScheduledTime: "08:00", "16:00", "19:00", etc.
10. QualityChecklist: Exactly 3 to 5 concrete, observable inspection bullet points that Mom or Dad can easily verify.

Return your response strictly adhering to JSON schema.
`;

    const userKey = (req as any).userGeminiApiKey;

    try {
      const response = await callGeminiWithFallback(systemPrompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
                  defaultPoints: { type: Type.NUMBER },
                  estimatedMinutes: { type: Type.NUMBER },
                  frequency: { type: Type.STRING, enum: ["daily", "weekdays", "weekends", "weekly", "custom_days"] },
                  timeOfDay: { type: Type.STRING, enum: ["morning", "afternoon", "evening", "bedtime", "anytime"] },
                  scheduledTime: { type: Type.STRING },
                  qualityChecklist: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  rationale: { type: Type.STRING, description: "Why this chore is great for this helper's growth." }
                },
                required: ["title", "description", "category", "difficulty", "defaultPoints", "estimatedMinutes", "frequency", "timeOfDay", "scheduledTime", "qualityChecklist"]
              }
            }
          },
          required: ["chores"]
        }
      }, userKey);

      const text = response.text || "{}";
      const result = JSON.parse(text);
      if (result.chores && Array.isArray(result.chores) && result.chores.length > 0) {
        return res.json(result);
      }
    } catch (modelErr: any) {
      console.warn("Gemini model spike during chore generation, using curated fallback:", modelErr?.message);
    }

    const fallbackChores = generateCuratedChoresFallback(userPrompt, roomCategory, targetMemberName, targetAge, count);
    return res.json({ chores: fallbackChores });
  } catch (error: any) {
    console.error("AI Generate Chores error:", error);
    const fallbackChores = generateCuratedChoresFallback("", "General", undefined, undefined, 3);
    return res.json({ chores: fallbackChores });
  }
});

// AI Automatic Quality Inspection Checklist Drafter
app.post("/api/ai/draft-quality-checklist", async (req, res) => {
  try {
    const { 
      title, 
      category = "General", 
      description = "", 
      difficulty = "medium",
      targetMemberName,
      targetAge,
      memberRole 
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Chore title is required to draft a quality checklist." });
    }

    const systemPrompt = `
You are a family quality inspector and positive home organization coach.
A parent is creating a household chore: "${title.trim()}".
Category: ${category}
Description/Notes: ${description || 'Standard routine'}
Difficulty Level: ${difficulty}
Target Helper: ${targetMemberName ? `${targetMemberName} (${memberRole || 'child'}, age ${targetAge || 'school-age'})` : 'Family member / kid'}

Your job is to draft exactly 3 to 5 clear, objective, observable inspection checklist criteria so the helper knows precisely what a "Done Right" job looks like, and Mom/Dad can verify it in 5 seconds.

Rules:
1. Avoid vague lines like "Make it clean" or "Do a good job".
2. Use concrete observable actions (e.g. "Pillows fluffed and placed at the top of the mattress", "No shoes left on the floor", "Sink basin rinsed and free of toothpaste or soap scum").
3. Keep items friendly, actionable, and age-appropriate.
4. Also estimate reasonable minutes and points for completing this chore thoroughly.

Return strictly conforming to the JSON schema.
`;

    const userKey = (req as any).userGeminiApiKey;

    try {
      const response = await callGeminiWithFallback(systemPrompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            qualityChecklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 to 5 clear, observable verification checklist steps"
            },
            suggestedPoints: { type: Type.NUMBER, description: "Suggested star points (5-50)" },
            suggestedMinutes: { type: Type.NUMBER, description: "Estimated completion time in minutes (5-60)" },
            suggestedDifficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
            inspectionTip: { type: Type.STRING, description: "One short 1-sentence tip for parents when reviewing." }
          },
          required: ["qualityChecklist", "suggestedPoints", "suggestedMinutes", "suggestedDifficulty"]
        }
      }, userKey);

      const text = response.text || "{}";
      const result = JSON.parse(text);
      return res.json(result);
    } catch (modelErr: any) {
      console.warn("Gemini model spike during checklist drafting, using curated fallback:", modelErr?.message);
      return res.json({
        qualityChecklist: [
          `Area is visually organized and free of clutter`,
          `Surfaces are wiped down or swept clean`,
          `All tools or cleaning supplies are returned to their proper place`,
        ],
        suggestedPoints: 15,
        suggestedMinutes: 15,
        suggestedDifficulty: "medium",
        inspectionTip: "Check for thoroughness and praise the effort when verifying!",
      });
    }
  } catch (error: any) {
    console.error("AI Draft Quality Checklist error:", error);
    return res.status(500).json({ error: error.message || "Failed to draft quality checklist with AI" });
  }
});

// AI Family Setup & Management Buddy Endpoint
app.post("/api/ai/setup-buddy", async (req, res) => {
  try {
    const { messages = [], currentHousehold = {} } = req.body || {};

    // 1. Cap message count & validate array
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format. Array expected." });
    }

    if (messages.length > 25) {
      return res.status(400).json({ error: "Message count exceeds allowable limit (maximum 25 messages)." });
    }

    // 2. Cap message length and total conversation length
    let totalTextChars = 0;
    for (const msg of messages) {
      if (!msg || typeof msg !== "object") {
        return res.status(400).json({ error: "Invalid message entry in messages array." });
      }
      if (typeof msg.text !== "string") {
        return res.status(400).json({ error: "Message text must be a string." });
      }
      if (msg.text.length > 2000) {
        return res.status(400).json({ error: "Message text exceeds maximum limit of 2000 characters." });
      }
      totalTextChars += msg.text.length;
    }

    if (totalTextChars > 15000) {
      return res.status(400).json({ error: "Total conversation text exceeds maximum limit of 15000 characters." });
    }

    // 3. Validate currentHousehold shape
    if (currentHousehold !== undefined && currentHousehold !== null) {
      if (typeof currentHousehold !== "object" || Array.isArray(currentHousehold)) {
        return res.status(400).json({ error: "Invalid currentHousehold structure. Object expected." });
      }
      const { householdInfo, members, chores, rewards } = currentHousehold;
      if (householdInfo !== undefined && (typeof householdInfo !== "object" || Array.isArray(householdInfo))) {
        return res.status(400).json({ error: "Invalid householdInfo structure. Object expected." });
      }
      if (members !== undefined && !Array.isArray(members)) {
        return res.status(400).json({ error: "Invalid members structure. Array expected." });
      }
      if (chores !== undefined && !Array.isArray(chores)) {
        return res.status(400).json({ error: "Invalid chores structure. Array expected." });
      }
      if (rewards !== undefined && !Array.isArray(rewards)) {
        return res.status(400).json({ error: "Invalid rewards structure. Array expected." });
      }
    }

    const { householdInfo = {}, members = [], chores = [], rewards = [] } = currentHousehold;

    const lastUserMessage = messages.length > 0 
      ? messages[messages.length - 1].text 
      : "Hello! Please help me set up our family household.";

    const conversationHistory = messages.slice(0, -1).map((m: any) => 
      `${m.role === 'user' ? 'User' : 'Buddy'}: ${m.text}`
    ).join("\n");

    const systemPrompt = `
You are "Buddy", the friendly, knowledgeable, and proactive AI Family Setup & Management Companion for the "Family Chore & Quality Tracker" app.
You talk directly with parents and families to set up and customize their entire household, including:
1. Family identity (Family Name, House Motto/Rules).
2. Family members (Parents, teens, children: names, roles, ages, avatars, weekly star goals).
3. Age-appropriate chores (Category, difficulty, points, checklist inspection steps, estimated time, frequency, assigned helper).
4. Motivating rewards (Fun treats, activities, screen time, allowance, with fair point costs).
5. Editing, rebalancing, or deleting existing members, chores, and rewards whenever requested.

CURRENT HOUSEHOLD STATE:
- Family Name: "${householdInfo.familyName || 'Not set'}"
- House Motto: "${householdInfo.houseAddressOrMotto || 'Not set'}"
- Current Members (${members.length}):
${JSON.stringify(members.map((m: any) => ({ id: m.id, name: m.name, role: m.role, age: m.age, points: m.currentPoints, goal: m.targetWeeklyPoints })), null, 2)}
- Current Chores (${chores.length}):
${JSON.stringify(chores.map((c: any) => ({ id: c.id, title: c.title, category: c.category, points: c.defaultPoints, difficulty: c.difficulty, assignedMemberId: c.assignedMemberId, checklistCount: c.qualityChecklist?.length || 0 })), null, 2)}
- Current Rewards (${rewards.length}):
${JSON.stringify(rewards.map((r: any) => ({ id: r.id, title: r.title, cost: r.pointCost, icon: r.icon, category: r.category })), null, 2)}

RECENT CONVERSATION HISTORY:
${conversationHistory || "None (new conversation)"}

LATEST USER MESSAGE:
"${lastUserMessage}"

TASK & GUIDELINES:
- Listen carefully to what the user asks. If they provide details about their family (e.g. "We have Mom, Dad, a 7-year-old named Sam, and a 12-year-old named Maya"), create members for them, give each age-tailored chores with concrete quality inspection checklists, and suggest motivating rewards!
- If the user asks to edit, reassign, change points, delete, or rename anything, generate the appropriate UPDATE or DELETE actions matching the existing IDs or names.
- Age-appropriateness guidelines:
  * Toddlers (3-5): 1-step motor tasks (put toys in bins, fluff cushions), 5-10 pts, easy.
  * Elementary (6-9): 2-3 step tasks (water plants, feed pets, make bed, unload silverware), 10-15 pts, easy/medium.
  * Pre-teens (10-12): Dishwasher, vacuuming bedroom, folding laundry, trash bins, 15-20 pts, medium.
  * Teens (13+): Bathrooms, cooking helper, lawn mowing, deep cleans, 20-30 pts, hard/medium.
- Always include 3 to 4 clear, observable verification bullet points in qualityChecklist for every added chore.
- If the user asks a general question or wants advice on allowance, motivation, or routines, answer warmly and suggest 1-2 actionable options they can approve.
- Always format your 'reply' in warm, engaging, encouraging markdown with emojis.
- In 'actions', provide every concrete addition, update, or deletion that the user requested or that fits their setup.
- In 'suggestedFollowUps', suggest 3 short follow-up prompts the user can click next.

Return strictly conforming to the JSON schema.
`;

    const userKey = (req as any).userGeminiApiKey;

    try {
      const response = await callGeminiWithFallback(systemPrompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: "Warm, supportive conversational response explaining changes made or answering questions."
            },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    enum: [
                      "SET_HOUSEHOLD_INFO",
                      "ADD_MEMBER",
                      "UPDATE_MEMBER",
                      "DELETE_MEMBER",
                      "ADD_CHORE",
                      "UPDATE_CHORE",
                      "DELETE_CHORE",
                      "ADD_REWARD",
                      "UPDATE_REWARD",
                      "DELETE_REWARD"
                    ]
                  },
                  summary: {
                    type: Type.STRING,
                    description: "Short human-readable summary of the action e.g. 'Add Member: Leo (Age 8)' or 'Update Chore: Dishwasher (20 pts)'"
                  },
                  data: {
                    type: Type.OBJECT,
                    description: "Payload data for the mutation action"
                  }
                },
                required: ["type", "summary", "data"]
              }
            },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 to 4 quick action chip suggestions for what the user might want to do next"
            }
          },
          required: ["reply", "actions"]
        }
      }, userKey);

      const text = response.text || "{}";
      const result = JSON.parse(text);
      return res.json({
        reply: result.reply || "I am ready to help organize your household!",
        actions: Array.isArray(result.actions) ? result.actions : [],
        suggestedFollowUps: Array.isArray(result.suggestedFollowUps) ? result.suggestedFollowUps : [
          "Add another family member",
          "Suggest chores for our kids",
          "Create weekend rewards",
          "Review chore balance"
        ]
      });
    } catch (modelErr: any) {
      console.warn("AI Setup Buddy model fallback:", modelErr?.message || "Model issue");
      
      // Smart local heuristic fallback if API is unavailable
      const lower = lastUserMessage.toLowerCase();
      let reply = "I'm your AI Household Buddy! I'm ready to help you set up and fine-tune your family members, chores, and rewards.";
      const actions: any[] = [];
      const suggestedFollowUps = [
        "Add a 7-year-old helper",
        "Create kitchen chores",
        "Add screen time rewards",
        "Set family motto"
      ];

      if (lower.includes("member") || lower.includes("kid") || lower.includes("child") || lower.includes("family")) {
        reply = "I'm ready to help you set up your family roster! Tell me their names, roles, and ages (for example: *'Add Maya age 7 and Leo age 11'*), and I'll create customized profiles and age-appropriate chore routines.";
      } else if (lower.includes("chore") || lower.includes("clean") || lower.includes("dish")) {
        reply = "Let's organize your family chores! Tell me what tasks you need done (like *'Make beds, feed the cat, and empty the dishwasher'*), or what rooms need attention, and I'll generate checklists with fair star points!";
      } else if (lower.includes("reward") || lower.includes("prize") || lower.includes("point")) {
        reply = "Rewards make chores motivating and fun! What kind of privileges or treats work best for your kids? Screen time, treats, allowance, or family movie nights?";
      }

      return res.json({ reply, actions, suggestedFollowUps });
    }
  } catch (error: any) {
    console.error("AI Setup Buddy error:", error?.message || "Internal error");
    return res.status(500).json({
      reply: "I ran into a temporary hiccup connecting to my knowledge base. Please try asking again in a moment!",
      actions: [],
      suggestedFollowUps: ["Add a family member", "Suggest daily chores", "Set up rewards"]
    });
  }
});

// PERMANENTLY DISABLED: Do NOT volunteer any family's household to unauthenticated strangers
app.get("/api/household/primary", (req, res) => {
  return res.status(404).json({ error: "Endpoint disabled for privacy and security. Strangers cannot read household data." });
});

// Create a new household on server - B2, B4, B5, B7
app.post("/api/household/create", async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(`create_${ip}`, 5, 900000)) {
      return res.status(429).json({ error: "Too many creations. Please try again later." });
    }

    const { id, familyName, houseAddressOrMotto, housePhotoUrl, adminPin, pinProtectionEnabled, joinPassphrase, members, chores, logs, rewards, claims } = req.body;
    
    // B5: Make joinPassphrase required at creation
    if (!joinPassphrase || typeof joinPassphrase !== "string" || !joinPassphrase.trim()) {
      return res.status(400).json({ error: "joinPassphrase is required to create a household" });
    }

    const now = new Date().toISOString();
    const hhId = id || "hh_" + crypto.randomBytes(6).toString("hex");
    const code = generateHouseholdCode();
    const authKey = crypto.randomBytes(32).toString("hex");
    const pin = (typeof adminPin === "string" && adminPin.trim().length > 0) ? adminPin.trim() : generateAdminPin();

    const record: ServerHouseholdRecord = {
      id: hhId,
      householdCode: code,
      authKey,
      familyName: familyName || "Our Family Home",
      houseAddressOrMotto: houseAddressOrMotto || "Clean spaces, happy smiles & teamwork! ✨",
      housePhotoUrl: housePhotoUrl || "",
      adminPin: pin,
      pinProtectionEnabled: pinProtectionEnabled !== undefined ? Boolean(pinProtectionEnabled) : true,
      joinPassphrase: joinPassphrase.trim(),
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
    await saveHouseholdStore(hhId);

    // Return authKey exactly once at create, never return householdCode/adminPin/joinPassphrase in serialized household
    return res.json({ success: true, household: sanitizeHousehold(record), authKey });
  } catch (err: any) {
    console.error("Create household API error:", err);
    return res.status(500).json({ error: err.message || "Failed to create household" });
  }
});

// Dedicated join endpoint - accepts code + passphrase, verifies both, mints/returns token (B3, B7)
app.post(["/api/household/join", "/api/household/by-code/:code/join"], async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(`join_${ip}`, 10, 60000)) {
      return res.status(429).json({ error: "Too many join attempts. Please try again later." });
    }

    const codeParam = (req.params.code || req.body.householdCode || req.body.code || "").trim().toUpperCase();

    if (!codeParam) {
      return res.status(400).json({ error: "householdCode is required" });
    }

    const found = await findHouseholdByCodeFromStore(codeParam);

    if (!found) {
      return res.status(404).json({ error: "Household not found" });
    }

    const providedPassphrase = (req.body.joinPassphrase || req.body.passphrase || req.headers["x-join-passphrase"] || "") as string;
    if (!found.joinPassphrase || !safeEqual(providedPassphrase.trim(), found.joinPassphrase.trim())) {
      return res.status(401).json({ error: "Invalid household join passphrase" });
    }

    if (!found.authKey) {
      found.authKey = crypto.randomBytes(32).toString("hex");
      await saveHouseholdStore(found.id);
    }

    return res.json({
      success: true,
      household: sanitizeHousehold(found),
      authKey: found.authKey,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to join household" });
  }
});

// Look up household by code - B2, B5, B7: Returns ONLY a passphrase prompt stub without leaking roster or credentials
app.get("/api/household/by-code/:code", async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(`lookup_${ip}`, 10, 60000)) {
      return res.status(429).json({ error: "Too many lookups. Please try again later." });
    }

    const raw = (req.params.code || "").trim();
    const searchCode = raw.toUpperCase();

    const found = await findHouseholdByCodeFromStore(searchCode);

    if (!found) {
      return res.status(404).json({ error: "Household not found" });
    }

    // Never leak members, chores, rewards, adminPin, joinPassphrase, householdCode, or authKey
    // Always return passphrase prompt stub only
    return res.json({
      success: false,
      requiresPassphrase: true,
      familyName: found.familyName,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to search household" });
  }
});

async function getHouseholdFromStore(hhId: string): Promise<ServerHouseholdRecord | null> {
  if (householdsMemoryStore[hhId]) {
    ensureFirestoreListener(hhId);
    return householdsMemoryStore[hhId];
  }
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "households", hhId));
    if (snap.exists()) {
      const hh = snap.data() as ServerHouseholdRecord;
      householdsMemoryStore[hhId] = hh;
      ensureFirestoreListener(hhId);
      return hh;
    }
  } catch (e) {
    console.error("Firestore getDoc error:", e);
  }
  return null;
}

async function findHouseholdByCodeFromStore(codeParam: string): Promise<ServerHouseholdRecord | null> {
  const cleanSearch = codeParam.replace(/[^A-Z0-9]/g, "");
  if (!cleanSearch) return null;
  
  let found = Object.values(householdsMemoryStore).find((h) => {
    if (!h) return false;
    const hCode = (h.householdCode || "").toUpperCase();
    const hClean = hCode.replace(/[^A-Z0-9]/g, "");
    return hCode === codeParam || hClean === cleanSearch;
  });
  
  if (found) return found;

  if (db) {
    try {
      const q = query(collection(db, "households"), where("householdCode", "==", codeParam));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const hh = querySnapshot.docs[0].data() as ServerHouseholdRecord;
        householdsMemoryStore[hh.id] = hh;
        ensureFirestoreListener(hh.id);
        return hh;
      }
    } catch (e) {
      console.error("Firestore query error:", e);
    }
  }
  return null;
}

// Fetch full household by ID - REQUIRES AUTHENTICATION (B2, B3)
app.get("/api/household/:id", async (req, res) => {
  try {
    const hh = await getHouseholdFromStore(req.params.id);
    if (!hh) {
      return res.status(404).json({ error: "Household not found" });
    }
    if (!verifyHouseholdAuth(req, hh)) {
      return res.status(401).json({ error: "Unauthorized: Household access credentials required" });
    }
    return res.json({ success: true, household: sanitizeHousehold(hh) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Sync / update household data across all devices - REQUIRES AUTHENTICATION (B2, B3, B4)
app.post("/api/household/:id/sync", async (req, res) => {
  try {
    const hhId = req.params.id;
    const existing = await getHouseholdFromStore(hhId);

    // B4: An unauthenticated POST to a nonexistent id must not bring one into existence
    if (!existing) {
      return res.status(401).json({ error: "Unauthorized: Household does not exist" });
    }

    if (!verifyHouseholdAuth(req, existing)) {
      return res.status(401).json({ error: "Unauthorized: Invalid household credentials" });
    }

    const { familyName, houseAddressOrMotto, housePhotoUrl, pinProtectionEnabled, members, chores, logs, rewards, claims } = req.body;
    const now = new Date().toISOString();

    if (familyName !== undefined) existing.familyName = familyName;
    if (houseAddressOrMotto !== undefined) existing.houseAddressOrMotto = houseAddressOrMotto;
    if (housePhotoUrl !== undefined) existing.housePhotoUrl = housePhotoUrl;
    if (pinProtectionEnabled !== undefined) existing.pinProtectionEnabled = Boolean(pinProtectionEnabled);


    const clientVersion = req.body.version;
    const isStale = typeof clientVersion !== 'number' || clientVersion < (existing.version || 0);

    if (Array.isArray(members)) {
      if (isStale) {
        const existingMap = new Map((existing.members || []).map((m: any) => [m.id, m]));
        for (const m of members) {
          const prevM = existingMap.get(m.id);
          if (prevM?.avatarPhotoUrl && (!m.avatarPhotoUrl || m.avatarPhotoUrl.trim() === "")) {
            m.avatarPhotoUrl = prevM.avatarPhotoUrl;
          }
          existingMap.set(m.id, m);
        }
        existing.members = Array.from(existingMap.values());
      } else {
        existing.members = members.map((m: any) => {
          const prevM = existing.members?.find((em: any) => em.id === m.id);
          if (prevM?.avatarPhotoUrl && (!m.avatarPhotoUrl || m.avatarPhotoUrl.trim() === "")) {
            return { ...m, avatarPhotoUrl: prevM.avatarPhotoUrl };
          }
          return m;
        });
      }
    }

    if (Array.isArray(chores)) {
      if (isStale) {
        const existingMap = new Map((existing.chores || []).map((c: any) => [c.id, c]));
        for (const c of chores) existingMap.set(c.id, c);
        existing.chores = Array.from(existingMap.values());
      } else {
        existing.chores = chores;
      }
    }

    if (Array.isArray(logs)) {
      if (isStale) {
        const existingMap = new Map((existing.logs || []).map((l: any) => [`${l.choreId}_${l.date}_${l.memberId}`, l]));
        for (const l of logs) {
          const key = `${l.choreId}_${l.date}_${l.memberId}`;
          const prevL = existingMap.get(key);
          if (prevL) {
            if (l.checklistStatus && prevL.checklistStatus) {
              l.checklistStatus = { ...prevL.checklistStatus, ...l.checklistStatus };
            }
            l.id = prevL.id;
          }
          existingMap.set(key, l);
        }
        existing.logs = Array.from(existingMap.values());
      } else {
        existing.logs = logs;
      }
    }

    if (Array.isArray(rewards)) {
      if (isStale) {
        const existingMap = new Map((existing.rewards || []).map((r: any) => [r.id, r]));
        for (const r of rewards) existingMap.set(r.id, r);
        existing.rewards = Array.from(existingMap.values());
      } else {
        existing.rewards = rewards;
      }
    }

    if (Array.isArray(claims)) {
      if (isStale) {
        const existingMap = new Map((existing.claims || []).map((c: any) => [c.id, c]));
        for (const c of claims) existingMap.set(c.id, c);
        existing.claims = Array.from(existingMap.values());
      } else {
        existing.claims = claims;
      }
    }


    if (req.body.penaltySettings !== undefined) existing.penaltySettings = req.body.penaltySettings;
    if (Array.isArray(req.body.events)) existing.events = req.body.events;
    if (Array.isArray(req.body.nudges)) existing.nudges = req.body.nudges;
    if (req.body.customHouseXp !== undefined) existing.customHouseXp = req.body.customHouseXp;

    existing.updatedAt = now;
    existing.version = (existing.version || 0) + 1;
    
    householdsMemoryStore[hhId] = existing;
    await saveHouseholdStore(hhId);

    return res.json({ success: true, household: sanitizeHousehold(existing) });
  } catch (err: any) {
    console.error("Household sync API error:", err);
    return res.status(500).json({ error: err.message || "Failed to sync household" });
  }
});

// Daily penalty settle job endpoint (triggered by schedule/cron or background heartbeat) - REQUIRES AUTHENTICATION
app.post("/api/household/:id/settle-penalties", async (req, res) => {
  try {
    const hhId = req.params.id;
    const hh = await getHouseholdFromStore(hhId);
    if (!hh) {
      return res.status(404).json({ error: "Household not found" });
    }
    if (!verifyHouseholdAuth(req, hh)) {
      return res.status(401).json({ error: "Unauthorized: Invalid household credentials" });
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
    await saveHouseholdStore(hhId);

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

// Post a Nudge to a member - REQUIRES AUTHENTICATION
app.post("/api/household/:id/nudge", async (req, res) => {
  try {
    const hhId = req.params.id;
    const { memberId, memberName, senderRole, senderName, message, choreId, choreTitle } = req.body;
    const hh = await getHouseholdFromStore(hhId);
    if (!hh) return res.status(404).json({ error: "Household not found" });
    if (!verifyHouseholdAuth(req, hh)) {
      return res.status(401).json({ error: "Unauthorized: Invalid household credentials" });
    }

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
    await saveHouseholdStore(hhId);

    return res.json({ success: true, nudge: newNudge });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Long-polling / fast poll endpoint for multi-device live sync - REQUIRES AUTHENTICATION
app.get("/api/household/:id/poll", async (req, res) => {
  try {
    const hhId = req.params.id;
    const hh = await getHouseholdFromStore(hhId);

    if (!hh) {
      return res.status(404).json({ error: "Household not found" });
    }
    if (!verifyHouseholdAuth(req, hh)) {
      return res.status(401).json({ error: "Unauthorized: Household access credentials required" });
    }

    const since = req.query.since ? String(req.query.since) : null;

    // Return if changed since provided timestamp or version
    if (!since || hh.updatedAt !== since) {
      return res.json({ hasUpdate: true, household: sanitizeHousehold(hh) });
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
