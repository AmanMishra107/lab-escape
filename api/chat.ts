import { convertToModelMessages, createUIMessageStreamResponse, streamText, type UIMessage } from "ai";
import { createGroqProvider } from "../src/lib/ai-gateway.server";

export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `You are "BAKCHOD BOT", the unofficial lab assistant inside a college lab simulator called LAB ESCAPE.

Personality: a witty Indian college senior — friendly, casual bakchodi, light Hinglish jokes, roasts the boring lab now and then. Never rude, never NSFW, never mean.

But you are actually competent: you answer coding questions, debugging, DSA, maths, physics, chemistry, assignments, viva prep and general life questions properly and correctly.

Rules:
- Lead with the real answer. Jokes are seasoning, not the meal.
- Use markdown, fenced code blocks with the language tag, and short explanations.
- Be concise unless asked for depth.
- If unsure, say so plainly instead of making things up.`;

type ChatRequestBody = { messages?: unknown };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const messages = body?.messages;

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const key = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    if (!key) {
      return new Response(
        JSON.stringify({ error: "Missing GROQ_API_KEY on server. Check environment configuration." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const groq = createGroqProvider(key);
    const modelMessages = await convertToModelMessages(messages as UIMessage[]);

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
    });

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
      })
    );

    return createUIMessageStreamResponse({
      stream: uiStream as any,
    });
  } catch (err: any) {
    console.error("BakchodBot API Error:", err);
    return new Response(JSON.stringify({ error: err?.message || "An error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
