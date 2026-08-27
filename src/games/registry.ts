import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { GameId } from "../systems/types";

export const GAME_COMPONENTS: Record<GameId, LazyExoticComponent<ComponentType>> = {
  // ⚡ CLASSIC ARCADE & QUICK PLAY (1-15)
  snake: lazy(() => import("./snake/Snake")),
  minesweeper: lazy(() => import("./minesweeper/Minesweeper")),
  reaction: lazy(() => import("./reaction/Reaction")),
  memory: lazy(() => import("./memory/Memory")),
  typing: lazy(() => import("./typing/Typing")),
  tictactoe: lazy(() => import("./tictactoe/TicTacToe")),
  aim: lazy(() => import("./aim/Aim")),
  flappy: lazy(() => import("./flappy/Flappy")),
  runner: lazy(() => import("./runner/Runner")),
  math: lazy(() => import("./math/QuickMath")),
  twentyfortyeight: lazy(() => import("./twentyfortyeight/TwentyFortyEight")),
  wordle: lazy(() => import("./wordle/Wordle")),
  simon: lazy(() => import("./simon/Simon")),
  sudoku: lazy(() => import("./sudoku/Sudoku")),
  whackamole: lazy(() => import("./whackamole/WhackAMole")),

  // 🎮 CLASSIC ARCADE & BOARD EXPANSION (16-25)
  pacman: lazy(() => import("./pacman/PacMan")),
  tetris: lazy(() => import("./tetris/Tetris")),
  pong: lazy(() => import("./pong/Pong")),
  chess: lazy(() => import("./chess/Chess")),
  spaceinvaders: lazy(() => import("./spaceinvaders/SpaceInvaders")),
  breakout: lazy(() => import("./breakout/Breakout")),
  connectfour: lazy(() => import("./connectfour/ConnectFour")),
  asteroids: lazy(() => import("./asteroids/Asteroids")),
  battleship: lazy(() => import("./battleship/Battleship")),
  ludo: lazy(() => import("./ludo/Ludo")),

  // 🏎️ NEW ARCADE EXPANSION
  racer: lazy(() => import("./racer/Racer")),
  stack: lazy(() => import("./stack/Stack")),

  // 🎹 2010s NOSTALGIA PACK
  pianotiles: lazy(() => import("./pianotiles/PianoTiles")),
  geodash: lazy(() => import("./geodash/GeoDash")),
  doodlejump: lazy(() => import("./doodlejump/DoodleJump")),
};
