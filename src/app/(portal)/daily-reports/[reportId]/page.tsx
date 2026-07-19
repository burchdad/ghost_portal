import { notFound, redirect } from "next/navigation";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { reviewDailyReportAction } from "@/server/actions/reports";

export default async function DailyReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const user = await requireUser();
  const { reportId } = await params;
  const report = await getPrisma().dailyReport.findUnique({ where: { id: reportId }, include: { user: true } });
  if (!report) notFound();
  if (user.role !== "Founder" && report.userId !== user.id) redirect("/access-denied");

  return (
    <PageSection eyebrow="Report" title={`${report.user.preferredName ?? report.user.name} - ${report.reportDate.toISOString().slice(0, 10)}`} description={`Status: ${report.status}`}>
      <Card>
        <h3 className="font-semibold">Completed</h3>
        <p className="mt-3 text-sm leading-6 text-white/58">{report.completed}</p>
      </Card>
      {user.role === "Founder" ? (
        <Card className="mt-5">
          <h3 className="font-semibold">Founder Review</h3>
          <form action={reviewDailyReportAction} className="mt-4 grid gap-3">
            <input type="hidden" name="reportId" value={report.id} />
            <select name="status" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              <option value="Reviewed">Mark reviewed</option>
              <option value="ChangesRequested">Request changes</option>
            </select>
            <textarea name="reviewerNotes" placeholder="Review notes" className="min-h-24 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <Button variant="accent">Submit review</Button>
          </form>
        </Card>
      ) : null}
    </PageSection>
  );
}
