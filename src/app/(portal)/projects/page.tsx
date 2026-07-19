import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";

export default function ProjectsPage() {
  return (
    <PageSection eyebrow="Delivery" title="Projects" description="Project routes are reserved for the next delivery slice after task, report, and approval workflows are fully interactive.">
      <Card>
        <p className="text-sm leading-6 text-white/58">Project records exist in Prisma and are linked to clients, milestones, tasks, files, comments, and activity.</p>
      </Card>
    </PageSection>
  );
}
