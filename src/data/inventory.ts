export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ITEMS: Item[] = [
  { id: "coffee", name: "Cold Coffee", description: "Was hot at 09:00. It is now a memory.", icon: "☕" },
  { id: "usb", name: "USB Drive", description: "Contains 4GB of movies and one assignment.", icon: "🔌" },
  { id: "lab_key", name: "Lab Key", description: "Opens something. Possibly not this lab.", icon: "🔑" },
  { id: "note", name: "Mysterious Note", description: "'the printer knows'", icon: "📝" },
  { id: "attendance_slip", name: "Attendance Slip", description: "Signature: illegible. Deliberately.", icon: "📄" },
  { id: "broken_mouse", name: "Broken Mouse", description: "Left click only. Like most students.", icon: "🖱" },
  { id: "chip", name: "Secret Chip", description: "Labelled DO NOT LOSE. You have already nearly lost it.", icon: "🧩" },
  { id: "prof_password", name: "Professor's Password", description: "It's 4 digits. It's on the whiteboard. It's terrible.", icon: "🗝" },
];

export const ITEM_MAP = new Map(ITEMS.map((i) => [i.id, i]));
