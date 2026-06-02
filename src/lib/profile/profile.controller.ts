import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http/api-response";
import { zodFieldErrors } from "@/lib/http/zod-error";
import { getRequestMeta } from "@/lib/http/request-meta";
import { changePasswordSchema, patchPreferredLanguageSchema, updateProfileSchema } from "./profile.schemas";
import {
  changePassword,
  getProfile,
  updatePreferredLanguage,
  updateProfile,
  uploadProfileAvatar,
} from "./profile.service";

function validationResponse(e: ZodError) {
  return NextResponse.json(fail("VALIDATION_ERROR", "Invalid input.", zodFieldErrors(e)), { status: 400 });
}

function unauthorizedResponse() {
  return NextResponse.json(fail("UNAUTHORIZED", "Not authenticated."), { status: 401 });
}

function conflictResponse() {
  return NextResponse.json(fail("CONFLICT", "Email or phone number already in use."), { status: 409 });
}

export async function handleGetProfile() {
  try {
    const current = await requireCurrentUser();
    const profile = await getProfile(current.id);
    if (!profile) {
      return NextResponse.json(fail("NOT_FOUND", "Profile not found."), { status: 404 });
    }
    return NextResponse.json(ok({ profile }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorizedResponse();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handlePatchPreferredLanguage(req: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  try {
    const current = await requireCurrentUser();
    const parsed = patchPreferredLanguageSchema.parse(await req.json());
    const profile = await updatePreferredLanguage({
      userId: current.id,
      preferredLanguage: parsed.preferredLanguage,
      ipAddress,
      userAgent,
    });
    return NextResponse.json(ok({ profile }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorizedResponse();
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleUpdateProfile(req: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  try {
    const current = await requireCurrentUser();
    const parsed = updateProfileSchema.parse(await req.json());

    const profile = await updateProfile({
      userId: current.id,
      fullName: parsed.fullName.trim(),
      email: parsed.email?.trim() ? parsed.email.trim().toLowerCase() : null,
      phoneNumber: parsed.phoneNumber?.trim() ? parsed.phoneNumber.trim() : null,
      preferredLanguage: parsed.preferredLanguage.trim(),
      bio: parsed.bio?.trim() ? parsed.bio.trim() : null,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(ok({ profile }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorizedResponse();
    if (e instanceof ZodError) return validationResponse(e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return conflictResponse();
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleChangePassword(req: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  try {
    const current = await requireCurrentUser();
    const parsed = changePasswordSchema.parse(await req.json());

    const result = await changePassword({
      userId: current.id,
      currentPassword: parsed.currentPassword,
      newPassword: parsed.newPassword,
      ipAddress,
      userAgent,
    });

    if (!result.ok) {
      return NextResponse.json(
        fail("INVALID_CURRENT_PASSWORD", "Current password is incorrect."),
        { status: 400 },
      );
    }

    return NextResponse.json(ok({ message: "Password updated successfully." }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorizedResponse();
    if (e instanceof ZodError) return validationResponse(e);
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}

export async function handleUploadAvatar(req: NextRequest) {
  const { ipAddress, userAgent } = getRequestMeta(req);
  try {
    const current = await requireCurrentUser();
    const formData = await req.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Avatar file is required."), { status: 400 });
    }

    const result = await uploadProfileAvatar({
      userId: current.id,
      file,
      ipAddress,
      userAgent,
    });

    if (!result.ok) {
      return NextResponse.json(fail("NOT_FOUND", "Profile not found."), { status: 404 });
    }

    return NextResponse.json(ok({ profile: result.profile }), { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return unauthorizedResponse();
    if (e instanceof Error && e.message.includes("image")) {
      return NextResponse.json(fail("VALIDATION_ERROR", e.message), { status: 400 });
    }
    return NextResponse.json(fail("INTERNAL_ERROR", "Something went wrong."), { status: 500 });
  }
}
