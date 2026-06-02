export type AiProviderMode = "auto" | "groq" | "heuristic" | "off";

function readBool(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) return defaultValue;
  return value === "true" || value === "1";
}

export const aiConfig = {
  enabled: readBool(process.env.AI_ENABLED, true),
  provider: (process.env.AI_PROVIDER ?? "auto") as AiProviderMode,
  groqApiKey: process.env.GROQ_API_KEY?.trim() ?? "",
  groqModel: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
  groqBaseUrl: (process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1").replace(/\/$/, ""),
  requestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 20_000),
  jobPollMaxAgeMs: Number(process.env.AI_JOB_MAX_AGE_MS ?? 30 * 60 * 1000),
};

export function isGroqConfigured() {
  return aiConfig.groqApiKey.length > 0;
}

export function resolvePrimaryProvider(): "groq" | "heuristic" | "none" {
  if (!aiConfig.enabled) return "none";
  if (aiConfig.provider === "off") return "none";
  if (aiConfig.provider === "heuristic") return "heuristic";
  if (aiConfig.provider === "groq") return isGroqConfigured() ? "groq" : "heuristic";
  return isGroqConfigured() ? "groq" : "heuristic";
}
