import type { AiJobStatus, AiJobType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function createAiJob(args: {
  type: AiJobType;
  input: Prisma.InputJsonValue;
  userId?: string;
}) {
  return prisma.aiJob.create({
    data: {
      type: args.type,
      input: args.input,
      userId: args.userId,
      status: "pending",
    },
  });
}

export async function updateAiJob(
  id: string,
  data: {
    status?: AiJobStatus;
    result?: Prisma.InputJsonValue;
    errorCode?: string | null;
    errorMessage?: string | null;
    provider?: string | null;
    completedAt?: Date | null;
  },
) {
  return prisma.aiJob.update({ where: { id }, data });
}

export async function findAiJobById(id: string) {
  return prisma.aiJob.findUnique({ where: { id } });
}

export async function findAiJobForUser(id: string, userId: string) {
  return prisma.aiJob.findFirst({ where: { id, userId } });
}
