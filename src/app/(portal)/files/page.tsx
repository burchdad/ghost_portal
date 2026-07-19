import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";

export default function FilesPage() {
  return (
    <PageSection eyebrow="Storage" title="Files" description="File metadata and access controls are modeled. UploadThing or a production storage adapter can be enabled with environment configuration.">
      <Card>
        <p className="text-sm leading-6 text-white/58">
          Phase 1 file handling validates metadata, record linkage, and permission boundaries before exposing storage URLs.
        </p>
      </Card>
    </PageSection>
  );
}
