"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import type {
  AiJobDto,
  AiLanguage,
  AiStatusPayload,
  CategorySuggestionResult,
  TranslationResult,
} from "@/lib/ai/ai.types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < retries) await sleep(400 * (attempt + 1));
    }
  }
  throw lastError;
}

export const aiKeys = {
  status: ["ai", "status"] as const,
  job: (id: string) => ["ai", "job", id] as const,
};

export type CategorySuggestResponse =
  | {
      available: true;
      suggestion: CategorySuggestionResult;
      provider: string;
      fallback: boolean;
    }
  | { available: false; suggestion: null; message: string; code: string }
  | { async: true; job: AiJobDto };

export type TranslateResponse =
  | {
      available: true;
      translation: TranslationResult;
      provider: string;
      fallback: boolean;
    }
  | { available: false; translation: null; message: string; code: string }
  | { async: true; job: AiJobDto };

export function useAiStatus() {
  return useQuery({
    queryKey: aiKeys.status,
    queryFn: () => fetchJson<AiStatusPayload>("/api/ai/status"),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useAiJobPoll(jobId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: aiKeys.job(jobId ?? ""),
    queryFn: () => fetchJson<{ job: AiJobDto }>(`/api/ai/jobs/${jobId}`),
    enabled: enabled && !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.job.status;
      if (status === "pending" || status === "processing") return 1500;
      return false;
    },
  });
}

export function useCategorySuggestion() {
  return useMutation({
    mutationFn: (body: {
      description: string;
      title?: string;
      categoryIds?: string[];
      async?: boolean;
    }) =>
      withRetry(() =>
        fetchJson<CategorySuggestResponse>("/api/ai/category/suggest", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      ),
  });
}

export function useAiTranslation() {
  return useMutation({
    mutationFn: (body: { text: string; fromLang: AiLanguage; toLang: AiLanguage; async?: boolean }) =>
      withRetry(() =>
        fetchJson<TranslateResponse>("/api/ai/translate", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      ),
  });
}
