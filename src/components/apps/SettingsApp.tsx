import { useState } from "react";
import { store, useLab } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import type { Settings } from "../../systems/types";
import { BrutButton, Tag } from "../ui/brut";

type TabId = "audio" | "display" | "system" | "data";

const TABS: { id: TabId; label: string }[] = [
  { id: "audio", label: "🔊 AUDIO & SFX" },
  { id: "display", label: "🖥️ DISPLAY & RETRO" },
  { id: "system", label: "⚡ SYSTEM & PERF" },
  { id: "data", label: "💾 DATA & BACKUP" },
];

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
      className="brut-sm brut-press flex min-h-11 w-full items-center justify-between bg-card px-3 border-2 border-lab-ink hover:bg-amber-50 transition-colors"
    >
      <span className="mono-label text-stone-900 font-bold">{label}</span>
      <span className={`mono-label border-2 border-lab-ink px-2.5 py-0.5 font-black text-xs ${on ? "bg-lab-green text-white" : "bg-stone-300 text-stone-700"}`}>
        {on ? "ENABLED" : "DISABLED"}
      </span>
    </button>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="brut-sm block bg-card p-3 border-2 border-lab-ink shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <span className="mono-label font-bold text-stone-900">{label}</span>
        <span className="font-mono text-xs font-black text-amber-700">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-lab-red cursor-pointer"
      />
    </label>
  );
}

export function SettingsApp() {
  const s = useLab((st) => st.save.settings);
  const devMode = useLab((st) => st.save.devMode);

  const [activeTab, setActiveTab] = useState<TabId>("audio");
  const [confirmReset, setConfirmReset] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");

  const updateSetting = <K extends keyof Settings>(key: K, val: Settings[K]) => {
    store.setSettings({ [key]: val });
    if (key === "sound" || key === "masterVolume" || key === "ambienceVolume") {
      sound.updateAmbience();
    }
  };

  const handleExportSave = () => {
    sound.play("click");
    const jsonStr = JSON.stringify(store.getSnapshot().save, null, 2);
    void navigator.clipboard.writeText(jsonStr);
    store.toast("system", "SAVE EXPORTED!", "Full save data JSON copied to clipboard!");
  };

  const handleImportSave = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid format");
      localStorage.setItem("labEscape_save_v1", JSON.stringify(parsed));
      sound.play("success");
      store.toast("system", "SAVE IMPORTED!", "Save data successfully updated! Reloading system...");
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      sound.play("error");
      store.toast("warn", "IMPORT ERROR", "Invalid JSON format! Could not restore save file.");
    }
  };

  return (
    <div className="scroll-thin h-full flex flex-col justify-between overflow-y-auto pr-1 font-mono text-xs">
      {/* OS System Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-lab-ink pb-2 mb-3">
        <div>
          <h2 className="font-display text-xl font-black">CONFIG.SYS — SYSTEM SETTINGS</h2>
          <p className="mono-label text-[10px] text-stone-500">
            SYSTEM KERNEL BUILD 25.4.0
          </p>
        </div>
        <Tag tone="green">STATUS: OPERATIONAL</Tag>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-3 border-b border-stone-300 scroll-thin">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sound.play("click");
              setActiveTab(tab.id);
            }}
            className={`brut-sm shrink-0 px-3 py-1.5 font-bold text-xs transition-colors ${
              activeTab === tab.id
                ? "bg-stone-900 text-amber-400 border-2 border-lab-ink"
                : "bg-white text-stone-800 hover:bg-lab-yellow"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: AUDIO & SFX */}
      {activeTab === "audio" && (
        <div className="space-y-3 my-auto">
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle label="Master Sound Output" on={s.sound} onChange={(v) => updateSetting("sound", v)} />
            <Toggle label="Mechanical Typing SFX" on={s.keyboardClicks} onChange={(v) => updateSetting("keyboardClicks", v)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Slider label="Master Volume" value={s.masterVolume} onChange={(v) => updateSetting("masterVolume", v)} />
            <Slider label="SFX Effects" value={s.sfxVolume} onChange={(v) => updateSetting("sfxVolume", v)} />
            <Slider label="Ambience Hum" value={s.ambienceVolume} onChange={(v) => updateSetting("ambienceVolume", v)} />
          </div>
        </div>
      )}

      {/* TAB 2: DISPLAY & RETRO */}
      {activeTab === "display" && (
        <div className="space-y-3 my-auto">
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle label="CRT Scanline Shader" on={s.crt} onChange={(v) => updateSetting("crt", v)} />
            <Toggle label="Custom Pixel Pointer" on={s.customCursor} onChange={(v) => updateSetting("customCursor", v)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* CRT Flicker Mode */}
            <div className="brut-sm bg-card p-3 border-2 border-lab-ink">
              <span className="mono-label font-bold text-stone-900 block mb-1">CRT Phosphor Flicker</span>
              <div className="flex gap-1">
                {(["off", "low", "high"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { sound.play("click"); updateSetting("crtFlicker", mode); }}
                    className={`flex-1 py-1 text-[10px] font-bold border border-lab-ink ${
                      s.crtFlicker === mode ? "bg-stone-900 text-amber-400 font-black" : "bg-white text-black"
                    }`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette Theme */}
            <div className="brut-sm bg-card p-3 border-2 border-lab-ink">
              <span className="mono-label font-bold text-stone-900 block mb-1">Color Palette Theme</span>
              <select
                value={s.colorTheme}
                onChange={(e) => { sound.play("click"); updateSetting("colorTheme", e.target.value as any); }}
                className="w-full bg-white border-2 border-lab-ink p-1 font-bold text-xs text-stone-900 cursor-pointer"
              >
                <option value="classic">🟡 Classic Y2K (Default)</option>
                <option value="green_phosphor">🟢 Green Phosphor Matrix</option>
                <option value="cyber_pink">💗 Cyberpunk Magenta</option>
                <option value="monochrome">⬜ Monochrome GameBoy</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM & PERF */}
      {activeTab === "system" && (
        <div className="space-y-3 my-auto">
          <div className="grid gap-2 sm:grid-cols-3">
            <Toggle label="Reduced Motion" on={s.reducedMotion} onChange={(v) => updateSetting("reducedMotion", v)} />
            <Toggle label="Potato PC Perf Mode" on={s.performanceMode} onChange={(v) => updateSetting("performanceMode", v)} />
            <Toggle label="Show FPS / System Badge" on={s.showFpsCounter} onChange={(v) => updateSetting("showFpsCounter", v)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Auto Save Interval */}
            <div className="brut-sm bg-card p-3 border-2 border-lab-ink">
              <span className="mono-label font-bold text-stone-900 block mb-1">Auto-Save Frequency</span>
              <div className="flex gap-1">
                {([15, 30, 60] as const).map((sec) => (
                  <button
                    key={sec}
                    onClick={() => { sound.play("click"); updateSetting("autoSaveInterval", sec); }}
                    className={`flex-1 py-1 text-[10px] font-bold border border-lab-ink ${
                      s.autoSaveInterval === sec ? "bg-stone-900 text-amber-400 font-black" : "bg-white text-black"
                    }`}
                  >
                    {sec} SECONDS
                  </button>
                ))}
              </div>
            </div>

            {/* Developer Mode */}
            <Toggle label="Developer Cheat Mode" on={devMode} onChange={(v) => store.setDevMode(v)} />
          </div>
        </div>
      )}

      {/* TAB 4: DATA & BACKUP */}
      {activeTab === "data" && (
        <div className="space-y-3 my-auto">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="brut-sm bg-card p-3 border-2 border-lab-ink space-y-2">
              <span className="mono-label font-bold text-stone-900 block">EXPORT SAVE DATA</span>
              <p className="text-xs text-stone-700">Copy your complete JSON save file (scores, XP, achievements, levels) to clipboard.</p>
              <BrutButton variant="go" className="w-full text-xs" onClick={handleExportSave}>
                📋 COPY SAVE TO CLIPBOARD
              </BrutButton>
            </div>

            <div className="brut-sm bg-card p-3 border-2 border-lab-ink space-y-2">
              <span className="mono-label font-bold text-stone-900 block">RESTORE / IMPORT SAVE</span>
              <p className="text-xs text-stone-700">Paste an exported JSON save snippet to restore progress on any device.</p>
              <BrutButton className="w-full text-xs bg-purple-700 text-white" onClick={() => setShowImportModal(true)}>
                📥 IMPORT SAVE SNIPPET
              </BrutButton>
            </div>
          </div>

          {/* Danger Zone: Reset Progress */}
          <div className="brut-sm bg-lab-red p-4 text-white border-3 border-lab-ink shadow-lg">
            <p className="mono-label font-black text-amber-300">⚠️ DANGER ZONE: FACTORY RESET</p>
            <p className="my-1.5 text-xs text-stone-100">Permanently erase the entire lab session: timer, XP, achievements, secrets, and all 25 game high scores.</p>
            {confirmReset ? (
              <div className="flex gap-2 mt-3">
                <BrutButton
                  variant="danger"
                  className="bg-black text-rose-500 font-black border-2 border-white"
                  onClick={() => {
                    store.reset();
                    setConfirmReset(false);
                  }}
                >
                  YES, WIPE ALL DATA
                </BrutButton>
                <BrutButton onClick={() => setConfirmReset(false)}>CANCEL</BrutButton>
              </div>
            ) : (
              <BrutButton
                onMouseEnter={() => store.findEgg("reset_flirt")}
                onClick={() => setConfirmReset(true)}
                className="mt-2 bg-stone-900 text-rose-400 font-bold"
              >
                RESET SYSTEM PROGRESS
              </BrutButton>
            )}
          </div>
        </div>
      )}

      {/* IMPORT SAVE JSON MODAL */}
      {showImportModal && (
        <div className="absolute inset-0 z-40 bg-black/95 text-white p-4 flex flex-col justify-between border-3 border-lab-ink">
          <div>
            <h3 className="font-display text-xl text-amber-400 font-black mb-1">📥 IMPORT SAVE DATA JSON</h3>
            <p className="text-xs text-stone-300 mb-2">Paste your JSON save backup text below to restore your full profile.</p>
            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste Save JSON data here..."
              className="w-full bg-stone-900 border-2 border-amber-400 p-2 font-mono text-xs text-amber-200 rounded"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
            <BrutButton onClick={() => setShowImportModal(false)}>CANCEL</BrutButton>
            <BrutButton variant="go" onClick={handleImportSave}>RESTORE SAVE DATA</BrutButton>
          </div>
        </div>
      )}

      {/* Footer System Status Bar */}
      <div className="border-t-2 border-lab-ink pt-2 flex justify-between items-center text-[10px] text-stone-500">
        <span>CONFIG.SYS STACK v25.4</span>
        <span>AUTO-SAVE: {s.autoSaveInterval}s</span>
      </div>
    </div>
  );
}
