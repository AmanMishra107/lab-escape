import { useEffect, useRef } from "react";
import { LAB_OBJECTS, OBJECT_MAP } from "../../data/labObjects";
import { store, useLab } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { LabArt } from "./LabArt";

export function LabScene() {
  const focus = useLab((s) => s.rt.focus);
  const discovered = useLab((s) => s.save.discovered);
  const phase = useLab(() => store.phase());
  const reduced = useLab((s) => s.save.settings.reducedMotion);
  const stageRef = useRef<HTMLDivElement>(null);

  const target = focus ? OBJECT_MAP.get(focus) : undefined;
  const cx = target ? target.x + target.w / 2 : 50;
  const cy = target ? target.y + target.h / 2 : 50;
  const zoom = target ? target.zoom : 1;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    el.style.transformOrigin = `${cx}% ${cy}%`;
    el.style.transform = `translate(${50 - cx}%, ${50 - cy}%) scale(${zoom})`;
    el.style.transitionDuration = reduced ? "1ms" : "700ms";
  }, [cx, cy, zoom, reduced]);

  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden bg-wall">
      <div
        ref={stageRef}
        className="relative aspect-[16/9] max-h-full max-w-full min-h-0 min-w-0 shrink-0 transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{ width: "min(100%, calc(100dvh * 16 / 9))" }}
      >
        <LabArt phase={phase} boot={!focus} />

        {LAB_OBJECTS.map((o) => {
          const found = discovered.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-label={`${o.label} — ${o.hint}`}
              onMouseEnter={() => sound.play("hover")}
              onClick={() => {
                sound.play("open");
                store.focusObject(o.id);
              }}
              style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%`, height: `${o.h}%` }}
              className="group absolute border-3 border-transparent transition-[border-color,transform] duration-150 hover:border-lab-ink focus-visible:border-lab-ink"
            >
              <span
                className="mono-label pointer-events-none absolute -top-1 left-0 hidden -translate-y-full whitespace-nowrap border-2 border-lab-ink bg-lab-yellow px-1.5 py-0.5 text-[10px] text-lab-ink group-hover:block group-focus-visible:block"
              >
                {o.label}
              </span>
              {!found && (
                <span className="pointer-events-none absolute right-1 top-1 flex h-3 w-3 border-2 border-lab-ink bg-lab-red led" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

