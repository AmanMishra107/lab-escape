import { Suspense, useState } from "react";
import { GAMES, type GameCategory } from "../../data/games";
import { GAME_COMPONENTS } from "../../games/registry";
import { useLab } from "../../systems/GameState";
import type { GameId } from "../../systems/types";
import { GameErrorBoundary } from "../common/ErrorBoundary";
import { BrutButton, Tag } from "../ui/brut";

type TabFilter = "ALL" | GameCategory;

const TABS: { id: TabFilter; label: string }[] = [
  { id: "ALL", label: "ALL (25)" },
  { id: "quick", label: "⚡ ARCADE & QUICK PLAY" },
  { id: "battle", label: "🤝 VS BOT / FRIENDS" },
];

export function GamesApp() {
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [runKey, setRunKey] = useState(0);

  const highScores = useLab((s) => s.save.highScores);
  const played = useLab((s) => s.save.gamesPlayed);

  const filteredGames = GAMES.filter((g) => (activeTab === "ALL" ? true : g.category === activeTab));

  if (activeGame) {
    const Cmp = GAME_COMPONENTS[activeGame];
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        <BrutButton className="self-start text-xs font-bold" onClick={() => setActiveGame(null)}>
          ← BACK TO GAMES.EXE
        </BrutButton>
        <div className="min-h-0 flex-1">
          <GameErrorBoundary key={runKey} label={activeGame.toUpperCase()} onReset={() => setRunKey((k) => k + 1)}>
            <Suspense fallback={<p className="mono-label p-4">LOADING {activeGame.toUpperCase()}.EXE...</p>}>
              <Cmp />
            </Suspense>
          </GameErrorBoundary>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-thin h-full overflow-y-auto pr-1 font-mono">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-lab-ink pb-2 mb-3">
        <div>
          <h2 className="font-display text-xl font-black">GAMES.EXE — CLASSIC ARCADE COLLECTION</h2>
          <p className="mono-label text-[10px] text-stone-500">
            PROGRESS: {played.length}/25 GAMES PLAYED
          </p>
        </div>
        <Tag tone="purple">SYSTEM REVISION 25.0</Tag>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-3 border-b border-stone-300 scroll-thin">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`brut-sm shrink-0 px-3 py-1.5 font-bold text-xs transition-colors ${
              activeTab === tab.id
                ? "bg-stone-900 text-amber-400 border-2 border-lab-ink"
                : "bg-white text-stone-800 hover:bg-lab-yellow"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Game Cards Grid */}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pb-4">
        {filteredGames.map((g) => {
          const score = highScores[g.id] ?? 0;
          return (
            <li key={g.id}>
              <button
                onClick={() => setActiveGame(g.id)}
                className="brut brut-press flex h-full w-full flex-col justify-between items-start gap-2 bg-card p-3 text-left border-3 border-lab-ink hover:bg-amber-50 transition-all"
              >
                <div className="flex w-full items-center justify-between gap-2 border-b pb-1.5 border-stone-200">
                  <span className="font-display text-base font-black text-stone-900 leading-tight">
                    {g.name}
                  </span>
                  <Tag tone={g.difficulty === "hard" ? "red" : g.difficulty === "medium" ? "yellow" : "green"}>
                    {g.difficulty.toUpperCase()}
                  </Tag>
                </div>

                <p className="text-xs text-stone-700 leading-snug">{g.tagline}</p>

                <div className="flex w-full items-center justify-between mt-auto pt-2 border-t border-stone-200 text-[10px]">
                  <span className="font-bold text-emerald-700">
                    BEST: {score}
                  </span>
                  <span className="mono-label text-stone-500 font-bold uppercase">
                    {g.players || "SOLO"}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
