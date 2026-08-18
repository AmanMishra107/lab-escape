export type ObjectId =
  | "computer"
  | "phone"
  | "noticeboard"
  | "desk"
  | "drawer"
  | "printer"
  | "clock"
  | "window"
  | "trash"
  | "whiteboard"
  | "backpack";

export type AppId =
  | "terminal"
  | "games"
  | "phone"
  | "notices"
  | "files"
  | "puzzles"
  | "achievements"
  | "inventory"
  | "settings";

export type GameId =
  | "snake"
  | "minesweeper"
  | "reaction"
  | "memory"
  | "typing"
  | "tictactoe"
  | "aim"
  | "flappy"
  | "runner"
  | "math";

export interface GameResult {
  score: number;
  accuracy: number; // 0..1
  time: number; // ms played
  completed: boolean;
}

export interface Settings {
  sound: boolean;
  masterVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  crt: boolean;
  reducedMotion: boolean;
  customCursor: boolean;
  performanceMode: boolean;
}

export interface Stats {
  clicks: number;
  commands: number;
  gamesCompleted: number;
  firstSeenAt: number;
  playMs: number;
}

export interface SaveData {
  version: 1;
  endsAt: number | null;
  durationMs: number;
  xp: number;
  score: number;
  boredom: number;
  achievements: string[];
  eggs: string[];
  puzzles: string[];
  inventory: string[];
  discovered: ObjectId[];
  openedApps: AppId[];
  highScores: Partial<Record<GameId, number>>;
  gamesPlayed: GameId[];
  stats: Stats;
  settings: Settings;
  bootSeen: boolean;
  devMode: boolean;
  escaped: { remainingMs: number; at: number } | null;
}

export type Phase = "normal" | "boredom" | "chaos" | "panic" | "escape" | "over";
