import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Uses Groq's free OpenAI-compatible API.
// Get a free key at https://console.groq.com → API Keys (no credit card needed).
export function createGroqProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

