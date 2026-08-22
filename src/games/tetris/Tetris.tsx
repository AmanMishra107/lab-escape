import { useEffect, useRef, useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

const SHAPES: Record<string, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
};

const COLORS: Record<string, string> = {
  I: "#06b6d4", O: "#eab308", T: "#a855f7", S: "#10b981", Z: "#ef4444", J: "#3b82f6", L: "#f97316",
};

export default function Tetris() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 300;
    canvas.height = 400;

    const COLS = 10;
    const ROWS = 20;
    const cellW = canvas.width / COLS;
    const cellH = canvas.height / ROWS;

    let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    let curPiece = getRandomPiece();
    let curX = 3, curY = 0;
    let curScore = 0, curLines = 0, curLevel = 1;

    function getRandomPiece() {
      const keys = Object.keys(SHAPES);
      const k = keys[Math.floor(Math.random() * keys.length)]!;
      return { type: k, shape: SHAPES[k]!, color: COLORS[k]! };
    }

    function collide(px: number, py: number, shape: number[][]) {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r]!.length; c++) {
          if (shape[r]![c]) {
            const newX = px + c;
            const newY = py + r;
            if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
            if (newY >= 0 && board[newY]![newX]) return true;
          }
        }
      }
      return false;
    }

    function merge() {
      for (let r = 0; r < curPiece.shape.length; r++) {
        for (let c = 0; c < curPiece.shape[r]!.length; c++) {
          if (curPiece.shape[r]![c]) {
            if (curY + r < 0) {
              setGameOver(true);
              return;
            }
            board[curY + r]![curX + c] = curPiece.color;
          }
        }
      }

      // Check line clears
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r]!.every((cell) => cell !== 0)) {
          board.splice(r, 1);
          board.unshift(Array(COLS).fill(0));
          cleared += 1;
          r++;
        }
      }

      if (cleared > 0) {
        sound.play("success");
        const pts = [0, 100, 300, 500, 800][cleared]! * curLevel;
        curScore += pts;
        curLines += cleared;
        curLevel = Math.floor(curLines / 10) + 1;
        setScore(curScore);
        setLines(curLines);
        setLevel(curLevel);
      }

      // Spawn next
      curPiece = getRandomPiece();
      curX = 3;
      curY = 0;
      if (collide(curX, curY, curPiece.shape)) {
        setGameOver(true);
        store.submitGameResult("tetris", {
          gameId: "tetris",
          score: curScore,
          completed: true,
          xpEarned: Math.round(curScore * 0.5),
          achievementsUnlocked: curLines >= 10 ? ["tetris_god"] : [],
        });
      }
    }

    const interval = setInterval(() => {
      if (collide(curX, curY + 1, curPiece.shape)) {
        merge();
      } else {
        curY += 1;
      }
      render();
    }, Math.max(100, 600 - (curLevel - 1) * 50));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        if (!collide(curX - 1, curY, curPiece.shape)) curX -= 1;
      } else if (e.key === "ArrowRight" || e.key === "d") {
        if (!collide(curX + 1, curY, curPiece.shape)) curX += 1;
      } else if (e.key === "ArrowDown" || e.key === "s") {
        if (!collide(curX, curY + 1, curPiece.shape)) curY += 1;
      } else if (e.key === "ArrowUp" || e.key === "w") {
        // Rotate
        const rotated = curPiece.shape[0]!.map((_, i) =>
          curPiece.shape.map((row) => row[i]!).reverse()
        );
        if (!collide(curX, curY, rotated)) curPiece.shape = rotated;
      } else if (e.key === " ") {
        // Hard drop
        while (!collide(curX, curY + 1, curPiece.shape)) {
          curY += 1;
        }
        merge();
      }
      render();
    };
    window.addEventListener("keydown", onKeyDown);

    function render() {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render fixed board
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (board[r]![c]) {
            ctx.fillStyle = board[r]![c];
            ctx.fillRect(c * cellW, r * cellH, cellW - 1, cellH - 1);
          }
        }
      }

      // Render falling piece
      for (let r = 0; r < curPiece.shape.length; r++) {
        for (let c = 0; c < curPiece.shape[r]!.length; c++) {
          if (curPiece.shape[r]![c]) {
            ctx.fillStyle = curPiece.color;
            ctx.fillRect((curX + c) * cellW, (curY + r) * cellH, cellW - 1, cellH - 1);
          }
        }
      }
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <GameShell id="tetris" status={<Tag tone="purple">LINES: {lines}</Tag>}>
      <div className="flex h-full w-full flex-col justify-between p-2 font-mono text-xs">
        <div className="brut bg-stone-900 text-white p-2 flex justify-between border-2 border-lab-ink">
          <span>SCORE: <b className="text-emerald-400">{score}</b></span>
          <span>LEVEL: <b className="text-amber-400">{level}</b></span>
        </div>

        <div className="relative flex-1 my-1 bg-black border-3 border-lab-ink rounded overflow-hidden flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
          {gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 text-white p-4 text-center space-y-3">
              <h3 className="font-display text-3xl text-rose-500">TETRIS OVER</h3>
              <p className="text-xs text-stone-300">Final Score: {score} | Lines: {lines}</p>
              <BrutButton variant="go" onClick={() => window.location.reload()}>
                REPLAY TETRIS
              </BrutButton>
            </div>
          )}
        </div>

        <div className="border-t-2 border-lab-ink pt-1 text-[10px] text-center text-stone-600">
          CONTROLS: ARROWS (MOVE/ROTATE), SPACE (HARD DROP)
        </div>
      </div>
    </GameShell>
  );
}
