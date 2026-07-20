import type { RoleName, SOPCategory } from "@prisma/client";

export type PortalRoute = {
  label: string;
  path: string;
};

export type SOPDefinition = {
  sourceKey: string;
  title: string;
  category: SOPCategory;
  purpose: string;
  owner: string;
  audience: RoleName[];
  estimatedMinutes: number;
  useWhen: string[];
  doNotUseWhen: string[];
  prerequisites: string[];
  requiredInputs: string[];
  steps: Array<{
    title: string;
    instruction: string;
    expectedOutcome: string;
    warning?: string;
  }>;
  approvalPoints: string[];
  escalationConditions: string[];
  documentationRequirements: string[];
  completionCriteria: string[];
  examples: {
    good: string;
    bad: string;
  };
  relatedPortalRoutes: PortalRoute[];
  relatedTemplates: string[];
  relatedSOPKeys: string[];
  commonMistakes: string[];
  qualityChecklist: string[];
  founderReviewQuestions: string[];
};

export type KnowledgeArticleDefinition = {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  audience: RoleName[];
  sections: Array<{
    heading: string;
    body: string;
  }>;
  practicalExamples: string[];
  roleImpact: string[];
  misconceptions: string[];
  relatedTerms: string[];
  relatedSOPKeys: string[];
  relatedPortalRoutes: PortalRoute[];
  founderReviewQuestions: string[];
};

const founderRole: RoleName = "Founder";
const operationsRole: RoleName = "Operations";
const audience: RoleName[] = [founderRole, operationsRole];

const r = (label: string, path: string): PortalRoute => ({ label, path });

function sop(
  number: number,
  title: string,
  category: SOPCategory,
  input: Omit<SOPDefinition, "sourceKey" | "title" | "category" | "owner" | "audience">
): SOPDefinition {
  return {
    sourceKey: `sop_${number}_${slug(title)}`,
    title,
    category,
    owner: "Founder",
    audience,
    ...input
  };
}

export const sopDefinitions: SOPDefinition[] = [
  sop(1, "Start-of-shift review", "Operations", {
    purpose: "Make sure Alex starts each shift from the current source of truth instead of memory, chat fragments, or yesterday's assumptions.",
    estimatedMinutes: 15,
    useWhen: ["At the beginning of every scheduled shift", "Before touching client, lead, content, or meeting work", "After returning from a long break when priorities may have changed"],
    doNotUseWhen: ["There is an urgent security, client, legal, or production issue that must be escalated first", "Stephen has already given a direct emergency instruction for the first task"],
    prerequisites: ["Ghost Portal access", "Current shift schedule", "Assigned task, client, lead, and meeting access", "Approved urgent contact channel if escalation is needed"],
    requiredInputs: ["Dashboard timezone", "Unread notifications", "Announcements", "Today priorities", "Overdue and due-soon tasks", "Waiting on Stephen responses", "Client and lead follow-ups", "Approved drafts", "Calendar items", "Previous report feedback"],
    steps: [
      { title: "Log in and verify context", instruction: "Open Ghost Portal, confirm the displayed user is Alex, and verify the dashboard timezone before interpreting any due date or meeting time.", expectedOutcome: "Alex knows whether the portal is presenting Asia/Manila, America/Chicago, or another context and does not misread a deadline." },
      { title: "Clear decision signals first", instruction: "Review unread notifications, announcements, Waiting on Stephen responses, and previous daily report feedback before opening regular task work.", expectedOutcome: "No decision, correction, or Founder instruction that affects the shift is missed.", warning: "Do not treat unread notifications as optional noise; they may change what work is safe to do." },
      { title: "Review due work by operational risk", instruction: "Open dashboard priorities, overdue tasks, tasks due during the shift, assigned client follow-ups, assigned lead follow-ups, approved drafts ready for manual sending, and meetings that need preparation.", expectedOutcome: "All due and time-sensitive work is visible in one ranked list." },
      { title: "Choose the top three priorities", instruction: "Rank work by security or legal risk, client impact, deadline, revenue impact, dependencies, and effort. Write the top three in a task note or morning summary if Stephen requires it.", expectedOutcome: "The shift has a clear first task and two fallback priorities." },
      { title: "Start only the real first task", instruction: "Update a task to In Progress only when work actually begins. Leave future priorities in their current status until Alex is actively working on them.", expectedOutcome: "Task statuses reflect reality rather than a parking lot of intended work." }
    ],
    approvalPoints: ["Stephen must decide priority conflicts involving client commitments, pricing, public statements, legal risk, or scope changes.", "Stephen should be asked when two urgent items cannot both be completed in the shift."],
    escalationConditions: ["Security incident or credential exposure", "Client complaint or deadline failure noticed during review", "Approved communication conflicts with newer information", "Meeting starts soon and required brief is missing"],
    documentationRequirements: ["Morning priority summary when requested", "Task comment for any blocker found before work begins", "Waiting on Stephen request for authority or priority conflicts"],
    completionCriteria: ["Top three priorities are identified", "Urgent items are escalated", "Due work is understood", "No unread decision affecting current work is overlooked", "The first task is selected"],
    examples: {
      good: "Morning summary: 'Today I will first finish the Atlas lead follow-up draft for approval, then update Northstar client notes from yesterday's response, then prepare Stephen's 2:00 PM meeting brief. Blocker: the Atlas draft includes a pricing question, so I opened a Waiting on Stephen request before drafting final language.'",
      bad: "Alex opens the first visible task, marks three unrelated tasks In Progress, misses a Waiting on Stephen rejection, and sends an old approved draft that no longer matches the current lead stage."
    },
    relatedPortalRoutes: [r("Dashboard", "/dashboard"), r("My Tasks", "/tasks"), r("Waiting on Stephen", "/approvals"), r("Daily Reports", "/daily-reports"), r("Calendar", "/calendar")],
    relatedTemplates: ["Morning priority summary", "Waiting on Stephen request", "Task comment"],
    relatedSOPKeys: ["sop_2_end-of-shift-closeout", "sop_9_organize-assigned-priorities", "sop_38_prepare-stephens-daily-priority-summary"],
    commonMistakes: ["Starting with email or chat instead of Ghost Portal", "Ignoring timezone display", "Marking tasks In Progress before actual work begins", "Reviewing only overdue tasks and missing approved drafts or meetings"],
    qualityChecklist: ["Timezone verified", "Notifications reviewed", "Announcements reviewed", "Waiting on Stephen checked", "Client and lead follow-ups checked", "Meetings checked", "Top three priorities selected"],
    founderReviewQuestions: ["Should Alex send a morning priority summary every shift or only when priorities are unclear?", "Which urgent channel should Alex use for time-sensitive priority conflicts?"]
  }),
  sop(2, "End-of-shift closeout", "Operations", {
    purpose: "Prevent unfinished work from disappearing between shifts by leaving statuses, records, blockers, and tomorrow's first priorities clear.",
    estimatedMinutes: 20,
    useWhen: ["At the end of every shift", "Before submitting the daily report", "Before logging out of company systems"],
    doNotUseWhen: ["An urgent incident is still active and Stephen has instructed Alex to stay in the incident workflow", "No work was performed and Stephen has requested a different reporting method"],
    prerequisites: ["Task list", "Daily report form", "Access to records touched during the shift", "Any approved communications sent or scheduled during the shift"],
    requiredInputs: ["Tasks touched", "Client changes", "Lead changes", "Draft communication status", "Waiting on Stephen items", "Blockers", "Tomorrow priority candidates", "Shift hours and break"],
    steps: [
      { title: "Review touched work", instruction: "Open every task, client, lead, approval, draft, meeting, or content record touched during the shift and compare the current status to what actually happened.", expectedOutcome: "No worked item remains undocumented." },
      { title: "Correct statuses", instruction: "Move tasks to Completed only when completion criteria are met, Waiting on Stephen when Founder input is required, Waiting on Client when the next action belongs to a client, Blocked when work cannot continue, or leave In Progress only for active unfinished work.", expectedOutcome: "In Progress is not used as a storage bin for forgotten work.", warning: "A task should not remain In Progress just because Alex hopes to return to it tomorrow." },
      { title: "Add outcome comments", instruction: "Write concise comments that state what changed, what evidence exists, what remains, and the next action or blocker.", expectedOutcome: "Stephen can scan the record without asking what happened." },
      { title: "Close loops and schedule follow-ups", instruction: "Record sent communications, close completed follow-ups, set new follow-up dates, and check open Waiting on Stephen items for stale or resolved requests.", expectedOutcome: "Tomorrow's work queue starts from accurate next actions." },
      { title: "Submit report and log out", instruction: "Prepare the end-of-day report with accurate work date, shift times, break duration, outcomes, blockers, and tomorrow priorities, then log out of company systems.", expectedOutcome: "Daily reporting and system security are complete." }
    ],
    approvalPoints: ["Ask Stephen before closing any item whose acceptance criteria are unclear.", "Ask Stephen before marking pricing, scope, client complaint, or public-response work complete."],
    escalationConditions: ["Unresolved blocker may cause a missed client deadline", "A task was completed differently from the requested scope", "A sent communication was recorded incorrectly", "Alex discovers work was performed in the wrong record"],
    documentationRequirements: ["Task outcome comments", "Client or lead notes for record changes", "Daily report", "Waiting on Stephen request for unresolved decisions"],
    completionCriteria: ["Every touched task has a true status", "Client and lead changes are recorded", "Approved communications are recorded", "Unresolved blockers are named", "Tomorrow's first priorities are clear", "Daily report is submitted"],
    examples: {
      good: "Alex changes the Northstar follow-up task to Waiting on Client, records the message summary and follow-up date, notes that Stephen approved the wording, submits a daily report, and lists tomorrow's first task.",
      bad: "Alex leaves five tasks In Progress, writes 'worked on leads,' submits hours, and logs out without saying which lead needs Stephen or what tomorrow should start with."
    },
    relatedPortalRoutes: [r("My Tasks", "/tasks"), r("Daily Reports", "/daily-reports"), r("Clients", "/clients"), r("Leads", "/leads"), r("Draft Communications", "/communications")],
    relatedTemplates: ["End-of-day report", "Task completion comment", "Blocker note"],
    relatedSOPKeys: ["sop_3_submit-an-end-of-day-report", "sop_4_update-a-task", "sop_5_add-a-task-comment"],
    commonMistakes: ["Reporting activity instead of outcomes", "Leaving blockers out of the daily report", "Closing follow-ups without a next date", "Forgetting to record manually sent approved communications"],
    qualityChecklist: ["Touched records reviewed", "Statuses accurate", "Outcome comments added", "Follow-ups scheduled", "Blockers recorded", "Tomorrow priorities named", "Systems logged out"],
    founderReviewQuestions: ["Should Alex submit closeout summaries before or after the formal daily report?", "Which systems beyond Ghost Portal require explicit logout during trial?"]
  }),
  sop(3, "Submit an end-of-day report", "Operations", {
    purpose: "Create a reliable daily record of Alex's hours, outcomes, blockers, client and lead activity, and next priorities so Stephen can review work without reconstructing the shift.",
    estimatedMinutes: 15,
    useWhen: ["At the end of each paid trial shift", "When Stephen requests a report for partial-day work", "After correcting a previously submitted report"],
    doNotUseWhen: ["The report would include secrets or credentials", "A security incident requires immediate escalation before regular reporting"],
    prerequisites: ["Accurate shift start and end times", "Break duration", "List of completed and in-progress work", "Known blockers and approvals"],
    requiredInputs: ["Work date", "Shift start", "Shift end", "Break duration", "Work completed", "Work in progress", "Client updates", "Lead activity", "Meetings", "Blockers", "Waiting on Stephen", "Recommendations", "Tomorrow priorities"],
    steps: [
      { title: "Confirm date and hours", instruction: "Enter the work date, shift start, shift end, and break duration based on the actual shift. For overnight work, keep the work date aligned with Stephen's reporting expectation and explain the overnight span in notes.", expectedOutcome: "Calculated hours reflect real paid time and do not include breaks." },
      { title: "Write outcome-based completed work", instruction: "For work completed, describe the result and record affected, not just the activity. Use names like task, client, lead, or draft so Stephen can verify quickly.", expectedOutcome: "Completed work reads as evidence of progress." },
      { title: "Separate in-progress work from blockers", instruction: "List in-progress work only when Alex can continue later. Put work that cannot proceed under Blockers or Waiting on Stephen with the exact decision needed.", expectedOutcome: "Stephen can tell whether work needs attention or simply more time." },
      { title: "Record operational sections", instruction: "Fill client updates, lead activity, meetings, recommendations, and tomorrow priorities even when the answer is 'none.' Keep sensitive client details minimal and reference Portal records.", expectedOutcome: "The report is complete without oversharing." },
      { title: "Submit or request correction", instruction: "Submit only after reviewing for accuracy. If a submitted report contains wrong hours or sensitive details, request a correction instead of silently changing unrelated records.", expectedOutcome: "Stephen reviews a trustworthy report." }
    ],
    approvalPoints: ["Ask Stephen how to handle unusual overnight shifts.", "Ask Stephen before including sensitive client, legal, or security detail in a report."],
    escalationConditions: ["Hours are materially wrong after submission", "Report reveals unapproved client commitment", "A blocker may cause a deadline miss", "Sensitive information was included by mistake"],
    documentationRequirements: ["Submitted daily report", "Task comments for report items that need source records", "Correction request when necessary"],
    completionCriteria: ["All report fields are complete", "Hours and break are accurate", "Outcome language is used", "Blockers and Waiting on Stephen are distinct", "Tomorrow priorities are actionable"],
    examples: {
      good: "Completed: Drafted Atlas lead follow-up and submitted for Stephen approval because pricing language is needed. Client updates: Northstar contact details verified and recorded. Blocker: Need Stephen decision on discount request by tomorrow 10 AM CT. Tomorrow: revise Atlas draft after approval, then prepare Northstar status update.",
      bad: "Worked on tasks, checked clients, did leads, need help, tomorrow continue. This gives Stephen no records, outcomes, blockers, or priority order."
    },
    relatedPortalRoutes: [r("Daily Reports", "/daily-reports"), r("My Tasks", "/tasks"), r("Waiting on Stephen", "/approvals")],
    relatedTemplates: ["Good daily report example", "Weak report rewrite", "Correction request"],
    relatedSOPKeys: ["sop_2_end-of-shift-closeout", "sop_5_add-a-task-comment", "sop_38_prepare-stephens-daily-priority-summary"],
    commonMistakes: ["Writing activity language such as 'worked on' without result", "Mixing Waiting on Stephen with general blockers", "Including passwords or unnecessary private client information", "Forgetting break duration"],
    qualityChecklist: ["Date correct", "Start/end correct", "Break entered", "Completed outcomes specific", "In-progress work clear", "Blockers actionable", "Tomorrow priorities ranked"],
    founderReviewQuestions: ["What exact overnight-shift date rule should Alex follow?", "Should daily reports include a required recommendation every shift?"]
  }),
  sop(4, "Update a task", "Operations", {
    purpose: "Keep task records truthful so the dashboard reflects real operational work, not intentions or stale assumptions.",
    estimatedMinutes: 8,
    useWhen: ["A task changes status", "New evidence changes priority or due date risk", "A related client, lead, project, or approval context changes"],
    doNotUseWhen: ["The task belongs to another user and Alex has no assigned access", "The update would hide a problem that needs escalation"],
    prerequisites: ["Assigned task access", "Understanding of status options", "Current facts from related records"],
    requiredInputs: ["Title", "Description", "Owner", "Related client or lead", "Due date", "Priority", "Approval requirement", "Current status", "Evidence"],
    steps: [
      { title: "Open the assigned task", instruction: "Verify that the task is assigned to Alex or visible through an authorized role before changing anything.", expectedOutcome: "Alex updates only work she is permitted to handle." },
      { title: "Validate task context", instruction: "Read title, description, related client or lead, due date, priority, approver, and completion criteria. Check comments for newer instructions.", expectedOutcome: "The status decision is based on the current task, not the task title alone." },
      { title: "Choose the true status", instruction: "Use Not Started before work begins, In Progress during active work, Waiting on Stephen for Founder decisions, Waiting on Client for client-owned responses, Blocked when no progress can continue, and Completed only when criteria are met.", expectedOutcome: "Status communicates the real condition." },
      { title: "Add supporting detail", instruction: "Add a comment explaining what changed, evidence reviewed, and next action. Reference related draft, approval, file, client note, or lead note when relevant.", expectedOutcome: "The update is auditable." },
      { title: "Check downstream records", instruction: "If status changes affect a client, lead, project, approval, report, or follow-up date, update or create that related record too.", expectedOutcome: "The task does not drift away from the rest of Portal." }
    ],
    approvalPoints: ["Stephen approval is needed for completed statuses tied to pricing, scope, client complaints, public content, or sensitive delivery claims.", "Ask Stephen before changing priority on client-visible deadline work."],
    escalationConditions: ["Task is assigned incorrectly", "Due date cannot be met", "Completion criteria are unclear", "Related client or lead data conflicts with the task"],
    documentationRequirements: ["Status change", "Meaningful task comment", "Linked Waiting on Stephen request where needed", "Daily report mention for important status changes"],
    completionCriteria: ["Status matches real condition", "Comment explains the update", "Evidence or related record is referenced", "Approval is requested where necessary"],
    examples: {
      good: "Task moved to Waiting on Stephen with comment: 'Draft follow-up is complete, but it includes pricing language. Need approval on whether to mention subscription setup fee before sending.'",
      bad: "Task moved to Completed with no comment even though the client has not answered the required scope question."
    },
    relatedPortalRoutes: [r("My Tasks", "/tasks"), r("Clients", "/clients"), r("Leads", "/leads"), r("Waiting on Stephen", "/approvals")],
    relatedTemplates: ["Status decision table", "Task update comment"],
    relatedSOPKeys: ["sop_5_add-a-task-comment", "sop_6_request-stephens-approval", "sop_35_track-action-items"],
    commonMistakes: ["Using In Progress for paused work", "Marking Completed without evidence", "Changing priority to avoid overdue work", "Skipping related record updates"],
    qualityChecklist: ["Assignment verified", "Context read", "Correct status selected", "Comment added", "Related records checked"],
    founderReviewQuestions: ["Should Alex be allowed to change due dates or only flag due-date risk?", "Which task types require mandatory approval before completion?"]
  }),
  sop(5, "Add a task comment", "Operations", {
    purpose: "Turn task history into a useful operational record by writing comments that explain outcomes, evidence, remaining work, and decisions needed.",
    estimatedMinutes: 6,
    useWhen: ["Progress is made", "A task is completed", "A blocker appears", "A client or Stephen response changes the task", "Evidence needs to be preserved"],
    doNotUseWhen: ["The information belongs in a client note, lead note, daily report, or formal approval instead of task history", "The comment would include credentials or unnecessary sensitive data"],
    prerequisites: ["Open task", "Known current status", "Relevant evidence or related record"],
    requiredInputs: ["What was done", "What changed", "Evidence or result", "What remains", "Next action", "Blocker or approval needed"],
    steps: [
      { title: "State the action", instruction: "Begin with the concrete work performed, such as drafted follow-up, verified contact, updated meeting brief, or reviewed client response.", expectedOutcome: "The reader knows what happened." },
      { title: "Name the result", instruction: "Describe what changed in the record or workflow and reference the related client, lead, draft, file, or approval.", expectedOutcome: "The comment connects activity to an outcome." },
      { title: "Identify what remains", instruction: "If work is unfinished, state the remaining action and who owns it. If finished, say why completion criteria are met.", expectedOutcome: "No one has to infer next steps." },
      { title: "Call out decisions or blockers", instruction: "If Stephen, a client, or another dependency is needed, name the exact question and deadline.", expectedOutcome: "The blocker can be resolved without extra back-and-forth." },
      { title: "Keep it concise and safe", instruction: "Remove vague filler, emotional language, secrets, passwords, and unneeded private information before saving.", expectedOutcome: "The comment is useful and compliant." }
    ],
    approvalPoints: ["Move from comment to Waiting on Stephen when the issue requires a decision, not just visibility.", "Ask Stephen before documenting sensitive dispute, legal, payment, or security language."],
    escalationConditions: ["Comment reveals a missed deadline", "Comment would disclose sensitive information", "The task cannot continue without Founder authority"],
    documentationRequirements: ["Task comment", "Formal approval if a decision is required", "Client or lead note if the record itself changed"],
    completionCriteria: ["Comment says what was done", "Result or evidence is named", "Remaining work is clear", "Next owner is clear", "No prohibited information is included"],
    examples: {
      good: "Progress: Verified Atlas contact email from the lead record and drafted first follow-up in Draft Communications. Remaining: needs Stephen approval on pricing-safe CTA before submission. Next: submit draft after approval language is confirmed.",
      bad: "Update: worked on this. This is vague, gives no evidence, and does not identify next action."
    },
    relatedPortalRoutes: [r("My Tasks", "/tasks"), r("Waiting on Stephen", "/approvals"), r("Clients", "/clients"), r("Leads", "/leads")],
    relatedTemplates: ["Progress comment", "Completed comment", "Waiting on client comment", "Waiting on Stephen comment", "Blocked comment"],
    relatedSOPKeys: ["sop_4_update-a-task", "sop_6_request-stephens-approval", "sop_17_track-a-pending-client-decision"],
    commonMistakes: ["Writing 'done' without criteria", "Putting approval requests only in comments", "Using personal opinions instead of facts", "Repeating the same comment after every small click"],
    qualityChecklist: ["Action stated", "Result named", "Evidence referenced", "Remaining work clear", "Decision need named", "Sensitive details removed"],
    founderReviewQuestions: ["Should task comments follow a required format in the UI?", "Should some comment types trigger notifications to Stephen automatically?"]
  }),
  sop(6, "Request Stephen's approval", "Operations", {
    purpose: "Route decisions that require Founder authority through a clear request with enough context for Stephen to approve, reject, or request changes quickly.",
    estimatedMinutes: 10,
    useWhen: ["Pricing, discount, refund, scope, deadline, public statement, legal, security, sensitive client communication, or authority is unclear", "A task comment would not be enough because a decision is needed"],
    doNotUseWhen: ["Alex only needs to report routine progress", "The issue is urgent enough for direct escalation before Portal documentation"],
    prerequisites: ["Related task, client, lead, draft, report, or meeting record", "Known business impact", "Specific recommendation or options"],
    requiredInputs: ["Summary", "Context", "Business impact", "Recommendation", "Deadline", "Priority", "Related record", "Supporting evidence"],
    steps: [
      { title: "Confirm approval is required", instruction: "Check whether the decision involves money, scope, deadlines, client commitments, public language, sensitive data, or unclear authority.", expectedOutcome: "Routine updates stay in task comments; decisions become approvals." },
      { title: "Write a specific summary", instruction: "Summarize the decision in one sentence, naming the client, lead, draft, or task when possible.", expectedOutcome: "Stephen can triage without opening every record." },
      { title: "Add context and impact", instruction: "Explain what prompted the request, what happens if Stephen does not decide, and any deadline or client expectation.", expectedOutcome: "The request shows business risk and urgency." },
      { title: "Recommend a path", instruction: "Offer a recommended answer or two options, while making clear Alex is not authorizing the decision herself.", expectedOutcome: "Stephen can respond faster than if asked an open-ended question." },
      { title: "Act on the decision", instruction: "After Approved, proceed exactly within the approval. After Rejected, stop that path and document. After Changes Requested, revise and resubmit or update the related task.", expectedOutcome: "The approval outcome controls the work." }
    ],
    approvalPoints: ["This SOP itself is used for approval points; direct urgent contact may be needed before creating the record in severe cases."],
    escalationConditions: ["Deadline may pass before Stephen sees the request", "Client is upset or threatening public action", "Security, legal, or payment risk is involved"],
    documentationRequirements: ["Waiting on Stephen record", "Linked task/client/lead/draft", "Task comment noting request created", "Daily report mention for important decisions"],
    completionCriteria: ["Request has summary, context, impact, recommendation, deadline, priority, related record, and evidence", "Work pauses or continues safely while waiting", "Decision outcome is recorded"],
    examples: {
      good: "Summary: Approve Atlas follow-up pricing language. Context: lead asked whether website subscription includes automation setup. Impact: wrong wording could create an unapproved price expectation. Recommendation: avoid numbers and invite Stephen to confirm fit on a call by July 22.",
      bad: "Can I send this? This lacks context, risk, recommendation, deadline, and the exact language being approved."
    },
    relatedPortalRoutes: [r("Waiting on Stephen", "/approvals"), r("Draft Communications", "/communications"), r("Tasks", "/tasks")],
    relatedTemplates: ["Approval request", "Pricing question flag", "Changes requested response"],
    relatedSOPKeys: ["sop_28_flag-a-pricing-question", "sop_24_submit-a-draft-for-approval", "sop_40_follow-up-on-an-unanswered-decision"],
    commonMistakes: ["Using a vague title", "Failing to link the related record", "Making Stephen choose without a recommendation", "Continuing as if approval was granted"],
    qualityChecklist: ["Decision required", "Summary clear", "Context complete", "Impact stated", "Recommendation included", "Deadline set", "Related record linked"],
    founderReviewQuestions: ["What priority labels should Alex use for approval requests?", "Which approval categories require direct urgent notification as well as Portal entry?"]
  }),
  sop(7, "Report a Portal issue", "Operations", {
    purpose: "Capture product and workflow problems in a way that helps Stephen improve Ghost Portal without exposing secrets or losing operational context.",
    estimatedMinutes: 8,
    useWhen: ["A page errors", "Wording is confusing", "Information is missing", "Workflow is awkward", "Permission behavior seems wrong", "Alex has a Nova or Mission Control suggestion"],
    doNotUseWhen: ["The issue is a security incident requiring urgent escalation", "The issue is only a personal preference with no workflow impact"],
    prerequisites: ["Current page or workflow", "Safe screenshot if useful", "Expected and actual result"],
    requiredInputs: ["Page", "Action attempted", "Expected result", "Actual result", "Time", "Screenshot if safe", "Whether work is blocked", "Severity", "Workaround attempted", "Classification"],
    steps: [
      { title: "Classify the issue", instruction: "Choose bug, confusing wording, missing information, workflow problem, permission problem, feature request, Nova suggestion, or Mission Control suggestion.", expectedOutcome: "Stephen can route the report." },
      { title: "Capture safe evidence", instruction: "Record page, action, expected result, actual result, time, severity, and workaround. Add a screenshot only if it does not show passwords, secrets, or sensitive client information.", expectedOutcome: "The report can be reproduced safely." },
      { title: "Explain work impact", instruction: "State whether work is blocked, slowed, or unaffected, and name the task or record if applicable.", expectedOutcome: "Stephen knows the operational priority." },
      { title: "Submit feedback", instruction: "Create the feedback item in Portal with concise title and details. Avoid mixing multiple unrelated bugs in one report.", expectedOutcome: "The issue enters the improvement queue." },
      { title: "Continue safely", instruction: "Use an approved workaround only if it does not bypass permissions, data safety, or approval boundaries.", expectedOutcome: "Work continues without creating a larger risk." }
    ],
    approvalPoints: ["Ask Stephen before using a workaround that changes client, lead, or permission behavior.", "Ask Stephen before sharing screenshots outside Portal."],
    escalationConditions: ["Permission issue exposes data Alex should not see", "Production page error blocks paid work", "Bug may send wrong client communication", "Sensitive information appears in the wrong place"],
    documentationRequirements: ["Mission Feedback item", "Task comment if work is blocked", "Urgent escalation for security or production outage"],
    completionCriteria: ["Issue classification is clear", "Evidence is safe", "Expected and actual results are stated", "Work impact is named", "Workaround is documented"],
    examples: {
      good: "Bug: /daily-reports/new rejects break duration of 45 minutes. Expected: report saves. Actual: validation error says custom breaks not allowed. Work blocked: yes, today's report cannot be submitted accurately. Screenshot excludes client data.",
      bad: "Portal broken. This does not identify page, action, expected result, actual result, severity, or work impact."
    },
    relatedPortalRoutes: [r("Mission Feedback", "/feedback"), r("Dashboard", "/dashboard"), r("Daily Reports", "/daily-reports")],
    relatedTemplates: ["Bug report", "Workflow problem report", "Permission problem report"],
    relatedSOPKeys: ["sop_8_escalate-urgent-work", "sop_10_document-a-new-recurring-process"],
    commonMistakes: ["Including sensitive screenshots", "Reporting multiple unrelated issues together", "Leaving out the expected result", "Treating a permission leak as a normal bug"],
    qualityChecklist: ["Classification selected", "Page named", "Expected result named", "Actual result named", "Severity selected", "Safe evidence attached", "Work impact explained"],
    founderReviewQuestions: ["Which feedback categories should trigger immediate notifications?", "Where should product ideas for Nova versus Mission Control be separated?"]
  }),
  sop(8, "Escalate urgent work", "Operations", {
    purpose: "Move high-risk issues out of normal task flow quickly while preserving facts and preventing Alex from taking unsafe action.",
    estimatedMinutes: 6,
    useWhen: ["Security incident", "Client escalation", "Legal threat", "Payment dispute", "Imminent deadline failure", "Public reputation risk", "Production outage", "Unauthorized access", "Sensitive information exposure"],
    doNotUseWhen: ["The issue is routine priority conflict", "A normal approval request can be answered within the needed timeline"],
    prerequisites: ["Approved urgent channel", "Portal access for follow-up documentation", "Known immediate facts"],
    requiredInputs: ["What happened", "Who is affected", "Deadline or active risk", "Evidence", "Current action paused", "Portal record"],
    steps: [
      { title: "Stop unsafe action", instruction: "Pause sending, editing, deleting, promising, or publishing anything that could worsen the issue.", expectedOutcome: "No additional risk is created." },
      { title: "Preserve facts", instruction: "Capture exact wording, link, timestamp, page, affected record, and safe screenshot when useful. Do not speculate.", expectedOutcome: "Stephen receives evidence, not assumptions." },
      { title: "Use direct urgent channel", instruction: "Notify Stephen through the approved urgent channel with severity, impact, deadline, and the safest next question.", expectedOutcome: "Stephen sees the issue fast." },
      { title: "Create Portal record", instruction: "Create or update the task, approval, feedback item, client note, or lead note that documents the issue after direct escalation.", expectedOutcome: "The incident is tracked in the source of truth." },
      { title: "Continue only under instruction", instruction: "Do not resume client communication, public response, payment discussion, or data handling until Stephen responds or a written policy clearly allows the next step.", expectedOutcome: "Alex remains within authority." }
    ],
    approvalPoints: ["Stephen controls response to urgent issues unless a written emergency policy says otherwise."],
    escalationConditions: ["Any use case listed in this SOP is already an escalation condition", "Unclear severity should be escalated rather than minimized"],
    documentationRequirements: ["Urgent direct notification", "Portal record", "Daily report summary after the immediate issue is controlled"],
    completionCriteria: ["Unsafe action stopped", "Facts preserved", "Stephen notified", "Portal record created", "Next action is under instruction"],
    examples: {
      good: "Alex sees a client threatening public review over billing. She does not reply, screenshots the message, notifies Stephen with impact and deadline, creates a Waiting on Stephen request, and waits.",
      bad: "Alex replies quickly with a refund promise to calm the client and documents it later."
    },
    relatedPortalRoutes: [r("Waiting on Stephen", "/approvals"), r("Mission Feedback", "/feedback"), r("Clients", "/clients")],
    relatedTemplates: ["Urgent escalation note", "Incident facts list"],
    relatedSOPKeys: ["sop_15_escalate-a-client-complaint", "sop_50_escalate-public-comment-risk", "sop_7_report-a-portal-issue"],
    commonMistakes: ["Trying to solve the urgent issue alone", "Speculating about cause", "Deleting evidence", "Waiting until end-of-day report to mention it"],
    qualityChecklist: ["Action paused", "Facts captured", "Urgent channel used", "Portal record created", "No speculation", "Stephen instruction awaited"],
    founderReviewQuestions: ["What exact direct urgent channel should Alex use?", "What severity labels should Ghost Portal support?"]
  }),
  sop(9, "Organize assigned priorities", "Operations", {
    purpose: "Give Alex a repeatable way to rank work when the dashboard contains more tasks than can be completed in one shift.",
    estimatedMinutes: 12,
    useWhen: ["Multiple tasks compete for attention", "Stephen asks for a priority recommendation", "Alex needs to choose the next task after completing current work"],
    doNotUseWhen: ["Stephen has already given a direct priority order", "An urgent incident overrides normal ranking"],
    prerequisites: ["Task list", "Due dates", "Client and lead context", "Known approval dependencies"],
    requiredInputs: ["Security and legal risk", "Client impact", "Deadline", "Revenue or sales impact", "Dependencies", "Effort", "Strategic value"],
    steps: [
      { title: "Separate urgent from important", instruction: "Identify items that require action now to avoid harm, then identify important items that create value but can be scheduled.", expectedOutcome: "Urgency does not erase strategic work." },
      { title: "Score risk and client impact", instruction: "Rank security, legal, upset-client, deadline, and public-risk items above routine admin work.", expectedOutcome: "High-risk work is visible first." },
      { title: "Account for revenue and dependencies", instruction: "Move sales opportunities, lead follow-ups, blocked Stephen decisions, and client dependencies up when delay affects revenue or other people's work.", expectedOutcome: "The list reflects business impact." },
      { title: "Estimate effort", instruction: "Use small tasks to unblock larger work when they are quick and important, but do not let easy work crowd out urgent client or deadline issues.", expectedOutcome: "Alex avoids both procrastination and random easy-task picking." },
      { title: "Document the ranked list", instruction: "Write the top priorities and reasoning in a morning summary or task comment when Stephen needs visibility.", expectedOutcome: "Stephen can approve or correct the order." }
    ],
    approvalPoints: ["Ask Stephen when two high-risk priorities conflict.", "Ask Stephen before deprioritizing a client-facing deadline."],
    escalationConditions: ["A deadline cannot be met", "Legal, payment, security, or public-risk work appears", "Alex lacks enough context to rank client impact"],
    documentationRequirements: ["Priority summary", "Task comments for changed priority risk", "Waiting on Stephen for conflicts"],
    completionCriteria: ["Tasks are ranked by risk, impact, deadline, revenue, dependencies, effort, and strategic value", "Conflicts are escalated", "First task is chosen"],
    examples: {
      good: "Rank: 1 security permission concern, 2 client deadline due today, 3 Stephen pricing approval blocking lead follow-up, 4 meeting brief due tomorrow, 5 content asset cleanup.",
      bad: "Alex completes ten easy formatting tasks while a client complaint and pricing approval sit untouched."
    },
    relatedPortalRoutes: [r("Dashboard", "/dashboard"), r("My Tasks", "/tasks"), r("Waiting on Stephen", "/approvals")],
    relatedTemplates: ["Priority ranking note", "Top three summary"],
    relatedSOPKeys: ["sop_1_start-of-shift-review", "sop_38_prepare-stephens-daily-priority-summary"],
    commonMistakes: ["Ranking by easiest first", "Ignoring dependencies", "Treating all overdue tasks equally", "Not asking Stephen about genuine conflicts"],
    qualityChecklist: ["Risk considered", "Client impact considered", "Deadlines checked", "Revenue considered", "Dependencies checked", "Effort estimated", "Order documented"],
    founderReviewQuestions: ["Should the dashboard expose an official priority score?", "Which clients or lead types should always rank higher?"]
  }),
  sop(10, "Document a new recurring process", "Operations", {
    purpose: "Convert repeated work into a clear SOP candidate so Ghost Portal improves instead of depending on memory or repeated explanations from Stephen.",
    estimatedMinutes: 30,
    useWhen: ["Alex performs the same work more than once", "A task exposes missing instructions", "Stephen asks for a reusable process draft"],
    doNotUseWhen: ["The process is one-time, experimental, or unsafe to standardize", "The process involves legal, security, or pricing rules Stephen has not reviewed"],
    prerequisites: ["At least one completed example", "Known trigger", "Observed steps", "Founder review path"],
    requiredInputs: ["Trigger", "Inputs", "Tools", "Steps", "Decisions", "Approvals", "Escalations", "Completion criteria", "Exceptions", "Screenshots or templates"],
    steps: [
      { title: "Confirm recurrence", instruction: "Check whether the work will repeat for Alex, another Operations user, or a future employee. Do not make an SOP from a one-off exception.", expectedOutcome: "Only recurring work becomes process documentation." },
      { title: "Capture the process skeleton", instruction: "Record trigger, required inputs, tools, ordered steps, decisions, approvals, escalation points, and completion criteria.", expectedOutcome: "The process can be followed without a live explanation." },
      { title: "Add examples and exceptions", instruction: "Document at least one good example, one poor example, common mistakes, and situations where the SOP should not be used.", expectedOutcome: "The process teaches judgment, not just clicks." },
      { title: "Test with another user perspective", instruction: "Read the draft as if Alex is new and mark missing context, unclear tools, undefined terms, or hidden assumptions.", expectedOutcome: "The SOP is usable for onboarding." },
      { title: "Submit for Founder review", instruction: "Create a feedback item or approval request with the draft, version suggestion, and questions Stephen must answer.", expectedOutcome: "The SOP does not become official without review." }
    ],
    approvalPoints: ["Stephen approves new official SOPs, version changes, authority boundaries, and policy-related wording."],
    escalationConditions: ["Process involves sensitive data", "Process implies pricing or contractual authority", "Process reveals a security gap", "Alex cannot safely complete the work without a policy decision"],
    documentationRequirements: ["Draft SOP content", "Founder review questions", "Related task or feedback item", "Screenshots only when safe"],
    completionCriteria: ["Trigger, inputs, steps, decisions, approvals, escalation, examples, and completion criteria are documented", "Founder review is requested", "No sensitive screenshots are included"],
    examples: {
      good: "Alex notices every lead cleanup uses the same checks, drafts the trigger, required fields, duplicate-check steps, unknown-data rule, and Founder questions, then submits it for review.",
      bad: "Alex writes 'clean up leads when needed' with no required fields, no duplicate rule, and no examples."
    },
    relatedPortalRoutes: [r("Mission Feedback", "/feedback"), r("SOP Library", "/sops"), r("Admin Academy", "/admin/academy")],
    relatedTemplates: ["SOP draft template", "Founder review questions"],
    relatedSOPKeys: ["sop_7_report-a-portal-issue", "sop_49_maintain-a-content-calendar"],
    commonMistakes: ["Documenting only clicks", "Skipping approval boundaries", "Leaving out examples", "Publishing without Founder review"],
    qualityChecklist: ["Recurring confirmed", "Trigger captured", "Steps ordered", "Approvals named", "Escalations named", "Examples included", "Review requested"],
    founderReviewQuestions: ["Where should SOP drafts be stored before approval?", "Who besides Stephen may review future process drafts?"]
  }),
  sop(11, "Review an assigned client", "ClientOperations", {
    purpose: "Give Alex a safe client-review routine that finds immediate actions without exposing Founder-only or unnecessary sensitive information.",
    estimatedMinutes: 15,
    useWhen: ["A client task is assigned", "A client follow-up is due", "Preparing a status update or meeting brief", "Starting work on a client record"],
    doNotUseWhen: ["Alex is not assigned to the client", "The client issue is a complaint, payment dispute, or security matter needing escalation first"],
    prerequisites: ["Assigned client access", "Related tasks and communications", "Permission-scoped view"],
    requiredInputs: ["Company profile", "Contact information", "Active services", "Projects", "Open tasks", "Recent communications", "Pending approvals", "Next follow-up", "Risk status", "Operational notes"],
    steps: [
      { title: "Verify authorization", instruction: "Confirm the client appears in Alex's assigned client list and do not attempt to access Founder-only, financial, or restricted records.", expectedOutcome: "Review stays within assigned permissions." },
      { title: "Read client snapshot", instruction: "Review company profile, contacts, active services, risk status, and operational notes.", expectedOutcome: "Alex understands the current client context." },
      { title: "Check active work", instruction: "Open related projects, open tasks, pending approvals, recent communications, and next follow-up dates.", expectedOutcome: "Immediate action items are visible." },
      { title: "Identify gaps", instruction: "Look for missing contact details, stale follow-ups, unanswered client decisions, overdue tasks, or notes that conflict.", expectedOutcome: "Operational risk is detected early." },
      { title: "Record next action", instruction: "Update the task or client note with the immediate action, owner, due date, and any approval needed.", expectedOutcome: "The client record has a clear next step." }
    ],
    approvalPoints: ["Stephen approval is required for pricing, scope, billing, complaints, legal, security, or client-facing commitments.", "Ask Stephen if the assigned client view appears to expose restricted data."],
    escalationConditions: ["Client risk status appears high", "Complaint or payment issue is found", "Sensitive data appears where Alex should not see it", "A client deadline may be missed"],
    documentationRequirements: ["Client operational note for record changes", "Task comment for task-specific findings", "Waiting on Stephen for decisions"],
    completionCriteria: ["Authorization verified", "Client profile reviewed", "Active work checked", "Immediate action identified", "Restricted data avoided"],
    examples: {
      good: "Alex reviews Northstar, sees the next follow-up due tomorrow, confirms no pending Stephen approval blocks it, and updates the task with the exact draft needed.",
      bad: "Alex searches for financial notes, guesses the client's package, and sends a status promise based on incomplete context."
    },
    relatedPortalRoutes: [r("Clients", "/clients"), r("Tasks", "/tasks"), r("Approvals", "/approvals")],
    relatedTemplates: ["Client review checklist", "Client next-action note"],
    relatedSOPKeys: ["sop_12_update-client-operational-notes", "sop_14_prepare-a-client-status-update", "sop_20_identify-an-at-risk-client"],
    commonMistakes: ["Skipping authorization check", "Confusing operational notes with Founder-only strategy", "Missing pending approvals", "Treating stale notes as current without verification"],
    qualityChecklist: ["Assigned access verified", "Contacts checked", "Services checked", "Tasks checked", "Communications checked", "Approvals checked", "Next action set"],
    founderReviewQuestions: ["Which client fields should Operations never see?", "Should risk status changes require Stephen approval?"]
  }),
  sop(12, "Update client operational notes", "ClientOperations", {
    purpose: "Keep client notes factual, useful, and safe so Operations can understand current context without storing secrets or opinions.",
    estimatedMinutes: 8,
    useWhen: ["Client facts change", "A client preference affects operations", "A follow-up result belongs on the client record", "A recurring context note helps future work"],
    doNotUseWhen: ["The update is only a task-specific progress comment", "The note is a full communication history, credential, private personal detail, or Founder-only strategy"],
    prerequisites: ["Assigned client access", "Verified fact", "Related task or communication when applicable"],
    requiredInputs: ["Date", "Fact or change", "Source", "Operational impact", "Next action", "Owner"],
    steps: [
      { title: "Choose the right record", instruction: "Confirm the information belongs in client operational notes rather than task comments, communication history, or Waiting on Stephen.", expectedOutcome: "Notes stay organized by purpose." },
      { title: "Verify the fact", instruction: "Use current client communication, Portal record, or Stephen instruction. Do not write guesses, opinions, or emotional interpretations.", expectedOutcome: "The note can be trusted." },
      { title: "Write objective context", instruction: "Include date, source, fact, operational impact, next action, and owner in concise language.", expectedOutcome: "Future users can act from the note." },
      { title: "Remove unsafe details", instruction: "Do not store passwords, private personal information, unnecessary screenshots, unapproved pricing, or sensitive Founder-only strategy.", expectedOutcome: "The note follows data minimization." },
      { title: "Link related work", instruction: "Reference the task, communication, approval, or follow-up date that explains why the note was updated.", expectedOutcome: "The note has traceable context." }
    ],
    approvalPoints: ["Ask Stephen before adding sensitive, disputed, legal, billing, or strategic notes.", "Ask Stephen if unsure whether information belongs in operational notes."],
    escalationConditions: ["Client data looks sensitive or misplaced", "Note would expose a dispute or complaint", "Fact contradicts an existing commitment"],
    documentationRequirements: ["Client operational note", "Related task comment if task state changed", "Approval request if authority is unclear"],
    completionCriteria: ["Note is factual", "Date and source included", "Operational impact clear", "Next action clear", "No secrets or unnecessary personal data stored"],
    examples: {
      good: "2026-07-20, from client email: primary scheduling contact changed to Jordan for August meetings. Operational impact: meeting confirmations should copy Jordan. Next action: update next meeting invite after Stephen approves attendee list.",
      bad: "Client seems annoyed and probably cheap. This is subjective, unprofessional, and not operationally useful."
    },
    relatedPortalRoutes: [r("Clients", "/clients"), r("Communications", "/communications"), r("Tasks", "/tasks")],
    relatedTemplates: ["Operational note format", "Data minimization checklist"],
    relatedSOPKeys: ["sop_16_record-client-communication", "sop_17_track-a-pending-client-decision"],
    commonMistakes: ["Writing opinions", "Duplicating full email threads", "Adding secrets", "Leaving out next action", "Using client notes for task progress"],
    qualityChecklist: ["Correct location", "Fact verified", "Date included", "Source included", "Next action included", "Sensitive data removed"],
    founderReviewQuestions: ["Should client operational notes have a required format?", "Which client facts should require Stephen review before saving?"]
  }),
  sop(13, "Request missing information from a client", "ClientOperations", {
    purpose: "Ask clients for needed information clearly and respectfully while avoiding blame, overreach, or unapproved commitments.",
    estimatedMinutes: 15,
    useWhen: ["Required client input is missing", "A task cannot continue without client facts", "A deadline depends on client response"],
    doNotUseWhen: ["The missing information is actually available in Portal", "The message involves pricing, legal, complaint, security, or scope sensitivity requiring Stephen approval first"],
    prerequisites: ["Review prior messages and files", "Know why the information is needed", "Know the response deadline"],
    requiredInputs: ["Missing item list", "Reason needed", "Related task or project", "Response expectation", "Approval status", "Follow-up date"],
    steps: [
      { title: "Confirm it is missing", instruction: "Check client notes, files, communications, task comments, and approvals before asking the client.", expectedOutcome: "The client is not asked for information Ghost already has." },
      { title: "Define the request", instruction: "List exactly what is needed, why it is needed, and what work it affects.", expectedOutcome: "The request is specific and justified." },
      { title: "Draft respectful language", instruction: "Use concise wording, avoid blame, group requested items in bullets, and set a reasonable response expectation.", expectedOutcome: "The client can respond easily." },
      { title: "Get approval when needed", instruction: "Submit for Stephen approval if the request touches sensitive data, contract scope, pricing, complaint context, or external deadline promises.", expectedOutcome: "Sensitive client communication is controlled." },
      { title: "Record and follow up", instruction: "Record the request in communication history or the related task, set follow-up date, and escalate if the missing information creates deadline risk.", expectedOutcome: "The missing input is tracked." }
    ],
    approvalPoints: ["Stephen approval is required for sensitive, legal, pricing, complaint, or deadline-commitment requests."],
    escalationConditions: ["Missing information threatens a deadline", "Client has ignored multiple requests", "Requested data is sensitive", "Client response changes scope"],
    documentationRequirements: ["Draft communication", "Client communication record", "Task comment", "Follow-up date"],
    completionCriteria: ["Prior sources checked", "Specific request drafted", "Reason stated", "Approval obtained if needed", "Follow-up scheduled"],
    examples: {
      good: "Could you send the final logo file, preferred CTA link, and approved contact email by Wednesday? We need those items to prepare the homepage draft for review.",
      bad: "You never sent the stuff we need, so we cannot finish. This blames the client and does not list exact items."
    },
    relatedPortalRoutes: [r("Clients", "/clients"), r("Draft Communications", "/communications"), r("Tasks", "/tasks")],
    relatedTemplates: ["Client information request email", "Short message request"],
    relatedSOPKeys: ["sop_14_prepare-a-client-status-update", "sop_17_track-a-pending-client-decision"],
    commonMistakes: ["Asking before checking files", "Requesting too many vague items", "Promising completion date without approval", "Failing to set follow-up"],
    qualityChecklist: ["Prior messages checked", "Files checked", "Items listed", "Reason stated", "Tone respectful", "Approval checked", "Follow-up set"],
    founderReviewQuestions: ["Which client information requests can Alex send without approval?", "What default response window should Alex use?"]
  }),
  sop(14, "Prepare a client status update", "ClientOperations", {
    purpose: "Create accurate client-facing progress updates that communicate completed work, current work, dependencies, risks, and next timing without unverified promises.",
    estimatedMinutes: 20,
    useWhen: ["Stephen requests a status update draft", "A client follow-up is due", "A milestone needs a progress summary"],
    doNotUseWhen: ["There is an active complaint or dispute that needs escalation", "The update would announce pricing, deadlines, or technical guarantees not approved by Stephen"],
    prerequisites: ["Recent task history", "Client notes", "Project status", "Known approvals", "Verified next milestone"],
    requiredInputs: ["Completed since last update", "Currently in progress", "Waiting on Ghost", "Waiting on client", "Upcoming milestone", "Risks", "Next communication date"],
    steps: [
      { title: "Gather source facts", instruction: "Review tasks, project notes, communications, approvals, and client decisions since the last update.", expectedOutcome: "The update uses verified information." },
      { title: "Structure the update", instruction: "Separate completed, in progress, waiting on Ghost, waiting on client, upcoming milestone, risks, and next communication date.", expectedOutcome: "The client can scan progress and dependencies." },
      { title: "Check commitments", instruction: "Remove unverified deadlines, technical promises, pricing language, or scope statements that Stephen has not approved.", expectedOutcome: "The update avoids accidental commitments." },
      { title: "Draft in brand voice", instruction: "Use clear, calm, helpful language with concise bullets and no blame when waiting on client input.", expectedOutcome: "The message feels professional and trustworthy." },
      { title: "Submit for approval or record", instruction: "Send to Stephen for review when client-facing, then record approved/send status in Portal.", expectedOutcome: "The update is controlled and traceable." }
    ],
    approvalPoints: ["Client-facing status updates require Stephen approval when they include deadlines, scope, pricing, risks, or sensitive context."],
    escalationConditions: ["Update reveals a deadline miss", "Client may be upset by the status", "Risk requires Stephen decision", "Technical promise is unclear"],
    documentationRequirements: ["Draft communication", "Approval request when needed", "Client communication record after send", "Task comments for affected tasks"],
    completionCriteria: ["All sections are accurate", "Unverified promises removed", "Risks are handled safely", "Approval path followed", "Next communication date recorded"],
    examples: {
      good: "Completed: intake details organized and homepage content gaps identified. In progress: draft structure. Waiting on client: final logo and CTA link. Risk: launch timing depends on receiving those by Wednesday. Next update: Friday after Stephen review.",
      bad: "Everything is almost done and should launch Friday. This makes an unverified deadline promise and hides dependencies."
    },
    relatedPortalRoutes: [r("Clients", "/clients"), r("Communications", "/communications"), r("Approvals", "/approvals")],
    relatedTemplates: ["Client status update", "Dependency-safe wording"],
    relatedSOPKeys: ["sop_13_request-missing-information-from-a-client", "sop_24_submit-a-draft-for-approval"],
    commonMistakes: ["Saying 'almost done' without facts", "Omitting client-owned blockers", "Promising dates", "Skipping approval"],
    qualityChecklist: ["Facts gathered", "Sections complete", "No unapproved promises", "Risks named", "Approval checked", "Record updated"],
    founderReviewQuestions: ["Which status updates may Alex send directly?", "What tone should be used for delayed-client-input updates?"]
  }),
  sop(15, "Escalate a client complaint", "ClientOperations", {
    purpose: "Handle complaints calmly and safely by preserving facts, avoiding admissions or promises, and getting Stephen involved before response decisions.",
    estimatedMinutes: 12,
    useWhen: ["Client complains about delay", "Client complains about quality", "Billing complaint appears", "Security complaint appears", "Client threatens public review"],
    doNotUseWhen: ["Client is asking a routine question without dissatisfaction", "Immediate safety or security incident requires the urgent escalation SOP first"],
    prerequisites: ["Exact complaint wording", "Related client record", "Timeline of relevant work", "Approved urgent channel"],
    requiredInputs: ["Complaint text", "Channel", "Time", "Client", "Related project/task", "Known timeline", "Risk type", "Deadline"],
    steps: [
      { title: "Pause response", instruction: "Do not argue, admit liability, promise refund, blame anyone, or explain defensively before Stephen reviews.", expectedOutcome: "Ghost does not create extra legal, billing, or relationship risk." },
      { title: "Preserve exact wording", instruction: "Copy the exact complaint, channel, timestamp, and related record. Capture a safe screenshot if needed.", expectedOutcome: "Stephen sees the real message." },
      { title: "Gather timeline", instruction: "Review tasks, communications, approvals, deadlines, and any prior client warnings relevant to the complaint.", expectedOutcome: "The escalation has context." },
      { title: "Notify Stephen", instruction: "Create a Waiting on Stephen request and use urgent channel if risk is high, including complaint type, impact, deadline, and recommended response posture.", expectedOutcome: "Founder decision is requested quickly." },
      { title: "Draft only if requested", instruction: "If Stephen asks for a draft, acknowledge the concern without admitting fault and propose next step within Stephen's direction.", expectedOutcome: "Client response is approved before use." }
    ],
    approvalPoints: ["Stephen approval is mandatory for all complaint responses, refunds, billing language, security statements, public-review responses, and blame language."],
    escalationConditions: ["Legal threat", "Billing dispute", "Security complaint", "Public review threat", "Client demands immediate response", "Complaint reveals delivery failure"],
    documentationRequirements: ["Client note", "Waiting on Stephen request", "Task or communication record", "Daily report mention if complaint affected shift"],
    completionCriteria: ["Complaint preserved", "Timeline gathered", "Stephen notified", "No unauthorized reply sent", "Approved outcome recorded"],
    examples: {
      good: "Alex records the exact billing complaint, gathers the project timeline, creates an urgent Waiting on Stephen request, and drafts a neutral acknowledgement only after Stephen asks.",
      bad: "Alex replies 'Sorry, we messed up, we can refund you' to calm the client."
    },
    relatedPortalRoutes: [r("Clients", "/clients"), r("Approvals", "/approvals"), r("Communications", "/communications")],
    relatedTemplates: ["Complaint escalation", "Neutral acknowledgement draft"],
    relatedSOPKeys: ["sop_8_escalate-urgent-work", "sop_50_escalate-public-comment-risk", "sop_16_record-client-communication"],
    commonMistakes: ["Admitting liability", "Promising refund", "Arguing", "Blaming vendor or employee", "Waiting until daily report"],
    qualityChecklist: ["Reply paused", "Exact wording saved", "Timeline gathered", "Stephen notified", "Risk type named", "Outcome recorded"],
    founderReviewQuestions: ["What complaint severity should trigger urgent channel?", "What default acknowledgement wording is approved?"]
  }),
  sop(16, "Record client communication", "ClientOperations", {
    purpose: "Keep a concise, searchable history of meaningful client communication without confusing summaries with full transcripts.",
    estimatedMinutes: 8,
    useWhen: ["Client email, call, message, or meeting changes work", "A commitment, decision, question, or next action is communicated", "An approved message is manually sent"],
    doNotUseWhen: ["The message is internal-only", "The content is a full sensitive transcript that should not be stored in notes"],
    prerequisites: ["Communication channel", "Participants", "Date/time", "Related client and task"],
    requiredInputs: ["Channel", "Participants", "Date/time", "Summary", "Commitments", "Questions", "Decisions", "Next action", "Follow-up date", "Related task", "Attachments or links"],
    steps: [
      { title: "Identify record-worthy content", instruction: "Record communications that affect client context, work, decisions, commitments, or follow-up. Skip noise unless Stephen asks.", expectedOutcome: "Communication history stays useful." },
      { title: "Capture metadata", instruction: "Record channel, participants, date, time, related client, and related task or project.", expectedOutcome: "The communication can be located later." },
      { title: "Summarize accurately", instruction: "Write a concise factual summary, commitments made, questions asked, decisions reached, and any attachments or links.", expectedOutcome: "The summary is reliable without being a full transcript." },
      { title: "Set next action", instruction: "Add owner, follow-up date, and related task update when the communication creates work.", expectedOutcome: "The message becomes action." },
      { title: "Review for safety", instruction: "Do not include passwords, unnecessary personal details, or sensitive data beyond what the client record requires.", expectedOutcome: "Data handling stays minimal." }
    ],
    approvalPoints: ["Stephen approval is needed before recording or responding to sensitive legal, payment, security, or complaint communications."],
    escalationConditions: ["Communication includes complaint, legal threat, payment dispute, security issue, or urgent deadline risk"],
    documentationRequirements: ["Client communication record", "Task comment for related work", "Follow-up date", "Approval request if needed"],
    completionCriteria: ["Channel, participants, date/time, summary, commitments, questions, decisions, next action, and follow-up are recorded"],
    examples: {
      good: "Email from Jordan, July 20 9:12 AM CT: sent final logo and asked whether CTA can point to booking page. Next action: update asset checklist and ask Stephen to approve CTA.",
      bad: "Client emailed. This loses the channel, date, content, decision, and next action."
    },
    relatedPortalRoutes: [r("Clients", "/clients"), r("Communications", "/communications"), r("Tasks", "/tasks")],
    relatedTemplates: ["Client communication summary", "Follow-up record"],
    relatedSOPKeys: ["sop_12_update-client-operational-notes", "sop_19_close-a-client-follow-up"],
    commonMistakes: ["Writing a transcript when a summary is enough", "Omitting commitments", "Not setting follow-up", "Recording internal assumptions as client decisions"],
    qualityChecklist: ["Channel included", "Participants included", "Date/time included", "Summary factual", "Commitments captured", "Next action set"],
    founderReviewQuestions: ["Which channels must be recorded during trial?", "Should client calls require a different meeting-note template?"]
  }),
  sop(17, "Track a pending client decision", "ClientOperations", {
    purpose: "Prevent client-owned decisions from silently blocking work by naming the decision, owner, impact, and follow-up cadence.",
    estimatedMinutes: 10,
    useWhen: ["A client must approve, choose, provide, or confirm something before work can continue", "A project dependency belongs to the client"],
    doNotUseWhen: ["Stephen owns the decision", "The client has already answered and the task simply needs updating"],
    prerequisites: ["Client record", "Decision requested", "Business impact", "Follow-up date"],
    requiredInputs: ["Decision needed", "Owner", "Date requested", "Business impact", "Follow-up date", "Project dependency", "Reminder cadence"],
    steps: [
      { title: "Define the decision", instruction: "Write the exact client decision needed, not a vague phrase like 'waiting on client.'", expectedOutcome: "The blocker is understandable." },
      { title: "Assign ownership and date", instruction: "Record who owes the answer, when it was requested, and when Ghost should follow up.", expectedOutcome: "Responsibility and timing are clear." },
      { title: "Connect dependency", instruction: "Explain what work cannot continue or what risk grows until the decision arrives.", expectedOutcome: "Stephen can judge importance." },
      { title: "Set reminder cadence", instruction: "Use a reasonable follow-up schedule and avoid excessive reminders to uninterested or busy clients.", expectedOutcome: "Follow-up is professional." },
      { title: "Close or escalate", instruction: "Close the pending decision when answered, pause affected work when needed, or escalate if deadline risk develops.", expectedOutcome: "The dependency does not become stale." }
    ],
    approvalPoints: ["Ask Stephen before escalating client pressure, changing deadline expectations, or interpreting a partial answer as approval."],
    escalationConditions: ["Decision blocks deadline", "Client gives unclear or conflicting answer", "Decision changes scope, price, or legal/security posture"],
    documentationRequirements: ["Client note", "Related task status Waiting on Client", "Follow-up date", "Daily report mention for important blockers"],
    completionCriteria: ["Decision is named", "Owner is recorded", "Impact is stated", "Follow-up date set", "Closure or escalation rule clear"],
    examples: {
      good: "Pending decision: Northstar must choose booking-page CTA or contact-form CTA. Requested July 20. Blocks homepage draft. Follow up July 22. Escalate to Stephen if no answer by July 23.",
      bad: "Waiting on client. This does not say what decision, who owns it, or when to follow up."
    },
    relatedPortalRoutes: [r("Clients", "/clients"), r("Tasks", "/tasks"), r("Daily Reports", "/daily-reports")],
    relatedTemplates: ["Pending client decision note", "Follow-up reminder"],
    relatedSOPKeys: ["sop_13_request-missing-information-from-a-client", "sop_19_close-a-client-follow-up"],
    commonMistakes: ["No follow-up date", "Unclear decision wording", "Not pausing dependent work", "Treating partial response as complete"],
    qualityChecklist: ["Decision exact", "Owner named", "Date requested", "Impact described", "Reminder set", "Escalation date known"],
    founderReviewQuestions: ["What default reminder cadence should Alex use?", "When should client delays affect risk status?"]
  }),
  sop(18, "Handle a revision request", "ClientOperations", {
    purpose: "Classify and manage client revision requests without accidentally accepting scope expansion or promising unapproved timelines.",
    estimatedMinutes: 18,
    useWhen: ["Client requests a correction", "Client requests a small edit", "Client asks for a revision", "Client asks for work beyond the original scope"],
    doNotUseWhen: ["The request is a complaint requiring escalation", "The request is clearly new paid scope and Stephen has not reviewed it"],
    prerequisites: ["Original scope or task", "Client request wording", "Affected page/system/content", "Current approval status"],
    requiredInputs: ["Requested change", "Affected area", "Category", "Dependencies", "Approval need", "Task update", "Client confirmation"],
    steps: [
      { title: "Acknowledge receipt safely", instruction: "Record the request and, if responding, acknowledge receipt without promising completion date or scope acceptance.", expectedOutcome: "Client knows request was received without Ghost overcommitting." },
      { title: "Classify the request", instruction: "Separate correction, small edit, revision, and scope expansion based on original instructions and business impact.", expectedOutcome: "The right approval path is chosen." },
      { title: "Assess dependencies", instruction: "Identify affected page, system, asset, data, timeline, and related tasks before work begins.", expectedOutcome: "No hidden dependency is missed." },
      { title: "Request Stephen review when unclear", instruction: "If scope, timeline, pricing, quality dispute, or client expectation is unclear, create a Waiting on Stephen request.", expectedOutcome: "Founder controls boundary decisions." },
      { title: "Track completion and confirmation", instruction: "Create or update the task, record the change, send approved update, obtain client confirmation when appropriate, and close the revision.", expectedOutcome: "Revision has a traceable outcome." }
    ],
    approvalPoints: ["Stephen decides scope expansion, pricing, disputed quality, timeline promises, and client-facing revision language."],
    escalationConditions: ["Client is upset", "Revision changes paid scope", "Request affects security or legal content", "Deadline risk appears"],
    documentationRequirements: ["Client communication record", "Revision task", "Approval request if unclear", "Completion comment"],
    completionCriteria: ["Request classified", "Dependencies checked", "Approval obtained if needed", "Task updated", "Client confirmation recorded when required"],
    examples: {
      good: "Client asks to change button text. Alex records exact wording, checks whether copy change is in scope, updates task, and sends Stephen-approved confirmation.",
      bad: "Client asks for a new landing page section and Alex says it will be done tomorrow."
    },
    relatedPortalRoutes: [r("Clients", "/clients"), r("Tasks", "/tasks"), r("Approvals", "/approvals")],
    relatedTemplates: ["Revision classification note", "Scope review request"],
    relatedSOPKeys: ["sop_6_request-stephens-approval", "sop_14_prepare-a-client-status-update"],
    commonMistakes: ["Treating new scope as a small edit", "Promising completion date", "Not recording exact request", "Skipping client confirmation"],
    qualityChecklist: ["Exact request captured", "Category selected", "Dependencies checked", "Approval evaluated", "Task updated", "Outcome recorded"],
    founderReviewQuestions: ["What revision categories can Alex handle independently?", "Where should original scope be easiest to find?"]
  }),
  sop(19, "Close a client follow-up", "ClientOperations", {
    purpose: "Close follow-up loops only after the action, outcome, next step, and related records are complete.",
    estimatedMinutes: 8,
    useWhen: ["A client follow-up has been sent or completed", "Client responded to a follow-up", "A follow-up task is ready to close or reschedule"],
    doNotUseWhen: ["There is still an unanswered client question", "The follow-up outcome requires Stephen approval"],
    prerequisites: ["Follow-up task", "Communication record", "Client response if any", "Next action"],
    requiredInputs: ["Follow-up sent or completed", "Outcome", "Response summary", "Next action", "Due date", "Related task"],
    steps: [
      { title: "Confirm follow-up happened", instruction: "Verify the message was sent, call completed, client responded, or requested action was otherwise completed.", expectedOutcome: "The follow-up is not closed prematurely." },
      { title: "Record the outcome", instruction: "Summarize response or no response, channel, date/time, and any client decision or question.", expectedOutcome: "Client history reflects reality." },
      { title: "Set next action", instruction: "Add next action, owner, and due date if any additional work or reminder is needed.", expectedOutcome: "No open question is abandoned." },
      { title: "Update related task", instruction: "Move task to Completed, Waiting on Client, Waiting on Stephen, or a future follow-up status based on actual outcome.", expectedOutcome: "Task list stays accurate." },
      { title: "Escalate exceptions", instruction: "If the response includes complaint, scope, price, or deadline risk, route it to Stephen instead of closing normally.", expectedOutcome: "Risk is not hidden by closure." }
    ],
    approvalPoints: ["Stephen approval is required for follow-up outcomes involving pricing, scope, complaint, legal, or sensitive commitments."],
    escalationConditions: ["Client response creates risk", "No response threatens deadline", "Client asks pricing or contract question", "Wrong contact or do-not-contact signal appears"],
    documentationRequirements: ["Communication record", "Client note when relevant", "Task comment", "Follow-up date"],
    completionCriteria: ["Follow-up completed", "Outcome recorded", "Response summarized", "Next action entered", "Due date set where needed", "Related task updated"],
    examples: {
      good: "Follow-up sent July 20, no response by July 22, next reminder set July 24, task moved to Waiting on Client with comment.",
      bad: "Task closed because a message was drafted but never sent or recorded."
    },
    relatedPortalRoutes: [r("Clients", "/clients"), r("Tasks", "/tasks"), r("Communications", "/communications")],
    relatedTemplates: ["Follow-up outcome note", "No-response follow-up"],
    relatedSOPKeys: ["sop_16_record-client-communication", "sop_17_track-a-pending-client-decision"],
    commonMistakes: ["Closing after drafting but before sending", "No next date", "Ignoring client questions", "Not updating related task"],
    qualityChecklist: ["Action verified", "Outcome recorded", "Next action set", "Due date set", "Task updated", "Risks escalated"],
    founderReviewQuestions: ["How long should Alex wait before second client follow-up?", "Should no-response outcomes affect risk status?"]
  }),
  sop(20, "Identify an at-risk client", "ClientOperations", {
    purpose: "Spot client risk early so Stephen can intervene before dissatisfaction, missed expectations, or operational confusion becomes harder to repair.",
    estimatedMinutes: 15,
    useWhen: ["Reviewing assigned clients", "Repeated blockers appear", "Client engagement changes", "Complaints, gaps, or missed expectations appear"],
    doNotUseWhen: ["There is an active urgent complaint that should be escalated immediately", "Risk evidence is only a private assumption without facts"],
    prerequisites: ["Client record", "Recent communications", "Open tasks", "Risk indicators"],
    requiredInputs: ["Communication gaps", "Complaints", "Scope confusion", "Payment issues", "Delayed inputs", "Overdue tasks", "Quality concerns", "Security concerns", "Cancellation language"],
    steps: [
      { title: "Gather risk indicators", instruction: "Review missed expectations, communication gaps, unresolved complaints, scope confusion, payment issues, delayed inputs, overdue tasks, quality concerns, security concerns, low engagement, and cancellation language.", expectedOutcome: "Risk assessment is evidence-based." },
      { title: "Classify severity", instruction: "Use Low for watch items, Medium for recurring or deadline-affecting concerns, and High for complaint, payment, security, public, legal, or cancellation risk.", expectedOutcome: "Risk level matches business impact." },
      { title: "Document facts", instruction: "Record objective evidence with dates and sources. Avoid emotional labels or assumptions about client intent.", expectedOutcome: "Stephen can review without bias." },
      { title: "Recommend next action", instruction: "Suggest a follow-up, Stephen review, status update, meeting, or pause based on the risk type.", expectedOutcome: "Risk report is actionable." },
      { title: "Escalate when needed", instruction: "Create a Waiting on Stephen request for Medium or High risk and use urgent escalation for severe security, legal, payment, or public issues.", expectedOutcome: "Risk gets appropriate attention." }
    ],
    approvalPoints: ["Stephen approves risk status changes, client-facing recovery messages, refunds, payment actions, and scope decisions."],
    escalationConditions: ["High risk indicator", "Client mentions cancellation", "Security or payment concern", "Repeated missed expectations", "Public review threat"],
    documentationRequirements: ["Client note", "Risk recommendation", "Waiting on Stephen for Medium/High", "Task for next action"],
    completionCriteria: ["Indicators reviewed", "Low/Medium/High criteria applied", "Facts documented", "Recommendation made", "Stephen notified when required"],
    examples: {
      good: "Medium risk: client missed two input deadlines and asked whether launch is slipping. Impact: homepage draft blocked. Recommendation: Stephen-approved status update and new input deadline.",
      bad: "Client is difficult. This is subjective and gives no evidence or action."
    },
    relatedPortalRoutes: [r("Clients", "/clients"), r("Approvals", "/approvals"), r("Tasks", "/tasks")],
    relatedTemplates: ["Client risk note", "Risk escalation request"],
    relatedSOPKeys: ["sop_15_escalate-a-client-complaint", "sop_14_prepare-a-client-status-update"],
    commonMistakes: ["Using feelings instead of evidence", "Waiting until risk is severe", "Changing risk status without approval", "Not recommending action"],
    qualityChecklist: ["Indicators checked", "Severity assigned", "Evidence dated", "Impact stated", "Recommendation included", "Approval requested"],
    founderReviewQuestions: ["Should Operations set risk status or recommend it?", "What client risk labels should become dashboard alerts?"]
  }),
  sop(21, "Review an assigned lead", "LeadOperations", {
    purpose: "Assess whether an assigned lead is actionable, current, and safe to work before drafting or scheduling follow-up.",
    estimatedMinutes: 12,
    useWhen: ["A lead follow-up is assigned", "A lead appears on the dashboard", "Preparing a draft, next action, or discovery call"],
    doNotUseWhen: ["Lead is not assigned to Alex", "Lead requires Stephen because of enterprise, legal, pricing, or reputation risk"],
    prerequisites: ["Assigned lead access", "Recent interaction history", "Lead stage definitions"],
    requiredInputs: ["Company", "Contact", "Service interest", "Source", "Estimated value", "Last interaction", "Follow-up date", "Next action", "Existing drafts", "Approval requirements", "Duplicate check"],
    steps: [
      { title: "Verify assigned access", instruction: "Confirm the lead appears in Alex's assigned list before reviewing or updating it.", expectedOutcome: "Permission boundaries are respected." },
      { title: "Read lead profile", instruction: "Review company, contact, source, service interest, stage, estimated value, and last interaction.", expectedOutcome: "Alex understands who the lead is and why they matter." },
      { title: "Check activity", instruction: "Review follow-up date, next action, existing drafts, approvals, and duplicate records.", expectedOutcome: "Alex avoids duplicate or stale outreach." },
      { title: "Judge actionability", instruction: "Decide whether the lead is actionable, needs missing information, should be nurtured, requires Stephen, or should be cleaned.", expectedOutcome: "The right workflow is chosen." },
      { title: "Record next step", instruction: "Update next action with owner, date, stage-aware action, and approval need.", expectedOutcome: "Lead queue stays useful." }
    ],
    approvalPoints: ["Stephen approval is needed for pricing, high-value, executive, enterprise, partnership, sensitive industry, custom architecture, or reputation-risk leads."],
    escalationConditions: ["Large estimated value", "Enterprise or government opportunity", "Legal/security requirements", "Pricing exception", "Executive contact", "Duplicate or bad data affects outreach"],
    documentationRequirements: ["Lead next action", "Task or draft record", "Waiting on Stephen if required"],
    completionCriteria: ["Access verified", "Profile reviewed", "Activity checked", "Actionability determined", "Next action updated"],
    examples: {
      good: "Alex sees Atlas is assigned, service interest is operations automation, last touch was discovery interest, next action is draft approval-safe follow-up by July 22.",
      bad: "Alex sends a generic message to an unassigned lead without checking duplicates or approval requirements."
    },
    relatedPortalRoutes: [r("Leads", "/leads"), r("Draft Communications", "/communications"), r("Approvals", "/approvals")],
    relatedTemplates: ["Lead review checklist", "Next action format"],
    relatedSOPKeys: ["sop_22_update-lead-next-action", "sop_23_draft-a-lead-follow-up", "sop_29_flag-a-lead-requiring-stephen"],
    commonMistakes: ["Skipping duplicate check", "Ignoring estimated value", "Using generic next action", "Drafting before reviewing last interaction"],
    qualityChecklist: ["Assigned access", "Profile complete", "Last interaction reviewed", "Duplicate checked", "Approval need checked", "Next action set"],
    founderReviewQuestions: ["What estimated value threshold requires Stephen?", "Which lead sources should Alex prioritize first?"]
  }),
  sop(22, "Update lead next action", "LeadOperations", {
    purpose: "Make every lead next action specific, owned, dated, stage-aware, realistic, and measurable.",
    estimatedMinutes: 6,
    useWhen: ["A lead stage changes", "A follow-up outcome is recorded", "A next action is vague or stale", "A lead review identifies missing work"],
    doNotUseWhen: ["The lead should be closed, do-not-contact, or escalated before any next action", "Alex lacks access to the lead"],
    prerequisites: ["Lead record", "Current stage", "Recent interaction", "Owner and due date"],
    requiredInputs: ["Specific action", "Owner", "Due date", "Stage", "Measurable result", "Approval need"],
    steps: [
      { title: "Read current stage", instruction: "Check whether the lead is identified, contacted, qualified, discovery, nurture, not qualified, or another current stage.", expectedOutcome: "Next action matches stage." },
      { title: "Replace vague wording", instruction: "Avoid 'follow up.' Write the exact action, channel, purpose, owner, and date.", expectedOutcome: "Anyone can execute the action." },
      { title: "Check approval boundary", instruction: "Flag pricing, large opportunity, executive contact, sensitive industry, or custom architecture for Stephen.", expectedOutcome: "Next action does not exceed authority." },
      { title: "Make it measurable", instruction: "Use an outcome such as draft submitted, email sent after approval, meeting scheduled, info requested, or nurture date set.", expectedOutcome: "Completion can be verified." },
      { title: "Save and link related work", instruction: "Update lead next action and connect any task, draft, or approval record.", expectedOutcome: "Lead and work queue stay aligned." }
    ],
    approvalPoints: ["Stephen approves next actions involving pricing, custom proposals, executive outreach, sensitive industries, or unusual urgency."],
    escalationConditions: ["Next action would make a pricing or deadline claim", "Lead asks for custom architecture", "Record data is incomplete enough to risk wrong outreach"],
    documentationRequirements: ["Lead next action", "Task or draft link", "Approval request if needed"],
    completionCriteria: ["Action is specific", "Owner named", "Date included", "Stage-aware", "Measurable", "Approval need marked"],
    examples: {
      good: "Draft a website-subscription follow-up for Stephen's approval by July 22, then schedule manual send after approval.",
      bad: "Follow up. This is not specific, dated, owned, or measurable."
    },
    relatedPortalRoutes: [r("Leads", "/leads"), r("Tasks", "/tasks"), r("Approvals", "/approvals")],
    relatedTemplates: ["Next action rewrite examples"],
    relatedSOPKeys: ["sop_21_review-an-assigned-lead", "sop_25_record-a-follow-up-outcome"],
    commonMistakes: ["No due date", "No owner", "Action not tied to stage", "Hidden approval need"],
    qualityChecklist: ["Specific", "Owned", "Dated", "Stage-based", "Realistic", "Measurable", "Approval checked"],
    founderReviewQuestions: ["Should next action have structured fields instead of free text?", "Which lead stages need required next actions?"]
  }),
  sop(23, "Draft a lead follow-up", "LeadOperations", {
    purpose: "Prepare personalized, honest, approval-safe lead follow-ups that move opportunities forward without inventing urgency, relationship, or pricing.",
    estimatedMinutes: 20,
    useWhen: ["A lead follow-up task is assigned", "A lead has a due follow-up date", "Stephen asks for a draft"],
    doNotUseWhen: ["Lead is do-not-contact, not qualified, unassigned, or requires Stephen before outreach", "The follow-up would mention unapproved pricing or claims"],
    prerequisites: ["Lead profile", "Original context", "Service interest", "Last interaction", "Approval boundary"],
    requiredInputs: ["Contact name", "Company", "Original context", "Relevant service", "Reason to respond", "Clear CTA", "Approved claims", "Channel"],
    steps: [
      { title: "Review lead context", instruction: "Read contact name, company, source, service interest, prior conversation, stage, and next action.", expectedOutcome: "Draft is personalized from real data." },
      { title: "Choose follow-up type", instruction: "Identify first follow-up, after discovery call, no-response follow-up, nurture follow-up, or referral follow-up.", expectedOutcome: "Tone and CTA match context." },
      { title: "Draft concise message", instruction: "Use honest claims, relevant service language, clear CTA, and appropriate length. Do not invent relationship, results, false urgency, or unapproved price.", expectedOutcome: "Draft can be reviewed safely." },
      { title: "Check boundaries", instruction: "Remove pricing, discount, launch dates, guarantees, or technical claims that Stephen has not approved.", expectedOutcome: "Draft stays within Alex's authority." },
      { title: "Submit for approval", instruction: "Create DraftCommunication linked to the lead and submit for Stephen review when client-facing.", expectedOutcome: "No unapproved outreach is sent." }
    ],
    approvalPoints: ["Stephen approves lead follow-ups before send, especially pricing, deadlines, claims, executive contacts, and high-value leads."],
    escalationConditions: ["Lead asks for pricing", "Lead is high-value or enterprise", "Sensitive industry", "Unclear prior relationship", "Do-not-contact signal"],
    documentationRequirements: ["Draft communication", "Lead next action", "Approval request", "Outcome after send"],
    completionCriteria: ["Draft is personalized", "CTA clear", "Claims verified", "Pricing absent or approved", "Draft submitted for approval"],
    examples: {
      good: "Hi Jordan, following up on your interest in an operations automation workflow for Atlas. Stephen can review where manual follow-up is slowing your team and identify the right next step. Would you like to compare notes on a short discovery call next week?",
      bad: "We guarantee we can double sales for $500 if you reply today. This invents results, price, and false urgency."
    },
    relatedPortalRoutes: [r("Leads", "/leads"), r("Draft Communications", "/communications"), r("Approvals", "/approvals")],
    relatedTemplates: ["First follow-up", "After discovery call", "No-response follow-up", "Nurture follow-up", "Referral follow-up"],
    relatedSOPKeys: ["sop_24_submit-a-draft-for-approval", "sop_28_flag-a-pricing-question"],
    commonMistakes: ["Generic message", "Unapproved price", "False urgency", "Invented relationship", "No CTA"],
    qualityChecklist: ["Contact personalized", "Context accurate", "Service relevant", "CTA clear", "Claims verified", "Approval submitted"],
    founderReviewQuestions: ["Which lead follow-up templates are pre-approved?", "Can Alex ever send low-risk nurture messages directly?"]
  }),
  sop(24, "Submit a draft for approval", "LeadOperations", {
    purpose: "Move client or lead messages through a controlled DraftCommunication lifecycle so Stephen approves external language before it is sent.",
    estimatedMinutes: 10,
    useWhen: ["A client or lead message is ready for review", "A draft includes any approval-sensitive wording", "Stephen requires review before send"],
    doNotUseWhen: ["The message is purely internal", "The draft is not tied to a real recipient or purpose"],
    prerequisites: ["Verified recipient", "Related client or lead", "Complete draft message", "Purpose and channel"],
    requiredInputs: ["Recipient", "Channel", "Subject", "Message", "Purpose", "Related client/lead", "Pricing or deadline concerns"],
    steps: [
      { title: "Verify draft metadata", instruction: "Confirm recipient, channel, subject, related client or lead, and purpose before submission.", expectedOutcome: "Stephen reviews the right message for the right record." },
      { title: "Review lifecycle status", instruction: "Use Draft while composing, Pending Approval after submission, Changes Requested for revisions, Approved when Stephen approves, Sent after manual send is recorded, and Cancelled when abandoned.", expectedOutcome: "Draft status is meaningful." },
      { title: "Check risky language", instruction: "Flag pricing, deadlines, discounts, guarantees, scope, legal, security, complaint, or public claims in the approval context.", expectedOutcome: "Stephen sees the decision risk." },
      { title: "Submit for approval", instruction: "Submit the draft and link any related task, lead, client, or approval note.", expectedOutcome: "Draft enters the review queue." },
      { title: "Act on result", instruction: "Revise when Changes Requested, record manual send when Approved and sent, and record outcome after recipient response.", expectedOutcome: "Lifecycle closes cleanly." }
    ],
    approvalPoints: ["Stephen approval required before sending external drafts unless a specific template and situation are pre-approved."],
    escalationConditions: ["Draft contains sensitive data", "Recipient may be wrong", "Draft includes pricing or deadline", "Client complaint or public issue"],
    documentationRequirements: ["DraftCommunication", "Approval status", "Task comment", "Send record and outcome"],
    completionCriteria: ["Recipient verified", "Message complete", "Risky language flagged", "Draft submitted", "Approval result followed"],
    examples: {
      good: "Alex submits Atlas follow-up as Pending Approval, notes that pricing-safe CTA needs review, and waits before sending.",
      bad: "Alex sends the draft from email first and marks it Approved afterward."
    },
    relatedPortalRoutes: [r("Draft Communications", "/communications"), r("Approvals", "/approvals"), r("Leads", "/leads"), r("Clients", "/clients")],
    relatedTemplates: ["Draft submission checklist", "Changes requested response"],
    relatedSOPKeys: ["sop_23_draft-a-lead-follow-up", "sop_46_submit-content-for-approval"],
    commonMistakes: ["Wrong recipient", "No related record", "Sending before approval", "Forgetting to record Sent status"],
    qualityChecklist: ["Recipient verified", "Channel selected", "Purpose clear", "Risk flagged", "Related record linked", "Submitted"],
    founderReviewQuestions: ["Which draft categories can use pre-approved templates?", "Should Approved drafts expire after a certain time?"]
  }),
  sop(25, "Record a follow-up outcome", "LeadOperations", {
    purpose: "Translate lead follow-up results into clear pipeline next steps so opportunities are not lost or over-contacted.",
    estimatedMinutes: 8,
    useWhen: ["A lead follow-up is sent", "A lead responds", "A scheduled follow-up receives no response", "Lead disposition changes"],
    doNotUseWhen: ["The outcome is a client communication, not lead activity", "The response includes complaint, legal, security, or pricing risk needing Stephen"],
    prerequisites: ["Lead record", "Communication record", "Outcome category", "Next action rule"],
    requiredInputs: ["Outcome", "Response summary", "Next action", "Follow-up date", "Stage update", "Approval need"],
    steps: [
      { title: "Choose outcome category", instruction: "Use no response, replied positively, replied negatively, requested information, meeting scheduled, follow-up later, not qualified, wrong contact, nurture, or do not contact.", expectedOutcome: "Pipeline status is standardized." },
      { title: "Summarize evidence", instruction: "Record the date, channel, response or lack of response, and any meaningful quote or decision.", expectedOutcome: "Outcome is verifiable." },
      { title: "Set next action", instruction: "For each outcome, choose the correct next step: schedule, draft info, nurture, close, correct contact, or escalate.", expectedOutcome: "Follow-up does not stop at recording." },
      { title: "Update lead stage", instruction: "Adjust stage only when the outcome supports it and approval boundaries are respected.", expectedOutcome: "Pipeline remains accurate." },
      { title: "Escalate sensitive outcomes", instruction: "Flag pricing, enterprise, legal, security, reputation, or executive-contact outcomes for Stephen.", expectedOutcome: "High-risk lead moments are controlled." }
    ],
    approvalPoints: ["Stephen approval is needed for disqualification rules, do-not-contact exceptions, pricing responses, and high-value next steps."],
    escalationConditions: ["Lead asks price", "Meeting with executive requested", "Wrong-contact complaint", "Do-not-contact instruction", "Enterprise or government signal"],
    documentationRequirements: ["Lead outcome note", "Next action", "Stage update", "Task or approval if needed"],
    completionCriteria: ["Outcome category selected", "Evidence summarized", "Next action set", "Stage updated if appropriate", "Sensitive items escalated"],
    examples: {
      good: "Outcome: Requested information. Lead asked for AI assistant examples. Next action: draft approval-safe example list for Stephen review by July 22.",
      bad: "Outcome: good. No response summary, stage, or next action."
    },
    relatedPortalRoutes: [r("Leads", "/leads"), r("Tasks", "/tasks"), r("Approvals", "/approvals")],
    relatedTemplates: ["Follow-up outcome categories", "Lead disposition note"],
    relatedSOPKeys: ["sop_22_update-lead-next-action", "sop_27_move-a-lead-to-nurture", "sop_29_flag-a-lead-requiring-stephen"],
    commonMistakes: ["No next action", "Over-contacting after negative response", "Changing stage without evidence", "Not marking do-not-contact"],
    qualityChecklist: ["Outcome selected", "Evidence dated", "Response summarized", "Next action clear", "Stage checked", "Approval checked"],
    founderReviewQuestions: ["What outcome categories should be shown in the UI?", "Who can mark a lead do-not-contact?"]
  }),
  sop(26, "Schedule a discovery call", "LeadOperations", {
    purpose: "Coordinate discovery calls with clear timezones, agenda, context, and lead updates so Stephen enters the meeting prepared.",
    estimatedMinutes: 18,
    useWhen: ["Lead expresses interest in a call", "Stephen approves scheduling", "A qualified lead needs discovery"],
    doNotUseWhen: ["Lead is unqualified, do-not-contact, or requires Stephen review before scheduling", "Calendar access or timezone is uncertain"],
    prerequisites: ["Stephen availability", "Lead contact details", "Timezone", "Meeting length", "Approved scheduling language"],
    requiredInputs: ["Interest confirmation", "Attendees", "Timezones", "Options", "Duration", "Location/link", "Agenda", "Lead context"],
    steps: [
      { title: "Confirm interest and fit", instruction: "Verify the lead requested or accepted a discovery call and is not blocked by approval conditions.", expectedOutcome: "Only appropriate leads are scheduled." },
      { title: "Check calendar and timezones", instruction: "Review Stephen's availability, lead timezone, Alex timezone, and America/Chicago references before offering options.", expectedOutcome: "Time options are accurate." },
      { title: "Offer clear options", instruction: "Send approved options with date, time, timezone, duration, and meeting purpose. Avoid too many options.", expectedOutcome: "Lead can choose easily." },
      { title: "Create meeting", instruction: "Add calendar event with attendees, location or Meet link, agenda, description, reminders, and related lead/company context.", expectedOutcome: "Calendar contains a useful meeting record." },
      { title: "Update lead and brief", instruction: "Record scheduled meeting, update lead stage or next action, and prepare a meeting brief for Stephen.", expectedOutcome: "Sales workflow continues into preparation." }
    ],
    approvalPoints: ["Stephen approves scheduling for high-value, enterprise, custom, sensitive, or unusual leads.", "Stephen controls calendar conflicts and meeting length exceptions."],
    escalationConditions: ["Timezone uncertainty", "Lead asks for urgent executive meeting", "Large opportunity", "Sensitive industry", "Calendar conflict"],
    documentationRequirements: ["Calendar event", "Lead update", "Meeting brief", "Confirmation message"],
    completionCriteria: ["Interest confirmed", "Timezone handled", "Meeting created", "Agenda included", "Lead updated", "Brief queued"],
    examples: {
      good: "Alex offers two CT options, confirms the lead's timezone, schedules a 30-minute Meet with agenda, and updates Atlas next action to prepare brief.",
      bad: "Alex says 'How about Friday?' without timezone, duration, agenda, or Stephen availability."
    },
    relatedPortalRoutes: [r("Calendar", "/calendar"), r("Leads", "/leads"), r("Tasks", "/tasks")],
    relatedTemplates: ["Discovery scheduling message", "Meeting confirmation", "Meeting brief"],
    relatedSOPKeys: ["sop_31_schedule-a-meeting", "sop_33_prepare-a-meeting-brief"],
    commonMistakes: ["Timezone missing", "Too many options", "No agenda", "No lead update", "Scheduling without approval"],
    qualityChecklist: ["Interest confirmed", "Availability checked", "Timezone named", "Options clear", "Invite created", "Lead updated", "Brief assigned"],
    founderReviewQuestions: ["What default discovery-call length should Alex use?", "Which scheduling tool or calendar should be source of truth?"]
  }),
  sop(27, "Move a lead to nurture", "LeadOperations", {
    purpose: "Keep relevant but not active leads warm without repeatedly contacting people who are not ready or not interested.",
    estimatedMinutes: 10,
    useWhen: ["Timing is not right", "Budget is not ready", "Decision is delayed", "Existing contract blocks action", "Seasonal interest exists", "Lead remains relevant but inactive"],
    doNotUseWhen: ["Lead said do not contact", "Lead is not qualified", "Lead requires immediate Stephen action"],
    prerequisites: ["Lead response or evidence", "Future follow-up reason", "Nurture date"],
    requiredInputs: ["Nurture reason", "Future follow-up date", "Nurture message", "Notes", "Contact preference"],
    steps: [
      { title: "Confirm nurture fit", instruction: "Verify the lead is still relevant but not actively ready, and has not opted out.", expectedOutcome: "Nurture is respectful." },
      { title: "Record reason", instruction: "State the reason such as timing, budget, decision delay, contract, seasonality, or future interest.", expectedOutcome: "Future follow-up has context." },
      { title: "Set future date", instruction: "Choose a reasonable follow-up date based on the lead's timing and Stephen's guidance.", expectedOutcome: "Lead does not vanish." },
      { title: "Prepare nurture message", instruction: "Draft a light, value-focused message if needed, without pressure, false urgency, or unapproved offers.", expectedOutcome: "Future outreach is appropriate." },
      { title: "Update stage and next action", instruction: "Move lead to nurture, record notes, next date, and owner.", expectedOutcome: "Pipeline reflects inactive but relevant status." }
    ],
    approvalPoints: ["Stephen approves nurture cadence, high-value leads, and any offer or pricing language."],
    escalationConditions: ["Lead requests no contact", "Lead is large or sensitive", "Nurture reason involves pricing objection or contract complexity"],
    documentationRequirements: ["Lead stage", "Nurture reason", "Future follow-up date", "Next action"],
    completionCriteria: ["Nurture criteria met", "Reason recorded", "Follow-up date set", "Message safe", "Lead stage updated"],
    examples: {
      good: "Moved to nurture because budget review is in Q4. Follow-up date October 10 with a light check-in and no pricing claim.",
      bad: "Moved to nurture but no reason, date, or contact preference is recorded."
    },
    relatedPortalRoutes: [r("Leads", "/leads"), r("Tasks", "/tasks")],
    relatedTemplates: ["Nurture note", "Low-pressure nurture message"],
    relatedSOPKeys: ["sop_25_record-a-follow-up-outcome", "sop_22_update-lead-next-action"],
    commonMistakes: ["Nurturing do-not-contact leads", "No future date", "Too frequent outreach", "Unapproved discounts"],
    qualityChecklist: ["Still relevant", "No opt-out", "Reason recorded", "Date set", "Stage updated", "Tone low pressure"],
    founderReviewQuestions: ["What default nurture intervals should Ghost use?", "Which lead stages should allow nurture?"]
  }),
  sop(28, "Flag a pricing question", "LeadOperations", {
    purpose: "Capture pricing questions with enough context for Stephen to answer without Alex inventing prices, discounts, or package terms.",
    estimatedMinutes: 10,
    useWhen: ["Lead or client asks about price", "Budget, discount, payment structure, or package fit is mentioned", "Prior quote or scope affects price"],
    doNotUseWhen: ["The question is already answered in a Stephen-approved quote", "The issue is a payment dispute requiring client complaint or urgent escalation workflow"],
    prerequisites: ["Related client or lead", "Requested service", "Scope context", "Deadline"],
    requiredInputs: ["Requested service", "Current scope", "Prior quote", "Budget signals", "Discount request", "Competitive context", "Recommendation", "Deadline"],
    steps: [
      { title: "Capture exact question", instruction: "Record the wording used by the client or lead, including service, budget, discount, package, or payment structure.", expectedOutcome: "Stephen sees the real pricing ask." },
      { title: "Gather context", instruction: "Add current scope, prior quote if any, budget signals, competitive context, deadline, and related record.", expectedOutcome: "Pricing is evaluated in context." },
      { title: "Avoid pricing answer", instruction: "Do not invent numbers, discounts, guarantees, or payment terms. Use neutral acknowledgement if approved.", expectedOutcome: "Alex does not create unauthorized expectations." },
      { title: "Recommend response posture", instruction: "Suggest whether Stephen should answer directly, schedule a call, ask scope questions, or defer until proposal.", expectedOutcome: "Approval request is actionable." },
      { title: "Track decision", instruction: "Create Waiting on Stephen request and update lead or client next action based on Stephen's answer.", expectedOutcome: "Pricing question is not lost." }
    ],
    approvalPoints: ["All pricing, discounts, refunds, payment terms, and package commitments require Stephen."],
    escalationConditions: ["Large opportunity", "Discount request", "Payment dispute", "Client demands immediate number", "Pricing affects scope or contract"],
    documentationRequirements: ["Waiting on Stephen request", "Lead/client note", "Task or draft update"],
    completionCriteria: ["Exact question captured", "Scope context included", "No price invented", "Recommendation included", "Decision tracked"],
    examples: {
      good: "Lead asked whether website subscription includes automation setup. Context: wants booking workflow. Recommendation: Stephen answers with scope questions before numbers.",
      bad: "Alex says it should be around $500 because that seems reasonable."
    },
    relatedPortalRoutes: [r("Approvals", "/approvals"), r("Leads", "/leads"), r("Clients", "/clients")],
    relatedTemplates: ["Pricing question request", "Neutral pricing acknowledgement"],
    relatedSOPKeys: ["sop_6_request-stephens-approval", "sop_29_flag-a-lead-requiring-stephen"],
    commonMistakes: ["Inventing a price", "Forgetting prior quote", "Not naming scope", "Leaving out deadline"],
    qualityChecklist: ["Exact wording", "Service named", "Scope included", "Prior quote checked", "Budget signal captured", "Stephen requested"],
    founderReviewQuestions: ["What pricing examples may be shown as illustrative?", "Should any starting-price language be pre-approved?"]
  }),
  sop(29, "Flag a lead requiring Stephen", "LeadOperations", {
    purpose: "Identify leads that exceed Alex's normal operating authority and route them to Stephen before outreach or qualification decisions.",
    estimatedMinutes: 8,
    useWhen: ["Lead appears unusually large, sensitive, strategic, or complex", "Lead asks for custom terms, partnership, equity, or executive conversation"],
    doNotUseWhen: ["Lead is routine and fits approved templates", "Lead is clearly spam or do-not-contact"],
    prerequisites: ["Lead profile", "Estimated value", "Industry/context", "Contact seniority", "Requested service"],
    requiredInputs: ["Opportunity type", "Estimated value", "Industry", "Contact", "Reason Stephen is needed", "Deadline"],
    steps: [
      { title: "Screen for Stephen triggers", instruction: "Check enterprise, government, large estimated value, partnership, equity, legal/security requirements, custom architecture, sensitive industry, pricing exception, executive contact, and reputation risk.", expectedOutcome: "High-significance leads are recognized." },
      { title: "Record trigger evidence", instruction: "Write the exact data point that caused the flag, such as value, title, industry, requirement, or request.", expectedOutcome: "Stephen understands why the lead is flagged." },
      { title: "Pause routine outreach", instruction: "Do not send generic follow-up or pricing language until Stephen gives direction.", expectedOutcome: "Strategic lead is not mishandled." },
      { title: "Create request", instruction: "Submit Waiting on Stephen with summary, context, recommendation, deadline, and related lead.", expectedOutcome: "Lead enters Founder review." },
      { title: "Update next action", instruction: "Set lead next action to await Stephen direction or complete the approved next step.", expectedOutcome: "Pipeline is accurate." }
    ],
    approvalPoints: ["Stephen controls all flagged lead decisions, messaging, pricing, qualification, and next-step strategy."],
    escalationConditions: ["Enterprise/government", "Partnership/equity", "Legal/security review", "Sensitive industry", "Executive contact", "Large estimated value", "Reputation risk"],
    documentationRequirements: ["Lead note", "Waiting on Stephen", "Task comment if assigned"],
    completionCriteria: ["Trigger identified", "Evidence recorded", "Routine outreach paused", "Stephen request created", "Next action updated"],
    examples: {
      good: "Flagged: government agency contact asks about AI workflow and security review. Stephen needed before any capability statement or meeting offer.",
      bad: "Alex sends a normal sales email promising custom architecture discovery without review."
    },
    relatedPortalRoutes: [r("Leads", "/leads"), r("Approvals", "/approvals")],
    relatedTemplates: ["Stephen-required lead flag"],
    relatedSOPKeys: ["sop_28_flag-a-pricing-question", "sop_21_review-an-assigned-lead"],
    commonMistakes: ["Missing executive title", "Treating enterprise as routine", "Sending before review", "No deadline in request"],
    qualityChecklist: ["Trigger checked", "Evidence written", "Outreach paused", "Approval created", "Next action updated"],
    founderReviewQuestions: ["What estimated value threshold should trigger this SOP?", "Which industries are sensitive for Ghost?"]
  }),
  sop(30, "Clean an incomplete lead record", "LeadOperations", {
    purpose: "Improve lead data quality without inventing unknown information or overwriting useful context.",
    estimatedMinutes: 12,
    useWhen: ["Lead record has missing fields", "Duplicate data may exist", "Next action is unclear because data is incomplete"],
    doNotUseWhen: ["Lead should be deleted or disqualified without Stephen approval", "Information cannot be verified and would require guessing"],
    prerequisites: ["Lead access", "Allowed sources", "Duplicate-check method"],
    requiredInputs: ["Company", "Contact", "Email/phone", "Source", "Service interest", "Stage", "Last contact", "Next action", "Follow-up date", "Assigned user", "Notes", "Duplicate check"],
    steps: [
      { title: "Review required fields", instruction: "Check company, contact, email/phone, source, service interest, stage, last contact, next action, follow-up date, assigned user, and notes.", expectedOutcome: "Missing fields are known." },
      { title: "Check duplicates", instruction: "Search for duplicate company, email, contact, or obvious variant before creating new data.", expectedOutcome: "Lead database stays clean." },
      { title: "Verify from allowed sources", instruction: "Use existing Portal records or approved sources. Mark unknown rather than inventing details.", expectedOutcome: "Data quality improves without false data." },
      { title: "Update next action", instruction: "If missing data blocks work, set a next action to request or research that information.", expectedOutcome: "Incomplete record has a path forward." },
      { title: "Escalate questionable records", instruction: "Flag duplicates, sensitive leads, or unclear ownership for Stephen instead of merging or deleting independently.", expectedOutcome: "Risky cleanup decisions are controlled." }
    ],
    approvalPoints: ["Stephen approves deletions, merges, disqualification, sensitive enrichment, and unusual source usage."],
    escalationConditions: ["Possible duplicate", "Sensitive lead", "Wrong contact", "Do-not-contact signal", "Unknown owner", "Conflicting data"],
    documentationRequirements: ["Lead fields updated", "Unknowns marked", "Duplicate note", "Next action"],
    completionCriteria: ["Required-field checklist reviewed", "Duplicates checked", "Unknowns not invented", "Next action set", "Escalations made"],
    examples: {
      good: "Company and service interest verified from original form; phone remains Unknown; next action asks Stephen whether email-only follow-up is acceptable.",
      bad: "Alex guesses a phone number from a search result and overwrites the contact."
    },
    relatedPortalRoutes: [r("Leads", "/leads"), r("Tasks", "/tasks")],
    relatedTemplates: ["Lead cleanup checklist", "Unknown data notation"],
    relatedSOPKeys: ["sop_21_review-an-assigned-lead", "sop_22_update-lead-next-action"],
    commonMistakes: ["Inventing unknowns", "Skipping duplicate check", "Deleting instead of flagging", "Using unapproved enrichment sources"],
    qualityChecklist: ["Required fields checked", "Duplicate searched", "Sources approved", "Unknowns marked", "Next action set"],
    founderReviewQuestions: ["Which enrichment sources are approved?", "Who may merge duplicate leads?"]
  }),
  sop(31, "Schedule a meeting", "MeetingsExecutiveSupport", {
    purpose: "Create calendar meetings with clear purpose, attendees, timezone, agenda, link, reminders, and related Portal context.",
    estimatedMinutes: 15,
    useWhen: ["Stephen approves or requests a meeting", "A client or lead call needs to be placed on calendar", "Internal review needs scheduled time"],
    doNotUseWhen: ["Stephen has not approved a client or lead meeting that requires approval", "Calendar ownership or timezone is unclear"],
    prerequisites: ["Calendar access", "Attendee details", "Timezone", "Meeting purpose", "Related record"],
    requiredInputs: ["Purpose", "Required attendees", "Availability", "Timezone", "Duration", "Location", "Meet link", "Agenda", "Description", "Related client/lead", "Reminders"],
    steps: [
      { title: "Confirm purpose and authority", instruction: "Verify why the meeting is needed and whether Stephen approved scheduling.", expectedOutcome: "Meetings are intentional and authorized." },
      { title: "Check availability and timezone", instruction: "Compare Stephen's calendar, attendee availability, and timezone labels before selecting time.", expectedOutcome: "No timezone confusion." },
      { title: "Create complete event", instruction: "Add title, attendees, duration, location or Meet link, agenda, description, reminders, and related client or lead context.", expectedOutcome: "Invite contains useful preparation details." },
      { title: "Send confirmation", instruction: "Confirm date, local time, timezone, duration, attendees, location/link, agenda, and preparation needed.", expectedOutcome: "Everyone knows how to attend." },
      { title: "Update Portal", instruction: "Update related lead, client, task, or meeting brief so the calendar is not the only record.", expectedOutcome: "Portal remains source of truth." }
    ],
    approvalPoints: ["Stephen approves client, lead, executive, high-value, or sensitive meetings before scheduling."],
    escalationConditions: ["Timezone conflict", "Double booking", "Sensitive lead", "Client complaint meeting", "Unclear attendees"],
    documentationRequirements: ["Calendar event", "Portal task/lead/client update", "Confirmation message"],
    completionCriteria: ["Purpose clear", "Attendees correct", "Timezone correct", "Link included", "Agenda included", "Portal updated"],
    examples: {
      good: "Discovery call scheduled for July 23, 2:00 PM CT, 30 minutes, Meet link, agenda and Atlas lead context included, lead next action updated.",
      bad: "Meeting titled 'Call' with no timezone, agenda, link, or related lead."
    },
    relatedPortalRoutes: [r("Calendar", "/calendar"), r("Leads", "/leads"), r("Clients", "/clients")],
    relatedTemplates: ["Meeting invite", "Calendar description"],
    relatedSOPKeys: ["sop_26_schedule-a-discovery-call", "sop_32_confirm-a-meeting", "sop_33_prepare-a-meeting-brief"],
    commonMistakes: ["Missing timezone", "No agenda", "No related record", "Wrong attendee email", "No reminders"],
    qualityChecklist: ["Authority confirmed", "Availability checked", "Timezone named", "Invite complete", "Confirmation sent", "Portal updated"],
    founderReviewQuestions: ["What calendar colors or naming conventions should Alex use?", "Which meetings require reminders by default?"]
  }),
  sop(32, "Confirm a meeting", "MeetingsExecutiveSupport", {
    purpose: "Send meeting confirmations that reduce no-shows and timezone confusion while giving attendees the agenda and preparation needs.",
    estimatedMinutes: 8,
    useWhen: ["A meeting is newly scheduled", "A client or lead chooses a time", "A meeting is approaching and needs reconfirmation"],
    doNotUseWhen: ["The meeting has not been approved", "There is a calendar conflict that must be resolved first"],
    prerequisites: ["Scheduled event", "Attendees", "Timezone", "Agenda", "Location/link"],
    requiredInputs: ["Date", "Local time and timezone", "Duration", "Attendees", "Location/link", "Agenda", "Preparation needed", "Rescheduling instructions"],
    steps: [
      { title: "Verify event details", instruction: "Check date, time, timezone, attendees, duration, location/link, and agenda in the calendar event.", expectedOutcome: "Confirmation matches the event." },
      { title: "Name timezone clearly", instruction: "State local time and timezone, especially when Alex, Stephen, and the attendee are in different zones.", expectedOutcome: "Attendees do not misread time." },
      { title: "Include agenda and prep", instruction: "List what will be discussed and what the attendee should bring or review.", expectedOutcome: "Meeting is productive." },
      { title: "Provide reschedule path", instruction: "Include concise instructions for rescheduling without encouraging unnecessary changes.", expectedOutcome: "Changes are handled cleanly." },
      { title: "Record confirmation", instruction: "Record confirmation in related client, lead, or task history.", expectedOutcome: "Portal shows confirmation status." }
    ],
    approvalPoints: ["Stephen approval needed for sensitive client meetings, high-value lead meetings, and reschedule language that affects expectations."],
    escalationConditions: ["Attendee disputes time", "Link missing close to meeting", "Calendar conflict", "Client complaint context"],
    documentationRequirements: ["Confirmation message", "Portal record update", "Task comment if preparation is needed"],
    completionCriteria: ["Date/time/timezone clear", "Duration included", "Attendees correct", "Link included", "Agenda included", "Prep and reschedule instructions included"],
    examples: {
      good: "Confirming our 30-minute call on July 23 at 2:00 PM America/Chicago via the Meet link below. Agenda: current workflow, bottlenecks, and next best step. If you need to reschedule, please reply with two alternate windows.",
      bad: "See you Thursday. This omits time, timezone, link, agenda, and reschedule path."
    },
    relatedPortalRoutes: [r("Calendar", "/calendar"), r("Communications", "/communications")],
    relatedTemplates: ["Meeting confirmation template"],
    relatedSOPKeys: ["sop_31_schedule-a-meeting", "sop_36_reschedule-a-meeting"],
    commonMistakes: ["No timezone", "No link", "No agenda", "Confirmation not recorded", "Wrong attendee"],
    qualityChecklist: ["Date correct", "Time correct", "Timezone named", "Link works", "Agenda clear", "Record updated"],
    founderReviewQuestions: ["Should confirmations be sent 24 hours before all external meetings?", "What wording should be used for rescheduling?"]
  }),
  sop(33, "Prepare a meeting brief", "MeetingsExecutiveSupport", {
    purpose: "Give Stephen concise pre-meeting context, open questions, risks, and recommended talking points without burying him in raw notes.",
    estimatedMinutes: 25,
    useWhen: ["Stephen has a client, lead, partner, or internal decision meeting", "A meeting has enough context to require preparation"],
    doNotUseWhen: ["Meeting is purely routine and Stephen says no brief is needed", "The brief would include sensitive information Alex is not authorized to access"],
    prerequisites: ["Meeting event", "Related client or lead", "Recent communications", "Open tasks and approvals"],
    requiredInputs: ["Company/person", "Relationship", "Purpose", "Opportunity", "Current status", "Prior conversations", "Open questions", "Risks", "Desired outcome", "Talking points", "Links", "Decisions"],
    steps: [
      { title: "Gather context", instruction: "Review related client or lead, meeting purpose, prior conversations, open tasks, approvals, files, and recent notes.", expectedOutcome: "Brief is sourced from Portal." },
      { title: "Summarize relationship and objective", instruction: "State who is attending, relationship to Ghost, why the meeting exists, and desired outcome.", expectedOutcome: "Stephen knows the point fast." },
      { title: "List open questions and risks", instruction: "Name unresolved decisions, blockers, client concerns, pricing issues, timeline risk, and sensitive topics.", expectedOutcome: "Stephen is not surprised." },
      { title: "Recommend talking points", instruction: "Provide concise talking points and decisions Stephen may need to make, clearly labeling recommendations.", expectedOutcome: "Brief supports decision-making." },
      { title: "Link records", instruction: "Include links or references to client, lead, draft, approval, task, and files needed during the meeting.", expectedOutcome: "Stephen can drill down when needed." }
    ],
    approvalPoints: ["Stephen controls final meeting strategy, pricing, commitments, and sensitive talking points."],
    escalationConditions: ["Brief reveals complaint, deadline miss, pricing pressure, legal/security issue, or missing critical information close to meeting time"],
    documentationRequirements: ["Meeting brief task or note", "Related links", "Questions for Stephen"],
    completionCriteria: ["Attendees and purpose clear", "Context summarized", "Open questions listed", "Risks named", "Talking points recommended", "Links included"],
    examples: {
      good: "Brief: Atlas discovery, interested in automation for lead follow-up. Open question: budget range unknown. Risk: asked for pricing. Recommend Stephen ask about current manual process before discussing package.",
      bad: "Meeting with Atlas about automation. This lacks status, risks, questions, and desired outcome."
    },
    relatedPortalRoutes: [r("Calendar", "/calendar"), r("Leads", "/leads"), r("Clients", "/clients"), r("Tasks", "/tasks")],
    relatedTemplates: ["Meeting brief"],
    relatedSOPKeys: ["sop_34_record-meeting-notes", "sop_35_track-action-items"],
    commonMistakes: ["Too much raw transcript", "No desired outcome", "No risks", "No links", "Mixing assumptions with facts"],
    qualityChecklist: ["Company/person", "Purpose", "Status", "Prior context", "Open questions", "Risks", "Talking points", "Links"],
    founderReviewQuestions: ["What maximum length should Stephen's meeting briefs be?", "Should briefs include Alex's recommendation by default?"]
  }),
  sop(34, "Record meeting notes", "MeetingsExecutiveSupport", {
    purpose: "Turn meetings into structured operational records with decisions, commitments, owners, and next actions.",
    estimatedMinutes: 20,
    useWhen: ["After a client, lead, internal, or Stephen-directed meeting", "When meeting decisions create tasks or follow-ups"],
    doNotUseWhen: ["The meeting contains confidential content Alex is not allowed to record", "A transcript is required and a summary would be insufficient"],
    prerequisites: ["Meeting date", "Attendees", "Purpose", "Notes or recording if authorized"],
    requiredInputs: ["Date", "Attendees", "Purpose", "Key discussion", "Decisions", "Commitments", "Questions", "Action items", "Owners", "Deadlines", "Next meeting", "Confidentiality"],
    steps: [
      { title: "Capture meeting metadata", instruction: "Record date, attendees, purpose, related client/lead/project, and whether notes are summary or transcript.", expectedOutcome: "Notes have context." },
      { title: "Summarize key discussion", instruction: "Write factual bullets for major topics without personal assumptions or emotional interpretation.", expectedOutcome: "Summary is professional." },
      { title: "Separate decisions and questions", instruction: "List decisions made, open questions, and items needing Stephen or client follow-up.", expectedOutcome: "Unresolved items are visible." },
      { title: "Convert commitments to actions", instruction: "Create tasks with owner, due date, dependency, approval need, and completion evidence.", expectedOutcome: "Meeting commitments become work." },
      { title: "Record confidentiality limits", instruction: "Do not include private, sensitive, or unnecessary details. Mark restricted notes for Stephen when needed.", expectedOutcome: "Notes are safe to store." }
    ],
    approvalPoints: ["Stephen approval needed before sharing notes externally or recording sensitive legal, payment, or security statements."],
    escalationConditions: ["Meeting reveals complaint, legal threat, security concern, payment issue, or major scope change"],
    documentationRequirements: ["Meeting note", "Tasks for action items", "Client or lead update", "Approval request if needed"],
    completionCriteria: ["Metadata captured", "Discussion summarized", "Decisions listed", "Questions listed", "Action items created", "Confidentiality checked"],
    examples: {
      good: "Decision: client prefers booking CTA. Action: Alex update homepage task by July 22. Question: Stephen to confirm whether automation setup is included before client update.",
      bad: "Good meeting, they liked it. This records sentiment but no decisions or actions."
    },
    relatedPortalRoutes: [r("Calendar", "/calendar"), r("Tasks", "/tasks"), r("Clients", "/clients"), r("Leads", "/leads")],
    relatedTemplates: ["Meeting notes", "Action item conversion"],
    relatedSOPKeys: ["sop_35_track-action-items", "sop_33_prepare-a-meeting-brief"],
    commonMistakes: ["No action owners", "No deadlines", "Assumptions written as facts", "Forgetting open questions", "Over-sharing sensitive detail"],
    qualityChecklist: ["Date", "Attendees", "Purpose", "Decisions", "Questions", "Actions", "Owners", "Deadlines", "Confidentiality"],
    founderReviewQuestions: ["Should all external meetings use the same note format?", "When should notes be shared with clients?"]
  }),
  sop(35, "Track action items", "MeetingsExecutiveSupport", {
    purpose: "Convert commitments from meetings, client messages, and Stephen decisions into trackable work with owners, dates, and completion evidence.",
    estimatedMinutes: 12,
    useWhen: ["A commitment is made", "Meeting notes contain action items", "Client or lead communication creates follow-up work"],
    doNotUseWhen: ["The item is only a reference note with no action", "Owner or authority is unclear and needs Stephen first"],
    prerequisites: ["Source note or communication", "Owner", "Due date or timing", "Related record"],
    requiredInputs: ["Commitment", "Owner", "Due date", "Related record", "Dependencies", "Approval requirements", "Completion evidence"],
    steps: [
      { title: "Identify real actions", instruction: "Separate tasks from observations. Action items must have a verb, owner, and outcome.", expectedOutcome: "Only actionable work enters tasks." },
      { title: "Create or update task", instruction: "Add title, description, owner, due date, related client/lead/project, priority, and approval requirement.", expectedOutcome: "Commitment is trackable." },
      { title: "Add dependencies", instruction: "Name client input, Stephen approval, files, meeting notes, or other prerequisites.", expectedOutcome: "Blockers are visible before deadline." },
      { title: "Define completion evidence", instruction: "State what record, message, file, or approval will prove the item is complete.", expectedOutcome: "Completed status has criteria." },
      { title: "Follow up", instruction: "Review open action items during start-of-shift and closeout until complete or intentionally closed.", expectedOutcome: "Commitments do not drift." }
    ],
    approvalPoints: ["Stephen approves owner changes, priority changes on client-facing items, and action items involving pricing, scope, or sensitive content."],
    escalationConditions: ["No clear owner", "Due date at risk", "Action requires authority Alex does not have", "Commitment conflicts with existing work"],
    documentationRequirements: ["Task", "Source note link", "Completion criteria", "Status updates"],
    completionCriteria: ["Action item has owner, due date, related record, dependencies, approval requirements, and completion evidence"],
    examples: {
      good: "Task: Prepare Atlas meeting recap. Owner Alex. Due July 21. Related lead Atlas. Completion evidence: recap draft submitted for Stephen approval.",
      bad: "Remember Atlas. No owner, due date, action, or evidence."
    },
    relatedPortalRoutes: [r("Tasks", "/tasks"), r("Calendar", "/calendar"), r("Clients", "/clients"), r("Leads", "/leads")],
    relatedTemplates: ["Action item task", "Completion evidence note"],
    relatedSOPKeys: ["sop_34_record-meeting-notes", "sop_4_update-a-task"],
    commonMistakes: ["Action without owner", "No due date", "No completion criteria", "Duplicate tasks", "Not linking source"],
    qualityChecklist: ["Verb action", "Owner", "Due date", "Related record", "Dependencies", "Approval", "Evidence"],
    founderReviewQuestions: ["Should meeting action items be auto-created from notes?", "What default priority should action items receive?"]
  }),
  sop(36, "Reschedule a meeting", "MeetingsExecutiveSupport", {
    purpose: "Handle meeting changes promptly and professionally while preserving agenda, links, attendees, and Portal context.",
    estimatedMinutes: 12,
    useWhen: ["Stephen, client, lead, or attendee needs a new time", "Calendar conflict appears", "Meeting prerequisites are not ready"],
    doNotUseWhen: ["Meeting should be cancelled rather than rescheduled", "Reschedule reason is a complaint or escalation requiring Stephen first"],
    prerequisites: ["Authority to reschedule", "Original event", "Alternative availability", "Attendee contact"],
    requiredInputs: ["Reason", "Original time", "Alternatives", "Timezone", "Attendees", "Agenda", "Calendar event", "Related record"],
    steps: [
      { title: "Confirm need and authority", instruction: "Verify the meeting must move and Alex has permission to propose or make the change.", expectedOutcome: "Reschedule is legitimate." },
      { title: "Notify promptly", instruction: "Send concise notice with apology where appropriate, avoiding excessive personal detail.", expectedOutcome: "Attendees have time to adjust." },
      { title: "Offer alternatives", instruction: "Provide clear date/time/timezone options or ask for two windows when needed.", expectedOutcome: "Reschedule path is simple." },
      { title: "Update calendar", instruction: "Change event time, preserve agenda, attendees, Meet link if valid, description, and reminders.", expectedOutcome: "Calendar stays accurate." },
      { title: "Update Portal", instruction: "Record reschedule in related client, lead, or task and note any changed preparation deadlines.", expectedOutcome: "Operational records match calendar." }
    ],
    approvalPoints: ["Stephen approval is required for rescheduling important client, lead, complaint, or executive meetings."],
    escalationConditions: ["Repeated reschedules", "Client unhappy", "Deadline depends on meeting", "Calendar conflict cannot be resolved"],
    documentationRequirements: ["Updated calendar event", "Confirmation message", "Portal record update"],
    completionCriteria: ["Need confirmed", "Notice sent", "Alternatives provided", "Calendar updated", "Portal updated"],
    examples: {
      good: "Alex confirms Stephen conflict, offers two CT options, updates event and lead record after client chooses, and preserves original agenda.",
      bad: "Alex deletes the event and sends 'Need to move' without alternatives or timezone."
    },
    relatedPortalRoutes: [r("Calendar", "/calendar"), r("Communications", "/communications"), r("Tasks", "/tasks")],
    relatedTemplates: ["Reschedule notice", "Alternative time options"],
    relatedSOPKeys: ["sop_31_schedule-a-meeting", "sop_32_confirm-a-meeting"],
    commonMistakes: ["No timezone", "Deleting instead of updating", "No alternatives", "Portal not updated", "Too much explanation"],
    qualityChecklist: ["Authority confirmed", "Notice prompt", "Options clear", "Calendar updated", "Agenda preserved", "Portal updated"],
    founderReviewQuestions: ["What reschedule reasons are acceptable to share externally?", "How many alternatives should Alex offer by default?"]
  }),
  sop(37, "Cancel a meeting professionally", "MeetingsExecutiveSupport", {
    purpose: "Cancel meetings only with authority, clear communication, and a next step so relationships and opportunities are not left dangling.",
    estimatedMinutes: 10,
    useWhen: ["Meeting is no longer needed", "Stephen instructs cancellation", "Attendee cancels and no reschedule is planned"],
    doNotUseWhen: ["Meeting should be rescheduled", "Cancellation could create client complaint, deadline, or sales risk without Stephen review"],
    prerequisites: ["Cancellation authority", "Original event", "Attendees", "Next-step decision"],
    requiredInputs: ["Reason", "Attendees", "Original event", "Next step", "Related client/lead/task"],
    steps: [
      { title: "Confirm authority", instruction: "Verify Stephen or policy authorizes cancellation, especially for client or lead meetings.", expectedOutcome: "Alex does not cancel strategic meetings independently." },
      { title: "Notify promptly", instruction: "Send concise notice with appropriate reason and next step. Avoid unnecessary personal or internal detail.", expectedOutcome: "Attendees are not left guessing." },
      { title: "Offer next step", instruction: "If relationship should continue, offer reschedule path, written follow-up, or future check-in.", expectedOutcome: "Opportunity remains managed." },
      { title: "Cancel calendar event", instruction: "Remove or cancel the event properly so attendees receive update and calendars are clear.", expectedOutcome: "Calendar is accurate." },
      { title: "Update Portal", instruction: "Record cancellation reason, related outcome, and next action on client, lead, or task.", expectedOutcome: "Portal reflects meeting status." }
    ],
    approvalPoints: ["Stephen approval required for cancelling client, lead, complaint, executive, high-value, or deadline-dependent meetings."],
    escalationConditions: ["Client may be upset", "Cancellation affects deadline", "Lead may be lost", "Reason involves internal problem or sensitive issue"],
    documentationRequirements: ["Cancellation message", "Calendar cancellation", "Portal record update", "Next action"],
    completionCriteria: ["Authority confirmed", "Notice sent", "Event cancelled", "Next step provided", "Portal updated"],
    examples: {
      good: "Stephen asks to cancel a low-priority internal review. Alex cancels the event, notes that written update will replace it, and updates task.",
      bad: "Alex cancels a prospect call with no message or follow-up."
    },
    relatedPortalRoutes: [r("Calendar", "/calendar"), r("Leads", "/leads"), r("Clients", "/clients")],
    relatedTemplates: ["Meeting cancellation message"],
    relatedSOPKeys: ["sop_36_reschedule-a-meeting", "sop_31_schedule-a-meeting"],
    commonMistakes: ["No approval", "No next step", "Calendar not updated", "Too much reason detail", "No Portal record"],
    qualityChecklist: ["Authority confirmed", "Attendees notified", "Next step included", "Calendar cancelled", "Portal updated"],
    founderReviewQuestions: ["Which meetings can Alex cancel without asking?", "What cancellation wording is approved for leads?"]
  }),
  sop(38, "Prepare Stephen's daily priority summary", "MeetingsExecutiveSupport", {
    purpose: "Give Stephen a concise decision-oriented view of what needs his attention, what is urgent, and what can wait.",
    estimatedMinutes: 15,
    useWhen: ["Stephen requests a daily priority summary", "Open decisions or blockers are accumulating", "Alex has enough context to recommend prioritization"],
    doNotUseWhen: ["There are no meaningful decisions or blockers and Stephen has not requested a summary", "An urgent issue needs direct escalation first"],
    prerequisites: ["Dashboard review", "Open approvals", "Tasks due", "Client and lead context", "Meetings"],
    requiredInputs: ["Top three decisions", "Urgent client issues", "Sales opportunities", "Meetings", "Tasks due", "Blockers", "Waiting on client", "Recommendations", "Items that can wait"],
    steps: [
      { title: "Collect decision items", instruction: "Review Waiting on Stephen, approvals, due tasks, client risk, lead opportunities, meetings, and blockers.", expectedOutcome: "Summary reflects current Portal state." },
      { title: "Rank top three decisions", instruction: "Choose the three Stephen decisions with highest risk, client impact, deadline, or revenue effect.", expectedOutcome: "Stephen sees what matters first." },
      { title: "Separate sections", instruction: "Use sections for urgent client issues, sales opportunities, meetings, tasks due, blockers, waiting on client, recommendations, and items that can wait.", expectedOutcome: "Summary is scannable." },
      { title: "Write concise recommendations", instruction: "For each key item, include recommended action and deadline without burying Stephen in details.", expectedOutcome: "Summary supports decisions." },
      { title: "Link records", instruction: "Reference related approval, task, client, lead, or meeting records.", expectedOutcome: "Stephen can jump to the source." }
    ],
    approvalPoints: ["Stephen approves final priority choices when Alex is unsure or when priorities conflict."],
    escalationConditions: ["Urgent client issue", "Deadline miss", "Security/legal/payment/public risk", "High-value sales opportunity needing same-day response"],
    documentationRequirements: ["Priority summary", "Linked approval/task records", "Daily report reference if prepared at closeout"],
    completionCriteria: ["Top three decisions named", "Urgent issues separated", "Meetings and due tasks included", "Recommendations concise", "Items that can wait listed"],
    examples: {
      good: "Top decisions: 1 Atlas pricing-safe CTA by noon, 2 Northstar deadline risk if logo not received, 3 approve meeting reschedule. Can wait: content asset folder cleanup.",
      bad: "Lots going on today. This does not help Stephen decide."
    },
    relatedPortalRoutes: [r("Dashboard", "/dashboard"), r("Approvals", "/approvals"), r("Tasks", "/tasks"), r("Calendar", "/calendar")],
    relatedTemplates: ["Daily priority summary"],
    relatedSOPKeys: ["sop_1_start-of-shift-review", "sop_9_organize-assigned-priorities", "sop_39_maintain-waiting-on-stephen"],
    commonMistakes: ["Too long", "No top three", "No recommendation", "No links", "Mixing urgent and can-wait items"],
    qualityChecklist: ["Top three", "Client issues", "Sales opportunities", "Meetings", "Tasks due", "Blockers", "Recommendations", "Can wait"],
    founderReviewQuestions: ["What time should Alex send the daily priority summary?", "Should this replace or supplement the end-of-day report?"]
  }),
  sop(39, "Maintain Waiting on Stephen", "MeetingsExecutiveSupport", {
    purpose: "Keep Stephen's decision queue clean, current, non-duplicative, and focused on real decisions.",
    estimatedMinutes: 12,
    useWhen: ["Reviewing open approvals", "Preparing daily priority summary", "A request becomes stale or resolved"],
    doNotUseWhen: ["The item is a routine task update with no decision", "An urgent issue requires direct escalation first"],
    prerequisites: ["Open Waiting on Stephen list", "Related records", "Current status"],
    requiredInputs: ["Open requests", "Duplicates", "Stale context", "Deadlines", "Related records", "Resolved items"],
    steps: [
      { title: "Review open requests", instruction: "Scan every open Waiting on Stephen item for current need, priority, deadline, and related record.", expectedOutcome: "Queue reflects live decisions." },
      { title: "Remove duplicates", instruction: "If multiple requests ask the same decision, keep the best one and update or close duplicates according to permission.", expectedOutcome: "Stephen is not asked the same thing repeatedly." },
      { title: "Refresh stale context", instruction: "Add new facts, changed deadlines, client responses, or workarounds to the existing request.", expectedOutcome: "Stephen does not decide from old information." },
      { title: "Close resolved requests", instruction: "When Stephen answers or the issue no longer exists, record outcome and close the request.", expectedOutcome: "Queue stays clean." },
      { title: "Follow up appropriately", instruction: "Send concise reminder only when the deadline or impact justifies it. Do not mark every minor question urgent.", expectedOutcome: "Stephen's attention is respected." }
    ],
    approvalPoints: ["Stephen controls decision outcome; Alex may update context but not answer on his behalf."],
    escalationConditions: ["Decision deadline is near", "Client deadline depends on answer", "Request involves pricing, complaint, legal, security, or public risk"],
    documentationRequirements: ["Updated approval request", "Task comment for resolved decision", "Priority summary mention if important"],
    completionCriteria: ["Open requests reviewed", "Duplicates handled", "Stale context updated", "Resolved requests closed", "Urgency applied sparingly"],
    examples: {
      good: "Alex updates the Atlas pricing request with new client deadline and closes an older duplicate draft question.",
      bad: "Alex creates three urgent requests for the same small wording question."
    },
    relatedPortalRoutes: [r("Approvals", "/approvals"), r("Tasks", "/tasks"), r("Dashboard", "/dashboard")],
    relatedTemplates: ["Decision queue cleanup", "Reminder note"],
    relatedSOPKeys: ["sop_40_follow-up-on-an-unanswered-decision", "sop_38_prepare-stephens-daily-priority-summary"],
    commonMistakes: ["Duplicates", "Urgent overuse", "Old context", "No related record", "Closing without outcome"],
    qualityChecklist: ["Queue reviewed", "Duplicates checked", "Deadlines current", "Context current", "Resolved closed", "Reminders justified"],
    founderReviewQuestions: ["Can Alex close resolved Waiting on Stephen items?", "What reminder cadence should be used?"]
  }),
  sop(40, "Follow up on an unanswered decision", "MeetingsExecutiveSupport", {
    purpose: "Remind Stephen or another decision owner only when needed, with concise context and updated impact.",
    estimatedMinutes: 8,
    useWhen: ["Decision deadline is near or passed", "Work is blocked by unanswered request", "Impact has changed since original request"],
    doNotUseWhen: ["The request is low impact and still within expected response time", "Direct urgent escalation is required"],
    prerequisites: ["Original request", "Deadline", "Current impact", "Alternate work options"],
    requiredInputs: ["Original deadline", "Existing answer check", "Impact", "Updated request", "Reminder", "Escalation need"],
    steps: [
      { title: "Check original deadline", instruction: "Review the request deadline, created date, priority, and related work before following up.", expectedOutcome: "Reminder is timing-aware." },
      { title: "Confirm no answer exists", instruction: "Check comments, related task, client/lead notes, and notifications for an answer before reminding.", expectedOutcome: "Alex does not ask twice after an answer exists." },
      { title: "Assess impact", instruction: "State what is blocked, what deadline is affected, and whether alternate work can continue.", expectedOutcome: "Reminder is justified." },
      { title: "Send concise reminder", instruction: "Update the request or send approved reminder with decision needed, impact, and deadline in a few lines.", expectedOutcome: "Stephen can answer quickly." },
      { title: "Escalate only when necessary", instruction: "Use urgent channel only for real deadline, client, legal, security, payment, or public risk.", expectedOutcome: "Escalation remains meaningful." }
    ],
    approvalPoints: ["Stephen decides the original issue; Alex only follows up and clarifies impact."],
    escalationConditions: ["Deadline today", "Client waiting", "Sales opportunity at risk", "Security/legal/payment/public issue"],
    documentationRequirements: ["Updated approval request", "Task status or comment", "Daily report blocker if unresolved"],
    completionCriteria: ["Deadline checked", "No existing answer found", "Impact stated", "Reminder concise", "Alternate work continued where possible"],
    examples: {
      good: "Reminder: Atlas pricing-safe CTA blocks follow-up due tomorrow noon CT. Recommendation remains to avoid numbers and invite discovery call.",
      bad: "Any update??? This lacks context and creates pressure without useful information."
    },
    relatedPortalRoutes: [r("Approvals", "/approvals"), r("Tasks", "/tasks")],
    relatedTemplates: ["Decision reminder"],
    relatedSOPKeys: ["sop_39_maintain-waiting-on-stephen", "sop_6_request-stephens-approval"],
    commonMistakes: ["Not checking for answer", "Too much urgency", "No impact", "No deadline", "Stopping all work unnecessarily"],
    qualityChecklist: ["Deadline checked", "Answer checked", "Impact updated", "Reminder brief", "Escalation justified"],
    founderReviewQuestions: ["How soon before a deadline should Alex follow up?", "Which decisions justify direct reminders?"]
  }),
  sop(41, "Prepare a social-post draft", "ContentMarketingSupport", {
    purpose: "Draft social content that matches objective, platform, brand voice, factual boundaries, and approval requirements.",
    estimatedMinutes: 25,
    useWhen: ["Stephen assigns social content", "Approved campaign or content calendar requires a post draft", "Long-form content needs a social adaptation"],
    doNotUseWhen: ["No objective or audience is known", "Post would include unverified claims, client endorsement, legal/security topic, or public response risk without approval"],
    prerequisites: ["Objective", "Audience", "Platform", "Topic", "Brand voice", "Asset requirements"],
    requiredInputs: ["Objective", "Audience", "Platform", "Topic", "Hook", "Body", "CTA", "Hashtags", "Assets", "Facts", "Approval"],
    steps: [
      { title: "Define objective and audience", instruction: "Clarify whether the post should educate, announce, nurture, recruit, sell, or build trust, and who it is for.", expectedOutcome: "Draft has a strategic purpose." },
      { title: "Match platform format", instruction: "Adjust hook, length, structure, hashtags, and asset needs for the platform.", expectedOutcome: "Draft feels native to channel." },
      { title: "Write brand-safe copy", instruction: "Use Ghost's clear, practical, AI-forward voice. Avoid inflated claims, client endorsements, or invented results.", expectedOutcome: "Copy is credible." },
      { title: "Verify facts and assets", instruction: "Check names, service descriptions, links, screenshots, logos, and claims before submission.", expectedOutcome: "Draft avoids public mistakes." },
      { title: "Submit for approval", instruction: "Package copy, assets, platform, objective, CTA, and risks for Stephen review.", expectedOutcome: "Nothing public is posted without approval." }
    ],
    approvalPoints: ["Stephen approves public posts, claims, client references, pricing, service promises, and sensitive topics."],
    escalationConditions: ["Client endorsement", "Public complaint context", "Legal/security claim", "Sensitive screenshot", "Unverified result"],
    documentationRequirements: ["Content draft", "Approval request", "Asset links", "Calendar entry"],
    completionCriteria: ["Objective clear", "Platform fit", "CTA included", "Facts verified", "Assets listed", "Approval submitted"],
    examples: {
      good: "A LinkedIn draft explains how AI assistants reduce manual follow-up, invites a discovery conversation, and avoids claiming guaranteed revenue.",
      bad: "A post says Ghost guarantees 10x growth and names a client without permission."
    },
    relatedPortalRoutes: [r("Tasks", "/tasks"), r("Communications", "/communications"), r("Approvals", "/approvals")],
    relatedTemplates: ["Social post draft", "Content approval request"],
    relatedSOPKeys: ["sop_45_review-content-for-brand-consistency", "sop_46_submit-content-for-approval"],
    commonMistakes: ["No objective", "Wrong platform length", "Unverified claims", "Missing CTA", "No approval"],
    qualityChecklist: ["Objective", "Audience", "Platform", "Hook", "Body", "CTA", "Assets", "Facts", "Approval"],
    founderReviewQuestions: ["Which social platforms are active for Ghost now?", "Are any hashtags or phrases approved by default?"]
  }),
  sop(42, "Schedule approved content", "ContentMarketingSupport", {
    purpose: "Schedule only final approved content with correct platform, time, asset, link, and recordkeeping.",
    estimatedMinutes: 15,
    useWhen: ["Content is approved and ready to publish later", "Content calendar assigns a publish date"],
    doNotUseWhen: ["Approval is missing, expired, unclear, or content changed after approval", "Platform credentials or publishing authority are not assigned"],
    prerequisites: ["Final approval", "Platform access", "Final copy", "Final asset", "Publish date/time/timezone"],
    requiredInputs: ["Approval", "Platform", "Date/time", "Timezone", "Copy", "Asset", "Link", "Tags", "Preview", "Schedule status"],
    steps: [
      { title: "Verify final approval", instruction: "Confirm content, asset, platform, date, and CTA match the approved version.", expectedOutcome: "Scheduling uses approved content only." },
      { title: "Confirm publishing details", instruction: "Check platform, date/time/timezone, copy, asset, link, tags, and audience settings.", expectedOutcome: "Post is scheduled correctly." },
      { title: "Preview before scheduling", instruction: "Use platform preview to check cropping, links, spelling, hashtags, accessibility text, and mobile appearance.", expectedOutcome: "Visible issues are caught." },
      { title: "Schedule and record", instruction: "Schedule the post and record platform, scheduled time, approval link, and status in Portal or content calendar.", expectedOutcome: "Publication is trackable." },
      { title: "Verify after publication", instruction: "After scheduled time, confirm the post published correctly and record URL.", expectedOutcome: "Publishing loop closes." }
    ],
    approvalPoints: ["Stephen approval required for any content change after approval, platform change, publish-time change, or public claim."],
    escalationConditions: ["Approval missing", "Link broken", "Asset wrong", "Sensitive content", "Platform error", "Scheduled time missed"],
    documentationRequirements: ["Content calendar", "Approval reference", "Scheduled status", "Published URL"],
    completionCriteria: ["Approval verified", "Details correct", "Preview checked", "Content scheduled", "Status recorded", "Publication verified"],
    examples: {
      good: "Alex schedules approved LinkedIn post for July 24 10:00 AM CT, verifies CTA link, records approval and scheduled status, then adds URL after publish.",
      bad: "Alex edits the approved copy in the scheduler and posts immediately without recording it."
    },
    relatedPortalRoutes: [r("Tasks", "/tasks"), r("Approvals", "/approvals")],
    relatedTemplates: ["Scheduling checklist", "Published content record"],
    relatedSOPKeys: ["sop_46_submit-content-for-approval", "sop_47_record-published-content"],
    commonMistakes: ["Scheduling changed copy", "Wrong timezone", "Broken link", "No publication verification", "No record"],
    qualityChecklist: ["Approval final", "Platform correct", "Time/timezone correct", "Copy matches", "Asset matches", "Preview checked", "Recorded"],
    founderReviewQuestions: ["Which tools should Alex use to schedule content?", "Should content be verified immediately after publish?"]
  }),
  sop(43, "Organize content assets", "ContentMarketingSupport", {
    purpose: "Keep creative files findable, versioned, licensed, and separated by client, campaign, source, and export state.",
    estimatedMinutes: 20,
    useWhen: ["New content assets are created or received", "Campaign folder is messy", "Approved content needs source and export files stored"],
    doNotUseWhen: ["Asset contains sensitive client data needing Stephen direction", "Storage location or permissions are unclear"],
    prerequisites: ["Approved folder structure", "File access", "Naming convention", "License/source information"],
    requiredInputs: ["Folder", "Client/campaign", "Source files", "Export files", "Naming", "Dates/version", "Logo usage", "Rights/licensing", "Archive"],
    steps: [
      { title: "Choose correct folder", instruction: "Place assets under the approved client, campaign, or internal content folder. Do not mix source and export files.", expectedOutcome: "Files are findable." },
      { title: "Apply naming convention", instruction: "Use clear date, campaign, asset type, platform, and version in filenames.", expectedOutcome: "Versions are understandable." },
      { title: "Separate source and exports", instruction: "Keep editable Canva/CapCut/source files separate from published/exported versions.", expectedOutcome: "Future edits are possible." },
      { title: "Record rights and usage", instruction: "Note logo usage, stock rights, client permission, and licensing concerns where relevant.", expectedOutcome: "Public use is safer." },
      { title: "Archive old versions", instruction: "Move outdated files to archive instead of deleting unless Stephen approves deletion.", expectedOutcome: "History is preserved." }
    ],
    approvalPoints: ["Stephen approves deletion, public logo use, client assets, licensed media concerns, and external sharing."],
    escalationConditions: ["Missing rights", "Sensitive asset", "Client logo unclear", "Duplicate conflicting versions", "Public asset used without approval"],
    documentationRequirements: ["Folder update", "Asset note", "Task comment", "Approval if needed"],
    completionCriteria: ["Folder correct", "Naming applied", "Sources separated", "Exports stored", "Rights noted", "Old versions archived"],
    examples: {
      good: "Canva source stored in Campaign/Source, PNG export stored in Campaign/Exports with date and platform, approval note linked.",
      bad: "Final-final-new.png in Downloads with no source file or approval reference."
    },
    relatedPortalRoutes: [r("Files", "/files"), r("Tasks", "/tasks"), r("Approvals", "/approvals")],
    relatedTemplates: ["Asset naming convention", "Folder checklist"],
    relatedSOPKeys: ["sop_48_identify-missing-content-assets", "sop_47_record-published-content"],
    commonMistakes: ["Everything in one folder", "No version", "Deleting old source", "No licensing note", "Wrong client folder"],
    qualityChecklist: ["Folder correct", "Name clear", "Source stored", "Export stored", "Rights checked", "Approval linked", "Archive used"],
    founderReviewQuestions: ["What exact folder structure should be official?", "Which asset types require rights notes?"]
  }),
  sop(44, "Repurpose long-form content", "ContentMarketingSupport", {
    purpose: "Turn approved long-form content into platform-specific pieces while preserving meaning, claims, context, and CTA.",
    estimatedMinutes: 30,
    useWhen: ["A blog, video, newsletter, guide, or transcript should become shorter content", "Stephen assigns content repurposing"],
    doNotUseWhen: ["Source content is not approved", "Repurposing would change meaning or quote someone inaccurately"],
    prerequisites: ["Approved source", "Target platforms", "CTA", "Claim verification"],
    requiredInputs: ["Source", "Themes", "Formats", "Quotes", "CTA", "Approval", "Derivatives linked"],
    steps: [
      { title: "Review source", instruction: "Read the full source and identify approved message, claims, examples, and CTA.", expectedOutcome: "Repurposed content starts from context." },
      { title: "Extract themes", instruction: "Pull useful themes, lessons, frameworks, or quotes without distorting meaning.", expectedOutcome: "Derivatives preserve intent." },
      { title: "Adapt by platform", instruction: "Create platform-specific formats such as LinkedIn post, short caption, carousel outline, email blurb, or video script.", expectedOutcome: "Content fits each channel." },
      { title: "Verify quotes and claims", instruction: "Check any quote, statistic, client reference, or result before including it.", expectedOutcome: "Public content remains accurate." },
      { title: "Submit linked derivatives", instruction: "Link each derivative to source content and submit for approval before scheduling or publishing.", expectedOutcome: "Approval trail is clear." }
    ],
    approvalPoints: ["Stephen approves all public derivatives, especially quotes, claims, client examples, and CTAs."],
    escalationConditions: ["Source is unclear", "Quote may be misleading", "Client reference", "Legal/security claim", "Unapproved result"],
    documentationRequirements: ["Derivative drafts", "Source link", "Approval request", "Content calendar"],
    completionCriteria: ["Source preserved", "Themes extracted", "Platform formats created", "Claims verified", "Derivatives linked", "Approval requested"],
    examples: {
      good: "Alex turns a service guide into three LinkedIn educational posts, each linked to source and with no invented client results.",
      bad: "Alex cuts one sentence into a quote that changes Stephen's meaning."
    },
    relatedPortalRoutes: [r("Tasks", "/tasks"), r("Approvals", "/approvals")],
    relatedTemplates: ["Repurposing worksheet", "Platform adaptation checklist"],
    relatedSOPKeys: ["sop_41_prepare-a-social-post-draft", "sop_45_review-content-for-brand-consistency"],
    commonMistakes: ["Changing meaning", "No source link", "Misquoting", "Same format on every platform", "Publishing without approval"],
    qualityChecklist: ["Source approved", "Meaning preserved", "Platform fit", "Quotes verified", "CTA maintained", "Approval submitted"],
    founderReviewQuestions: ["Which source types are approved for repurposing?", "Should derivatives have a required source backlink?"]
  }),
  sop(45, "Review content for brand consistency", "ContentMarketingSupport", {
    purpose: "Check content against Ghost's voice, visual standards, factual boundaries, confidentiality, and accessibility before approval or publication.",
    estimatedMinutes: 15,
    useWhen: ["Reviewing a draft, asset, scheduled post, client update, or marketing item", "Before submitting content for approval"],
    doNotUseWhen: ["Content has not been drafted enough to review", "The content is a public-risk issue requiring escalation first"],
    prerequisites: ["Draft content", "Brand voice guide", "Visual asset", "Known platform"],
    requiredInputs: ["Tone", "Spelling", "Logo", "Brand colors", "Typography", "Claims", "CTA", "Contact information", "Service terminology", "Confidentiality", "Platform dimensions", "Accessibility"],
    steps: [
      { title: "Review words", instruction: "Check tone, spelling, service terminology, CTA, claims, uncertainty language, and contact details.", expectedOutcome: "Copy sounds like Ghost and avoids risky claims." },
      { title: "Review visuals", instruction: "Check logo, brand colors, typography, cropping, platform dimensions, readability, and asset quality.", expectedOutcome: "Visuals are professional." },
      { title: "Check confidentiality", instruction: "Remove client names, screenshots, private data, or internal strategy unless explicitly approved.", expectedOutcome: "Public content protects data." },
      { title: "Check accessibility", instruction: "Look for readable contrast, alt-text need, caption need, and overly small text.", expectedOutcome: "Content is easier to consume." },
      { title: "Document findings", instruction: "Submit changes, approval request, or task comment with exact items fixed or needing Stephen.", expectedOutcome: "Review produces action." }
    ],
    approvalPoints: ["Stephen approves public claims, client references, service promises, brand changes, and final publication."],
    escalationConditions: ["Unverified claim", "Client confidential data", "Legal/security topic", "Public complaint", "Brand asset misuse"],
    documentationRequirements: ["Review checklist", "Approval request", "Task comment", "Updated asset link"],
    completionCriteria: ["Tone, spelling, visuals, claims, CTA, confidentiality, dimensions, and accessibility checked"],
    examples: {
      good: "Alex flags a post for unapproved 'guaranteed leads' claim, fixes CTA clarity, and submits revised copy for Stephen.",
      bad: "Alex checks only spelling and misses a client screenshot in the image."
    },
    relatedPortalRoutes: [r("Tasks", "/tasks"), r("Approvals", "/approvals"), r("Files", "/files")],
    relatedTemplates: ["Brand consistency checklist"],
    relatedSOPKeys: ["sop_41_prepare-a-social-post-draft", "sop_46_submit-content-for-approval"],
    commonMistakes: ["Only proofreading", "Ignoring visuals", "Missing confidentiality", "Approving own public claims", "No accessibility check"],
    qualityChecklist: ["Tone", "Spelling", "Logo", "Colors", "Claims", "CTA", "Confidentiality", "Dimensions", "Accessibility"],
    founderReviewQuestions: ["What words or phrases should be banned?", "What visual brand guide should Alex follow?"]
  }),
  sop(46, "Submit content for approval", "ContentMarketingSupport", {
    purpose: "Package final content, assets, context, risks, and requested decision so Stephen can approve public work efficiently.",
    estimatedMinutes: 12,
    useWhen: ["Content is ready for Founder review", "Public copy, asset, schedule, or campaign decision is needed"],
    doNotUseWhen: ["Draft is incomplete", "Content contains unresolved facts or missing assets"],
    prerequisites: ["Final copy", "Final asset", "Platform", "Publish date", "Objective", "Audience", "CTA", "Source files"],
    requiredInputs: ["Final copy", "Final asset", "Platform", "Publish date", "Objective", "Audience", "CTA", "Source files", "Risks", "Requested decision"],
    steps: [
      { title: "Confirm final package", instruction: "Make sure copy, asset, platform, publish date, objective, audience, CTA, source files, and risks are all present.", expectedOutcome: "Stephen reviews a complete package." },
      { title: "Highlight risk", instruction: "Call out claims, client references, pricing, legal/security topics, or uncertain facts.", expectedOutcome: "Approval focuses on real decisions." },
      { title: "Request exact decision", instruction: "Ask whether Stephen approves, wants changes, wants cancellation, or wants a different publish plan.", expectedOutcome: "Decision can be recorded." },
      { title: "Link files", instruction: "Include final asset, editable source, copy doc, and related task or calendar item.", expectedOutcome: "Stephen can inspect all materials." },
      { title: "Track response", instruction: "After approval, move to scheduling; after changes, revise; after rejection, cancel and record reason.", expectedOutcome: "Content lifecycle stays controlled." }
    ],
    approvalPoints: ["Stephen approves all public content unless a specific pre-approved process says otherwise."],
    escalationConditions: ["Missing asset", "Unverified claim", "Client reference", "Legal/security content", "Publish date urgent"],
    documentationRequirements: ["Approval request", "Source file links", "Final copy", "Task status"],
    completionCriteria: ["Copy final", "Asset final", "Platform/date included", "Objective/audience/CTA included", "Risks named", "Decision requested"],
    examples: {
      good: "Request: approve LinkedIn post for July 24. Includes final copy, Canva source, PNG export, CTA link, objective, audience, and note that no client claims are included.",
      bad: "Can this go out? with no platform, asset, date, objective, or risk note."
    },
    relatedPortalRoutes: [r("Approvals", "/approvals"), r("Tasks", "/tasks"), r("Files", "/files")],
    relatedTemplates: ["Content approval request"],
    relatedSOPKeys: ["sop_42_schedule-approved-content", "sop_45_review-content-for-brand-consistency"],
    commonMistakes: ["Missing final asset", "No requested decision", "No source links", "Risks hidden", "Changing after approval"],
    qualityChecklist: ["Final copy", "Final asset", "Platform", "Date", "Objective", "Audience", "CTA", "Risks", "Decision"],
    founderReviewQuestions: ["Which content can be batched for approval?", "Should approvals expire if content is not published by date?"]
  }),
  sop(47, "Record published content", "ContentMarketingSupport", {
    purpose: "Create a permanent record of what was published, when, where, from which approved version, and where future performance should be reviewed.",
    estimatedMinutes: 10,
    useWhen: ["Approved content is published", "Scheduled content goes live", "A campaign needs publication tracking"],
    doNotUseWhen: ["Content was not actually published", "Publication failed and needs issue reporting"],
    prerequisites: ["Published URL", "Approval reference", "Final copy/asset", "Campaign or task"],
    requiredInputs: ["Platform", "URL", "Published time", "Copy version", "Asset", "Campaign", "Approval", "Initial status", "Performance location"],
    steps: [
      { title: "Confirm publication", instruction: "Open the public post or platform record and verify it is live as intended.", expectedOutcome: "Only real publications are recorded." },
      { title: "Record metadata", instruction: "Save platform, URL, published time, copy version, asset, campaign, and approval reference.", expectedOutcome: "Publication can be audited." },
      { title: "Check initial status", instruction: "Look for obvious formatting, link, asset, or visibility problems immediately after publish.", expectedOutcome: "Errors are caught early." },
      { title: "Link performance location", instruction: "Record where later performance metrics should be checked, even if metrics are not reviewed now.", expectedOutcome: "Future reporting has a source." },
      { title: "Close related work", instruction: "Update content task, calendar, and approval status as published or issue-blocked.", expectedOutcome: "Content workflow closes." }
    ],
    approvalPoints: ["Stephen approval required before changing or deleting a published item."],
    escalationConditions: ["Wrong content published", "Broken link", "Sensitive data public", "Negative public response", "Platform error"],
    documentationRequirements: ["Published URL", "Task update", "Content calendar", "Approval reference"],
    completionCriteria: ["Platform, URL, time, copy version, asset, campaign, approval, initial status, and performance location recorded"],
    examples: {
      good: "LinkedIn post URL recorded with approval ID, Canva export version, July 24 10:01 AM CT publish time, and analytics location.",
      bad: "Posted. No URL, asset, approval, or performance source."
    },
    relatedPortalRoutes: [r("Tasks", "/tasks"), r("Files", "/files"), r("Approvals", "/approvals")],
    relatedTemplates: ["Published content record"],
    relatedSOPKeys: ["sop_42_schedule-approved-content", "sop_49_maintain-a-content-calendar"],
    commonMistakes: ["No URL", "No approval link", "No version", "Not checking live post", "No performance source"],
    qualityChecklist: ["Live checked", "URL saved", "Time saved", "Version saved", "Asset linked", "Approval linked", "Task closed"],
    founderReviewQuestions: ["Where should performance metrics live?", "Who may edit published content after posting?"]
  }),
  sop(48, "Identify missing content assets", "ContentMarketingSupport", {
    purpose: "Find missing creative or factual inputs before content work stalls, publishes incorrectly, or uses unapproved substitutes.",
    estimatedMinutes: 12,
    useWhen: ["Preparing content", "Reviewing campaign readiness", "Draft or design is blocked by missing material"],
    doNotUseWhen: ["Missing item is a client decision requiring a client-decision workflow", "Asset need involves sensitive or licensed content Stephen must approve first"],
    prerequisites: ["Content brief", "Asset folder", "Campaign/task", "Brand requirements"],
    requiredInputs: ["Logo files", "Photography", "Video", "Testimonials", "Offers", "CTA link", "Brand guide", "Product details", "Legal disclaimers", "Contact info"],
    steps: [
      { title: "Review required asset list", instruction: "Check logo, photos, video, testimonials, offers, CTA link, brand guide, product details, disclaimers, and contact info.", expectedOutcome: "Missing items are known." },
      { title: "Check existing folders", instruction: "Search approved file locations before requesting or creating replacements.", expectedOutcome: "Ghost does not duplicate work." },
      { title: "Classify missing owner", instruction: "Mark whether Stephen, client, Alex, designer, or another source owns the missing item.", expectedOutcome: "Next action has an owner." },
      { title: "Document impact", instruction: "State what content cannot continue or what quality risk exists until the asset is available.", expectedOutcome: "Missing asset is prioritized correctly." },
      { title: "Request or escalate", instruction: "Create task, client information request, or Waiting on Stephen depending on ownership and risk.", expectedOutcome: "Asset gap has a tracked next step." }
    ],
    approvalPoints: ["Stephen approves substitutes, testimonials, legal disclaimers, public offers, and client-owned assets."],
    escalationConditions: ["Missing legal disclaimer", "No rights to asset", "Client logo unclear", "Deadline blocked", "Testimonial unapproved"],
    documentationRequirements: ["Asset checklist", "Task or client request", "Approval if needed"],
    completionCriteria: ["All asset types checked", "Missing owner assigned", "Impact documented", "Request created", "No unapproved substitute used"],
    examples: {
      good: "CTA link and logo source missing. Owner: client for logo, Stephen for CTA approval. Content task moved to Waiting on Client and Waiting on Stephen split by record.",
      bad: "Alex grabs a logo from Google Images and continues."
    },
    relatedPortalRoutes: [r("Files", "/files"), r("Tasks", "/tasks"), r("Approvals", "/approvals")],
    relatedTemplates: ["Missing asset checklist", "Asset request"],
    relatedSOPKeys: ["sop_43_organize-content-assets", "sop_13_request-missing-information-from-a-client"],
    commonMistakes: ["Using unapproved images", "No owner", "No impact", "Not checking existing folders", "Mixing client and Stephen requests"],
    qualityChecklist: ["Logo", "Photo/video", "Testimonials", "Offer", "CTA", "Brand guide", "Disclaimers", "Owner", "Request"],
    founderReviewQuestions: ["Which asset substitutions are allowed?", "Where should client asset requests be tracked?"]
  }),
  sop(49, "Maintain a content calendar", "ContentMarketingSupport", {
    purpose: "Keep planned, drafted, approved, scheduled, and published content visible by date, platform, owner, status, and link.",
    estimatedMinutes: 20,
    useWhen: ["Planning content", "Reviewing upcoming posts", "Checking approval or asset status", "Closing published items"],
    doNotUseWhen: ["Content strategy has not been approved", "Calendar contains public-risk item requiring escalation first"],
    prerequisites: ["Calendar or tracker", "Content tasks", "Approval statuses", "Asset statuses"],
    requiredInputs: ["Date", "Platform", "Content pillar", "Format", "Owner", "Draft status", "Asset status", "Approval", "Scheduled", "Published", "Link", "Notes"],
    steps: [
      { title: "Review upcoming dates", instruction: "Check planned content by date, platform, and owner for the next relevant window.", expectedOutcome: "Upcoming content is visible." },
      { title: "Update production status", instruction: "Mark draft, asset, approval, scheduled, published, or blocked status accurately.", expectedOutcome: "Calendar reflects real workflow." },
      { title: "Check balance and repetition", instruction: "Look for too much of the same pillar, format, CTA, or platform and flag recommendations.", expectedOutcome: "Content mix stays intentional." },
      { title: "Link records", instruction: "Add task, asset, approval, published URL, and source links where appropriate.", expectedOutcome: "Calendar is actionable." },
      { title: "Escalate gaps", instruction: "Flag missing assets, approvals, risky claims, or deadline conflicts before publication date.", expectedOutcome: "Calendar prevents last-minute surprises." }
    ],
    approvalPoints: ["Stephen approves content strategy, publication priorities, campaign changes, and risky calendar items."],
    escalationConditions: ["Approval missing near publish date", "Asset missing", "Public-risk topic", "Too much repetition", "Broken campaign link"],
    documentationRequirements: ["Content calendar", "Task updates", "Approval status", "Published link"],
    completionCriteria: ["Dates current", "Statuses accurate", "Balance reviewed", "Links added", "Gaps escalated"],
    examples: {
      good: "Alex updates Friday post to Approved, asset ready, scheduled 10 AM CT, links approval and Canva source, and flags next week has too many sales CTAs.",
      bad: "Calendar says 'post' on Friday with no platform, owner, asset, approval, or link."
    },
    relatedPortalRoutes: [r("Tasks", "/tasks"), r("Approvals", "/approvals"), r("Files", "/files")],
    relatedTemplates: ["Content calendar fields", "Weekly content review"],
    relatedSOPKeys: ["sop_42_schedule-approved-content", "sop_47_record-published-content", "sop_48_identify-missing-content-assets"],
    commonMistakes: ["No status", "No owner", "No approval link", "Ignoring repetition", "Published URLs missing"],
    qualityChecklist: ["Date", "Platform", "Pillar", "Format", "Owner", "Draft", "Asset", "Approval", "Scheduled", "Published link"],
    founderReviewQuestions: ["What content pillars are official?", "How far ahead should Alex maintain the calendar?"]
  }),
  sop(50, "Escalate public-comment risk", "ContentMarketingSupport", {
    purpose: "Protect Ghost AI Solutions from impulsive public responses by preserving evidence and routing risky comments to Stephen.",
    estimatedMinutes: 8,
    useWhen: ["Angry client comment", "Legal allegation", "Security claim", "Discrimination or harassment allegation", "Threat", "Viral criticism", "Competitor dispute", "False information", "Media inquiry"],
    doNotUseWhen: ["Comment is harmless routine engagement covered by approved guidance", "Threat creates immediate safety or platform emergency that requires urgent escalation first"],
    prerequisites: ["Public comment link", "Screenshot", "Timestamp", "Platform", "Approved urgent channel"],
    requiredInputs: ["Comment text", "Platform", "URL", "Screenshot", "Time", "Author if visible", "Risk type", "Current visibility", "Requested action"],
    steps: [
      { title: "Do not respond impulsively", instruction: "Do not delete, hide, argue, joke, apologize, admit fault, or promise action unless Stephen instructs it.", expectedOutcome: "Public risk is contained." },
      { title: "Capture evidence", instruction: "Record screenshot, link, platform, time, visible author, exact wording, and whether others are engaging.", expectedOutcome: "Stephen has facts." },
      { title: "Notify Stephen", instruction: "Use urgent channel for high-risk items and create a Portal record with risk type and recommended next step.", expectedOutcome: "Founder controls public response." },
      { title: "Prepare facts only", instruction: "Gather related client, post, campaign, or service facts. Do not speculate about motive or liability.", expectedOutcome: "Response decision is informed." },
      { title: "Act only under direction", instruction: "Draft response, hide, delete, report, or leave comment only after Stephen gives instruction and platform policy is considered.", expectedOutcome: "Public action is approved." }
    ],
    approvalPoints: ["Stephen approval mandatory for all risky public comments, deletes, hides, replies, media responses, and legal/security statements."],
    escalationConditions: ["Angry client", "Legal allegation", "Security claim", "Harassment", "Threat", "Viral criticism", "Competitor dispute", "False information", "Media inquiry"],
    documentationRequirements: ["Evidence record", "Urgent notification", "Portal task or approval", "Outcome record"],
    completionCriteria: ["No impulsive response", "Evidence captured", "Stephen notified", "Facts prepared", "Approved action recorded"],
    examples: {
      good: "Alex screenshots a public billing complaint, records URL/time/platform, alerts Stephen, and waits for approved response.",
      bad: "Alex deletes the comment and replies from the brand account saying the client is wrong."
    },
    relatedPortalRoutes: [r("Approvals", "/approvals"), r("Mission Feedback", "/feedback"), r("Tasks", "/tasks")],
    relatedTemplates: ["Public risk escalation", "Evidence capture checklist"],
    relatedSOPKeys: ["sop_8_escalate-urgent-work", "sop_15_escalate-a-client-complaint"],
    commonMistakes: ["Deleting evidence", "Arguing publicly", "Admitting liability", "No screenshot", "Waiting until daily report"],
    qualityChecklist: ["No response", "Screenshot", "URL", "Time", "Risk type", "Stephen notified", "Outcome recorded"],
    founderReviewQuestions: ["Who besides Stephen may respond publicly?", "Which comments should be hidden immediately under platform rules?"]
  })
];

export const knowledgeArticleDefinitions: KnowledgeArticleDefinition[] = [
  {
    id: "academy_what-is-nova",
    title: "What is Nova?",
    slug: "what-is-nova",
    category: "Ghost Academy",
    summary: "Nova is Ghost AI Solutions' executive intelligence layer for prioritization, summaries, decision support, and orchestration.",
    audience,
    sections: [
      { heading: "Purpose", body: "Nova helps Stephen and the team understand what needs attention, what changed, and what decisions are waiting. Nova is not a legal corporate officer and does not replace Stephen's judgment. Think of Nova as a permission-scoped intelligence layer that can summarize work, surface priorities, and help organize decisions." },
      { heading: "How Ghost Uses Nova", body: "Ghost uses Nova to support executive awareness across tasks, clients, leads, approvals, reports, and Academy progress. Nova should help reduce context switching by turning Portal records into concise summaries and recommended next questions." },
      { heading: "How Alex Interacts With Nova", body: "Alex may use Nova to ask what to work on, summarize assigned work, draft safe internal wording, and identify blockers. Alex must verify names, dates, prices, commitments, and client facts before acting on any AI output." },
      { heading: "Boundaries", body: "Nova cannot authorize pricing, discounts, refunds, contracts, public statements, legal positions, security answers, or client commitments. If Nova suggests something that requires authority, Alex must route it to Stephen." }
    ],
    practicalExamples: ["Ask Nova to summarize open assigned tasks before a shift, then verify the task records.", "Ask Nova to explain why a decision is waiting on Stephen, then open the approval record before acting."],
    roleImpact: ["Helps Alex prepare better summaries", "Helps Stephen review decision queues", "Makes Portal records more useful when they are kept accurate"],
    misconceptions: ["Nova is not Stephen", "Nova is not a legal decision maker", "Nova suggestions do not override permissions", "Nova cannot make unverified facts true"],
    relatedTerms: ["Ghost Portal", "Mission Control", "Waiting on Stephen", "Permission-scoped data"],
    relatedSOPKeys: ["sop_1_start-of-shift-review", "sop_38_prepare-stephens-daily-priority-summary"],
    relatedPortalRoutes: [r("Dashboard", "/dashboard"), r("Waiting on Stephen", "/approvals")],
    founderReviewQuestions: ["Which Nova actions should be enabled for Alex during trial?", "What wording should explain Nova to clients, if any?"]
  },
  {
    id: "academy_what-is-vega",
    title: "What is Vega?",
    slug: "what-is-vega",
    category: "Ghost Academy",
    summary: "Vega is the sales intelligence concept for lead discovery, enrichment, qualification, prioritization, and outreach support.",
    audience,
    sections: [
      { heading: "Purpose", body: "Vega represents Ghost's lead-generation and sales intelligence layer. Its job is to help find, organize, qualify, and prioritize sales opportunities so Stephen can focus on the right conversations." },
      { heading: "Pipeline Support", body: "Vega connects to CRM-style work: lead records, service interest, source, estimated value, follow-up dates, next actions, draft outreach, and qualification signals. Good lead data makes Vega more useful; messy records weaken it." },
      { heading: "Alex's Role", body: "Alex supports Vega by keeping lead records accurate, cleaning incomplete fields, drafting approval-safe follow-ups, recording outcomes, and flagging leads requiring Stephen. Alex should never claim Vega guarantees sales or performs unauthorized scraping." },
      { heading: "Boundaries", body: "Vega can support discovery and prioritization, but it does not guarantee revenue, authorize outreach, approve pricing, or replace human review of lead quality." }
    ],
    practicalExamples: ["Use lead stage and follow-up outcome to decide whether a lead needs nurture.", "Flag an enterprise lead to Stephen before sending routine outreach."],
    roleImpact: ["Improves sales data quality", "Helps Alex write better lead next actions", "Helps Stephen prioritize opportunities"],
    misconceptions: ["Vega does not guarantee sales", "Vega is not permission to scrape anything", "Vega does not approve pricing", "A lead score is not a contract"],
    relatedTerms: ["Lead", "Prospect", "Qualified lead", "Pipeline", "CRM"],
    relatedSOPKeys: ["sop_21_review-an-assigned-lead", "sop_23_draft-a-lead-follow-up", "sop_29_flag-a-lead-requiring-stephen"],
    relatedPortalRoutes: [r("Leads", "/leads"), r("Draft Communications", "/communications")],
    founderReviewQuestions: ["Which enrichment sources are approved?", "What qualifies a lead for Stephen review?"]
  },
  {
    id: "academy_what-is-echo",
    title: "What is Echo?",
    slug: "what-is-echo",
    category: "Ghost Academy",
    summary: "Echo is the marketing department SaaS vision for content creation, campaigns, social media, repurposing, and brand consistency.",
    audience,
    sections: [
      { heading: "Purpose", body: "Echo represents Ghost's marketing and content operating layer. It supports the creation and organization of social posts, ads, blogs, newsletters, videos, campaigns, and repurposed content." },
      { heading: "Human Review", body: "Echo can help draft and organize content, but public claims, client references, pricing, guarantees, and sensitive topics still require human review and Stephen approval. Content quality depends on accurate source material." },
      { heading: "Alex's Role", body: "Alex supports Echo by preparing drafts, organizing assets, checking brand consistency, submitting content for approval, scheduling approved content, and recording published URLs." },
      { heading: "Creation Versus Approval", body: "Creating content means preparing a draft or asset. Approving content means authorizing public use. Alex may help create and organize; Stephen controls approval unless a future policy says otherwise." }
    ],
    practicalExamples: ["Repurpose an approved blog into LinkedIn draft options.", "Check a post for brand voice and submit it with asset links for approval."],
    roleImpact: ["Helps Alex understand content workflow", "Reduces public-brand mistakes", "Creates a reusable calendar and asset trail"],
    misconceptions: ["Echo does not publish risky content by itself", "A good AI draft still needs fact review", "Content approval is different from content creation"],
    relatedTerms: ["Content calendar", "CTA", "Brand voice", "Campaign"],
    relatedSOPKeys: ["sop_41_prepare-a-social-post-draft", "sop_45_review-content-for-brand-consistency", "sop_46_submit-content-for-approval"],
    relatedPortalRoutes: [r("Tasks", "/tasks"), r("Files", "/files"), r("Approvals", "/approvals")],
    founderReviewQuestions: ["Which platforms are active now?", "What claims are approved for Ghost marketing?"]
  },
  {
    id: "academy_what-is-geo",
    title: "What is GEO?",
    slug: "what-is-geo",
    category: "Ghost Academy",
    summary: "GEO covers SEO, AEO, and Generative Engine Optimization: improving visibility in search engines, answer engines, and AI-generated recommendations.",
    audience,
    sections: [
      { heading: "Purpose", body: "GEO is Ghost's visibility concept for modern discovery. It includes traditional SEO, AEO for answer engines, and Generative Engine Optimization for AI-search visibility." },
      { heading: "What Affects Visibility", body: "Technical health, content clarity, entities, citations, freshness, trust signals, structured pages, and consistent business information all affect whether a company is easy to understand and recommend." },
      { heading: "Visibility Score", body: "A Visibility Score is a monitoring concept, not a guarantee. It can help show whether recommendations and fixes are improving signals, but it does not promise a ranking or lead volume." },
      { heading: "Alex's Role", body: "Alex may help organize content, identify missing information, track recommendations, and prepare reports. Technical implementation, guaranteed claims, security-sensitive changes, and client commitments go to Stephen or technical staff." }
    ],
    practicalExamples: ["Notice that a client service page lacks clear CTA and record a content improvement task.", "Flag a technical indexing issue instead of promising a fix."],
    roleImpact: ["Helps Alex understand why details matter", "Supports client content organization", "Keeps visibility promises realistic"],
    misconceptions: ["GEO is not a guaranteed ranking", "AI search visibility cannot be promised", "Operations should not make technical commitments"],
    relatedTerms: ["SEO", "AEO", "Generative Engine Optimization", "Entities", "Citations"],
    relatedSOPKeys: ["sop_14_prepare-a-client-status-update", "sop_45_review-content-for-brand-consistency"],
    relatedPortalRoutes: [r("Clients", "/clients"), r("Tasks", "/tasks")],
    founderReviewQuestions: ["How should Visibility Score be described to clients?", "Which GEO tasks can Operations handle?"]
  },
  {
    id: "academy_what-is-ghost-portal",
    title: "What is Ghost Portal?",
    slug: "what-is-ghost-portal",
    category: "Ghost Academy",
    summary: "Ghost Portal is the employee operations workspace and source of truth for tasks, clients, leads, approvals, reports, Academy, SOPs, notifications, and feedback.",
    audience,
    sections: [
      { heading: "Purpose", body: "Ghost Portal is where assigned work becomes visible, permission-scoped, documented, and reviewable. It is not a personal notebook, chat replacement, or place to store secrets." },
      { heading: "Core Areas", body: "Portal includes dashboard, tasks, clients, leads, approvals, draft communications, daily reports, Academy, SOP Library, Knowledge Base, notifications, files, feedback, and admin tools for Founder users." },
      { heading: "Source of Truth", body: "If work changes, the relevant Portal record should show it. Chat and email can contain communication, but Portal should hold the operational status, next action, owner, approval need, and audit trail." },
      { heading: "Security Boundaries", body: "Portal uses role-scoped access. Alex should use assigned records and avoid trying to access admin, Founder-only, financial, or restricted information." }
    ],
    practicalExamples: ["Update a task after drafting a follow-up.", "Create Waiting on Stephen instead of asking a pricing decision only in chat."],
    roleImpact: ["Gives Alex a consistent work home", "Helps Stephen audit and review work", "Protects sensitive boundaries"],
    misconceptions: ["Portal is not a place for passwords", "Chat instructions should be reflected in Portal when they affect work", "Role-scoped access is intentional"],
    relatedTerms: ["Task", "Approval", "Daily report", "Audit history", "Role-based access"],
    relatedSOPKeys: ["sop_1_start-of-shift-review", "sop_4_update-a-task", "sop_7_report-a-portal-issue"],
    relatedPortalRoutes: [r("Dashboard", "/dashboard"), r("Tasks", "/tasks"), r("Academy", "/academy")],
    founderReviewQuestions: ["Which Portal areas should be required every shift?", "What should remain outside Portal during trial?"]
  },
  {
    id: "academy_what-is-mission-control",
    title: "What is Mission Control?",
    slug: "what-is-mission-control",
    category: "Ghost Academy",
    summary: "Mission Control is the Founder/internal command center concept for automation, AI-agent coordination, client/project oversight, and service workflows.",
    audience,
    sections: [
      { heading: "Purpose", body: "Mission Control is the broader internal command center vision behind Ghost's automation, AI-agent coordination, service workflow monitoring, and Founder-level oversight." },
      { heading: "Difference From Ghost Portal", body: "Ghost Portal is the employee operations workspace. Mission Control may include deeper Founder tools, agent orchestration, system monitoring, and internal automation that Alex may not need or be allowed to access." },
      { heading: "Alex's Visibility", body: "Alex may see outputs or workflow pieces that come from Mission Control, but some dashboards, controls, client strategy, technical systems, or automations may remain restricted." },
      { heading: "Feedback Loop", body: "When Alex reports Portal friction, missing SOPs, unclear workflows, or Nova suggestions, that feedback can inform future Mission Control development." }
    ],
    practicalExamples: ["Report a recurring workflow problem in Mission Feedback.", "Use Portal tasks rather than trying to operate hidden internal systems."],
    roleImpact: ["Helps Alex understand why feedback matters", "Clarifies restricted areas", "Connects daily work to future automation"],
    misconceptions: ["Mission Control is not the same as Ghost Portal", "Alex should not request backend credentials", "Future automation still requires human safeguards"],
    relatedTerms: ["Ghost Portal", "Nova", "Automation", "AI agents"],
    relatedSOPKeys: ["sop_7_report-a-portal-issue", "sop_10_document-a-new-recurring-process"],
    relatedPortalRoutes: [r("Mission Feedback", "/feedback"), r("Dashboard", "/dashboard")],
    founderReviewQuestions: ["How much Mission Control detail should Alex see during trial?", "Which feedback types should become product backlog items?"]
  },
  {
    id: "academy_ghost-ai-solutions-service-catalog",
    title: "Ghost AI Solutions service catalog",
    slug: "ghost-ai-solutions-service-catalog",
    category: "Ghost Academy",
    summary: "A practical reference for Ghost services, what problems they solve, what Alex may say, and what requires Stephen approval.",
    audience,
    sections: [
      { heading: "Services", body: "Ghost may offer websites, website subscriptions, custom software, mobile applications, AI assistants, AI agents, automation, CRM and client portals, SEO/AEO/GEO, lead-generation systems, marketing systems, content systems, fractional AI or technology leadership, security/compliance support, and approved enterprise or government solutions." },
      { heading: "How to Describe Services", body: "Alex may describe services in plain, non-binding terms: websites help businesses present and convert; automation reduces repetitive work; CRM/client portals organize relationships; AI assistants support workflows; SEO/AEO/GEO improve discoverability signals. Alex should avoid fixed prices or guarantees unless Stephen approves exact wording." },
      { heading: "Deliverables and Fit", body: "Typical deliverables may include discovery, build, configuration, documentation, workflow design, integrations, content support, dashboards, or ongoing support. Target clients vary by service and must be qualified by need, budget, timeline, complexity, and risk." },
      { heading: "Approval Boundaries", body: "Pricing, discounts, timelines, enterprise architecture, legal/security commitments, government work, compliance claims, and custom scope must go to Stephen." }
    ],
    practicalExamples: ["Say: 'Ghost builds automation workflows that reduce repetitive manual follow-up.'", "Do not say: 'We can deliver any AI agent in one week for a fixed price.'"],
    roleImpact: ["Helps Alex draft safer lead follow-ups", "Clarifies what service questions need approval", "Improves lead categorization"],
    misconceptions: ["Service names are not price promises", "A target client is not automatically qualified", "Security/compliance support does not mean legal advice"],
    relatedTerms: ["Scope", "Deliverable", "Retainer", "MRR", "CRM", "AI assistant"],
    relatedSOPKeys: ["sop_23_draft-a-lead-follow-up", "sop_28_flag-a-pricing-question", "sop_29_flag-a-lead-requiring-stephen"],
    relatedPortalRoutes: [r("Leads", "/leads"), r("Clients", "/clients")],
    founderReviewQuestions: ["Which services are active offers today?", "Which service descriptions are approved for client-facing use?"]
  },
  {
    id: "academy_brand-voice-guide",
    title: "Brand voice guide",
    slug: "brand-voice-guide",
    category: "Ghost Academy",
    summary: "Ghost voice should be clear, practical, calm, intelligent, honest, and useful without hype or overpromising.",
    audience,
    sections: [
      { heading: "Voice Traits", body: "Ghost should sound clear, useful, calm, intelligent, direct, and grounded. The tone can be confident, but it should not exaggerate, pressure, or imply certainty where the facts are still being reviewed." },
      { heading: "Preferred Language", body: "Prefer practical phrases such as 'recommended next step,' 'approval needed,' 'current scope,' 'based on the available record,' and 'Stephen can confirm.' Avoid 'guaranteed,' 'instant,' 'cheap,' 'we can definitely,' or false urgency." },
      { heading: "Structure", body: "Emails should include context, purpose, requested action, and next step. Social posts should have a hook, useful body, and CTA. Client updates should separate completed, in progress, waiting on Ghost, waiting on client, risks, and next communication." },
      { heading: "Uncertainty", body: "When uncertain, Alex should name the uncertainty and route it correctly. AI-drafted text must be reviewed for facts, claims, dates, names, pricing, and tone." }
    ],
    practicalExamples: ["Good: 'Stephen can confirm the best package after reviewing scope.'", "Bad: 'We can definitely do that by Friday for a low price.'"],
    roleImpact: ["Improves client drafts", "Reduces overpromising", "Makes reports more useful"],
    misconceptions: ["Professional does not mean vague", "Confident does not mean guaranteed", "Friendly does not mean using emojis everywhere"],
    relatedTerms: ["CTA", "Scope", "Approval", "Client update"],
    relatedSOPKeys: ["sop_14_prepare-a-client-status-update", "sop_23_draft-a-lead-follow-up", "sop_45_review-content-for-brand-consistency"],
    relatedPortalRoutes: [r("Draft Communications", "/communications"), r("Approvals", "/approvals")],
    founderReviewQuestions: ["Which phrases should be banned?", "What emoji guidance should apply to social versus client communication?"]
  },
  {
    id: "academy_company-terminology",
    title: "Company terminology",
    slug: "company-terminology",
    category: "Ghost Academy",
    summary: "A plain-language glossary of Ghost, Portal, Academy, products, sales, operations, and delivery terms.",
    audience,
    sections: [
      { heading: "Ghost Terms", body: "Ghost AI Solutions is the business. Ghost Portal is the employee operations workspace. Ghost Academy is the training and SOP area. Mission Control is the Founder/internal command center concept. Nova is executive intelligence. Vega is sales intelligence. Echo is marketing/content operations. GEO covers search and AI-search visibility." },
      { heading: "Sales Terms", body: "A lead is a potential opportunity. A prospect is a person or company being evaluated. A qualified lead has enough fit to justify next steps. Pipeline is the set of active opportunities. CTA means call to action. CRM is the system or record set for relationships and follow-up." },
      { heading: "Operations Terms", body: "A client has an active relationship. A project organizes delivery work. A task is assigned work. An approval is a decision request. Waiting on Stephen means Founder input is required. A draft communication is prepared language that may need approval." },
      { heading: "Business Terms", body: "MRR means monthly recurring revenue. Retainer means recurring paid support. Scope defines what is included. Deliverable is the output. Revision adjusts existing work. Change request may expand scope. Escalation moves risk to the right decision owner. A blocker prevents progress." }
    ],
    practicalExamples: ["Use 'lead' before agreement/payment and 'client' after active engagement.", "Use 'scope change' when a request adds work beyond the approved deliverable."],
    roleImpact: ["Helps Alex write precise notes", "Reduces confusion in reports", "Improves lead and client records"],
    misconceptions: ["Lead and client are not interchangeable", "Blocked is not the same as waiting for routine work time", "Approval is not the same as a comment"],
    relatedTerms: ["SOP", "Knowledge Base", "Onboarding", "Pipeline", "Blocker"],
    relatedSOPKeys: ["sop_4_update-a-task", "sop_6_request-stephens-approval"],
    relatedPortalRoutes: [r("Knowledge Base", "/knowledge"), r("SOP Library", "/sops")],
    founderReviewQuestions: ["Which terms should be visible to clients?", "Should the glossary include product-specific legal disclaimers?"]
  },
  {
    id: "academy_technology-overview",
    title: "Technology overview",
    slug: "technology-overview",
    category: "Ghost Academy",
    summary: "A business-level explanation of the technology terms Operations may hear without giving production credential instructions.",
    audience,
    sections: [
      { heading: "Core App Terms", body: "Next.js is the web application framework, React builds user interfaces, TypeScript helps catch code mistakes, PostgreSQL stores structured data, and Prisma is the database toolkit used by the app." },
      { heading: "Hosting and Workflow", body: "Vercel hosts the web app, Railway can host database infrastructure, GitHub stores code history, deployments move code to production or staging, and production means the live environment users rely on." },
      { heading: "Integration Terms", body: "OpenAI can power AI features, APIs let systems communicate, webhooks notify systems when events happen, authentication verifies user identity, and role-based access controls what each person can see or do." },
      { heading: "Operations Boundary", body: "Alex should understand terms enough to report issues and follow conversations. Alex should not request production credentials, change deployments, access databases, or make technical promises without Stephen or technical direction." }
    ],
    practicalExamples: ["Report: 'The production /daily-reports page returned an error after submit' instead of 'the internet broke.'", "Ask Stephen before telling a client an API integration is simple."],
    roleImpact: ["Improves bug reports", "Makes technical conversations less confusing", "Protects production systems"],
    misconceptions: ["Understanding a term does not grant access", "Staging and production are different", "APIs are not always simple or free"],
    relatedTerms: ["Next.js", "React", "TypeScript", "PostgreSQL", "Prisma", "Railway", "Vercel", "GitHub", "OpenAI", "API", "Webhook", "Authentication", "Deployment"],
    relatedSOPKeys: ["sop_7_report-a-portal-issue", "sop_8_escalate-urgent-work"],
    relatedPortalRoutes: [r("Mission Feedback", "/feedback")],
    founderReviewQuestions: ["Which technical terms should Alex learn first?", "What production-access policy should be shown in Academy?"]
  },
  {
    id: "academy_pricing-philosophy",
    title: "Pricing philosophy",
    slug: "pricing-philosophy",
    category: "Ghost Academy",
    summary: "Ghost pricing should be value-aware and scope-aware; Alex must not quote or discount without Stephen approval.",
    audience,
    sections: [
      { heading: "How Ghost Thinks About Price", body: "Pricing depends on client value, scope, complexity, timeline, risk, integrations, support expectations, usage costs, and whether the work is one-time, setup plus recurring support, subscription, retainer, or custom arrangement." },
      { heading: "Budget Discovery", body: "Budget signals help Stephen shape options, but they do not authorize Alex to quote. Alex may capture what the client asked, what service is involved, prior quote if any, deadline, and recommendation for Stephen." },
      { heading: "No Unauthorized Quotes", body: "Alex may not invent prices, discount, guarantee, or confirm payment terms. Even illustrative examples should be clearly labeled and Founder-approved before use externally." },
      { heading: "Flexible Packaging", body: "Ghost may package services differently depending on fit: setup plus monthly support, website subscription, custom build, automation project, advisory retainer, or enterprise solution. Stephen decides what applies." }
    ],
    practicalExamples: ["Capture: 'Lead asked whether automation setup is included in website subscription' and submit to Stephen.", "Do not answer: 'Yes, that is included for $500.'"],
    roleImpact: ["Protects revenue", "Prevents accidental commitments", "Helps Alex gather useful pricing context"],
    misconceptions: ["Price is not only hours", "A budget mention is not an approved quote", "Discounts require approval"],
    relatedTerms: ["Value-based pricing", "Retainer", "MRR", "Scope", "Deliverable", "Usage costs"],
    relatedSOPKeys: ["sop_28_flag-a-pricing-question", "sop_6_request-stephens-approval"],
    relatedPortalRoutes: [r("Approvals", "/approvals"), r("Leads", "/leads")],
    founderReviewQuestions: ["What illustrative price examples, if any, may be used?", "Which services have approved starting language?"]
  },
  {
    id: "academy_client-lifecycle",
    title: "Client lifecycle",
    slug: "client-lifecycle",
    category: "Ghost Academy",
    summary: "The client lifecycle runs from identified opportunity through contact, qualification, discovery, scope, proposal, agreement, onboarding, production, launch, support, renewal, expansion, and offboarding.",
    audience,
    sections: [
      { heading: "Stages Before Client", body: "Identified means a possible fit exists. Contacted means outreach occurred. Qualified means enough fit exists to continue. Discovery explores needs. Scope defines possible work. Proposal presents terms. Negotiation resolves details. Agreement/payment turns opportunity into active client work." },
      { heading: "Active Client Stages", body: "Onboarding gathers access and information. Production is active build or delivery. Review/revisions handle feedback. Launch makes work public or operational. Support handles ongoing needs. Renewal and expansion evaluate continued value." },
      { heading: "Offboarding", body: "Offboarding closes access, records final status, documents handoff or end conditions, and protects data. Alex should not offboard independently unless Stephen defines the process." },
      { heading: "Alex's Role", body: "Alex helps maintain records, draft updates, track decisions, prepare follow-ups, and flag approval points. Pricing, scope, proposal, agreement, cancellation, refunds, legal, and security decisions require Stephen." }
    ],
    practicalExamples: ["A lead in Discovery may need a meeting brief; a client in Review may need revision tracking.", "A renewal conversation must be escalated to Stephen before terms are discussed."],
    roleImpact: ["Helps Alex choose correct SOP", "Improves stage-specific next actions", "Protects approval boundaries"],
    misconceptions: ["A qualified lead is not yet a client", "Launch does not end support automatically", "Revision is not always in scope"],
    relatedTerms: ["Lead", "Qualified lead", "Client", "Project", "Scope", "Proposal", "Renewal", "Offboarding"],
    relatedSOPKeys: ["sop_21_review-an-assigned-lead", "sop_18_handle-a-revision-request", "sop_20_identify-an-at-risk-client"],
    relatedPortalRoutes: [r("Leads", "/leads"), r("Clients", "/clients"), r("Projects", "/projects")],
    founderReviewQuestions: ["Which lifecycle stages should be visible in Portal?", "What completion condition defines handoff from lead to client?"]
  }
];

export function renderSOPBody(definition: SOPDefinition) {
  const meta = [
    `Category: ${definition.category}`,
    `Owner: ${definition.owner}`,
    `Intended audience: ${definition.audience.join(", ")}`,
    "Version: 2",
    "Last reviewed date: 2026-07-20",
    "Next review date: 2026-10-20",
    `Estimated completion time: ${definition.estimatedMinutes} minutes`
  ];

  return [
    `# ${definition.title}`,
    "## Header",
    list(meta),
    "## Purpose",
    definition.purpose,
    "## Use This SOP When",
    list(definition.useWhen),
    "## Do Not Use This SOP When",
    list(definition.doNotUseWhen),
    "## Before You Begin",
    list(definition.prerequisites),
    "## Procedure",
    definition.steps.map((step, index) => `${index + 1}. ${step.title}: ${step.instruction} Expected outcome: ${step.expectedOutcome}${step.warning ? ` Warning: ${step.warning}` : ""}`).join("\n"),
    "## Decision and Approval Points",
    list(definition.approvalPoints),
    "## Escalation Conditions",
    list(definition.escalationConditions),
    "## Documentation Requirements",
    list(definition.documentationRequirements),
    "## Completion Criteria",
    list(definition.completionCriteria),
    "## Quality Check",
    list(definition.qualityChecklist),
    "## Good Example",
    definition.examples.good,
    "## Poor Example",
    definition.examples.bad,
    "## Common Mistakes",
    list(definition.commonMistakes),
    "## Related Resources",
    list([
      ...definition.relatedPortalRoutes.map((route) => `${route.label}: ${route.path}`),
      ...definition.relatedTemplates.map((template) => `Template: ${template}`),
      ...definition.relatedSOPKeys.map((key) => `Related SOP: ${key}`)
    ]),
    "## Founder Review Questions",
    list(definition.founderReviewQuestions)
  ].join("\n\n");
}

export function renderKnowledgeBody(definition: KnowledgeArticleDefinition) {
  return [
    `# ${definition.title}`,
    "## Summary",
    definition.summary,
    ...definition.sections.flatMap((section) => [`## ${section.heading}`, section.body]),
    "## How Alex Should Use This During Work",
    [
      `Use this article when ${definition.title.toLowerCase()} appears in a task, client note, lead record, draft, report, meeting brief, approval request, or Stephen conversation.`,
      `Start by connecting the concept to the Portal record in front of you: ${definition.relatedPortalRoutes.map((route) => `${route.label} (${route.path})`).join(", ")}.`,
      `Then choose the matching SOP practice: ${definition.relatedSOPKeys.join(", ")}. The article explains the concept; the SOP explains the action to take.`,
      "If the concept touches pricing, public claims, security, legal language, client commitments, production systems, or restricted data, stop and route the decision to Stephen instead of treating the article as authorization."
    ].join(" "),
    "## What Good Looks Like",
    [
      `Good use of this article means Alex can explain ${definition.title.toLowerCase()} in plain language, connect it to the correct Portal area, and describe what she may do without guessing.`,
      `The useful outcome is not memorizing terminology. The useful outcome is better work: cleaner records, safer drafts, clearer reports, more precise approvals, and fewer vague questions.`,
      `When the article affects client or lead communication, Alex should translate the idea into approved Ghost language, verify facts against the source record, and avoid turning internal concepts into promises.`
    ].join(" "),
    "## Boundary Reminder",
    [
      `This article is guidance for Operations, not a blank check to make decisions about ${definition.relatedTerms.slice(0, 3).join(", ")} or related client commitments.`,
      `The safest rule is to use the article to understand and organize work, then use Waiting on Stephen when authority is unclear.`,
      `Pay special attention to these common misunderstandings: ${definition.misconceptions.join("; ")}.`
    ].join(" "),
    "## Practical Examples",
    list(definition.practicalExamples),
    "## Role Impact",
    list(definition.roleImpact),
    "## Misconceptions",
    list(definition.misconceptions),
    "## Related Terms",
    list(definition.relatedTerms),
    "## Related Resources",
    list([
      ...definition.relatedPortalRoutes.map((route) => `${route.label}: ${route.path}`),
      ...definition.relatedSOPKeys.map((key) => `Related SOP: ${key}`)
    ]),
    "## Founder Review Questions",
    list(definition.founderReviewQuestions)
  ].join("\n\n");
}

function list(values: string[]) {
  return values.map((value) => `- ${value}`).join("\n");
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
