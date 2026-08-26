import { useState, useCallback } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

type CellState = "EMPTY" | "SHIP" | "HIT" | "MISS";

interface ShipDef {
  id: string;
  name: string;
  size: number;
  icon: string;
  hits: number;
}

const FLEET_SHIPS: ShipDef[] = [
  { id: "carrier",    name: "Carrier",    size: 5, icon: "🛳️", hits: 0 },
  { id: "battleship", name: "Battleship", size: 4, icon: "🚢", hits: 0 },
  { id: "cruiser",    name: "Cruiser",    size: 3, icon: "⛴️", hits: 0 },
  { id: "submarine",  name: "Submarine",  size: 3, icon: "🤿", hits: 0 },
  { id: "destroyer",  name: "Destroyer",  size: 2, icon: "🚤", hits: 0 },
];

const TOTAL_SEGMENTS = FLEET_SHIPS.reduce((a, s) => a + s.size, 0); // 17 segments

export default function Battleship() {
  const [mode, setMode] = useState<"bot" | "local">("bot");
  const [turn, setTurn] = useState<1 | 2>(1);
  const [sonarLeft, setSonarLeft] = useState(2);
  const [sonarActive, setSonarActive] = useState(false);

  // Both player grids (8x8)
  const [p1Grid, setP1Grid] = useState<CellState[][]>(() => createEmptyGrid());
  const [p2Grid, setP2Grid] = useState<CellState[][]>(() => createEmptyGrid());

  const [p1Ships, setP1Ships] = useState<ShipDef[]>(() => FLEET_SHIPS.map((s) => ({ ...s })));
  const [p2Ships, setP2Ships] = useState<ShipDef[]>(() => FLEET_SHIPS.map((s) => ({ ...s })));

  const [p1Hits, setP1Hits] = useState(0);
  const [p2Hits, setP2Hits] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>([
    "Fleet deployed. Radar operational. Awaiting strike coordinates.",
  ]);

  function createEmptyGrid(): CellState[][] {
    return Array.from({ length: 8 }, () => Array(8).fill("EMPTY"));
  }

  function generateAutoFleet(): { grid: CellState[][]; ships: ShipDef[] } {
    const grid = createEmptyGrid();
    const ships = FLEET_SHIPS.map((s) => ({ ...s, hits: 0 }));

    for (const ship of ships) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        attempts++;
        const horiz = Math.random() > 0.5;
        const r = Math.floor(Math.random() * (horiz ? 8 : 8 - ship.size));
        const c = Math.floor(Math.random() * (horiz ? 8 - ship.size : 8));
        let clear = true;

        for (let i = 0; i < ship.size; i++) {
          if (grid[horiz ? r : r + i]![horiz ? c + i : c] !== "EMPTY") {
            clear = false;
            break;
          }
        }

        if (clear) {
          for (let i = 0; i < ship.size; i++) {
            grid[horiz ? r : r + i]![horiz ? c + i : c] = "SHIP";
          }
          placed = true;
        }
      }
    }
    return { grid, ships };
  }

  const startNewMatch = useCallback(() => {
    const p1 = generateAutoFleet();
    const p2 = generateAutoFleet();
    setP1Grid(p1.grid);
    setP2Grid(p2.grid);
    setP1Ships(p1.ships);
    setP2Ships(p2.ships);
    setP1Hits(0);
    setP2Hits(0);
    setTurn(1);
    setSonarLeft(2);
    setSonarActive(false);
    setWinner(null);
    setCombatLog(["New engagement initiated. Both fleets at battle stations!"]);
    sound.play("click");
  }, []);

  // Initialize once
  useState(() => {
    startNewMatch();
  });

  const handleRadarClick = (r: number, c: number) => {
    if (winner) return;
    store.interacted();

    const targetGrid = turn === 1 ? p2Grid : p1Grid;
    const targetShips = turn === 1 ? p2Ships : p1Ships;
    const setTargetGrid = turn === 1 ? setP2Grid : setP1Grid;
    const setTargetShips = turn === 1 ? setP2Ships : setP1Ships;

    const cell = targetGrid[r]![c];
    if (cell === "HIT" || cell === "MISS") return; // Already targeted

    // Sonar Recon Ability (reveals 2x2 area)
    if (sonarActive) {
      setSonarActive(false);
      setSonarLeft((s) => Math.max(0, s - 1));
      let foundShips = 0;
      for (let dr = 0; dr < 2; dr++) {
        for (let dc = 0; dc < 2; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr < 8 && nc < 8 && targetGrid[nr]![nc] === "SHIP") foundShips++;
        }
      }
      sound.play("powerup");
      setCombatLog((prev) => [
        `📡 SONAR SCAN at ${String.fromCharCode(65 + c)}${r + 1}: Detected ${foundShips} ship segment(s)!`,
        ...prev.slice(0, 4),
      ]);
      return;
    }

    const nextGrid = targetGrid.map((row) => [...row]);
    const coordName = `${String.fromCharCode(65 + c)}${r + 1}`;
    let newHits = turn === 1 ? p1Hits : p2Hits;

    if (cell === "SHIP") {
      nextGrid[r]![c] = "HIT";
      newHits += 1;
      sound.play("pop");

      // Update random damaged ship for visual HUD
      const updatedShips = targetShips.map((s) => ({ ...s }));
      const unhitShip = updatedShips.find((s) => s.hits < s.size);
      if (unhitShip) unhitShip.hits += 1;
      setTargetShips(updatedShips);

      setCombatLog((prev) => [
        `🎯 DIRECT HIT on enemy vessel at [${coordName}]! 🔥`,
        ...prev.slice(0, 4),
      ]);
    } else {
      nextGrid[r]![c] = "MISS";
      sound.play("key");
      setCombatLog((prev) => [
        `💧 Missile splashed into open water at [${coordName}].`,
        ...prev.slice(0, 4),
      ]);
    }

    setTargetGrid(nextGrid);
    if (turn === 1) setP1Hits(newHits);
    else setP2Hits(newHits);

    // Check Victory
    if (newHits >= TOTAL_SEGMENTS) {
      const winnerName = turn === 1 ? "PLAYER 1" : mode === "bot" ? "BOT" : "PLAYER 2";
      setWinner(`${winnerName} WON! ENEMY ARMADA OBLITERATED! 🏆`);
      sound.play("success");

      const isP1Win = turn === 1;
      store.submitGameResult("battleship", {
        gameId: "battleship",
        score: isP1Win ? 500 : 100,
        completed: true,
        won: isP1Win,
        xpEarned: isP1Win ? 300 : 80,
        achievementsUnlocked: isP1Win ? ["fleet_commander"] : [],
      });
      return;
    }

    if (mode === "bot") {
      setTimeout(() => executeBotTurn(), 500);
    } else {
      setTurn(turn === 1 ? 2 : 1);
    }
  };

  const executeBotTurn = () => {
    const validCells: [number, number][] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (p1Grid[r]![c] === "EMPTY" || p1Grid[r]![c] === "SHIP") {
          validCells.push([r, c]);
        }
      }
    }
    if (!validCells.length) return;

    const [r, c] = validCells[Math.floor(Math.random() * validCells.length)]!;
    const nextP1Grid = p1Grid.map((row) => [...row]);
    const coordName = `${String.fromCharCode(65 + c)}${r + 1}`;
    let newBotHits = p2Hits;

    if (nextP1Grid[r]![c] === "SHIP") {
      nextP1Grid[r]![c] = "HIT";
      newBotHits += 1;
      sound.play("pop");
      setCombatLog((prev) => [
        `⚠️ ENEMY STRIKE: Your ship at [${coordName}] was HIT! 🔥`,
        ...prev.slice(0, 4),
      ]);
    } else {
      nextP1Grid[r]![c] = "MISS";
      sound.play("key");
      setCombatLog((prev) => [
        `🛡️ Enemy torpedo missed your fleet at [${coordName}].`,
        ...prev.slice(0, 4),
      ]);
    }

    setP1Grid(nextP1Grid);
    setP2Hits(newBotHits);

    if (newBotHits >= TOTAL_SEGMENTS) {
      setWinner("ENEMY BOT DESTROYED YOUR FLEET! 💀");
      sound.play("error");
    }
  };

  const enemyGrid = turn === 1 ? p2Grid : p1Grid;
  const friendlyGrid = turn === 1 ? p1Grid : p2Grid;
  const enemyShips = turn === 1 ? p2Ships : p1Ships;

  return (
    <GameShell
      id="battleship"
      status={
        <>
          <Tag tone="red">MODE: {mode.toUpperCase()}</Tag>
          <Tag tone="blue">P1 SCORE: {p1Hits}/{TOTAL_SEGMENTS}</Tag>
          <Tag tone="yellow">ENEMY SCORE: {p2Hits}/{TOTAL_SEGMENTS}</Tag>
        </>
      }
      toolbar={
        <div className="flex gap-1">
          <BrutButton
            className={`text-[10px] py-1 px-2.5 ${sonarActive ? "bg-amber-300 text-black font-bold" : ""}`}
            disabled={sonarLeft <= 0 || !!winner}
            onClick={() => setSonarActive((s) => !s)}
          >
            📡 SONAR SCAN ({sonarLeft})
          </BrutButton>
          <BrutButton variant="go" onClick={startNewMatch} className="text-xs py-1 px-3">
            🔄 NEW BATTLE
          </BrutButton>
        </div>
      }
    >
      <div className="flex h-full w-full flex-col justify-between p-2 font-mono text-xs select-none gap-2">
        
        {/* Top Battle HUD Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-lab-ink bg-stone-900 px-3 py-1.5 text-white shadow-sm rounded">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-400">TURN: {turn === 1 ? "COMMANDER (YOU)" : "ENEMY FLEET"}</span>
            {sonarActive && <span className="animate-pulse font-bold text-amber-300">SELECT 2x2 TARGET AREA</span>}
          </div>

          <div className="flex items-center gap-1">
            <BrutButton
              className={`text-[10px] py-0.5 px-2 ${mode === "bot" ? "bg-amber-400 text-black font-bold" : ""}`}
              onClick={() => { setMode("bot"); startNewMatch(); }}
            >
              🤖 VS BOT
            </BrutButton>
            <BrutButton
              className={`text-[10px] py-0.5 px-2 ${mode === "local" ? "bg-sky-400 text-black font-bold" : ""}`}
              onClick={() => { setMode("local"); startNewMatch(); }}
            >
              👥 2-PLAYER
            </BrutButton>
          </div>
        </div>

        {/* Main Dual Radar Interface */}
        <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-3 md:flex-row">
          
          {/* 1. ENEMY RADAR (Targeting Grid) */}
          <div className="flex flex-col items-center gap-1.5 rounded-lg border-3 border-lab-ink bg-[#0c1427] p-2.5 shadow-xl">
            <div className="flex w-full items-center justify-between px-1 text-[11px]">
              <span className="font-bold text-sky-400">🎯 ENEMY WATERS (ATTACK RADAR)</span>
              <span className="text-[9px] text-stone-400">CLICK TO STRIKE</span>
            </div>

            {/* Radar Coordinates & Grid */}
            <div className="flex flex-col">
              {/* File letters A-H */}
              <div className="flex pl-4 gap-1 text-[8.5px] text-sky-400 font-bold">
                {["A", "B", "C", "D", "E", "F", "G", "H"].map((l) => (
                  <span key={l} className="w-7 sm:w-8 text-center">{l}</span>
                ))}
              </div>

              {/* Grid with Rank Numbers 1-8 */}
              <div className="flex flex-col gap-1">
                {enemyGrid.map((row, r) => (
                  <div key={r} className="flex items-center gap-1">
                    <span className="w-3 text-right text-[8.5px] font-bold text-sky-400">{r + 1}</span>
                    <div className="flex gap-1">
                      {row.map((cell, c) => (
                        <button
                          key={`${r}-${c}`}
                          type="button"
                          disabled={!!winner}
                          onClick={() => handleRadarClick(r, c)}
                          className={`h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-xs text-xs font-bold transition-all border ${
                            cell === "HIT"
                              ? "bg-rose-600/90 border-rose-400 text-white animate-pulse"
                              : cell === "MISS"
                              ? "bg-sky-900/60 border-sky-600/60 text-sky-300"
                              : "bg-[#162238] border-[#203254] hover:bg-amber-400/80 hover:border-amber-400 text-transparent hover:text-black cursor-crosshair"
                          }`}
                        >
                          {cell === "HIT" ? "💥" : cell === "MISS" ? "💧" : "🎯"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. FRIENDLY FLEET OCEAN GRID (My Ships) */}
          <div className="flex flex-col items-center gap-1.5 rounded-lg border-3 border-lab-ink bg-[#0f172a] p-2.5 shadow-xl">
            <div className="flex w-full items-center justify-between px-1 text-[11px]">
              <span className="font-bold text-emerald-400">🛡️ MY FLEET DEPLOYMENT</span>
              <span className="text-[9px] text-stone-400">DEFENSIVE SECTOR</span>
            </div>

            <div className="flex flex-col">
              <div className="flex pl-4 gap-1 text-[8.5px] text-emerald-400 font-bold">
                {["A", "B", "C", "D", "E", "F", "G", "H"].map((l) => (
                  <span key={l} className="w-7 sm:w-8 text-center">{l}</span>
                ))}
              </div>

              <div className="flex flex-col gap-1">
                {friendlyGrid.map((row, r) => (
                  <div key={r} className="flex items-center gap-1">
                    <span className="w-3 text-right text-[8.5px] font-bold text-emerald-400">{r + 1}</span>
                    <div className="flex gap-1">
                      {row.map((cell, c) => (
                        <div
                          key={`${r}-${c}`}
                          className={`h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-xs text-xs font-bold border ${
                            cell === "HIT"
                              ? "bg-rose-700 border-rose-500 text-white animate-pulse"
                              : cell === "SHIP"
                              ? "bg-emerald-800/80 border-emerald-500 text-emerald-200"
                              : cell === "MISS"
                              ? "bg-slate-800 border-slate-700 text-sky-400"
                              : "bg-[#111c33] border-[#1e2d4d]"
                          }`}
                        >
                          {cell === "HIT" ? "🔥" : cell === "SHIP" ? "⚓" : cell === "MISS" ? "💧" : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. FLEET STATUS & COMBAT LOG */}
          <div className="flex flex-col justify-between gap-2 rounded-lg border-2 border-lab-ink bg-card p-2.5 shadow-sm md:w-48 text-[10px]">
            <div>
              <span className="font-bold text-slate-700 block mb-1">ENEMY ARMADA STATUS:</span>
              <div className="space-y-1">
                {enemyShips.map((ship) => {
                  const isSunk = ship.hits >= ship.size;
                  return (
                    <div
                      key={ship.id}
                      className={`flex items-center justify-between border px-1.5 py-0.5 rounded text-[9px] ${
                        isSunk
                          ? "bg-rose-950/20 border-rose-400 text-rose-600 line-through font-bold"
                          : "bg-background border-slate-300 font-medium"
                      }`}
                    >
                      <span className="flex items-center gap-1">{ship.icon} {ship.name}</span>
                      <span className="font-mono font-bold">
                        {isSunk ? "SUNK" : `${ship.hits}/${ship.size}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Combat Telemetry Log */}
            <div>
              <span className="font-bold text-slate-700 block mb-1">TACTICAL LOG:</span>
              <div className="h-20 overflow-y-auto rounded border border-lab-ink/20 bg-stone-900 p-1.5 font-mono text-[8.5px] text-stone-300 space-y-1">
                {combatLog.map((log, i) => (
                  <p key={i} className="leading-tight">{log}</p>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Victory / Defeat Modal */}
        {winner && (
          <div className="brut bg-amber-300 border-2 border-lab-ink px-4 py-2 text-center text-black font-display font-bold text-base shadow-lg animate-bounce">
            🎉 {winner}
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-lab-ink pt-1.5 text-[10px] text-center text-stone-600 flex justify-between">
          <span>NAVAL ARTILLERY SIMULATION · FAIR AI WITH NO CHEATING</span>
          <span>PRESS <b>SONAR SCAN</b> TO REVEAL 2x2 ENEMY SECTORS</span>
        </div>
      </div>
    </GameShell>
  );
}

