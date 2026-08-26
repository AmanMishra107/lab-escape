import { useEffect, useRef, useState, useMemo } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

const LAB_QUOTES = [
  "sir i submitted the assignment yesterday but the portal crashed",
  "the wifi was not working so i could not upload the project file",
  "bro send the code i will change the variable names and comments",
  "attendance is seventy one percent and falling steadily each week",
  "the printer in lab four prints secret diagnostics nobody requested",
  "i understood everything until the professor reached slide number two",
  "practical file due today simply means practical file due at midnight",
  "my workstation restarted for a mandatory system update during viva",
  "we are doing the exact same experiment so technically this is teamwork",
  "the external examiner said interesting and walked away without marks",
  "overclocking the quantum mainframe until the cooling loop freezes solid",
  "never touch the big red emergency circuit breaker during lab session",
];

const WORD_BANK = [
  "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "i", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "his", "from", "they", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
];

type Mode = "time" | "words" | "quotes";

export default function Typing() {
  const [mode, setMode] = useState<Mode>("time");
  const [timeLimit, setTimeLimit] = useState<number>(15); // 15s or 30s
  const [wordCountTarget, setWordCountTarget] = useState<number>(25);

  const [words, setWords] = useState<string[]>([]);
  const [typedChars, setTypedChars] = useState<string[]>([]); // Current full input buffer
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isFinished, setIsFinished] = useState(false);
  const [totalMistakes, setTotalMistakes] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Generate word stream based on current mode
  const generateWords = (m: Mode) => {
    if (m === "quotes") {
      const q = LAB_QUOTES[Math.floor(Math.random() * LAB_QUOTES.length)]!;
      return q.split(" ");
    }
    const count = m === "words" ? wordCountTarget : 60;
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      list.push(WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]!);
    }
    return list;
  };

  const resetTest = () => {
    const newWords = generateWords(mode);
    setWords(newWords);
    setTypedChars([]);
    setStartTime(null);
    setElapsedSeconds(0);
    setIsFinished(false);
    setTotalMistakes(0);
    inputRef.current?.focus();
    sound.play("click");
  };

  useEffect(() => {
    resetTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, timeLimit, wordCountTarget]);

  const fullTargetString = useMemo(() => words.join(" "), [words]);

  // Timer loop
  useEffect(() => {
    if (!startTime || isFinished) return;
    const interval = setInterval(() => {
      const sec = (Date.now() - startTime) / 1000;
      setElapsedSeconds(sec);

      if (mode === "time" && sec >= timeLimit) {
        finishTest(sec);
      }
    }, 100);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, isFinished, mode, timeLimit]);

  const finishTest = (finalSec: number) => {
    setIsFinished(true);
    sound.play("success");

    const typedStr = typedChars.join("");
    let correct = 0;
    for (let i = 0; i < typedStr.length; i++) {
      if (typedStr[i] === fullTargetString[i]) correct++;
    }

    const netWpm = Math.max(0, Math.round((correct / 5) / (finalSec / 60)));
    const acc = typedStr.length > 0 ? correct / typedStr.length : 1;

    store.submitGameResult("typing", {
      score: Math.round(netWpm * acc * 10),
      accuracy: acc,
      time: finalSec * 1000,
      completed: true,
    });

    if (netWpm >= 60 && acc > 0.9) store.unlock("typist");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isFinished) {
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        resetTest();
      }
      return;
    }

    if (!startTime) {
      setStartTime(Date.now());
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      setTypedChars((prev) => prev.slice(0, -1));
      sound.play("key");
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const nextChar = e.key;
      const curIdx = typedChars.length;
      if (nextChar !== fullTargetString[curIdx]) {
        setTotalMistakes((m) => m + 1);
        sound.play("pop");
      } else {
        sound.play("key");
      }

      const nextTyped = [...typedChars, nextChar];
      setTypedChars(nextTyped);

      // Check finish condition for words & quotes mode
      if ((mode === "words" || mode === "quotes") && nextTyped.length >= fullTargetString.length) {
        const sec = ((Date.now() - (startTime ?? Date.now())) / 1000) || 1;
        finishTest(sec);
      }
    }
  };

  // Realtime stats calculation
  const correctCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < typedChars.length; i++) {
      if (typedChars[i] === fullTargetString[i]) count++;
    }
    return count;
  }, [typedChars, fullTargetString]);

  const currentWpm = elapsedSeconds > 0 ? Math.round((correctCount / 5) / (elapsedSeconds / 60)) : 0;
  const currentAccuracy = typedChars.length > 0 ? Math.round((correctCount / typedChars.length) * 100) : 100;
  const rawWpm = elapsedSeconds > 0 ? Math.round((typedChars.length / 5) / (elapsedSeconds / 60)) : 0;

  return (
    <GameShell
      id="typing"
      status={
        <>
          <Tag tone="blue">{currentWpm} WPM</Tag>
          <Tag tone={currentAccuracy > 90 ? "green" : "yellow"}>{currentAccuracy}% ACC</Tag>
          {mode === "time" && <Tag tone="purple">{Math.max(0, Math.ceil(timeLimit - elapsedSeconds))}s LEFT</Tag>}
        </>
      }
      toolbar={
        <BrutButton variant="go" onClick={resetTest} className="text-xs py-1">
          🔄 RESTART (TAB)
        </BrutButton>
      }
    >
      <div
        className="flex h-full w-full flex-col justify-between p-3 select-none font-mono"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Top MonkeyType Mode Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-lab-ink bg-stone-900 px-3 py-1.5 text-xs text-white shadow-sm rounded">
          <div className="flex items-center gap-1.5 text-stone-400">
            <span className="text-[10px] uppercase font-bold text-amber-400">MODE:</span>
            {(["time", "words", "quotes"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); }}
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors ${
                  mode === m ? "bg-amber-400 text-black" : "hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Sub-config buttons */}
          <div className="flex items-center gap-1.5">
            {mode === "time" && (
              <div className="flex gap-1">
                {[15, 30, 60].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTimeLimit(t); }}
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                      timeLimit === t ? "bg-emerald-400 text-black" : "text-stone-400 hover:text-white"
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            )}
            {mode === "words" && (
              <div className="flex gap-1">
                {[10, 25, 50].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => { setWordCountTarget(w); }}
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                      wordCountTarget === w ? "bg-sky-400 text-black" : "text-stone-400 hover:text-white"
                    }`}
                  >
                    {w}w
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hidden Input for smooth typing capture */}
        <input
          ref={inputRef}
          type="text"
          autoFocus
          className="opacity-0 absolute -top-9999 left-0"
          onKeyDown={handleKeyDown}
        />

        {/* Main MonkeyType Word Stream Box */}
        {!isFinished ? (
          <div className="relative my-auto flex flex-col justify-center rounded-lg border-3 border-lab-ink bg-[#1e1e24] p-6 shadow-2xl min-h-[160px]">
            {/* Live Stats Header */}
            <div className="flex items-center justify-between text-xs text-stone-400 mb-3 border-b border-stone-700/50 pb-1.5">
              <div className="flex gap-4">
                <span>WPM: <b className="text-amber-400 text-sm font-bold">{currentWpm}</b></span>
                <span>ACC: <b className="text-emerald-400 text-sm font-bold">{currentAccuracy}%</b></span>
                <span>RAW: <b className="text-stone-300 text-sm font-bold">{rawWpm}</b></span>
              </div>
              <span className="text-[10px] text-stone-500 italic">Click anywhere or start typing</span>
            </div>

            {/* Character stream with caret */}
            <div className="font-mono text-xl sm:text-2xl leading-relaxed tracking-wide flex flex-wrap break-words">
              {fullTargetString.split("").map((targetChar, idx) => {
                const isTyped = idx < typedChars.length;
                const typedChar = typedChars[idx];
                const isCorrect = isTyped && typedChar === targetChar;
                const isCurrent = idx === typedChars.length;

                return (
                  <span
                    key={idx}
                    className={`relative ${
                      isCurrent
                        ? "border-l-2 border-amber-400 text-stone-400"
                        : isCorrect
                        ? "text-[#f8fafc] font-medium"
                        : isTyped
                        ? "text-rose-500 bg-rose-950/40 rounded-xs font-bold"
                        : "text-[#64748b]"
                    }`}
                  >
                    {targetChar}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          /* Results Summary Card */
          <div className="my-auto flex flex-col items-center justify-center rounded-lg border-3 border-lab-ink bg-[#1e1e24] p-6 shadow-2xl text-white space-y-4 max-w-md mx-auto w-full">
            <h3 className="font-display text-2xl text-amber-400 font-bold">TEST COMPLETED! 🏁</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full text-center">
              <div className="bg-stone-900 border border-stone-700 p-2 rounded">
                <span className="text-[10px] text-stone-400 block">WPM</span>
                <span className="text-2xl font-bold text-emerald-400">{currentWpm}</span>
              </div>
              <div className="bg-stone-900 border border-stone-700 p-2 rounded">
                <span className="text-[10px] text-stone-400 block">ACCURACY</span>
                <span className="text-2xl font-bold text-sky-400">{currentAccuracy}%</span>
              </div>
              <div className="bg-stone-900 border border-stone-700 p-2 rounded">
                <span className="text-[10px] text-stone-400 block">RAW WPM</span>
                <span className="text-2xl font-bold text-amber-400">{rawWpm}</span>
              </div>
              <div className="bg-stone-900 border border-stone-700 p-2 rounded">
                <span className="text-[10px] text-stone-400 block">MISTAKES</span>
                <span className="text-2xl font-bold text-rose-400">{totalMistakes}</span>
              </div>
            </div>

            <BrutButton variant="go" onClick={resetTest} className="w-full py-2 text-sm font-bold mt-2">
              RETRY TEST (TAB + ENTER)
            </BrutButton>
          </div>
        )}

        {/* Footer Hint */}
        <div className="border-t-2 border-lab-ink pt-1.5 text-[10px] text-center text-stone-600 flex justify-between">
          <span>MONKEYTYPE ENGINE · SUB-MILLISECOND ACCURACY</span>
          <span>PRESS <b className="text-lab-ink">TAB</b> TO RESTART TEST</span>
        </div>
      </div>
    </GameShell>
  );
}

