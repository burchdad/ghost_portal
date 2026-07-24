"use client";

import { useEffect, useMemo, useState } from "react";
import { Coffee, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { activeElapsedMinutes, formatDuration, minutesBetween } from "@/lib/time-clock";

import { clockInAction, clockOutAction, endBreakAction, startBreakAction } from "@/server/workflows/time-clock";

export function TimeClockCard({
  clock,
  timezone
}: {
  clock: {
    subjectName: string;
    status: "ClockedOut" | "ClockedIn" | "OnBreak" | "AwaitingCorrection" | "Completed";
    canUseControls: boolean;
    shiftId?: string;
    startedAt?: string;
    openBreakStartedAt?: string;
    breakMinutes: number;
    dailyReportStatus: string;
  };
  timezone: string;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const startedAt = useMemo(() => clock.startedAt ? new Date(clock.startedAt) : null, [clock.startedAt]);
  const openBreakStartedAt = useMemo(() => clock.openBreakStartedAt ? new Date(clock.openBreakStartedAt) : null, [clock.openBreakStartedAt]);
  const workedMinutes = startedAt ? activeElapsedMinutes(startedAt, now, clock.breakMinutes, openBreakStartedAt) : 0;
  const currentBreakMinutes = openBreakStartedAt ? minutesBetween(openBreakStartedAt, now) : 0;
  const isWorking = clock.status === "ClockedIn" || clock.status === "OnBreak";
  const isOnBreak = clock.status === "OnBreak";

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
            <form action={clockOutAction}>
              {isOnBreak ? <input type="hidden" name="allowOpenBreak" value="on" /> : null}
              <Button className="h-12 w-full bg-danger text-white hover:bg-danger/90">
                <LogOut className="size-4" />
                Clock Out
              </Button>
            </form>
          ) : (
            <form action={clockInAction}>
              <Button className="h-12 w-full" variant="accent">
                <LogIn className="size-4" />
                Sign In
              </Button>
            </form>
          )}

          {isWorking ? (
            isOnBreak ? (
              <form action={endBreakAction}>
                <Button className="h-10 w-full border-danger/40 bg-danger/10 text-danger hover:bg-danger/20" variant="outline">
                  <Coffee className="size-4" />
                  Come Back From Break
                </Button>
              </form>
            ) : (
              <form action={startBreakAction}>
                <Button className="h-10 w-full border-accent/40 bg-accent/10 text-accent hover:bg-accent/20" variant="outline">
                  <Coffee className="size-4" />
                  Take a Break
                </Button>
              </form>
            )
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
