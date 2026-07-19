import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { submitFeedbackAction, updateFeedbackStatusAction } from "@/server/workflows/feedback";

export default async function FeedbackPage() {
  const user = await requireUser();
  const feedback = await getPrisma().feedbackSubmission.findMany({
    where: user.role === "Founder" ? {} : { submittedById: user.id },
    include: { submittedBy: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <PageSection eyebrow="Mission Feedback" title="Submit Portal Feedback" description="Alex can report trial friction, bugs, missing information, Nova suggestions, and workflow improvements.">
      <Card>
        <form action={submitFeedbackAction} className="grid gap-3 lg:grid-cols-2">
          <select name="type" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
            {["Bug", "WorkflowIssue", "FeatureRequest", "ConfusingInterface", "MissingInformation", "NovaSuggestion", "MissionControlSuggestion", "Other"].map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select name="severity" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
            {["Low", "Medium", "High", "Urgent"].map((severity) => <option key={severity} value={severity}>{severity}</option>)}
          </select>
          <input name="title" required placeholder="Title" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm lg:col-span-2" />
          <input name="pageOrFeature" placeholder="Page or feature" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm lg:col-span-2" />
          <textarea name="description" required placeholder="What happened?" className="min-h-32 rounded-lg border border-white/10 bg-black/24 p-3 text-sm lg:col-span-2" />
          <Button variant="accent" className="lg:col-span-2">Submit feedback</Button>
        </form>
      </Card>
      <div className="mt-5 grid gap-4">
        {feedback.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">{item.type} · {item.severity}</p>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{item.description}</p>
                <p className="mt-3 text-xs text-white/38">Submitted by {item.submittedBy.preferredName ?? item.submittedBy.name}</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs">{item.status}</span>
            </div>
            {user.role === "Founder" ? (
              <form action={updateFeedbackStatusAction} className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]">
                <input type="hidden" name="feedbackId" value={item.id} />
                <select name="status" defaultValue={item.status} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                  {["Reviewing", "Planned", "InProgress", "Completed", "Declined"].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <input name="founderResponse" defaultValue={item.founderResponse ?? ""} placeholder="Founder response" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
                <Button variant="outline">Update</Button>
              </form>
            ) : null}
          </Card>
        ))}
      </div>
    </PageSection>
  );
}
