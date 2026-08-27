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
  | "stickynote"
  | "cpu";



export type AppId =
  | "terminal"
  | "games"
  | "phone"
  | "notices"
  | "files"
  | "puzzles"
  | "achievements"
  | "settings";

export type GameId =
  // ⚡ CLASSIC ARCADE & QUICK PLAY (1-15)
  | "snake"
  | "minesweeper"
  | "reaction"
  | "memory"
  | "typing"
  | "tictactoe"
  | "aim"
  | "flappy"
  | "runner"
  | "math"
  | "twentyfortyeight"
  | "wordle"
  | "simon"
  | "sudoku"
  | "whackamole"
  // 🎮 CLASSIC ARCADE & BOARD EXPANSION (16-25)
  | "pacman"
  | "tetris"
  | "pong"
  | "chess"
  | "spaceinvaders"
  | "breakout"
  | "connectfour"
  | "asteroids"
  | "battleship"
  | "ludo"
  // 🏎️ NEW ARCADE EXPANSION
  | "racer"
  | "stack"
  // 🎮 2010s NOSTALGIA PACK
  | "pianotiles"
  | "geodash"
  | "doodlejump";

export interface GameResult {
  gameId: GameId;
  score: number;
  accuracy?: number; // 0..1
  time?: number; // ms played
  completed: boolean;
  won?: boolean;
  difficulty?: "easy" | "normal" | "hard";
  xpEarned: number;
  achievementsUnlocked?: string[];
}

export interface Settings {
  sound: boolean;
  masterVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  keyboardClicks: boolean;
  crt: boolean;
  crtFlicker: "off" | "low" | "high";
  customCursor: boolean;
  reducedMotion: boolean;
  performanceMode: boolean;
  showFpsCounter: boolean;
  colorTheme: "classic" | "green_phosphor" | "cyber_pink" | "monochrome";
  autoSaveInterval: number;
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
