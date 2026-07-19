import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";

export default function FeedbackPage() {
  return (
    <PageSection eyebrow="Mission Feedback" title="Submit Portal Feedback" description="Alex can report trial friction, bugs, missing information, Nova suggestions, and workflow improvements.">
      <Card>
        <p className="text-sm leading-6 text-white/58">
          Feedback submissions are persisted by the Phase 1 model and routed to Stephen for review.
        </p>
      </Card>
    </PageSection>
  );
}
