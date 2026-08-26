import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

interface Question {
  text: string;
  answer: number;
  level: number;
}

const LEVEL_NAMES = [
  "LEVEL 1: CADET (ADD & SUB)",
  "LEVEL 2: SCHOLAR (TABLES & DIV)",
  "LEVEL 3: ENGINEER (DUAL OPS)",
  "LEVEL 4: SCIENTIST (ALGEBRA ?)",
  "LEVEL 5: QUANTUM MASTER (POWERS)",
];

function generateQuestion(level: number): Question {
  if (level === 1) {
    const isAdd = Math.random() > 0.5;
    const a = Math.floor(Math.random() * 20) + 3;
    const b = Math.floor(Math.random() * 20) + 2;
    if (isAdd) return { text: `${a} + ${b}`, answer: a + b, level };
    const high = Math.max(a, b), low = Math.min(a, b);
    return { text: `${high} - ${low}`, answer: high - low, level };
  }

  if (level === 2) {
    const isMul = Math.random() > 0.4;
    if (isMul) {
      const a = Math.floor(Math.random() * 11) + 2;
      const b = Math.floor(Math.random() * 11) + 2;
      return { text: `${a} × ${b}`, answer: a * b, level };
    }
    const b = Math.floor(Math.random() * 9) + 2;
    const ans = Math.floor(Math.random() * 10) + 2;
    const a = b * ans;
    return { text: `${a} ÷ ${b}`, answer: ans, level };
  }

  if (level === 3) {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 6) + 2;
    const c = Math.floor(Math.random() * 15) + 1;
    const isAdd = Math.random() > 0.5;
    if (isAdd) {
      return { text: `(${a} × ${b}) + ${c}`, answer: a * b + c, level };
    }
    return { text: `(${a} × ${b}) - ${c}`, answer: a * b - c, level };
  }

  if (level === 4) {
    const isMul = Math.random() > 0.5;
    if (isMul) {
      const a = Math.floor(Math.random() * 10) + 3;
      const ans = Math.floor(Math.random() * 9) + 2;
      const product = a * ans;
      return { text: `? × ${a} = ${product}`, answer: ans, level };
    }
    const a = Math.floor(Math.random() * 30) + 10;
    const ans = Math.floor(Math.random() * 30) + 5;
    const sum = a + ans;
    return { text: `? + ${a} = ${sum}`, answer: ans, level };
  }

  // Level 5: Powers & Complex
  const isSquare = Math.random() > 0.5;
  if (isSquare) {
    const base = Math.floor(Math.random() * 9) + 2;
    const add = Math.floor(Math.random() * 20) + 1;
    return { text: `${base}² + ${add}`, answer: base * base + add, level };
  }
  const a = Math.floor(Math.random() * 12) + 2;
  const b = Math.floor(Math.random() * 12) + 2;
  const c = Math.floor(Math.random() * 20) + 5;
  return { text: `(${a} × ${b}) + ${c}`, answer: a * b + c, level };
}

export default function QuickMath() {
  const [level, setLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0); // 0 to 4 (5 solves to level up)
  const [q, setQ] = useState<Question | null>(null);
  const [value, setValue] = useState("");
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(6.0);
  const [over, setOver] = useState(false);
  const [levelUpBanner, setLevelUpBanner] = useState<string | null>(null);

  const askedAt = useRef(0);
  const startedAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const askedCount = useRef(0);
  const correctCount = useRef(0);

  const nextQuestion = useCallback((curLevel: number) => {
    setQ(generateQuestion(curLevel));
    setValue("");
    setTimeLeft(Math.max(3.5, 7.0 - curLevel * 0.5));
    askedAt.current = performance.now();
    askedCount.current += 1;
    inputRef.current?.focus();
  }, []);

  const startGame = () => {
    setLevel(1);
    setLevelProgress(0);
    setStreak(0);
    setScore(0);
    setOver(false);
    setLevelUpBanner(null);
    askedCount.current = 0;
    correctCount.current = 0;
    startedAt.current = performance.now();
    nextQuestion(1);
    sound.play("click");
  };

  const finishGame = useCallback((finalScore: number) => {
    setOver(true);
    setQ(null);
    sound.play("error");
    store.submitGameResult("math", {
      score: finalScore,
      accuracy: askedCount.current ? correctCount.current / askedCount.current : 0,
      time: performance.now() - startedAt.current,
      completed: true,
    });
  }, []);

  // Timer interval
  useEffect(() => {
    if (!q || over) return;
    const maxTime = Math.max(3.5, 7.0 - level * 0.5);

    const interval = setInterval(() => {
      const remaining = maxTime - (performance.now() - askedAt.current) / 1000;
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(interval);
        finishGame(score);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [q, over, level, score, finishGame]);

  const submitAnswer = () => {
    if (!q || over) return;
    const n = Number(value.trim());
    if (!Number.isFinite(n) || value.trim() === "") return;

    if (n === q.answer) {
      sound.play("success");
      correctCount.current += 1;
      const newStreak = streak + 1;
      setStreak(newStreak);

      const multiplier = Math.min(3.0, 1 + newStreak * 0.15);
      const points = Math.round((25 * level + timeLeft * 10) * multiplier);
      setScore((s) => s + points);

      // Level progression check (Every 4 correct answers = Level up!)
      const nextProgress = levelProgress + 1;
      if (nextProgress >= 4 && level < 5) {
        const nextLvl = level + 1;
        setLevel(nextLvl);
        setLevelProgress(0);
        setLevelUpBanner(`LEVEL UP! REACHED ${LEVEL_NAMES[nextLvl - 1]}`);
        sound.play("powerup");
        setTimeout(() => setLevelUpBanner(null), 2500);
        nextQuestion(nextLvl);
      } else {
        setLevelProgress(nextProgress);
        nextQuestion(level);
      }

      if (newStreak >= 10) store.unlock("mathlete");
    } else {
      sound.play("error");
      finishGame(score);
    }
  };

  return (
    <GameShell
      id="math"
      status={
        <>
          <Tag tone="blue">SCORE {score}</Tag>
          <Tag tone="green">STREAK {streak} 🔥</Tag>
          <Tag tone="purple">LVL {level}/5</Tag>
          <Tag tone={timeLeft < 2 ? "red" : "yellow"}>{timeLeft.toFixed(1)}s</Tag>
        </>
      }
      toolbar={
        <BrutButton variant="go" onClick={startGame} className="text-xs py-1">
          {q ? "🔄 RESTART" : "▶ START"}
        </BrutButton>
      }
    >
      <div className="flex h-full w-full flex-col items-center justify-between p-3 font-mono select-none">
        
        {/* Top Level Progression Header */}
        <div className="w-full max-w-md rounded border-2 border-lab-ink bg-stone-900 px-3 py-2 text-white shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-400">{LEVEL_NAMES[level - 1]}</span>
            <span className="text-[10px] text-stone-400">XP: {levelProgress}/4 TO NEXT LVL</span>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${(levelProgress / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Level Up Banner Alert */}
        {levelUpBanner && (
          <div className="brut bg-emerald-400 border-2 border-lab-ink px-4 py-1.5 text-center text-black font-display font-bold text-sm animate-bounce shadow-md">
            ⚡ {levelUpBanner} ⚡
          </div>
        )}

        {/* Equation Display */}
        <div className="my-auto flex flex-col items-center gap-4 text-center">
          <div className="rounded-xl border-3 border-lab-ink bg-card px-8 py-6 shadow-xl">
            <p className="font-display text-4xl sm:text-5xl font-black tracking-wider text-slate-800">
              {q ? `${q.text} = ?` : over ? "GAME OVER" : "SPEED MATH"}
            </p>
          </div>

          {/* Timer Progress Ring / Bar */}
          {q && (
            <div className="w-full max-w-xs h-2 bg-stone-200 rounded-full overflow-hidden border border-lab-ink/30">
              <div
                className={`h-full transition-all duration-100 ${timeLeft < 2 ? "bg-rose-500" : "bg-blue-500"}`}
                style={{ width: `${(timeLeft / (7.0 - level * 0.5)) * 100}%` }}
              />
            </div>
          )}

          {/* Input Form */}
          <form
            className="flex w-full max-w-sm gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submitAnswer();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoFocus
              value={value}
              disabled={!q}
              placeholder="Your answer..."
              onChange={(e) => setValue(e.target.value.replace(/[^-\d]/g, "").slice(0, 6))}
              className="brut min-h-11 flex-1 bg-background px-4 text-center font-mono text-2xl font-bold border-2 border-lab-ink"
            />
            <BrutButton type="submit" variant="primary" disabled={!q} className="px-5 font-bold">
              ENTER
            </BrutButton>
          </form>
        </div>

        {/* On-screen Digital Keypad */}
        <div className="flex flex-wrap justify-center gap-1.5 max-w-xs w-full">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "0"].map((d) => (
            <button
              key={d}
              type="button"
              disabled={!q}
              onClick={() => setValue((v) => (v + d).slice(0, 6))}
              className="brut-sm h-8 w-8 sm:h-9 sm:w-9 bg-card hover:bg-stone-200 active:scale-95 border-2 border-lab-ink text-sm font-bold shadow-xs"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            disabled={!q}
            onClick={() => setValue((v) => v.slice(0, -1))}
            className="brut-sm h-8 px-2 sm:h-9 sm:px-3 bg-stone-200 hover:bg-stone-300 active:scale-95 border-2 border-lab-ink text-xs font-bold shadow-xs"
          >
            ⌫
          </button>
        </div>

        {/* Game Over Summary */}
        {over && (
          <div className="brut bg-rose-600 border-2 border-lab-ink px-4 py-2 text-center text-white shadow-lg my-2">
            <p className="font-display text-lg font-bold">TIME OUT / INCORRECT!</p>
            <p className="text-xs opacity-90">Final Score: {score} · Max Streak: {streak}</p>
          </div>
        )}

      </div>
    </GameShell>
  );
}

