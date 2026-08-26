import { store } from "./GameState";

type Tone = "click" | "hover" | "open" | "close" | "error" | "success" | "key" | "alert" | "pop" | "glitch" | "powerup" | "warn";

class SoundSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: { osc: OscillatorNode; gain: GainNode } | null = null;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const settings = store.getSnapshot().save.settings;
    if (!settings.sound) return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    if (this.master) this.master.gain.value = settings.masterVolume;
    return this.ctx;
  }

  play(tone: Tone) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const settings = store.getSnapshot().save.settings;
    if (tone === "key" && !settings.keyboardClicks) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.master);

    const presets: Record<Tone, { type: OscillatorType; f: number; f2?: number; dur: number; vol: number }> = {
      click: { type: "square", f: 420, f2: 260, dur: 0.05, vol: 0.16 },
      hover: { type: "sine", f: 720, dur: 0.035, vol: 0.05 },
      open: { type: "square", f: 220, f2: 660, dur: 0.16, vol: 0.14 },
      close: { type: "square", f: 620, f2: 180, dur: 0.14, vol: 0.12 },
      error: { type: "sawtooth", f: 150, f2: 90, dur: 0.28, vol: 0.18 },
      success: { type: "triangle", f: 520, f2: 1040, dur: 0.22, vol: 0.16 },
      key: { type: "square", f: 1100, dur: 0.02, vol: 0.05 },
      alert: { type: "sawtooth", f: 880, f2: 440, dur: 0.35, vol: 0.2 },
      pop: { type: "sine", f: 300, f2: 900, dur: 0.09, vol: 0.14 },
      glitch: { type: "sawtooth", f: 60, f2: 1200, dur: 0.3, vol: 0.15 },
      powerup: { type: "triangle", f: 330, f2: 880, dur: 0.2, vol: 0.18 },
      warn: { type: "sawtooth", f: 440, f2: 220, dur: 0.22, vol: 0.18 },
    };
    const p = presets[tone] ?? presets.click;
    osc.type = p.type;
    osc.frequency.setValueAtTime(p.f, t);
    if (p.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(30, p.f2), t + p.dur);
    const vol = p.vol * settings.sfxVolume;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + p.dur);
    osc.start(t);
    osc.stop(t + p.dur + 0.02);
  }

  startAmbience() {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.ambience) return;
    const settings = store.getSnapshot().save.settings;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 220;
    osc.type = "sawtooth";
    osc.frequency.value = 58;
    gain.gain.value = 0.03 * settings.ambienceVolume;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start();
    this.ambience = { osc, gain };
  }

  updateAmbience() {
    const settings = store.getSnapshot().save.settings;
    if (!settings.sound) return this.stopAmbience();
    if (this.ambience) this.ambience.gain.gain.value = 0.03 * settings.ambienceVolume;
    if (this.master) this.master.gain.value = settings.masterVolume;
  }

  stopAmbience() {
    if (!this.ambience) return;
    try {
      this.ambience.osc.stop();
    } catch {
      /* already stopped */
    }
    this.ambience = null;
  }
}

export const sound = new SoundSystem();
