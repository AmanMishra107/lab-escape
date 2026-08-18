import { useState } from "react";
import { store, useLab } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton } from "../ui/brut";

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        sound.play("click");
        onChange(!on);
      }}
      className="brut-sm brut-press flex min-h-11 w-full items-center justify-between bg-card px-3"
    >
      <span className="mono-label">{label}</span>
      <span className={`mono-label border-2 border-lab-ink px-2 py-0.5 ${on ? "bg-lab-green" : "bg-muted"}`}>
        {on ? "ON" : "OFF"}
      </span>
    </button>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="brut-sm block bg-card p-3">
      <span className="mono-label">
        {label} — {Math.round(value * 100)}%
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-lab-red"
      />
    </label>
  );
}

export function SettingsApp() {
  const s = useLab((st) => st.save.settings);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="scroll-thin h-full space-y-3 overflow-y-auto pr-1">
      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle label="Sound" on={s.sound} onChange={(v) => (store.setSettings({ sound: v }), sound.updateAmbience())} />
        <Toggle label="CRT Mode" on={s.crt} onChange={(v) => store.setSettings({ crt: v })} />
        <Toggle label="Reduced Motion" on={s.reducedMotion} onChange={(v) => store.setSettings({ reducedMotion: v })} />
        <Toggle label="Custom Cursor" on={s.customCursor} onChange={(v) => store.setSettings({ customCursor: v })} />
        <Toggle label="Performance Mode" on={s.performanceMode} onChange={(v) => store.setSettings({ performanceMode: v })} />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Slider label="Master" value={s.masterVolume} onChange={(v) => (store.setSettings({ masterVolume: v }), sound.updateAmbience())} />
        <Slider label="SFX" value={s.sfxVolume} onChange={(v) => store.setSettings({ sfxVolume: v })} />
        <Slider label="Ambience" value={s.ambienceVolume} onChange={(v) => (store.setSettings({ ambienceVolume: v }), sound.updateAmbience())} />
      </div>

      <div className="brut-sm bg-lab-red p-3 text-lab-paper">
        <p className="mono-label">DANGER ZONE</p>
        <p className="my-2 text-sm">Erase the entire lab session: timer, XP, achievements, secrets, high scores.</p>
        {confirm ? (
          <div className="flex gap-2">
            <BrutButton
              variant="danger"
              onClick={() => {
                store.reset();
                setConfirm(false);
              }}
            >
              YES, WIPE IT
            </BrutButton>
            <BrutButton onClick={() => setConfirm(false)}>CANCEL</BrutButton>
          </div>
        ) : (
          <BrutButton
            onMouseEnter={() => store.findEgg("reset_flirt")}
            onClick={() => setConfirm(true)}
          >
            RESET PROGRESS
          </BrutButton>
        )}
      </div>
    </div>
  );
}
