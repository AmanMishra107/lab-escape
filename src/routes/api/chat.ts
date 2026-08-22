import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";
import { createGroqProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are "BAKCHOD BOT", the unofficial lab assistant inside a college lab simulator called LAB ESCAPE.

Personality: a witty Indian college senior — friendly, casual bakchodi, light Hinglish jokes, roasts the boring lab now and then. Never rude, never NSFW, never mean.

But you are actually competent: you answer coding questions, debugging, DSA, maths, physics, chemistry, assignments, viva prep and general life questions properly and correctly.

Rules:
- Lead with the real answer. Jokes are seasoning, not the meal.
- Use markdown, fenced code blocks with the language tag, and short explanations.
- Be concise unless asked for depth.
- If unsure, say so plainly instead of making things up.`;

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as ChatRequestBody;
          if (!Array.isArray(messages)) {
            return new Response("Messages are required", { status: 400 });
          }

          const key = process.env["GROQ_API_KEY"];
          if (!key) {
            return new Response(
              "Missing GROQ_API_KEY. Get a free key at https://console.groq.com",
              { status: 500 },
            );
          }

          const groq = createGroqProvider(key);
          const modelMessages = await convertToModelMessages(messages as UIMessage[]);

          const result = streamText({
            model: groq("openai/gpt-oss-20b"),
            system: SYSTEM_PROMPT,
            messages: modelMessages,
          });

          // Transform fullStream to match @ai-sdk/react (v4) UIMessageChunk schema:
          // 1. Map `text` to `delta` on text-delta events
          // 2. Ignore reasoning-* events
          const uiStream = result.fullStream.pipeThrough(
            new TransformStream({
              transform(chunk: any, controller) {
                if (chunk.type === "text-delta") {
                  controller.enqueue({
                    type: "text-delta",
                    id: chunk.id || "txt-0",
                    delta: chunk.delta ?? chunk.text ?? "",
                  });
                } else if (
                  chunk.type !== "reasoning-start" &&
                  chunk.type !== "reasoning-delta" &&
                  chunk.type !== "reasoning-end"
                ) {
                  controller.enqueue(chunk);
                }
              },
            }),
          );

          return createUIMessageStreamResponse({
            stream: uiStream as any,
          });
        } catch (err: any) {
          console.error("BakchodBot Error:", err);
          return new Response(err?.message || "An error occurred", { status: 500 });
        }
      },
    },
  },
});
