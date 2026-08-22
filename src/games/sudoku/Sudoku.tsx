import { useCallback, useEffect, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

// ─── Sudoku Generator ───────────────────────────────────────────────────────
// Uses a backtracking solver to generate valid puzzles.
// Difficulty levels vary by how many clues are removed.

type Grid9 = number[][];  // 0 = empty

function makeBase(): Grid9 {
  const base: Grid9 = Array.from({ length: 9 }, () => Array(9).fill(0));
  // Fill diagonal 3x3 boxes first (they don't interact)
  for (let b = 0; b < 3; b++) {
    const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++)
        base[b * 3 + r]![b * 3 + c] = nums[r * 3 + c]!;
  }
  return base;
}

function isValid(grid: Grid9, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row]![i] === num) return false;
    if (grid[i]![col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      if (grid[br + r]![bc + c] === num) return false;
  return true;
}

function solve(grid: Grid9): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r]![c] !== 0) continue;
      for (let n = 1; n <= 9; n++) {
        if (isValid(grid, r, c, n)) {
          grid[r]![c] = n;
          if (solve(grid)) return true;
          grid[r]![c] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

function generatePuzzle(difficulty: "easy" | "medium" | "hard"): { puzzle: Grid9; solution: Grid9 } {
  const solution = makeBase();
  solve(solution);
  const puzzle = solution.map((row) => [...row]);
  // Remove cells
  const removals = difficulty === "easy" ? 35 : difficulty === "medium" ? 45 : 52;
  let removed = 0;
  const cells = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
  for (const idx of cells) {
    if (removed >= removals) break;
    const r = Math.floor(idx / 9), c = idx % 9;
    puzzle[r]![c] = 0;
    removed++;
  }
  return { puzzle, solution };
}

// ─── Validation helpers ──────────────────────────────────────────────────────
function isSolvedCorrectly(grid: Grid9, solution: Grid9): boolean {
  return grid.every((row, r) => row.every((v, c) => v === solution[r]![c]));
}

function getConflicts(grid: Grid9): Set<string> {
  const conflicts = new Set<string>();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r]![c];
      if (!v) continue;
      for (let i = 0; i < 9; i++) {
        if (i !== c && grid[r]![i] === v) { conflicts.add(`${r},${c}`); conflicts.add(`${r},${i}`); }
        if (i !== r && grid[i]![c] === v) { conflicts.add(`${r},${c}`); conflicts.add(`${i},${c}`); }
      }
      const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
      for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) {
        const nr = br + dr, nc = bc + dc;
        if ((nr !== r || nc !== c) && grid[nr]![nc] === v) { conflicts.add(`${r},${c}`); conflicts.add(`${nr},${nc}`); }
      }
    }
  }
  return conflicts;
}

type Difficulty = "easy" | "medium" | "hard";

export default function Sudoku() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [puzzle, setPuzzle] = useState<Grid9 | null>(null);
  const [solution, setSolution] = useState<Grid9 | null>(null);
  const [userGrid, setUserGrid] = useState<Grid9 | null>(null);
  const [locked, setLocked] = useState<boolean[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [notes, setNotes] = useState<Set<number>[][]>([]);
  const [noteMode, setNoteMode] = useState(false);
  const [won, setWon] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);

  const startGame = useCallback((diff: Difficulty = difficulty) => {
    const { puzzle: p, solution: s } = generatePuzzle(diff);
    const lock = p.map((row) => row.map((v) => v !== 0));
    setPuzzle(p);
    setSolution(s);
    setUserGrid(p.map((row) => [...row]));
    setLocked(lock);
    setSelected(null);
    setNotes(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>())));
    setNoteMode(false);
    setWon(false);
    setErrors(0);
    setStartTime(Date.now());
    setElapsed(0);
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (!puzzle || won) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [puzzle, won, startTime]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const fillCell = useCallback((num: number) => {
    if (!selected || !userGrid || !solution || !locked) return;
    const [r, c] = selected;
    if (locked[r]![c]) return;

    if (noteMode) {
      setNotes((prev) => {
        const n = prev.map((row) => row.map((s) => new Set(s)));
        const set = n[r]![c]!;
        if (set.has(num)) set.delete(num); else set.add(num);
        return n;
      });
      return;
    }

    const newGrid = userGrid.map((row) => [...row]);
    newGrid[r]![c] = num === newGrid[r]![c] ? 0 : num;

    // Check correctness
    if (num && newGrid[r]![c] !== solution[r]![c]) setErrors((e) => e + 1);

    setUserGrid(newGrid);
    sound.play("click");
    store.interacted();

    if (isSolvedCorrectly(newGrid, solution)) {
      setWon(true);
      sound.play("success");
      const timeBonus = Math.max(0, 600 - elapsed);
      const score = timeBonus + (difficulty === "hard" ? 300 : difficulty === "medium" ? 150 : 80) - errors * 10;
      store.submitGameResult("sudoku", { score: Math.max(10, score), accuracy: 1 - errors / 81, time: elapsed * 1000, completed: true });
    }
  }, [selected, userGrid, solution, locked, noteMode, elapsed, difficulty, errors]);

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selected || !userGrid || won) return;
      if (/^[1-9]$/.test(e.key)) fillCell(parseInt(e.key));
      else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") fillCell(0);
      else if (e.key === "n" || e.key === "N") setNoteMode((m) => !m);
      else if (e.key === "ArrowUp")    setSelected((prev) => prev ? [Math.max(0, prev[0]-1), prev[1]] : prev);
      else if (e.key === "ArrowDown")  setSelected((prev) => prev ? [Math.min(8, prev[0]+1), prev[1]] : prev);
      else if (e.key === "ArrowLeft")  setSelected((prev) => prev ? [prev[0], Math.max(0, prev[1]-1)] : prev);
      else if (e.key === "ArrowRight") setSelected((prev) => prev ? [prev[0], Math.min(8, prev[1]+1)] : prev);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, userGrid, won, fillCell]);

  const conflicts = userGrid ? getConflicts(userGrid) : new Set<string>();

  const cellBg = (r: number, c: number): string => {
    const key = `${r},${c}`;
    if (won) return "#22c55e20";
    if (conflicts.has(key)) return "#ef444430";
    if (selected && selected[0] === r && selected[1] === c) return "#3b82f640";
    if (selected) {
      const [sr, sc] = selected;
      if (sr === r || sc === c || (Math.floor(sr!/3) === Math.floor(r/3) && Math.floor(sc!/3) === Math.floor(c/3)))
        return "#1e40af15";
    }
    return "transparent";
  };

  return (
    <GameShell
      id="sudoku"
      status={
        <>
          <Tag>{formatTime(elapsed)}</Tag>
          <Tag tone="red">ERR {errors}</Tag>
          {won && <Tag tone="green">SOLVED! 🎉</Tag>}
        </>
      }
      toolbar={
        <>
          {(["easy","medium","hard"] as Difficulty[]).map((d) => (
            <BrutButton key={d} variant={difficulty === d ? "primary" : "default"} onClick={() => { setDifficulty(d); startGame(d); }}>
              {d.toUpperCase()}
            </BrutButton>
          ))}
          <BrutButton variant={noteMode ? "warn" : "default"} onClick={() => setNoteMode((m) => !m)}>
            📝 NOTES {noteMode ? "ON" : "OFF"}
          </BrutButton>
          <BrutButton variant="go" onClick={() => startGame()}>NEW GAME</BrutButton>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3">
        {!puzzle ? (
          <div className="text-center space-y-3">
            <p className="font-display text-2xl">SUDOKU</p>
            <p className="mono-label text-sm opacity-70">Fill every row, column and 3×3 box with digits 1–9. No repeats!</p>
            <p className="mono-label text-xs opacity-50">Click a cell to select, then type a number. Press N to toggle note mode.</p>
            <BrutButton variant="go" onClick={() => startGame()}>START</BrutButton>
          </div>
        ) : (
          <>
            {/* 9×9 grid */}
            <div
              className="brut overflow-hidden"
              style={{ display: "grid", gridTemplateColumns: "repeat(9, 2.5rem)", gridTemplateRows: "repeat(9, 2.5rem)", border: "3px solid #1e293b" }}
            >
              {userGrid!.map((row, r) =>
                row.map((val, c) => {
                  const isLocked = locked[r]![c];
                  const noteSet = notes[r]![c]!;
                  const hasConflict = conflicts.has(`${r},${c}`);
                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => !won && setSelected([r, c])}
                      className="flex items-center justify-center relative"
                      style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        background: cellBg(r, c),
                        cursor: isLocked ? "default" : "pointer",
                        borderRight: c % 3 === 2 && c !== 8 ? "2px solid #475569" : "1px solid #334155",
                        borderBottom: r % 3 === 2 && r !== 8 ? "2px solid #475569" : "1px solid #334155",
                        transition: "background 0.15s",
                      }}
                    >
                      {val !== 0 ? (
                        <span
                          className="font-display text-lg font-bold"
                          style={{
                            color: isLocked ? "#f8fafc" : hasConflict ? "#ef4444" : "#60a5fa",
                          }}
                        >
                          {val}
                        </span>
                      ) : noteSet.size > 0 ? (
                        <div className="grid grid-cols-3 w-full h-full p-px">
                          {[1,2,3,4,5,6,7,8,9].map((n) => (
                            <span key={n} className="text-[7px] text-center text-slate-400 leading-none flex items-center justify-center">
                              {noteSet.has(n) ? n : ""}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                }),
              )}
            </div>

            {/* Number pad */}
            <div className="flex gap-1">
              {[1,2,3,4,5,6,7,8,9].map((n) => (
                <BrutButton
                  key={n}
                  onClick={() => fillCell(n)}
                  className="w-10 h-10 text-lg font-display"
                  disabled={won}
                >
                  {n}
                </BrutButton>
              ))}
              <BrutButton onClick={() => fillCell(0)} disabled={won} className="px-2">⌫</BrutButton>
            </div>

            {won && (
              <div className="brut bg-lab-green px-6 py-3 text-center">
                <p className="font-display text-xl text-lab-ink">🎉 PUZZLE SOLVED!</p>
                <p className="mono-label text-sm">Time: {formatTime(elapsed)} · Errors: {errors}</p>
                <BrutButton variant="primary" className="mt-2" onClick={() => startGame()}>NEW PUZZLE</BrutButton>
              </div>
            )}
          </>
        )}
      </div>
    </GameShell>
  );
}
