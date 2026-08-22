export type NoticeCategory = "event" | "assignment" | "project" | "announcement";

export interface Notice {
  id?: string | undefined;
  title: string;
  body: string;
  sign: string;
  category?: NoticeCategory | undefined;
  date?: string | undefined;
  expires_at?: string | undefined; // ISO string for automated expiry after date passes
  tone: "normal" | "warn" | "chaos";
  isCustom?: boolean | undefined;
}

/**
 * Official Lab Instructions & Rules ONLY.
 */
export const NOTICES: Notice[] = [
  {
    id: "lab_inst_1",
    title: "OFFICIAL LAB INSTRUCTIONS & CONDUCT",
    body: "1. Wearing ID card is mandatory in the laboratory at all times.\n2. Eating, drinking, or sleeping during practical sessions is strictly prohibited.\n3. Handle all computer systems, keyboards, and lab equipment with proper care.\n4. Keep workstations clean and log out before leaving.",
    sign: "— Lab Management",
    category: "announcement",
    date: "Official Policy",
    tone: "normal",
  },
  {
    id: "lab_inst_2",
    title: "PRACTICAL EXPERIMENT & MANUAL GUIDELINES",
    body: "1. Complete Lab Manual Experiments 1 through 10 as per schedule.\n2. Ensure observation tables and output graphs are verified by the instructor.\n3. Submit practical files before final term viva assessment.",
    sign: "— Department Coordinator",
    category: "assignment",
    date: "Academic Year 2026",
    tone: "warn",
  },
  {
    id: "lab_inst_3",
    title: "EMERGENCY & FIRE SAFETY PROCEDURE",
    body: "In case of any emergency or alarm, remain calm and proceed to the designated emergency exit.\nRear door access code: 4040.",
    sign: "— Safety Officer",
    category: "announcement",
    date: "Emergency Protocol",
    tone: "chaos",
  },
  {
    id: "lab_inst_4",
    title: "HARDWARE & SYSTEM FAULT REPORTING",
    body: "Report any hardware malfunctions, network outages, or printer faults directly to the technical team at the front desk. Do not attempt to disconnect lab cables.",
    sign: "— Technical Staff",
    category: "announcement",
    date: "Standard Procedure",
    tone: "normal",
  },
];
