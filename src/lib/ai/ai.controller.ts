import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http/api-response";
import { zodFieldErrors } from "@/lib/http/zod-error";
import { categorySuggestSchema, createAiJobSchema, translateSchema } from "./ai.schemas";
import {
  getAiJobStatus,
  getAiServiceStatus,
  runCategorySuggestionSync,
  runTranslationSync,
} from "./ai.service";

function unauthorized() {
  return NextResponse.json(fail("UNAUTHORIZED", "Not authenticated."), { status: 401 });
}

function forbidden(message = "Not allowed.") {
  return NextResponse.json(fail("FORBIDDEN", message), { status: 403 });
}

function requireOrganizerOrAdmin(role: string) {
  return role === "organizer" || role === "admin";
}

export async function handleAiStatus() {
  return NextResponse.json(ok(getAiServiceStatus()), { status: 200 });
}

export async function handleCategorySuggest(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    if (!requireOrganizerOrAdmin(user.role)) {
      return forbidden("Organizer access required for category suggestions.");
    }

    const body = categorySuggestSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(body.error)), {
        status: 400,
      });
    }

    const outcome = await runCategorySuggestionSync({
      userId: user.id,
      title: body.data.title,
      description: body.data.description,
      categoryIds: body.data.categoryIds,
      async: body.data.async,
    });

    if (outcome.mode === "async") {
      return NextResponse.json(ok({ async: true, job: outcome.job }), { status: 202 });
    }

    if (!outcome.result.ok) {
      return NextResponse.json(
        ok({
          available: false,
          suggestion: null,
          message: outcome.result.message,
          code: outcome.result.code,
        }),
        { status: 200 },
      );
    }

    return NextResponse.json(
      ok({
        available: true,
        suggestion: outcome.result.data,
        provider: outcome.result.provider,
        fallback: outcome.result.fallback,
      }),
      { status: 200 },
    );
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleTranslate(req: NextRequest) {
  try {
    const user = await requireCurrentUser();

    const body = translateSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(body.error)), {
        status: 400,
      });
    }

    const outcome = await runTranslationSync({
      userId: user.id,
      text: body.data.text,
      fromLang: body.data.fromLang,
      toLang: body.data.toLang,
      async: body.data.async,
    });

    if (outcome.mode === "async") {
      return NextResponse.json(ok({ async: true, job: outcome.job }), { status: 202 });
    }

    if (!outcome.result.ok) {
      return NextResponse.json(
        ok({
          available: false,
          translation: null,
          message: outcome.result.message,
          code: outcome.result.code,
        }),
        { status: 200 },
      );
    }

    return NextResponse.json(
      ok({
        available: true,
        translation: outcome.result.data,
        provider: outcome.result.provider,
        fallback: outcome.result.fallback,
      }),
      { status: 200 },
    );
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleCreateAiJob(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = createAiJobSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(body.error)), {
        status: 400,
      });
    }

    if (body.data.type === "category_suggestion" && !requireOrganizerOrAdmin(user.role)) {
      return forbidden("Organizer access required for category suggestions.");
    }

    const outcome =
      body.data.type === "category_suggestion"
        ? await runCategorySuggestionSync({
            userId: user.id,
            title: body.data.title,
            description: body.data.description,
            categoryIds: body.data.categoryIds,
            async: true,
          })
        : await runTranslationSync({
            userId: user.id,
            text: body.data.text,
            fromLang: body.data.fromLang,
            toLang: body.data.toLang,
            async: true,
          });

    return NextResponse.json(ok({ job: outcome.job }), { status: 202 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleGetAiJob(_req: NextRequest, jobId: string) {
  try {
    const user = await requireCurrentUser();
    const job = await getAiJobStatus(jobId, user.id);
    if (!job) {
      return NextResponse.json(fail("NOT_FOUND", "Job not found."), { status: 404 });
    }
    return NextResponse.json(ok({ job }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorized();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}
