import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

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
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3.7-flash"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
