import { notFound, redirect } from "next/navigation";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateTimePicker } from "@/components/portal/date-time-controls";
import { canAccessLead, minimizeLeadForUser, requireUser } from "@/server/permissions/authorize";
import { getPrisma } from "@/server/db/prisma";
import { grantLeadAccessAction, revokeLeadAccessAction } from "@/server/workflows/record-access";
import { logCallActivityAction, requestPricingApprovalAction, requestStephenLeadReviewAction, sendLeadToMissionControlAction, updateLeadOperationalAction, updateLeadQualificationAction } from "@/server/workflows/leads";
import { CopyContactButton } from "./copy-contact-button";

const leadSources = ["Manual Cold Call", "Vega", "Referral", "Facebook", "Networking", "Website Inquiry", "Email", "Partner", "Existing Relationship", "Other"];
const outcomes = ["No Answer", "Voicemail Left", "Wrong Number", "Gatekeeper Reached", "Decision-Maker Reached", "Callback Requested", "Not Interested", "Interested", "Meeting Booked", "Do Not Contact"];
const needs = ["Website", "SEO", "AEO", "GEO", "Lead Generation", "Marketing", "Social Media", "Paid Advertising", "Automation", "Custom AI", "CRM", "Digital Business Cards", "General Business Growth", "Unknown", "Needs Discovery"];
const interests = ["Unknown", "Low", "Possible", "Interested", "StrongInterest", "MeetingRequested"];

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const user = await requireUser();
  const { leadId } = await params;
  const allowed = await canAccessLead(user, leadId);
  if (!allowed) redirect("/access-denied");

  const [lead, users, services] = await Promise.all([
    getPrisma().lead.findUnique({
      where: { id: leadId },
      include: {
        access: { include: { user: true } },
        assignedUser: true,
        createdBy: true,
        callActivities: { include: { user: true }, orderBy: { occurredAt: "desc" } },
        pricingRequests: { orderBy: { createdAt: "desc" } }
      }
    }),
    getPrisma().user.findMany({ where: { status: "Active" }, include: { role: true }, orderBy: { name: "asc" } }),
    getPrisma().serviceOffering.findMany({ where: { active: true, archivedAt: null }, orderBy: [{ offerType: "asc" }, { displayOrder: "asc" }, { name: "asc" }] })
  ]);
  if (!lead) notFound();

  const visibleLead = minimizeLeadForUser(user, lead);
  const lastActivity = lead.callActivities[0];

  return (
    <PageSection eyebrow="Lead workspace" title={visibleLead.company} description="Progressively enrich raw prospects, log calls, and hand off only when enough signal exists.">
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <Card id="quick-call" className="sticky top-5">
            <div className="flex flex-wrap gap-2">
              <Badge>{visibleLead.leadSource ?? "Unknown source"}</Badge>
              <Badge>{visibleLead.stage}</Badge>
              <Badge>{interestLabel(visibleLead.interestLevel)}</Badge>
            </div>
            <h3 className="mt-4 font-semibold">Quick Call</h3>
            <div className="mt-3 grid gap-2 text-sm text-white/58">
              <p>Contact: {visibleLead.contactName ?? "Unknown"}</p>
              <p>Website: {visibleLead.website ?? "Not set"}</p>
              <p>Angle: {visibleLead.conversationAngle ?? callAngle(visibleLead)}</p>
              <p>Last activity: {lastActivity ? `${lastActivity.outcome} · ${lastActivity.summary}` : "No calls yet"}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {visibleLead.contactPhone ? <CopyContactButton value={visibleLead.contactPhone} label="Copy phone" /> : null}
              {visibleLead.contactEmail ? <CopyContactButton value={visibleLead.contactEmail} label="Copy email" /> : null}
              {visibleLead.contactPhone ? <Button asChild size="sm" variant="outline"><a href={`tel:${visibleLead.contactPhone}`}>Call</a></Button> : null}
            </div>
            <form action={logCallActivityAction} className="mt-4 grid gap-3">
              <input type="hidden" name="leadId" value={visibleLead.id} />
              <div className="grid grid-cols-2 gap-2">
                {outcomes.map((outcome) => <Button key={outcome} name="outcome" value={outcome} size="sm" variant="outline">{outcome}</Button>)}
              </div>
              <input name="personReached" placeholder="Person reached" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <select name="decisionMakerStatus" defaultValue={visibleLead.decisionMakerStatus ?? ""} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                {["", "Unknown", "Gatekeeper", "Influencer", "Decision-maker confirmed", "Not decision-maker"].map((option) => <option key={option} value={option}>{option || "Decision-maker status"}</option>)}
              </select>
              <textarea name="summary" required placeholder="Fast notes / call summary" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              <textarea name="objection" placeholder="Objection" className="min-h-16 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              <textarea name="nextAction" placeholder="Next action" defaultValue={visibleLead.nextAction ?? ""} className="min-h-16 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              <DateTimePicker name="followUpDate" label="Follow-up" helper="Optional callback or next touch." timezone={user.timezone} defaultValue={visibleLead.followUpDate} optional />
              <div className="grid gap-2 text-xs text-white/58">
                <label><input name="callbackRequested" type="checkbox" /> Callback requested</label>
                <label><input name="doNotContact" type="checkbox" defaultChecked={visibleLead.doNotContact} /> Do not contact</label>
                <label><input name="pricingRequested" type="checkbox" /> Pricing requested</label>
                <label><input name="discountRequested" type="checkbox" /> Discount requested</label>
                <label><input name="timelineCommitmentRequested" type="checkbox" /> Timeline commitment requested</label>
                <label><input name="scopeChangeRequested" type="checkbox" /> Scope change requested</label>
                <label><input name="customDevelopmentDiscussed" type="checkbox" /> Custom development discussed</label>
                <label><input name="sensitiveIssue" type="checkbox" /> Legal, security, financial, or public issue</label>
                <label><input name="needsStephen" type="checkbox" /> Needs Stephen</label>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h3 className="font-semibold">Basic Information</h3>
            <form action={updateLeadOperationalAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="leadId" value={visibleLead.id} />
              <input name="company" required defaultValue={visibleLead.company} placeholder="Business name" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="contactName" defaultValue={visibleLead.contactName ?? ""} placeholder="Contact name" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="jobTitle" defaultValue={visibleLead.jobTitle ?? ""} placeholder="Job title" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="contactPhone" defaultValue={visibleLead.contactPhone ?? ""} placeholder="Phone" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="contactEmail" defaultValue={visibleLead.contactEmail ?? ""} placeholder="Email" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="website" defaultValue={visibleLead.website ?? ""} placeholder="Website" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="industry" defaultValue={visibleLead.industry ?? ""} placeholder="Industry" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="location" defaultValue={visibleLead.location ?? ""} placeholder="Location" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="timezone" defaultValue={visibleLead.timezone ?? ""} placeholder="Time zone" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <select name="leadSource" defaultValue={visibleLead.leadSource ?? "Manual Cold Call"} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                {leadSources.map((source) => <option key={source} value={source}>{source}</option>)}
              </select>
              {user.role === "Founder" ? (
                <select name="assignedUserId" defaultValue={visibleLead.assignedUserId ?? ""} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                  <option value="">Assigned caller</option>
                  {users.map((row) => <option key={row.id} value={row.id}>{row.preferredName ?? row.name}</option>)}
                </select>
              ) : null}
              <textarea name="notes" defaultValue={visibleLead.notes ?? ""} placeholder="Initial / operational notes" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm md:col-span-2" />
              <div className="text-xs text-white/42 md:col-span-2">
                Created by {lead.createdBy?.preferredName ?? lead.createdBy?.name ?? "Unknown"} · Assigned caller {lead.assignedUser?.preferredName ?? lead.assignedUser?.name ?? "Unassigned"} · {lead.createdAt.toLocaleString("en-US")}
              </div>
              <Button className="md:col-span-2" variant="accent">Save basic information</Button>
            </form>
          </Card>

          <Card>
            <h3 className="font-semibold">Need Discovered and Interest</h3>
            <form action={updateLeadQualificationAction} className="mt-4 grid gap-3">
              <input type="hidden" name="leadId" value={visibleLead.id} />
              <div className="grid gap-2 md:grid-cols-3">
                {needs.map((need) => (
                  <label key={need} className="text-sm text-white/62"><input name="needDiscovered" type="checkbox" value={need} defaultChecked={visibleLead.needDiscovered.includes(need)} /> {need}</label>
                ))}
              </div>
              <select name="interestLevel" defaultValue={visibleLead.interestLevel} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                {interests.map((interest) => <option key={interest} value={interest}>{interestLabel(interest)}</option>)}
              </select>
              <Button variant="accent">Save need and interest</Button>
            </form>
          </Card>

          <Card>
            <h3 className="font-semibold">Qualification</h3>
            <form action={updateLeadQualificationAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="leadId" value={visibleLead.id} />
              <input type="hidden" name="interestLevel" value={visibleLead.interestLevel} />
              {visibleLead.needDiscovered.map((need) => <input key={need} type="hidden" name="needDiscovered" value={need} />)}
              <select name="decisionMakerStatus" defaultValue={visibleLead.decisionMakerStatus ?? ""} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                {["", "Unknown", "Gatekeeper", "Influencer", "Decision-maker confirmed", "Not decision-maker"].map((option) => <option key={option} value={option}>{option || "Decision-maker status"}</option>)}
              </select>
              <input name="existingVendor" defaultValue={visibleLead.existingVendor ?? ""} placeholder="Existing provider" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="currentWebsite" defaultValue={visibleLead.currentWebsite ?? ""} placeholder="Current website" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="currentMarketing" defaultValue={visibleLead.marketingStatus ?? ""} placeholder="Current marketing" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="currentLeadFlow" defaultValue={visibleLead.currentLeadFlow ?? ""} placeholder="Current lead flow" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="mainPainPoint" defaultValue={visibleLead.mainPainPoint ?? ""} placeholder="Main pain point" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="urgency" defaultValue={visibleLead.urgency ?? ""} placeholder="Urgency" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="budgetComfort" defaultValue={visibleLead.budgetComfort ?? ""} placeholder="Budget comfort" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="employeeCount" defaultValue={visibleLead.employeeCount ?? ""} placeholder="Employee count range" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="approximateRevenue" defaultValue={visibleLead.approximateRevenue ?? ""} placeholder="Revenue range" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="numberOfLocations" defaultValue={visibleLead.numberOfLocations ?? ""} placeholder="Number of locations" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <select name="recommendedGhostOffer" defaultValue={visibleLead.recommendedGhostOffer ?? "Needs Discovery"} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                {["Needs Discovery", "Founder Launch", "Startup", "Growth", "Scale", "Enterprise", "Standalone Website", "GEO", "Vega", "Echo", "Nova", "Website Care", "Digital Cards", "Custom AI", "Custom Development", "Consulting", "Not Qualified"].map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <select name="recommendedServiceId" defaultValue={visibleLead.recommendedServiceId ?? ""} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                <option value="">Link approved offer record</option>
                {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
              <input name="appointmentStatus" defaultValue={visibleLead.appointmentStatus ?? ""} placeholder="Appointment status" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="valueSuggestionRange" defaultValue={visibleLead.valueSuggestionRange ?? ""} placeholder="Operations value range suggestion, if permitted" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <textarea name="qualificationSummary" defaultValue={visibleLead.qualificationSummary ?? ""} placeholder="Qualification summary" className="min-h-24 rounded-lg border border-white/10 bg-black/24 p-3 text-sm md:col-span-2" />
              <Button className="md:col-span-2" variant="accent">Save qualification</Button>
            </form>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h3 className="font-semibold">Follow-Up</h3>
              <form action={updateLeadOperationalAction} className="mt-4 grid gap-3">
                <input type="hidden" name="leadId" value={visibleLead.id} />
                <input type="hidden" name="company" value={visibleLead.company} />
                <textarea name="nextAction" defaultValue={visibleLead.nextAction ?? ""} placeholder="Recommended next action" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
                <DateTimePicker name="followUpDate" label="Next follow-up" helper="Optional reminder or scheduled callback." timezone={user.timezone} defaultValue={visibleLead.followUpDate} optional />
                <Button variant="accent">Save and Continue Outreach</Button>
              </form>
              <form action={requestStephenLeadReviewAction} className="mt-4 grid gap-3 border-t border-white/10 pt-4">
                <input type="hidden" name="leadId" value={visibleLead.id} />
                <textarea name="reason" required defaultValue={visibleLead.needsStephenReason ?? ""} placeholder="Why Stephen needs to review" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
                <input name="recommendation" placeholder="Recommended decision or next step" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
                <Button variant="outline">Needs Stephen Review</Button>
              </form>
            </Card>

            <Card>
              <h3 className="font-semibold">Mission Control Handoff</h3>
              <div className="mt-3 grid gap-2 text-sm text-white/58">
                <p>Handoff: {handoffLabel(visibleLead.handoffStatus)}</p>
                <p>Mission Control: {visibleLead.missionControlStatus}</p>
                <p>Stage: {visibleLead.missionControlStage ?? "Not set"}</p>
              </div>
              <form action={sendLeadToMissionControlAction} className="mt-4 grid gap-3">
                <input type="hidden" name="leadId" value={visibleLead.id} />
                <textarea name="conversationSummary" required defaultValue={latestConversationSummary(lead.callActivities)} placeholder="Conversation summary" className="min-h-24 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
                <textarea name="recommendedNextAction" required defaultValue={visibleLead.nextAction ?? ""} placeholder="Recommended next action" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
                <Button name="level" value="discovery" variant="outline">Send to Mission Control for Discovery</Button>
                <Button name="level" value="qualified" variant="accent">Promote as Qualified Opportunity</Button>
              </form>
            </Card>
          </div>

          <Card>
            <h3 className="font-semibold">Timeline</h3>
            <div className="mt-4 space-y-3">
              {lead.callActivities.length === 0 ? <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-white/48">No calls have been logged for this lead yet.</p> : null}
              {lead.callActivities.map((activity) => (
                <div key={activity.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge>{activity.outcome}</Badge>
                    <span className="font-mono text-xs text-white/38">{activity.occurredAt.toLocaleString("en-US")}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/62">{activity.summary}</p>
                  {activity.personReached ? <p className="mt-2 text-sm text-white/44">Reached: {activity.personReached}</p> : null}
                  {activity.objection ? <p className="mt-2 text-sm text-white/44">Objection: {activity.objection}</p> : null}
                  {activity.nextAction ? <p className="mt-2 text-sm text-white/44">Next: {activity.nextAction}</p> : null}
                  <p className="mt-2 text-xs text-white/36">Logged by {activity.user.preferredName ?? activity.user.name}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold">Request Pricing Approval</h3>
            <form action={requestPricingApprovalAction} className="mt-4 grid gap-3">
              <input type="hidden" name="leadId" value={visibleLead.id} />
              <input type="hidden" name="business" value={visibleLead.company} />
              <select name="serviceId" defaultValue={visibleLead.recommendedServiceId ?? ""} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                <option value="">Offer needing approval</option>
                {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
              <input name="recommendedOffer" defaultValue={visibleLead.recommendedGhostOffer ?? "Needs Discovery"} required placeholder="Recommended offer" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <textarea name="currentPain" defaultValue={visibleLead.mainPainPoint ?? ""} required placeholder="Current pain" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              <input name="requestedPricing" placeholder="Requested pricing" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="requestedDiscount" placeholder="Requested discount" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="requestedTerm" placeholder="Requested term" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <textarea name="recommendation" required placeholder="Recommendation" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              <Button variant="accent">Request Stephen approval</Button>
            </form>
          </Card>
        </div>
      </div>

      {user.role === "Founder" ? (
        <Card className="mt-5">
          <h3 className="font-semibold">Access Management</h3>
          <form action={grantLeadAccessAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_auto]">
            <input type="hidden" name="leadId" value={visibleLead.id} />
            <select name="userId" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              {users.filter((row) => row.role.name !== "Founder").map((row) => <option key={row.id} value={row.id}>{row.preferredName ?? row.name}</option>)}
            </select>
            <select name="access" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              {["View", "Edit", "Manage"].map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
            <Button variant="accent">Grant access</Button>
          </form>
          <div className="mt-4 space-y-2">
            {lead.access.map((access) => (
              <form key={access.userId} action={revokeLeadAccessAction} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm">
                <span>{access.user.preferredName ?? access.user.name}: {access.access}</span>
                <input type="hidden" name="leadId" value={visibleLead.id} />
                <input type="hidden" name="userId" value={access.userId} />
                <Button size="sm" variant="outline">Revoke</Button>
              </form>
            ))}
          </div>
        </Card>
      ) : null}
    </PageSection>
  );
}

function interestLabel(value: string) {
  if (value === "StrongInterest") return "Strong Interest";
  if (value === "MeetingRequested") return "Meeting Requested";
  return value;
}

function handoffLabel(value: string) {
  if (value === "SalesReadyNeedsDiscovery") return "Sales-Ready - Needs Discovery";
  if (value === "QualifiedAwaitingFounderReview") return "Qualified - Awaiting Founder Review";
  if (value === "SentToMissionControl") return "Sent to Mission Control";
  if (value === "ReturnedForInformation") return "Returned for Information";
  return "Ops Portal Only";
}

function callAngle(lead: { industry: string | null; website: string | null; needDiscovered: string[]; leadSource: string | null }) {
  if (lead.needDiscovered.length) return `Ask about ${lead.needDiscovered.slice(0, 2).join(" and ")}.`;
  if (lead.website) return "Open with website visibility and lead capture.";
  if (lead.industry) return `Open with growth and follow-up challenges for ${lead.industry}.`;
  if (lead.leadSource === "Vega") return "Reference Vega research and ask one discovery question.";
  return "Confirm the right contact and ask what growth channel needs the most attention.";
}

function latestConversationSummary(activities: Array<{ outcome: string; summary: string }>) {
  const latest = activities[0];
  return latest ? `${latest.outcome}: ${latest.summary}` : "";
}
