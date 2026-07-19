"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export async function completeOnboardingModuleAction(formData: FormData) {
  const user = await requireUser();
  const moduleId = z.string().min(1).parse(formData.get("moduleId"));
  const onboardingModule = await getPrisma().onboardingModule.findUnique({ where: { id: moduleId } });
  if (!onboardingModule || !onboardingModule.published || !onboardingModule.visibleToRoles.includes(user.role)) throw new Error("Forbidden: onboarding");

  await getPrisma().onboardingCompletion.upsert({
    where: { userId_moduleId: { userId: user.id, moduleId } },
    update: { completedAt: new Date() },
    create: { userId: user.id, moduleId }
  });

  await writeAuditLog({ userId: user.id, action: "onboarding.completed", entity: "OnboardingModule", entityId: moduleId });
  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
}
