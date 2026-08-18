export interface RandomEvent {
  id: string;
  title: string;
  body: string;
  weight: number;
  kind: "system" | "warn";
  minPhase?: 0 | 1 | 2 | 3;
}

export const RANDOM_EVENTS: RandomEvent[] = [
  { id: "wifi", title: "WIFI DISCONNECTED", body: "Reconnecting... Connected. Technically.", weight: 5, kind: "warn" },
  { id: "assignment", title: "ASSIGNMENT REMINDER", body: "Practical file due in a duration you will not enjoy.", weight: 4, kind: "warn" },
  { id: "code", title: "SOMEONE ASKED FOR THE CODE", body: "'just send the output bro, I'll change variable names'", weight: 5, kind: "system" },
  { id: "error", title: "UNEXPECTED ERROR", body: "Error 0x4C41: cause unknown, blame the lab assistant.", weight: 3, kind: "warn" },
  { id: "coffee", title: "COFFEE BREAK", body: "The machine on floor 2 is working. This is historic news.", weight: 3, kind: "system" },
  { id: "assistant", title: "LAB ASSISTANT ENTERED", body: "He is looking at your screen. He is not reading it.", weight: 4, kind: "system", minPhase: 1 },
  { id: "power", title: "POWER FLICKER", body: "Lights dim. Three students gasp. One saves their file.", weight: 3, kind: "warn", minPhase: 2 },
  { id: "update", title: "SYSTEM UPDATE", body: "Windows 98 SE would like to restart. It cannot. It never could.", weight: 3, kind: "system" },
  { id: "unknown", title: "UNKNOWN MESSAGE", body: "Your phone buzzed. Nobody has your number.", weight: 2, kind: "warn", minPhase: 2 },
  { id: "attendance", title: "ATTENDANCE UPDATE", body: "Attendance: 71%. Required: 75%. Mood: declining.", weight: 4, kind: "warn" },
  { id: "fan", title: "CEILING FAN NOISE", body: "The fan has changed pitch. Nobody knows why.", weight: 2, kind: "system", minPhase: 2 },
  { id: "printer", title: "PRINTER ACTIVITY", body: "Printer 2 printed a page. Nobody sent anything.", weight: 2, kind: "warn", minPhase: 1 },
];
