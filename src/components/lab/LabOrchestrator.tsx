import { useEffect, useRef, useState } from "react";
import { RANDOM_EVENTS } from "../../data/events";
import { store, useLab } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import type { Phase } from "../../systems/types";
import { Toasts } from "../common/Toasts";
import { HUD } from "../hud/HUD";
import { BootSequence } from "./BootSequence";
import { EndScreen } from "./EndScreen";
import { LabScene } from "./LabScene";
import { ObjectPanel } from "./panels";
import { BrutButton } from "../ui/brut";

const PHASE_INDEX: Record<Phase, number> = { normal: 0, boredom: 1, chaos: 2, panic: 3, escape: 3, over: 3 };

function pickEvent(phaseIdx: number) {
  const pool = RANDOM_EVENTS.filter((e) => (e.minPhase ?? 0) <= phaseIdx);
  const total = pool.reduce((n, e) => n + e.weight, 0);
  let r = Math.random() * total;
  for (const e of pool) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return pool[0]!;
}

export function LabOrchestrator() {
  const [hydrated, setHydrated] = useState(false);
  const bootSeen = useLab((s) => s.save.bootSeen);
  const focus = useLab((s) => s.rt.focus);
  const phase = useLab(() => store.phase());
  const settings = useLab((s) => s.save.settings);
  const glitch = useLab((s) => s.rt.glitch);
  const escaped = useLab((s) => s.save.escaped);
  const [showBoot, setShowBoot] = useState(false);
  const lastEvent = useRef(0);

  useEffect(() => {
    store.hydrate();
    setHydrated(true);
    setShowBoot(!store.getSnapshot().save.bootSeen);
  }, []);

  // master tick
  useEffect(() => {
    if (!hydrated) return;
    const t = window.setInterval(() => store.tick(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [hydrated]);

  // random events
  useEffect(() => {
    if (!hydrated || showBoot || escaped) return;
    const t = window.setInterval(() => {
      const now = Date.now();
      if (now - lastEvent.current < 35000) return;
      if (Math.random() > 0.4) return;
      lastEvent.current = now;
      const e = pickEvent(PHASE_INDEX[phase]);
      store.toast(e.kind, e.title, e.body);
      sound.play(e.kind === "warn" ? "error" : "pop");
    }, 10000);
    return () => window.clearInterval(t);
  }, [hydrated, showBoot, phase, escaped]);

  // body classes for CRT / performance / cursor
  useEffect(() => {
    const c = document.documentElement.classList;
    c.toggle("crt-on", settings.crt);
    c.toggle("perf-mode", settings.performanceMode);
    c.toggle("custom-cursor", settings.customCursor);
    c.toggle("reduced", settings.reducedMotion);
  }, [settings]);

  // ambience
  useEffect(() => {
    if (!hydrated || showBoot) return;
    sound.updateAmbience();
  }, [hydrated, showBoot, settings, phase]);

  // esc to zoom out
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && store.getSnapshot().rt.focus) store.focusObject(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!hydrated) {
    return <div className="flex h-dvh items-center justify-center bg-lab-ink font-mono text-lab-green">booting…</div>;
  }

  const over = phase === "over" || !!escaped;

  return (
    <main className={`relative h-dvh w-full overflow-hidden bg-wall ${glitch > 0 ? "glitching" : ""}`}>
      <LabScene />

      {focus && (
        <div className="absolute inset-0 z-30 flex items-stretch justify-center p-2 pt-24 sm:p-4 sm:pt-28">
          <div className="brut h-full w-full max-w-5xl overflow-hidden bg-background">
            <ObjectPanel id={focus} />
          </div>
        </div>
      )}

      <HUD />
      <Toasts />

      {!focus && !over && (
        <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between gap-2 p-3">
          <p className="mono-label brut-sm bg-card px-2 py-1">CLICK ANYTHING. ESC TO STEP BACK.</p>
          {phase === "escape" && (
            <BrutButton variant="danger" className="pointer-events-auto" onClick={() => store.escapeEarly()}>
              SLIP OUT NOW
            </BrutButton>
          )}
        </footer>
      )}

      {over && <EndScreen />}
      {showBoot && !bootSeen && <BootSequence onDone={() => setShowBoot(false)} />}
      {settings.crt && <div className="crt-overlay pointer-events-none absolute inset-0 z-[60]" aria-hidden />}
    </main>
  );
}
