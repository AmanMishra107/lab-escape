import { useState } from "react";
import { CONTACTS, type ChatMessage } from "../../data/messages";
import { store } from "../../systems/GameState";
import { sound } from "../../systems/SoundSystem";
import { BrutButton, Tag } from "../ui/brut";

export function PhoneApp() {
  const [active, setActive] = useState(CONTACTS[0]!.id);
  const [extra, setExtra] = useState<Record<string, ChatMessage[]>>({});
  const contact = CONTACTS.find((c) => c.id === active)!;
  const thread = [...contact.messages, ...(extra[active] ?? [])];

  const send = (text: string) => {
    sound.play("pop");
    store.interacted();
    store.reduceBoredom(2);
    const mine: ChatMessage = { from: "me", text, time: "now" };
    const reply: ChatMessage = {
      from: "them",
      text:
        contact.id === "unknown"
          ? "you looked, didn't you"
          : contact.id === "professor"
            ? "Interesting."
            : ["k", "bro", "same", "send it na", "lol", "sir will kill us"][Math.floor(Math.random() * 6)]!,
      time: "now",
    };
    setExtra((e) => ({ ...e, [active]: [...(e[active] ?? []), mine, reply] }));
    if (contact.id === "unknown") {
      store.findEgg("phone_unknown");
      store.glitchBurst(0.8);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 sm:flex-row">
      <div className="flex gap-2 overflow-x-auto border-b-3 border-lab-ink pb-2 sm:w-52 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r-3 sm:pb-0 sm:pr-2">
        {CONTACTS.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              sound.play("click");
              setActive(c.id);
              if (c.secret) store.findEgg("phone_unknown");
            }}
            className={`brut-sm mono-label shrink-0 px-2 py-2 text-left ${
              c.id === active ? "bg-lab-ink text-lab-paper" : "bg-card"
            }`}
          >
            <span className="block">{c.name}</span>
            <span className="block text-[9px] opacity-70 normal-case">{c.subtitle}</span>
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-xl">{contact.name}</h3>
          {contact.secret && <Tag tone="red">UNKNOWN</Tag>}
        </div>
        <div className="scroll-thin flex-1 space-y-2 overflow-y-auto border-3 border-lab-ink bg-background p-3">
          {thread.map((m, i) => (
            <div key={i} className={m.from === "me" ? "flex justify-end" : "flex justify-start"}>
              <p
                className={`brut-sm max-w-[80%] px-2 py-1 text-sm ${
                  m.from === "me" ? "bg-lab-green" : "bg-card"
                }`}
              >
                {m.text}
                <span className="mono-label ml-2 opacity-60">{m.time}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {contact.replies.map((r) => (
            <BrutButton key={r} className="text-[10px]" onClick={() => send(r)}>
              {r}
            </BrutButton>
          ))}
        </div>
      </div>
    </div>
  );
}
