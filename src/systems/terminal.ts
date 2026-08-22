import { ACHIEVEMENTS } from "../data/achievements";
import { GAMES } from "../data/games";
import { ITEM_MAP } from "../data/inventory";
import { store, levelInfo } from "./GameState";
import { sound } from "./SoundSystem";

export interface CommandSpec {
  name: string;
  help?: string;
  hidden?: boolean;
}

export const COMMANDS: CommandSpec[] = [
  // ── Core ──
  { name: "help",        help: "list available commands" },
  { name: "clear",       help: "clear the screen" },
  { name: "exit",        help: "close the terminal" },
  { name: "status",      help: "lab system status" },
  { name: "about",       help: "about LAB OS" },
  { name: "scan",        help: "scan the room for secrets" },
  { name: "motd",        help: "message of the day" },
  { name: "whoami",      help: "who even are you" },

  // ── Game ──
  { name: "games",       help: "list installed games" },
  { name: "inventory",   help: "list carried items" },
  { name: "achievements",help: "achievement progress" },
  { name: "score",       help: "current score and XP" },
  { name: "time",        help: "time remaining in this session" },

  // ── Student Productivity ──
  { name: "todo",        help: "todo add|list|done <n>|clear — your task list" },
  { name: "pomodoro",    help: "pomodoro [mins] — start a focus timer" },
  { name: "grade",       help: "grade <got> <total> — calculate % & letter grade" },
  { name: "gpa",         help: "gpa <score> [max=10] — calculate GPA + feedback" },
  { name: "attendance",  help: "check your attendance situation" },
  { name: "deadlines",   help: "upcoming deadlines (ominous)" },
  { name: "cheatsheet",  help: "cheatsheet <c|python|sql|git> — quick reference" },
  { name: "study",       help: "study <topic> — simulate studying anything" },

  // ── Chaos & Fun ──
  { name: "excuse",      help: "excuse [hw|late|absent] — generate a solid excuse" },
  { name: "compile",     help: "compile <filename> — compile something, probably" },
  { name: "git",         help: "git <commit|push|pull|status|blame> — fake git" },
  { name: "exam",        help: "exam <subject> — simulate exam anxiety" },
  { name: "viva",        help: "survive an oral examination" },
  { name: "panic",       help: "trigger full panic mode" },
  { name: "ping",        help: "ping <target> — ping anything" },
  { name: "neofetch",    help: "system info (aesthetic)" },
  { name: "fortune",     help: "receive a fortune cookie" },

  // ── Hidden Easter Eggs ──
  { name: "sudo",        hidden: true },
  { name: "hack",        hidden: true },
  { name: "matrix",      hidden: true },
  { name: "coffee",      hidden: true },
  { name: "konami",      hidden: true },
  { name: "iamroot",     hidden: true },
  { name: "professor",   hidden: true },
  { name: "42",          hidden: true },
  { name: "devmode",     hidden: true },
  { name: "settime",     hidden: true },
  { name: "addxp",       hidden: true },
  { name: "unlockall",   hidden: true },
  { name: "showstate",   hidden: true },
  { name: "resetgames",  hidden: true },
  { name: "trigger",     hidden: true },
  { name: "rm",          hidden: true },
  { name: "yolo",        hidden: true },
];

// ── In-memory TODO store ─────────────────────────────────────────
const todos: { text: string; done: boolean }[] = [];

// ── Pomodoro state ───────────────────────────────────────────────
let pomodoroEnd: number | null = null;

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

const fmtTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
};

// ── Helper arrays ────────────────────────────────────────────────
const EXCUSES = {
  hw: [
    "My laptop died right before I hit Submit. The charger also died. The outlet also died.",
    "I was going to submit it but I spent 3 hours debugging a semicolon.",
    "My internet said it uploaded. It lied.",
    "I thought the deadline was IST not UTC. Timezone is a social construct.",
    "I submitted on the wrong portal again. Third portal this semester.",
    "My dog ate my code. Actually my recursive function ate itself.",
    "Power went out. For 6 hours. In my room only.",
    "GitHub had an outage. I saw it on Twitter at 2 AM.",
  ],
  late: [
    "The bus driver also skipped class today. We're both struggling.",
    "I was early to the wrong building. Same situation.",
    "My alarm went off. I acknowledged it. We disagreed on the outcome.",
    "Traffic. (I walked.)",
    "I was answering emails. One was from LinkedIn. It felt urgent.",
  ],
  absent: [
    "I had a prior commitment: sleep.",
    "I attended spiritually. My notes attended physically, on behalf of me.",
    "Medical reasons. (Boredom-related.)",
    "I was present in a different class at this exact time, which is worse.",
    "My attendance is 75% exactly. This was a calculated sacrifice.",
  ],
};

const FORTUNES = [
  "Your code will compile on the first try. (Just kidding.)",
  "Today you will learn what a stack overflow actually means.",
  "The bug you seek is on line 1. You started checking from line 200.",
  "An unexpected semicolon will change your life today.",
  "Your future is bright. Your terminal is not — turn off the lights.",
  "The professor is reading your commit messages. Be professional.",
  "A segfault is just the universe asking you to slow down.",
  "You will meet someone interesting today: a null pointer.",
  "Every closed bracket you write brings you closer to enlightenment.",
  "git push origin main is not the same as backing up.",
  "The answer is always 42. The question is optional.",
  "Your viva examiner already knows you don't know the answer.",
];

const MOTIVATIONAL = [
  "ERROR: Giving up is not a valid operation in this context.",
  "rm -rf self-doubt && apt install confidence",
  "Your GPA is a local variable. Your knowledge is global.",
  "Even Linus Torvalds was a student once. He was probably also confused.",
  "Segfault means you cared enough to reach the limits of memory.",
  "print('keep going') — and you should.",
  "sudo make me a better student  →  sudo: cannot grant yourself wisdom",
  "The best code you'll write today hasn't been written yet.",
  "Your compiler doesn't judge you. Your professor does, but not the compiler.",
  "404: Excuses not found. Start the assignment.",
];

const DEADLINES = [
  { subject: "DBMS Lab File",         due: "YESTERDAY",    status: "CRITICAL" },
  { subject: "OS Assignment #3",      due: "TODAY 11:59PM", status: "DANGER"   },
  { subject: "Networks Viva Prep",    due: "TOMORROW 9AM",  status: "WARNING"  },
  { subject: "Mini Project Report",   due: "IN 3 DAYS",     status: "WARNING"  },
  { subject: "Internship Form",       due: "IN 7 DAYS",     status: "OK"       },
  { subject: "Attendance Shortage",   due: "ALREADY DONE",  status: "FATAL"    },
];

const COMPILE_ERRORS: Record<string, string[]> = {
  success: [
    "Compiling... done.",
    "0 errors, 0 warnings.",
    "Output: a.out (3.2 MB)",
    "[SUCCESS] Build complete.",
  ],
  error: [
    "error: expected ';' before '}' token",
    "error: 'variable' was not declared in this scope",
    "error: too many arguments to function 'main'",
    "warning: implicit declaration of function 'printf'",
    "warning: comparison between signed and unsigned integer",
    "[FAILED] Build failed. 4 errors, 2 warnings.",
  ],
  linker: [
    "Compiling... done.",
    "Linking...",
    "undefined reference to 'main'",
    "collect2: error: ld returned 1 exit status",
    "[FAILED] Linker error. Did you forget main()?",
  ],
};

const GIT_RESPONSES: Record<string, string[]> = {
  commit: [
    'hint: Waiting for your editor to close the file...',
    '[main 4f7d2a1] "final final FINAL v3 (actually final)"',
    " 3 files changed, 47 insertions(+), 2 deletions(-)",
  ],
  push: [
    "Enumerating objects: 5, done.",
    "Counting objects: 100% (5/5), done.",
    "Writing objects: 100% (3/3), praying...",
    "remote: Resolving deltas: 100% (1/1), done.",
    "Branch 'main' → 'origin/main' ✓",
  ],
  pull: [
    "remote: Enumerating objects: 12, done.",
    "Updating 9a1b2c3..f4e5d6e",
    "Fast-forward",
    " assignment.c | 48 ++++++++++++++++++++++++",
    " (your version was behind by 2 commits. as usual.)",
  ],
  status: [
    "On branch main",
    "Your branch is ahead of 'origin/main' by 1 commit.",
    "  (use 'git push' to publish your local commits)",
    "",
    "Changes not staged for commit:",
    "  modified:   assignment.c  (you forgot to add this)",
    "  modified:   README.md     (you didn't update this)",
    "",
    "Untracked files:",
    "  a.out",
    "  final_v2_REAL.c",
    "  final_v3_THIS_ONE.c",
  ],
  blame: [
    "^a1b2c3 (You      2024-01-15 23:58:42 +0530  1) // TODO: fix this",
    "^a1b2c3 (You      2024-01-15 23:58:43 +0530  2) // TODO: fix the other thing",
    "^a1b2c3 (You      2024-02-28 02:12:00 +0530  3) int i = 0; // this was a mistake",
    "^b3c4d5 (You      2024-03-01 04:00:01 +0530  4) // I should sleep",
    "",
    "git blame confirms: it was all you.",
  ],
};

const CHEATSHEETS: Record<string, string[]> = {
  c: [
    "═══ C QUICK REFERENCE ═══════════════════════════",
    "  int main() { return 0; }    // every program",
    "  printf(\"%d\\n\", n);           // print integer",
    "  scanf(\"%d\", &n);             // read integer (& !)",
    "  malloc(n * sizeof(int))      // allocate array",
    "  free(ptr)                    // don't forget!",
    "  for (int i=0; i<n; i++) {}   // classic loop",
    "  #include <stdio.h>           // always forgotten",
    "  struct Node { int val; struct Node* next; }",
    "═════════════════════════════════════════════════",
  ],
  python: [
    "═══ PYTHON QUICK REFERENCE ══════════════════════",
    "  print(f'Hello {name}')       // f-string",
    "  [x for x in lst if x > 0]   // list comprehension",
    "  dict.get(key, default)       // safe dict access",
    "  with open('f.txt') as f:     // file handling",
    "  lambda x: x * 2             // anonymous func",
    "  *args, **kwargs              // flexible params",
    "  enumerate(lst)               // index + value",
    "  zip(a, b)                    // pair two lists",
    "  sorted(lst, key=lambda x:x)  // custom sort",
    "═════════════════════════════════════════════════",
  ],
  sql: [
    "═══ SQL QUICK REFERENCE ═════════════════════════",
    "  SELECT * FROM table WHERE cond ORDER BY col",
    "  INSERT INTO t (col) VALUES (val)",
    "  UPDATE t SET col=val WHERE cond",
    "  DELETE FROM t WHERE cond",
    "  JOIN: INNER / LEFT / RIGHT / FULL OUTER",
    "  GROUP BY col HAVING COUNT(*) > 1",
    "  CREATE TABLE t (id INT PRIMARY KEY, ...)",
    "  ALTER TABLE t ADD COLUMN col TYPE",
    "  TRUNCATE TABLE t    -- fast delete all",
    "═════════════════════════════════════════════════",
  ],
  git: [
    "═══ GIT QUICK REFERENCE ═════════════════════════",
    "  git init                      // start repo",
    "  git clone <url>               // clone repo",
    "  git add . && git commit -m '' // stage & commit",
    "  git push origin main          // push (pray)",
    "  git pull                      // get updates",
    "  git status                    // what did I break",
    "  git log --oneline             // history",
    "  git diff                      // see changes",
    "  git branch <name>             // new branch",
    "  git stash && git stash pop    // save/restore",
    "═════════════════════════════════════════════════",
  ],
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

let sequence: string[] = [];

export function runCommand(raw: string): string[] {
  const input = raw.trim().replace(/\s+/g, " ");
  if (!input) return [];
  const [cmd, ...args] = input.toLowerCase().split(" ");
  const s = store.getSnapshot().save;
  store.interacted();
  store.getSnapshot().save.stats.commands += 1;
  if (store.getSnapshot().save.stats.commands >= 10) store.unlock("hacker");
  store.reduceBoredom(1.5);

  sequence = [...sequence, cmd!].slice(-3);
  if (sequence.join(",") === "scan,hack,coffee") store.giveItem("lab_key");

  switch (cmd) {

    // ══════════ CORE ══════════════════════════════════════════════
    case "help":
      return [
        "╔══════════════════════════════════════════════╗",
        "║          LAB OS — COMMAND REFERENCE          ║",
        "╠══════════════════════════════════════════════╣",
        ...COMMANDS.filter((c) => !c.hidden).map(
          (c) => `  ${c.name.padEnd(14)} ${c.help ?? ""}`
        ),
        "╠══════════════════════════════════════════════╣",
        "║  Some commands are hidden. Experiment.       ║",
        "╚══════════════════════════════════════════════╝",
      ];

    case "clear":
      return ["\u0000clear"];

    case "exit":
      return ["\u0000exit"];

    case "status":
      return [
        "┌─ LAB SYSTEM STATUS ─────────────────────────┐",
        `│ PROFESSOR       ${(store.getSnapshot().rt.professorActive ? "⚠ IN THE ROOM   " : "✓ AWAY          ")}│`,
        "│ WIFI            ✓ CONNECTED (technically)    │",
        `│ ATTENDANCE      ${String(Math.floor(60 + Math.random() * 20) + "%").padEnd(6)} ${Math.random() > 0.5 ? "⚠ DANGEROUSLY LOW" : "✓ BARELY SAFE   "}│`,
        `│ BOREDOM         ${String(Math.round(s.boredom) + "%").padEnd(30)}│`,
        `│ PHASE           ${s.puzzles.length >= 3 ? "ESCAPE POSSIBLE ✓" : "STILL TRAPPED   "}         │`,
        "└──────────────────────────────────────────────┘",
      ];

    case "about":
      return [
        "LAB ESCAPE v1.0 — LAB OS 0.98 SE",
        "A simulation of a college computer laboratory.",
        "Including the dread, which is the point.",
        "",
        "Built with React + TypeScript + Sheer Despair.",
        "All hacking is fictional. No real GPAs were harmed.",
        "",
        `Running since: ${fmtTime()} (felt like longer)`,
      ];

    case "scan":
      store.findEgg("terminal_scan");
      return [
        "SCANNING ENVIRONMENT...",
        "",
        "  [✓] 1 professor .............. dormant (danger: MEDIUM)",
        "  [✓] 3 students ............... asleep (danger: NONE)",
        "  [✓] 1 printer ................ hostile (danger: HIGH)",
        "  [✓] 1 WiFi router ............ throttled (danger: LOW)",
        "  [✓] 1 projector .............. off (danger: UNKNOWN)",
        "  [?] you ...................... questionable (danger: TO SELF)",
        "",
        "SCAN COMPLETE. No threats detected you can't handle.",
      ];

    case "whoami":
      return [
        `  UID=404(student) GID=0(confused) groups=0(confused)`,
        "  Currently: enrolled",
        "  Actually: surviving",
        "  Professionally: learning",
        "  Emotionally: it's fine",
        "",
        `  Session uptime: ${fmtTime()}`,
      ];

    case "motd":
      return [
        "┌─ MESSAGE OF THE DAY ─────────────────────────┐",
        `│ ${pick(MOTIVATIONAL).padEnd(44)} │`,
        "└──────────────────────────────────────────────┘",
      ];

    // ══════════ GAME ══════════════════════════════════════════════
    case "games":
      return [
        "INSTALLED GAMES",
        "───────────────",
        ...GAMES.map(
          (g) => `  ${g.name.padEnd(18)} best: ${String(s.highScores[g.id] ?? 0).padStart(6)}`
        ),
      ];

    case "inventory":
      return s.inventory.length
        ? ["CARRIED ITEMS:", ...s.inventory.map((i) => `  › ${ITEM_MAP.get(i)?.name ?? i}`)]
        : ["Your bag contains: anxiety, crumbs, and a USB with no label."];

    case "achievements":
      return [
        `ACHIEVEMENTS: ${s.achievements.length}/${ACHIEVEMENTS.length} unlocked`,
        "───────────────",
        ...s.achievements.map((a) => `  [✓] ${a}`),
        ...(s.achievements.length < ACHIEVEMENTS.length
          ? [`  [ ] ...${ACHIEVEMENTS.length - s.achievements.length} more hidden`]
          : ["  All achievements unlocked. You are the one."]),
      ];

    case "score": {
      const lv = levelInfo(s.xp);
      return [
        "┌─ YOUR STATS ─────────────────────────────────┐",
        `│  SCORE   ${String(s.score).padEnd(35)}│`,
        `│  XP      ${String(s.xp).padEnd(35)}│`,
        `│  LEVEL   ${String(lv.level).padEnd(35)}│`,
        `│  PROGRESS [${("█".repeat(Math.floor((lv.into / lv.span) * 20))).padEnd(20)}] ${lv.into}/${lv.span}  │`,
        "└──────────────────────────────────────────────┘",
      ];
    }

    case "time":
      return [
        `  TIME REMAINING   ${fmt(store.remainingMs())}`,
        `  SESSION LENGTH   ${fmt(s.durationMs)}`,
        store.remainingMs() < 300000
          ? "  ⚠ LESS THAN 5 MINUTES — CONSIDER YOUR LIFE CHOICES"
          : "  ✓ Plenty of time to not do the assignment.",
      ];

    // ══════════ STUDENT PRODUCTIVITY ══════════════════════════════

    case "todo": {
      const sub = args[0];
      if (!sub || sub === "list") {
        if (todos.length === 0) return ["Your TODO list is empty. Add something: todo add <task>"];
        return [
          `TODO LIST (${todos.filter(t => !t.done).length} remaining)`,
          "───────────────",
          ...todos.map((t, i) => `  ${t.done ? "[✓]" : "[ ]"} ${i + 1}. ${t.text}`),
        ];
      }
      if (sub === "add") {
        const task = args.slice(1).join(" ");
        if (!task) return ["Usage: todo add <task description>"];
        todos.push({ text: task, done: false });
        return [`  [+] Added: "${task}" (${todos.length} total)`];
      }
      if (sub === "done") {
        const n = parseInt(args[1] ?? "");
        if (!n || n < 1 || n > todos.length) return [`  Usage: todo done <number 1-${todos.length}>`];
        todos[n - 1]!.done = true;
        return [`  [✓] Marked done: "${todos[n - 1]!.text}"`, "  Look at you, achieving things."];
      }
      if (sub === "clear") {
        const count = todos.length;
        todos.length = 0;
        return [`  Cleared ${count} tasks. Fresh start. You've earned nothing yet.`];
      }
      return ["Usage: todo list | todo add <task> | todo done <n> | todo clear"];
    }

    case "pomodoro": {
      const mins = parseInt(args[0] ?? "25");
      const validMins = Number.isFinite(mins) && mins > 0 ? Math.min(mins, 120) : 25;
      pomodoroEnd = Date.now() + validMins * 60 * 1000;
      return [
        `🍅 POMODORO STARTED — ${validMins} minute session`,
        "───────────────────────────────────────────────",
        "  Focus rules:",
        "  1. No social media (yes, LinkedIn counts)",
        "  2. Close all YouTube tabs (you know which ones)",
        "  3. No bathroom breaks until 5 min mark",
        "",
        `  End time: ${new Date(pomodoroEnd).toLocaleTimeString()}`,
        "  Type 'pomodoro' again to check time remaining.",
        ...(pomodoroEnd && Date.now() < pomodoroEnd
          ? [`  ⏱ ${Math.ceil((pomodoroEnd - Date.now()) / 60000)} min remaining`]
          : []),
      ];
    }

    case "grade": {
      const got = parseFloat(args[0] ?? "");
      const total = parseFloat(args[1] ?? "100");
      if (!Number.isFinite(got) || !Number.isFinite(total) || total <= 0)
        return ["Usage: grade <marks_obtained> <total_marks>", "  e.g.: grade 67 100"];
      const pct = (got / total) * 100;
      const letter =
        pct >= 90 ? "O (Outstanding)" :
        pct >= 80 ? "A+ (Excellent)"  :
        pct >= 70 ? "A  (Very Good)"  :
        pct >= 60 ? "B+ (Good)"       :
        pct >= 55 ? "B  (Above Avg)"  :
        pct >= 50 ? "C  (Average)"    :
        pct >= 40 ? "P  (Pass)"       : "F  (Study harder)";
      const comment =
        pct >= 90 ? "Show-off. (Respect.)" :
        pct >= 70 ? "Solid. Your parents can stop worrying." :
        pct >= 50 ? "Passed. We don't talk about how." :
        pct >= 40 ? "Technically passed. Don't push it." : "The exam fought back and won.";
      return [
        `  Marks: ${got}/${total}`,
        `  Score: ${pct.toFixed(2)}%`,
        `  Grade: ${letter}`,
        `  Note:  ${comment}`,
      ];
    }

    case "gpa": {
      const score = parseFloat(args[0] ?? "");
      const max = parseFloat(args[1] ?? "10");
      if (!Number.isFinite(score) || !Number.isFinite(max) || max <= 0)
        return ["Usage: gpa <score> [max=10]", "  e.g.: gpa 7.8  or  gpa 3.4 4"];
      const pct = (score / max) * 100;
      const comment =
        pct >= 90 ? "Topper. We see you. We are both impressed and annoyed." :
        pct >= 75 ? "Solid performer. Future employment possible." :
        pct >= 60 ? "Comfortable. Not thriving, not drowning." :
        pct >= 50 ? "Surviving. Respect. Barely, but respect." :
        pct >= 40 ? "Attendance is saving you right now. Probably." :
                    "Recovery mode. You can still do this. Maybe. Yes.";
      return [
        `  GPA:    ${score} / ${max}`,
        `  As %:   ${pct.toFixed(1)}%`,
        `  Status: ${comment}`,
        "",
        pct < 50
          ? "  TIP: git commit -m 'fix: actually study'"
          : "  TIP: git push — you're already ahead.",
      ];
    }

    case "attendance": {
      const pct = 60 + Math.floor(Math.random() * 30);
      const status =
        pct >= 80 ? "✓ SAFE — stop worrying" :
        pct >= 75 ? "⚠ BORDERLINE — attend next class" :
        "✗ DANGER — the registrar knows your name";
      return [
        "┌─ ATTENDANCE MODULE ──────────────────────────┐",
        "│  Subject           Attended  Total   %       │",
        `│  Data Structures   ${String(18+Math.floor(Math.random()*4)).padEnd(9)} 22      ${pct}%     │`,
        `│  OS & Networks     ${String(16+Math.floor(Math.random()*4)).padEnd(9)} 22      ${pct-3}%     │`,
        `│  DBMS              ${String(19+Math.floor(Math.random()*3)).padEnd(9)} 22      ${pct+2}%     │`,
        `│  Maths IV          ${String(15+Math.floor(Math.random()*5)).padEnd(9)} 22      ${pct-5}%     │`,
        "╠══════════════════════════════════════════════╣",
        `│  OVERALL: ${String(pct + "%").padEnd(8)} Status: ${status.padEnd(18)}│`,
        "└──────────────────────────────────────────────┘",
      ];
    }

    case "deadlines":
      return [
        "┌─ UPCOMING DEADLINES ─────────────────────────┐",
        "│  Subject                Due          Status  │",
        "│  ─────────────────────────────────────────── │",
        ...DEADLINES.map(
          d => `│  ${d.subject.padEnd(23)} ${d.due.padEnd(13)} ${d.status.padEnd(8)}│`
        ),
        "╠══════════════════════════════════════════════╣",
        "│  Reminder: 'I'll do it tomorrow' is a lie.  │",
        "└──────────────────────────────────────────────┘",
      ];

    case "cheatsheet": {
      const lang = args[0];
      if (!lang || !(lang in CHEATSHEETS))
        return [
          "Usage: cheatsheet <c|python|sql|git>",
          "  e.g.: cheatsheet python",
        ];
      return CHEATSHEETS[lang]!;
    }

    case "study": {
      const topic = args.join(" ") || "everything";
      const bars = ["[          ]", "[██        ]", "[████      ]", "[██████    ]", "[████████  ]", "[██████████]"];
      const result = Math.random();
      const outcome =
        result > 0.7 ? "understood most of it. Growth!" :
        result > 0.4 ? "understood some of it. Progress." :
        result > 0.2 ? "understood nothing. Blame the textbook." :
                       "accidentally fell asleep. Classic.";
      return [
        `  Studying: ${topic.toUpperCase()}`,
        `  Reading...  ${bars[1]}`,
        `  Absorbing.. ${bars[3]}`,
        `  Retaining.. ${bars[5]}`,
        "",
        `  Result: You ${outcome}`,
        `  +${Math.floor(result * 50)} XP (spiritual)`,
      ];
    }

    // ══════════ CHAOS & FUN ════════════════════════════════════════

    case "excuse": {
      const type = (args[0] as keyof typeof EXCUSES) ?? "hw";
      const pool = EXCUSES[type] ?? EXCUSES.hw;
      return [
        `GENERATED EXCUSE (type: ${type})`,
        "───────────────────────────────────────────────",
        `  "${pick(pool)}"`,
        "",
        "  Disclaimer: Highly plausible. Completely yours.",
      ];
    }

    case "compile": {
      const file = args[0] ?? "assignment.c";
      const roll = Math.random();
      const variant = roll > 0.6 ? "success" : roll > 0.3 ? "error" : "linker";
      return [
        `  gcc -Wall -o a.out ${file}`,
        ...COMPILE_ERRORS[variant]!,
      ];
    }

    case "git": {
      const sub = args[0];
      if (!sub || !(sub in GIT_RESPONSES))
        return [
          "Usage: git <commit|push|pull|status|blame>",
          "",
          "  git status    — see what's broken",
          "  git commit    — pretend to have done work",
          "  git push      — pray",
          "  git pull      — absorb others' chaos",
          "  git blame     — it was you. it's always you.",
        ];
      return GIT_RESPONSES[sub]!;
    }

    case "exam": {
      const subject = args.join(" ") || "everything";
      return [
        `EXAM MODE — ${subject.toUpperCase()}`,
        "═══════════════════════════════════════════════",
        "  Q1: Define the concept you forgot to study.",
        "  Q2: Write a program that definitely has bugs.",
        "  Q3: Prove that P = NP (worth 2 marks).",
        "  Q4: Explain your life choices. Be specific.",
        "  Q5: State and prove anything. (10 marks)",
        "═══════════════════════════════════════════════",
        "  Time remaining: 5 minutes (subjectively: 2 seconds)",
        "  Pages remaining: 8 (you've written 0.5)",
        "",
        "  [TIP] Write something on every page. Ink shows effort.",
      ];
    }

    case "viva": {
      const questions = [
        "What is the time complexity of your code?",
        "Why did you use a global variable here?",
        "Can you explain this line? *points at most complex line*",
        "What would happen if n was 0?",
        "Why didn't you handle the edge case?",
        "Have you tested this?",
        "What does this function return when input is null?",
      ];
      return [
        "VIVA SIMULATION — EXAMINER v2.1",
        "═══════════════════════════════════════════════",
        `  "${pick(questions)}"`,
        "",
        "  You: ...",
        "  You: (sweating)",
        "  You: 'So basically what happens is—'",
        "  Examiner: *writes something. you can't see what.*",
        "",
        "  Result: SURVIVED (score unknown until results day)",
      ];
    }

    case "panic":
      store.glitchBurst(1);
      return [
        "⚠⚠⚠  PANIC MODE ACTIVATED  ⚠⚠⚠",
        "═══════════════════════════════════════════════",
        "  STEP 1: Breathe. (In. Out. Again.)",
        "  STEP 2: Open the assignment. Just open it.",
        "  STEP 3: Type something. Anything. A comment counts.",
        "  STEP 4: The deadline is still in the future. For now.",
        "  STEP 5: You've survived every bad day so far. This too.",
        "═══════════════════════════════════════════════",
        "  Panic level: NOMINAL (you're going to be fine)",
      ];

    case "ping": {
      const target = args.join(" ") || "8.8.8.8";
      const isProfessor = target.includes("professor");
      if (isProfessor) {
        return [
          `  PING professor.edu (192.168.1.1)`,
          "  56 bytes from professor: time=0.3ms  (reading your screen)",
          "  56 bytes from professor: time=0.2ms  (grading in real-time)",
          "  56 bytes from professor: TIMEOUT     (went for chai)",
          "",
          "  --- professor ping statistics ---",
          "  3 packets transmitted, 2 received, 33% packet loss",
          "  Recommendation: wait for chai break before submitting late work.",
        ];
      }
      const ms = () => (1 + Math.random() * 50).toFixed(1);
      return [
        `  PING ${target} (93.184.216.34)`,
        `  64 bytes from ${target}: time=${ms()}ms`,
        `  64 bytes from ${target}: time=${ms()}ms`,
        `  64 bytes from ${target}: time=${ms()}ms`,
        "",
        `  --- ${target} ping statistics ---`,
        "  3 packets transmitted, 3 received, 0% packet loss",
        "  Connection stable. Your code, however, is not.",
      ];
    }

    case "neofetch":
      return [
        "  ██████████   student@lab-404",
        "  ██░░░░░░██   ─────────────────────────",
        "  ██░██░░░██   OS:       LAB OS 0.98 SE",
        "  ██░░░██░██   KERNEL:   anxiety 5.15.0",
        "  ██░░░░░░██   UPTIME:   3 semesters",
        "  ██░░░░░░██   SHELL:    lab-terminal v2",
        "  ██████████   MEMORY:   overcommitted",
        "              CPU:      sleep-deprived",
        "              BATTERY:  18% (like attendance)",
        "              MOOD:     404 Not Found",
      ];

    case "fortune":
      store.findEgg("fortune");
      return [
        "╔══════════════════════════════════════════════╗",
        `║  ${pick(FORTUNES).padEnd(44)}║`,
        "╚══════════════════════════════════════════════╝",
      ];

    // ══════════ HIDDEN EASTER EGGS ════════════════════════════════
    case "sudo":
      store.unlock("sudoer");
      store.findEgg("sudo");
      sound.play("error");
      return [
        "  sudo: student is not in the sudoers file.",
        "  This incident will be reported to your parents.",
        "  And your department head.",
        "  And probably the university.",
      ];

    case "hack":
      store.findEgg("terminal_hack");
      return [
        "  INITIALIZING HACK SEQUENCE...",
        "  [████------] 40% — bypassing firewall",
        "  [████████--] 80% — injecting payload",
        "  [██████████] 100% —",
        "",
        "  ACCESS DENIED by Lab Assistant (IP: 10.0.0.1)",
        "  Your typing speed has been noted.",
      ];

    case "matrix":
      store.unlock("matrix");
      store.findEgg("matrix");
      store.glitchBurst(1);
      return [
        "  01010111 01000001 01001011 01000101",
        "  Wake up, student...",
        "  The Matrix has your GPA.",
        "  There is no practical. There is only the loop.",
        "  Choose: Red pill (study) | Blue pill (sleep)",
      ];

    case "coffee":
      store.findEgg("coffee");
      store.giveItem("coffee");
      store.reduceBoredom(15);
      return [
        "  ☕ COFFEE DISPENSED",
        "  Hands: slightly shaking ✓",
        "  Productivity: +47% (temporary)",
        "  Crash ETA: 90 minutes",
      ];

    case "konami":
      store.findEgg("konami");
      return [
        "  ↑ ↑ ↓ ↓ ← → ← → B A",
        "  CHEAT MODE ENABLED",
        "  (cosmetic only — your GPA remains unchanged)",
      ];

    case "iamroot":
      store.findEgg("iamroot");
      return [
        "  No you're not.",
        "  But the ambition is noted.",
        "  Try: sudo iamroot",
      ];

    case "professor":
      store.findEgg("professor_cmd");
      return [
        "  PROFESSOR.EXE is already running in the background.",
        "  It was never not running.",
        "  Memory usage: 100% of your anxiety.",
      ];

    case "42":
      store.findEgg("answer_42");
      return [
        "  Correct.",
        "  Unfortunately, the question was about pointer arithmetic.",
        "  The answer is still 42. The marks are not.",
      ];

    case "rm":
      store.findEgg("rm_rf");
      return [
        "  rm: refusing to remove '.' — cowardice enabled",
        "  rm: refusing to remove '/grades' — PERMISSION DENIED",
        "  rm: 'bad_memories' removed ✓",
      ];

    case "yolo":
      store.findEgg("yolo");
      store.reduceBoredom(20);
      return [
        "  YOLO MODE ENGAGED",
        "  All consequences are theoretical.",
        "  Submitting assignment without testing: ✓",
        "  Pushing directly to main: ✓",
        "  Taking attendance then leaving: ✓",
        "  Boredom reduced. Consequences pending.",
      ];

    case "devmode":
      store.setDevMode(!s.devMode);
      return [
        `DEVELOPER MODE ${!s.devMode ? "ENABLED" : "DISABLED"}`,
        "Commands: settime <sec> | addxp <n> | unlockall | showstate | resetgames | trigger <professor|glitch>",
      ];

    default:
      break;
  }

  if (!s.devMode) {
    sound.play("error");
    return [
      `  '${cmd}': command not found`,
      "  Type 'help' for available commands.",
    ];
  }

  switch (cmd) {
    case "settime": {
      const sec = Number(args[0]);
      if (!Number.isFinite(sec) || sec <= 0) return ["usage: settime <seconds>"];
      store.setDuration(sec * 1000);
      return [`session length set to ${sec}s`];
    }
    case "addxp": {
      const n = Number(args[0]);
      if (!Number.isFinite(n) || n <= 0) return ["usage: addxp <amount>"];
      store.addXp(n, "developer grant");
      return [`+${n} xp`];
    }
    case "unlockall":
      ACHIEVEMENTS.forEach((a) => store.unlock(a.id));
      return ["all achievements unlocked"];
    case "showstate":
      return [
        `phase=${store.phase()} remaining=${fmt(store.remainingMs())}`,
        `xp=${s.xp} score=${s.score} level=${levelInfo(s.xp).level}`,
        `eggs=${s.eggs.length} puzzles=${s.puzzles.length} items=${s.inventory.length}`,
        `discovered=${s.discovered.join(",") || "none"}`,
      ];
    case "resetgames":
      return ["high scores cleared"];
    case "trigger":
      if (args[0] === "glitch") {
        store.glitchBurst(1);
        return ["glitch triggered"];
      }
      if (args[0] === "professor") {
        store.setRt({ professorActive: true });
        setTimeout(() => store.setRt({ professorActive: false }), 3000);
        return ["professor triggered"];
      }
      return ["usage: trigger <professor|glitch>"];
    default:
      sound.play("error");
      return [`'${cmd}': command not found`];
  }
}
