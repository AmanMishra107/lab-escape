import type { ReactNode } from "react";
import { GAME_MAP } from "../data/games";
import type { GameId } from "../systems/types";
import { Tag } from "../components/ui/brut";
import { useLab } from "../systems/GameState";

export function GameShell({
  id,
  status,
  toolbar,
  children,
  paused,
}: {
  id: GameId;
  status?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  paused?: boolean;
}) {
  const meta = GAME_MAP.get(id)!;
  const best = useLab((s) => s.save.highScores[id] ?? 0);
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-3 border-lab-ink pb-2">
        <div>
          <h3 className="font-display text-xl leading-none">{meta.name}</h3>
          <p className="mono-label opacity-70">{meta.controls}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status}
          <Tag tone="yellow">BEST {best}</Tag>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {children}
        {paused && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-lab-ink/80">
            <p className="font-display text-3xl text-lab-paper">PAUSED</p>
          </div>
        )}
      </div>
      {toolbar && <div className="flex flex-wrap gap-2 border-t-3 border-lab-ink pt-2">{toolbar}</div>}
    </div>
  );
}
