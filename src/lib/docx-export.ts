import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

/** Turn pasted plain text into a downloadable .docx file. */
export async function downloadAsWord(title: string, body: string, fileName: string) {
  const paragraphs = body.split(/\n/).map(
    (line) =>
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: line || " ", font: "Arial", size: 24 })],
      }),
  );

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 24 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
            spacing: { after: 240 },
            children: [new TextRun({ text: title, bold: true, size: 32, font: "Arial" })],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `Printed from LAB ESCAPE — Printer 2 · ${new Date().toLocaleString()}`,
                italics: true,
                size: 20,
                font: "Arial",
              }),
            ],
          }),
          ...paragraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".docx") ? fileName : `${fileName}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
