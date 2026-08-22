import { useEffect, useRef } from "react";
import { LAB_OBJECTS, OBJECT_MAP } from "../../data/labObjects";
import { store, useLab } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { LabArt } from "./LabArt";
import { HeroWorkspaceOverlay } from "./HeroWorkspaceOverlay";

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
    <div className="relative h-full w-full overflow-hidden bg-wall">
      <div className="absolute inset-0 grid place-items-center overflow-hidden">
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
                className="group absolute outline-none cursor-pointer transition-transform duration-150 z-20"
              >
                <span
                  className="mono-label pointer-events-none absolute -top-2 left-1/2 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded border-2 border-lab-ink bg-lab-yellow px-2 py-1 text-xs font-bold text-lab-ink shadow-md group-hover:block group-focus-visible:block z-30"
                >
                  🔍 {o.label.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!focus && <HeroWorkspaceOverlay />}
    </div>
  );
}


