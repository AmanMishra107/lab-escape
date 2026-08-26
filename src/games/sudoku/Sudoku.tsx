import { useCallback, useEffect, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

type Grid9 = number[][]; // 0 = empty

function makeBase(): Grid9 {
  const base: Grid9 = Array.from({ length: 9 }, () => Array(9).fill(0));
  // Fill diagonal 3x3 boxes first (they don't interact)
  for (let b = 0; b < 3; b++) {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
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
  const removals = difficulty === "easy" ? 32 : difficulty === "medium" ? 44 : 52;
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
      for (let dr = 0; dr < 3; dr++)
        for (let dc = 0; dc < 3; dc++) {
          const nr = br + dr, nc = bc + dc;
          if ((nr !== r || nc !== c) && grid[nr]![nc] === v) {
            conflicts.add(`${r},${c}`);
            conflicts.add(`${nr},${nc}`);
          }
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

  useEffect(() => {
    startGame();
  }, [startGame]);

  // Timer
  useEffect(() => {
    if (!puzzle || won) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [puzzle, won, startTime]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

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
      sound.play("click");
      return;
    }

    const newGrid = userGrid.map((row) => [...row]);
    newGrid[r]![c] = num === newGrid[r]![c] ? 0 : num;

    // Check correctness
    if (num && newGrid[r]![c] !== solution[r]![c]) {
      setErrors((e) => e + 1);
      sound.play("error");
    } else {
      sound.play("click");
    }

    setUserGrid(newGrid);
    store.interacted();

    if (isSolvedCorrectly(newGrid, solution)) {
      setWon(true);
      sound.play("success");
      const timeBonus = Math.max(0, 600 - elapsed);
      const score = timeBonus + (difficulty === "hard" ? 400 : difficulty === "medium" ? 220 : 120) - errors * 15;
      store.submitGameResult("sudoku", {
        score: Math.max(20, score),
        accuracy: 1 - errors / 81,
        time: elapsed * 1000,
        completed: true,
      });
    }
  }, [selected, userGrid, solution, locked, noteMode, elapsed, difficulty, errors]);

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selected || !userGrid || won) return;
      if (/^[1-9]$/.test(e.key)) fillCell(parseInt(e.key));
      else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") fillCell(0);
      else if (e.key === "n" || e.key === "N") setNoteMode((m) => !m);
      else if (e.key === "ArrowUp")    setSelected((prev) => prev ? [Math.max(0, prev[0] - 1), prev[1]] : prev);
      else if (e.key === "ArrowDown")  setSelected((prev) => prev ? [Math.min(8, prev[0] + 1), prev[1]] : prev);
      else if (e.key === "ArrowLeft")  setSelected((prev) => prev ? [prev[0], Math.max(0, prev[1] - 1)] : prev);
      else if (e.key === "ArrowRight") setSelected((prev) => prev ? [prev[0], Math.min(8, prev[1] + 1)] : prev);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, userGrid, won, fillCell]);

  const conflicts = userGrid ? getConflicts(userGrid) : new Set<string>();

  // Currently selected value
  const selectedVal = selected && userGrid ? userGrid[selected[0]]![selected[1]] : 0;

  const cellBg = (r: number, c: number, val: number): string => {
    const key = `${r},${c}`;
    if (won) return "#dcfce7";
    if (conflicts.has(key)) return "#fee2e2";
    if (selected && selected[0] === r && selected[1] === c) return "#fef08a"; // Active cell yellow
    if (selectedVal && val === selectedVal && val !== 0) return "#bbf7d0"; // Matching numbers light green
    if (selected) {
      const [sr, sc] = selected;
      if (sr === r || sc === c || (Math.floor(sr! / 3) === Math.floor(r / 3) && Math.floor(sc! / 3) === Math.floor(c / 3))) {
        return "#f1f5f9"; // Related row/col/box
      }
    }
    return "#ffffff";
  };

  return (
    <GameShell
      id="sudoku"
      status={
        <>
          <Tag>{formatTime(elapsed)}</Tag>
          <Tag tone={errors > 0 ? "red" : "blue"}>MISTAKES: {errors}</Tag>
          {won && <Tag tone="green">SOLVED! 🏆</Tag>}
        </>
      }
      toolbar={
        <div className="flex gap-1">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <BrutButton
              key={d}
              className={`text-[10px] py-0.5 px-2 ${difficulty === d ? "bg-amber-400 text-black font-bold" : ""}`}
              onClick={() => { setDifficulty(d); startGame(d); }}
            >
              {d.toUpperCase()}
            </BrutButton>
          ))}
          <BrutButton
            className={`text-[10px] py-0.5 px-2 ${noteMode ? "bg-amber-300 text-black font-bold" : ""}`}
            onClick={() => setNoteMode((m) => !m)}
          >
            ✏️ NOTES {noteMode ? "ON" : "OFF"}
          </BrutButton>
          <BrutButton variant="go" className="text-[10px] py-0.5 px-2" onClick={() => startGame()}>
            NEW GAME
          </BrutButton>
        </div>
      }
    >
      <div className="flex h-full w-full flex-col items-center justify-between p-2 font-mono select-none">
        
        {/* Header Notification */}
        <div className="flex w-full max-w-sm items-center justify-between rounded border-2 border-lab-ink bg-stone-900 px-3 py-1.5 text-xs text-white shadow-sm">
          <span className="font-bold text-amber-400">SUDOKU.EXE ({difficulty.toUpperCase()})</span>
          <span className="text-[10px] text-stone-400">SELECT CELL & ENTER 1-9</span>
        </div>

        {/* 9x9 Grid Board */}
        {userGrid && (
          <div
            className="my-auto overflow-hidden rounded-lg shadow-2xl border-4 border-lab-ink bg-white"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(9, 2.2rem)",
              gridTemplateRows: "repeat(9, 2.2rem)",
            }}
          >
            {userGrid.map((row, r) =>
              row.map((val, c) => {
                const isLocked = locked[r]?.[c] ?? false;
                const noteSet = notes[r]?.[c] ?? new Set<number>();
                const hasConflict = conflicts.has(`${r},${c}`);
                const isUserPlaced = !isLocked && val !== 0;

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => !won && setSelected([r, c])}
                    className="relative flex items-center justify-center p-0 transition-colors focus:outline-none"
                    style={{
                      width: "2.2rem",
                      height: "2.2rem",
                      background: cellBg(r, c, val),
                      cursor: "pointer",
                      borderRight: c % 3 === 2 && c !== 8 ? "2.5px solid #0f172a" : "1px solid #cbd5e1",
                      borderBottom: r % 3 === 2 && r !== 8 ? "2.5px solid #0f172a" : "1px solid #cbd5e1",
                    }}
                  >
                    {val !== 0 ? (
                      <span
                        className={`font-display font-black leading-none ${
                          isLocked
                            ? "text-[#0f172a] text-lg font-black" // Solid black for given numbers!
                            : hasConflict
                            ? "text-red-600 text-lg font-black" // Red for error
                            : "text-blue-700 text-lg font-bold" // Royal blue for user inputs!
                        }`}
                      >
                        {val}
                      </span>
                    ) : noteSet.size > 0 ? (
                      <div className="grid grid-cols-3 w-full h-full p-0.5 pointer-events-none">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <span
                            key={n}
                            className="text-[6.5px] font-bold text-center text-slate-500 leading-none flex items-center justify-center"
                          >
                            {noteSet.has(n) ? n : ""}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              }),
            )}
          </div>
        )}

        {/* Number Pad Controls */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 w-full max-w-sm">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => fillCell(n)}
              disabled={won}
              className="brut-sm h-9 w-9 bg-card hover:bg-amber-300 active:scale-95 border-2 border-lab-ink text-sm font-display font-black shadow-xs"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fillCell(0)}
            disabled={won}
            title="Erase cell"
            className="brut-sm h-9 px-3 bg-stone-200 hover:bg-stone-300 active:scale-95 border-2 border-lab-ink text-xs font-bold shadow-xs"
          >
            ⌫ ERASE
          </button>
        </div>

        {won && (
          <div className="brut bg-emerald-400 border-2 border-lab-ink px-4 py-2 text-center text-black shadow-lg">
            <p className="font-display text-lg font-bold">🎉 SUDOKU COMPLETED!</p>
            <p className="text-xs">Time: {formatTime(elapsed)} · Mistakes: {errors}</p>
          </div>
        )}

      </div>
    </GameShell>
  );
}

