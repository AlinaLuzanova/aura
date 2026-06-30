// GET /api/catalog — список последних аур
export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT id, mood, name, tagline, palette, keywords, created_at " + "FROM auras ORDER BY created_at DESC LIMIT 60"
  ).all();

  const items = results.map((r) => ({
    id: r.id,
    mood: r.mood,
    name: r.name,
    tagline: r.tagline,
    palette: JSON.parse(r.palette),
    keywords: JSON.parse(r.keywords),
    created_at: r.created_at,
  }));

  return Response.json(items);
}

// POST /api/catalog — сохранить ауру
export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }

  const { mood, name, tagline, palette, keywords } = body || {};
  if (!name || !tagline || !Array.isArray(palette) || palette.length < 5) {
    return Response.json({ error: "invalid aura" }, { status: 400 });
  }

  await env.DB.prepare(
    "INSERT INTO auras (mood, name, tagline, palette, keywords, created_at) " + "VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(
      String(mood || name),
      String(name),
      String(tagline),
      JSON.stringify(palette),
      JSON.stringify(keywords || []),
      Date.now()
    )
    .run();

  return Response.json({ ok: true }, { status: 201 });
}
