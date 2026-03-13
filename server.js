/**
 * AI House Plan Generator - Backend Server
 * Node.js + Express + OpenAI API
 *
 * Usage:
 *   1. npm install
 *   2. Set OPENAI_API_KEY in .env or as environment variable
 *   3. node server.js
 *   4. Open http://localhost:3000
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ─── OpenAI Client (lazy — initialized per request so missing key doesn't crash startup) ──
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── Utility: Build AI Prompt ─────────────────────────────────────────────────
function buildArchitectPrompt(data) {
  return `You are an expert architect and civil engineer with 20+ years of experience designing residential homes in India. Generate a detailed, realistic residential floor plan using the following parameters.

PLOT DETAILS:
- Plot Size: ${data.plotSize} square yards
- Facing Direction: ${data.facingDirection}
- Number of Floors: ${data.floors}
- Bedrooms Required: ${data.bedrooms}
- Bathrooms Required: ${data.bathrooms}
- Parking Required: ${data.parking}
- Kitchen Type: ${data.kitchenType}
- Vastu Preference: ${data.vastu}

INSTRUCTIONS:
Generate a complete floor plan response in the following EXACT JSON structure. Do NOT include markdown code blocks or extra text outside the JSON. Return ONLY valid JSON.

{
  "plotSummary": {
    "totalArea": "<area in sq yards>",
    "builtUpArea": "<approx built-up area in sq ft>",
    "openArea": "<open/garden area>",
    "facingDirection": "<direction>",
    "vastCompliance": "<Vastu compliant or not, and key notes>",
    "floors": <number>,
    "style": "<architectural style e.g. Contemporary, Traditional, Modern>"
  },
  "rooms": [
    {
      "name": "<Room Name>",
      "length": <length in feet>,
      "width": <width in feet>,
      "area": <area in sq ft>,
      "floor": <floor number 1 or 2>,
      "position": "<e.g. Front-Left, Center, Back-Right>",
      "notes": "<Vastu or design note>"
    }
  ],
  "spaceAllocation": [
    { "category": "<category name>", "percentage": <number>, "area": "<area in sq ft>" }
  ],
  "asciiFloorPlan": "<ASCII art floor plan for ground floor, use | - + chars, min 20 lines>",
  "engineeringSuggestions": [
    "<suggestion 1>",
    "<suggestion 2>",
    "<suggestion 3>",
    "<suggestion 4>",
    "<suggestion 5>"
  ],
  "structuralNotes": {
    "foundationType": "<e.g. Strip foundation / Raft foundation>",
    "roofType": "<e.g. RCC flat roof / Sloped roof>",
    "wallThickness": "<e.g. 9 inch brick walls>",
    "estimatedCost": "<rough cost estimate in INR>",
    "constructionTime": "<estimated time in months>"
  }
}

Make room dimensions realistic. Ensure total room areas add up correctly. For ${data.bedrooms} bedrooms, include master bedroom, other bedrooms, ${data.bathrooms} bathrooms, living room, dining area, kitchen${data.parking === "Yes" ? ", parking/garage" : ""}, and utility/storeroom. Respect Vastu guidelines if requested (${data.vastu === "Yes" ? "strictly apply Vastu" : "Vastu not required"}). The ${data.kitchenType} kitchen should be ${data.kitchenType === "Open" ? "open plan integrated with living/dining" : "enclosed with dedicated walls"}.`;
}

// ─── POST /generate-plan ───────────────────────────────────────────────────────
app.post("/generate-plan", async (req, res) => {
  const {
    plotSize,
    facingDirection,
    floors,
    bedrooms,
    bathrooms,
    parking,
    kitchenType,
    vastu,
  } = req.body;

  // Basic validation
  if (!plotSize || !facingDirection || !floors || !bedrooms || !bathrooms) {
    return res
      .status(400)
      .json({ error: "Missing required fields. Please fill all inputs." });
  }

  const openai = getOpenAIClient();
  if (!openai) {
    return res.status(500).json({
      error: "OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.",
    });
  }

  try {
    console.log(
      `[${new Date().toISOString()}] Generating plan for ${plotSize} sq yd, ${facingDirection} facing, ${floors} floor(s), ${bedrooms} BHK`
    );

    const prompt = buildArchitectPrompt(req.body);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert residential architect and civil engineer. You always return responses as valid JSON only, with no markdown formatting, no code blocks, and no extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const rawContent = completion.choices[0].message.content.trim();

    // Parse the JSON response from AI
    let planData;
    try {
      // Strip any accidental markdown code fences
      const cleaned = rawContent
        .replace(/^```json\n?/, "")
        .replace(/^```\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      planData = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      console.error("Raw AI response:", rawContent);
      return res.status(500).json({
        error:
          "AI returned an unexpected format. Please try again.",
        raw: rawContent,
      });
    }

    // Return the structured plan to frontend
    res.json({
      success: true,
      inputData: req.body,
      plan: planData,
    });
  } catch (err) {
    console.error("OpenAI API Error:", err.message);

    if (err.status === 401) {
      return res
        .status(401)
        .json({ error: "Invalid OpenAI API key. Please check your .env file." });
    }
    if (err.status === 429) {
      return res
        .status(429)
        .json({ error: "OpenAI rate limit exceeded. Please wait and try again." });
    }
    if (err.status === 400) {
      return res
        .status(400)
        .json({ error: "Invalid request to OpenAI. Check your inputs." });
    }

    res.status(500).json({
      error: "Failed to generate plan. " + err.message,
    });
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    openaiConfigured: !!process.env.OPENAI_API_KEY,
  });
});

// ─── Serve frontend for all other routes ──────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏠 AI House Plan Generator`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log(
    `🔑 OpenAI Key: ${process.env.OPENAI_API_KEY ? "✅ Configured" : "❌ NOT SET — add to .env"}`
  );
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
