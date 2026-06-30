import { useEffect, useRef, useState } from "react";
import type { AuraData } from "./types";

const PRESETS = ["dark academia", "matcha morning", "cherry blossom", "cottagecore"];

const FALLBACK: AuraData = {
  name: "Stillness",
  tagline: "Light settles softly on the cooling day",
  palette: ["#1a1f3a", "#2d4a63", "#5b8a9e", "#c9a96e", "#f0e6d2"],
  keywords: ["calm", "warmth", "dusk"],
};

export default function Aura() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<AuraData>(FALLBACK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [revealKey, setRevealKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"generate" | "catalog">("generate");
  const [catalog, setCatalog] = useState<AuraData[]>([]);
  const [saved, setSaved] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (tab !== "catalog") return;
    fetch("/api/catalog")
      .then((r) => r.json())
      .then(setCatalog)
      .catch(() => {});
  }, [tab]);

  async function generate(prompt?: string) {
    const mood = (prompt ?? input).trim();
    if (!mood || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood }),
      });
      if (!res.ok) {
        let msg = "Couldn't generate. Check the backend and your .env.";
        try {
          const e = await res.json();
          msg = e.hint || e.error || msg;
        } catch {
          /* non-JSON error body */
        }
        throw new Error(msg);
      }
      const parsed: AuraData = await res.json();
      if (!parsed.palette || parsed.palette.length < 5) throw new Error("The model returned an invalid palette.");
      setData(parsed);
      setHasResult(true);
      setRevealKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (loading) return;
    try {
      await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: input || data.name, ...data }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch {
      /* ignore */
    }
  }

  function openFromCatalog(item: AuraData) {
    setData(item);
    setHasResult(true);
    setTab("generate");
    setRevealKey((k) => k + 1);
  }

  function copyPalette() {
    void navigator.clipboard?.writeText(data.palette.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const [a, b, c, d] = data.palette;
  const words = data.tagline.split(" ");

  return (
    <div className="relative h-dvh w-full overflow-hidden select-none text-white">
      {/* Living aura — original look */}
      <div className="absolute inset-0" aria-hidden="true">
        <div
          className="au-orb"
          style={{
            background: a,
            width: "55%",
            height: "55%",
            top: "-10%",
            left: "-8%",
            animation: "drift1 14s ease-in-out infinite",
          }}
        />
        <div
          className="au-orb"
          style={{
            background: c,
            width: "50%",
            height: "50%",
            top: "20%",
            right: "-12%",
            animation: "drift2 17s ease-in-out infinite",
          }}
        />
        <div
          className="au-orb"
          style={{
            background: d,
            width: "45%",
            height: "45%",
            bottom: "-12%",
            left: "20%",
            animation: "drift3 20s ease-in-out infinite",
          }}
        />
        <div
          className="au-orb"
          style={{
            background: b,
            width: "38%",
            height: "38%",
            bottom: "5%",
            right: "8%",
            animation: "drift1 16s ease-in-out infinite",
            opacity: 0.6,
          }}
        />
      </div>
      <div className="absolute inset-0 bg-[#0a0a12]/35" aria-hidden="true" />

      {/* Tiny brand label, top center */}
      <div
        className="absolute left-0 right-0 top-4 z-10 text-center sm:top-6"
        style={{ fontSize: "0.75rem", letterSpacing: "0.35em" }}
      >
        <span className="uppercase text-white/60">Aura</span>
        <span className="text-white/45"> · aesthetic generator</span>
      </div>

      {/* Tabs */}
      <div className="absolute left-0 right-0 top-12 z-20 flex justify-center sm:top-16">
        <div className="flex gap-1 rounded-full border border-white/15 bg-white/10 p-1 backdrop-blur">
          {(["generate", "catalog"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                tab === t ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
            >
              {t === "generate" ? "Generate" : "Catalog"}
            </button>
          ))}
        </div>
      </div>

      {/* Everything centered as one group */}
      <main className="relative z-10 flex h-full w-full flex-col items-center justify-center px-5 py-8 text-center sm:px-6 sm:py-20">
        {tab === "generate" && (
          <div className="flex w-full max-w-2xl flex-col items-center" key={revealKey}>
            <div
              className="au-fade mb-3 uppercase text-white/55"
              style={{ fontSize: "0.75rem", letterSpacing: "0.3em", animationDelay: "0ms" }}
            >
              {data.name}
            </div>
            <h1
              className="font-serif text-3xl sm:text-4xl md:text-6xl"
              style={{ lineHeight: 1.08, textShadow: "0 2px 24px rgba(0,0,0,.55)" }}
            >
              {words.map((w, i) => (
                <span
                  key={i}
                  className="au-word"
                  style={{ display: "inline-block", marginRight: "0.28em", animationDelay: `${120 + i * 90}ms` }}
                >
                  {w}
                </span>
              ))}
            </h1>

            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:mt-6">
              {data.keywords.map((k, i) => (
                <span
                  key={k}
                  className="au-fade rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm backdrop-blur"
                  style={{ animationDelay: `${500 + i * 110}ms`, textShadow: "0 1px 8px rgba(0,0,0,.4)" }}
                >
                  {k}
                </span>
              ))}
            </div>

            <div
              className="mt-4 grid w-full grid-cols-2 gap-2 sm:mt-6 sm:flex sm:h-24 sm:items-end"
              key={"p" + revealKey}
            >
              {data.palette.map((hex, i) => (
                <button
                  key={hex + i}
                  onClick={copyPalette}
                  className={`
        au-swatch
        flex
        h-14
items-end
rounded-xl
sm:h-full
        p-2
        transition-transform
        hover:scale-105
        sm:h-full
        sm:flex-1
        ${i === data.palette.length - 1 ? "col-span-2" : ""}
      `}
                  style={{
                    background: hex,
                    animationDelay: `${i * 80}ms`,
                    boxShadow: "0 8px 30px rgba(0,0,0,.35)",
                  }}
                  title="Copy palette"
                >
                  <span className="rounded bg-black/40 px-1 py-0.5 font-mono text-[9px] text-white/90 sm:text-[10px]">
                    {hex.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="mt-4 w-full space-y-2 sm:mt-5 sm:space-y-3">
              {error && <p className="text-sm text-rose-200">{error}</p>}
              <div className="flex items-stretch gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generate()}
                  placeholder="Enter a mood…"
                  className="
      min-w-0
      flex-1
      rounded-xl
      border border-white/15
      bg-white/10
px-4 py-2.5 sm:py-3
      text-white
      outline-none
      backdrop-blur
      transition-colors
      placeholder:text-white/40
      focus:border-white/40
    "
                />

                <button
                  onClick={() => generate()}
                  disabled={loading || !input.trim()}
                  className="
  flex
  min-w-[52px]
  items-center
  justify-center
  rounded-xl
  border border-white/15
  bg-white/10
px-4
py-2.5
sm:py-3
  font-medium
  text-white
  backdrop-blur
  transition-all
  hover:scale-[1.02]
  hover:border-white/30
  hover:bg-white/15
  active:scale-[0.98]
  disabled:cursor-not-allowed
  disabled:opacity-40
  sm:min-w-[120px]
  sm:px-6
"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white" />
                      </span>
                    </div>
                  ) : copied ? (
                    <>
                      <span className="sm:hidden">✓</span>
                      <span className="hidden sm:inline">Copied ✓</span>
                    </>
                  ) : (
                    <>
                      <span className="sm:hidden">✨</span>
                      <span className="hidden sm:inline">Create</span>
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={save}
                disabled={loading || !hasResult}
                className="w-full rounded-xl border border-white/10 px-4 py-2 text-xs uppercase tracking-wider text-white/60 transition-colors hover:border-white/30 hover:text-white disabled:opacity-40"
              >
                {saved ? "Saved ✓" : "♥ Save to catalog"}
              </button>
              <div className="flex flex-wrap justify-center gap-2 pt-0.5 sm:pt-1">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    disabled={loading}
                    onClick={() => {
                      setInput(p);
                      generate(p);
                    }}
                    className="
  rounded-full
  border
  border-white/10
  px-3
  py-1.5
  text-xs
  text-white/60
  transition-colors
  hover:border-white/30
  hover:text-white
  disabled:cursor-not-allowed
"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab === "catalog" && (
          <div className="aura-scroll flex max-h-[70vh] w-full max-w-2xl flex-col gap-3 overflow-y-auto py-2">
            {catalog.length === 0 && <p className="text-sm text-white/50">Oops! You don't have any saved pallete.</p>}
            {catalog.map((item, idx) => (
              <button
                key={idx}
                onClick={() => openFromCatalog(item)}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left backdrop-blur transition-colors hover:border-white/30 hover:bg-white/10"
              >
                <div className="flex h-10 w-24 shrink-0 overflow-hidden rounded-lg">
                  {item.palette.map((hex, i) => (
                    <div key={i} className="flex-1" style={{ background: hex }} />
                  ))}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs uppercase tracking-wider text-white/50">{item.name}</div>
                  <div className="truncate text-sm text-white/90">{item.tagline}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <div
        className="absolute left-0 right-0 bottom-4 z-10 text-center sm:bottom-6"
        style={{ fontSize: "0.75rem", letterSpacing: "0.35em" }}
      >
        <div className="uppercase text-white/60">made by Alina Luzanova</div>
        <a href="https://github.com/AlinaLuzanova" target="_blank" rel="noopener noreferrer" className="text-white/45">
          join my gitHub
        </a>
      </div>
    </div>
  );
}
