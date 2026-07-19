import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function DailyReportsPage() {
  const user = await requireUser();
  const reports = await getPrisma().dailyReport.findMany({
    where: user.role === "Founder" ? {} : { userId: user.id },
    include: { user: true },
    orderBy: { reportDate: "desc" },
    take: 30
  });

  return (
    <PageSection eyebrow="End of day" title="Daily Reports" description="One report per user per work date, with review status and weekly hour visibility.">
      <div className="mb-4 flex justify-end">
        <Button asChild variant="accent">
          <Link href="/daily-reports/new">New report</Link>
        </Button>
      </div>
      <SimpleTable
        columns={["Date", "User", "Hours", "Status"]}
        empty="No reports submitted yet."
        rows={reports.map((report) => [
          <Link key="date" href={`/daily-reports/${report.id}`} className="font-medium text-white hover:text-accent">
            {report.reportDate.toISOString().slice(0, 10)}
          </Link>,
          report.user.preferredName ?? report.user.name,
          Number(report.hoursWorked).toFixed(1),
          report.status
        ])}
      />
    </PageSection>
  );
}
