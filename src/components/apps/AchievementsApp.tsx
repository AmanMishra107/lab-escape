import { ACHIEVEMENTS } from "../../data/achievements";
import { EASTER_EGGS } from "../../data/easterEggs";
import { useLab } from "../../systems/GameState";
import { Tag } from "../ui/brut";

export function AchievementsApp() {
  const unlocked = useLab((s) => s.save.achievements);
  const eggs = useLab((s) => s.save.eggs);

  return (
    <div className="scroll-thin h-full space-y-4 overflow-y-auto pr-1">
      <div>
        <p className="mono-label mb-2">
          ACHIEVEMENTS — {unlocked.length}/{ACHIEVEMENTS.length}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked.includes(a.id);
            const hidden = a.secret && !got;
            return (
              <li key={a.id} className={`brut-sm p-2 ${got ? "bg-lab-green" : "bg-card"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="mono-label">{hidden ? "??? SECRET" : a.name}</span>
                  <Tag tone={got ? "ink" : "yellow"}>{got ? "UNLOCKED" : `${a.xp} XP`}</Tag>
                </div>
                <p className="mt-1 text-xs">{hidden ? "Condition classified." : a.description}</p>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <p className="mono-label mb-2">
          EASTER EGGS — {eggs.length}/{EASTER_EGGS.length}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {EASTER_EGGS.map((e) => {
            const got = eggs.includes(e.id);
            return (
              <li key={e.id} className={`brut-sm p-2 text-xs ${got ? "bg-lab-yellow" : "bg-card"}`}>
                <span className="mono-label">{got ? e.id.replace(/_/g, " ") : "?????"}</span>
                <p className="mt-1">{got ? e.response : e.hint}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
