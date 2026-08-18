import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

const SIZE = 5;
const TOTAL = SIZE * SIZE;

export default function Memory() {
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [pattern, setPattern] = useState<number[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [phase, setPhase] = useState<"idle" | "show" | "input" | "over">("idle");
  const startedAt = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const nextRound = useCallback((lvl: number) => {
    const count = Math.min(TOTAL - 2, 2 + lvl);
    const cells = new Set<number>();
    while (cells.size < count) cells.add(Math.floor(Math.random() * TOTAL));
    setPattern([...cells]);
    setPicked([]);
    setPhase("show");
    sound.play("pop");
    const t = window.setTimeout(() => setPhase("input"), 900 + count * 190);
    timers.current.push(t);
  }, []);

  const start = () => {
    setLevel(1);
    setLives(3);
    startedAt.current = performance.now();
    nextRound(1);
  };

  const finish = (finalLevel: number) => {
    setPhase("over");
    sound.play("error");
    store.submitGameResult("memory", {
      score: Math.max(0, (finalLevel - 1) * 60),
      accuracy: Math.min(1, (finalLevel - 1) / 12),
      time: performance.now() - startedAt.current,
      completed: true,
    });
  };

  const click = (i: number) => {
    if (phase !== "input" || picked.includes(i)) return;
    store.interacted();
    if (pattern.includes(i)) {
      sound.play("click");
      const next = [...picked, i];
      setPicked(next);
      if (next.length === pattern.length) {
        sound.play("success");
        const lvl = level + 1;
        setLevel(lvl);
        const t = window.setTimeout(() => nextRound(lvl), 500);
        timers.current.push(t);
      }
    } else {
      sound.play("error");
      const left = lives - 1;
      setLives(left);
      if (left <= 0) finish(level);
      else {
        setPhase("show");
        const t = window.setTimeout(() => setPhase("input"), 900);
        timers.current.push(t);
      }
    }
  };

  return (
    <GameShell
      id="memory"
      status={
        <>
          <Tag tone="blue">LEVEL {level}</Tag>
          <Tag tone={lives > 1 ? "green" : "red"}>{"♥".repeat(Math.max(0, lives))}</Tag>
        </>
      }
      toolbar={
        <BrutButton variant="go" onClick={start}>
          {phase === "idle" ? "START" : "RESTART"}
        </BrutButton>
      }
    >
      <div className="flex flex-col items-center gap-3">
        <p className="mono-label">
          {phase === "idle" && "Memorise the pattern. Reproduce it. Simple. Cruel."}
          {phase === "show" && "MEMORISE..."}
          {phase === "input" && "REPRODUCE THE PATTERN"}
          {phase === "over" && `GAME OVER — reached level ${level}`}
        </p>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0,1fr))` }}>
          {Array.from({ length: TOTAL }).map((_, i) => {
            const lit = phase === "show" && pattern.includes(i);
            const got = picked.includes(i);
            return (
              <button
                key={i}
                aria-label={`cell ${i + 1}`}
                onClick={() => click(i)}
                className={`brut-sm h-11 w-11 sm:h-12 sm:w-12 ${
                  lit ? "bg-lab-yellow" : got ? "bg-lab-green" : "bg-card"
                }`}
              />
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
