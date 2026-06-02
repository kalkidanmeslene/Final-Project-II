import { isGroqConfigured, resolvePrimaryProvider } from "../ai.config";
import type { AiServiceResult } from "../ai.types";
import type { AiProvider, CategorySuggestInput, TranslateInput } from "./ai-provider";
import { groqProvider } from "./groq.provider";
import { heuristicProvider } from "./heuristic.provider";

async function withFallback<T>(
  primary: "groq" | "heuristic" | "none",
  run: (provider: AiProvider) => Promise<T | null>,
): Promise<AiServiceResult<T>> {
  if (primary === "none") {
    return { ok: false, code: "UNAVAILABLE", message: "AI features are disabled." };
  }

  const order: AiProvider[] =
    primary === "groq" && isGroqConfigured() ? [groqProvider, heuristicProvider] : [heuristicProvider];

  let lastError: string | null = null;

  for (let i = 0; i < order.length; i++) {
    const provider = order[i]!;
    try {
      const data = await run(provider);
      if (!data) {
        lastError = "No result from provider.";
        continue;
      }
      const fallback = provider.name === "heuristic" && i > 0;
      return { ok: true, data, provider: provider.name, fallback };
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Provider error.";
    }
  }

  return {
    ok: false,
    code: "PROVIDER_ERROR",
    message: lastError ?? "AI service unavailable.",
  };
}

export async function suggestCategoryComposite(input: CategorySuggestInput) {
  return withFallback(resolvePrimaryProvider(), (p) => p.suggestCategory(input));
}

export async function translateComposite(input: TranslateInput) {
  return withFallback(resolvePrimaryProvider(), (p) => p.translate(input));
}

export function getAiStatus() {
  const primary = resolvePrimaryProvider();
  return {
    enabled: primary !== "none",
    provider: primary,
    groqConfigured: isGroqConfigured(),
    asyncSupported: true,
  };
}
