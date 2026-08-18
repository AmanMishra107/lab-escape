import type { GameId } from "../systems/types";

export interface GameMeta {
  id: GameId;
  name: string;
  tagline: string;
  difficulty: "easy" | "medium" | "hard";
  category: "arcade" | "logic" | "reflex" | "skill";
  xpMultiplier: number;
  controls: string;
}

export const GAMES: GameMeta[] = [
  {
    id: "snake",
    name: "SNAKE.EXE",
    tagline: "The original lab-hours time thief.",
    difficulty: "easy",
    category: "arcade",
    xpMultiplier: 0.5,
    controls: "Arrows / WASD / swipe",
  },
  {
    id: "minesweeper",
    name: "MINESWEEP.EXE",
    tagline: "Right click is flag. Left click is regret.",
    difficulty: "hard",
    category: "logic",
    xpMultiplier: 0.4,
    controls: "Click / long-press to flag",
  },
  {
    id: "reaction",
    name: "REACTION.EXE",
    tagline: "How fast can you pretend to be awake?",
    difficulty: "easy",
    category: "reflex",
    xpMultiplier: 1,
    controls: "Click / tap / space",
  },
  {
    id: "memory",
    name: "MATRIX.MEM",
    tagline: "Remember the pattern. Forget the syllabus.",
    difficulty: "medium",
    category: "logic",
    xpMultiplier: 1,
    controls: "Click / tap cells",
  },
  {
    id: "typing",
    name: "TYPERACE.EXE",
    tagline: "Type excuses at competitive speed.",
    difficulty: "medium",
    category: "skill",
    xpMultiplier: 0.8,
    controls: "Keyboard",
  },
  {
    id: "tictactoe",
    name: "XOXO.BAT",
    tagline: "Beat the machine. You will not beat the machine.",
    difficulty: "easy",
    category: "logic",
    xpMultiplier: 1,
    controls: "Click / tap",
  },
  {
    id: "aim",
    name: "AIMLAB.SYS",
    tagline: "Click the dot. That's it. That's the game.",
    difficulty: "medium",
    category: "reflex",
    xpMultiplier: 0.7,
    controls: "Mouse / touch",
  },
  {
    id: "flappy",
    name: "FLAPPYLAB.EXE",
    tagline: "A cursor with dreams and no wings.",
    difficulty: "hard",
    category: "arcade",
    xpMultiplier: 3,
    controls: "Space / click / tap",
  },
  {
    id: "runner",
    name: "CAMPUSRUN.EXE",
    tagline: "Outrun attendance itself.",
    difficulty: "medium",
    category: "arcade",
    xpMultiplier: 0.6,
    controls: "Space / tap to jump",
  },
  {
    id: "math",
    name: "QUICKMATH.EXE",
    tagline: "Five seconds. No calculator. Good luck.",
    difficulty: "medium",
    category: "skill",
    xpMultiplier: 1.2,
    controls: "Keyboard / on-screen keys",
  },
];

export const GAME_MAP = new Map(GAMES.map((g) => [g.id, g]));
