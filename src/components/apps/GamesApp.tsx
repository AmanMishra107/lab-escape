import { Suspense, useState } from "react";
import { GAMES } from "../../data/games";
import { GAME_COMPONENTS } from "../../games/registry";
import { useLab } from "../../systems/GameState";
import type { GameId } from "../../systems/types";
import { GameErrorBoundary } from "../common/ErrorBoundary";
import { BrutButton, Tag } from "../ui/brut";

export function GamesApp() {
  const [active, setActive] = useState<GameId | null>(null);
  const [runKey, setRunKey] = useState(0);
  const highScores = useLab((s) => s.save.highScores);
  const played = useLab((s) => s.save.gamesPlayed);

  if (active) {
    const Cmp = GAME_COMPONENTS[active];
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        <BrutButton className="self-start" onClick={() => setActive(null)}>
          ← ARCADE
        </BrutButton>
        <div className="min-h-0 flex-1">
          <GameErrorBoundary key={runKey} label={active.toUpperCase()} onReset={() => setRunKey((k) => k + 1)}>
            <Suspense fallback={<p className="mono-label p-4">LOADING {active.toUpperCase()}.EXE...</p>}>
              <Cmp />
            </Suspense>
          </GameErrorBoundary>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-thin h-full overflow-y-auto pr-1">
      <p className="mono-label mb-3">GAMES.EXE — {played.length}/{GAMES.length} PLAYED</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => (
          <li key={g.id}>
            <button
              onClick={() => setActive(g.id)}
              className="brut brut-press flex h-full w-full flex-col items-start gap-2 bg-card p-3 text-left"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="font-display text-lg leading-none">{g.name}</span>
                <Tag tone={g.difficulty === "hard" ? "red" : g.difficulty === "medium" ? "yellow" : "green"}>
                  {g.difficulty}
                </Tag>
              </div>
              <p className="text-sm">{g.tagline}</p>
              <span className="mono-label mt-auto opacity-70">
                BEST {highScores[g.id] ?? 0} · {g.category}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
