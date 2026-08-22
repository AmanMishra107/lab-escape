import { useState } from "react";
import { Menu, X } from "lucide-react";
import { levelInfo, store, useLab } from "../../systems/GameState";
import type { Phase } from "../../systems/types";
import { BrutButton, Tag } from "../ui/brut";

const PHASE_LABEL: Record<Phase, string> = {
  normal:  "PHASE 1",
  boredom: "PHASE 2",
  chaos:   "PHASE 3",
  panic:   "PANIC!",
  escape:  "ESCAPE!",
  over:    "OVER",
};

const PHASE_FULL_LABEL: Record<Phase, string> = {
  normal:  "PHASE 1 — FALSE HOPE",
  boredom: "PHASE 2 — BOREDOM SETS IN",
  chaos:   "PHASE 3 — MILD CHAOS",
  panic:   "PHASE 4 — PANIC MODE",
  escape:  "PHASE 5 — ESCAPE WINDOW",
  over:    "SESSION OVER",
};

const PHASE_TONE: Record<Phase, "ink" | "red" | "green" | "yellow" | "blue"> = {
  normal:  "yellow",
  boredom: "blue",
  chaos:   "yellow",
  panic:   "red",
  escape:  "red",
  over:    "ink",
};

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export function HUD({ onToggleMenu }: { onToggleMenu?: () => void }) {
  const xp        = useLab((s) => s.save.xp);
  const score     = useLab((s) => s.save.score);
  const boredom   = useLab((s) => s.save.boredom);
  const focus     = useLab((s) => s.rt.focus);
  const remaining = useLab(() => store.remainingMs());
  const phase     = useLab(() => store.phase());
  const lvl       = levelInfo(xp);
  const [showMenu, setShowMenu] = useState(false);

  const formattedLvl   = String(lvl.level).padStart(2, "0");
  const formattedScore = String(score).padStart(6, "0");
  const boredomBlocks  = Math.round((boredom / 100) * 8);
  const isPanic        = phase === "panic" || phase === "escape";

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40 p-1.5 sm:p-2.5">
      <div className="brut pointer-events-auto flex items-center justify-between gap-2 border-3 border-lab-ink bg-card px-2.5 py-1.5 shadow-md h-11 sm:h-12">
        {/* Left: Logo & Phase Tag */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <span className="font-display text-lg font-black tracking-tight text-lab-ink sm:text-xl md:text-2xl">
            LAB ESCAPE<span className="hidden sm:inline text-xs font-mono font-bold text-stone-600">.exe</span>
          </span>
          <Tag tone={PHASE_TONE[phase]} className="text-[10px] px-1.5 py-0.5 sm:text-xs">
            <span className="hidden sm:inline">{PHASE_FULL_LABEL[phase]}</span>
            <span className="sm:hidden">{PHASE_LABEL[phase]}</span>
          </Tag>
        </div>

        {/* Center: Real-Time Live Counters (Time Left, Boredom Bar) — Desktop/Tablet */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Time Left */}
          <div className="flex items-center gap-2 border-r-2 border-lab-ink/20 pr-3">
            <span className="mono-label text-[9px] text-stone-600">TIME</span>
            <span className={`font-mono text-base font-black tabular-nums ${isPanic ? "text-lab-red animate-pulse" : "text-lab-ink"}`}>
              {fmt(remaining)}
            </span>
          </div>

          {/* Boredom Bar */}
          <div className="flex items-center gap-2 pr-1">
            <span className="mono-label text-[9px] text-stone-600">BOREDOM</span>
            <span className="font-mono text-xs font-bold text-lab-ink">{Math.round(boredom)}%</span>
            <div className="flex gap-0.5 border border-lab-ink bg-stone-200 p-0.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-1.5 border border-black/40 ${
                    i < boredomBlocks
                      ? boredom > 75 ? "bg-lab-red" : boredom > 40 ? "bg-lab-yellow" : "bg-lab-green"
                      : "bg-stone-300 opacity-40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Level, Score & Menu Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Level — hidden on tiny mobile, shown sm+ */}
          <div className="hidden text-right sm:block">
            <p className="mono-label text-[8px] text-stone-500">LEVEL</p>
            <p className="font-mono text-sm font-black leading-none text-lab-ink">{formattedLvl}</p>
          </div>

          {/* Score — hidden on mobile, shown md+ */}
          <div className="hidden text-right md:block">
            <p className="mono-label text-[8px] text-stone-500">SCORE</p>
            <p className="font-mono text-sm font-black leading-none text-lab-ink">{formattedScore}</p>
          </div>

          {/* Mobile timer pill */}
          <div className="flex items-center gap-1 md:hidden">
            <span className={`font-mono text-xs font-black tabular-nums ${isPanic ? "text-lab-red animate-pulse" : "text-lab-ink"}`}>
              {fmt(remaining)}
            </span>
          </div>

          {focus ? (
            <BrutButton variant="danger" className="h-8 px-2 py-0 text-[10px] sm:h-9 sm:px-3 sm:text-xs" onClick={() => store.focusObject(null)}>
              ← BACK
            </BrutButton>
          ) : (
            <button
              onClick={() => {
                if (onToggleMenu) onToggleMenu();
                else setShowMenu((prev) => !prev);
              }}
              className="brut brut-press flex h-8 w-8 items-center justify-center bg-lab-red text-lab-paper font-bold shadow-sm sm:h-9 sm:w-9"
              title="Toggle Menu"
            >
              {showMenu ? <X size={16} strokeWidth={3} /> : <Menu size={16} strokeWidth={3} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile / Quick Dropdown Menu */}
      {showMenu && !focus && (
        <div className="pointer-events-auto mt-1.5 brut border-3 border-lab-ink bg-card p-3 shadow-2xl max-w-xs ml-auto sm:max-w-sm">
          <div className="flex items-center justify-between border-b-2 border-lab-ink pb-1.5 mb-2">
            <span className="mono-label text-xs font-bold">SYSTEM MENU</span>
            <button onClick={() => setShowMenu(false)} className="text-lab-red font-bold text-xs">CLOSE [X]</button>
          </div>

          {/* Mobile stats summary */}
          <div className="grid grid-cols-3 gap-1.5 mb-2 border-b-2 border-lab-ink/20 pb-2 text-center">
            <div className="bg-stone-100 p-1 border border-stone-300">
              <p className="mono-label text-[8px] text-stone-500">LEVEL</p>
              <p className="font-mono text-xs font-black">{formattedLvl}</p>
            </div>
            <div className="bg-stone-100 p-1 border border-stone-300">
              <p className="mono-label text-[8px] text-stone-500">SCORE</p>
              <p className="font-mono text-xs font-black">{formattedScore}</p>
            </div>
            <div className="bg-stone-100 p-1 border border-stone-300">
              <p className="mono-label text-[8px] text-stone-500">BOREDOM</p>
              <p className="font-mono text-xs font-black">{Math.round(boredom)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <BrutButton variant="default" className="text-[11px] py-1.5 min-h-0" onClick={() => { store.openApp("terminal"); setShowMenu(false); }}>
              💻 TERMINAL
            </BrutButton>
            <BrutButton variant="default" className="text-[11px] py-1.5 min-h-0" onClick={() => { store.openApp("games"); setShowMenu(false); }}>
              🎮 MINI-GAMES
            </BrutButton>
            <BrutButton variant="default" className="text-[11px] py-1.5 min-h-0" onClick={() => { store.openApp("phone"); setShowMenu(false); }}>
              📱 PHONE
            </BrutButton>
            <BrutButton variant="default" className="text-[11px] py-1.5 min-h-0" onClick={() => { store.openApp("settings"); setShowMenu(false); }}>
              ⚙️ SETTINGS
            </BrutButton>
          </div>
        </div>
      )}
    </header>
  );
}
