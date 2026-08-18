import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { GameId } from "../systems/types";

export const GAME_COMPONENTS: Record<GameId, LazyExoticComponent<ComponentType>> = {
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
};
