import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/server/permissions/authorize";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <PageSection eyebrow="Account" title="Settings" description="Personal account settings and timezone context.">
      <Card>
        <p className="text-sm text-white/48">Timezone</p>
        <p className="mt-2 text-lg font-semibold">{user.timezone}</p>
      </Card>
    </PageSection>
  );
}
