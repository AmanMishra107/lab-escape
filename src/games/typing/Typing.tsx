import { useEffect, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

const SENTENCES = [
  "Sir I submitted the assignment yesterday.",
  "The wifi was not working so I could not upload it.",
  "Bro send the code I will change the variable names.",
  "Attendance is seventy one percent and falling steadily.",
  "The printer in this lab prints things nobody sent.",
  "I understood everything until slide number two.",
  "Practical file due today means practical file due tonight.",
  "My laptop restarted for an update during the viva.",
  "We are doing the same experiment so technically it is teamwork.",
  "The professor said interesting and walked away silently.",
];

export default function Typing() {
  const [target, setTarget] = useState(SENTENCES[0]!);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const start = () => {
    setTarget(SENTENCES[Math.floor(Math.random() * SENTENCES.length)]!);
    setTyped("");
    setStartedAt(null);
    setDone(false);
    setMistakes(0);
    inputRef.current?.focus();
  };

  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const elapsed = startedAt ? (Date.now() - startedAt) / 1000 : 0;
  const correctChars = [...typed].filter((c, i) => c === target[i]).length;
  const accuracy = typed.length ? correctChars / typed.length : 1;
  const wpm = elapsed > 0 ? Math.round(correctChars / 5 / (elapsed / 60)) : 0;

  const onChange = (v: string) => {
    if (done) return;
    if (!startedAt) setStartedAt(Date.now());
    if (v.length > typed.length) {
      const idx = v.length - 1;
      if (v[idx] !== target[idx]) setMistakes((m) => m + 1);
      sound.play("key");
    }
    setTyped(v.slice(0, target.length));
    if (v.length >= target.length) {
      const secs = ((startedAt ? Date.now() - startedAt : 1) / 1000) || 1;
      const finalCorrect = [...v.slice(0, target.length)].filter((c, i) => c === target[i]).length;
      const acc = finalCorrect / target.length;
      const finalWpm = Math.round(finalCorrect / 5 / (secs / 60));
      setDone(true);
      sound.play("success");
      store.submitGameResult("typing", {
        score: Math.max(0, Math.round(finalWpm * acc * 10)),
        accuracy: acc,
        time: secs * 1000,
        completed: true,
      });
      if (finalWpm >= 60 && acc > 0.9) store.unlock("typist");
    }
  };

  return (
    <GameShell
      id="typing"
      status={
        <>
          <Tag tone="blue">{wpm} WPM</Tag>
          <Tag tone={accuracy > 0.9 ? "green" : "yellow"}>{Math.round(accuracy * 100)}%</Tag>
          <Tag tone="red">{mistakes} MISS</Tag>
        </>
      }
      toolbar={
        <BrutButton variant="go" onClick={start}>
          NEW SENTENCE
        </BrutButton>
      }
    >
      <div className="w-full max-w-2xl space-y-3 p-2">
        <p className="brut bg-card p-3 font-mono text-base leading-relaxed">
          {[...target].map((ch, i) => {
            const state = i < typed.length ? (typed[i] === ch ? "ok" : "bad") : i === typed.length ? "cur" : "todo";
            return (
              <span
                key={i}
                className={
                  state === "ok"
                    ? "bg-lab-green"
                    : state === "bad"
                      ? "bg-lab-red text-lab-paper"
                      : state === "cur"
                        ? "border-b-4 border-lab-blue"
                        : "opacity-60"
                }
              >
                {ch}
              </span>
            );
          })}
        </p>
        <input
          ref={inputRef}
          aria-label="Type the sentence"
          value={typed}
          disabled={done}
          onChange={(e) => onChange(e.target.value)}
          className="brut min-h-12 w-full bg-background px-3 font-mono"
          placeholder="start typing..."
        />
        {done && <p className="mono-label">COMPLETE — {wpm} WPM at {Math.round(accuracy * 100)}% accuracy.</p>}
      </div>
    </GameShell>
  );
}
