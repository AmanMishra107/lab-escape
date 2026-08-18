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
  { name: "help", help: "list available commands" },
  { name: "clear", help: "clear the screen" },
  { name: "status", help: "lab system status" },
  { name: "games", help: "list installed games" },
  { name: "inventory", help: "list carried items" },
  { name: "achievements", help: "achievement progress" },
  { name: "score", help: "current score and XP" },
  { name: "time", help: "time remaining in this session" },
  { name: "about", help: "about LAB ESCAPE" },
  { name: "scan", help: "scan the room" },
  { name: "exit", help: "close the terminal" },
  { name: "sudo", hidden: true },
  { name: "hack", hidden: true },
  { name: "matrix", hidden: true },
  { name: "coffee", hidden: true },
  { name: "konami", hidden: true },
  { name: "iamroot", hidden: true },
  { name: "professor", hidden: true },
  { name: "42", hidden: true },
  { name: "devmode", hidden: true },
  { name: "settime", hidden: true },
  { name: "addxp", hidden: true },
  { name: "unlockall", hidden: true },
  { name: "showstate", hidden: true },
  { name: "resetgames", hidden: true },
  { name: "trigger", hidden: true },
];

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

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
    case "help":
      return [
        "AVAILABLE COMMANDS",
        ...COMMANDS.filter((c) => !c.hidden).map((c) => `  ${c.name.padEnd(14)}${c.help ?? ""}`),
        "",
        "(some commands are not listed. the lab keeps secrets.)",
      ];
    case "clear":
      return ["\u0000clear"];
    case "status":
      return [
        `PROFESSOR       ${store.getSnapshot().rt.professorActive ? "IN THE ROOM" : "AWAY"}`,
        "WIFI            CONNECTED (TECHNICALLY)",
        "ATTENDANCE      71%",
        `BOREDOM         ${Math.round(s.boredom)}%`,
        `PHASE           ${store.phase().toUpperCase()}`,
        `ESCAPE STATUS   ${s.puzzles.length >= 3 ? "POSSIBLE" : "UNLIKELY"}`,
      ];
    case "games":
      return ["INSTALLED GAMES", ...GAMES.map((g) => `  ${g.name.padEnd(16)}best: ${s.highScores[g.id] ?? 0}`)];
    case "inventory":
      return s.inventory.length
        ? ["CARRIED ITEMS", ...s.inventory.map((i) => `  ${ITEM_MAP.get(i)?.name ?? i}`)]
        : ["Your bag contains: crumbs."];
    case "achievements":
      return [`UNLOCKED ${s.achievements.length}/${ACHIEVEMENTS.length}`, ...s.achievements.map((a) => `  ✓ ${a}`)];
    case "score": {
      const lv = levelInfo(s.xp);
      return [`SCORE  ${s.score}`, `XP     ${s.xp}`, `LEVEL  ${String(lv.level).padStart(2, "0")} (${lv.into}/${lv.span})`];
    }
    case "time":
      return [`TIME REMAINING  ${fmt(store.remainingMs())}`, `SESSION LENGTH  ${fmt(s.durationMs)}`];
    case "about":
      return [
        "LAB ESCAPE v1.0 — LAB OS 0.98 SE",
        "A simulation of a college computer laboratory,",
        "including the boredom, which is the point.",
        "All hacking is fictional. No real systems were harmed.",
      ];
    case "scan":
      store.findEgg("terminal_scan");
      return ["SCANNING ROOM...", "1 professor (dormant)", "3 students (asleep)", "1 printer (hostile)", "1 you (questionable)"];
    case "exit":
      return ["\u0000exit"];
    case "sudo":
      store.unlock("sudoer");
      store.findEgg("sudo");
      sound.play("error");
      return ["student is not in the sudoers file.", "This incident has been reported to your parents."];
    case "hack":
      store.findEgg("terminal_hack");
      return ["HACKING...", "[####------] 40%", "[########--] 80%", "ACCESS DENIED BY LAB ASSISTANT"];
    case "matrix":
      store.unlock("matrix");
      store.findEgg("matrix");
      store.glitchBurst(1);
      return ["01010111 01000001 01001011 01000101", "There is no practical. There is only the loop."];
    case "coffee":
      store.findEgg("coffee");
      store.giveItem("coffee");
      store.reduceBoredom(15);
      return ["☕ dispensing...", "Coffee acquired. Hands slightly shaking."];
    case "konami":
      store.findEgg("konami");
      return ["↑ ↑ ↓ ↓ ← → ← → B A", "CHEAT MODE ENABLED (cosmetic only)"];
    case "iamroot":
      store.findEgg("iamroot");
      return ["No you're not.", "But that's the spirit."];
    case "professor":
      store.findEgg("professor_cmd");
      return ["PROFESSOR.EXE is already running in the background.", "It was never not running."];
    case "42":
      store.findEgg("answer_42");
      return ["Correct.", "Unfortunately the question was about pointer arithmetic."];
    case "devmode":
      store.setDevMode(!s.devMode);
      return [`DEVELOPER MODE ${!s.devMode ? "ENABLED" : "DISABLED"}`, "commands: settime <sec> | addxp <n> | unlockall | showstate | resetgames | trigger <professor|glitch>"];
    default:
      break;
  }

  if (!s.devMode) {
    sound.play("error");
    return [`'${cmd}' is not recognized as an internal or external command.`];
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
      return [`'${cmd}' is not recognized as an internal or external command.`];
  }
}
