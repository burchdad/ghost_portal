"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { activeElapsedMinutes, formatDuration, minutesBetween } from "@/lib/time-clock";

import {
  clockInDashboardAction,
  clockOutDashboardAction,
  endBreakDashboardAction,
  startBreakDashboardAction,
  type TimeClockActionState
} from "@/server/workflows/time-clock";

const initialActionState: TimeClockActionState = { status: "idle" };

export function TimeClockCard({
  clock,
  timezone
}: {
  clock: {
    subjectName: string;
    subjectTimezone: string;
    status: "ClockedOut" | "ClockedIn" | "OnBreak" | "AwaitingCorrection" | "Completed";
    canUseControls: boolean;
    shiftId?: string;
    startedAt?: string;
    endedAt?: string;
    openBreakStartedAt?: string;
    breakMinutes: number;
    workedMinutes?: number;
    dailyReportStatus: string;
  };
  timezone: string;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());
  const [clockInState, clockInFormAction, clockInPending] = useActionState(clockInDashboardAction, initialActionState);
  const [clockOutState, clockOutFormAction, clockOutPending] = useActionState(clockOutDashboardAction, initialActionState);
  const [startBreakState, startBreakFormAction, startBreakPending] = useActionState(startBreakDashboardAction, initialActionState);
  const [endBreakState, endBreakFormAction, endBreakPending] = useActionState(endBreakDashboardAction, initialActionState);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const startedAt = useMemo(() => clock.startedAt ? new Date(clock.startedAt) : null, [clock.startedAt]);
  const openBreakStartedAt = useMemo(() => clock.openBreakStartedAt ? new Date(clock.openBreakStartedAt) : null, [clock.openBreakStartedAt]);
  const isCompleted = clock.status === "Completed";
  const workedMinutes = isCompleted && typeof clock.workedMinutes === "number" ? clock.workedMinutes : startedAt ? activeElapsedMinutes(startedAt, now, clock.breakMinutes, openBreakStartedAt) : 0;
  const currentBreakMinutes = openBreakStartedAt ? minutesBetween(openBreakStartedAt, now) : 0;
  const isWorking = clock.status === "ClockedIn" || clock.status === "OnBreak";
  const isOnBreak = clock.status === "OnBreak";
  const latestState = [clockInState, clockOutState, startBreakState, endBreakState].findLast((state) => state.status !== "idle") ?? initialActionState;

  useEffect(() => {
    if (latestState.status === "success") {
      setNow(new Date());
      router.refresh();
    }
  }, [latestState.status, latestState.message, router]);

  return (
    <Card className="w-full max-w-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-accent">Time Tracking</p>
          <h3 className="mt-1 text-lg font-semibold">{clock.subjectName}</h3>
          <p className="mt-1 text-xs text-white/48">
            {statusLabel(clock.status)} - {formatDuration(workedMinutes)} worked
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs ${statusTone(clock.status)}`}>{statusLabel(clock.status)}</span>
      </div>

      {clock.canUseControls ? (
        <div className="mt-4 grid gap-2">
          {isWorking ? (
            <form action={clockOutFormAction}>
              {isOnBreak ? <input type="hidden" name="allowOpenBreak" value="on" /> : null}
              <Button className="h-12 w-full bg-danger text-white hover:bg-danger/90" disabled={clockOutPending}>
                <LogOut className="size-4" />
                {clockOutPending ? "Clocking out..." : "Clock Out"}
              </Button>
            </form>
          ) : (
            <form action={clockInFormAction}>
              <Button className="h-12 w-full" variant="accent" disabled={clockInPending}>
                <LogIn className="size-4" />
                {clockInPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {isWorking ? (
            isOnBreak ? (
              <form action={endBreakFormAction}>
                <Button className="h-10 w-full border-danger/40 bg-danger/10 text-danger hover:bg-danger/20" variant="outline" disabled={endBreakPending}>
                  <Coffee className="size-4" />
                  {endBreakPending ? "Ending break..." : "Come Back From Break"}
                </Button>
              </form>
            ) : (
              <form action={startBreakFormAction}>
                <Button className="h-10 w-full border-accent/40 bg-accent/10 text-accent hover:bg-accent/20" variant="outline" disabled={startBreakPending}>
                  <Coffee className="size-4" />
                  {startBreakPending ? "Starting break..." : "Take a Break"}
                </Button>
              </form>
            )
          ) : null}

          {latestState.message ? (
            <p className={`rounded-lg border px-3 py-2 text-xs ${latestState.status === "error" ? "border-danger/30 bg-danger/10 text-danger" : "border-accent/30 bg-accent/10 text-accent"}`}>
              {latestState.message}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-white/52">
          Review-only status for {clock.subjectName}. The employee signs in from their own dashboard.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/42">
        <span>{timezone}</span>
        {startedAt ? <span>Started {startedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: timezone })}</span> : null}
        {isOnBreak ? <span>{formatDuration(clock.breakMinutes + currentBreakMinutes)} break</span> : null}
      </div>
    </Card>
  );
}

function statusLabel(status: string) {
  if (status === "ClockedIn") return "Clocked in";
  if (status === "OnBreak") return "Taking a break";
  if (status === "AwaitingCorrection") return "Needs correction";
  if (status === "Completed") return "Clocked out";
  return "Clocked out";
}

function statusTone(status: string) {
  if (status === "ClockedIn") return "border-accent/40 bg-accent/10 text-accent";
  if (status === "OnBreak") return "border-danger/40 bg-danger/10 text-danger";
  if (status === "AwaitingCorrection") return "border-warning/40 bg-warning/10 text-warning";
  return "border-white/10 bg-white/[0.04] text-white/54";
}
