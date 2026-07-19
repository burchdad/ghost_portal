import { notFound, redirect } from "next/navigation";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { decideDraftCommunicationAction, markDraftCommunicationSentAction } from "@/server/workflows/draft-communications";

export default async function CommunicationDetailPage({ params }: { params: Promise<{ communicationId: string }> }) {
  const user = await requireUser();
  const { communicationId } = await params;
  const draft = await getPrisma().draftCommunication.findUnique({
    where: { id: communicationId },
    include: { author: true, client: true, lead: true }
  });

  if (!draft) notFound();
  if (user.role !== "Founder" && draft.authorId !== user.id) redirect("/access-denied");

  return (
    <PageSection eyebrow="Draft communication" title={draft.subject ?? draft.purpose} description={`Status: ${draft.status}`}>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card>
          <p className="text-sm text-white/48">Purpose</p>
          <p className="mt-2 text-sm leading-6 text-white/64">{draft.purpose}</p>
          <p className="mt-6 text-sm text-white/48">Message</p>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-white/64">{draft.body}</pre>
        </Card>
        <Card>
          <p className="text-sm text-white/48">Channel</p>
          <p className="mt-2 font-semibold">{draft.channel}</p>
          <p className="mt-5 text-sm text-white/48">Recipient</p>
          <p className="mt-2 font-semibold">{draft.recipient}</p>
          <p className="mt-5 text-sm text-white/48">Context</p>
          <p className="mt-2 text-sm text-white/64">{draft.client?.company ?? draft.lead?.company ?? "General"}</p>
        </Card>
      </div>

      {user.role === "Founder" && draft.status === "PendingApproval" ? (
        <Card className="mt-5">
          <h3 className="font-semibold">Stephen Review</h3>
          <form action={decideDraftCommunicationAction} className="mt-4 grid gap-3">
            <input type="hidden" name="draftId" value={draft.id} />
            <select name="decision" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              <option value="Approved">Approve</option>
              <option value="ChangesRequested">Request changes</option>
              <option value="Cancelled">Cancel</option>
            </select>
            <textarea name="approvalComments" placeholder="Review comments" className="min-h-24 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <Button variant="accent">Submit decision</Button>
          </form>
        </Card>
      ) : null}

      {draft.status === "Approved" && (draft.authorId === user.id || user.role === "Founder") ? (
        <Card className="mt-5">
          <h3 className="font-semibold">Manual Send Outcome</h3>
          <form action={markDraftCommunicationSentAction} className="mt-4 grid gap-3">
            <input type="hidden" name="draftId" value={draft.id} />
            <textarea name="outcome" required placeholder="Record what happened after manual send" className="min-h-24 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <Button variant="accent">Mark manually sent</Button>
          </form>
        </Card>
      ) : null}
    </PageSection>
  );
}
