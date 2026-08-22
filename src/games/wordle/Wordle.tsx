import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "../GameShell";
import { BrutButton, Tag } from "../../components/ui/brut";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";

// ─── Word list (200 common 5-letter words) ──────────────────────────────────
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

const ALPHABET = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");
const MAX_GUESSES = 6;
const WORD_LEN = 5;

type LetterState = "correct" | "present" | "absent" | "empty" | "active";

interface Cell { letter: string; state: LetterState }

function makeEmptyRow(): Cell[] {
  return Array.from({ length: WORD_LEN }, () => ({ letter: "", state: "empty" as LetterState }));
}

function evaluateGuess(guess: string, target: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LEN).fill("absent");
  const targetArr = target.split("");
  const guessArr = guess.split("");
  // First pass: correct
  const remaining: string[] = [];
  guessArr.forEach((l, i) => {
    if (l === targetArr[i]) { result[i] = "correct"; targetArr[i] = "*"; }
    else remaining.push(targetArr[i]!);
  });
  // Second pass: present
  guessArr.forEach((l, i) => {
    if (result[i] === "correct") return;
    const idx = remaining.indexOf(l);
    if (idx !== -1) { result[i] = "present"; remaining.splice(idx, 1); }
  });
  return result;
}

const STATE_STYLE: Record<LetterState, string> = {
  correct: "bg-green-600 border-green-600 text-white",
  present: "bg-yellow-500 border-yellow-500 text-white",
  absent:  "bg-gray-600 border-gray-600 text-gray-300",
  empty:   "bg-card border-lab-ink text-foreground",
  active:  "bg-card border-lab-blue text-foreground",
};

const KEY_STYLE: Record<LetterState | "unused", string> = {
  correct: "bg-green-600 text-white",
  present: "bg-yellow-500 text-white",
  absent:  "bg-gray-700 text-gray-400",
  empty:   "bg-card text-foreground",
  active:  "bg-card text-foreground",
  unused:  "bg-card text-foreground",
};

export default function Wordle() {
  const answer = useMemo(() => WORDS[Math.floor(Math.random() * WORDS.length)]!, []);
  const [grid, setGrid] = useState<Cell[][]>(
    Array.from({ length: MAX_GUESSES }, makeEmptyRow),
  );
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset to a new word
  const reset = () => {
    // Reload component by parent key change — simplest approach here is to do a state reset trick
    window.location.reload(); // simplest way; a real reset would need a key prop on parent
  };

  const showMsg = (text: string) => {
    setMsg(text);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 2000);
  };

  const submit = useCallback(() => {
    if (currentCol < WORD_LEN) { showMsg("Not enough letters"); setShake(currentRow); setTimeout(() => setShake(null), 600); return; }
    const guessWord = grid[currentRow]!.map((c) => c.letter).join("");
    if (!WORDS.includes(guessWord)) { showMsg("Not in word list"); setShake(currentRow); setTimeout(() => setShake(null), 600); return; }

    const states = evaluateGuess(guessWord, answer);
    setGrid((prev) => {
      const ng = prev.map((row) => row.map((c) => ({ ...c })));
      states.forEach((s, i) => { ng[currentRow]![i]!.state = s; });
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
        showMsg(["GENIUS!", "MAGNIFICENT!", "IMPRESSIVE!", "SPLENDID!", "GREAT!", "PHEW!"][currentRow] ?? "NICE!");
      }, 300 * WORD_LEN);
    } else if (currentRow + 1 >= MAX_GUESSES) {
      setTimeout(() => {
        setGameOver(true);
        sound.play("error");
        store.submitGameResult("wordle", { score: 10, accuracy: 0, time: 1, completed: false });
        showMsg(`Answer: ${answer}`);
      }, 300 * WORD_LEN);
    }

    sound.play("click");
    setCurrentRow((r) => r + 1);
    setCurrentCol(0);
    store.interacted();
  }, [currentCol, currentRow, grid, answer]);

  const type = useCallback(
    (letter: string) => {
      if (gameOver || currentCol >= WORD_LEN) return;
      setGrid((prev) => {
        const ng = prev.map((row) => row.map((c) => ({ ...c })));
        ng[currentRow]![currentCol]!.letter = letter;
        ng[currentRow]![currentCol]!.state = "active";
        return ng;
      });
      setCurrentCol((c) => c + 1);
    },
    [gameOver, currentCol, currentRow],
  );

  const backspace = useCallback(() => {
    if (currentCol === 0) return;
    setGrid((prev) => {
      const ng = prev.map((row) => row.map((c) => ({ ...c })));
      ng[currentRow]![currentCol - 1]!.letter = "";
      ng[currentRow]![currentCol - 1]!.state = "empty";
      return ng;
    });
    setCurrentCol((c) => c - 1);
  }, [currentCol, currentRow]);

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") submit();
      else if (e.key === "Backspace") backspace();
      else if (/^[a-zA-Z]$/.test(e.key)) type(e.key.toUpperCase());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submit, backspace, type]);

  // Build keyboard letter → state map
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
            {won ? "WON" : gameOver ? "LOST" : `GUESS ${currentRow + 1}/${MAX_GUESSES}`}
          </Tag>
        </>
      }
      toolbar={
        <BrutButton variant="go" onClick={() => window.location.reload()}>NEW WORD</BrutButton>
      }
    >
      <div className="flex flex-col items-center gap-3 w-full select-none">
        {/* Rules */}
        <p className="mono-label text-xs opacity-60 text-center">
          Guess the 5-letter word in 6 tries. 🟩 = correct spot · 🟨 = wrong spot · ⬛ = not in word
        </p>

        {/* Toast message */}
        {msg && (
          <div className="brut bg-lab-ink text-lab-paper px-4 py-2 mono-label text-sm text-center">
            {msg}
          </div>
        )}

        {/* Grid */}
        <div className="flex flex-col gap-1">
          {grid.map((row, r) => (
            <div
              key={r}
              className="flex gap-1"
              style={{ animation: shake === r ? "shake 0.5s ease" : undefined }}
            >
              {row.map((cell, c) => (
                <div
                  key={c}
                  className={`flex items-center justify-center border-2 font-display text-2xl font-bold transition-all duration-300 ${STATE_STYLE[cell.state]}`}
                  style={{
                    width: "3.25rem",
                    height: "3.25rem",
                    transitionDelay: r < currentRow ? `${c * 100}ms` : "0ms",
                    transform: cell.letter && cell.state === "active" ? "scale(1.06)" : "scale(1)",
                  }}
                >
                  {cell.letter}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* On-screen keyboard */}
        <div className="flex flex-col gap-1 mt-2">
          {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((rowStr, ri) => (
            <div key={ri} className="flex gap-1 justify-center">
              {ri === 2 && (
                <button
                  onClick={submit}
                  className="brut brut-press mono-label px-2 py-2 text-xs bg-lab-green text-lab-ink"
                  style={{ minWidth: "3.5rem", height: "3.25rem" }}
                >
                  ENTER
                </button>
              )}
              {rowStr.split("").map((l) => (
                <button
                  key={l}
                  onClick={() => type(l)}
                  className={`brut brut-press mono-label font-bold ${KEY_STYLE[letterState[l] ?? "unused"]}`}
                  style={{ width: "2.25rem", height: "3.25rem", fontSize: "0.9rem" }}
                >
                  {l}
                </button>
              ))}
              {ri === 2 && (
                <button
                  onClick={backspace}
                  className="brut brut-press mono-label px-2 py-2 text-xs bg-card"
                  style={{ minWidth: "3.5rem", height: "3.25rem" }}
                >
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>

        {gameOver && (
          <div className="brut px-4 py-2 text-center" style={{ background: won ? "#22c55e" : "#ef4444" }}>
            <p className="mono-label font-bold text-white">{won ? `🎉 ${msg}` : `💀 ${answer} was the word`}</p>
          </div>
        )}
      </div>

      {/* Shake keyframe */}
      <style>{`
        @keyframes shake {
          0%,100%{ transform:translateX(0) }
          20%{ transform:translateX(-6px) }
          40%{ transform:translateX(6px) }
          60%{ transform:translateX(-6px) }
          80%{ transform:translateX(6px) }
        }
      `}</style>
    </GameShell>
  );
}
