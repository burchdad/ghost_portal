import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";

export default function NewDailyReportPage() {
  return (
    <PageSection eyebrow="Report" title="Submit end-of-day report" description="Server action persistence is wired in Phase 1; this form shell preserves the required fields.">
      <Card>
        <p className="text-sm leading-6 text-white/58">
          Required fields: report date, shift start, shift end, break minutes, completed work, work in progress, blockers, Waiting on Stephen, recommendations, and tomorrow priorities.
        </p>
      </Card>
    </PageSection>
  );
}
