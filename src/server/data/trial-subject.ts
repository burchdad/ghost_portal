import type { SessionUser } from "@/server/permissions/authorize";
import { getPrisma } from "@/server/db/prisma";

export type TrialSubject = Pick<SessionUser, "id" | "name" | "preferredName" | "email" | "timezone">;

export async function getTrialSubjectForViewer(viewer: SessionUser): Promise<TrialSubject> {
  if (viewer.role !== "Founder") {
    return viewer;
  }

  const activeTrial = await getPrisma().trialSettings.findFirst({
    where: { status: "Active", user: { status: { not: "Suspended" } } },
    include: { user: true },
    orderBy: { trialStartDate: "desc" }
  });

  if (activeTrial?.user) {
    return activeTrial.user;
  }

  const operationsUser = await getPrisma().user.findFirst({
    where: {
      email: (process.env.OPERATIONS_SEED_EMAIL ?? "amariexc@gmail.com").toLowerCase(),
      role: { name: "Operations" },
      status: { not: "Suspended" }
    }
  });

  return operationsUser ?? viewer;
}
