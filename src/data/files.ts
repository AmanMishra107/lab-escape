export interface LabFile {
  name: string;
  kind: "folder" | "text" | "locked" | "secret";
  body?: string;
  children?: LabFile[];
  egg?: string;
}

export const FILE_TREE: LabFile[] = [
  {
    name: "Assignments",
    kind: "folder",
    children: [
      { name: "practical_1.txt", kind: "text", body: "AIM: To perform the experiment.\nRESULT: The experiment was performed.\nCONCLUSION: See RESULT." },
      { name: "practical_2_final.txt", kind: "text", body: "final_FINAL_v3_actualfinal_USE_THIS.doc" },
      { name: "submission_status.txt", kind: "text", body: "99% complete.\nMissing: submission." },
    ],
  },
  {
    name: "Student_Data",
    kind: "folder",
    children: [
      { name: "attendance.csv", kind: "text", body: "you,71%\nrequired,75%\nprofessor_opinion,Interesting." },
      { name: "marks_internal.txt", kind: "text", body: "Marks are stored on a floppy disk in a locked drawer in another building." },
    ],
  },
  {
    name: "Professor",
    kind: "folder",
    children: [
      { name: "lecture_notes.txt", kind: "text", body: "Slide 1: Introduction\nSlide 2: Introduction (contd.)\nSlide 47: Introduction (contd.)" },
      { name: "password.txt", kind: "locked", body: "Encrypted. Hint: the whiteboard remembers a 4-digit code." },
    ],
  },
  {
    name: "System",
    kind: "folder",
    children: [
      { name: "readme.txt", kind: "text", body: "LAB OS v0.98 SE\nStability: aspirational.\nSupport: expired 2011." },
      { name: "wifi.cfg", kind: "text", body: "SSID: COLLEGE_WIFI_5G\nStatus: Connected. Technically.\nPassword: ask nobody" },
      { name: "boredom.dll", kind: "text", body: "This file grows by itself. Do not delete. Cannot delete." },
    ],
  },
  {
    name: "Secret",
    kind: "folder",
    children: [
      { name: "cipher.txt", kind: "secret", body: "PHHW PH EB WKH ILUH HALW\n(shift of 3, apparently)", egg: "file_do_not_open" },
      { name: "binary.txt", kind: "secret", body: "01000101 01011000 01001001 01010100" },
    ],
  },
  {
    name: "DO_NOT_OPEN",
    kind: "folder",
    children: [{ name: "told_you.txt", kind: "secret", body: "", egg: "file_do_not_open" }],
  },
];
