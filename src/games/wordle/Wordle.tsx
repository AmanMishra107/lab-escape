import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

const WORDS = [
  "ABOUT","ABOVE","ABUSE","ACTOR","ACUTE","ADMIT","ADOPT","ADULT","AFTER","AGAIN",
  "AGENT","AGREE","AHEAD","ALARM","ALBUM","ALERT","ALIEN","ALIGN","ALIKE","ALIVE",
  "ALLEY","ALLOW","ALONE","ALONG","ALTER","AMBER","ANGEL","ANGLE","ANGRY","ANIME",
  "ANKLE","ANNEX","APART","APPLE","APPLY","ARENA","ARGUE","ARISE","ARMED","ARMOR",
  "ARRAY","ARROW","ASKED","ASSET","ATLAS","ATTIC","AUDIO","AUDIT","AVOID","AWAKE",
  "AWARD","AWARE","AWFUL","BADLY","BAKER","BASIC","BASIS","BATCH","BEACH","BEGAN",
  "BEGIN","BEING","BELOW","BENCH","BIBLE","BIRTH","BISON","BITE","BLACK","BLADE",
  "BLAME","BLAND","BLANK","BLAST","BLAZE","BLEED","BLEND","BLESS","BLIND","BLOCK",
  "BLOOD","BLOOM","BLOWN","BOARD","BONUS","BOOST","BOUND","BRAIN","BRAND","BRAVE",
  "BREAD","BREAK","BRICK","BRIDE","BRIEF","BRING","BRISK","BROAD","BROKE","BROWN",
  "BRUSH","BUDDY","BUILD","BUILT","BUNCH","BURST","BUYER","CABIN","CABLE","CAMEL",
  "CARGO","CARRY","CATCH","CAUSE","CHAIN","CHAIR","CHALK","CHAOS","CHARM","CHART",
  "CHASE","CHEAP","CHECK","CHEEK","CHESS","CHEST","CHIEF","CHILD","CHINA","CHOIR",
  "CHUNK","CIVIC","CIVIL","CLAIM","CLASH","CLASS","CLEAN","CLEAR","CLICK","CLIFF",
  "CLIMB","CLOCK","CLOSE","CLOUD","COACH","COAST","COBRA","COCOA","COLOR","COMIC",
  "COMMA","CORAL","COULD","COUCH","COUNT","COURT","COVER","CRACK","CRAFT","CRANE",
  "CRASH","CRAZY","CREAM","CREEK","CRISP","CROSS","CROWD","CROWN","CRUEL","CRUSH",
  "CURVE","CYCLE","DANCE","DATED","DEBUT","DELTA","DEPOT","DEPTH","DERBY","DEVIL",
  "DIARY","DIGIT","DIRTY","DISCO","DITCH","DIZZY","DODGE","DOING","DOUBT","DOUGH",
];

const MAX_GUESSES = 6;
const WORD_LEN = 5;

type LetterState = "correct" | "present" | "absent" | "empty" | "active";

interface Cell {
  letter: string;
  state: LetterState;
}

function makeEmptyRow(): Cell[] {
  return Array.from({ length: WORD_LEN }, () => ({ letter: "", state: "empty" as LetterState }));
}

function evaluateGuess(guess: string, target: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LEN).fill("absent");
  const targetArr = target.split("");
  const guessArr = guess.split("");

  // 1st pass: correct letters (Green)
  const remaining: string[] = [];
  guessArr.forEach((l, i) => {
    if (l === targetArr[i]) {
      result[i] = "correct";
      targetArr[i] = "*";
    } else {
      remaining.push(targetArr[i]!);
    }
  });

  // 2nd pass: present letters (Yellow)
  guessArr.forEach((l, i) => {
    if (result[i] === "correct") return;
    const idx = remaining.indexOf(l);
    if (idx !== -1) {
      result[i] = "present";
      remaining.splice(idx, 1);
    }
  });

  return result;
}

const STATE_STYLE: Record<LetterState, string> = {
  correct: "bg-[#538d4e] border-[#538d4e] text-white font-bold",
  present: "bg-[#b59f3b] border-[#b59f3b] text-white font-bold",
  absent:  "bg-[#3a3a3c] border-[#3a3a3c] text-stone-300",
  empty:   "bg-white border-2 border-stone-300 text-stone-900",
  active:  "bg-white border-2 border-lab-ink text-stone-900 scale-105",
};

const KEY_STYLE: Record<LetterState | "unused", string> = {
  correct: "bg-[#538d4e] text-white",
  present: "bg-[#b59f3b] text-white",
  absent:  "bg-[#3a3a3c] text-stone-400",
  empty:   "bg-stone-200 text-stone-900",
  active:  "bg-stone-200 text-stone-900",
  unused:  "bg-stone-200 text-stone-900",
};

export default function Wordle() {
  const [answer, setAnswer] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]!);
  const [grid, setGrid] = useState<Cell[][]>(() =>
    Array.from({ length: MAX_GUESSES }, makeEmptyRow),
  );
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startNewGame = () => {
    setAnswer(WORDS[Math.floor(Math.random() * WORDS.length)]!);
    setGrid(Array.from({ length: MAX_GUESSES }, makeEmptyRow));
    setCurrentRow(0);
    setCurrentCol(0);
    setGameOver(false);
    setWon(false);
    setMsg(null);
    sound.play("click");
  };

  const showMsg = (text: string) => {
    setMsg(text);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 2000);
  };

  const submit = useCallback(() => {
    if (gameOver) return;
    if (currentCol < WORD_LEN) {
      showMsg("Not enough letters");
      setShake(currentRow);
      setTimeout(() => setShake(null), 500);
      sound.play("warn");
      return;
    }
    const guessWord = grid[currentRow]!.map((c) => c.letter).join("");
    if (!WORDS.includes(guessWord)) {
      showMsg("Not in word list");
      setShake(currentRow);
      setTimeout(() => setShake(null), 500);
      sound.play("warn");
      return;
    }

    const states = evaluateGuess(guessWord, answer);
    setGrid((prev) => {
      const ng = prev.map((row) => row.map((c) => ({ ...c })));
      states.forEach((s, i) => {
        ng[currentRow]![i]!.state = s;
      });
      return ng;
    });

    const isWin = states.every((s) => s === "correct");
    if (isWin) {
      setTimeout(() => {
        setWon(true);
        setGameOver(true);
        sound.play("success");
        const xp = (MAX_GUESSES - currentRow) * 50 + 100;
        store.submitGameResult("wordle", { score: xp, accuracy: 1, time: 1, completed: true });
        showMsg(["GENIUS! 🧠", "MAGNIFICENT! ✨", "IMPRESSIVE! 🎯", "SPLENDID! 🌟", "GREAT! 👍", "PHEW! 😅"][currentRow] ?? "NICE!");
      }, 250);
    } else if (currentRow + 1 >= MAX_GUESSES) {
      setTimeout(() => {
        setGameOver(true);
        sound.play("error");
        store.submitGameResult("wordle", { score: 10, accuracy: 0, time: 1, completed: false });
        showMsg(`Word was: ${answer}`);
      }, 250);
    }

    sound.play("click");
    setCurrentRow((r) => r + 1);
    setCurrentCol(0);
    store.interacted();
  }, [currentCol, currentRow, grid, answer, gameOver]);

  const typeLetter = useCallback(
    (letter: string) => {
      if (gameOver || currentCol >= WORD_LEN) return;
      setGrid((prev) => {
        const ng = prev.map((row) => row.map((c) => ({ ...c })));
        ng[currentRow]![currentCol]!.letter = letter;
        ng[currentRow]![currentCol]!.state = "active";
        return ng;
      });
      setCurrentCol((c) => c + 1);
      sound.play("key");
    },
    [gameOver, currentCol, currentRow],
  );

  const backspace = useCallback(() => {
    if (gameOver || currentCol === 0) return;
    setGrid((prev) => {
      const ng = prev.map((row) => row.map((c) => ({ ...c })));
      ng[currentRow]![currentCol - 1]!.letter = "";
      ng[currentRow]![currentCol - 1]!.state = "empty";
      return ng;
    });
    setCurrentCol((c) => c - 1);
    sound.play("key");
  }, [currentCol, currentRow, gameOver]);

  // Physical Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") submit();
      else if (e.key === "Backspace") backspace();
      else if (/^[a-zA-Z]$/.test(e.key)) typeLetter(e.key.toUpperCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submit, backspace, typeLetter]);

  // Keyboard letter states
  const letterState: Record<string, LetterState> = {};
  grid.forEach((row) => {
    row.forEach(({ letter, state }) => {
      if (!letter || state === "empty" || state === "active") return;
      const prev = letterState[letter];
      if (!prev || (prev !== "correct" && (state === "correct" || (prev !== "present" && state === "present")))) {
        letterState[letter] = state;
      }
    });
  });

  return (
    <GameShell
      id="wordle"
      status={
        <>
          <Tag tone={won ? "green" : gameOver ? "red" : "blue"}>
            {won ? "WON 🏆" : gameOver ? "LOST" : `GUESS ${currentRow + 1}/${MAX_GUESSES}`}
          </Tag>
        </>
      }
      toolbar={
        <BrutButton variant="go" onClick={startNewGame} className="text-xs py-1">
          🔄 NEW WORD
        </BrutButton>
      }
    >
      <div className="flex h-full w-full flex-col items-center justify-between p-2 font-mono select-none">
        
        {/* Rules & Message Toast */}
        <div className="relative flex w-full max-w-sm items-center justify-between rounded border-2 border-lab-ink bg-stone-900 px-3 py-1.5 text-xs text-white shadow-sm">
          <span className="font-bold text-amber-400">WORDLE.EXE</span>
          <span className="text-[10px] text-stone-400">5-LETTER HIDDEN WORD</span>

          {msg && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 brut bg-amber-300 text-black px-4 py-1 font-bold text-xs shadow-xl border-2 border-lab-ink animate-bounce">
              {msg}
            </div>
          )}
        </div>

        {/* 6x5 Wordle Matrix Grid */}
        <div className="my-auto flex flex-col gap-1.5">
          {grid.map((row, r) => (
            <div
              key={r}
              className="flex gap-1.5"
              style={{
                animation: shake === r ? "shake 0.4s ease" : undefined,
              }}
            >
              {row.map((cell, c) => (
                <div
                  key={c}
                  className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-sm font-display text-xl sm:text-2xl font-black transition-all duration-200 border-2 ${
                    STATE_STYLE[cell.state]
                  }`}
                >
                  {cell.letter}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* On-screen QWERTY Keyboard */}
        <div className="flex flex-col gap-1.5 w-full max-w-md">
          {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((rowStr, ri) => (
            <div key={ri} className="flex gap-1 justify-center">
              {ri === 2 && (
                <button
                  type="button"
                  onClick={submit}
                  className="brut-sm px-2 py-1.5 text-[10px] font-bold bg-emerald-400 hover:bg-emerald-300 text-black border border-lab-ink active:scale-95"
                  style={{ minWidth: "3.2rem", height: "2.4rem" }}
                >
                  ENTER
                </button>
              )}

              {rowStr.split("").map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => typeLetter(l)}
                  className={`brut-sm text-xs font-bold border border-lab-ink/40 active:scale-95 ${
                    KEY_STYLE[letterState[l] ?? "unused"]
                  }`}
                  style={{ width: "2rem", height: "2.4rem" }}
                >
                  {l}
                </button>
              ))}

              {ri === 2 && (
                <button
                  type="button"
                  onClick={backspace}
                  className="brut-sm px-2 py-1.5 text-xs font-bold bg-stone-300 hover:bg-stone-200 text-black border border-lab-ink active:scale-95"
                  style={{ minWidth: "3.2rem", height: "2.4rem" }}
                >
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>

        {/* CSS Keyframes for Shake */}
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
        `}</style>

      </div>
    </GameShell>
  );
}

