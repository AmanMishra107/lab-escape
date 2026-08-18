import { ACHIEVEMENTS } from "../../data/achievements";
import { EASTER_EGGS } from "../../data/easterEggs";
import { levelInfo, store, useLab } from "../../systems/GameState";
import { BrutButton, Panel, Tag } from "../ui/brut";

export function EndScreen() {
  const save = useLab((s) => s.save);
  const lvl = levelInfo(save.xp);
  const escaped = save.escaped;
  const grade =
    save.score > 6000 ? "S — LEGENDARY TIME-WASTER" : save.score > 3000 ? "A — PROFESSIONAL IDLER" : save.score > 1200 ? "B — COMPETENT SLACKER" : "C — YOU ACTUALLY DID WORK?";

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-lab-ink/95 p-4">
      <Panel title={escaped ? "EARLY ESCAPE LOGGED" : "LAB SESSION COMPLETE"} className="w-full max-w-lg bg-card">
        <p className="font-display text-3xl">{escaped ? "YOU LEFT EARLY." : "THE BELL RANG."}</p>
        <p className="mt-1 text-sm">
          {escaped
            ? "Nobody saw you go. The register disagrees, but the register always disagrees."
            : "Four hours of your life, converted into experience points. Not a fair trade, but a trade."}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="SCORE" value={String(save.score)} />
          <Stat label="LEVEL" value={String(lvl.level)} />
          <Stat label="ACHIEVEMENTS" value={`${save.achievements.length}/${ACHIEVEMENTS.length}`} />
          <Stat label="EASTER EGGS" value={`${save.eggs.length}/${EASTER_EGGS.length}`} />
          <Stat label="GAMES PLAYED" value={`${save.gamesPlayed.length}/10`} />
          <Stat label="CLICKS" value={String(save.stats.clicks)} />
        </div>
        <p className="mono-label mt-4">FINAL GRADE</p>
        <Tag tone="yellow">{grade}</Tag>
        <div className="mt-5 flex gap-2">
          <BrutButton variant="go" onClick={() => store.startSession()}>
            NEXT LAB SESSION
          </BrutButton>
          <BrutButton variant="danger" onClick={() => store.reset()}>
            WIPE SAVE
          </BrutButton>
        </div>
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="brut-sm bg-background p-2">
      <p className="mono-label opacity-70">{label}</p>
      <p className="font-display text-xl leading-none">{value}</p>
    </div>
  );
}
