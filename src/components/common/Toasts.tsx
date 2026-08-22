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
    <div className="pointer-events-none absolute bottom-12 right-3 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => store.dismiss(t.id)}
          className={`brut window-in pointer-events-auto p-2.5 text-left border-3 border-lab-ink shadow-xl ${TONE[t.kind] ?? "bg-card"}`}
          title="Click to dismiss toast"
        >
          <p className="mono-label font-black text-xs">{t.title}</p>
          {t.body && <p className="text-xs leading-snug whitespace-pre-wrap font-sans mt-1 font-bold">{t.body}</p>}
        </button>
      ))}
    </div>
  );
}
