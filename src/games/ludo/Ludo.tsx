import { useEffect, useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

export type PlayerColor = "RED" | "GREEN" | "YELLOW" | "BLUE";

export interface LudoToken {
  id: number;
  playerIdx: number; // 0=RED, 1=GREEN, 2=YELLOW, 3=BLUE
  pos: number; // 0 = Base, 1..51 = Circuit, 52..56 = Home Stretch, 57 = Finished
}

interface PlayerMeta {
  color: PlayerColor;
  name: string;
  bgHex: string;
  borderHex: string;
  tokenEmoji: string;
  startOffset: number;
  baseCoords: { r: number; c: number }[];
  startCell: { r: number; c: number };
  startArrow: string;
  homeStretch: { r: number; c: number }[];
  homeGoalCell: { r: number; c: number };
}

const PLAYER_METAS: PlayerMeta[] = [
  {
    color: "RED",
    name: "Red (P1)",
    bgHex: "#ef4444",
    borderHex: "#dc2626",
    tokenEmoji: "🔴",
    startOffset: 0,
    baseCoords: [{ r: 11, c: 2 }, { r: 11, c: 3 }, { r: 12, c: 2 }, { r: 12, c: 3 }],
    startCell: { r: 13, c: 6 },
    startArrow: "↑",
    homeStretch: [{ r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }],
    homeGoalCell: { r: 8, c: 7 },
  },
  {
    color: "GREEN",
    name: "Green (P2)",
    bgHex: "#10b981",
    borderHex: "#059669",
    tokenEmoji: "🟢",
    startOffset: 13,
    baseCoords: [{ r: 2, c: 2 }, { r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 3 }],
    startCell: { r: 6, c: 1 },
    startArrow: "→",
    homeStretch: [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }],
    homeGoalCell: { r: 7, c: 6 },
  },
  {
    color: "YELLOW",
    name: "Yellow (P3)",
    bgHex: "#eab308",
    borderHex: "#d97706",
    tokenEmoji: "🟡",
    startOffset: 26,
    baseCoords: [{ r: 2, c: 11 }, { r: 2, c: 12 }, { r: 3, c: 11 }, { r: 3, c: 12 }],
    startCell: { r: 1, c: 8 },
    startArrow: "↓",
    homeStretch: [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }],
    homeGoalCell: { r: 6, c: 7 },
  },
  {
    color: "BLUE",
    name: "Blue (P4)",
    bgHex: "#0284c7",
    borderHex: "#0369a1",
    tokenEmoji: "🔵",
    startOffset: 39,
    baseCoords: [{ r: 11, c: 11 }, { r: 11, c: 12 }, { r: 12, c: 11 }, { r: 12, c: 12 }],
    startCell: { r: 8, c: 13 },
    startArrow: "←",
    homeStretch: [{ r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }],
    homeGoalCell: { r: 7, c: 8 },
  },
];

// 52-cell main circuit path
const MAIN_CIRCUIT_PATH: { r: number; c: number }[] = [
  { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
  { r: 7, c: 0 }, { r: 6, c: 0 },
  { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
  { r: 0, c: 7 }, { r: 0, c: 8 },
  { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
  { r: 7, c: 14 }, { r: 8, c: 14 },
  { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
  { r: 14, c: 7 }, { r: 14, c: 6 }
];

const SAFE_STAR_COORDS = [
  { r: 13, c: 6 }, { r: 8, c: 2 }, { r: 6, c: 1 }, { r: 2, c: 6 },
  { r: 1, c: 8 }, { r: 6, c: 12 }, { r: 8, c: 13 }, { r: 12, c: 8 },
];

export default function Ludo() {
  const [numPlayers, setNumPlayers] = useState<2 | 3 | 4>(2);
  const [playerBots, setPlayerBots] = useState<boolean[]>([false, true, true, true]);

  const [turnIdx, setTurnIdx] = useState(0);
  const [dice, setDice] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [sixCount, setSixCount] = useState(0);
  const [turnMessage, setTurnMessage] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const [tokens, setTokens] = useState<LudoToken[]>(() => [
    { id: 0, playerIdx: 0, pos: 0 }, { id: 1, playerIdx: 0, pos: 0 }, { id: 2, playerIdx: 0, pos: 0 }, { id: 3, playerIdx: 0, pos: 0 },
    { id: 4, playerIdx: 1, pos: 0 }, { id: 5, playerIdx: 1, pos: 0 }, { id: 6, playerIdx: 1, pos: 0 }, { id: 7, playerIdx: 1, pos: 0 },
    { id: 8, playerIdx: 2, pos: 0 }, { id: 9, playerIdx: 2, pos: 0 }, { id: 10, playerIdx: 2, pos: 0 }, { id: 11, playerIdx: 2, pos: 0 },
    { id: 12, playerIdx: 3, pos: 0 }, { id: 13, playerIdx: 3, pos: 0 }, { id: 14, playerIdx: 3, pos: 0 }, { id: 15, playerIdx: 3, pos: 0 },
  ]);

  const activePlayers = numPlayers === 2 ? [0, 2] : numPlayers === 3 ? [0, 1, 2] : [0, 1, 2, 3];
  const curPlayerIdx = activePlayers[turnIdx % activePlayers.length]!;
  const curMeta = PLAYER_METAS[curPlayerIdx]!;
  const isCurrentPlayerBot = playerBots[curPlayerIdx]!;

  const togglePlayerBot = (pIdx: number) => {
    const updated = [...playerBots];
    updated[pIdx] = !updated[pIdx];
    setPlayerBots(updated);
    store.toast("system", "PLAYER TOGGLED", `${PLAYER_METAS[pIdx]!.name} set to ${updated[pIdx] ? "🤖 BOT" : "👤 YOU"}`);
  };

  // -------------------------------------------------------------
  // AUTOMATED BOT GAME ENGINE (USE-EFFECT DRIVEN)
  // -------------------------------------------------------------
  useEffect(() => {
    if (winner || isRolling || !isCurrentPlayerBot) return;

    if (dice === null) {
      // 1. Bot rolls dice
      const timer = setTimeout(() => {
        rollDice();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // 2. Bot makes move
      const timer = setTimeout(() => {
        executeBotTurn(dice);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [turnIdx, dice, isRolling, winner, isCurrentPlayerBot, tokens]);

  const rollDice = () => {
    if (winner || dice !== null || isRolling) return;
    sound.play("key");
    store.interacted();
    setIsRolling(true);
    setTurnMessage(null);

    setTimeout(() => {
      const val = Math.floor(Math.random() * 6) + 1;
      setDice(val);
      setIsRolling(false);

      if (val === 6) {
        const nextSix = sixCount + 1;
        setSixCount(nextSix);
        if (nextSix >= 3) {
          sound.play("error");
          setTurnMessage("3 CONSECUTIVE SIXES! TURN FORFEITED.");
          setSixCount(0);
          setTimeout(() => {
            setDice(null);
            setTurnMessage(null);
            nextTurn();
          }, 1200);
          return;
        }
      } else {
        setSixCount(0);
      }

      // Check valid moves
      const playerTokens = tokens.filter((t) => t.playerIdx === curPlayerIdx);
      const canMove = playerTokens.some((t) => isValidMove(t, val));

      if (!canMove && val !== 6) {
        setTurnMessage("NO MOVES AVAILABLE! (NEED A 6 TO LEAVE BASE)");
        setTimeout(() => {
          setDice(null);
          setTurnMessage(null);
          nextTurn();
        }, 1200);
      } else if (!isCurrentPlayerBot) {
        setTurnMessage("TAP GLOWING TOKEN TO MOVE!");
      }
    }, 300);
  };

  const isValidMove = (token: LudoToken, rollVal: number): boolean => {
    if (token.pos === 57) return false;
    if (token.pos === 0) return rollVal === 6;
    return token.pos + rollVal <= 57;
  };

  const moveToken = (tokenId: number) => {
    if (dice === null || winner || isRolling) return;

    const targetToken = tokens.find((t) => t.id === tokenId);
    if (!targetToken || targetToken.playerIdx !== curPlayerIdx) return;
    if (!isValidMove(targetToken, dice)) return;

    sound.play("pop");
    setTurnMessage(null);

    let nextPos = targetToken.pos;
    if (targetToken.pos === 0) {
      if (dice === 6) nextPos = 1;
      else return;
    } else {
      nextPos = targetToken.pos + dice;
    }

    // Check for Capture
    let capturedOpponent = false;
    const targetCoord = getTokenCoordinates({ ...targetToken, pos: nextPos });

    if (nextPos >= 1 && nextPos <= 51 && targetCoord && !isSafeCell(targetCoord.r, targetCoord.c)) {
      tokens.forEach((other) => {
        if (other.playerIdx !== curPlayerIdx && other.pos >= 1 && other.pos <= 51) {
          const otherCoord = getTokenCoordinates(other);
          if (otherCoord && otherCoord.r === targetCoord.r && otherCoord.c === targetCoord.c) {
            other.pos = 0;
            capturedOpponent = true;
          }
        }
      });
    }

    if (capturedOpponent) {
      sound.play("pop");
      store.toast("system", "TOKEN CAPTURED!", `${curMeta.color} captured an opponent token! Extra turn!`);
    }

    const updatedTokens = tokens.map((t) => (t.id === tokenId ? { ...t, pos: nextPos } : t));
    setTokens(updatedTokens);

    // Check Win
    const playerFinished = updatedTokens.filter((t) => t.playerIdx === curPlayerIdx && t.pos === 57);
    if (playerFinished.length === 4) {
      setWinner(`${curMeta.name.toUpperCase()} WINS LUDO!`);
      sound.play("success");

      const isP1Win = curPlayerIdx === 0;
      store.submitGameResult("ludo", {
        gameId: "ludo",
        score: isP1Win ? 600 : 100,
        completed: true,
        won: isP1Win,
        xpEarned: isP1Win ? 350 : 80,
        achievementsUnlocked: isP1Win ? ["ludo_king", "home_sweet_home"] : [],
      });
      return;
    }

    // Extra turn if 6 or capture
    if (dice === 6 || capturedOpponent) {
      setDice(null);
      setTurnMessage("EXTRA ROLL GRANTED!");
    } else {
      setDice(null);
      nextTurn();
    }
  };

  // SMART BOT AI HEURISTICS ("REAL USER STRATEGY")
  const executeBotTurn = (rollVal: number) => {
    const validTokens = tokens.filter((t) => t.playerIdx === curPlayerIdx && isValidMove(t, rollVal));
    if (validTokens.length === 0) {
      setDice(null);
      nextTurn();
      return;
    }

    // Heuristic 1: Prioritize Capturing Opponent
    for (const token of validTokens) {
      const nextPos = token.pos === 0 ? 1 : token.pos + rollVal;
      const targetCoord = getTokenCoordinates({ ...token, pos: nextPos });
      if (nextPos >= 1 && nextPos <= 51 && targetCoord && !isSafeCell(targetCoord.r, targetCoord.c)) {
        const canCapture = tokens.some((other) => {
          if (other.playerIdx !== curPlayerIdx && other.pos >= 1 && other.pos <= 51) {
            const oCoord = getTokenCoordinates(other);
            return oCoord && oCoord.r === targetCoord.r && oCoord.c === targetCoord.c;
          }
          return false;
        });
        if (canCapture) {
          moveToken(token.id);
          return;
        }
      }
    }

    // Heuristic 2: Prioritize Finishing in Home (Step 57)
    const finishingToken = validTokens.find((t) => t.pos + rollVal === 57);
    if (finishingToken) {
      moveToken(finishingToken.id);
      return;
    }

    // Heuristic 3: Prioritize Releasing Base Token on 6
    if (rollVal === 6) {
      const baseToken = validTokens.find((t) => t.pos === 0);
      if (baseToken) {
        moveToken(baseToken.id);
        return;
      }
    }

    // Heuristic 4: Move Token Furthest Along the Track
    const furthestToken = [...validTokens].sort((a, b) => b.pos - a.pos)[0]!;
    moveToken(furthestToken.id);
  };

  const nextTurn = () => {
    const nextIdx = (turnIdx + 1) % activePlayers.length;
    setTurnIdx(nextIdx);
  };

  const isSafeCell = (r: number, c: number) => {
    return SAFE_STAR_COORDS.some((s) => s.r === r && s.c === c);
  };

  function getTokenCoordinates(token: LudoToken): { r: number; c: number } | null {
    const meta = PLAYER_METAS[token.playerIdx]!;
    if (token.pos === 0) {
      const slotIdx = token.id % 4;
      return meta.baseCoords[slotIdx]!;
    }
    if (token.pos >= 57) {
      return { r: 7, c: 7 };
    }
    if (token.pos >= 52) {
      const stretchIdx = token.pos - 52;
      return meta.homeStretch[stretchIdx]!;
    }
    const circuitIdx = (meta.startOffset + (token.pos - 1)) % 52;
    return MAIN_CIRCUIT_PATH[circuitIdx]!;
  }

  const resetGame = () => {
    setDice(null);
    setIsRolling(false);
    setSixCount(0);
    setTurnIdx(0);
    setTurnMessage(null);
    setWinner(null);
    setTokens([
      { id: 0, playerIdx: 0, pos: 0 }, { id: 1, playerIdx: 0, pos: 0 }, { id: 2, playerIdx: 0, pos: 0 }, { id: 3, playerIdx: 0, pos: 0 },
      { id: 4, playerIdx: 1, pos: 0 }, { id: 5, playerIdx: 1, pos: 0 }, { id: 6, playerIdx: 1, pos: 0 }, { id: 7, playerIdx: 1, pos: 0 },
      { id: 8, playerIdx: 2, pos: 0 }, { id: 9, playerIdx: 2, pos: 0 }, { id: 10, playerIdx: 2, pos: 0 }, { id: 11, playerIdx: 2, pos: 0 },
      { id: 12, playerIdx: 3, pos: 0 }, { id: 13, playerIdx: 3, pos: 0 }, { id: 14, playerIdx: 3, pos: 0 }, { id: 15, playerIdx: 3, pos: 0 },
    ]);
  };

  const renderCellContent = (r: number, c: number) => {
    if (r <= 5 && c <= 5) return null;
    if (r <= 5 && c >= 9) return null;
    if (r >= 9 && c <= 5) return null;
    if (r >= 9 && c >= 9) return null;
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return null;

    for (const m of PLAYER_METAS) {
      if (m.startCell.r === r && m.startCell.c === c) {
        return (
          <div className="w-full h-full flex items-center justify-center font-bold text-white text-[10px] sm:text-xs select-none" style={{ backgroundColor: m.bgHex }}>
            {m.startArrow}
          </div>
        );
      }
      for (const h of m.homeStretch) {
        if (h.r === r && h.c === c) {
          return <div className="w-full h-full opacity-80" style={{ backgroundColor: m.bgHex }} />;
        }
      }
    }

    if (isSafeCell(r, c)) {
      return <span className="text-amber-500 text-[10px] sm:text-xs font-black select-none">⭐</span>;
    }

    return null;
  };

  return (
    <GameShell id="ludo" status={<Tag tone="yellow">TURN: {curMeta.name.toUpperCase()}</Tag>}>
      <div className="flex h-full w-full min-h-0 flex-col justify-between p-1.5 font-mono text-xs">
        {/* Header HUD & Per-Player Human/Bot Toggles */}
        <div className="brut bg-stone-900 text-white p-2 flex flex-wrap justify-between items-center border-2 border-lab-ink gap-1.5 shrink-0">
          
          {/* Active Players Status & Human/Bot Toggles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-amber-400 text-xs">PLAYERS:</span>
            {activePlayers.map((pIdx) => {
              const meta = PLAYER_METAS[pIdx]!;
              const isBot = playerBots[pIdx]!;
              const isTurn = pIdx === curPlayerIdx;
              return (
                <button
                  key={pIdx}
                  onClick={() => togglePlayerBot(pIdx)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center gap-1 ${
                    isTurn ? "ring-2 ring-amber-400 scale-105" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: meta.bgHex, color: "#fff" }}
                  title="Click to toggle Human / Bot"
                >
                  <span>{meta.tokenEmoji}</span>
                  <span>{meta.name}</span>
                  <span className="bg-black/40 px-1 rounded text-[9px]">
                    {isBot ? "🤖 BOT" : "👤 YOU"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            {/* Player Count Selector */}
            <div className="flex items-center bg-stone-800 p-0.5 rounded border border-stone-700">
              {([2, 3, 4] as (2 | 3 | 4)[]).map((count) => (
                <button
                  key={count}
                  onClick={() => { setNumPlayers(count); resetGame(); }}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded ${numPlayers === count ? "bg-amber-400 text-black" : "text-stone-300 hover:text-white"}`}
                >
                  {count}P
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowRules(!showRules)}
              className="px-2 py-1 text-[9px] font-bold border border-purple-400 bg-purple-900 text-purple-200 hover:bg-purple-800 rounded shadow"
            >
              📜 RULES
            </button>
          </div>
        </div>

        {/* Rules Modal */}
        {showRules && (
          <div className="absolute inset-0 z-40 bg-black/95 text-white p-4 overflow-y-auto space-y-2 text-left border-3 border-lab-ink">
            <h3 className="font-display text-2xl text-amber-400 font-black">📜 OFFICIAL LUDO RULES</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-300">
              <li><b>4 Tokens</b> per player starting in their colored Base quadrant.</li>
              <li>Must roll a <b>6</b> on the dice to release a token from Base onto the start cell.</li>
              <li>Rolling a <b>6</b> grants an extra dice roll.</li>
              <li><b>3 Consecutive Sixes</b> forfeits your turn immediately.</li>
              <li>Landing on a non-safe cell occupied by an opponent <b>captures</b> their token and sends it back to Base!</li>
              <li><b>⭐ Star Cells</b> are safe zones where tokens cannot be captured.</li>
              <li>An <b>exact roll</b> is required to enter the final center Home goal.</li>
              <li>Click any player tag in the header to toggle between <b>👤 YOU</b> and <b>🤖 BOT</b>!</li>
            </ul>
            <BrutButton variant="go" className="mt-3" onClick={() => setShowRules(false)}>CLOSE RULES</BrutButton>
          </div>
        )}

        {/* BOARD STAGE WRAPPER */}
        <div className="min-h-0 flex-1 flex flex-col items-center justify-center p-1 overflow-hidden my-auto relative">
          
          {/* Action Message Ticker Overlay */}
          {turnMessage && (
            <div className="absolute top-2 z-30 bg-stone-900 text-amber-300 border-2 border-lab-ink px-3 py-1 text-[10px] sm:text-xs font-bold rounded shadow-lg animate-pulse">
              {turnMessage}
            </div>
          )}

          <div className="relative h-full max-h-full aspect-square max-w-full bg-[#e6d5b8] border-4 border-lab-ink rounded-xl shadow-2xl overflow-hidden p-2">
            <div className="relative w-full h-full bg-[#f7eedc] border-2 border-stone-800 shadow-inner">
              
              {/* 15x15 CELL TRACK GRID BACKGROUND */}
              <div className="absolute inset-0 grid grid-cols-15 grid-rows-15">
                {Array.from({ length: 225 }, (_, idx) => {
                  const r = Math.floor(idx / 15);
                  const c = idx % 15;
                  return (
                    <div key={idx} className="border border-stone-300/60 flex items-center justify-center relative overflow-hidden">
                      {renderCellContent(r, c)}
                    </div>
                  );
                })}
              </div>

              {/* GREEN BASE */}
              <div className="absolute left-0 top-0 w-[40%] h-[40%] bg-[#10b981] border-2 border-stone-900 p-2.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full bg-[#ecfdf5] border-2 border-stone-900 rounded-full p-1.5 grid grid-cols-2 grid-rows-2 gap-1.5 shadow-inner">
                  {PLAYER_METAS[1].baseCoords.map((_, i) => (
                    <div key={i} className="bg-white border-2 border-[#10b981] rounded-full shadow" />
                  ))}
                </div>
              </div>

              {/* YELLOW BASE */}
              <div className="absolute left-[60%] top-0 w-[40%] h-[40%] bg-[#eab308] border-2 border-stone-900 p-2.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full bg-[#fefce8] border-2 border-stone-900 rounded-full p-1.5 grid grid-cols-2 grid-rows-2 gap-1.5 shadow-inner">
                  {PLAYER_METAS[2].baseCoords.map((_, i) => (
                    <div key={i} className="bg-white border-2 border-[#eab308] rounded-full shadow" />
                  ))}
                </div>
              </div>

              {/* RED BASE */}
              <div className="absolute left-0 top-[60%] w-[40%] h-[40%] bg-[#ef4444] border-2 border-stone-900 p-2.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full bg-[#fef2f2] border-2 border-stone-900 rounded-full p-2 grid grid-cols-2 grid-rows-2 gap-1.5 shadow-inner">
                  {PLAYER_METAS[0].baseCoords.map((_, i) => (
                    <div key={i} className="bg-white border-2 border-[#ef4444] rounded-full shadow" />
                  ))}
                </div>
              </div>

              {/* BLUE BASE */}
              <div className="absolute left-[60%] top-[60%] w-[40%] h-[40%] bg-[#0284c7] border-2 border-stone-900 p-2.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full bg-[#f0f9ff] border-2 border-stone-900 rounded-full p-2 grid grid-cols-2 grid-rows-2 gap-1.5 shadow-inner">
                  {PLAYER_METAS[3].baseCoords.map((_, i) => (
                    <div key={i} className="bg-white border-2 border-[#0284c7] rounded-full shadow" />
                  ))}
                </div>
              </div>

              {/* CENTER HOME TRIANGLES */}
              <div className="absolute left-[40%] top-[40%] w-[20%] h-[20%] border-2 border-stone-900 bg-stone-900 overflow-hidden shadow-lg">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon points="0,0 100,0 50,50" fill="#eab308" stroke="#000" strokeWidth="2" />
                  <polygon points="0,0 0,100 50,50" fill="#10b981" stroke="#000" strokeWidth="2" />
                  <polygon points="0,100 100,100 50,50" fill="#ef4444" stroke="#000" strokeWidth="2" />
                  <polygon points="100,0 100,100 50,50" fill="#0284c7" stroke="#000" strokeWidth="2" />
                </svg>
              </div>

              {/* INTERACTIVE TOKENS RENDERED AT EXACT PERCENTAGE POSITIONS */}
              {activePlayers.flatMap((pIdx) =>
                tokens
                  .filter((t) => t.playerIdx === pIdx)
                  .map((token) => {
                    const coord = getTokenCoordinates(token);
                    if (!coord) return null;

                    const meta = PLAYER_METAS[token.playerIdx]!;
                    const isCurTurn = token.playerIdx === curPlayerIdx;
                    const isHumanTurn = isCurTurn && !isCurrentPlayerBot;
                    const playable = isHumanTurn && dice !== null && isValidMove(token, dice);

                    const leftPct = (coord.c / 15) * 100;
                    const topPct = (coord.r / 15) * 100;

                    return (
                      <button
                        key={token.id}
                        disabled={!playable}
                        onClick={() => moveToken(token.id)}
                        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                        className={`absolute z-30 w-[6.666%] h-[6.666%] flex items-center justify-center transition-all duration-300 ${
                          playable
                            ? "animate-bounce scale-125 cursor-pointer drop-shadow-[0_0_12px_rgba(250,204,21,1)]"
                            : "cursor-default"
                        }`}
                      >
                        <span className="text-sm sm:text-xl drop-shadow-md select-none">
                          {meta.tokenEmoji}
                        </span>
                      </button>
                    );
                  })
              )}

            </div>
          </div>
        </div>

        {/* Winner Overlay */}
        {winner && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 text-white p-4 text-center space-y-3">
            <h3 className="font-display text-3xl text-emerald-400 font-black">{winner}</h3>
            <BrutButton variant="go" onClick={resetGame}>
              PLAY AGAIN
            </BrutButton>
          </div>
        )}

        {/* Action Ticker & Dice Roller */}
        <div className="border-t-2 border-lab-ink pt-1.5 flex justify-between items-center bg-stone-100 p-2 rounded shrink-0">
          <div className="flex items-center gap-2">
            <span className="mono-label text-[10px]">CURRENT TURN:</span>
            <span className="font-black text-xs px-2.5 py-1 rounded text-white shadow flex items-center gap-1" style={{ backgroundColor: curMeta.bgHex }}>
              <span>{curMeta.tokenEmoji}</span>
              <span>{curMeta.name}</span>
              <span className="bg-black/30 px-1 rounded text-[9px]">
                {isCurrentPlayerBot ? "🤖 BOT" : "👤 YOU"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {dice !== null && (
              <div className="flex items-center gap-1 font-bold text-xs bg-white px-2 py-1 border border-stone-800 rounded shadow-sm">
                <span>DICE:</span>
                <span className="text-lg text-amber-600 font-black">
                  {["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][dice - 1]}
                </span>
                <span>({dice})</span>
              </div>
            )}

            <BrutButton
              variant="go"
              disabled={isCurrentPlayerBot || dice !== null || isRolling || !!winner}
              onClick={rollDice}
              className={`px-3 py-1.5 font-black text-xs ${isRolling ? "animate-spin" : ""}`}
            >
              🎲 {isRolling ? "ROLLING..." : isCurrentPlayerBot ? "BOT PLAYING..." : "ROLL DICE"}
            </BrutButton>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
