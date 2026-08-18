import { useSyncExternalStore } from "react";
import { ACHIEVEMENT_MAP } from "../data/achievements";
import { EGG_MAP } from "../data/easterEggs";
import { GAME_MAP } from "../data/games";
import { clearSave, defaultSave, DEFAULT_DURATION_MS, loadSave, writeSave } from "./SaveSystem";
import type { AppId, GameId, GameResult, ObjectId, Phase, SaveData, Settings } from "./types";

export interface Toast {
  id: number;
  kind: "achievement" | "system" | "egg" | "warn" | "xp";
  title: string;
  body?: string;
}

export interface Runtime {
  booted: boolean;
  focus: ObjectId | null;
  openApps: AppId[];
  activeApp: AppId | null;
  toasts: Toast[];
  lastInteraction: number;
  professorActive: boolean;
  glitch: number; // 0..1 intensity burst
  doNotClickCount: number;
  now: number;
}

export interface LabState {
  save: SaveData;
  rt: Runtime;
}

export const xpForLevel = (level: number) => Math.round(150 * level + 25 * level * level);

export function levelInfo(xp: number) {
  let level = 1;
  while (level < 50 && xp >= xpForLevel(level)) level++;
  const prev = level === 1 ? 0 : xpForLevel(level - 1);
  const next = xpForLevel(level);
  return { level, prev, next, into: xp - prev, span: next - prev };
}

class LabStore {
  state: LabState = {
    save: defaultSave(),
    rt: {
      booted: false,
      focus: null,
      openApps: [],
      activeApp: null,
      toasts: [],
      lastInteraction: Date.now(),
      professorActive: false,
      glitch: 0,
      doNotClickCount: 0,
      now: Date.now(),
    },
  };
  private listeners = new Set<() => void>();
  private toastSeq = 1;
  private hydrated = false;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.state;

  private emit() {
    this.state = { ...this.state };
    this.listeners.forEach((l) => l());
  }

  hydrate() {
    if (this.hydrated) return;
    this.hydrated = true;
    this.state = { ...this.state, save: loadSave() };
    this.emit();
  }

  private setSave(patch: Partial<SaveData>) {
    this.state.save = { ...this.state.save, ...patch };
    writeSave(this.state.save);
    this.emit();
  }

  setRt(patch: Partial<Runtime>) {
    this.state.rt = { ...this.state.rt, ...patch };
    this.emit();
  }

  /* ---------- toasts ---------- */
  toast(kind: Toast["kind"], title: string, body?: string) {
    const id = this.toastSeq++;
    this.state.rt.toasts = [...this.state.rt.toasts, { id, kind, title, body }].slice(-4);
    this.emit();
    setTimeout(() => this.dismiss(id), kind === "warn" ? 6000 : 4500);
  }
  dismiss(id: number) {
    this.state.rt.toasts = this.state.rt.toasts.filter((t) => t.id !== id);
    this.emit();
  }

  /* ---------- timer ---------- */
  startSession(durationMs = this.state.save.durationMs || DEFAULT_DURATION_MS) {
    this.setSave({ durationMs, endsAt: Date.now() + durationMs, bootSeen: true, escaped: null });
  }
  setDuration(durationMs: number) {
    this.setSave({ durationMs, endsAt: Date.now() + durationMs, escaped: null });
    this.toast("system", "TIME SCALE CHANGED", `${Math.round(durationMs / 1000)}s session armed.`);
  }
  remainingMs() {
    const { endsAt } = this.state.save;
    if (!endsAt) return this.state.save.durationMs;
    return Math.max(0, endsAt - this.state.rt.now);
  }
  phase(): Phase {
    if (this.state.save.escaped) return "over";
    const ratio = this.remainingMs() / (this.state.save.durationMs || 1);
    if (ratio <= 0) return "over";
    if (ratio <= 0.05) return "escape";
    if (ratio <= 0.25) return "panic";
    if (ratio <= 0.5) return "chaos";
    if (ratio <= 0.75) return "boredom";
    return "normal";
  }

  tick(now: number) {
    const prev = this.state.rt.now;
    this.state.rt.now = now;
    const dt = Math.min(2000, now - prev);
    // boredom drifts up while idle
    const idle = now - this.state.rt.lastInteraction;
    const drift = (idle > 8000 ? 0.35 : 0.08) * (dt / 1000);
    const boredom = Math.min(100, this.state.save.boredom + drift);
    this.state.save.boredom = boredom;
    this.state.save.stats.playMs += dt;
    if (this.state.rt.glitch > 0) this.state.rt.glitch = Math.max(0, this.state.rt.glitch - dt / 900);
    this.emit();

    if (idle > 180_000) this.unlock("touch_grass"), this.findEgg("idle_long");
    const ratio = this.remainingMs() / (this.state.save.durationMs || 1);
    if (ratio <= 0.75) this.unlock("procrastinator");
    if (ratio <= 0.5) this.unlock("halfway");
    if (ratio <= 0 && this.state.save.endsAt) this.unlock("escape_artist");
    if (now % 5000 < 60) writeSave(this.state.save);
  }

  interacted() {
    this.state.rt.lastInteraction = Date.now();
    this.state.save.stats.clicks += 1;
    if (this.state.save.stats.clicks === 1) this.unlock("first_click");
    if (this.state.save.stats.clicks >= 100) this.unlock("button_masher");
    this.emit();
  }

  reduceBoredom(amount: number) {
    this.setSave({ boredom: Math.max(0, this.state.save.boredom - amount) });
  }

  /* ---------- progression ---------- */
  addXp(amount: number, reason?: string) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const before = levelInfo(this.state.save.xp).level;
    const xp = Math.round(this.state.save.xp + amount);
    this.setSave({ xp });
    const after = levelInfo(xp).level;
    if (reason) this.toast("xp", `+${Math.round(amount)} XP`, reason);
    if (after > before) this.toast("system", `LEVEL ${String(after).padStart(2, "0")}`, "Lab proficiency increased.");
  }

  addScore(points: number) {
    if (!Number.isFinite(points) || points <= 0) return;
    this.setSave({ score: Math.round(this.state.save.score + points) });
  }

  unlock(id: string) {
    if (this.state.save.achievements.includes(id)) return;
    const a = ACHIEVEMENT_MAP.get(id);
    if (!a) return;
    this.state.save.achievements = [...this.state.save.achievements, id];
    this.setSave({ achievements: this.state.save.achievements, xp: this.state.save.xp + a.xp });
    this.toast("achievement", `ACHIEVEMENT — ${a.name}`, a.description);
    if (this.state.save.achievements.length >= 15) this.findEgg("achievement_hunter");
  }

  findEgg(id: string) {
    if (this.state.save.eggs.includes(id)) return;
    const egg = EGG_MAP.get(id);
    if (!egg) return;
    this.state.save.eggs = [...this.state.save.eggs, id];
    this.setSave({ eggs: this.state.save.eggs, boredom: Math.max(0, this.state.save.boredom - 8) });
    this.addXp(egg.xp, "Easter egg found");
    this.toast("egg", "SECRET FOUND", egg.response);
    this.unlock("archaeologist");
    if (this.state.save.eggs.length >= 10) this.unlock("egg_hunter");
  }

  solvePuzzle(id: string, xp = 200) {
    if (this.state.save.puzzles.includes(id)) return;
    this.setSave({ puzzles: [...this.state.save.puzzles, id] });
    this.addXp(xp, "Puzzle solved");
    this.reduceBoredom(15);
    this.unlock("puzzler");
    if (this.state.save.puzzles.length >= 6) this.unlock("cryptographer");
  }

  giveItem(id: string) {
    if (this.state.save.inventory.includes(id)) return;
    this.setSave({ inventory: [...this.state.save.inventory, id] });
    this.toast("system", "ITEM ACQUIRED", id.replace(/_/g, " ").toUpperCase());
    if (this.state.save.inventory.length >= 5) this.unlock("packrat");
  }

  /* ---------- world ---------- */
  discover(id: ObjectId) {
    if (!this.state.save.discovered.includes(id)) {
      this.setSave({ discovered: [...this.state.save.discovered, id] });
      this.addXp(20, `Discovered ${id}`);
      if (this.state.save.discovered.length >= 6) this.unlock("explorer");
      if (this.state.save.discovered.length >= 11) this.unlock("cartographer");
    }
  }

  focusObject(id: ObjectId | null) {
    if (id) {
      this.discover(id);
      this.interacted();
      this.reduceBoredom(3);
    }
    this.setRt({ focus: id });
  }

  openApp(id: AppId) {
    this.interacted();
    const open = this.state.rt.openApps.includes(id)
      ? this.state.rt.openApps
      : [...this.state.rt.openApps, id];
    this.setRt({ openApps: open, activeApp: id });
    if (!this.state.save.openedApps.includes(id)) {
      this.setSave({ openedApps: [...this.state.save.openedApps, id] });
      if (this.state.save.openedApps.length >= 5) this.unlock("app_opener");
      if (this.state.save.openedApps.length >= 9) {
        this.unlock("all_apps");
        this.findEgg("all_apps");
      }
    }
  }
  closeApp(id: AppId) {
    const open = this.state.rt.openApps.filter((a) => a !== id);
    this.setRt({ openApps: open, activeApp: open[open.length - 1] ?? null });
  }
  focusApp(id: AppId) {
    this.setRt({ activeApp: id });
  }

  glitchBurst(intensity = 1) {
    if (this.state.save.settings.reducedMotion) return;
    this.setRt({ glitch: Math.min(1, intensity) });
  }

  /* ---------- games ---------- */
  submitGameResult(gameId: GameId, result: GameResult) {
    const meta = GAME_MAP.get(gameId);
    const score = Math.max(0, Math.round(result.score || 0));
    const accuracy = Math.min(1, Math.max(0, result.accuracy || 0));
    const mult = meta?.xpMultiplier ?? 1;
    const diffBonus = meta?.difficulty === "hard" ? 60 : meta?.difficulty === "medium" ? 30 : 10;
    const xp = Math.max(5, Math.round(score * mult + accuracy * 40 + (result.completed ? diffBonus : 0)));

    const best = this.state.save.highScores[gameId] ?? 0;
    const highScores = { ...this.state.save.highScores };
    const isRecord = score > best;
    if (isRecord) highScores[gameId] = score;

    const gamesPlayed = this.state.save.gamesPlayed.includes(gameId)
      ? this.state.save.gamesPlayed
      : [...this.state.save.gamesPlayed, gameId];

    this.setSave({
      highScores,
      gamesPlayed,
      stats: { ...this.state.save.stats, gamesCompleted: this.state.save.stats.gamesCompleted + 1 },
    });
    this.addScore(score);
    this.addXp(xp, `${meta?.name ?? gameId} run complete`);
    this.reduceBoredom(10 + Math.min(15, score / 20));
    if (isRecord && best > 0) this.toast("system", "NEW HIGH SCORE", `${meta?.name ?? gameId}: ${score}`);

    if (gamesPlayed.length >= 5) this.unlock("no_life");
    if (gamesPlayed.length >= 10) this.unlock("arcade_complete");
    return { xp, isRecord };
  }

  /* ---------- settings ---------- */
  setSettings(patch: Partial<Settings>) {
    this.setSave({ settings: { ...this.state.save.settings, ...patch } });
  }

  setDevMode(on: boolean) {
    this.setSave({ devMode: on });
    if (on) this.unlock("devmode");
  }

  escapeEarly() {
    if (this.state.save.escaped) return;
    const remainingMs = this.remainingMs();
    this.setSave({ escaped: { remainingMs, at: Date.now() } });
    this.addXp(Math.round(remainingMs / 20000) + 400, "Emergency exit bonus");
    this.unlock("early_exit");
  }

  reset() {
    clearSave();
    this.state = {
      save: defaultSave(),
      rt: { ...this.state.rt, focus: null, openApps: [], activeApp: null, doNotClickCount: 0, booted: false },
    };
    writeSave(this.state.save);
    this.emit();
  }
}

export const store = new LabStore();

const serverSnapshot: LabState = store.getSnapshot();

export function useLab<T>(selector: (s: LabState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getSnapshot()),
    () => selector(serverSnapshot),
  );
}

export function useLabState() {
  return useLab((s) => s);
}
