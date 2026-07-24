"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { activeElapsedMinutes, formatDuration, minutesBetween } from "@/lib/time-clock";
import { clockInAction, clockOutAction, endBreakAction, requestTimeCorrectionAction, startBreakAction } from "@/server/workflows/time-clock";

export function TimeClockCard({
  clock,
  timezone
}: {
  clock: {
    status: "ClockedOut" | "ClockedIn" | "OnBreak" | "AwaitingCorrection" | "Completed";
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
  const elapsed = startedAt ? activeElapsedMinutes(startedAt, now, clock.breakMinutes, openBreakStartedAt) : 0;
  const openBreak = openBreakStartedAt ? minutesBetween(openBreakStartedAt, now) : 0;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Time Clock</p>
          <h3 className="mt-2 text-2xl font-semibold">{statusLabel(clock.status)}</h3>
          <p className="mt-2 text-sm text-white/52">Daily report: {clock.dailyReportStatus}</p>
        </div>
        <button type="button" onClick={() => window.location.reload()} className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]" aria-label="Refresh time clock">
          <RefreshCw className="size-4" />
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label="Clock-in time" value={startedAt ? startedAt.toLocaleString("en-US", { timeZone: timezone }) : "Not clocked in"} />
        <Metric label="Work time" value={formatDuration(elapsed)} />
        <Metric label="Break time" value={formatDuration(clock.breakMinutes + openBreak)} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {clock.status === "ClockedOut" ? <form action={clockInAction}><Button variant="accent">Clock in</Button></form> : null}
        {clock.status === "ClockedIn" ? <form action={startBreakAction}><Button variant="outline">Start break</Button></form> : null}
        {clock.status === "OnBreak" ? <form action={endBreakAction}><Button variant="outline">End break</Button></form> : null}
        {clock.status === "ClockedIn" || clock.status === "OnBreak" ? (
          <form action={clockOutAction} className="flex items-center gap-2">
            {clock.status === "OnBreak" ? <label className="text-xs text-white/52"><input name="allowOpenBreak" type="checkbox" /> confirm open break</label> : null}
            <Button>Clock out</Button>
          </form>
        ) : null}
      </div>

      <details className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <summary className="cursor-pointer text-sm font-medium">Request time correction</summary>
        <form action={requestTimeCorrectionAction} className="mt-4 grid gap-3">
          <input type="hidden" name="shiftId" value={clock.shiftId ?? ""} />
          <input name="requestedStartTime" type="datetime-local" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
          <input name="requestedEndTime" type="datetime-local" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
          <input name="requestedBreakDuration" type="number" min="0" placeholder="Requested break minutes" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
          <select name="reason" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
            {["Forgot to clock in", "Forgot to clock out", "Timer displayed incorrectly", "Device restart interrupted timer", "Break recorded incorrectly"].map((reason) => <option key={reason} value={reason}>{reason}</option>)}
          </select>
          <textarea name="supportingNote" placeholder="Supporting note" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
          <Button variant="outline">Submit correction request</Button>
        </form>
      </details>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-black/18 p-3"><p className="text-xs text-white/40">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>;
}

function statusLabel(status: string) {
  if (status === "ClockedIn") return "Clocked in";
  if (status === "OnBreak") return "On break";
  if (status === "AwaitingCorrection") return "Shift awaiting correction";
  if (status === "Completed") return "Shift completed";
  return "Clocked out";
}
