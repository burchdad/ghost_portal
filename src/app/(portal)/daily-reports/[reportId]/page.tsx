import { notFound, redirect } from "next/navigation";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

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
    </PageSection>
  );
}
