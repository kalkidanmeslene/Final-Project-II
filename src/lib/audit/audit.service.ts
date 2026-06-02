import type { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function auditLog(args: {
  userId?: string | null;
  action: AuditAction;
  success: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      userId: args.userId ?? null,
      action: args.action,
      success: args.success,
      ipAddress: args.ipAddress ?? null,
      userAgent: args.userAgent ?? null,
      metadata: args.metadata ?? undefined,
    },
  });
}

