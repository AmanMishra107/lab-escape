import { levelInfo, store, useLab } from "../../systems/GameState";
import type { Phase } from "../../systems/types";
import { BrutButton, Meter, Tag } from "../ui/brut";

const PHASE_LABEL: Record<Phase, string> = {
  normal: "PHASE 1 — FALSE HOPE",
  boredom: "PHASE 2 — BOREDOM SETS IN",
  chaos: "PHASE 3 — MILD CHAOS",
  panic: "PHASE 4 — PANIC MODE",
  escape: "PHASE 5 — ESCAPE WINDOW",
  over: "SESSION OVER",
};

const PHASE_TONE: Record<Phase, "ink" | "red" | "green" | "yellow" | "blue"> = {
  normal: "green",
  boredom: "blue",
  chaos: "yellow",
  panic: "red",
  escape: "red",
  over: "ink",
};

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export function HUD() {
  const xp = useLab((s) => s.save.xp);
  const score = useLab((s) => s.save.score);
  const boredom = useLab((s) => s.save.boredom);
  const focus = useLab((s) => s.rt.focus);
  const remaining = useLab(() => store.remainingMs());
  const phase = useLab(() => store.phase());
  const lvl = levelInfo(xp);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40 p-2 sm:p-3">
      <div className="brut pointer-events-auto flex flex-wrap items-center gap-2 bg-card px-2 py-2 sm:gap-3 sm:px-3">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl leading-none sm:text-2xl">LAB ESCAPE</span>
          <Tag tone={PHASE_TONE[phase]}>{PHASE_LABEL[phase]}</Tag>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="text-right">
            <p className="mono-label opacity-70">TIME LEFT</p>
            <p className={`font-display text-xl tabular-nums leading-none ${phase === "panic" || phase === "escape" ? "text-lab-red" : ""}`}>
              {fmt(remaining)}
            </p>
          </div>
          <div className="text-right">
            <p className="mono-label opacity-70">LVL {lvl.level}</p>
            <p className="font-display text-xl leading-none">{score}</p>
          </div>
          {focus && (
            <BrutButton variant="danger" onClick={() => store.focusObject(null)}>
              ← LAB
            </BrutButton>
          )}
        </div>

        <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <Meter label="BOREDOM" value={boredom} max={100} tone={boredom > 75 ? "red" : boredom > 45 ? "yellow" : "green"} />
          <Meter label={`XP ${lvl.into}/${lvl.span}`} value={lvl.into} max={lvl.span} tone="blue" />
        </div>
      </div>
    </header>
  );
}
