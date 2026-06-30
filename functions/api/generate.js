// Cloudflare Pages Function — handles POST /api/generate
// Place this file at:  functions/api/generate.js
// Env vars are read from context.env (set them in the Pages dashboard).

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

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const BASE_URL = (env.LLM_BASE_URL || "https://api.z.ai/api/paas/v4").replace(/\/+$/, "");
  const API_KEY = env.LLM_API_KEY || "";
  const MODEL = env.LLM_MODEL || "glm-4.5-flash";

  let payloadIn;
  try {
    payloadIn = await request.json();
  } catch {
    payloadIn = {};
  }
  const mood = String(payloadIn?.mood ?? "").trim();
  if (!mood) return json({ error: "mood is required" }, 400);

  function callLLM(useJsonMode) {
    const body = {
      model: MODEL,
      max_tokens: 1000,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: PROMPT(mood) },
      ],
    };
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

  // 1) Достучаться до провайдера
  let r;
  try {
    r = await callLLM(true);
    if (r.status === 400) r = await callLLM(false); // провайдер мог не принять JSON-режим
  } catch (netErr) {
    return json(
      {
        error: "Can't reach the LLM endpoint",
        hint: `Check LLM_BASE_URL (currently ${BASE_URL}) and your network.`,
      },
      502
    );
  }

  // 2) Понятная причина при HTTP-ошибке
  if (!r.ok) {
    const hint =
      r.status === 401 || r.status === 403
        ? "Invalid or missing LLM_API_KEY."
        : r.status === 404
        ? `The provider has no model "${MODEL}". Set a valid LLM_MODEL.`
        : r.status === 429
        ? "Rate limit reached on the free tier — wait a moment and retry."
        : "Upstream provider error.";
    return json({ error: hint, status: r.status }, 502);
  }

  // 3) Разбор ответа модели
  try {
    const data = await r.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed.palette) || parsed.palette.length < 5) {
      throw new Error("invalid palette");
    }
    return json(parsed, 200);
  } catch {
    return json({ error: "The model didn't return valid JSON. Try again." }, 502);
  }
}