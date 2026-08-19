"use server";

import { z } from "zod";
import { submitDailyReport } from "@/server/actions/reports";

export type DailyReportFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  reportHref?: string;
};

export async function submitDailyReportFormAction(_state: DailyReportFormState, formData: FormData): Promise<DailyReportFormState> {
  void _state;

  try {
    const saved = await submitDailyReport(dailyReportInputFromFormData(formData));
    return {
      status: "success",
      message: formData.get("submit") === "true" ? "Daily report submitted." : "Daily report draft saved.",
      reportHref: `/daily-reports/${saved.id}`
    };
  } catch (error) {
    return {
      status: "error",
      message: readableDailyReportError(error)
    };
  }
}

function dailyReportInputFromFormData(formData: FormData) {
  return {
    reportDate: formData.get("reportDate"),
    shiftStart: formData.get("shiftStart"),
    shiftEnd: formData.get("shiftEnd"),
    breakMinutes: formData.get("breakMinutes"),
    completed: formData.get("completed"),
    inProgress: formData.get("inProgress"),
    clientUpdates: optionalFormString(formData.get("clientUpdates")),
    leadActivity: optionalFormString(formData.get("leadActivity")),
    meetings: optionalFormString(formData.get("meetings")),
    blockers: optionalFormString(formData.get("blockers")),
    waitingOnStephen: optionalFormString(formData.get("waitingOnStephen")),
    recommendations: optionalFormString(formData.get("recommendations")),
    tomorrowPriorities: formData.get("tomorrowPriorities"),
    submit: formData.get("submit") === "true"
  };
}

function optionalFormString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function readableDailyReportError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Please check the report fields and try again.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Could not save the daily report. Please try again or tell Stephen.";
}
