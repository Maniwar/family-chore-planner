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
