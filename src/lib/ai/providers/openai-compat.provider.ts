import { aiConfig } from "../ai.config";
import type { AiProviderName, CategorySuggestionResult, TranslationResult } from "../ai.types";
import type { AiProvider, CategorySuggestInput, TranslateInput } from "./ai-provider";

export type ChatCompatConfig = {
  name: AiProviderName;
  apiKey: string;
  baseUrl: string;
  model: string;
};

async function chatJson<T>(config: ChatCompatConfig, system: string, user: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), aiConfig.requestTimeoutMs);

  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`${config.name} HTTP ${res.status}${errBody ? `: ${errBody.slice(0, 120)}` : ""}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error(`Empty ${config.name} response`);

    return JSON.parse(content) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function createChatCompatProvider(config: ChatCompatConfig): AiProvider {
  return {
    name: config.name,

    async suggestCategory(input: CategorySuggestInput): Promise<CategorySuggestionResult | null> {
      const categoriesPayload = input.categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description ?? "",
      }));

      const parsed = await chatJson<{
        categoryId: string;
        confidence: number;
        reasoning?: string;
      }>(
        config,
        `You classify events for an Ethiopian events platform. Pick exactly one category id from the provided list. Respond JSON only: {"categoryId":"uuid","confidence":0.0-1.0,"reasoning":"short"}`,
        JSON.stringify({
          title: input.title ?? "",
          description: input.description,
          categories: categoriesPayload,
        }),
      );

      const match = input.categories.find((c) => c.id === parsed.categoryId);
      if (!match) return null;

      return {
        categoryId: match.id,
        categoryName: match.name,
        categorySlug: match.slug,
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.7)),
        reasoning: parsed.reasoning,
        provider: config.name,
        fallback: false,
      };
    },

    async translate(input: TranslateInput): Promise<TranslationResult | null> {
      const target = input.toLang === "am" ? "Amharic" : "English";
      const source = input.fromLang === "am" ? "Amharic" : "English";

      const parsed = await chatJson<{ translatedText: string }>(
        config,
        `Translate event-related text from ${source} to ${target}. Preserve meaning and tone. Respond JSON only: {"translatedText":"..."}`,
        JSON.stringify({ text: input.text }),
      );

      if (!parsed.translatedText?.trim()) return null;

      return {
        translatedText: parsed.translatedText.trim(),
        fromLang: input.fromLang,
        toLang: input.toLang,
        provider: config.name,
        fallback: false,
      };
    },
  };
}
