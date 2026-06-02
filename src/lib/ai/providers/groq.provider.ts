import { aiConfig } from "../ai.config";
import { createChatCompatProvider } from "./openai-compat.provider";

/** Groq free tier — https://console.groq.com (OpenAI-compatible API) */
export const groqProvider = createChatCompatProvider({
  name: "groq",
  apiKey: aiConfig.groqApiKey,
  baseUrl: aiConfig.groqBaseUrl,
  model: aiConfig.groqModel,
});
