import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

// ─── Simon Says ─────────────────────────────────────────────────────────────
// Rules:
//   1. The game shows a growing sequence of coloured flashes.
//   2. The player must repeat the sequence in the same order by clicking buttons.
//   3. Each correct round adds one more colour to the sequence.
//   4. A wrong press = game over. Score = rounds completed.
//   5. Speed increases every 5 rounds.

const BUTTONS = [
  { id: 0, label: "🔴", color: "#ef4444", lit: "#fca5a5", key: "1" },
  { id: 1, label: "🔵", color: "#3b82f6", lit: "#93c5fd", key: "2" },
  { id: 2, label: "🟢", color: "#22c55e", lit: "#86efac", key: "3" },
  { id: 3, label: "🟡", color: "#eab308", lit: "#fde047", key: "4" },
];

type Phase = "idle" | "showing" | "input" | "gameover";

export default function Simon() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [strictMode, setStrictMode] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashButton = (id: number, duration: number): Promise<void> =>
    new Promise((resolve) => {
      setLit(id);
      intervalRef.current = setTimeout(() => {
        setLit(null);
        setTimeout(resolve, duration * 0.35);
      }, duration);
    });

  const playSequence = useCallback(async (seq: number[]) => {
    setPhase("showing");
    const speed = Math.max(300, 800 - Math.floor(seq.length / 5) * 100);
    for (const id of seq) {
      await flashButton(id, speed);
    }
    setPhase("input");
    setPlayerIdx(0);
  }, []);

  const startGame = useCallback(() => {
    const first = Math.floor(Math.random() * 4);
    const seq = [first];
    setSequence(seq);
    setScore(0);
    setPlayerIdx(0);
    playSequence(seq);
  }, [playSequence]);

  const pressButton = useCallback(
    async (id: number) => {
      if (phase !== "input") return;
      setLit(id);
      sound.play("click");
      store.interacted();
      setTimeout(() => setLit(null), 200);

      if (id !== sequence[playerIdx]) {
        // Wrong!
        sound.play("error");
        setPhase("gameover");
        const finalScore = score;
        setBest((b) => Math.max(b, finalScore));
        store.submitGameResult("simon", { score: finalScore, accuracy: finalScore / Math.max(1, finalScore + 1), time: 1, completed: true });
        return;
      }

      const nextIdx = playerIdx + 1;
      if (nextIdx === sequence.length) {
        // Completed round!
        sound.play("success");
        const newScore = score + 1;
        setScore(newScore);
        setBest((b) => Math.max(b, newScore));
        store.submitGameResult("simon", { score: newScore, accuracy: 1, time: 1, completed: false });

        const next = Math.floor(Math.random() * 4);
        const newSeq = [...sequence, next];
        setSequence(newSeq);
        setTimeout(() => playSequence(newSeq), 800);
      } else {
        setPlayerIdx(nextIdx);
      }
    },
    [phase, sequence, playerIdx, score, playSequence],
  );

  // Keyboard shortcuts 1–4
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3 };
      const id = map[e.key];
      if (id !== undefined) pressButton(id);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pressButton]);

  const statusLabel =
    phase === "idle" ? "PRESS START" :
    phase === "showing" ? `WATCH... (Round ${sequence.length})` :
    phase === "input" ? `YOUR TURN — ${sequence.length - playerIdx} left` :
    "GAME OVER";

  return (
    <GameShell
      id="simon"
      status={
        <>
          <Tag tone="blue">ROUND {sequence.length || 0}</Tag>
          <Tag tone="yellow">BEST {best}</Tag>
        </>
      }
      toolbar={
        <>
          <BrutButton
            variant={strictMode ? "danger" : "default"}
            onClick={() => setStrictMode((s) => !s)}
          >
            STRICT {strictMode ? "ON" : "OFF"}
          </BrutButton>
          <BrutButton variant="go" onClick={startGame}>
            {phase === "idle" || phase === "gameover" ? "START" : "RESTART"}
          </BrutButton>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <p className="mono-label text-sm">{statusLabel}</p>

        {/* 4-button Simon pad */}
        <div
          className="relative brut overflow-hidden"
          style={{ width: 280, height: 280, borderRadius: "50%", background: "#1e293b" }}
        >
          {BUTTONS.map((btn) => {
            const isLit = lit === btn.id;
            const positions = [
              { top: 0, left: 0, borderRadius: "100% 0 0 0" },       // top-left = red
              { top: 0, right: 0, borderRadius: "0 100% 0 0" },       // top-right = blue
              { bottom: 0, left: 0, borderRadius: "0 0 0 100%" },     // bottom-left = green
              { bottom: 0, right: 0, borderRadius: "0 0 100% 0" },    // bottom-right = yellow
            ];
            return (
              <button
                key={btn.id}
                onClick={() => pressButton(btn.id)}
                disabled={phase !== "input"}
                aria-label={`Simon button ${btn.label} (key ${btn.key})`}
                className="absolute flex items-center justify-center transition-all duration-150"
                style={{
                  width: 130,
                  height: 130,
                  background: isLit ? btn.lit : btn.color,
                  opacity: phase === "input" ? 1 : 0.75,
                  cursor: phase === "input" ? "pointer" : "default",
                  boxShadow: isLit ? `0 0 30px ${btn.lit}` : "none",
                  ...positions[btn.id],
                }}
              >
                <span className="text-3xl pointer-events-none">{btn.label}</span>
              </button>
            );
          })}
          {/* Centre circle */}
          <div
            className="absolute flex flex-col items-center justify-center"
            style={{ top: 90, left: 90, width: 100, height: 100, borderRadius: "50%", background: "#0f172a", border: "4px solid #334155", zIndex: 10 }}
          >
            <p className="mono-label text-white text-lg font-bold">{score}</p>
            <p className="mono-label text-slate-400 text-xs">SCORE</p>
          </div>
        </div>

        {phase === "gameover" && (
          <div className="brut bg-lab-red px-6 py-3 text-center">
            <p className="font-display text-xl text-white">WRONG!</p>
            <p className="mono-label text-white">You reached round {score + 1} but pressed the wrong button.</p>
            <p className="mono-label text-white mt-1">Score: {score}</p>
          </div>
        )}

        <div className="mono-label text-xs opacity-50 text-center">
          Keys 1/2/3/4 map to 🔴🔵🟢🟡 · Strict mode = restart on any mistake
        </div>
      </div>
    </GameShell>
  );
}
