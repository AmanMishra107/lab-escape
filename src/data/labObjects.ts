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
  { id: "computer", label: "Lab Computer", hint: "Boots the lab OS.", x: 25.6, y: 33.3, w: 29, h: 35, zoom: 3.1 },
  { id: "phone", label: "Smartphone", hint: "Glowing on the desk beside the monitor.", x: 62.5, y: 58.8, w: 3.2, h: 9.4, zoom: 4.2 },
  { id: "noticeboard", label: "Notice Board", hint: "Management has thoughts.", x: 3.5, y: 10, w: 20, h: 26, zoom: 3 },
  { id: "whiteboard", label: "Whiteboard", hint: "Someone forgot to erase something.", x: 45.5, y: 8, w: 29, h: 29, zoom: 2.8 },
  { id: "clock", label: "Wall Clock", hint: "Time is the enemy.", x: 77.5, y: 8, w: 8, h: 14, zoom: 4 },
  { id: "window", label: "Window", hint: "Outside exists, apparently.", x: 25.5, y: 10, w: 18, h: 20, zoom: 2.6 },
  { id: "desk", label: "Desk", hint: "Sticky notes and secrets.", x: 15.6, y: 64.5, w: 14, h: 14, zoom: 3.4 },
  { id: "drawer", label: "Desk Drawer Cabinet", hint: "3 tiers. Your lab partner said it holds secrets.", x: 76.2, y: 72.5, w: 12, h: 19.4, zoom: 3.6 },
  { id: "printer", label: "Printer 2", hint: "Prints things nobody sent.", x: 83.7, y: 48.8, w: 13.5, h: 19.4, zoom: 3.4 },
  { id: "stickynote", label: "Sticky Note", hint: "Someone's reminder. You can edit it.", x: 15.0, y: 42.5, w: 6.5, h: 9.5, zoom: 4.2 },
  { id: "cpu", label: "Workstation Tower (CPU)", hint: "The overclocked powerhouse behind Lab 404.", x: 65.5, y: 40.0, w: 8.5, h: 28.0, zoom: 3.5 },
];



export const OBJECT_MAP = new Map(LAB_OBJECTS.map((o) => [o.id, o]));
