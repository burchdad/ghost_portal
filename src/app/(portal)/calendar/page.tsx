import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";

export default function CalendarPage() {
  return (
    <PageSection eyebrow="Schedule" title="Calendar" description="Calendar will consolidate meetings, task deadlines, report reminders, approval deadlines, and company events with timezone labels.">
      <Card>
        <p className="text-sm leading-6 text-white/58">
          Phase 1 schema stores deadlines and report dates in UTC. External calendar sync is intentionally deferred until core permissions are proven.
        </p>
      </Card>
    </PageSection>
  );
}
