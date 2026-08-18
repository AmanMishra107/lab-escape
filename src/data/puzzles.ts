export interface Puzzle {
  id: string;
  name: string;
  prompt: string;
  hint: string;
  answer: string[];
  reward: number;
  grants?: string;
}

export const PUZZLES: Puzzle[] = [
  {
    id: "caesar",
    name: "CAESAR CIPHER",
    prompt: "Decode: PHHW PH EB WKH ILUH HALW",
    hint: "Every letter walked three steps forward.",
    answer: ["meet me by the fire exit", "meetmebythefireexit"],
    reward: 220,
  },
  {
    id: "binary",
    name: "BINARY DECODE",
    prompt: "01000101 01011000 01001001 01010100",
    hint: "8 bits per character, ASCII.",
    answer: ["exit"],
    reward: 200,
    grants: "note",
  },
  {
    id: "password",
    name: "PROFESSOR'S PASSWORD",
    prompt: "4-digit code written on the whiteboard, in the corner nobody erases.",
    hint: "Room number of Lab 404, but backwards.",
    answer: ["4040", "404", "1404"],
    reward: 250,
    grants: "prof_password",
  },
  {
    id: "pattern",
    name: "PATTERN SEQUENCE",
    prompt: "2, 3, 5, 9, 17, 33, ?",
    hint: "Each step doubles the previous gap.",
    answer: ["65"],
    reward: 200,
  },
  {
    id: "hidden",
    name: "HIDDEN OBJECT",
    prompt: "Something in the lab is exactly one pixel wide. Find and click it, then type FOUND.",
    hint: "Look near the dead monitor's bottom-right corner.",
    answer: ["found"],
    reward: 180,
    grants: "chip",
  },
  {
    id: "terminal_seq",
    name: "TERMINAL SEQUENCE",
    prompt: "Run scan, then hack, then coffee in the terminal. Then type DONE here.",
    hint: "Order matters. The terminal is watching.",
    answer: ["done"],
    reward: 240,
    grants: "lab_key",
  },
];
