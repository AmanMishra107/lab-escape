import { useState } from "react";
import { sound } from "../../systems/SoundSystem";
import { BakchodBot } from "../live/BakchodBot";
import { LiveChat } from "../live/LiveChat";

const TABS = [
  { id: "live", name: "LAB CHAT ● LIVE", subtitle: "real friends, real time" },
  { id: "bot", name: "BAKCHOD BOT ● AI", subtitle: "code doubts + timepass" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function PhoneApp() {
  const [active, setActive] = useState<TabId>("live");

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 sm:flex-row">
      <div className="flex gap-2 overflow-x-auto border-b-3 border-lab-ink pb-2 sm:w-52 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r-3 sm:pb-0 sm:pr-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              sound.play("click");
              setActive(t.id);
            }}
            className={`brut-sm mono-label shrink-0 px-2 py-2 text-left ${
              active === t.id ? "bg-lab-ink text-lab-paper" : "bg-lab-green text-lab-ink"
            }`}
          >
            <span className="block">{t.name}</span>
            <span className="block text-[9px] normal-case opacity-70">{t.subtitle}</span>
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {active === "live" ? <LiveChat /> : <BakchodBot />}
      </div>
    </div>
  );
}
