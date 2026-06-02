import type { Prisma } from "@prisma/client";
import { findCategories } from "@/lib/events/event.repository";
import type { AiJobDto, AiLanguage, CategoryCandidate, CategorySuggestionResult, TranslationResult } from "./ai.types";
import { createAiJob, findAiJobForUser, updateAiJob } from "./ai-job.repository";
import { getAiStatus, suggestCategoryComposite, translateComposite } from "./providers/composite.provider";
import type { CategorySuggestInput } from "./providers/ai-provider";

function toJobDto(job: {
  id: string;
  type: string;
  status: string;
  result: unknown;
  errorCode: string | null;
  errorMessage: string | null;
  provider: string | null;
  createdAt: Date;
  completedAt: Date | null;
}): AiJobDto {
  return {
    id: job.id,
    type: job.type as AiJobDto["type"],
    status: job.status as AiJobDto["status"],
    result: (job.result as CategorySuggestionResult | TranslationResult | null) ?? null,
    errorCode: job.errorCode,
    errorMessage: job.errorMessage,
    provider: job.provider,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

async function loadCategories(categoryIds?: string[]): Promise<CategoryCandidate[]> {
  const all = await findCategories();
  const filtered = categoryIds?.length
    ? all.filter((c) => categoryIds.includes(c.id))
    : all;
  return filtered.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
  }));
}

export function getAiServiceStatus() {
  return getAiStatus();
}

export async function suggestEventCategory(args: {
  title?: string;
  description: string;
  categoryIds?: string[];
}) {
  const categories = await loadCategories(args.categoryIds);
  if (categories.length === 0) {
    return { ok: false as const, code: "INVALID_INPUT" as const, message: "No categories available." };
  }

  const input: CategorySuggestInput = {
    title: args.title,
    description: args.description,
    categories,
  };

  return suggestCategoryComposite(input);
}

export async function translateText(args: {
  text: string;
  fromLang: AiLanguage;
  toLang: AiLanguage;
}) {
  if (args.fromLang === args.toLang) {
    return { ok: false as const, code: "INVALID_INPUT" as const, message: "Source and target language must differ." };
  }
  return translateComposite(args);
}

export async function enqueueAiJob(args: {
  userId: string;
  type: "category_suggestion" | "translation";
  payload: Prisma.InputJsonValue;
}) {
  const job = await createAiJob({
    type: args.type,
    input: args.payload,
    userId: args.userId,
  });

  void processAiJob(job.id);

  return toJobDto(job);
}

export async function getAiJobStatus(jobId: string, userId: string) {
  const job = await findAiJobForUser(jobId, userId);
  if (!job) return null;

  if (job.status === "pending") {
    void processAiJob(job.id);
  }

  return toJobDto(job);
}

export async function processAiJob(jobId: string) {
  const { findAiJobById } = await import("./ai-job.repository");
  const job = await findAiJobById(jobId);
  if (!job || job.status !== "pending") {
    return;
  }

  await updateAiJob(jobId, { status: "processing" });

  try {
    if (job.type === "category_suggestion") {
      const input = job.input as {
        description: string;
        title?: string;
        categoryIds?: string[];
      };
      const result = await suggestEventCategory(input);
      if (!result.ok) {
        await updateAiJob(jobId, {
          status: "failed",
          errorCode: result.code,
          errorMessage: result.message,
          completedAt: new Date(),
        });
        return;
      }
      await updateAiJob(jobId, {
        status: "completed",
        result: result.data,
        provider: result.provider,
        completedAt: new Date(),
      });
      return;
    }

    if (job.type === "translation") {
      const input = job.input as {
        text: string;
        fromLang: AiLanguage;
        toLang: AiLanguage;
      };
      const result = await translateText(input);
      if (!result.ok) {
        await updateAiJob(jobId, {
          status: "failed",
          errorCode: result.code,
          errorMessage: result.message,
          completedAt: new Date(),
        });
        return;
      }
      await updateAiJob(jobId, {
        status: "completed",
        result: result.data,
        provider: result.provider,
        completedAt: new Date(),
      });
    }
  } catch (e) {
    await updateAiJob(jobId, {
      status: "failed",
      errorCode: "PROVIDER_ERROR",
      errorMessage: e instanceof Error ? e.message : "Processing failed.",
      completedAt: new Date(),
    });
  }
}

export async function runCategorySuggestionSync(args: {
  userId: string;
  title?: string;
  description: string;
  categoryIds?: string[];
  async: boolean;
}) {
  if (args.async) {
    const job = await enqueueAiJob({
      userId: args.userId,
      type: "category_suggestion",
      payload: {
        description: args.description,
        title: args.title,
        categoryIds: args.categoryIds,
      },
    });
    return { mode: "async" as const, job };
  }

  const result = await suggestEventCategory(args);
  return { mode: "sync" as const, result };
}

export async function runTranslationSync(args: {
  userId: string;
  text: string;
  fromLang: AiLanguage;
  toLang: AiLanguage;
  async: boolean;
}) {
  if (args.async) {
    const job = await enqueueAiJob({
      userId: args.userId,
      type: "translation",
      payload: {
        text: args.text,
        fromLang: args.fromLang,
        toLang: args.toLang,
      },
    });
    return { mode: "async" as const, job };
  }

  const result = await translateText(args);
  return { mode: "sync" as const, result };
}
