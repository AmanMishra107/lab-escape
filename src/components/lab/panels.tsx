import { useEffect, useRef, useState } from "react";
import { OBJECT_MAP } from "../../data/labObjects";
import { store, useLab } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import type { ObjectId } from "../../systems/types";
import { AchievementsApp } from "../apps/AchievementsApp";
import { NoticesApp } from "../apps/NoticesApp";
import { PhoneApp } from "../apps/PhoneApp";
import { Desktop } from "../os/Desktop";
import { BrutButton, Panel, Tag } from "../ui/brut";

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};


const ROASTS = [
  "Still clicking? Bold strategy.",
  "Time doesn't bend for clickers.",
  "Your prof is watching. Just saying.",
  "That's not how clocks work.",
  "Nice try. Still ticking.",
  "The clock remains unimpressed.",
  "You absolute menace.",
  "What did you expect? More time?",
  "Yaar, chhod isko. Padh le.",
  "✨ Click → time not paused ✨",
  "This is not a viva question.",
  "Even DSA can't fix this.",
  "Sir is not coming. Clock is.",
  "Bhai, assignment baki hai.",
  "Pro gamer move: still failed.",
];

const PANIC_MSGS = [
  "⚠️ VIVA IN 30 MIN",
  "🔥 SUBMIT OR PERISH",
  "📋 HAVE YOU EVEN STARTED?",
  "⏰ TICK TOCK BHAI",
  "🚨 THIS IS FINE (it is not)",
];

function ClockPanel() {
  const remaining = useLab(() => store.remainingMs());
  const phase = useLab(() => store.phase());
  const [clicks, setClicks] = useState(0);
  const [roast, setRoast] = useState<string | null>(null);
  const [roastKey, setRoastKey] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; vx: number; vy: number; life: number; color: string }[]>([]);
  const [panicIdx, setPanicIdx] = useState(0);
  const [shake, setShake] = useState(false);
  const [hovered, setHovered] = useState(false);
  const roastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const totalMs = 4 * 60 * 60 * 1000;
  const pct = Math.min(1, Math.max(0, remaining / totalMs));
  const isPanic = phase === "panic" || phase === "escape" || remaining < 15 * 60 * 1000;
  const isLow = remaining < 30 * 60 * 1000;

  // Panic message cycling
  useEffect(() => {
    if (!isPanic) return;
    const t = window.setInterval(() => setPanicIdx((i) => (i + 1) % PANIC_MSGS.length), 1500);
    return () => window.clearInterval(t);
  }, [isPanic]);

  // Particle animation loop
  useEffect(() => {
    let last = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.2, life: p.life - dt / 16 }))
          .filter((p) => p.life > 0),
      );
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Analog clock canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 6;

    const now = new Date();
    const hrs = now.getHours() % 12;
    const mins = now.getMinutes();
    const secs = now.getSeconds();
    const ms = now.getMilliseconds();

    const secAngle = ((secs + ms / 1000) / 60) * Math.PI * 2 - Math.PI / 2;
    const minAngle = ((mins + secs / 60) / 60) * Math.PI * 2 - Math.PI / 2;
    const hrAngle = ((hrs + mins / 60) / 12) * Math.PI * 2 - Math.PI / 2;

    const inkColor = "#1a1a1a";
    const redColor = isPanic ? "#d94f3d" : "#1a1a1a";

    ctx.clearRect(0, 0, w, h);

    // Face
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = isPanic ? "#fff0ee" : "#f5f0e8";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = inkColor;
    ctx.stroke();

    // Hour tick marks
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const big = i % 3 === 0;
      const len = big ? r * 0.18 : r * 0.1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r - len), cy + Math.sin(a) * (r - len));
      ctx.lineTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3));
      ctx.lineWidth = big ? 3 : 1.5;
      ctx.strokeStyle = inkColor;
      ctx.stroke();
    }

    // Hour hand
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(hrAngle) * r * 0.55, cy + Math.sin(hrAngle) * r * 0.55);
    ctx.lineWidth = 5;
    ctx.strokeStyle = inkColor;
    ctx.lineCap = "round";
    ctx.stroke();

    // Minute hand
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(minAngle) * r * 0.78, cy + Math.sin(minAngle) * r * 0.78);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = inkColor;
    ctx.stroke();

    // Second hand
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(secAngle) * r * 0.15, cy - Math.sin(secAngle) * r * 0.15);
    ctx.lineTo(cx + Math.cos(secAngle) * r * 0.9, cy + Math.sin(secAngle) * r * 0.9);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = redColor;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = redColor;
    ctx.fill();
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    sound.play("click");
    store.interacted();
    const n = clicks + 1;
    setClicks(n);
    if (n >= 3) store.findEgg("clock_x3");

    // Spawn particles
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const colors = isPanic
      ? ["#d94f3d", "#ff8c69", "#ffc107"]
      : ["#1a1a1a", "#4a90d9", "#f5c842", "#e87040"];
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: mx,
      y: my,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.8) * 8,
      life: 40 + Math.random() * 30,
      color: colors[Math.floor(Math.random() * colors.length)]!,
    }));
    setParticles((prev) => [...prev, ...newParticles]);

    // Roast
    const r = ROASTS[Math.floor(Math.random() * ROASTS.length)]!;
    setRoast(r);
    setRoastKey((k) => k + 1);
    setShake(true);
    setTimeout(() => setShake(false), 400);
    if (roastTimer.current) clearTimeout(roastTimer.current);
    roastTimer.current = setTimeout(() => setRoast(null), 2500);
  };

  const s = Math.max(0, Math.floor(remaining / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");

  // Progress arc color
  const arcColor = pct > 0.5 ? "#4caf50" : pct > 0.25 ? "#f5c842" : "#d94f3d";

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-5 overflow-hidden select-none">
      {/* Background panic grid */}
      {isPanic && (
        <div
          className="pointer-events-none absolute inset-0 opacity-5"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg,#d94f3d 0,#d94f3d 1px,transparent 0,transparent 40px),repeating-linear-gradient(90deg,#d94f3d 0,#d94f3d 1px,transparent 0,transparent 40px)",
          }}
        />
      )}

      {/* Panic banner */}
      {isPanic && (
        <div
          className="mono-label rounded-none border-2 border-lab-red bg-lab-red px-4 py-1 text-lab-paper text-xs tracking-widest"
          style={{ animation: "pulse 0.8s ease-in-out infinite" }}
        >
          {PANIC_MSGS[panicIdx]}
        </div>
      )}

      {/* Header */}
      {!isPanic && (
        <p className="mono-label text-[10px] tracking-widest opacity-60">LAB TIME REMAINING</p>
      )}

      {/* Clock row: analog + digital */}
      <div className="flex items-center gap-6">

        {/* Analog clock */}
        <div className="relative flex-shrink-0">
          <canvas
            ref={canvasRef}
            width={110}
            height={110}
            className="rounded-full"
            style={{
              filter: isPanic ? "drop-shadow(0 0 8px #d94f3d88)" : "drop-shadow(0 2px 6px #0002)",
            }}
          />
          {/* Sweep animation ring */}
          <svg
            className="pointer-events-none absolute inset-0"
            width={110}
            height={110}
            viewBox="0 0 110 110"
          >
            <circle
              cx={55}
              cy={55}
              r={48}
              fill="none"
              stroke={arcColor}
              strokeWidth={4}
              strokeDasharray={`${pct * 301.6} 301.6`}
              strokeLinecap="round"
              transform="rotate(-90 55 55)"
              style={{ transition: "stroke 1s, stroke-dasharray 1s linear" }}
              opacity={0.6}
            />
          </svg>
        </div>

        {/* Digital countdown */}
        <div className="flex flex-col items-center gap-1">
          <button
            className={`relative overflow-hidden border-3 border-lab-ink bg-lab-paper px-5 py-3 font-display tabular-nums transition-transform ${
              shake ? "scale-95" : hovered ? "scale-105" : "scale-100"
            }`}
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "-0.02em",
              color: isLow ? "#d94f3d" : "#1a1a1a",
              boxShadow: isPanic
                ? "4px 4px 0 #d94f3d"
                : "4px 4px 0 #1a1a1a",
              transition: "transform 0.1s, box-shadow 0.2s, color 0.5s",
            }}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* Particles */}
            {particles.map((p) => (
              <span
                key={p.id}
                className="pointer-events-none absolute rounded-full"
                style={{
                  left: p.x,
                  top: p.y,
                  width: 6,
                  height: 6,
                  background: p.color,
                  transform: "translate(-50%,-50%)",
                  opacity: p.life / 70,
                }}
              />
            ))}

            <span>{hh}</span>
            <span
              style={{
                animation: "ping 1s step-end infinite",
                display: "inline-block",
                width: "0.5em",
                textAlign: "center",
              }}
            >
              :
            </span>
            <span>{mm}</span>
            <span
              style={{
                animation: "ping 1s step-end infinite",
                display: "inline-block",
                width: "0.5em",
                textAlign: "center",
              }}
            >
              :
            </span>
            <span>{ss}</span>

            {/* Hover shimmer */}
            {hovered && (
              <span
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, #ffffff22 50%, transparent 100%)",
                  animation: "shimmer 0.8s linear",
                }}
              />
            )}
          </button>

          {/* Progress bar */}
          <div className="h-1.5 w-full overflow-hidden border border-lab-ink/20 bg-lab-ink/10">
            <div
              className="h-full transition-all duration-1000"
              style={{ width: `${pct * 100}%`, background: arcColor }}
            />
          </div>

          {/* Click count */}
          {clicks > 0 && (
            <p className="mono-label text-[9px] opacity-50">
              clicked {clicks}× · {clicks >= 3 ? "🥚 egg found" : `${3 - clicks} more for egg`}
            </p>
          )}
        </div>
      </div>

      {/* Roast bubble */}
      {roast && (
        <div
          key={roastKey}
          className="mono-label max-w-xs border-2 border-lab-ink bg-card px-3 py-1.5 text-center text-xs"
          style={{
            animation: "fadeInUp 0.2s ease-out",
          }}
        >
          {roast}
        </div>
      )}

      {/* Footer hint */}
      {!roast && (
        <p className="mono-label text-[9px] opacity-40">
          click the clock · {clicks === 0 ? "it does something" : "keep going"}
        </p>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}


function WindowPanel() {
  const [seconds, setSeconds] = useState(0);
  const [mode, setMode] = useState<"day" | "rain" | "night" | "sunset">("day");
  const [planes, setPlanes] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [birds, setBirds] = useState<{ id: number; x: number; y: number; type: "bird" | "ufo" | "drone" }[]>([]);
  const [score, setScore] = useState(0);
  const [radioActive, setRadioActive] = useState(false);
  const [planeCount, setPlaneCount] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (seconds >= 20) store.findEgg("window_stare");
  }, [seconds]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (Math.random() < 0.6) {
        const id = Date.now();
        const types: ("bird" | "ufo" | "drone")[] = mode === "night" ? ["ufo", "bird"] : ["bird", "drone"];
        const type = types[Math.floor(Math.random() * types.length)]!;
        const newTarget = {
          id,
          x: -10,
          y: 15 + Math.random() * 65,
          type,
        };
        setBirds((prev) => [...prev.slice(-6), newTarget]);
      }
    }, 2800);
    return () => window.clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    const anim = window.setInterval(() => {
      setBirds((prev) =>
        prev
          .map((b) => ({ ...b, x: b.x + 2.5 }))
          .filter((b) => b.x < 110),
      );
      setPlanes((prev) =>
        prev
          .map((p) => ({ ...p, x: p.x + 3.5, y: p.y - 0.4 }))
          .filter((p) => p.x < 110),
      );
    }, 50);
    return () => window.clearInterval(anim);
  }, []);

  useEffect(() => {
    if (!radioActive) return;
    const interval = window.setInterval(() => {
      store.reduceBoredom(1);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [radioActive]);

  const throwPaperPlane = () => {
    sound.play("pop");
    store.interacted();
    store.reduceBoredom(8);
    store.addXp(10, "Paper plane launched");
    const count = planeCount + 1;
    setPlaneCount(count);

    if (count >= 3) {
      store.findEgg("paper_pilot");
      store.unlock("paper_pilot");
    }

    const planeTexts = [
      "24.5m ➔ Landed on canteen roof!",
      "38.1m ➔ Flew past HOD's office window!",
      "19.2m ➔ Caught in tree branch!",
      "45.0m ➔ Flew out of campus boundaries!",
    ];

    const text = planeTexts[Math.floor(Math.random() * planeTexts.length)]!;
    setPlanes((prev) => [...prev, { id: Date.now(), x: 10, y: 70, text }]);
  };

  const catchTarget = (id: number, type: string) => {
    sound.play(type === "ufo" ? "glitch" : "success");
    store.interacted();
    store.reduceBoredom(6);
    store.addXp(15, `Spotted ${type}`);
    setScore((s) => s + 1);
    setBirds((prev) => prev.filter((b) => b.id !== id));

    if (type === "ufo") {
      store.findEgg("ufo_spotter");
      store.unlock("ufo_spotter");
      store.toast("egg", "🛸 UFO SPOTTED!", "The aliens are monitoring Lab 404.");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-lab-ink bg-card p-2">
        <div className="flex items-center gap-1.5">
          <span className="mono-label text-[10px] opacity-70">WEATHER:</span>
          {[
            { key: "day", label: "☀️ DAY", bg: "bg-amber-300 text-black" },
            { key: "rain", label: "🌧️ STORM", bg: "bg-slate-700 text-white" },
            { key: "night", label: "🌌 NIGHT", bg: "bg-indigo-950 text-cyan-300" },
            { key: "sunset", label: "🌇 SUNSET", bg: "bg-rose-500 text-white" },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setMode(m.key as any);
                sound.play("click");
                store.reduceBoredom(3);
              }}
              className={`brut-sm mono-label px-2 py-0.5 text-[10px] transition-transform ${mode === m.key ? `${m.bg} font-bold scale-105 shadow-md` : "bg-card text-foreground opacity-80"
                }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Lo-Fi Radio */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setRadioActive((r) => !r);
              sound.play(radioActive ? "close" : "open");
              store.interacted();
            }}
            className={`brut-sm mono-label px-2 py-0.5 text-[10px] ${radioActive ? "bg-lab-green text-lab-ink font-bold animate-pulse" : "bg-card"
              }`}
          >
            📻 LO-FI RADIO: {radioActive ? "ON (REDUCING BOREDOM)" : "OFF"}
          </button>

          <Tag tone="yellow">OBSERVED: {seconds}s</Tag>
        </div>
      </div>

      {/* Outdoor View Display */}
      <div
        className={`relative min-h-0 flex-1 overflow-hidden border-3 border-lab-ink transition-colors duration-500 ${mode === "day"
            ? "bg-gradient-to-b from-sky-400 via-sky-200 to-amber-100"
            : mode === "rain"
              ? "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700"
              : mode === "night"
                ? "bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900"
                : "bg-gradient-to-b from-rose-500 via-amber-400 to-amber-200"
          }`}
      >
        {/* Rain animation overlay */}
        {mode === "rain" && (
          <div className="pointer-events-none absolute inset-0 opacity-40 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,rgba(255,255,255,0.6)_100%)] bg-[length:3px_40px] animate-pulse" />
        )}

        {/* Sun / Moon */}
        {mode === "day" && (
          <div className="absolute top-6 right-12 h-14 w-14 rounded-full bg-yellow-300 border-3 border-lab-ink shadow-[0_0_20px_rgba(253,224,71,0.8)]" />
        )}
        {mode === "night" && (
          <div className="absolute top-6 right-12 h-12 w-12 rounded-full bg-slate-100 border-3 border-lab-ink shadow-[0_0_25px_rgba(241,245,249,0.9)]">
            <div className="absolute top-2 left-2 h-3 w-3 rounded-full bg-slate-300 opacity-60" />
          </div>
        )}
        {mode === "sunset" && (
          <div className="absolute bottom-16 right-1/3 h-20 w-20 rounded-full bg-rose-400 border-3 border-lab-ink opacity-90 shadow-lg" />
        )}

        {/* Campus Skyline */}
        <svg
          viewBox="0 0 1000 300"
          className="pointer-events-none absolute bottom-0 w-full h-40"
          preserveAspectRatio="none"
        >
          <path d="M0 180 L120 90 L240 180 L400 70 L580 190 L750 100 L1000 200 V300 H0 Z" fill="#1e293b" opacity="0.8" />
          <path d="M0 220 L180 140 L350 220 L600 130 L800 210 L1000 160 V300 H0 Z" fill="#0f172a" />
          <rect x="150" y="160" width="70" height="140" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="520" y="140" width="90" height="160" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="780" y="170" width="60" height="130" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        </svg>

        {/* Window Frame Grid Overlay */}
        <div className="pointer-events-none absolute inset-0 border-[12px] border-lab-ink">
          <div className="absolute top-0 bottom-0 left-1/2 w-3 -translate-x-1/2 bg-lab-ink" />
          <div className="absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2 bg-lab-ink" />
        </div>

        {/* Flying Targets (Birds, Drones, UFOs) */}
        {birds.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => catchTarget(b.id, b.type)}
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 active:scale-95"
          >
            {b.type === "ufo" ? (
              <span className="brut-sm text-lg bg-emerald-400 text-black px-2 py-0.5 font-bold shadow-lg">
                🛸 UFO!
              </span>
            ) : b.type === "drone" ? (
              <span className="brut-sm text-xs bg-sky-300 text-black px-1.5 py-0.5 font-bold">
                🛸 DRONE
              </span>
            ) : (
              <span className="text-2xl drop-shadow-md">🕊️</span>
            )}
          </button>
        ))}

        {/* Flying Paper Planes */}
        {planes.map((p) => (
          <div
            key={p.id}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            className="pointer-events-none absolute z-20 flex items-center gap-1.5 -translate-x-1/2 -translate-y-1/2"
          >
            <span className="text-2xl">✈️</span>
            <span className="mono-label text-[10px] bg-lab-yellow text-lab-ink px-1.5 py-0.5 border border-lab-ink font-bold shadow-md">
              {p.text}
            </span>
          </div>
        ))}
      </div>

      {/* Dashboard Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-lab-ink bg-card p-2">
        <div className="flex items-center gap-2">
          <BrutButton variant="warn" className="text-xs" onClick={throwPaperPlane}>
            ✈️ THROW PAPER PLANE ({planeCount})
          </BrutButton>
          <span className="mono-label text-[10px] opacity-80 font-bold">
            SPOTTED: {score} TARGETS
          </span>
        </div>

        <p className="mono-label text-[10px] text-center opacity-70">
          Click flying birds & UFOs outside the window to score XP and obliterate boredom!
        </p>
      </div>
    </div>
  );
}

function DeskPanel() {
  const count = useLab((s) => s.rt.doNotClickCount);
  const [pixelFound, setPixelFound] = useState(false);
  const messages = ["DO NOT CLICK", "You clicked it.", "I told you not to.", "Bro.", "Stop.", "Fine."];
  return (
    <div className="grid h-full gap-3 sm:grid-cols-2">
      <Panel title="STICKY NOTES" className="bg-lab-yellow">
        <ul className="space-y-2 text-sm">
          <li>“wifi pwd: ask nobody”</li>
          <li>“fire exit code — check whiteboard corner”</li>
          <li>“practical file DUE (this is from last month)”</li>
          <li>“the printer knows”</li>
        </ul>
      </Panel>
      <div className="space-y-3">
        <Panel title="UNLABELLED BUTTON">
          <BrutButton
            variant={count >= 5 ? "danger" : "warn"}
            className="w-full"
            onClick={() => {
              const n = count + 1;
              store.setRt({ doNotClickCount: n });
              store.interacted();
              sound.play(n >= 5 ? "glitch" : "click");
              if (n >= 5) {
                store.glitchBurst(1);
                store.findEgg("do_not_click");
                store.unlock("do_not_click");
              }
            }}
          >
            {messages[Math.min(count, messages.length - 1)]}
          </BrutButton>
        </Panel>
        <Panel title="DESK SURFACE">
          <p className="text-sm">Scratched into the laminate: “I was here. Twice. Against my will.”</p>
          <button
            aria-label="A single pixel"
            className="mt-3 h-[3px] w-[3px] bg-lab-ink"
            onClick={() => {
              setPixelFound(true);
              store.findEgg("pixel");
            }}
          />
          {pixelFound && <p className="mono-label mt-2">PIXEL FOUND. Type FOUND in the hidden-object puzzle.</p>}
        </Panel>
      </div>
    </div>
  );
}

interface DrawerItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  clue?: string;
  collectibleId?: "usb" | "chip" | "attendance_slip";
}

function DrawerPanel() {
  const [activeTier, setActiveTier] = useState<0 | 1 | 2>(0);
  const [falseBottomOpened, setFalseBottomOpened] = useState(false);
  const [inspectedItem, setInspectedItem] = useState<DrawerItem | null>(null);

  const [collectedItems, setCollectedItems] = useState<string[]>([]);

  const TIERS = [
    { id: 0, label: "TOP DRAWER", title: "Stationery & Junk", icon: "✏️" },
    { id: 1, label: "MIDDLE DRAWER", title: "Lab Manuals & USB", icon: "📁" },
    { id: 2, label: "BOTTOM DRAWER", title: "False Bottom & Chip", icon: "🔒" },
  ] as const;

  const DRAWER_ITEMS: DrawerItem[][] = [
    // Top Drawer (Tier 0)
    [
      {
        id: "id_card",
        name: "Student ID Card (2018)",
        icon: "🆔",
        desc: "Belongs to a senior from 2018. The roll number in the corner reads 4040.",
        clue: "🔑 HINT: 4040 is the professor's passcode!",
      },
      {
        id: "broken_pen",
        name: "Dried Dry-Erase Pen",
        icon: "🖊️",
        desc: "Completely out of ink. Someone pressed too hard on the whiteboard.",
      },
      {
        id: "ruler",
        name: "Steel Metric Ruler",
        icon: "📏",
        desc: "30cm steel ruler. Useful for drawing straight lines or threatening wifi routers.",
      },
      {
        id: "candy",
        name: "Crumpled Candy Wrapper",
        icon: "🍬",
        desc: "A dusty wrapper from 2021. Smells vaguely like mango.",
      },
    ],
    // Middle Drawer (Tier 1)
    [
      {
        id: "lab_manual",
        name: "Physics Lab Manual 2024",
        icon: "📘",
        desc: "Stapled with hope and covered in coffee stains. Experiment 7 is bookmarked.",
      },
      {
        id: "usb_drive",
        name: "Bootable USB Flash Drive",
        icon: "💾",
        desc: "Red USB stick labeled 'LAB_RECOVERY_KEY'. Essential for computer diagnostics.",
        collectibleId: "usb",
      },
      {
        id: "attendance_slip",
        name: "Crumpled Attendance Slip",
        icon: "📜",
        desc: "Official attendance record. The HOD signature is surprisingly illegible.",
        collectibleId: "attendance_slip",
      },
    ],
    // Bottom Drawer (Tier 2)
    [
      {
        id: "manual_old",
        name: "Old Operating System Manual",
        icon: "📕",
        desc: "MS-DOS 6.22 Technical Reference Manual.",
      },
      {
        id: "false_latch",
        name: "Wooden False Bottom Compartment",
        icon: "🔒",
        desc: "The bottom wood panel feels loose. Slide the latch to open the hidden compartment!",
      },
    ],
  ];

  const handleCollect = (item: DrawerItem) => {
    if (!item.collectibleId) return;
    sound.play("success");
    store.interacted();

    if (!collectedItems.includes(item.id)) {
      setCollectedItems((prev) => [...prev, item.id]);
      store.giveItem(item.collectibleId);
      store.addXp(30, `Found ${item.name}`);
      store.reduceBoredom(15);
      store.toast("system", "ITEM COLLECTED", `${item.name} added to your Backpack!`);

      if (item.collectibleId === "chip") {
        store.findEgg("drawer_bottom");
      }
    }
  };

  const handleOpenFalseBottom = () => {
    sound.play("open");
    store.interacted();
    setFalseBottomOpened(true);
    store.addXp(25, "Unlocked false bottom");
    store.toast("system", "FALSE BOTTOM OPENED!", "Discovered secret hidden compartment!");
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Tier Selector Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-lab-ink bg-card p-2">
        <div className="flex items-center gap-1.5">
          <span className="mono-label text-[10px] opacity-70">CABINET TIER:</span>
          {TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTier(t.id);
                setInspectedItem(null);
                sound.play("click");
                store.interacted();
              }}
              className={`brut-sm mono-label px-2.5 py-1 text-xs font-bold transition-transform ${activeTier === t.id
                  ? "bg-lab-ink text-lab-paper scale-105 shadow-md"
                  : "bg-lab-yellow text-lab-ink hover:bg-yellow-300"
                }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <span className="mono-label text-[10px] font-bold text-amber-700">
          LOCATION: UNDER DESK CABINET
        </span>
      </div>

      {/* Main Interactive Drawer Interior View */}
      <div className="grid h-full min-h-0 gap-3 lg:grid-cols-12">
        {/* Drawer Compartment Surface (7 cols) */}
        <div className="relative flex min-h-0 flex-col rounded border-3 border-lab-ink bg-amber-900 p-3 shadow-inner lg:col-span-7">
          <div className="mb-2 flex items-center justify-between border-b border-amber-700 pb-1 text-amber-100">
            <span className="mono-label text-xs font-bold text-amber-200">
              📂 {TIERS[activeTier].label} — {TIERS[activeTier].title.toUpperCase()}
            </span>
            <span className="mono-label text-[10px] opacity-80">CLICK ITEMS TO INSPECT</span>
          </div>

          {/* Drawer Interior Box */}
          <div className="relative min-h-0 flex-1 overflow-y-auto rounded border-2 border-amber-950 bg-amber-950/70 p-3 shadow-inner scroll-thin">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(DRAWER_ITEMS[activeTier] || []).map((item) => {
                const isCollected = collectedItems.includes(item.id);
                const isSelected = inspectedItem?.id === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setInspectedItem(item);
                      sound.play("click");
                    }}
                    className={`group relative flex flex-col items-center justify-center rounded border-2 p-3 text-center transition-all ${isSelected
                        ? "border-lab-yellow bg-amber-800 scale-105 ring-2 ring-lab-yellow"
                        : "border-amber-800 bg-amber-900/90 hover:border-amber-500 hover:bg-amber-800/80"
                      }`}
                  >
                    <span className="text-3xl transition-transform group-hover:scale-110">{item.icon}</span>
                    <span className="mono-label mt-2 text-[11px] font-bold text-amber-100 line-clamp-1">
                      {item.name}
                    </span>

                    {isCollected && (
                      <span className="absolute right-1 top-1 rounded bg-emerald-500 px-1 py-0.2 text-[8px] font-bold text-black">
                        COLLECTED
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* False Bottom Section in Tier 2 */}
            {activeTier === 2 && (
              <div className="mt-4 border-t-2 border-dashed border-amber-700 pt-3">
                {!falseBottomOpened ? (
                  <div className="flex flex-col items-center justify-center rounded border-2 border-dashed border-amber-500 bg-amber-900/80 p-4 text-center">
                    <span className="text-2xl">🔒</span>
                    <p className="mono-label mt-1 text-xs text-amber-200 font-bold">FALSE BOTTOM DETECTED</p>
                    <p className="mt-1 text-[11px] text-amber-300 opacity-90 max-w-xs">
                      There is a hidden compartment beneath the bottom drawer wood panel!
                    </p>
                    <BrutButton variant="warn" className="mt-2 text-xs" onClick={handleOpenFalseBottom}>
                      🔑 SLIDE LATCH & OPEN FALSE BOTTOM
                    </BrutButton>
                  </div>
                ) : (
                  <div className="rounded border-2 border-emerald-500 bg-emerald-950/80 p-3 shadow-lg">
                    <div className="flex items-center justify-between border-b border-emerald-700 pb-1 mb-2">
                      <span className="mono-label text-xs font-bold text-emerald-300">
                        ✨ SECRET FALSE BOTTOM COMPARTMENT
                      </span>
                      <span className="mono-label text-[9px] bg-emerald-500 text-black font-bold px-1.5 py-0.2 rounded">UNLOCKED</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">📟</span>
                        <div>
                          <p className="mono-label text-xs font-bold text-emerald-100">DO NOT LOSE CHIP</p>
                          <p className="text-[10px] text-emerald-300">Lab 404 Emergency Hardware Override Security Chip.</p>
                        </div>
                      </div>

                      <BrutButton
                        variant="go"
                        className="text-xs shrink-0"
                        disabled={collectedItems.includes("chip_item")}
                        onClick={() => {
                          handleCollect({
                            id: "chip_item",
                            name: "DO NOT LOSE CHIP",
                            icon: "📟",
                            desc: "Security override chip labeled DO NOT LOSE.",
                            collectibleId: "chip",
                          });
                        }}
                      >
                        {collectedItems.includes("chip_item") ? "✔ IN BAG" : "⚡ TAKE CHIP"}
                      </BrutButton>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Item Details Inspection Panel (5 cols) */}
        <div className="flex min-h-0 flex-col gap-2 lg:col-span-5">
          <Panel title="ITEM INSPECTION & CLUES" className="flex min-h-0 flex-1 flex-col">
            {inspectedItem ? (
              <div className="flex flex-1 flex-col justify-between p-1">
                <div>
                  <div className="flex items-center gap-3 border-b-2 border-lab-ink pb-2">
                    <span className="text-4xl">{inspectedItem.icon}</span>
                    <div>
                      <h4 className="font-display text-base font-bold text-foreground">{inspectedItem.name}</h4>
                      <Tag tone="yellow">DRAWER TIER {activeTier + 1}</Tag>
                    </div>
                  </div>

                  <p className="mt-3 font-mono text-xs leading-relaxed text-foreground opacity-90">
                    {inspectedItem.desc}
                  </p>

                  {inspectedItem.clue && (
                    <div className="mt-3 rounded border-2 border-lab-red bg-red-100 p-2 text-xs font-mono font-bold text-red-900">
                      {inspectedItem.clue}
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-lab-ink pt-2">
                  {inspectedItem.collectibleId ? (
                    <BrutButton
                      variant="go"
                      className="w-full text-xs"
                      disabled={collectedItems.includes(inspectedItem.id)}
                      onClick={() => handleCollect(inspectedItem)}
                    >
                      {collectedItems.includes(inspectedItem.id) ? "✔ COLLECTED IN BACKPACK" : `🎒 TAKE ${inspectedItem.name.toUpperCase()}`}
                    </BrutButton>
                  ) : (
                    <p className="mono-label text-[10px] text-center opacity-60">
                      Item examined. No physical pickup required.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
                <span className="text-4xl">🔍</span>
                <p className="mono-label mt-2 text-xs">Select any item in the drawer to inspect details & clues.</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function PrinterPanel() {
  const [title, setTitle] = useState("PRACTICAL FILE 2026");
  const [text, setText] = useState(
    "EXPERIMENT 7: OBSERVATION & LOGIC CONTROL\n\nObjective: Escape Lab 404 before time expires.\nStatus: Practical file incomplete.\nPasscode Hint: Whiteboard top-right corner [4040].\n\nCode snippet:\nwhile (!escaped) {\n  solvePuzzles();\n  reduceBoredom();\n}"
  );
  const [prints, setPrints] = useState<string[]>([
    "SYS_INIT — Printer 2 Online (No Ink Required)",
    "PRACTICAL_FILE_V1.DOCX — Queue Ready",
  ]);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jammed, setJammed] = useState(false);
  const [ejectedPaper, setEjectedPaper] = useState<string | null>(null);

  const TEMPLATES = [
    {
      label: "📄 LAB PRACTICAL",
      title: "LAB 404 PRACTICAL REPORT 2026",
      text: "COURSE: CS-404 COMPUTER SCIENCE PRACTICAL\nTITLE: SYSTEM DIAGNOSTICS & LOGIC PUZZLES\n\nSUMMARY:\nAll system tests executed successfully. Whiteboard passcode verified as 4040. Terminal access granted.\n\nCONCLUSION:\nStudent is ready for viva examination.",
    },
    {
      label: "📑 VIVA CHEAT SHEET",
      title: "PROFESSOR'S VIVA QUESTION BANK & KEY",
      text: "VIVA SHORTCUTS:\nQ1: What is the time complexity of QuickSort?\nA1: Average O(N log N), Worst O(N^2).\n\nQ2: What is the escape code for Lab 404?\nA2: 4040 (Reversed room number).\n\nQ3: What to answer if professor asks about practical file?\nA3: Say 'It's currently printing from Printer 2, sir!'",
    },
    {
      label: "📜 LEAVE APPLICATION",
      title: "EMERGENCY LEAVE APPLICATION",
      text: "To,\nThe HOD, Computer Science Department\nLab 404\n\nRespected Sir,\nI request permission to leave Lab 404 early today due to an urgent emergency: my code has compiled on the first try.\n\nThanking you,\nStudent #404",
    },
    {
      label: "🔍 ESCAPE DIAGNOSTIC",
      title: "LAB 404 SYSTEM ERROR LOG & ESCAPE SCHEMATIC",
      text: "CRITICAL ALERT: Emergency override protocol active.\n\n1. Locate Whiteboard passcode [4040].\n2. Enter code into Password puzzle in Puzzles app.\n3. Dig into desk drawer for USB & Chip.\n4. Run 'run lab_escape' on terminal desktop.\n\nSTATUS: ESCAPE HATCH UNLOCKED.",
    },
  ];

  const doPrint = () => {
    if (!text.trim()) return;
    if (jammed) {
      sound.play("error");
      store.toast("warn", "PAPER JAM!", "Clear the paper jam before printing again.");
      return;
    }

    sound.play("pop");
    store.interacted();
    setPrinting(true);
    setProgress(0);

    // Random chance of paper jam for fun interactive game mechanics (15%)
    const willJam = Math.random() < 0.15 && prints.length > 2;

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setPrinting(false);

          if (willJam) {
            setJammed(true);
            sound.play("error");
            store.glitchBurst(0.6);
            store.toast("warn", "PAPER JAM DETECTED!", "Printer 2 feed rollers jammed! Press 'CLEAR JAM'.");
          } else {
            sound.play("success");
            const entry = `${title || "UNTITLED"} — ${text.trim().split(/\s+/).length} words printed`;
            const next = [entry, ...prints];
            setPrints(next.slice(0, 8));
            setReady(true);
            setEjectedPaper(title || "PRINTED DOCUMENT");
            store.addXp(20, "Printed document");
            store.reduceBoredom(10);

            if (next.length >= 3) {
              store.findEgg("printer_spam");
              store.giveItem("note");
            }
          }
          return 100;
        }
        sound.play("key");
        return p + 20;
      });
    }, 150);
  };

  const handleClearJam = () => {
    sound.play("click");
    store.interacted();
    setJammed(false);
    store.toast("system", "PAPER JAM CLEARED", "Feed rollers aligned. Printer 2 is ready.");
    store.addXp(15, "Fixed paper jam");
  };

  const handleFeedPaper = () => {
    sound.play("open");
    store.interacted();
    store.reduceBoredom(5);
    store.toast("system", "PAPER FEED", "Blank continuous tractor-feed paper ejected.");
  };

  const doDownload = async () => {
    setBusy(true);
    try {
      const { downloadAsWord } = await import("../../lib/docx-export");
      await downloadAsWord(title || "Untitled", text, (title || "lab-print").toLowerCase().replace(/[^a-z0-9]+/g, "-"));
      sound.play("success");
      store.toast("system", "DOCX GENERATED", "Word document delivered to your downloads folder!");
    } catch {
      store.toast("warn", "EXPORT ERROR", "The document could not be generated.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-12">
      {/* Left Column: Interactive Input & Templates (7 cols) */}
      <div className="flex min-h-0 flex-col gap-2 lg:col-span-7">
        {/* Document Quick Templates */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-lab-ink pb-2">
          <span className="mono-label text-[10px] opacity-70">PRESETS:</span>
          {TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setTitle(tmpl.title);
                setText(tmpl.text);
                setReady(false);
                sound.play("click");
              }}
              className="brut-sm mono-label bg-card px-2 py-0.5 text-[10px] font-bold hover:bg-lab-yellow transition-transform hover:scale-105"
            >
              {tmpl.label}
            </button>
          ))}
        </div>

        <Panel title="PRINTER 2 CONTENT INPUT" className="flex min-h-0 flex-1 flex-col">
          <input
            aria-label="Document title"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            placeholder="Document title"
            className="brut-sm mb-2 w-full bg-background px-2.5 py-1.5 font-mono text-xs font-bold outline-none border-2 border-lab-ink"
          />
          <textarea
            aria-label="Content to print"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setReady(false);
            }}
            placeholder="Paste or type practical report code, viva notes, or leave applications here..."
            className="brut-sm scroll-thin min-h-36 w-full flex-1 resize-none bg-background p-2.5 font-mono text-xs outline-none border-2 border-lab-ink"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <BrutButton variant="warn" onClick={doPrint} disabled={printing || jammed} className="text-xs">
                {printing ? `PRINTING (${progress}%)…` : "🖨️ PRESS PRINT"}
              </BrutButton>
              {ready && (
                <BrutButton variant="go" onClick={doDownload} disabled={busy} className="text-xs">
                  {busy ? "SPOOLING…" : "📥 DOWNLOAD .DOCX"}
                </BrutButton>
              )}
              {jammed && (
                <BrutButton variant="danger" onClick={handleClearJam} className="text-xs animate-bounce">
                  ⚠️ CLEAR PAPER JAM
                </BrutButton>
              )}
            </div>

            <span className="mono-label text-[10px] opacity-70">
              {text.trim().split(/\s+/).filter(Boolean).length} WORDS
            </span>
          </div>
        </Panel>
      </div>

      {/* Right Column: 2D Printer Graphic & Status (5 cols) */}
      <div className="flex min-h-0 flex-col gap-2 lg:col-span-5">
        <Panel title="PRINTER 2 HARDWARE STATUS" className="flex min-h-0 flex-1 flex-col">
          {/* Animated 2D Retro Printer Box */}
          <div className="relative mb-2 rounded border-3 border-lab-ink bg-slate-200 p-3 shadow-md">
            {/* Top Control Header */}
            <div className="mb-2 flex items-center justify-between border-b-2 border-slate-400 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="mono-label text-[10px] font-bold text-slate-800">DOT-MATRIX v2.4</span>
                <span className="brut-sm bg-lab-yellow px-1 py-0.2 text-[9px] font-bold text-black">PAPER ONLY</span>
              </div>

              {/* Status LEDs */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse border border-black" />
                  <span className="mono-label text-[9px] text-slate-700 font-bold">PWR</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`h-2.5 w-2.5 rounded-full border border-black ${printing ? "bg-sky-400 animate-ping" : "bg-sky-500"}`} />
                  <span className="mono-label text-[9px] text-slate-700 font-bold">ONL</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`h-2.5 w-2.5 rounded-full border border-black ${jammed ? "bg-red-600 animate-bounce" : "bg-slate-400 opacity-40"}`} />
                  <span className="mono-label text-[9px] text-slate-700 font-bold">JAM</span>
                </div>
              </div>
            </div>

            {/* Printing Progress Bar */}
            {printing && (
              <div className="mb-2 w-full overflow-hidden rounded border border-black bg-slate-100">
                <div
                  className="h-2 bg-gradient-to-r from-lab-blue to-lab-yellow transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Tractor-feed Paper Ejection Box */}
            <div className="relative min-h-24 overflow-hidden rounded border-2 border-slate-400 bg-white p-2.5 font-mono text-[10px] shadow-inner">
              {/* Tractor feed holes side decoration */}
              <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-around opacity-40">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                ))}
              </div>
              <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-around opacity-40">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                ))}
              </div>

              {/* Paper Content Preview */}
              <div className="px-3">
                <p className="font-bold text-slate-900 border-b border-dashed border-slate-300 pb-1">
                  &gt; {title || "UNTITLED DOCUMENT"}
                </p>
                <p className="mt-1 text-slate-600 line-clamp-3 italic">
                  {text || "Waiting for print payload..."}
                </p>
                {ejectedPaper && (
                  <div className="mt-2 rounded bg-emerald-100 p-1 border border-emerald-400 text-[9px] text-emerald-800 font-bold flex items-center justify-between">
                    <span>✅ READY TO DOWNLOAD</span>
                    <button
                      type="button"
                      onClick={doDownload}
                      className="underline hover:text-emerald-950"
                    >
                      SAVE .DOCX
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Hardware Feed Button */}
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleFeedPaper}
                className="brut-sm mono-label bg-slate-300 px-2 py-1 text-[10px] font-bold text-slate-900 hover:bg-slate-400"
              >
                📄 FEED TRACTOR PAPER
              </button>
              <span className="mono-label text-[9px] text-slate-500">
                INK: 0% (DOCX EMULATOR)
              </span>
            </div>
          </div>

          {/* Print Log / Tray History */}
          <div className="flex min-h-0 flex-1 flex-col">
            <span className="mono-label text-[10px] opacity-70 mb-1">PRINT QUEUE & HISTORY:</span>
            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto rounded border-2 border-lab-ink bg-background p-2 font-mono text-[11px]">
              {prints.length === 0 ? (
                <div className="text-muted-foreground opacity-60">&gt; printer idle. tray waiting.</div>
              ) : (
                prints.map((p, i) => (
                  <div key={i} className="border-b border-muted py-0.5 last:border-none">
                    &gt; {p}
                  </div>
                ))
              )}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}


function TrashPanel() {
  const [digs, setDigs] = useState(0);
  const [inspecting, setInspecting] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<number[]>([]);

  type TrashItem = {
    id: number;
    emoji: string;
    label: string;
    desc: string;
    x: number; // % position
    y: number;
    rot: number;
    scale: number;
    rarity: "common" | "rare" | "legendary";
  };

  const ALL_TRASH: TrashItem[] = [
    {
      id: 0,
      emoji: "📊",
      label: "Crumpled Bar Chart",
      desc: "DSA assignment. The bars are all the same height. The values are fake. The confidence was real.",
      x: 15, y: 30, rot: -18, scale: 1.3, rarity: "common",
    },
    {
      id: 1,
      emoji: "🖊️",
      label: "Dead Ballpoint Pen",
      desc: "Tried it on 4 pages. Drew spirals. Concluded: 'It's empty.' Left it anyway. This is that pen.",
      x: 55, y: 20, rot: 35, scale: 1.1, rarity: "common",
    },
    {
      id: 2,
      emoji: "📄",
      label: "Lab File Cover Page",
      desc: "The nicest page in the entire file. Took 45 minutes to design. The content inside: 3 lines of C code.",
      x: 35, y: 55, rot: 7, scale: 1.4, rarity: "common",
    },
    {
      id: 3,
      emoji: "🍪",
      label: "Half a Parle-G",
      desc: "The lab snack of champions. Survived 2 practicals. Now crumbles alone in the dark. Pour one out.",
      x: 70, y: 60, rot: -5, scale: 1.0, rarity: "common",
    },
    {
      id: 4,
      emoji: "📝",
      label: "Torn Attendance Sheet",
      desc: "Someone tried to add their own signature. The forgery is impressive. The attempt: legendary.",
      x: 25, y: 70, rot: 12, scale: 1.2, rarity: "rare",
    },
    {
      id: 5,
      emoji: "📐",
      label: "Broken Scale Ruler",
      desc: "The 30cm kind. Now 2 x 15cm kind. Still technically measures things if you're creative.",
      x: 60, y: 35, rot: -30, scale: 1.1, rarity: "common",
    },
    {
      id: 6,
      emoji: "💾",
      label: "Mystery Floppy Disk",
      desc: "Label: 'IMPORTANT DO NOT FORMAT'. Contents: unknown. No one has a floppy drive. No one will ever know.",
      x: 80, y: 25, rot: 15, scale: 1.2, rarity: "rare",
    },
    {
      id: 7,
      emoji: "📋",
      label: "Viva Preparation Notes",
      desc: "Page 1: 'What is a pointer? A variable that stores address'. Page 2: doodles of a stick figure crying.",
      x: 45, y: 75, rot: -8, scale: 1.3, rarity: "common",
    },
    {
      id: 8,
      emoji: "🖥️",
      label: "Printed 'Hello World'",
      desc: "First program. Printed at 300dpi. Submitted in a plastic folder. Got 9/10. Teacher said 'format is wrong'.",
      x: 12, y: 60, rot: 22, scale: 1.2, rarity: "common",
    },
    {
      id: 9,
      emoji: "☕",
      label: "Empty Vending Machine Cup",
      desc: "Dispensed something warm and brown. Was called coffee on the label. Jury is still out.",
      x: 75, y: 72, rot: -12, scale: 1.0, rarity: "common",
    },
    {
      id: 10,
      emoji: "🗒️",
      label: "Leave Application Draft #7",
      desc: "Reason attempted: 'medical emergency (boredom-related)'. Rejected. This is the version before final.",
      x: 30, y: 20, rot: -6, scale: 1.3, rarity: "rare",
    },
    {
      id: 11,
      emoji: "🔋",
      label: "Dead Calculator Battery",
      desc: "Gave up during the exam. The calculator showed 'MEMORY FULL'. You showed 'MEMORY EMPTY'.",
      x: 85, y: 48, rot: 45, scale: 0.9, rarity: "common",
    },
    {
      id: 12,
      emoji: "💡",
      label: "Dead Highlighter",
      desc: "Yellow. Then faint yellow. Then 'is this clear?'. Now it just makes paper slightly wet. RIP.",
      x: 50, y: 48, rot: -22, scale: 1.1, rarity: "common",
    },
    {
      id: 13,
      emoji: "🎲",
      label: "Lab Schedule Printout",
      desc: "Someone crossed out 'DSA Lab' and wrote 'FREE PERIOD'. Bold. Optimistic. Incorrect.",
      x: 18, y: 45, rot: 14, scale: 1.25, rarity: "legendary",
    },
    {
      id: 14,
      emoji: "🧻",
      label: "Flowchart on Toilet Paper",
      desc: "The only paper available during the 11pm deadline panic. It's a valid DFD. The professor asked why it's soft.",
      x: 65, y: 78, rot: 8, scale: 1.3, rarity: "legendary",
    },
  ];

  const RARITY_COLORS = {
    common: "border-stone-400 bg-stone-50",
    rare: "border-blue-400 bg-blue-50",
    legendary: "border-amber-400 bg-amber-50",
  };
  const RARITY_BADGE = {
    common: "bg-stone-200 text-stone-700",
    rare: "bg-blue-200 text-blue-800",
    legendary: "bg-amber-300 text-amber-900",
  };

  // Items become visible progressively as you dig
  const visibleCount = Math.min(4 + digs * 2, ALL_TRASH.length);
  const visibleItems = ALL_TRASH.slice(0, visibleCount);
  const inspectedItem = inspecting !== null ? ALL_TRASH[inspecting] : null;

  const handleDig = () => {
    const d = digs + 1;
    setDigs(d);
    store.interacted();
    sound.play("click");
    if (d >= 2) store.findEgg("trash_dig");
    if (d === 3) store.giveItem("attendance_slip");
    if (d >= 5) store.giveItem("broken_mouse");
    if (d >= 7) store.unlock("dumpster_diver");
    // Reveal a new item highlight
    const newReveal = Math.min(4 + d * 2 - 1, ALL_TRASH.length - 1);
    setRevealed(r => [...r, newReveal]);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-lab-ink/20 bg-stone-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗑️</span>
          <div>
            <p className="font-mono text-xs font-black text-amber-400 tracking-widest">DESK TRASH BIN — LAB 404</p>
            <p className="font-mono text-[9px] text-stone-400">
              {visibleCount}/{ALL_TRASH.length} items discovered • {digs} dig{digs !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-black ${digs === 0 ? "bg-stone-600 text-stone-300" : digs < 4 ? "bg-yellow-600 text-yellow-100" : "bg-red-700 text-red-100"}`}>
            {digs === 0 ? "UNTOUCHED" : digs < 4 ? "DIGGING" : "DEEP DIVE"}
          </span>
        </div>
      </div>

      {/* Main trash bin area */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Bin background — crinkled paper texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-200 via-stone-300 to-stone-400">
          {/* Bin walls */}
          <div className="absolute inset-x-4 bottom-0 top-8 border-4 border-t-0 border-stone-600 bg-stone-300/60 shadow-inner" />
          {/* Top rim */}
          <div className="absolute inset-x-2 top-6 h-4 border-4 border-stone-600 bg-stone-500" />
          {/* Bin label */}
          <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded border-2 border-stone-600 bg-stone-100 px-3 py-0.5">
            <span className="font-mono text-[9px] font-black text-stone-700 tracking-widest">♻ PAPER WASTE</span>
          </div>
          {/* Ambient stink lines */}
          {digs > 2 && (
            <>
              <div className="absolute left-[30%] top-2 font-mono text-[10px] text-stone-500 opacity-60 animate-bounce" style={{ animationDelay: "0s" }}>〰️</div>
              <div className="absolute left-[55%] top-0 font-mono text-[10px] text-stone-500 opacity-40 animate-bounce" style={{ animationDelay: "0.4s" }}>〰️</div>
              <div className="absolute left-[70%] top-3 font-mono text-[10px] text-stone-500 opacity-50 animate-bounce" style={{ animationDelay: "0.8s" }}>〰️</div>
            </>
          )}
        </div>

        {/* Scattered trash items */}
        <div className="absolute inset-x-6 bottom-2 top-12">
          {visibleItems.map((item, i) => (
            <button
              key={item.id}
              onClick={() => { setInspecting(inspecting === item.id ? null : item.id); sound.play("click"); }}
              className={`absolute flex flex-col items-center gap-0.5 transition-all duration-300 hover:scale-125 hover:z-20 focus:outline-none ${inspecting === item.id ? "scale-125 z-20" : "z-10"
                } ${revealed.includes(i) ? "animate-bounce" : ""}`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `rotate(${item.rot}deg) scale(${item.scale}) ${inspecting === item.id ? "scale(1.3)" : ""}`,
                animationDuration: "0.6s",
                animationIterationCount: revealed.includes(i) ? "3" : "0",
              }}
              title={item.label}
            >
              <span className="text-2xl drop-shadow-sm">{item.emoji}</span>
              {inspecting === item.id && (
                <span className={`-mt-0.5 whitespace-nowrap rounded border px-1 py-0.5 font-mono text-[8px] font-black ${RARITY_BADGE[item.rarity]}`}>
                  {item.rarity.toUpperCase()}
                </span>
              )}
            </button>
          ))}

          {/* Hidden items tease */}
          {visibleCount < ALL_TRASH.length && (
            <div className="absolute bottom-2 right-2 rounded border-2 border-dashed border-stone-500 bg-stone-200/70 px-2 py-1">
              <p className="font-mono text-[9px] text-stone-600">+{ALL_TRASH.length - visibleCount} more items hidden...</p>
            </div>
          )}
        </div>
      </div>

      {/* Inspect panel — shown when clicking an item */}
      {inspectedItem && (
        <div className={`border-t-3 border-lab-ink p-3 ${RARITY_COLORS[inspectedItem.rarity]}`}>
          <div className="flex items-start gap-3">
            <span className="text-3xl">{inspectedItem.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-mono text-sm font-black text-lab-ink">{inspectedItem.label}</p>
                <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-black ${RARITY_BADGE[inspectedItem.rarity]}`}>
                  {inspectedItem.rarity.toUpperCase()}
                </span>
              </div>
              <p className="font-mono text-[11px] text-stone-700 leading-relaxed">{inspectedItem.desc}</p>
            </div>
            <button onClick={() => setInspecting(null)} className="text-stone-400 hover:text-lab-ink font-black text-xs">✕</button>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="border-t-2 border-lab-ink/20 bg-stone-100 px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="font-mono text-[10px] text-stone-500 leading-relaxed">
              {digs === 0 && "🤢 Smells like deadlines and regret. Proceed with caution."}
              {digs === 1 && "🧤 You found the surface layer. It gets worse below."}
              {digs === 2 && "😬 You are committed now. No going back."}
              {digs === 3 && "💀 This is someone's academic trauma you're digging through."}
              {digs >= 4 && digs < 6 && "🏆 Professional bin archaeologist. Respect."}
              {digs >= 6 && "🫡 You have seen things. Things that cannot be unseen."}
            </p>
          </div>
          <BrutButton
            variant={digs >= ALL_TRASH.length / 2 ? "danger" : "warn"}
            onClick={handleDig}
            disabled={visibleCount >= ALL_TRASH.length}
            className="shrink-0 text-xs"
          >
            {visibleCount >= ALL_TRASH.length ? "🗑️ BIN FULLY EXCAVATED" : `🤿 DIG DEEPER (${visibleCount}/${ALL_TRASH.length})`}
          </BrutButton>
        </div>

        {/* Legend */}
        <div className="mt-1.5 flex gap-3">
          {(["common", "rare", "legendary"] as const).map(r => (
            <div key={r} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full border ${RARITY_COLORS[r].split(" ")[0]?.replace("border", "border")}`} style={{ background: r === "common" ? "#a8a29e" : r === "rare" ? "#93c5fd" : "#fcd34d" }} />
              <span className="font-mono text-[9px] text-stone-500 capitalize">{r}</span>
            </div>
          ))}
          <span className="ml-auto font-mono text-[9px] text-stone-400">Click items to inspect</span>
        </div>
      </div>
    </div>
  );
}


const NOTE_COLORS = [
  { label: "Yellow",  bg: "#ffb703", text: "#1e293b", accent: "#dc2626" },
  { label: "Pink",    bg: "#fda4af", text: "#1e293b", accent: "#9f1239" },
  { label: "Blue",    bg: "#93c5fd", text: "#1e2b4a", accent: "#1d4ed8" },
  { label: "Green",   bg: "#86efac", text: "#14532d", accent: "#15803d" },
  { label: "Purple",  bg: "#d8b4fe", text: "#3b0764", accent: "#7c3aed" },
  { label: "White",   bg: "#f8fafc", text: "#1e293b", accent: "#64748b" },
];

const NOTE_EMOJIS = ["📌", "⚠️", "💡", "🔥", "✅", "❌", "📋", "🎯", "🧠", "💀"];

const STICKY_STORAGE_KEY = "lab_escape_sticky_note_v1";

function StickyNotePanel() {
  const stickyNotes = useLab((s) => s.rt.stickyNotes || []);
  const [colorIdx, setColorIdx] = useState(0);
  const [title, setTitle] = useState("DON'T FORGET:");
  const [body, setBody] = useState("SUBMIT NOTHING.\n:-)");
  const [emoji, setEmoji] = useState("📌");
  const [saved, setSaved] = useState(false);
  const [shake, setShake] = useState(false);

  const palette = NOTE_COLORS[colorIdx]!;

  const handlePin = () => {
    store.addStickyNote({
      color: palette.bg,
      textColor: palette.text,
      accentColor: palette.accent,
      title: title.trim() || "NOTE",
      body: body.trim() || "...",
      emoji,
    });
    setSaved(true);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setTimeout(() => setSaved(false), 2000);
    sound.play("pop");
  };

  const handleReset = () => {
    store.resetStickyNotes();
    setTitle("DON'T FORGET:");
    setBody("SUBMIT NOTHING.\n:-)");
    setEmoji("📌");
    setColorIdx(0);
    sound.play("click");
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">

      {/* Top Banner: Queue status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-lab-ink bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm tracking-wide">WALL STICKY NOTES QUEUE</span>
          <Tag tone={stickyNotes.length >= 3 ? "red" : "green"}>
            {stickyNotes.length}/3 ON WALL
          </Tag>
        </div>
        <p className="mono-label text-[10px] opacity-75">
          {stickyNotes.length >= 3
            ? "⚠️ Queue full: Pinning note #4 will push out note #1 (oldest)."
            : `💡 ${3 - stickyNotes.length} more slot(s) open on the wall.`}
        </p>
      </div>

      {/* Active notes currently on wall */}
      <div>
        <p className="mono-label text-[10px] tracking-widest opacity-60 mb-1.5">
          CURRENTLY VISIBLE ON WALL ({stickyNotes.length} OF 3)
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {stickyNotes.map((n, idx) => (
            <div
              key={n.id || idx}
              className="relative flex flex-col justify-between border-2 border-lab-ink p-2.5 shadow-sm"
              style={{ background: n.color || "#ffb703", minHeight: 110 }}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="mono-label text-[9px] font-bold opacity-60">
                  SLOT #{idx + 1} {idx === 0 && stickyNotes.length >= 3 ? "(Next to exit)" : ""}
                </span>
                <span className="text-sm">{n.emoji}</span>
              </div>
              <div className="my-1">
                <p className="font-mono text-[11px] font-bold leading-tight" style={{ color: n.textColor }}>
                  {n.title}
                </p>
                <p className="font-mono text-[10px] font-extrabold whitespace-pre-wrap leading-tight mt-0.5" style={{ color: n.accentColor }}>
                  {n.body}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-lab-ink/20">
                <button
                  type="button"
                  onClick={() => {
                    setTitle(n.title);
                    setBody(n.body);
                    setEmoji(n.emoji);
                    const ci = NOTE_COLORS.findIndex((c) => c.bg === n.color);
                    if (ci >= 0) setColorIdx(ci);
                    sound.play("click");
                  }}
                  className="mono-label text-[9px] underline hover:opacity-100 opacity-70"
                >
                  ✎ Copy into Editor
                </button>
                {stickyNotes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      store.deleteStickyNote(n.id);
                      sound.play("pop");
                    }}
                    className="mono-label text-[9px] text-lab-red hover:font-bold opacity-80"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor & Preview row */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 border-t-2 border-lab-ink/30 pt-3 md:flex-row">
        
        {/* Editor form */}
        <div className="flex min-h-0 flex-1 flex-col gap-2.5">
          <p className="mono-label text-[10px] tracking-widest opacity-60">CREATE / PIN NOTE</p>

          {/* Color palette */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono-label text-[10px] opacity-70">COLOR:</span>
            {NOTE_COLORS.map((c, i) => (
              <button
                key={c.label}
                type="button"
                title={c.label}
                onClick={() => { setColorIdx(i); sound.play("click"); }}
                className={`h-7 w-7 rounded-sm border-2 transition-all duration-100 hover:scale-110 ${
                  colorIdx === i
                    ? "border-lab-ink scale-125 shadow-md ring-2 ring-lab-ink/30"
                    : "border-gray-400 opacity-80"
                }`}
                style={{ background: c.bg }}
              />
            ))}
          </div>

          {/* Emoji pin picker */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mono-label text-[10px] opacity-70">PIN:</span>
            {NOTE_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => { setEmoji(e); sound.play("click"); }}
                className={`text-lg transition-transform hover:scale-125 ${emoji === e ? "scale-125 opacity-100" : "opacity-50"}`}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Title input */}
          <div className="flex flex-col gap-0.5">
            <label className="mono-label text-[10px] opacity-70">TITLE LINE (Max 24 chars):</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 24))}
              maxLength={24}
              className="brut-sm border-2 border-lab-ink bg-background px-2 py-1 font-mono text-sm uppercase outline-none focus:border-lab-blue"
              placeholder="DON'T FORGET:"
            />
          </div>

          {/* Body input */}
          <div className="flex flex-col gap-0.5 flex-1">
            <label className="mono-label text-[10px] opacity-70">NOTE MESSAGE (Max 80 chars, 3 lines max):</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 80))}
              maxLength={80}
              rows={3}
              className="brut-sm flex-1 resize-none border-2 border-lab-ink bg-background px-2 py-1.5 font-mono text-sm uppercase outline-none focus:border-lab-blue"
              placeholder="Write your note..."
            />
            <p className="mono-label text-[9px] opacity-40 text-right">{body.length}/80</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <BrutButton
              variant="go"
              className="flex-1 font-bold"
              onClick={handlePin}
            >
              {saved ? "✅ PINNED TO WALL!" : "📌 PIN TO WALL (+15 XP)"}
            </BrutButton>
            <BrutButton onClick={handleReset} className="text-xs">
              🔄 RESET WALL
            </BrutButton>
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex flex-col items-center gap-2 md:w-52">
          <p className="mono-label text-[10px] tracking-widest opacity-60">LIVE PREVIEW</p>

          <div
            className={`relative w-44 rounded-sm shadow-md transition-transform ${shake ? "rotate-1 scale-105" : "-rotate-1"}`}
            style={{
              background: palette.bg,
              border: `3px solid #1e293b`,
              padding: "14px 12px 12px",
              minHeight: 150,
              transition: "transform 0.3s, box-shadow 0.3s",
              boxShadow: "3px 3px 0 #1e293b",
            }}
          >
            {/* Top fold */}
            <div className="absolute left-0 right-0 top-0 h-1 opacity-20" style={{ background: "#1e293b" }} />

            {/* Emoji Pin */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-lg drop-shadow">{emoji}</div>

            {/* Content */}
            <p
              className="relative z-10 mb-1 text-[11px] font-bold uppercase leading-tight"
              style={{ fontFamily: "var(--font-mono)", color: palette.text }}
            >
              {title || "TITLE"}
            </p>
            <p
              className="relative z-10 mt-1 whitespace-pre-wrap text-[11px] font-black uppercase leading-snug"
              style={{ fontFamily: "var(--font-mono)", color: palette.accent }}
            >
              {body || "your note here..."}
            </p>
          </div>

          <p className="mono-label text-center text-[9px] opacity-40 max-w-[170px]">
            Instantly visible on the lab wall when you hit PIN TO WALL.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================================
   CPU WORKSTATION RIG (INTERACTIVE HARDWARE TEARDOWN & OVERCLOCKED INTERNAL ENGINE)
   ========================================================================================= */

const COOLANT_THEMES = [
  { name: "Cyber Cyan", fluid: "#06b6d4", glow: "rgba(6, 182, 212, 0.6)", hex: "#22d3ee" },
  { name: "Toxic Acid", fluid: "#22c55e", glow: "rgba(34, 197, 94, 0.6)", hex: "#4ade80" },
  { name: "Magma Red", fluid: "#ef4444", glow: "rgba(239, 68, 68, 0.6)", hex: "#f87171" },
  { name: "Hyper Purple", fluid: "#a855f7", glow: "rgba(168, 85, 247, 0.6)", hex: "#c084fc" },
  { name: "Quantum Amber", fluid: "#f59e0b", glow: "rgba(245, 158, 11, 0.6)", hex: "#fbbf24" },
];

function CpuPanel() {
  const [viewMode, setViewMode] = useState<"chassis" | "internals" | "specs">("internals");
  const [turboMode, setTurboMode] = useState(false);
  const [fanSpeed, setFanSpeed] = useState<"quiet" | "balanced" | "jet">("balanced");
  const [coolantIdx, setCoolantIdx] = useState(0);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkScore, setBenchmarkScore] = useState<number | null>(null);
  const [driveEjected, setDriveEjected] = useState(false);
  const [ramDownloaded, setRamDownloaded] = useState(128);
  const [activeComponent, setActiveComponent] = useState<string | null>("cpu");
  const [tempOffset, setTempOffset] = useState(0);
  const [livePower, setLivePower] = useState(485);
  const [shakeRig, setShakeRig] = useState(false);

  const coolant = COOLANT_THEMES[coolantIdx]!;

  // Dynamic wattage & thermals fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      const base = turboMode ? 780 : benchmarking ? 920 : 450;
      setLivePower(base + Math.floor(Math.random() * 45 - 20));
      setTempOffset(Math.floor(Math.random() * 3 - 1));
    }, 1200);
    return () => clearInterval(interval);
  }, [turboMode, benchmarking]);

  const baseCpuTemp = turboMode ? 79 : benchmarking ? 91 : 41;
  const cpuTemp = baseCpuTemp + tempOffset;
  const baseGpuTemp = turboMode ? 71 : benchmarking ? 84 : 38;
  const gpuTemp = baseGpuTemp + tempOffset;
  const clockSpeed = turboMode ? "6.20 GHz" : benchmarking ? "5.90 GHz" : "5.40 GHz";
  const fanRpm = fanSpeed === "quiet" ? 1100 : fanSpeed === "balanced" ? 2200 : 4800;

  const toggleTurbo = () => {
    const next = !turboMode;
    setTurboMode(next);
    setShakeRig(true);
    setTimeout(() => setShakeRig(false), 600);
    if (next) {
      sound.play("power");
      store.addXp(25, "Activated Rig Turbo Boost");
      store.toast("warn", "🚀 TURBO BOOST 6.2 GHz!", "Coolant pump at 4800 RPM. Caution: Viva questions may melt.");
    } else {
      sound.play("click");
    }
  };

  const runBenchmark = () => {
    if (benchmarking) return;
    setBenchmarking(true);
    sound.play("glitch");
    store.toast("system", "RUNNING 3D LAB-MARK 2026", "Stress testing RTX 4090 Ti with Quantum Path Tracing...");
    setTimeout(() => {
      setBenchmarking(false);
      const score = Math.floor(38400 + Math.random() * 3200 + (turboMode ? 5000 : 0));
      setBenchmarkScore(score);
      store.addXp(30, "Completed Rig GPU Benchmark");
      sound.play("success");
      store.toast("achievement", `BENCHMARK COMPLETE: ${score.toLocaleString()} PTS`, "Rank 1 in College Campus Leaderboard!");
    }, 2800);
  };

  const downloadMoreRam = () => {
    sound.play("pop");
    const nextRam = ramDownloaded + 32;
    setRamDownloaded(nextRam);
    store.toast("system", `DOWNLOADED +32GB RAM!`, `Total Virtual Memory: ${nextRam} GB DDR5. (It's free real estate!)`);
  };

  const toggleDrive = () => {
    setDriveEjected((e) => !e);
    sound.play(driveEjected ? "click" : "pop");
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1 select-none">
      
      {/* Top Header & Mode Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-lab-ink bg-card p-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-display text-base tracking-wide">LAB-404 WORKSTATION RIG</span>
          <Tag tone={turboMode ? "red" : "blue"}>{turboMode ? "⚡ OVERCLOCKED 6.2GHz" : "STABLE 5.4GHz"}</Tag>
          <Tag tone="yellow">{livePower}W DRAW</Tag>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1">
          <BrutButton
            variant={viewMode === "internals" ? "go" : "default"}
            className="text-xs px-2.5 py-1"
            onClick={() => { setViewMode("internals"); sound.play("click"); }}
          >
            🔬 RIG INTERNALS
          </BrutButton>
          <BrutButton
            variant={viewMode === "specs" ? "go" : "default"}
            className="text-xs px-2.5 py-1"
            onClick={() => { setViewMode("specs"); sound.play("click"); }}
          >
            📋 SPECS SHEET
          </BrutButton>
          <BrutButton
            variant={viewMode === "chassis" ? "go" : "default"}
            className="text-xs px-2.5 py-1"
            onClick={() => { setViewMode("chassis"); sound.play("click"); }}
          >
            🧰 CHASSIS EXTERIOR
          </BrutButton>
        </div>
      </div>

      {/* Main Interactive Workstation Area */}
      {viewMode === "internals" && (
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
          
          {/* Left: Interactive Open Glass Rig Visualizer */}
          <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden border-3 border-lab-ink bg-[#0c1222] p-4 shadow-md min-h-[380px]">
            
            {/* Ambient Waterloop Back-Glow */}
            <div
              className="pointer-events-none absolute inset-0 opacity-20 transition-all duration-700"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${coolant.fluid} 0%, transparent 70%)`,
              }}
            />

            {/* Benchmark / Stress Test Laser Overlay */}
            {benchmarking && (
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, #22d3ee 0, #22d3ee 2px, transparent 0, transparent 18px)",
                  animation: "pulse 0.4s infinite alternate",
                }}
              />
            )}

            {/* Motherboard & Internal Hardware SVG */}
            <div className={`relative transition-transform duration-200 ${shakeRig ? "scale-95 rotate-1" : "scale-100"}`}>
              <svg width="440" height="340" viewBox="0 0 440 340" className="drop-shadow-2xl">
                
                {/* 1. Motherboard PCB Plate */}
                <rect x="20" y="20" width="400" height="300" rx="6" fill="#131d2e" stroke="#1e293b" strokeWidth="4" />
                {/* Gold Traces */}
                <path d="M40 40 H160 V100 H220 M280 40 V160 H380 M50 260 H200 V200 H320 M360 220 V280" stroke="#f59e0b" strokeWidth="1.5" opacity="0.35" fill="none" />

                {/* 2. CPU Socket & Liquid Cooling Waterblock */}
                <g
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => { setActiveComponent("cpu"); sound.play("click"); }}
                >
                  <rect
                    x="75"
                    y="55"
                    width="115"
                    height="115"
                    rx="10"
                    fill="#0f172a"
                    stroke={activeComponent === "cpu" ? "#38bdf8" : "#334155"}
                    strokeWidth={activeComponent === "cpu" ? "4" : "2.5"}
                  />
                  {/* Waterblock Circular Pump Display */}
                  <circle cx="132" cy="112" r="42" fill="#030712" stroke={coolant.fluid} strokeWidth="4" />
                  <circle cx="132" cy="112" r="42" fill="none" stroke={coolant.glow} strokeWidth="8" opacity="0.4" />
                  
                  {/* Digital Pump LCD Display */}
                  <text x="132" y="104" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="14" fontWeight="900" fill="#f8fafc">
                    {cpuTemp}°C
                  </text>
                  <text x="132" y="118" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fontWeight="bold" fill={coolant.hex}>
                    {clockSpeed}
                  </text>
                  <text x="132" y="128" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6.5" fill="#94a3b8">
                    {fanRpm} RPM
                  </text>
                  {/* Rotating waterblock flow impeller */}
                  <g style={{ transformOrigin: "132px 112px", animation: `spin ${turboMode ? "0.6s" : "1.8s"} linear infinite` }}>
                    <circle cx="132" cy="78" r="2.5" fill={coolant.fluid} />
                    <circle cx="166" cy="112" r="2.5" fill={coolant.fluid} />
                    <circle cx="132" cy="146" r="2.5" fill={coolant.fluid} />
                    <circle cx="98" cy="112" r="2.5" fill={coolant.fluid} />
                  </g>
                </g>

                {/* 3. DDR5 RAM Slots (4 Sticks with RGB Bars) */}
                <g
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => { setActiveComponent("ram"); sound.play("click"); }}
                >
                  <rect
                    x="215"
                    y="50"
                    width="60"
                    height="125"
                    rx="4"
                    fill="#0f172a"
                    stroke={activeComponent === "ram" ? "#38bdf8" : "#334155"}
                    strokeWidth={activeComponent === "ram" ? "3" : "1.5"}
                  />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <g key={i} transform={`translate(${222 + i * 13} 56)`}>
                      <rect width="8" height="112" rx="1.5" fill="#1e293b" stroke="#000" strokeWidth="1" />
                      {/* RGB Top Diffuser Bar */}
                      <rect
                        width="8"
                        height="18"
                        rx="1"
                        fill={turboMode ? "#f43f5e" : ["#38bdf8", "#818cf8", "#c084fc", "#f472b6"][i]}
                        style={{ animation: `pulse ${0.8 + i * 0.2}s infinite alternate` }}
                      />
                      <text x="4" y="65" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="4.5" fill="#64748b" transform={`rotate(-90 4 65)`}>
                        DDR5
                      </text>
                    </g>
                  ))}
                </g>

                {/* 4. GPU: NVIDIA RTX 4090 Ti Beast */}
                <g
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => { setActiveComponent("gpu"); sound.play("click"); }}
                >
                  {/* PCIe Armor / GPU Shroud */}
                  <rect
                    x="45"
                    y="190"
                    width="345"
                    height="85"
                    rx="6"
                    fill="#0f172a"
                    stroke={activeComponent === "gpu" ? "#38bdf8" : "#475569"}
                    strokeWidth={activeComponent === "gpu" ? "4" : "2"}
                  />
                  {/* Heatsink Fins Pattern */}
                  <line x1="55" y1="232" x2="380" y2="232" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
                  
                  {/* 3 Massive Spinning Fans */}
                  {[105, 215, 325].map((fx, fi) => (
                    <g key={fi}>
                      <circle cx={fx} cy="232" r="30" fill="#020617" stroke="#334155" strokeWidth="2.5" />
                      <circle cx={fx} cy="232" r="30" fill="none" stroke={turboMode ? "#ef4444" : coolant.fluid} strokeWidth="2" opacity="0.5" />
                      {/* Fan Blades Rotation */}
                      <g style={{ transformOrigin: `${fx}px 232px`, animation: `spin ${benchmarking ? "0.4s" : turboMode ? "0.8s" : "2.2s"} linear infinite` }}>
                        <path d={`M${fx} 232 Q${fx + 14} 206 ${fx + 24} 210 Q${fx + 10} 224 ${fx} 232 Z`} fill="#475569" />
                        <path d={`M${fx} 232 Q${fx + 24} 242 ${fx + 20} 256 Q${fx + 8} 246 ${fx} 232 Z`} fill="#475569" />
                        <path d={`M${fx} 232 Q${fx - 14} 258 ${fx - 24} 254 Q${fx - 10} 240 ${fx} 232 Z`} fill="#475569" />
                        <path d={`M${fx} 232 Q${fx - 24} 222 ${fx - 20} 208 Q${fx - 8} 218 ${fx} 232 Z`} fill="#475569" />
                      </g>
                      {/* Center Hub */}
                      <circle cx={fx} cy="232" r="9" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                      <text x={fx} y="235" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="6" fontWeight="bold" fill="#fff">
                        4090
                      </text>
                    </g>
                  ))}

                  {/* GPU Badge */}
                  <rect x="55" y="196" width="130" height="14" rx="2" fill="#020617" />
                  <text x="62" y="206" fontFamily="var(--font-mono)" fontSize="7" fontWeight="bold" fill="#38bdf8">
                    RTX 4090 Ti · 24GB ({gpuTemp}°C)
                  </text>
                </g>

                {/* 5. Liquid Cooling Rigid Tubing (Connecting CPU to Radiator) */}
                <path
                  d="M132 55 V35 H360 V190"
                  fill="none"
                  stroke={coolant.fluid}
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.85"
                />
                <path
                  d="M132 55 V35 H360 V190"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="8 12"
                  strokeLinecap="round"
                  style={{ animation: "dash 1s linear infinite" }}
                />

                {/* 6. M.2 NVMe SSD Heatsink */}
                <g
                  className="cursor-pointer"
                  onClick={() => { setActiveComponent("ssd"); sound.play("click"); }}
                >
                  <rect x="80" y="174" width="90" height="12" rx="2" fill="#1e293b" stroke={activeComponent === "ssd" ? "#38bdf8" : "#475569"} strokeWidth="1.5" />
                  <text x="85" y="183" fontFamily="var(--font-mono)" fontSize="6" fill="#38bdf8" fontWeight="bold">GEN5 NVMe RAID-0 [14 GB/s]</text>
                </g>

                {/* 7. PSU & Power Rail at Top-Right */}
                <g
                  className="cursor-pointer"
                  onClick={() => { setActiveComponent("psu"); sound.play("click"); }}
                >
                  <rect x="290" y="45" width="120" height="70" rx="4" fill="#020617" stroke={activeComponent === "psu" ? "#38bdf8" : "#334155"} strokeWidth="2" />
                  <text x="300" y="65" fontFamily="var(--font-mono)" fontSize="9" fontWeight="bold" fill="#f59e0b">1200W TITANIUM</text>
                  <text x="300" y="80" fontFamily="var(--font-mono)" fontSize="7.5" fill="#94a3b8">EFFICIENCY: 96.4%</text>
                  <rect x="300" y="90" width="100" height="8" rx="2" fill="#1e293b" />
                  <rect x="300" y="90" width={`${Math.min(100, (livePower / 1200) * 100)}`} height="8" rx="2" fill={turboMode ? "#ef4444" : "#10b981"} />
                </g>

              </svg>
            </div>

            {/* Bottom Status bar inside viewport */}
            <div className="mt-2 flex w-full flex-wrap items-center justify-between border-t border-slate-700/60 pt-2 text-[10px] text-slate-300 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full animate-ping" style={{ background: coolant.fluid }} />
                <span>PUMP: {fanRpm} RPM · COOLANT: {coolant.name.toUpperCase()}</span>
              </span>
              <span>CLICK ANY COMPONENT FOR DIAGNOSTICS & TUNING</span>
            </div>
          </div>

          {/* Right: Hardware Tuning & Interactive Controls Panel */}
          <div className="flex flex-col gap-3 md:w-80">
            
            {/* Component Inspector Card */}
            <div className="border-2 border-lab-ink bg-card p-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-lab-ink/20 pb-1.5 mb-2">
                <span className="font-display text-sm font-bold text-lab-ink">
                  {activeComponent === "cpu" && "🧠 QUANTUM i9-9900KS CPU"}
                  {activeComponent === "gpu" && "🎮 NVIDIA RTX 4090 Ti 24GB"}
                  {activeComponent === "ram" && "⚡ 128GB DDR5-7200 RGB RAM"}
                  {activeComponent === "ssd" && "💾 8TB Gen5 NVMe RAID-0"}
                  {activeComponent === "psu" && "⚡ 1200W TITANIUM 80+ PSU"}
                </span>
                <Tag tone={turboMode ? "red" : "green"}>
                  {activeComponent === "cpu" ? `${cpuTemp}°C` : activeComponent === "gpu" ? `${gpuTemp}°C` : "ACTIVE"}
                </Tag>
              </div>

              {/* Dynamic details based on selection */}
              {activeComponent === "cpu" && (
                <div className="space-y-1.5 text-[11px] font-mono">
                  <p>• <strong>Cores:</strong> 32 Cores / 64 Threads @ {clockSpeed}</p>
                  <p>• <strong>Delidded Die:</strong> Direct-Die Liquid Metal applied</p>
                  <p>• <strong>Status:</strong> {turboMode ? "🔥 Thermal limit nearing ceiling!" : "Normal Lab Operations"}</p>
                  <div className="mt-2 pt-1 border-t border-lab-ink/20">
                    <BrutButton
                      variant={turboMode ? "danger" : "go"}
                      className="w-full text-xs font-bold"
                      onClick={toggleTurbo}
                    >
                      {turboMode ? "⚡ DISABLE TURBO BOOST" : "🚀 ENGAGE TURBO (6.2 GHz)"}
                    </BrutButton>
                  </div>
                </div>
              )}

              {activeComponent === "gpu" && (
                <div className="space-y-1.5 text-[11px] font-mono">
                  <p>• <strong>VRAM:</strong> 24GB GDDR6X @ 1,008 GB/s</p>
                  <p>• <strong>Compute:</strong> 16,384 CUDA Cores · 512 Tensor Cores</p>
                  <p>• <strong>Workload:</strong> 99% (Running Minesweeper + 48 Chrome tabs)</p>
                  {benchmarkScore && (
                    <p className="font-bold text-lab-green">🏆 Last Score: {benchmarkScore.toLocaleString()} PTS</p>
                  )}
                  <div className="mt-2 pt-1 border-t border-lab-ink/20">
                    <BrutButton
                      variant="go"
                      disabled={benchmarking}
                      className="w-full text-xs font-bold"
                      onClick={runBenchmark}
                    >
                      {benchmarking ? "🔥 BENCHMARKING..." : "💥 RUN 3D STRESS TEST"}
                    </BrutButton>
                  </div>
                </div>
              )}

              {activeComponent === "ram" && (
                <div className="space-y-1.5 text-[11px] font-mono">
                  <p>• <strong>Capacity:</strong> {ramDownloaded} GB (Quad-Channel)</p>
                  <p>• <strong>Speed:</strong> 7200 MT/s CL28 XMP 3.0</p>
                  <p>• <strong>Allocation:</strong> 112GB consumed by IDE cache</p>
                  <div className="mt-2 pt-1 border-t border-lab-ink/20">
                    <BrutButton
                      className="w-full text-xs font-bold"
                      onClick={downloadMoreRam}
                    >
                      📥 DOWNLOAD +32GB MORE RAM (FREE)
                    </BrutButton>
                  </div>
                </div>
              )}

              {activeComponent === "ssd" && (
                <div className="space-y-1.5 text-[11px] font-mono">
                  <p>• <strong>Speed:</strong> Read 14,200 MB/s · Write 12,800 MB/s</p>
                  <p>• <strong>Storage:</strong> 8.0 TB Total (7.9 TB memes & practicals)</p>
                  <p>• <strong>IOPS:</strong> 2,400,000 Random 4K Operations</p>
                </div>
              )}

              {activeComponent === "psu" && (
                <div className="space-y-1.5 text-[11px] font-mono">
                  <p>• <strong>Output:</strong> {livePower}W / 1200W Maximum</p>
                  <p>• <strong>Rating:</strong> 80-Plus Titanium Certified (96%)</p>
                  <p>• <strong>Surge Protection:</strong> Withstands college campus power cuts</p>
                </div>
              )}
            </div>

            {/* RGB Coolant Loop Customizer */}
            <div className="border-2 border-lab-ink bg-card p-2.5 shadow-sm space-y-2">
              <span className="mono-label text-[10px] opacity-70">💧 LIQUID COOLANT THEME:</span>
              <div className="flex flex-wrap gap-1.5">
                {COOLANT_THEMES.map((th, i) => (
                  <button
                    key={th.name}
                    type="button"
                    title={th.name}
                    onClick={() => { setCoolantIdx(i); sound.play("click"); }}
                    className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded-sm border-2 font-bold transition-transform ${
                      coolantIdx === i ? "border-lab-ink scale-105 shadow-sm" : "border-slate-300 opacity-70"
                    }`}
                    style={{ background: th.fluid, color: i === 0 || i === 1 || i === 4 ? "#000" : "#fff" }}
                  >
                    {th.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Fan Speed Controller */}
            <div className="border-2 border-lab-ink bg-card p-2.5 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="mono-label text-[10px] opacity-70">🌀 FAN PROFILE:</span>
                <span className="mono-label text-[10px] font-bold">{fanRpm} RPM</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(["quiet", "balanced", "jet"] as const).map((spd) => (
                  <BrutButton
                    key={spd}
                    className="text-[10px] py-1 capitalize"
                    variant={fanSpeed === spd ? "go" : "default"}
                    onClick={() => { setFanSpeed(spd); sound.play("click"); }}
                  >
                    {spd === "jet" ? "🔥 JET" : spd}
                  </BrutButton>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* View 2: Complete Hardware Specification Sheet */}
      {viewMode === "specs" && (
        <div className="border-2 border-lab-ink bg-card p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b-2 border-lab-ink pb-2">
            <div>
              <h3 className="font-display text-xl font-bold">LAB 404 TITAN WORKSTATION ENGINE</h3>
              <p className="mono-label text-xs opacity-75">Architecture Overview & Benchmark Telemetry</p>
            </div>
            <Tag tone="green">CERTIFIED LAB GRADE</Tag>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Spec Box 1: Compute & Graphics */}
            <div className="border-2 border-lab-ink/30 bg-background p-3 space-y-2">
              <p className="font-display text-sm font-bold text-lab-red">⚡ CORE COMPUTE & ACCELERATORS</p>
              <table className="w-full text-xs font-mono">
                <tbody>
                  <tr className="border-b border-lab-ink/10">
                    <td className="py-1 opacity-70">PROCESSOR</td>
                    <td className="py-1 font-bold">Quantum Core i9-9900KS (32C / 64T)</td>
                  </tr>
                  <tr className="border-b border-lab-ink/10">
                    <td className="py-1 opacity-70">BASE / BOOST</td>
                    <td className="py-1 font-bold">4.2 GHz / 6.2 GHz All-Core Liquid Turbo</td>
                  </tr>
                  <tr className="border-b border-lab-ink/10">
                    <td className="py-1 opacity-70">L3 SMART CACHE</td>
                    <td className="py-1 font-bold">64 MB Ultra-Low Latency SRAM</td>
                  </tr>
                  <tr className="border-b border-lab-ink/10">
                    <td className="py-1 opacity-70">GRAPHICS ENGINE</td>
                    <td className="py-1 font-bold">NVIDIA GeForce RTX 4090 Ti (24GB VRAM)</td>
                  </tr>
                  <tr>
                    <td className="py-1 opacity-70">CUDA / TENSOR</td>
                    <td className="py-1 font-bold">16,384 CUDA / 512 Tensor Gen-4 Cores</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Spec Box 2: Memory, Storage & Power */}
            <div className="border-2 border-lab-ink/30 bg-background p-3 space-y-2">
              <p className="font-display text-sm font-bold text-lab-blue">💾 MEMORY, STORAGE & POWER</p>
              <table className="w-full text-xs font-mono">
                <tbody>
                  <tr className="border-b border-lab-ink/10">
                    <td className="py-1 opacity-70">SYSTEM MEMORY</td>
                    <td className="py-1 font-bold">128 GB Quad-Channel DDR5-7200MHz CL28</td>
                  </tr>
                  <tr className="border-b border-lab-ink/10">
                    <td className="py-1 opacity-70">PRIMARY STORAGE</td>
                    <td className="py-1 font-bold">8TB PCIe Gen5 x4 NVMe (14,200 MB/s read)</td>
                  </tr>
                  <tr className="border-b border-lab-ink/10">
                    <td className="py-1 opacity-70">COOLING LOOP</td>
                    <td className="py-1 font-bold">Custom 420mm Hardline Waterblock Loop</td>
                  </tr>
                  <tr className="border-b border-lab-ink/10">
                    <td className="py-1 opacity-70">POWER SUPPLY</td>
                    <td className="py-1 font-bold">1200W Titanium 80-Plus (96.4% Efficiency)</td>
                  </tr>
                  <tr>
                    <td className="py-1 opacity-70">OPERATING SYSTEM</td>
                    <td className="py-1 font-bold">LAB-OS Pro 64-bit Kernel Edition v4.0.4</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* Humorous Research Log */}
          <div className="border-l-4 border-lab-yellow bg-card/60 p-3 text-xs font-mono space-y-1">
            <p className="font-bold text-lab-ink">📝 LAB INVENTORY LOG #8841:</p>
            <p className="opacity-80">
              "This monster rig was procured via a ₹12,00,000 AI Research Grant marked as 'Bio-Chemical Simulation Engine'. 
              In reality, students use it to play Crysis, mine virtual coins, and compile 4 lines of C++ code in 0.0001 seconds."
            </p>
          </div>
        </div>
      )}

      {/* View 3: Exterior Chassis & Drive Bay Interactions */}
      {viewMode === "chassis" && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center border-2 border-lab-ink bg-card p-6 shadow-sm gap-4">
          <p className="mono-label text-xs tracking-widest opacity-60">RETRO BEIGE SLEEPER CHASSIS</p>

          <div className="relative border-4 border-lab-ink bg-[#d4cca9] p-6 shadow-xl w-64 rounded-sm flex flex-col items-center gap-4">
            
            {/* 5.25" Optical Drive with Animated Tray */}
            <div className="w-full border-2 border-lab-ink bg-[#b8ad86] p-2 flex items-center justify-between shadow-inner">
              <span className="font-mono text-[9px] font-bold">52X CD-RW DRIVE</span>
              <button
                type="button"
                onClick={toggleDrive}
                className="brut-sm px-2 py-0.5 text-[9px] font-bold bg-lab-paper hover:bg-white"
              >
                {driveEjected ? "⏏ CLOSE" : "⏏ EJECT"}
              </button>
            </div>

            {/* Ejected Tray Simulation */}
            {driveEjected && (
              <div
                className="w-full border-2 border-slate-700 bg-slate-300 p-2 text-center text-[10px] font-mono shadow-md animate-bounce"
              >
                💿 LAB_ESCAPE_BACKUP_1999.ISO (EJECTED)
              </div>
            )}

            {/* Property Badge */}
            <div className="border-2 border-lab-ink bg-lab-paper px-4 py-2 text-center w-4/5 shadow-sm">
              <p className="font-mono text-[9px] font-bold text-lab-ink">PROPERTY OF</p>
              <p className="font-display text-sm font-black text-lab-red">LAB 404 DEPT</p>
            </div>

            {/* Massive Front Vent Fan */}
            <div className="relative h-24 w-24 rounded-full border-4 border-lab-ink bg-[#222] flex items-center justify-center">
              <div
                className="h-20 w-20 rounded-full border-2 border-dashed border-slate-500"
                style={{ animation: `spin ${turboMode ? "0.4s" : "1.5s"} linear infinite` }}
              />
              <span className="absolute font-mono text-[8px] font-bold text-white opacity-80">
                {turboMode ? "6.2 GHz" : "5.4 GHz"}
              </span>
            </div>

            {/* Power Buttons & Turbo Switch */}
            <div className="flex w-full items-center justify-around border-t-2 border-lab-ink/30 pt-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-lab-green border border-lab-ink animate-pulse" />
                <span className="font-mono text-[9px] font-bold">PWR</span>
              </div>
              <BrutButton
                variant={turboMode ? "danger" : "default"}
                className="text-[10px] px-2.5 py-1 font-bold"
                onClick={toggleTurbo}
              >
                🚀 TURBO {turboMode ? "ON" : "OFF"}
              </BrutButton>
            </div>

          </div>

          <p className="mono-label text-[10px] opacity-60">
            Looks like an innocent 90s office PC on the outside • Beast overclocked monster on the inside.
          </p>
        </div>
      )}

      {/* Global CSS for waterblock & particles */}
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
      `}</style>

    </div>
  );
}



function WhiteboardPanel() {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);


  type Tool = "brush" | "line" | "rect" | "circle" | "text" | "sticky";
  const [activeTool, setActiveTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#1e293b");
  const [lineWidth, setLineWidth] = useState(4);
  const [boardHeight, setBoardHeight] = useState(1600);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textStamp, setTextStamp] = useState("LAB 404 ESCAPE");

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const snapshot = useRef<ImageData | null>(null);

  const savedData = useLab((s) => s.rt.whiteboardData);

  // Initialize and load canvas background or saved image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const targetW = rect.width || 800;
    const targetH = boardHeight;

    canvas.width = targetW * 2;
    canvas.height = targetH * 2;
    ctx.scale(2, 2);

    if (savedData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);
      };
      img.src = savedData;
    } else {
      drawDefaultBoard(ctx, targetW, targetH);
    }
  }, [savedData, boardHeight]);

  const drawDefaultBoard = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // Secret Corner Passcode (retained for puzzle hint)
    ctx.fillStyle = "#dc2626";
    ctx.font = "bold 14px 'JetBrains Mono', monospace";
    ctx.fillText("[CORNER CODE: 4040]", Math.max(20, w - 210), 35);
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    store.setWhiteboardData(dataUrl);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]!.clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0]!.clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    startPos.current = coords;
    lastPos.current = coords;
    snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    store.interacted();
    store.findEgg("whiteboard_erase");

    // Handle single-click tools like Text and Sticky Note
    if (activeTool === "text") {
      ctx.font = `bold ${lineWidth * 3 + 10}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = isEraser ? "#f8fafc" : color;
      ctx.fillText(textStamp || "LAB 404", coords.x, coords.y);
      sound.play("pop");
      saveCanvas();
      setIsDrawing(false);
    } else if (activeTool === "sticky") {
      // Stamp sticky note
      ctx.fillStyle = "#fef08a";
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;
      ctx.fillRect(coords.x - 60, coords.y - 40, 120, 80);
      ctx.strokeRect(coords.x - 60, coords.y - 40, 120, 80);

      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.fillText("STICKY NOTE", coords.x - 45, coords.y - 20);
      ctx.fillStyle = "#1e293b";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText(textStamp || "Check corner code 4040", coords.x - 52, coords.y + 5);

      sound.play("pop");
      saveCanvas();
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos.current || !startPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentPos = getCanvasCoords(e);

    if (activeTool === "brush") {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.strokeStyle = isEraser ? "#f8fafc" : color;
      ctx.lineWidth = isEraser ? lineWidth * 3 : lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      lastPos.current = currentPos;
    } else if (["line", "rect", "circle"].includes(activeTool)) {
      // Restore canvas snapshot for live shape preview
      if (snapshot.current) {
        ctx.putImageData(snapshot.current, 0, 0);
      }

      ctx.strokeStyle = isEraser ? "#f8fafc" : color;
      ctx.lineWidth = lineWidth;
      ctx.fillStyle = color;

      if (activeTool === "line") {
        ctx.beginPath();
        ctx.moveTo(startPos.current.x, startPos.current.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
      } else if (activeTool === "rect") {
        const w = currentPos.x - startPos.current.x;
        const h = currentPos.y - startPos.current.y;
        ctx.strokeRect(startPos.current.x, startPos.current.y, w, h);
      } else if (activeTool === "circle") {
        const rx = Math.abs(currentPos.x - startPos.current.x) / 2;
        const ry = Math.abs(currentPos.y - startPos.current.y) / 2;
        const cx = (startPos.current.x + currentPos.x) / 2;
        const cy = (startPos.current.y + currentPos.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      startPos.current = null;
      lastPos.current = null;
      saveCanvas();
    }
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    drawDefaultBoard(ctx, rect.width || 800, boardHeight);
    sound.play("pop");
    store.interacted();
    saveCanvas();
  };

  const loadTemplate = (tmpl: "topology" | "formulas" | "escape") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 800;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, boardHeight);

    if (tmpl === "topology") {
      ctx.font = "bold 16px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#1e293b";
      ctx.fillText("LAB 404 NETWORK TOPOLOGY & HARDWARE MAP", 30, 40);

      // Node boxes
      const nodes = [
        { label: "GATEWAY", x: 40, y: 80, col: "#2563eb" },
        { label: "MAIN CPU", x: 200, y: 80, col: "#16a34a" },
        { label: "TERMINAL 404", x: 380, y: 80, col: "#d97706" },
        { label: "ESCAPE DOOR", x: 560, y: 80, col: "#dc2626" },
      ];

      nodes.forEach((n) => {
        ctx.strokeStyle = n.col;
        ctx.lineWidth = 3;
        ctx.strokeRect(n.x, n.y, 120, 50);
        ctx.fillStyle = n.col;
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        ctx.fillText(n.label, n.x + 12, n.y + 30);
      });

      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 14px 'JetBrains Mono', monospace";
      ctx.fillText("[CORNER CODE: 4040]", Math.max(20, w - 210), 35);
    } else if (tmpl === "formulas") {
      ctx.font = "bold 16px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#1e293b";
      ctx.fillText("VIVA EXAM FORMULAS & ALGORITHMS", 30, 40);

      ctx.font = "13px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#2563eb";
      ctx.fillText("1. Binary Search: O(log N) — mid = low + (high - low) / 2", 30, 80);
      ctx.fillText("2. QuickSort: Pivot partitioning, Average O(N log N)", 30, 110);
      ctx.fillText("3. Ohm's Law: V = I * R", 30, 140);
      ctx.fillText("4. Energy: E = mc²", 30, 170);

      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 14px 'JetBrains Mono', monospace";
      ctx.fillText("[CORNER CODE: 4040]", Math.max(20, w - 210), 35);
    } else if (tmpl === "escape") {
      ctx.font = "bold 18px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#dc2626";
      ctx.fillText("🚨 EMERGENCY OVERRIDE & ESCAPE INSTRUCTIONS 🚨", 30, 45);

      ctx.font = "bold 13px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#1e293b";
      ctx.fillText("• Passcode to Professor's Laptop: 4040", 30, 90);
      ctx.fillText("• Door Keycard: Hidden in Desk Drawer Layer 2", 30, 120);
      ctx.fillText("• Terminal Command: run lab_escape", 30, 150);

      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 180, 320, 60);
      ctx.fillStyle = "#dc2626";
      ctx.fillText("MASTER CODE: 4040", 110, 215);
    }

    sound.play("success");
    store.interacted();
    saveCanvas();
  };

  const downloadBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = "smart_whiteboard_session.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
    sound.play("success");
  };

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  const extendHeight = () => {
    setBoardHeight((h) => h + 600);
    sound.play("click");
  };

  const COLORS = [
    { name: "Ink Black",    value: "#1e293b" },
    { name: "Charcoal",     value: "#475569" },
    { name: "White",        value: "#f8fafc" },
    { name: "Marker Blue", value: "#2563eb" },
    { name: "Sky Blue",    value: "#38bdf8" },
    { name: "Alert Red",   value: "#dc2626" },
    { name: "Pink",        value: "#ec4899" },
    { name: "Orange",      value: "#f97316" },
    { name: "Amber",       value: "#f59e0b" },
    { name: "Yellow",      value: "#eab308" },
    { name: "Green",       value: "#16a34a" },
    { name: "Lime",        value: "#84cc16" },
    { name: "Teal",        value: "#14b8a6" },
    { name: "Cyan",        value: "#06b6d4" },
    { name: "Purple",      value: "#9333ea" },
    { name: "Violet",      value: "#7c3aed" },
    { name: "Indigo",      value: "#4f46e5" },
    { name: "Brown",       value: "#92400e" },
    { name: "Rose",        value: "#f43f5e" },
    { name: "Magenta",     value: "#d946ef" },
  ];

  const TOOLS: { id: Tool; label: string; icon: string }[] = [
    { id: "brush", label: "PEN", icon: "✏️" },
    { id: "line", label: "LINE", icon: "📏" },
    { id: "rect", label: "RECT", icon: "🔲" },
    { id: "circle", label: "CIRCLE", icon: "⚪" },
    { id: "text", label: "TEXT", icon: "🔤" },
    { id: "sticky", label: "STICKY", icon: "📌" },
  ];

  const SIZES = [
    { label: "FINE", val: 2 },
    { label: "MEDIUM", val: 5 },
    { label: "BOLD", val: 12 },
    { label: "MARKER", val: 24 },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Smart Whiteboard Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-lab-ink bg-card p-2">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          <span className="mono-label text-[10px] opacity-70">TOOL:</span>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTool(t.id);
                setIsEraser(false);
                sound.play("click");
              }}
              className={`brut-sm mono-label px-2 py-0.5 text-[10px] font-bold ${!isEraser && activeTool === t.id ? "bg-lab-blue text-white scale-105" : "bg-card text-foreground opacity-80"
                }`}
            >
              {t.icon} {t.label}
            </button>
          ))}

          {/* Eraser */}
          <button
            type="button"
            onClick={() => {
              setIsEraser((e) => !e);
              sound.play("click");
            }}
            className={`brut-sm mono-label px-2 py-0.5 text-[10px] font-bold ${isEraser ? "bg-lab-yellow text-lab-ink" : "bg-card"
              }`}
          >
            🧹 ERASER {isEraser ? "ON" : "OFF"}
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mono-label text-[10px] opacity-70 shrink-0">COLOR:</span>
          <div className="flex flex-wrap gap-1">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.name}
                onClick={() => {
                  setColor(c.value);
                  setIsEraser(false);
                  sound.play("click");
                }}
                style={{
                  background: c.value,
                  outline: !isEraser && color === c.value ? `3px solid #1e293b` : "none",
                  outlineOffset: "2px",
                  boxShadow: !isEraser && color === c.value ? `0 0 0 1px #fff inset` : "none",
                  border: c.value === "#f8fafc" ? "1.5px solid #cbd5e1" : "none",
                }}
                className={`h-6 w-6 rounded-sm transition-all duration-100 hover:scale-110 ${
                  !isEraser && color === c.value ? "scale-125 shadow-md" : "opacity-90 hover:opacity-100"
                }`}
              />
            ))}
          </div>
          {/* Active color preview + custom picker */}
          <div className="flex items-center gap-1 ml-1">
            <div className="relative h-6 w-6" title="Pick custom color">
              <div
                className="h-6 w-6 rounded-sm border-2 border-lab-ink shadow-inner cursor-pointer"
                style={{ background: color }}
              />
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  setIsEraser(false);
                }}
                title="Custom color"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <span className="mono-label text-[9px] opacity-50" style={{ fontVariantNumeric: "tabular-nums" }}>
              {color.toUpperCase()}
            </span>
          </div>

        </div>

        {/* Thickness */}
        <div className="flex items-center gap-1">
          <span className="mono-label text-[10px] opacity-70">SIZE:</span>
          {SIZES.map((s) => (
            <button
              key={s.val}
              type="button"
              onClick={() => {
                setLineWidth(s.val);
                sound.play("click");
              }}
              className={`brut-sm mono-label px-1.5 py-0.5 text-[10px] ${lineWidth === s.val ? "bg-lab-blue text-lab-paper font-bold" : "bg-card"
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Preset Templates */}
        <div className="flex items-center gap-1">
          <span className="mono-label text-[10px] opacity-70">TEMPLATES:</span>
          <button
            type="button"
            onClick={() => loadTemplate("topology")}
            className="brut-sm mono-label px-1.5 py-0.5 text-[10px] bg-slate-200 hover:bg-slate-300 font-bold"
          >
            🧠 TOPOLOGY
          </button>
          <button
            type="button"
            onClick={() => loadTemplate("formulas")}
            className="brut-sm mono-label px-1.5 py-0.5 text-[10px] bg-slate-200 hover:bg-slate-300 font-bold"
          >
            📝 FORMULAS
          </button>
          <button
            type="button"
            onClick={() => loadTemplate("escape")}
            className="brut-sm mono-label px-1.5 py-0.5 text-[10px] bg-amber-200 hover:bg-amber-300 font-bold"
          >
            🔑 ESCAPE CODE
          </button>
        </div>

        {/* Canvas Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={scrollToTop}
            className="brut-sm mono-label px-1.5 py-0.5 text-[10px] bg-card hover:bg-muted"
          >
            ⬆ TOP
          </button>
          <button
            type="button"
            onClick={scrollToBottom}
            className="brut-sm mono-label px-1.5 py-0.5 text-[10px] bg-card hover:bg-muted"
          >
            ⬇ BOTTOM
          </button>
          <button
            type="button"
            onClick={extendHeight}
            className="brut-sm mono-label px-1.5 py-0.5 text-[10px] bg-lab-yellow text-lab-ink font-bold"
          >
            + EXTEND
          </button>
          <Tag tone="red">CODE: 4040</Tag>
          <BrutButton variant="danger" className="text-[10px] px-2 py-0.5" onClick={clearBoard}>
            CLEAR
          </BrutButton>
          <BrutButton variant="go" className="text-[10px] px-2 py-0.5" onClick={downloadBoard}>
            PNG
          </BrutButton>
        </div>
      </div>

      {/* Optional Stamp Input Bar for Text / Sticky tool */}
      {(activeTool === "text" || activeTool === "sticky") && (
        <div className="flex items-center gap-2 border-b border-lab-ink bg-amber-100 p-1.5">
          <span className="mono-label text-[10px] font-bold text-amber-900">
            {activeTool === "text" ? "🔤 TYPE TEXT TO STAMP:" : "📌 STICKY NOTE TEXT:"}
          </span>
          <input
            type="text"
            value={textStamp}
            onChange={(e) => setTextStamp(e.target.value)}
            className="brut-sm flex-1 bg-white px-2 py-0.5 font-mono text-xs outline-none"
            placeholder="Type text and click canvas to place..."
          />
          <span className="mono-label text-[9px] opacity-70">CLICK CANVAS TO STAMP</span>
        </div>
      )}

      {/* Scrollable Canvas Container */}
      <div
        ref={containerRef}
        className="scroll-thin relative min-h-0 flex-1 overflow-y-auto border-3 border-lab-ink bg-slate-50 shadow-inner"
      >
        <canvas
          ref={canvasRef}
          style={{ height: `${boardHeight}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full touch-none cursor-crosshair block"
        />
      </div>

      <p className="mono-label text-[10px] text-center opacity-60">
        Smart Whiteboard ({boardHeight}px tall) • Click & drag or choose tools/templates above.
      </p>
    </div>
  );
}



function ComputerPanel() {
  const loginAuthenticated = useLab((s) => s.rt.loginAuthenticated);
  const typedPassword = useLab((s) => s.rt.typedPassword || "");
  const booted = useRef(false);

  useEffect(() => {
    if (loginAuthenticated && !booted.current) {
      booted.current = true;
      store.unlock("booted");
    }
  }, [loginAuthenticated]);

  if (!loginAuthenticated) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center font-mono select-none">
        <div className="max-w-md rounded-lg border-3 border-lab-ink bg-card p-6 shadow-brut">
          <div className="text-4xl mb-2">🖥️</div>
          <h3 className="font-display text-xl font-bold text-foreground">
            CRT TERMINAL AUTHENTICATION
          </h3>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Type passcode <span className="font-bold text-amber-600">4040</span> directly on your keyboard or click the desk keycaps below.
          </p>

          <div className="my-4 rounded border-2 border-emerald-500 bg-slate-950 p-3 text-emerald-400">
            <p className="mono-label text-[10px] text-slate-400">LIVE CRT SCREEN STATUS</p>
            <p className="mt-1 font-mono text-lg font-bold">
              PASS: [ <span className="text-sky-300">{"•".repeat(typedPassword.length)}_</span> ]
            </p>
          </div>

          <div className="flex gap-2">
            <BrutButton
              variant="go"
              className="flex-1 text-xs"
              onClick={() => {
                store.typeMonitorKey("4");
                store.typeMonitorKey("0");
                store.typeMonitorKey("4");
                store.typeMonitorKey("0");
              }}
            >
              ⚡ QUICK AUTO-TYPE 4040
            </BrutButton>
            <BrutButton
              variant="danger"
              className="text-xs"
              onClick={() => store.focusObject(null)}
            >
              ← BACK TO LAB
            </BrutButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="brut h-full w-full bg-lab-paper p-2">
      <div className="h-full w-full border-3 border-lab-ink">
        <Desktop />
      </div>
    </div>
  );
}

export function ObjectPanel({ id }: { id: ObjectId }) {
  const meta = OBJECT_MAP.get(id)!;
  const body = () => {
    switch (id) {
      case "computer":
        return <ComputerPanel />;
      case "phone":
        return <PhoneApp />;
      case "noticeboard":
        return <NoticesApp />;
      case "clock":
        return <ClockPanel />;
      case "window":
        return <WindowPanel />;
      case "desk":
        return <DeskPanel />;
      case "drawer":
        return <DrawerPanel />;
      case "printer":
        return <PrinterPanel />;
      case "trash":
        return <TrashPanel />;
      case "whiteboard":
        return <WhiteboardPanel />;
      case "stickynote":
        return <StickyNotePanel />;
      case "cpu":
        return <CpuPanel />;

      default:
        return <AchievementsApp />;
    }
  };


  return (
    <div className="window-in flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b-3 border-lab-ink bg-lab-ink px-3 py-2 text-lab-paper">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg leading-none">{meta.label.toUpperCase()}</span>
          <Tag tone="yellow">{id}</Tag>
        </div>
        <BrutButton variant="danger" onClick={() => store.focusObject(null)}>
          ← BACK TO LAB
        </BrutButton>
      </div>
      <div className="min-h-0 flex-1 bg-background p-3">{body()}</div>
    </div>
  );
}
