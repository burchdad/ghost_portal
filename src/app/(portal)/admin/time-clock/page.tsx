import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { formatDuration, minutesBetween } from "@/lib/time-clock";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";
import { adminCloseOpenShiftAction, reviewTimeCorrectionAction } from "@/server/workflows/time-clock";

export default async function AdminTimeClockPage() {
  await requirePermission("reports:review");
  const prisma = getPrisma();
  const now = new Date();
  const [openShifts, recentShifts, corrections] = await Promise.all([
    prisma.workShift.findMany({
      where: { status: { in: ["ClockedIn", "OnBreak", "AwaitingCorrection"] } },
      include: { user: true, breaks: { orderBy: { startedAt: "desc" } } },
      orderBy: { startedAt: "asc" }
    }),
    prisma.workShift.findMany({
      where: { status: "Completed" },
      include: { user: true },
      orderBy: { endedAt: "desc" },
      take: 20
    }),
    prisma.timeCorrectionRequest.findMany({
      include: { requester: true, reviewedBy: true, shift: true },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  return (
    <PageSection eyebrow="Time clock admin" title="Time Clock" description="Review active shifts, repair missed clock-outs, and handle correction requests without using Slack as the source of truth.">
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <Metric label="Open shifts" value={openShifts.length} tone={openShifts.some((shift) => minutesBetween(shift.startedAt, now) >= 12 * 60) ? "danger" : "accent"} />
        <Metric label="On break" value={openShifts.filter((shift) => shift.status === "OnBreak").length} tone="warning" />
        <Metric label="Pending corrections" value={corrections.filter((request) => ["Requested", "UnderReview"].includes(request.status)).length} tone="warning" />
        <Metric label="Long recent shifts" value={recentShifts.filter((shift) => (shift.netMinutes ?? 0) > 12 * 60).length} tone="danger" />
      </div>

      <Card className="mb-5">
        <h3 className="font-semibold">Open Shifts</h3>
        <p className="mt-1 text-sm text-white/50">Use this only when an employee reports a missed clock-out or the timer clearly failed.</p>
        <div className="mt-4 space-y-3">
          {openShifts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/12 bg-black/12 p-4 text-sm text-white/42">No open shifts right now.</p>
          ) : openShifts.map((shift) => {
            const elapsed = minutesBetween(shift.startedAt, now);
            const openBreak = shift.breaks.find((item) => !item.endedAt);
            return (
              <div key={shift.id} className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-4 xl:grid-cols-[1fr_560px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold">{shift.user.preferredName ?? shift.user.name}</h4>
                    <Badge>{shift.status}</Badge>
                    {elapsed >= 12 * 60 ? <Badge>Needs review</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-white/58">Started {formatDate(shift.startedAt)} · open for {formatDuration(elapsed)}</p>
                  <p className="mt-1 text-sm text-white/48">{shift.user.email} · {shift.user.timezone}</p>
                  {openBreak ? <p className="mt-2 text-sm text-warning">Open break since {formatDate(openBreak.startedAt)}</p> : null}
                </div>
                <form action={adminCloseOpenShiftAction} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <input type="hidden" name="shiftId" value={shift.id} />
                  <label className="grid gap-1 text-xs font-medium text-white/60">
                    Clock-out time
                    <input name="endedAt" type="datetime-local" required className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm text-white" />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-white/60">
                    Repair note
                    <input name="note" required placeholder="Employee reported 10PM-6AM PH time" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm text-white" />
                  </label>
                  <Button className="self-end" variant="accent">Close shift</Button>
                </form>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <SimpleTable
          columns={["Employee", "Ended", "Gross", "Break", "Net", "Status"]}
          empty="No completed shifts found."
          rows={recentShifts.map((shift) => [
            shift.user.preferredName ?? shift.user.name,
            shift.endedAt ? formatDate(shift.endedAt) : "Not set",
            formatDuration(shift.grossMinutes ?? 0),
            formatDuration(shift.breakMinutes),
            formatDuration(shift.netMinutes ?? 0),
            (shift.netMinutes ?? 0) > 12 * 60 ? <Badge key="long">Review</Badge> : <Badge key="ok">Completed</Badge>
          ])}
        />

        <Card>
          <h3 className="font-semibold">Correction Requests</h3>
          <div className="mt-4 space-y-3">
            {corrections.length === 0 ? <p className="rounded-lg border border-dashed border-white/12 bg-black/12 p-4 text-sm text-white/42">No correction requests found.</p> : corrections.map((request) => (
              <div key={request.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{request.requester.preferredName ?? request.requester.name}</span>
                  <Badge>{request.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-white/58">{request.reason}</p>
                {request.supportingNote ? <p className="mt-1 text-sm text-white/44">{request.supportingNote}</p> : null}
                <p className="mt-2 text-xs text-white/38">Requested {formatDate(request.createdAt)}</p>
                {["Requested", "UnderReview"].includes(request.status) ? (
                  <form action={reviewTimeCorrectionAction} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input type="hidden" name="correctionId" value={request.id} />
                    <select name="status" defaultValue="UnderReview" className="h-9 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                      <option value="UnderReview">Under review</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <input name="founderComment" placeholder="Review note" className="h-9 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
                    <Button size="sm" variant="outline">Update</Button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageSection>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "accent" | "warning" | "danger" }) {
  const toneClass = tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-accent";
  return (
    <Card>
      <p className="text-xs text-white/42">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${toneClass}`}>{value}</p>
    </Card>
  );
}

function formatDate(value: Date) {
  return value.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}
