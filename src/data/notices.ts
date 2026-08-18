export interface Notice {
  title: string;
  body: string;
  sign: string;
  tone: "normal" | "warn" | "chaos";
}

export const NOTICES: Notice[] = [
  {
    title: "NOTICE",
    body: "Students are strictly prohibited from sleeping during practicals. Sitting upright with your eyes closed is also being monitored.",
    sign: "— Management",
    tone: "normal",
  },
  {
    title: "IMPORTANT",
    body: "The WiFi password has been changed. Please ask nobody.",
    sign: "— Network Dept.",
    tone: "normal",
  },
  {
    title: "ATTENDANCE UPDATE",
    body: "Your attendance has been emotionally reviewed. Current: 71%. Required: 75%. Professor's opinion: 'Interesting.'",
    sign: "— Records Office",
    tone: "warn",
  },
  {
    title: "LAB RULES",
    body: "1. Do not eat in the lab.\n2. Do not drink in the lab.\n3. Do not exist loudly in the lab.",
    sign: "— Lab Assistant",
    tone: "normal",
  },
  {
    title: "SYSTEM MAINTENANCE",
    body: "Systems 4, 7 and 12 are under maintenance. They have been under maintenance since 2019.",
    sign: "— Technical Team",
    tone: "normal",
  },
  {
    title: "LOST & FOUND",
    body: "Found: one USB drive, one calculator, one student's will to live. Claim at the front desk.",
    sign: "— Front Desk",
    tone: "warn",
  },
  {
    title: "⚠ WARNING",
    body: "Printer 2 prints things nobody sent. Do not engage. Do not read the output. Definitely do not press PRINT three times.",
    sign: "— Anonymous",
    tone: "chaos",
  },
  {
    title: "FIRE SAFETY",
    body: "In case of emergency, the rear exit may be used. Access code is written somewhere in this room. Good luck.",
    sign: "— Safety Committee",
    tone: "chaos",
  },
  {
    title: "SEMINAR",
    body: "'Time Management For Students' — cancelled due to scheduling conflict.",
    sign: "— Dept. of Irony",
    tone: "normal",
  },
  {
    title: "NOTICE",
    body: "Assignment status: 99% complete. Missing: submission.",
    sign: "— Automated Reminder",
    tone: "warn",
  },
  {
    title: "!! LAB SESSION ENDING !!",
    body: "All students must vacate. The professor is walking this way. Pack your bag. Act natural.",
    sign: "— The Room Itself",
    tone: "chaos",
  },
];
