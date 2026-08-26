import { useState, useEffect, useMemo } from "react";
import { Chess as ChessEngine, Square, PieceSymbol } from "chess.js";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

/* =========================================================================================
   STAUNTON VECTOR SVG CHESS PIECE SYSTEM
   ========================================================================================= */

function ChessPieceSvg({ type, color }: { type: PieceSymbol; color: "w" | "b" }) {
  const isWhite = color === "w";
  const primary = isWhite ? "#ffffff" : "#1e293b";
  const stroke = isWhite ? "#0f172a" : "#f8fafc";
  const accent = isWhite ? "#e2e8f0" : "#334155";
  const highlight = isWhite ? "#ffffff" : "#475569";

  switch (type) {
    case "p": // PAWN
      return (
        <svg viewBox="0 0 45 45" className="h-full w-full drop-shadow-md transition-transform duration-150">
          <g fill={primary} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="22.5" cy="12" r="6" fill={primary} />
            <path d="M19 18 C19 18 17 26 15 31 C14 34 16 35 22.5 35 C29 35 31 34 30 31 C28 26 26 18 26 18 Z" fill={primary} />
            <rect x="12" y="35" width="21" height="4" rx="1.5" fill={primary} />
            <rect x="9" y="39" width="27" height="3" rx="1" fill={primary} />
            {isWhite && <path d="M20 9 Q23 7 25 9" stroke={stroke} strokeWidth="1" fill="none" />}
          </g>
        </svg>
      );

    case "r": // ROOK
      return (
        <svg viewBox="0 0 45 45" className="h-full w-full drop-shadow-md transition-transform duration-150">
          <g fill={primary} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            {/* Crenellations */}
            <path d="M11 11 H15 V15 H19 V11 H26 V15 H30 V11 H34 V18 H11 Z" fill={primary} />
            <path d="M14 18 C14 18 16 28 15 33 H30 C29 28 31 18 31 18 Z" fill={primary} />
            <rect x="11" y="33" width="23" height="4" rx="1" fill={primary} />
            <rect x="8" y="37" width="29" height="4" rx="1" fill={primary} />
            <line x1="14" y1="21" x2="31" y2="21" stroke={accent} strokeWidth="1" />
          </g>
        </svg>
      );

    case "n": // KNIGHT
      return (
        <svg viewBox="0 0 45 45" className="h-full w-full drop-shadow-md transition-transform duration-150">
          <g fill={primary} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M22 10 C22 10 20 7 14 12 C10 16 11 20 12 22 C13 24 16 24 16 24 C16 24 12 25 10 29 C8 33 11 36 17 35 C18 35 20 31 22 28 C26 33 29 35 34 35 C35 31 34 27 32 24 C36 21 37 13 32 9 C30 7 28 8 26 8 C24 8 22 10 22 10 Z"
              fill={primary}
            />
            <circle cx="16" cy="15" r="1.5" fill={isWhite ? "#0f172a" : "#ffffff"} />
            <rect x="9" y="37" width="27" height="4" rx="1" fill={primary} />
            {isWhite && <path d="M22 13 Q25 18 24 23" stroke={stroke} strokeWidth="1" fill="none" />}
          </g>
        </svg>
      );

    case "b": // BISHOP
      return (
        <svg viewBox="0 0 45 45" className="h-full w-full drop-shadow-md transition-transform duration-150">
          <g fill={primary} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="22.5" cy="8.5" r="2" fill={stroke} />
            <path d="M17 17 C15 13 20 10 22.5 10 C25 10 30 13 28 17 C26 21 27 25 28 32 H17 C18 25 19 21 17 17 Z" fill={primary} />
            <path d="M20 14 L25 19 M21 21 L24 18" stroke={stroke} strokeWidth="1.4" fill="none" />
            <rect x="13" y="32" width="19" height="4" rx="1" fill={primary} />
            <rect x="9" y="36" width="27" height="4" rx="1" fill={primary} />
          </g>
        </svg>
      );

    case "q": // QUEEN
      return (
        <svg viewBox="0 0 45 45" className="h-full w-full drop-shadow-md transition-transform duration-150">
          <g fill={primary} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="13" r="2" fill={highlight} />
            <circle cx="15.5" cy="9.5" r="2" fill={highlight} />
            <circle cx="22.5" cy="8" r="2.2" fill={highlight} />
            <circle cx="29.5" cy="9.5" r="2" fill={highlight} />
            <circle cx="36" cy="13" r="2" fill={highlight} />
            <path d="M9 15 L14 26 H31 L36 15 L29 22 L22.5 13 L16 22 Z" fill={primary} />
            <path d="M14 26 C14 26 15 32 14 34 H31 C30 32 31 26 31 26 Z" fill={primary} />
            <rect x="11" y="34" width="23" height="3.5" rx="1" fill={primary} />
            <rect x="8" y="37.5" width="29" height="4" rx="1" fill={primary} />
          </g>
        </svg>
      );

    case "k": // KING
      return (
        <svg viewBox="0 0 45 45" className="h-full w-full drop-shadow-md transition-transform duration-150">
          <g fill={primary} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            {/* Top Cross */}
            <path d="M22.5 5 V11 M19.5 8 H25.5" stroke={stroke} strokeWidth="2" />
            <path d="M14 17 C13 13 17 11 22.5 11 C28 11 32 13 31 17 C28 21 29 27 30 33 H15 C16 27 17 21 14 17 Z" fill={primary} />
            <rect x="12" y="33" width="21" height="4" rx="1" fill={primary} />
            <rect x="8" y="37" width="29" height="4" rx="1" fill={primary} />
            <circle cx="22.5" cy="22" r="3.5" fill={accent} stroke={stroke} strokeWidth="1" />
          </g>
        </svg>
      );
  }
}

/* =========================================================================================
   THEMES & BOARD CONFIGURATIONS
   ========================================================================================= */

const BOARD_THEMES = [
  { id: "tournament", name: "Tournament Green", light: "#eeeed2", dark: "#769656", border: "#4a5d34" },
  { id: "wood", name: "Walnut Wood", light: "#f0d9b5", dark: "#b58863", border: "#8c5836" },
  { id: "cyber", name: "Cyber Matrix", light: "#334155", dark: "#0f172a", border: "#06b6d4" },
  { id: "classic", name: "Classic Monochrome", light: "#f1f5f9", dark: "#475569", border: "#1e293b" },
];

export default function ChessApp() {
  const [game, setGame] = useState(() => new ChessEngine());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [mode, setMode] = useState<"bot" | "local">("bot");
  const [botDiff, setBotDiff] = useState<"easy" | "normal" | "hard">("normal");
  const [statusMsg, setStatusMsg] = useState("White to move");
  const [gameOver, setGameOver] = useState(false);
  const [themeIdx, setThemeIdx] = useState(0);
  const [flipBoard, setFlipBoard] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const theme = BOARD_THEMES[themeIdx]!;

  // Captured pieces calculation
  const capturedPieces = useMemo(() => {
    const history = game.history({ verbose: true });
    const whiteCaptures: PieceSymbol[] = [];
    const blackCaptures: PieceSymbol[] = [];

    history.forEach((m) => {
      if (m.captured) {
        if (m.color === "w") whiteCaptures.push(m.captured);
        else blackCaptures.push(m.captured);
      }
    });

    const pieceValues: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    const whiteScore = whiteCaptures.reduce((acc, p) => acc + (pieceValues[p] || 0), 0);
    const blackScore = blackCaptures.reduce((acc, p) => acc + (pieceValues[p] || 0), 0);

    return {
      whiteCaptures,
      blackCaptures,
      advantage: whiteScore - blackScore,
    };
  }, [game]);

  const handleSquareClick = (sq: Square) => {
    if (gameOver) return;
    store.interacted();

    // If a piece is already selected, try to move
    if (selectedSquare) {
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }

      const moveResult = makeMove(selectedSquare, sq);
      if (moveResult) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }
    }

    // Select piece
    const piece = game.get(sq);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(sq);
      const moves = game.moves({ square: sq, verbose: true });
      setPossibleMoves(moves.map((m) => m.to));
      sound.play("click");
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const makeMove = (from: Square, to: Square) => {
    try {
      const nextGame = new ChessEngine(game.fen());
      const move = nextGame.move({ from, to, promotion: "q" });
      if (!move) return false;

      sound.play(move.captured ? "pop" : "key");
      setLastMove({ from, to });
      setGame(nextGame);
      setMoveHistory(nextGame.history());
      checkGameStatus(nextGame);

      if (mode === "bot" && !nextGame.isGameOver()) {
        setTimeout(() => executeBotMove(nextGame), 500);
      }
      return true;
    } catch {
      return false;
    }
  };

  const executeBotMove = (curGame: ChessEngine) => {
    const moves = curGame.moves({ verbose: true });
    if (!moves.length) return;

    let chosenMove = moves[Math.floor(Math.random() * moves.length)]!;

    if (botDiff !== "easy") {
      // Prioritize captures and checks
      const captureMoves = moves.filter((m) => m.captured);
      const checkMoves = moves.filter((m) => m.san.includes("+") || m.san.includes("#"));

      if (botDiff === "hard" && checkMoves.length > 0 && Math.random() > 0.3) {
        chosenMove = checkMoves[0]!;
      } else if (captureMoves.length > 0) {
        chosenMove = captureMoves[Math.floor(Math.random() * captureMoves.length)]!;
      }
    }

    const nextGame = new ChessEngine(curGame.fen());
    const moveResult = nextGame.move(chosenMove);
    setGame(nextGame);
    setLastMove({ from: chosenMove.from, to: chosenMove.to });
    setMoveHistory(nextGame.history());
    sound.play(moveResult.captured ? "pop" : "key");
    checkGameStatus(nextGame);
  };

  const checkGameStatus = (curGame: ChessEngine) => {
    if (curGame.isCheckmate()) {
      const winner = curGame.turn() === "w" ? "BLACK" : "WHITE";
      setStatusMsg(`CHECKMATE! ${winner} WINS! 🏆`);
      setGameOver(true);
      sound.play("success");

      const playerWon = winner === "WHITE";
      store.submitGameResult("chess", {
        gameId: "chess",
        score: playerWon ? 600 : 120,
        completed: true,
        won: playerWon,
        difficulty: botDiff,
        xpEarned: playerWon ? 400 : 90,
        achievementsUnlocked: playerWon ? ["checkmate", botDiff === "hard" ? "grandmaster" : ""] : [],
      });
    } else if (curGame.isDraw()) {
      setStatusMsg("GAME DRAWN (Stalemate / Insufficient Material)");
      setGameOver(true);
    } else if (curGame.inCheck()) {
      setStatusMsg(`⚠️ ${curGame.turn() === "w" ? "White" : "Black"} is in CHECK!`);
      sound.play("warn");
    } else {
      setStatusMsg(`${curGame.turn() === "w" ? "White" : "Black"} to move`);
    }
  };

  const undoMove = () => {
    if (gameOver) return;
    const nextGame = new ChessEngine(game.fen());
    nextGame.undo();
    if (mode === "bot") nextGame.undo(); // Undo bot move as well
    setGame(nextGame);
    setMoveHistory(nextGame.history());
    setSelectedSquare(null);
    setPossibleMoves([]);
    sound.play("click");
    checkGameStatus(nextGame);
  };

  const resetBoard = () => {
    setGame(new ChessEngine());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setGameOver(false);
    setStatusMsg("White to move");
    sound.play("click");
  };

  const rawBoard = game.board();
  const boardRows = flipBoard ? [...rawBoard].reverse() : rawBoard;

  return (
    <GameShell id="chess" status={<Tag tone="purple">{statusMsg}</Tag>}>
      <div className="flex h-full w-full flex-col justify-between p-2 font-mono text-xs gap-2">
        
        {/* Top Match HUD Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-lab-ink bg-stone-900 px-3 py-2 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm tracking-wide text-emerald-400">{statusMsg}</span>
            {game.inCheck() && <Tag tone="red">CHECK</Tag>}
          </div>

          <div className="flex items-center gap-1">
            <BrutButton
              className={`text-[10px] py-1 px-2.5 ${mode === "bot" ? "bg-amber-400 text-black font-bold" : ""}`}
              onClick={() => { setMode("bot"); resetBoard(); }}
            >
              🤖 VS BOT ({botDiff.toUpperCase()})
            </BrutButton>
            <BrutButton
              className={`text-[10px] py-1 px-2.5 ${mode === "local" ? "bg-sky-400 text-black font-bold" : ""}`}
              onClick={() => { setMode("local"); resetBoard(); }}
            >
              👥 2-PLAYER
            </BrutButton>
            <button
              type="button"
              title="Flip perspective"
              onClick={() => { setFlipBoard((f) => !f); sound.play("click"); }}
              className="brut-sm bg-stone-800 hover:bg-stone-700 text-white px-2 py-1 text-xs border border-lab-ink"
            >
              🔄 FLIP
            </button>
          </div>
        </div>

        {/* Main Chess Arena */}
        <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-2 md:flex-row">
          
          {/* Left / Top Captured Pieces & Info */}
          <div className="flex flex-row md:flex-col justify-between items-center gap-2 border-2 border-lab-ink bg-card p-2 shadow-sm md:w-36 text-[10px]">
            <div className="flex flex-col gap-1 w-full">
              <span className="font-bold text-slate-700">BLACK CAPTURES:</span>
              <div className="flex flex-wrap gap-0.5 min-h-[22px]">
                {capturedPieces.blackCaptures.map((p, i) => (
                  <div key={i} className="h-5 w-5">
                    <ChessPieceSvg type={p} color="w" />
                  </div>
                ))}
              </div>
              {capturedPieces.advantage < 0 && (
                <span className="font-bold text-lab-red">+{Math.abs(capturedPieces.advantage)}</span>
              )}
            </div>

            <div className="flex flex-col gap-1 w-full border-t border-lab-ink/20 pt-1">
              <span className="font-bold text-slate-700">WHITE CAPTURES:</span>
              <div className="flex flex-wrap gap-0.5 min-h-[22px]">
                {capturedPieces.whiteCaptures.map((p, i) => (
                  <div key={i} className="h-5 w-5">
                    <ChessPieceSvg type={p} color="b" />
                  </div>
                ))}
              </div>
              {capturedPieces.advantage > 0 && (
                <span className="font-bold text-lab-green">+{capturedPieces.advantage}</span>
              )}
            </div>
          </div>

          {/* Center: Precision 8x8 Chessboard Grid with Rank/File Notation */}
          <div
            className="relative flex flex-col items-center justify-center p-2.5 rounded shadow-2xl border-4 border-lab-ink"
            style={{ background: theme.border }}
          >
            <div className="grid grid-cols-8 w-72 h-72 sm:w-84 sm:h-84 md:w-96 md:h-96 shadow-inner">
              {boardRows.map((row, rIdx) => {
                const actualRowIdx = flipBoard ? 7 - rIdx : rIdx;
                const rowCells = flipBoard ? [...row].reverse() : row;

                return rowCells.map((cell, cIdx) => {
                  const actualColIdx = flipBoard ? 7 - cIdx : cIdx;
                  const sq = `${String.fromCharCode(97 + actualColIdx)}${8 - actualRowIdx}` as Square;
                  const isSelected = selectedSquare === sq;
                  const isPossible = possibleMoves.includes(sq);
                  const isLastMove = lastMove?.from === sq || lastMove?.to === sq;
                  const isDark = (actualRowIdx + actualColIdx) % 2 === 1;
                  const isCheckKing = game.inCheck() && cell?.type === "k" && cell.color === game.turn();

                  return (
                    <button
                      key={sq}
                      type="button"
                      onClick={() => handleSquareClick(sq)}
                      className="relative flex items-center justify-center p-1 transition-all select-none focus:outline-none"
                      style={{
                        background: isCheckKing
                          ? "#ef4444"
                          : isSelected
                          ? "#facc15"
                          : isLastMove
                          ? isDark
                            ? "#859f3d"
                            : "#cdd26a"
                          : isDark
                          ? theme.dark
                          : theme.light,
                      }}
                    >
                      {/* Rank Number Label (Top Left of file A) */}
                      {cIdx === 0 && (
                        <span
                          className="absolute left-1 top-0.5 text-[8.5px] font-bold pointer-events-none opacity-60"
                          style={{ color: isDark ? theme.light : theme.dark }}
                        >
                          {8 - actualRowIdx}
                        </span>
                      )}

                      {/* File Letter Label (Bottom Right of rank 1) */}
                      {rIdx === 7 && (
                        <span
                          className="absolute right-1 bottom-0.5 text-[8.5px] font-bold pointer-events-none opacity-60"
                          style={{ color: isDark ? theme.light : theme.dark }}
                        >
                          {String.fromCharCode(97 + actualColIdx)}
                        </span>
                      )}

                      {/* Possible Move Target Dot / Capture Ring */}
                      {isPossible && !cell && (
                        <div className="h-3.5 w-3.5 rounded-full bg-slate-900/35 pointer-events-none" />
                      )}
                      {isPossible && cell && (
                        <div className="absolute inset-0.5 rounded-full border-3 border-slate-900/40 pointer-events-none" />
                      )}

                      {/* Staunton Vector Chess Piece */}
                      {cell && (
                        <div className="h-full w-full flex items-center justify-center pointer-events-none">
                          <ChessPieceSvg type={cell.type} color={cell.color} />
                        </div>
                      )}
                    </button>
                  );
                });
              })}
            </div>
          </div>

          {/* Right: Move History & Settings */}
          <div className="flex flex-col justify-between gap-2 border-2 border-lab-ink bg-card p-2.5 shadow-sm md:w-44 text-[10px]">
            <div>
              <span className="font-bold text-slate-700 block mb-1">NOTATION LOG:</span>
              <div className="h-28 overflow-y-auto border border-lab-ink/20 bg-background p-1.5 font-mono text-[9px] space-y-0.5">
                {moveHistory.length === 0 ? (
                  <span className="opacity-40 italic">Game in progress...</span>
                ) : (
                  Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                    <div key={i} className="flex justify-between border-b border-lab-ink/10 pb-0.5">
                      <span className="opacity-60">{i + 1}.</span>
                      <span className="font-bold">{moveHistory[i * 2]}</span>
                      <span className="font-bold text-slate-600">{moveHistory[i * 2 + 1] || ""}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Board Theme Selector */}
            <div className="space-y-1">
              <span className="mono-label text-[9px] opacity-70">BOARD THEME:</span>
              <div className="grid grid-cols-2 gap-1">
                {BOARD_THEMES.map((th, idx) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => { setThemeIdx(idx); sound.play("click"); }}
                    className={`px-1.5 py-0.5 text-[8.5px] border font-bold rounded-xs ${
                      themeIdx === idx ? "border-lab-ink bg-amber-300 text-black shadow-xs" : "border-slate-300 bg-background"
                    }`}
                  >
                    {th.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Bot Difficulty */}
            {mode === "bot" && (
              <div className="space-y-1">
                <span className="mono-label text-[9px] opacity-70">BOT DIFFICULTY:</span>
                <div className="grid grid-cols-3 gap-0.5">
                  {(["easy", "normal", "hard"] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => { setBotDiff(diff); sound.play("click"); }}
                      className={`py-0.5 text-[8px] uppercase border font-bold rounded-xs ${
                        botDiff === diff ? "border-lab-ink bg-emerald-300 text-black" : "border-slate-300 bg-background opacity-75"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between border-t-2 border-lab-ink pt-2 text-[10px]">
          <span className="opacity-70">RULES: FIDE LEGAL · CHESS.JS ENGINE · EN PASSANT & CASTLING ENABLED</span>
          <div className="flex gap-1.5">
            <BrutButton className="text-[10px] py-1 px-3" onClick={undoMove}>
              ↩ UNDO MOVE
            </BrutButton>
            <BrutButton variant="danger" className="text-[10px] py-1 px-3" onClick={resetBoard}>
              🔄 RESET GAME
            </BrutButton>
          </div>
        </div>

      </div>
    </GameShell>
  );
}

