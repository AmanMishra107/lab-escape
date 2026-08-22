import { useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

type CellState = "EMPTY" | "SHIP" | "HIT" | "MISS";

export default function Battleship() {
  const [mode, setMode] = useState<"bot" | "local">("bot");
  const [phase, setPhase] = useState<"setup" | "play" | "pass">("setup");
  const [turn, setTurn] = useState<1 | 2>(1);

  const [p1Grid, setP1Grid] = useState<CellState[][]>(() => createEmptyGrid());
  const [p2Grid, setP2Grid] = useState<CellState[][]>(() => createEmptyGrid());

  const [p1Hits, setP1Hits] = useState(0);
  const [p2Hits, setP2Hits] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  function createEmptyGrid(): CellState[][] {
    return Array.from({ length: 8 }, () => Array(8).fill("EMPTY"));
  }

  function randomizeShips(): CellState[][] {
    const grid = createEmptyGrid();
    const shipSizes = [4, 3, 3, 2];
    for (const len of shipSizes) {
      let placed = false;
      while (!placed) {
        const horiz = Math.random() > 0.5;
        const r = Math.floor(Math.random() * (horiz ? 8 : 8 - len));
        const c = Math.floor(Math.random() * (horiz ? 8 - len : 8));
        let clear = true;

        for (let i = 0; i < len; i++) {
          if (grid[horiz ? r : r + i]![horiz ? c + i : c] !== "EMPTY") clear = false;
        }

        if (clear) {
          for (let i = 0; i < len; i++) {
            grid[horiz ? r : r + i]![horiz ? c + i : c] = "SHIP";
          }
          placed = true;
        }
      }
    }
    return grid;
  }

  const startMatch = () => {
    sound.play("click");
    setP1Grid(randomizeShips());
    setP2Grid(randomizeShips());
    setPhase("play");
  };

  const handleCellClick = (r: number, c: number) => {
    if (winner || phase !== "play") return;
    store.interacted();

    const targetGrid = turn === 1 ? p2Grid : p1Grid;
    const cell = targetGrid[r]![c];
    if (cell === "HIT" || cell === "MISS") return; // Already targeted

    const newGrid = targetGrid.map((row) => [...row]);
    let newHits = turn === 1 ? p1Hits : p2Hits;

    if (cell === "SHIP") {
      newGrid[r]![c] = "HIT";
      newHits += 1;
      sound.play("pop");
    } else {
      newGrid[r]![c] = "MISS";
      sound.play("key");
    }

    if (turn === 1) {
      setP2Grid(newGrid);
      setP1Hits(newHits);
    } else {
      setP1Grid(newGrid);
      setP2Hits(newHits);
    }

    // Win check (12 total ship segments)
    if (newHits >= 12) {
      const wName = turn === 1 ? "PLAYER 1" : mode === "bot" ? "BOT" : "PLAYER 2";
      setWinner(`${wName} VICTORY! FLEET DESTROYED!`);
      sound.play("success");

      const isP1Win = turn === 1;
      store.submitGameResult("battleship", {
        gameId: "battleship",
        score: isP1Win ? 400 : 80,
        completed: true,
        won: isP1Win,
        xpEarned: isP1Win ? 250 : 70,
        achievementsUnlocked: isP1Win ? ["fleet_commander"] : [],
      });
      return;
    }

    if (mode === "bot") {
      setTimeout(() => executeBotTarget(), 600);
    } else {
      setPhase("pass");
      setTurn(turn === 1 ? 2 : 1);
    }
  };

  const executeBotTarget = () => {
    const valid: [number, number][] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (p1Grid[r]![c] === "EMPTY" || p1Grid[r]![c] === "SHIP") valid.push([r, c]);
      }
    }
    if (!valid.length) return;

    const [r, c] = valid[Math.floor(Math.random() * valid.length)]!;
    const newGrid = p1Grid.map((row) => [...row]);
    let newHits = p2Hits;

    if (newGrid[r]![c] === "SHIP") {
      newGrid[r]![c] = "HIT";
      newHits += 1;
      sound.play("pop");
    } else {
      newGrid[r]![c] = "MISS";
      sound.play("key");
    }

    setP1Grid(newGrid);
    setP2Hits(newHits);

    if (newHits >= 12) {
      setWinner("BOT WINS! FLEET DESTROYED!");
      sound.play("error");
    }
  };

  const resetGame = () => {
    setPhase("setup");
    setTurn(1);
    setP1Hits(0);
    setP2Hits(0);
    setWinner(null);
  };

  return (
    <GameShell id="battleship" status={<Tag tone="red">MODE: {mode.toUpperCase()}</Tag>}>
      <div className="flex h-full w-full flex-col justify-between p-2 font-mono text-xs">
        <div className="brut bg-stone-900 text-white p-2 flex justify-between items-center border-2 border-lab-ink">
          <span>TURN: <b className="text-amber-400">PLAYER {turn}</b></span>
          <div className="flex gap-1">
            <BrutButton className={`text-[9px] py-0.5 ${mode === "bot" ? "bg-amber-400 text-black" : ""}`} onClick={() => { setMode("bot"); resetGame(); }}>🤖 BOT</BrutButton>
            <BrutButton className={`text-[9px] py-0.5 ${mode === "local" ? "bg-sky-400 text-black" : ""}`} onClick={() => { setMode("local"); resetGame(); }}>👥 PASS & PLAY</BrutButton>
          </div>
        </div>

        {phase === "setup" && (
          <div className="my-auto space-y-3 bg-stone-100 p-5 border-3 border-lab-ink rounded text-center">
            <h3 className="font-display text-xl text-stone-900">BATTLESHIP FLEET SETUP</h3>
            <p className="text-xs text-stone-700">Deploy 4 tactical ships (Flagship, Cruiser, Scout, Patrol) across the 8x8 ocean grid.</p>
            <BrutButton variant="go" onClick={startMatch}>
              DEPLOY FLEET & ENGAGE →
            </BrutButton>
          </div>
        )}

        {phase === "pass" && !winner && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 text-white p-4 text-center space-y-4">
            <h3 className="font-display text-3xl text-amber-400">PASS DEVICE TO PLAYER {turn}</h3>
            <p className="text-xs text-stone-300">Keep tactical grid positions strictly confidential!</p>
            <BrutButton variant="go" onClick={() => setPhase("play")}>
              READY TO TARGET →
            </BrutButton>
          </div>
        )}

        {phase === "play" && (
          <div className="my-auto self-center p-2 bg-stone-900 border-3 border-lab-ink rounded shadow-2xl space-y-2 text-center">
            <p className="mono-label text-[10px] text-amber-400">SELECT ENEMY RADAR COORDINATE TO TARGET:</p>
            <div className="grid grid-cols-8 gap-1 w-64 h-64 sm:w-72 sm:h-72">
              { (turn === 1 ? p2Grid : p1Grid).map((row, r) =>
                row.map((cell, c) => (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`flex items-center justify-center font-bold text-xs rounded border border-stone-800 transition-all ${
                      cell === "HIT"
                        ? "bg-rose-600 text-white animate-pulse"
                        : cell === "MISS"
                          ? "bg-sky-700 text-white opacity-60"
                          : "bg-stone-800 hover:bg-amber-400 text-transparent hover:text-black"
                    }`}
                  >
                    {cell === "HIT" ? "💥" : cell === "MISS" ? "🌊" : "🎯"}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {winner && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 text-white p-4 text-center space-y-3">
            <h3 className="font-display text-3xl text-emerald-400">{winner}</h3>
            <BrutButton variant="go" onClick={resetGame}>
              PLAY AGAIN
            </BrutButton>
          </div>
        )}

        <div className="border-t-2 border-lab-ink pt-1 text-[10px] text-center text-stone-600">
          TARGET GRID RADAR OPERATIONAL
        </div>
      </div>
    </GameShell>
  );
}
