import { useState } from "react";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../../components/ui/brut";
import { GameShell } from "../GameShell";

type PlayerPiece = 1 | 2; // 1 = Red (Player 1), 2 = Yellow (Player 2 / Bot)

export default function ConnectFour() {
  const [board, setBoard] = useState<(PlayerPiece | 0)[][]>(() =>
    Array.from({ length: 6 }, () => Array(7).fill(0))
  );
  const [turn, setTurn] = useState<PlayerPiece>(1);
  const [mode, setMode] = useState<"bot" | "local">("bot");
  const [winner, setWinner] = useState<string | null>(null);

  const dropDisc = (colIdx: number) => {
    if (winner) return;
    store.interacted();

    // Find lowest empty cell in column
    let rowIdx = -1;
    for (let r = 5; r >= 0; r--) {
      if (board[r]![colIdx] === 0) {
        rowIdx = r;
        break;
      }
    }
    if (rowIdx === -1) return; // Column full

    sound.play("key");
    const newBoard = board.map((row) => [...row]);
    newBoard[rowIdx]![colIdx] = turn;
    setBoard(newBoard);

    if (checkWin(newBoard, rowIdx, colIdx, turn)) {
      const winnerName = turn === 1 ? "RED (P1)" : mode === "bot" ? "YELLOW (BOT)" : "YELLOW (P2)";
      setWinner(`${winnerName} WINS!`);
      sound.play("success");

      const isP1Win = turn === 1;
      store.submitGameResult("connectfour", {
        gameId: "connectfour",
        score: isP1Win ? 300 : 50,
        completed: true,
        won: isP1Win,
        xpEarned: isP1Win ? 200 : 50,
        achievementsUnlocked: isP1Win ? ["four_connected"] : [],
      });
      return;
    }

    const nextTurn = turn === 1 ? 2 : 1;
    setTurn(nextTurn);

    if (mode === "bot" && nextTurn === 2) {
      setTimeout(() => executeBotTurn(newBoard), 500);
    }
  };

  const executeBotTurn = (curBoard: (PlayerPiece | 0)[][]) => {
    // Valid columns
    const validCols = [0, 1, 2, 3, 4, 5, 6].filter((c) => curBoard[0]![c] === 0);
    if (!validCols.length) return;

    const chosenCol = validCols[Math.floor(Math.random() * validCols.length)]!;

    let rowIdx = -1;
    for (let r = 5; r >= 0; r--) {
      if (curBoard[r]![chosenCol] === 0) {
        rowIdx = r;
        break;
      }
    }

    const newBoard = curBoard.map((row) => [...row]);
    newBoard[rowIdx]![chosenCol] = 2;
    setBoard(newBoard);
    sound.play("key");

    if (checkWin(newBoard, rowIdx, chosenCol, 2)) {
      setWinner("YELLOW (BOT) WINS!");
      sound.play("error");
    } else {
      setTurn(1);
    }
  };

  const checkWin = (b: (PlayerPiece | 0)[][], r: number, c: number, p: PlayerPiece) => {
    const dirs = [
      [0, 1],  // Horizontal
      [1, 0],  // Vertical
      [1, 1],  // Diagonal /
      [1, -1], // Diagonal \
    ];
    for (const [dr, dc] of dirs) {
      let count = 1;
      for (let i = 1; i < 4; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (nr >= 0 && nr < 6 && nc >= 0 && nc < 7 && b[nr]![nc] === p) count++;
        else break;
      }
      for (let i = 1; i < 4; i++) {
        const nr = r - dr * i, nc = c - dc * i;
        if (nr >= 0 && nr < 6 && nc >= 0 && nc < 7 && b[nr]![nc] === p) count++;
        else break;
      }
      if (count >= 4) return true;
    }
    return false;
  };

  const resetGame = () => {
    setBoard(Array.from({ length: 6 }, () => Array(7).fill(0)));
    setTurn(1);
    setWinner(null);
  };

  return (
    <GameShell id="connectfour" status={<Tag tone="yellow">TURN: {turn === 1 ? "RED (P1)" : "YELLOW"}</Tag>}>
      <div className="flex h-full w-full flex-col justify-between p-2 font-mono text-xs">
        <div className="brut bg-stone-900 text-white p-2 flex justify-between items-center border-2 border-lab-ink">
          <span>MODE: <b className="text-amber-400">{mode === "bot" ? "VS BOT" : "PASS & PLAY"}</b></span>
          <div className="flex gap-1">
            <BrutButton className={`text-[9px] py-0.5 ${mode === "bot" ? "bg-amber-400 text-black" : ""}`} onClick={() => { setMode("bot"); resetGame(); }}>🤖 BOT</BrutButton>
            <BrutButton className={`text-[9px] py-0.5 ${mode === "local" ? "bg-sky-400 text-black" : ""}`} onClick={() => { setMode("local"); resetGame(); }}>👥 2P</BrutButton>
          </div>
        </div>

        {/* 7x6 Grid */}
        <div className="my-auto self-center p-3 bg-blue-900 border-4 border-lab-ink rounded-lg shadow-2xl">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, c) => (
              <button
                key={c}
                onClick={() => dropDisc(c)}
                className="flex flex-col gap-2 p-1 hover:bg-blue-800 rounded transition-colors"
              >
                {Array.from({ length: 6 }, (_, r) => {
                  const val = board[r]![c];
                  return (
                    <div
                      key={r}
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-black flex items-center justify-center font-bold text-lg shadow-inner ${
                        val === 1 ? "bg-rose-500 text-white" : val === 2 ? "bg-yellow-400 text-black" : "bg-stone-900"
                      }`}
                    >
                      {val === 1 ? "🔴" : val === 2 ? "🟡" : ""}
                    </div>
                  );
                })}
              </button>
            ))}
          </div>
        </div>

        {winner && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 text-white p-4 text-center space-y-3">
            <h3 className="font-display text-3xl text-emerald-400">{winner}</h3>
            <BrutButton variant="go" onClick={resetGame}>
              PLAY AGAIN
            </BrutButton>
          </div>
        )}

        <div className="border-t-2 border-lab-ink pt-1 text-[10px] text-center text-stone-600">
          CLICK ANY COLUMN TO DROP DISC
        </div>
      </div>
    </GameShell>
  );
}
