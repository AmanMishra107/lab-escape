export interface ChatMessage {
  from: "them" | "me";
  text: string;
  time: string;
}

export interface Contact {
  id: string;
  name: string;
  subtitle: string;
  messages: ChatMessage[];
  replies: string[];
  secret?: boolean;
}

export const CONTACTS: Contact[] = [
  {
    id: "ashwin",
    name: "Ashwin",
    subtitle: "sitting two seats away",
    messages: [
      { from: "them", text: "bro are you in lab", time: "10:02" },
      { from: "me", text: "i am literally next to you", time: "10:02" },
      { from: "them", text: "yeah but typing is easier", time: "10:03" },
      { from: "them", text: "did sir take attendance", time: "10:11" },
      { from: "them", text: "he took it. emotionally.", time: "10:14" },
    ],
    replies: ["yes", "no", "i'm cooked", "ask someone else"],
  },
  {
    id: "class",
    name: "CLASS GROUP (78)",
    subtitle: "mostly forwarded messages",
    messages: [
      { from: "them", text: "Bro did anyone understand what sir taught", time: "09:41" },
      { from: "them", text: "no", time: "09:41" },
      { from: "them", text: "no", time: "09:41" },
      { from: "them", text: "no", time: "09:42" },
      { from: "them", text: "PDF anyone?", time: "09:58" },
      { from: "them", text: "@everyone practical file due today btw", time: "10:20" },
      { from: "them", text: "WHAT", time: "10:20" },
    ],
    replies: ["+1", "PDF?", "who is 'anyone'", "im leaving the group"],
  },
  {
    id: "professor",
    name: "Prof. R. Menon",
    subtitle: "last seen: near your monitor",
    messages: [
      { from: "them", text: "Everyone submit the practical before leaving.", time: "10:30" },
      { from: "me", text: "Sir I submitted it yesterday", time: "10:31" },
      { from: "them", text: "Interesting.", time: "10:44" },
    ],
    replies: ["Yes sir", "Sir actually", "Sir the wifi", "..."],
  },
  {
    id: "partner",
    name: "Lab Partner",
    subtitle: "contributes moral support",
    messages: [
      { from: "them", text: "can you send me the code", time: "10:12" },
      { from: "me", text: "we are doing the same practical", time: "10:12" },
      { from: "them", text: "exactly. teamwork.", time: "10:13" },
      { from: "them", text: "also the drawer under your desk opens btw", time: "10:26" },
    ],
    replies: ["sending", "no", "wait what drawer", "do it yourself"],
  },
  {
    id: "unknown",
    name: "UNKNOWN NUMBER",
    subtitle: "not in your contacts",
    messages: [
      { from: "them", text: "the fire exit code is on the whiteboard", time: "??:??" },
      { from: "them", text: "the printer knows", time: "??:??" },
      { from: "them", text: "don't look behind you", time: "??:??" },
    ],
    replies: ["who is this", "behind me?", "thanks?"],
    secret: true,
  },
];
