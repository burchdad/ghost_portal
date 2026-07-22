import Link from "next/link";
import { Clock3, LogIn, LogOut } from "lucide-react";
import type { TimeClockSnapshot } from "@/server/data/time-clock";
import { clockInAction, clockOutAction } from "@/server/actions/reports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TimeClockCard({ clock }: { clock: TimeClockSnapshot }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-accent" />
            <h3 className="text-base font-semibold">{clock.subjectName} time clock</h3>
          </div>
          <p className="mt-2 text-sm text-white/52">
            {clock.workDate} - {clock.timezone}
          </p>
        </div>
        <Badge className={statusTone(clock.status)}>{labelize(clock.status)}</Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <Metric label="Started" value={clock.shiftStartLabel} />
        <Metric label="Ended" value={clock.shiftEndLabel} />
        <Metric label="Worked" value={clock.hoursLabel} />
        <Metric label="Break" value={clock.breakLabel} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {clock.canUseControls && clock.status === "NotStarted" ? (
          <form action={clockInAction}>
            <Button variant="accent">
              <LogIn className="size-4" />
              Clock in
            </Button>
          </form>
        ) : null}
        {clock.canUseControls && clock.status === "ClockedIn" ? (
          <form action={clockOutAction}>
            <Button variant="accent">
              <LogOut className="size-4" />
              Clock out
            </Button>
          </form>
        ) : null}
        <Button asChild variant="outline">
          <Link href={clock.reportHref}>{clock.reportId ? "Open report" : "Start report"}</Link>
        </Button>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/16 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-white/34">{label}</p>
      <p className="mt-2 text-sm font-medium text-white/78">{value}</p>
    </div>
  );
}

function labelize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function statusTone(status: TimeClockSnapshot["status"]) {
  if (status === "ClockedIn") return "border-accent/40 bg-accent/10 text-accent";
  if (status === "ClockedOut") return "border-warning/40 bg-warning/10 text-warning";
  if (status === "Submitted") return "border-white/20 bg-white/[0.06] text-white/70";
  return "border-white/20 bg-white/[0.04] text-white/54";
}
