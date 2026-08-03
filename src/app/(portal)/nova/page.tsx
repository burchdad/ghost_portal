import { PageSection } from "@/components/portal/page-section";
import { buildNovaSummary } from "@/server/data/dashboard";
import { requireUser } from "@/server/permissions/authorize";
import { NovaChat } from "@/app/(portal)/nova/nova-chat";

export default async function NovaPage() {
  const user = await requireUser();
  const summary = await buildNovaSummary(user);
  const userName = user.preferredName ?? user.name;

  return (
    <PageSection eyebrow="Nova" title="AI Agent" description="Permission-scoped operational assistant for priorities, leads, approvals, SOPs, and daily reporting.">
      <NovaChat summary={summary} userName={userName} userRole={user.role} />
    </PageSection>
  );
}
