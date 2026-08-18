import { useState } from "react";
import { FILE_TREE, type LabFile } from "../../data/files";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../ui/brut";

export function FilesApp() {
  const [folder, setFolder] = useState<LabFile | null>(null);
  const [open, setOpen] = useState<LabFile | null>(null);

  const items = folder?.children ?? FILE_TREE;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="mono-label">C:\LAB\{folder?.name ?? ""}</span>
        {folder && (
          <BrutButton
            onClick={() => {
              setFolder(null);
              setOpen(null);
            }}
          >
            ← UP
          </BrutButton>
        )}
      </div>

      <div className="scroll-thin grid flex-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => (
          <button
            key={f.name}
            className={`brut-sm brut-press p-3 text-left ${
              f.kind === "locked" ? "bg-muted" : f.kind === "secret" ? "bg-lab-yellow" : "bg-card"
            }`}
            onClick={() => {
              sound.play(f.kind === "locked" ? "error" : "click");
              store.interacted();
              if (f.kind === "folder") {
                setFolder(f);
                setOpen(null);
                if (f.name === "DO_NOT_OPEN") store.findEgg("file_do_not_open");
              } else {
                setOpen(f);
                if (f.egg) store.findEgg(f.egg);
                if (f.kind === "secret") store.reduceBoredom(4);
              }
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="mono-label">
                {f.kind === "folder" ? "📁" : f.kind === "locked" ? "🔒" : "📄"} {f.name}
              </span>
              {f.kind === "locked" && <Tag tone="red">LOCKED</Tag>}
            </div>
          </button>
        ))}
      </div>

      {open && (
        <div className="brut-sm max-h-48 overflow-y-auto bg-background p-3 font-mono text-sm">
          <p className="mono-label mb-2">{open.name}</p>
          <pre className="whitespace-pre-wrap">
            {open.kind === "locked"
              ? open.body
              : open.body?.trim()
                ? open.body
                : "[file is empty]\n\n...menacingly empty."}
          </pre>
        </div>
      )}
    </div>
  );
}
