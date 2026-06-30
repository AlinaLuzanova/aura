import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "..", "dist");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(DIST));

const PORT = process.env.PORT || 8787;

// OpenAI-compatible endpoint. Defaults to Groq (free, no credit card).
// You can point it at any /v1 provider or your own FreeLLMAPI instance.
const BASE_URL = (process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");
const API_KEY = process.env.LLM_API_KEY || "";
const MODEL = process.env.LLM_MODEL || "llama-3.3-70b-versatile";

const SYSTEM = "You only return a valid JSON object, no markdown and no explanations.";

const PROMPT = (mood) => `Mood: "${mood}".
Generate an aesthetic for this mood in this format:
{
  "name": "short evocative title in English (1-2 words)",
  "tagline": "one vivid poetic line in English, a real readable phrase of 5-8 words, no period at the end",
  "palette": ["#hex", "#hex", "#hex", "#hex", "#hex"],
  "keywords": ["word", "word", "word"]
}
Palette: 5 harmonious colors from dark to light that truly convey the mood. Keywords in English.`;

function callLLM(mood, useJsonMode) {
  const body = {
    model: MODEL,
    max_tokens: 1000,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: PROMPT(mood) },
    ],
  };
  // Not every provider supports response_format — it's optional.
  if (useJsonMode) body.response_format = { type: "json_object" };

  return fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(API_KEY ? { authorization: `Bearer ${API_KEY}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

app.post("/api/generate", async (req, res) => {
  const mood = String(req.body?.mood ?? "").trim();
  if (!mood) return res.status(400).json({ error: "mood is required" });

  // 1) Reach the provider
  let r;
  try {
    r = await callLLM(mood, true);
    if (r.status === 400) r = await callLLM(mood, false); // provider may reject JSON mode
  } catch (netErr) {
    console.error("[network] cannot reach LLM endpoint:", String(netErr));
    return res.status(502).json({
      error: "Can't reach the LLM endpoint",
      hint: `Check LLM_BASE_URL (currently ${BASE_URL}). If it points to a FreeLLMAPI instance on :3001, it isn't running. The easiest fix is Groq: set LLM_BASE_URL=https://api.groq.com/openai/v1 and a key from console.groq.com.`,
    });
  }

  // 2) Handle HTTP-level errors with a clear reason
  if (!r.ok) {
    const detail = await r.text();
    console.error(`[upstream] ${r.status}:`, detail.slice(0, 500));
    const hint =
      r.status === 401 || r.status === 403
        ? "Invalid or missing LLM_API_KEY in .env."
        : r.status === 404
        ? `The provider has no model "${MODEL}". Set a valid LLM_MODEL (e.g. llama-3.3-70b-versatile on Groq).`
        : r.status === 429
        ? "Rate limit reached on the free tier — wait a moment and retry."
        : "Upstream provider error.";
    return res.status(502).json({ error: hint, status: r.status });
  }

  // 3) Parse the model output
  try {
    const json = await r.json();
    const text = json.choices?.[0]?.message?.content ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed.palette) || parsed.palette.length < 5) {
      throw new Error("model returned an invalid palette");
    }
    res.json(parsed);
  } catch (e) {
    console.error("[parse]", String(e));
    res.status(502).json({ error: "Sorry, something wrong happened with model :( Try again." });
  }
});

// Any non-API route falls back to the SPA's index.html.
app.get("*", (_req, res) => res.sendFile(path.join(DIST, "index.html")));

app.listen(PORT, () => {
  console.log(`API ready on http://localhost:${PORT}  →  ${BASE_URL}  (${MODEL})`);
  if (!API_KEY) {
    console.warn("⚠  LLM_API_KEY is empty. Set it in .env (free key: https://console.groq.com/keys).");
  }
});
