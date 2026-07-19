import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { submitDailyReportAction } from "@/server/actions/reports";

export default function NewDailyReportPage() {
  return (
    <PageSection eyebrow="Report" title="Submit end-of-day report" description="Hours are calculated on the server and one report is allowed per user per work date.">
      <Card>
        <form action={submitDailyReportAction} className="grid gap-3 lg:grid-cols-2">
          <input name="reportDate" type="date" required className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
          <input name="breakMinutes" type="number" min="0" max="480" defaultValue="0" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
          <input name="shiftStart" type="datetime-local" required className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
          <input name="shiftEnd" type="datetime-local" required className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
          <textarea name="completed" required placeholder="Completed work" className="min-h-24 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
          <textarea name="inProgress" required placeholder="Work in progress" className="min-h-24 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
          <textarea name="clientUpdates" placeholder="Client updates" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
          <textarea name="leadActivity" placeholder="Lead activity" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
          <textarea name="meetings" placeholder="Meetings" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
          <textarea name="blockers" placeholder="Blockers" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
          <textarea name="waitingOnStephen" placeholder="Waiting on Stephen" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
          <textarea name="recommendations" placeholder="Recommendations" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
          <textarea name="tomorrowPriorities" required placeholder="Tomorrow priorities" className="min-h-24 rounded-lg border border-white/10 bg-black/24 p-3 text-sm lg:col-span-2" />
          <div className="flex gap-3 lg:col-span-2">
            <Button name="submit" value="false" variant="outline">Save draft</Button>
            <Button name="submit" value="true" variant="accent">Submit report</Button>
          </div>
        </form>
      </Card>
    </PageSection>
  );
}
