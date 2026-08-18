import type { SaveData } from "./types";

export const SAVE_KEY = "labEscape_save_v1";
export const DEFAULT_DURATION_MS = 4 * 60 * 60 * 1000;

export function defaultSave(): SaveData {
  return {
    version: 1,
    endsAt: null,
    durationMs: DEFAULT_DURATION_MS,
    xp: 0,
    score: 0,
    boredom: 12,
    achievements: [],
    eggs: [],
    puzzles: [],
    inventory: [],
    discovered: [],
    openedApps: [],
    highScores: {},
    gamesPlayed: [],
    stats: { clicks: 0, commands: 0, gamesCompleted: 0, firstSeenAt: Date.now(), playMs: 0 },
    settings: {
      sound: true,
      masterVolume: 0.7,
      sfxVolume: 0.8,
      ambienceVolume: 0.35,
      crt: true,
      reducedMotion: false,
      customCursor: true,
      performanceMode: false,
    },
    bootSeen: false,
    devMode: false,
    escaped: null,
  };
}

export function loadSave(): SaveData {
  if (typeof window === "undefined") return defaultSave();
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (!parsed || typeof parsed !== "object" || parsed.version !== 1) return defaultSave();
    const base = defaultSave();
    return {
      ...base,
      ...parsed,
      stats: { ...base.stats, ...(parsed.stats ?? {}) },
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      highScores: { ...(parsed.highScores ?? {}) },
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      eggs: Array.isArray(parsed.eggs) ? parsed.eggs : [],
      puzzles: Array.isArray(parsed.puzzles) ? parsed.puzzles : [],
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      discovered: Array.isArray(parsed.discovered) ? parsed.discovered : [],
      openedApps: Array.isArray(parsed.openedApps) ? parsed.openedApps : [],
      gamesPlayed: Array.isArray(parsed.gamesPlayed) ? parsed.gamesPlayed : [],
    };
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* storage full or blocked — gameplay continues in memory */
  }
}

export function clearSave() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}
