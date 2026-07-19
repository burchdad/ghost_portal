"use server";

import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { assertPermission } from "@/server/permissions/roles";

export const dailyReportSchema = z.object({
  hoursWorked: z.coerce.number().min(0).max(24),
  completed: z.string().min(1),
  inProgress: z.string().min(1),
  blockers: z.string().optional(),
  waitingOnStephen: z.string().optional(),
  tomorrowPriorities: z.string().min(1)
});

export async function submitDailyReport(input: unknown) {
  const user = await getCurrentUser();
  assertPermission(user, "reports:submit");

  const report = dailyReportSchema.parse(input);

  return {
    ok: true,
    report,
    submittedBy: user.id,
    submittedAt: new Date().toISOString()
  };
}
