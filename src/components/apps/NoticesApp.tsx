import { useMemo, useState } from "react";
import { NOTICES } from "../../data/notices";
import { store, useLab } from "../../systems/GameState";
import { BrutButton } from "../ui/brut";

export function NoticesApp() {
  const phase = useLab(() => store.phase());
  const [seed, setSeed] = useState(0);

  const visible = useMemo(() => {
    const pool = NOTICES.filter((n) => {
      if (phase === "normal" || phase === "boredom") return n.tone !== "chaos";
      return true;
    });
    const rotated = [...pool];
    for (let i = 0; i < seed % pool.length; i++) rotated.push(rotated.shift()!);
    return rotated.slice(0, 6);
  }, [phase, seed]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="mono-label">LAB 404 — NOTICE BOARD</p>
        <BrutButton
          variant="warn"
          onClick={() => {
            setSeed((s) => s + 1);
            store.interacted();
            store.reduceBoredom(2);
          }}
        >
          SHUFFLE
        </BrutButton>
      </div>
      <div className="scroll-thin grid flex-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {visible.map((n, i) => (
          <article
            key={n.title + i}
            className={`brut-sm p-3 ${
              n.tone === "chaos" ? "bg-lab-red text-lab-paper" : n.tone === "warn" ? "bg-lab-yellow" : "bg-card"
            }`}
            style={{ transform: `rotate(${((i % 3) - 1) * 0.8}deg)` }}
          >
            <h4 className="font-display text-lg">{n.title}</h4>
            <p className="mt-1 whitespace-pre-line text-sm">{n.body}</p>
            <p className="mono-label mt-2 opacity-70">{n.sign}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
