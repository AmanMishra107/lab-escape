import { useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store, useLab } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

type Mode = "idle" | "waiting" | "go" | "result" | "false";

const rate = (ms: number) =>
  ms < 160 ? "INHUMAN." : ms < 200 ? "INSANE." : ms < 260 ? "SHARP." : ms < 350 ? "FINE." : ms < 500 ? "SLEEPY." : "ARE YOU OK?";

export default function Reaction() {
  const [mode, setMode] = useState<Mode>("idle");
  const [ms, setMs] = useState(0);
  const [attempts, setAttempts] = useState<number[]>([]);
  const timer = useRef<number | null>(null);
  const goAt = useRef(0);
  const best = useLab((s) => s.save.highScores.reaction ?? 0);

  useEffect(() => () => void (timer.current && window.clearTimeout(timer.current)), []);

  const arm = () => {
    setMode("waiting");
    timer.current = window.setTimeout(
      () => {
        goAt.current = performance.now();
        sound.play("pop");
        setMode("go");
      },
      1200 + Math.random() * 3200,
    );
  };

  const hit = () => {
    if (mode === "idle" || mode === "result" || mode === "false") return arm();
    if (mode === "waiting") {
      if (timer.current) window.clearTimeout(timer.current);
      sound.play("error");
      setMode("false");
      return;
    }
    const took = Math.round(performance.now() - goAt.current);
    setMs(took);
    setAttempts((a) => [...a, took].slice(-5));
    setMode("result");
    sound.play("success");
    // Score rewards speed: 600ms floor, faster is better.
    const score = Math.max(0, Math.round(600 - took));
    store.submitGameResult("reaction", {
      score,
      accuracy: Math.max(0, Math.min(1, (600 - took) / 500)),
      time: took,
      completed: true,
    });
    if (took < 200) store.unlock("speed_demon");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        hit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const avg = attempts.length ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length) : 0;

  return (
    <GameShell
      id="reaction"
      status={
        <>
          <Tag tone="blue">LAST {ms || "—"} MS</Tag>
          <Tag tone="green">AVG {avg || "—"}</Tag>
        </>
      }
      toolbar={
        <>
          <BrutButton variant="go" onClick={arm}>
            NEW ATTEMPT
          </BrutButton>
          <span className="mono-label self-center opacity-70">Best score {best} (600 − ms)</span>
        </>
      }
    >
      <button
        onClick={hit}
        className={`brut flex h-full w-full flex-col items-center justify-center gap-2 text-center ${
          mode === "go" ? "bg-lab-green" : mode === "false" ? "bg-lab-red text-lab-paper" : "bg-card"
        }`}
      >
        <span className="font-display text-4xl sm:text-6xl">
          {mode === "idle" && "CLICK TO ARM"}
          {mode === "waiting" && "WAIT..."}
          {mode === "go" && "CLICK!"}
          {mode === "result" && `${ms} MS`}
          {mode === "false" && "FALSE START"}
        </span>
        <span className="mono-label">
          {mode === "result" ? rate(ms) : mode === "false" ? "Patience. Like the syllabus." : "Space bar also works."}
        </span>
      </button>
    </GameShell>
  );
}
