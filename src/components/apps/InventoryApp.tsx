import { ITEMS } from "../../data/inventory";
import { useLab } from "../../systems/GameState";

export function InventoryApp() {
  const owned = useLab((s) => s.save.inventory);
  return (
    <div className="scroll-thin h-full overflow-y-auto pr-1">
      <p className="mono-label mb-3">
        BACKPACK CONTENTS — {owned.length}/{ITEMS.length}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item) => {
          const has = owned.includes(item.id);
          return (
            <li key={item.id} className={`brut-sm flex gap-3 p-3 ${has ? "bg-card" : "bg-muted opacity-60"}`}>
              <span className="text-2xl" aria-hidden>
                {has ? item.icon : "❔"}
              </span>
              <div>
                <p className="mono-label">{has ? item.name : "UNKNOWN ITEM"}</p>
                <p className="text-xs">{has ? item.description : "Somewhere in this lab."}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
