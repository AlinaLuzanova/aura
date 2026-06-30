import { useEffect, useRef, useState } from "react";
import type { AuraData } from "./types";

const PRESETS = [
  "dark academia",
  "matcha morning",
  "cherry blossom",
  "cottagecore",
];

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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
      setRevealKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyPalette() {
    void navigator.clipboard?.writeText(data.palette.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const [a, b, c, d] = data.palette;
  const words = data.tagline.split(" ");

  return (
    <div className="relative w-full min-h-screen overflow-hidden text-white select-none">
      {/* Living aura — original look */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="au-orb" style={{ background: a, width: "55%", height: "55%", top: "-10%", left: "-8%", animation: "drift1 14s ease-in-out infinite" }} />
        <div className="au-orb" style={{ background: c, width: "50%", height: "50%", top: "20%", right: "-12%", animation: "drift2 17s ease-in-out infinite" }} />
        <div className="au-orb" style={{ background: d, width: "45%", height: "45%", bottom: "-12%", left: "20%", animation: "drift3 20s ease-in-out infinite" }} />
        <div className="au-orb" style={{ background: b, width: "38%", height: "38%", bottom: "5%", right: "8%", animation: "drift1 16s ease-in-out infinite", opacity: 0.6 }} />
      </div>
      <div className="absolute inset-0 bg-[#0a0a12]/35" aria-hidden="true" />

      {/* Tiny brand label, top center */}
      <div className="absolute left-0 right-0 top-6 z-10 text-center" style={{ fontSize: "0.75rem", letterSpacing: "0.35em" }}>
        <span className="uppercase text-white/60">Aura</span>
        <span className="text-white/45"> · aesthetic generator</span>
      </div>

      {/* Everything centered as one group */}
      <main className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex w-full max-w-2xl flex-col items-center" key={revealKey}>
          <div className="au-fade mb-3 uppercase text-white/55" style={{ fontSize: "0.75rem", letterSpacing: "0.3em", animationDelay: "0ms" }}>
            {data.name}
          </div>
          <h1 className="font-serif text-4xl md:text-6xl" style={{ lineHeight: 1.08, textShadow: "0 2px 24px rgba(0,0,0,.55)" }}>
            {words.map((w, i) => (
              <span key={i} className="au-word" style={{ display: "inline-block", marginRight: "0.28em", animationDelay: `${120 + i * 90}ms` }}>
                {w}
              </span>
            ))}
          </h1>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {data.keywords.map((k, i) => (
              <span key={k} className="au-fade rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm backdrop-blur" style={{ animationDelay: `${500 + i * 110}ms`, textShadow: "0 1px 8px rgba(0,0,0,.4)" }}>
                {k}
              </span>
            ))}
          </div>

<div
  className="mt-6 grid w-full grid-cols-2 gap-2 sm:flex sm:h-24 sm:items-end"
  key={"p" + revealKey}
>
  {data.palette.map((hex, i) => (
    <button
      key={hex + i}
      onClick={copyPalette}
      className={`
        au-swatch
        flex
        h-16
        items-end
        rounded-xl
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
          <div className="mt-5 w-full space-y-3">
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
      px-4 py-3
      text-white
      outline-none
      backdrop-blur
      transition-colors
      placeholder:text-white/40
      focus:border-white/40
    "
  />

  <button
    onClick={()=>generate()}
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
  py-3
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
            <span className="animate-pulse text-lg">✦</span>
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
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setInput(p); generate(p); }}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-white/30 hover:text-white"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

            <div className="absolute left-0 right-0 bottom-6 z-10 text-center" style={{ fontSize: "0.75rem", letterSpacing: "0.35em" }}>
        <div className="uppercase text-white/60">made by Alina Luzanova</div>
        <a href="https://github.com/AlinaLuzanova" target="_blank" rel="noopener noreferrer" className="text-white/45">join my gitHub</a>
      </div>

    </div>
  );
}
