import { store, useLab } from "../../systems/GameState";

const TONE: Record<string, string> = {
  achievement: "bg-lab-yellow",
  egg: "bg-lab-green",
  system: "bg-card",
  warn: "bg-lab-red text-lab-paper",
  xp: "bg-lab-blue",
};

export function Toasts() {
  const toasts = useLab((s) => s.rt.toasts);
  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-50 flex w-[min(92vw,320px)] flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => store.dismiss(t.id)}
          className={`brut window-in pointer-events-auto p-2 text-left ${TONE[t.kind] ?? "bg-card"}`}
        >
          <p className="mono-label">{t.title}</p>
          {t.body && <p className="text-sm leading-snug">{t.body}</p>}
        </button>
      ))}
    </div>
  );
}
