import { useState } from "react";
import { PUZZLES } from "../../data/puzzles";
import { store, useLab } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../ui/brut";

export function PuzzlesApp() {
  const solved = useLab((s) => s.save.puzzles);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hints, setHints] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);

  return (
    <div className="scroll-thin h-full space-y-3 overflow-y-auto pr-1">
      <p className="mono-label">
        PUZZLES SOLVED — {solved.length}/{PUZZLES.length}
      </p>
      {PUZZLES.map((p) => {
        const done = solved.includes(p.id);
        return (
          <form
            key={p.id}
            className={`brut-sm p-3 ${done ? "bg-lab-green" : "bg-card"} ${wrong === p.id ? "glitching" : ""}`}
            onSubmit={(e) => {
              e.preventDefault();
              const raw = (answers[p.id] ?? "").trim().toLowerCase();
              if (!raw) return;
              if (p.answer.some((a) => raw === a || raw.replace(/\s+/g, "") === a.replace(/\s+/g, ""))) {
                sound.play("success");
                store.solvePuzzle(p.id, p.reward);
                if (p.grants) store.giveItem(p.grants);
              } else {
                sound.play("error");
                setWrong(p.id);
                setTimeout(() => setWrong(null), 400);
              }
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-display text-lg">{p.name}</h4>
              <Tag tone={done ? "ink" : "yellow"}>{done ? "SOLVED" : `${p.reward} XP`}</Tag>
            </div>
            <p className="mt-1 font-mono text-sm">{p.prompt}</p>
            {hints.includes(p.id) && !done && <p className="mono-label mt-1 opacity-70">HINT: {p.hint}</p>}
            {!done && (
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  aria-label={`Answer for ${p.name}`}
                  value={answers[p.id] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [p.id]: e.target.value.slice(0, 60) }))}
                  className="brut-sm min-h-11 flex-1 bg-background px-2 font-mono text-sm"
                  placeholder="answer..."
                />
                <BrutButton type="submit" variant="go">
                  SUBMIT
                </BrutButton>
                <BrutButton type="button" onClick={() => setHints((h) => [...h, p.id])}>
                  HINT
                </BrutButton>
              </div>
            )}
          </form>
        );
      })}
    </div>
  );
}
