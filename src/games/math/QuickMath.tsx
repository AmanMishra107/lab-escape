import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

interface Q {
  text: string;
  answer: number;
}

function makeQuestion(level: number): Q {
  const ops = level < 3 ? ["+", "-"] : level < 6 ? ["+", "-", "×"] : ["+", "-", "×", "÷"];
  const op = ops[Math.floor(Math.random() * ops.length)]!;
  const range = 8 + level * 4;
  let a = 2 + Math.floor(Math.random() * range);
  let b = 2 + Math.floor(Math.random() * Math.min(12, range));
  if (op === "÷") {
    const res = 2 + Math.floor(Math.random() * 9);
    a = res * b;
    return { text: `${a} ÷ ${b}`, answer: res };
  }
  if (op === "-" && b > a) [a, b] = [b, a];
  const answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
  return { text: `${a} ${op} ${b}`, answer };
}

export default function QuickMath() {
  const [q, setQ] = useState<Q | null>(null);
  const [value, setValue] = useState("");
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(5);
  const [over, setOver] = useState(false);
  const askedAt = useRef(0);
  const startedAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const finish = useCallback(
    (finalScore: number, correct: number, asked: number) => {
      setOver(true);
      setQ(null);
      sound.play("error");
      store.submitGameResult("math", {
        score: finalScore,
        accuracy: asked ? correct / asked : 0,
        time: performance.now() - startedAt.current,
        completed: true,
      });
    },
    [],
  );

  const askedRef = useRef(0);
  const correctRef = useRef(0);

  const next = useCallback((lvl: number) => {
    setQ(makeQuestion(lvl));
    setValue("");
    setLeft(5);
    askedAt.current = performance.now();
    askedRef.current += 1;
    inputRef.current?.focus();
  }, []);

  const start = () => {
    setStreak(0);
    setScore(0);
    setOver(false);
    askedRef.current = 0;
    correctRef.current = 0;
    startedAt.current = performance.now();
    next(1);
  };

  useEffect(() => {
    if (!q || over) return;
    const t = window.setInterval(() => {
      const remaining = 5 - (performance.now() - askedAt.current) / 1000;
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        window.clearInterval(t);
        finish(score, correctRef.current, askedRef.current);
      }
    }, 100);
    return () => window.clearInterval(t);
  }, [q, over, score, finish]);

  const submit = () => {
    if (!q) return;
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    if (n === q.answer) {
      const bonus = Math.round(20 + left * 12);
      sound.play("success");
      correctRef.current += 1;
      const s = streak + 1;
      setStreak(s);
      setScore((v) => v + bonus);
      if (s >= 10) store.unlock("mathlete");
      next(Math.min(9, 1 + Math.floor(s / 2)));
    } else {
      sound.play("error");
      finish(score, correctRef.current, askedRef.current);
    }
  };

  return (
    <GameShell
      id="math"
      status={
        <>
          <Tag tone="blue">SCORE {score}</Tag>
          <Tag tone="green">STREAK {streak}</Tag>
          <Tag tone={left < 2 ? "red" : "yellow"}>{left.toFixed(1)}s</Tag>
        </>
      }
      toolbar={
        <BrutButton variant="go" onClick={start}>
          {q ? "RESTART" : "START"}
        </BrutButton>
      }
    >
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <p className="font-display text-5xl">{q ? `${q.text} = ?` : over ? "GAME OVER" : "READY?"}</p>
        <form
          className="flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            ref={inputRef}
            aria-label="Answer"
            inputMode="numeric"
            value={value}
            disabled={!q}
            onChange={(e) => setValue(e.target.value.replace(/[^-\d]/g, "").slice(0, 6))}
            className="brut min-h-12 flex-1 bg-background px-3 text-center font-mono text-xl"
          />
          <BrutButton type="submit" variant="primary" disabled={!q}>
            ENTER
          </BrutButton>
        </form>
        <div className="grid grid-cols-5 gap-1 sm:hidden">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => (
            <BrutButton key={d} onClick={() => setValue((v) => (v + d).slice(0, 6))}>
              {d}
            </BrutButton>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
