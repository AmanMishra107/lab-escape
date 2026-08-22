import { useState } from "react";
import { Chess as ChessEngine, Square } from "chess.js";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

const PIECE_SYMBOLS: Record<string, string> = {
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
};

export default function ChessApp() {
  const [game, setGame] = useState(() => new ChessEngine());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [mode, setMode] = useState<"bot" | "local">("bot");
  const [botDiff, setBotDiff] = useState<"easy" | "normal" | "hard">("normal");
  const [statusMsg, setStatusMsg] = useState("White to move");
  const [gameOver, setGameOver] = useState(false);

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
      setGame(nextGame);
      checkGameStatus(nextGame);

      if (mode === "bot" && !nextGame.isGameOver()) {
        setTimeout(() => executeBotMove(nextGame), 600);
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
      if (captureMoves.length > 0) chosenMove = captureMoves[Math.floor(Math.random() * captureMoves.length)]!;
    }

    const nextGame = new ChessEngine(curGame.fen());
    nextGame.move(chosenMove);
    setGame(nextGame);
    sound.play(chosenMove.captured ? "pop" : "key");
    checkGameStatus(nextGame);
  };

  const checkGameStatus = (curGame: ChessEngine) => {
    if (curGame.isCheckmate()) {
      const winner = curGame.turn() === "w" ? "BLACK" : "WHITE";
      setStatusMsg(`CHECKMATE! ${winner} WINS!`);
      setGameOver(true);
      sound.play("success");

      const playerWon = winner === "WHITE";
      store.submitGameResult("chess", {
        gameId: "chess",
        score: playerWon ? 500 : 100,
        completed: true,
        won: playerWon,
        difficulty: botDiff,
        xpEarned: playerWon ? 350 : 80,
        achievementsUnlocked: playerWon ? ["checkmate", botDiff === "hard" ? "grandmaster" : ""] : [],
      });
    } else if (curGame.isDraw()) {
      setStatusMsg("GAME DRAWN (Stalemate / Insufficient Material)");
      setGameOver(true);
    } else if (curGame.inCheck()) {
      setStatusMsg(`${curGame.turn() === "w" ? "White" : "Black"} is in CHECK!`);
      sound.play("warn");
    } else {
      setStatusMsg(`${curGame.turn() === "w" ? "White" : "Black"} to move`);
    }
  };

  const resetBoard = () => {
    setGame(new ChessEngine());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setGameOver(false);
    setStatusMsg("White to move");
  };

  const board = game.board();

  return (
    <GameShell id="chess" status={<Tag tone="purple">{statusMsg}</Tag>}>
      <div className="flex h-full w-full flex-col justify-between p-2 font-mono text-xs">
        {/* Header HUD */}
        <div className="brut bg-stone-900 text-white p-2 flex justify-between items-center border-2 border-lab-ink">
          <span className="font-bold text-emerald-400">{statusMsg}</span>
          <div className="flex gap-1">
            <BrutButton className={`text-[9px] py-0.5 ${mode === "bot" ? "bg-amber-400 text-black" : ""}`} onClick={() => { setMode("bot"); resetBoard(); }}>🤖 BOT</BrutButton>
            <BrutButton className={`text-[9px] py-0.5 ${mode === "local" ? "bg-sky-400 text-black" : ""}`} onClick={() => { setMode("local"); resetBoard(); }}>👥 PASS & PLAY</BrutButton>
          </div>
        </div>

        {/* 8x8 Chessboard Grid */}
        <div className="my-auto self-center p-2 bg-stone-900 border-4 border-lab-ink rounded shadow-2xl">
          <div className="grid grid-cols-8 gap-0.5 w-72 h-72 sm:w-80 sm:h-80">
            {board.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const sq = `${String.fromCharCode(97 + cIdx)}${8 - rIdx}` as Square;
                const isSelected = selectedSquare === sq;
                const isPossible = possibleMoves.includes(sq);
                const isDark = (rIdx + cIdx) % 2 === 1;

                return (
                  <button
                    key={sq}
                    onClick={() => handleSquareClick(sq)}
                    className={`flex items-center justify-center font-bold text-2xl transition-all ${
                      isSelected
                        ? "bg-amber-400 text-black border-2 border-black"
                        : isPossible
                          ? "bg-emerald-300 text-black ring-2 ring-emerald-600"
                          : isDark
                            ? "bg-stone-700 text-white"
                            : "bg-stone-200 text-stone-900"
                    }`}
                  >
                    {cell ? PIECE_SYMBOLS[cell.color === "w" ? cell.type.toUpperCase() : cell.type] : ""}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between border-t-2 border-lab-ink pt-1 text-[10px]">
          <span>ENGINE: CHESS.JS LEGAL RULES</span>
          <BrutButton className="text-[9px] py-0.5" onClick={resetBoard}>RESET BOARD</BrutButton>
        </div>
      </div>
    </GameShell>
  );
}
