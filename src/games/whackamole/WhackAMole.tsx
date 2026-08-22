import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

// ─── Whack-a-Mole ───────────────────────────────────────────────────────────
// Rules:
//   • A 3×3 grid of holes. Moles pop up for a limited time.
//   • Click an active mole to score a point (+10 per hit).
//   • Missing a mole (it disappears without being whacked) costs a miss.
//   • 3 miss types: regular mole miss (−0), golden mole miss (−5), bomb hit (−20).
//   • Golden mole = +25 pts, appears rarely.
//   • Bomb = −20 pts if clicked, appears rarely — do NOT click it!
//   • Game lasts 30 seconds. Difficulty affects speed and spawn rate.

const HOLES = 9;
const GAME_DURATION = 30;

type MoleType = "regular" | "golden" | "bomb";
type HoleState = { active: boolean; type: MoleType; id: number } | null;

function randomHole(exclude: number[]): number {
  let h: number;
  do { h = Math.floor(Math.random() * HOLES); } while (exclude.includes(h));
  return h;
}

type Difficulty = "easy" | "medium" | "hard";

const DIFF_CONFIG: Record<Difficulty, { minMs: number; maxMs: number; activeMs: number; spawnChance: { golden: number; bomb: number } }> = {
  easy:   { minMs: 1200, maxMs: 2000, activeMs: 1400, spawnChance: { golden: 0.08, bomb: 0.04 } },
  medium: { minMs: 700,  maxMs: 1400, activeMs: 900,  spawnChance: { golden: 0.12, bomb: 0.07 } },
  hard:   { minMs: 400,  maxMs: 900,  activeMs: 600,  spawnChance: { golden: 0.15, bomb: 0.10 } },
};

let holeIdSeq = 0;

export default function WhackAMole() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [holes, setHoles] = useState<HoleState[]>(Array(HOLES).fill(null));
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [best, setBest] = useState(0);
  const [lastHit, setLastHit] = useState<{ hole: number; text: string; color: string } | null>(null);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const spawnRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
    if (spawnRef.current) clearTimeout(spawnRef.current);
  };

  const despawnHole = useCallback((holeIdx: number) => {
    setHoles((prev) => {
      const next = [...prev];
      next[holeIdx] = null;
      return next;
    });
    setMisses((m) => m + 1);
  }, []);

  const spawnMole = useCallback((diff: Difficulty) => {
    setHoles((prev) => {
      const active = prev.map((h, i) => (h ? i : -1)).filter((i) => i >= 0);
      if (active.length >= 3) return prev; // max 3 simultaneous moles
      const hole = randomHole(active);
      const rand = Math.random();
      const cfg = DIFF_CONFIG[diff];
      const type: MoleType = rand < cfg.spawnChance.bomb ? "bomb" : rand < cfg.spawnChance.golden + cfg.spawnChance.bomb ? "golden" : "regular";
      const id = ++holeIdSeq;
      const next = [...prev];
      next[hole] = { active: true, type, id };

      // Auto-despawn after activeMs
      const t = setTimeout(() => despawnHole(hole), cfg.activeMs);
      timersRef.current.set(id, t);
      return next;
    });

    // Schedule next spawn
    const cfg = DIFF_CONFIG[diff];
    const delay = cfg.minMs + Math.random() * (cfg.maxMs - cfg.minMs);
    spawnRef.current = setTimeout(() => spawnMole(diff), delay);
  }, [despawnHole]);

  const startGame = useCallback((diff: Difficulty = difficulty) => {
    clearAllTimers();
    setHoles(Array(HOLES).fill(null));
    setScore(0);
    setMisses(0);
    setHits(0);
    setTimeLeft(GAME_DURATION);
    setLastHit(null);
    setPhase("playing");

    setTimeout(() => spawnMole(diff), 500);
  }, [difficulty, spawnMole]);

  // Game timer
  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      clearAllTimers();
      setPhase("over");
      setHoles(Array(HOLES).fill(null));
      setBest((b) => {
        const nb = Math.max(b, score);
        store.submitGameResult("whackamole", { score, accuracy: hits / Math.max(1, hits + misses), time: GAME_DURATION * 1000, completed: true });
        return nb;
      });
      sound.play("error");
      return;
    }
    const t = setTimeout(() => setTimeLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, score, hits, misses]);

  const whack = useCallback((holeIdx: number) => {
    const hole = holes[holeIdx];
    if (!hole || phase !== "playing") return;

    // Clear despawn timer
    const t = timersRef.current.get(hole.id);
    if (t) { clearTimeout(t); timersRef.current.delete(hole.id); }

    // Remove mole
    setHoles((prev) => { const n = [...prev]; n[holeIdx] = null; return n; });

    if (hole.type === "bomb") {
      sound.play("error");
      setScore((s) => Math.max(0, s - 20));
      store.interacted();
      setLastHit({ hole: holeIdx, text: "💣 −20", color: "#ef4444" });
    } else {
      const pts = hole.type === "golden" ? 25 : 10;
      sound.play("success");
      setScore((s) => s + pts);
      setHits((h) => h + 1);
      store.interacted();
      setLastHit({ hole: holeIdx, text: hole.type === "golden" ? `⭐ +${pts}` : `+${pts}`, color: hole.type === "golden" ? "#eab308" : "#22c55e" });
    }
    setTimeout(() => setLastHit(null), 600);
  }, [holes, phase]);

  const MOLE_EMOJI: Record<MoleType, string> = {
    regular: "🐭",
    golden:  "⭐",
    bomb:    "💣",
  };

  const MOLE_COLOR: Record<MoleType, string> = {
    regular: "#8b5cf6",
    golden:  "#f59e0b",
    bomb:    "#ef4444",
  };

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 100;

  return (
    <GameShell
      id="whackamole"
      status={
        <>
          <Tag tone="blue">⏱ {timeLeft}s</Tag>
          <Tag tone="green">SCORE {score}</Tag>
          <Tag tone="yellow">BEST {best}</Tag>
        </>
      }
      toolbar={
        <>
          {(["easy","medium","hard"] as Difficulty[]).map((d) => (
            <BrutButton key={d} variant={difficulty === d ? "primary" : "default"} onClick={() => { setDifficulty(d); if (phase === "playing") startGame(d); }}>
              {d.toUpperCase()}
            </BrutButton>
          ))}
          <BrutButton variant="go" onClick={() => startGame()}>
            {phase === "idle" || phase === "over" ? "START" : "RESTART"}
          </BrutButton>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4">
        {phase === "idle" && (
          <div className="text-center space-y-2">
            <p className="font-display text-2xl">WHACK-A-MOLE</p>
            <p className="mono-label text-sm opacity-70">Click moles 🐭 for +10. Golden ⭐ gives +25. NEVER click bombs 💣 (−20)!</p>
            <p className="mono-label text-xs opacity-50">You have {GAME_DURATION} seconds. Go!</p>
          </div>
        )}

        {/* Stats bar */}
        {phase !== "idle" && (
          <div className="flex gap-4 mono-label text-sm">
            <span>🎯 Hits: {hits}</span>
            <span>❌ Miss: {misses}</span>
            <span>📊 Acc: {accuracy}%</span>
          </div>
        )}

        {/* 3×3 Hole Grid */}
        <div
          className="brut grid gap-3 p-4"
          style={{ gridTemplateColumns: "repeat(3, 6rem)", background: "#451a03" }}
        >
          {holes.map((hole, idx) => (
            <div
              key={idx}
              className="relative flex items-end justify-center overflow-hidden"
              style={{ width: "6rem", height: "6rem", borderRadius: "50%", background: "#292524", border: "3px solid #57534e" }}
            >
              {/* Mole / Bomb */}
              {hole && (
                <button
                  onClick={() => whack(idx)}
                  aria-label={`Whack ${hole.type} at hole ${idx + 1}`}
                  className="absolute inset-0 flex items-center justify-center text-5xl transition-transform active:scale-90"
                  style={{
                    background: MOLE_COLOR[hole.type] + "33",
                    cursor: "pointer",
                    animation: "moleUp 0.15s ease-out",
                  }}
                >
                  {MOLE_EMOJI[hole.type]}
                </button>
              )}

              {/* Score popup */}
              {lastHit?.hole === idx && (
                <div
                  className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold pointer-events-none"
                  style={{ color: lastHit.color, animation: "floatUp 0.6s ease-out forwards" }}
                >
                  {lastHit.text}
                </div>
              )}
            </div>
          ))}
        </div>

        {phase === "over" && (
          <div className="brut bg-lab-ink text-lab-paper px-6 py-4 text-center">
            <p className="font-display text-2xl">TIME'S UP!</p>
            <p className="mono-label mt-1">Score: <strong>{score}</strong> · Hits: {hits} · Accuracy: {accuracy}%</p>
            {score >= best && <p className="mono-label text-lab-yellow mt-1">🏆 NEW HIGH SCORE!</p>}
            <BrutButton variant="go" className="mt-3" onClick={() => startGame()}>PLAY AGAIN</BrutButton>
          </div>
        )}
      </div>

      <style>{`
        @keyframes moleUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes floatUp {
          from { transform: translateY(0);     opacity: 1; }
          to   { transform: translateY(-3rem); opacity: 0; }
        }
      `}</style>
    </GameShell>
  );
}
