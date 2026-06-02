export type AiProviderName = "groq" | "heuristic" | "none";

export type AiLanguage = "en" | "am";

export type CategoryCandidate = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

export type CategorySuggestionResult = {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  confidence: number;
  reasoning?: string;
  provider: AiProviderName;
  fallback: boolean;
};

export type TranslationResult = {
  translatedText: string;
  fromLang: AiLanguage;
  toLang: AiLanguage;
  provider: AiProviderName;
  fallback: boolean;
};

export type AiServiceResult<T> =
  | { ok: true; data: T; provider: AiProviderName; fallback: boolean }
  | { ok: false; code: "UNAVAILABLE" | "INVALID_INPUT" | "PROVIDER_ERROR"; message: string };

export type AiJobDto = {
  id: string;
  type: "category_suggestion" | "translation";
  status: "pending" | "processing" | "completed" | "failed";
  result: CategorySuggestionResult | TranslationResult | null;
  errorCode: string | null;
  errorMessage: string | null;
  provider: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type AiStatusPayload = {
  enabled: boolean;
  provider: AiProviderName;
  groqConfigured: boolean;
  asyncSupported: boolean;
};
