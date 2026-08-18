import type { ObjectId } from "../systems/types";

export interface LabObject {
  id: ObjectId;
  label: string;
  hint: string;
  /* hotspot rect in % of the scene */
  x: number;
  y: number;
  w: number;
  h: number;
  zoom: number;
}

export const LAB_OBJECTS: LabObject[] = [
  { id: "computer", label: "Lab Computer", hint: "Boots the lab OS.", x: 38.5, y: 46, w: 20, h: 24, zoom: 3.1 },
  { id: "phone", label: "Phone", hint: "Under the desk. Obviously.", x: 63.5, y: 71, w: 8, h: 10, zoom: 4.2 },
  { id: "noticeboard", label: "Notice Board", hint: "Management has thoughts.", x: 4, y: 12, w: 17, h: 24, zoom: 3 },
  { id: "whiteboard", label: "Whiteboard", hint: "Someone forgot to erase something.", x: 60, y: 10, w: 24, h: 22, zoom: 2.8 },
  { id: "clock", label: "Wall Clock", hint: "Time is the enemy.", x: 87, y: 9, w: 9, h: 15, zoom: 4 },
  { id: "window", label: "Window", hint: "Outside exists, apparently.", x: 24, y: 10, w: 22, h: 26, zoom: 2.6 },
  { id: "desk", label: "Desk", hint: "Sticky notes and secrets.", x: 22, y: 62, w: 14, h: 14, zoom: 3.4 },
  { id: "drawer", label: "Drawer", hint: "It opens. Your lab partner said so.", x: 74, y: 62, w: 12, h: 16, zoom: 3.6 },
  { id: "printer", label: "Printer 2", hint: "Prints things nobody sent.", x: 86, y: 52, w: 13, h: 18, zoom: 3.4 },
  { id: "trash", label: "Trash Bin", hint: "Archaeology.", x: 6, y: 74, w: 10, h: 18, zoom: 3.8 },
  { id: "backpack", label: "Backpack", hint: "Your worldly possessions.", x: 47, y: 78, w: 12, h: 16, zoom: 3.6 },
];

export const OBJECT_MAP = new Map(LAB_OBJECTS.map((o) => [o.id, o]));
