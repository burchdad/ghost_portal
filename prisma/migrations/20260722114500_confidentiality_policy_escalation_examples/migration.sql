UPDATE "CourseModule"
SET
  "body" = $policy$
# Confidentiality Policy

These internal policies provide operational guidance and do not replace signed agreements or applicable law.

## Purpose
The purpose of the Confidentiality Policy is to give Operations clear rules for safe, reliable work during the paid trial. The policy protects Ghost AI Solutions, clients, employees, contractors, and future systems.

## Scope
This applies to Alex's Ghost Portal work, assigned client or lead records, task comments, daily reports, draft communications, files, AI-assisted work, and any approved third-party tools.

## Rules
- Keep confidential information inside approved systems.
- Do not make commitments about pricing, deadlines, refunds, contracts, security, or scope without Stephen's approval.
- Document decisions, blockers, and completed outcomes in Ghost Portal.
- Use only assigned accounts and never share credentials.
- Escalate risk, confusion, or possible incidents quickly.

## Examples
A safe action is documenting a client request and submitting it for approval. An unsafe action is confirming a discount, launch date, or sensitive technical answer without Founder approval.

## Escalation
Escalate immediately when information is sensitive, a client is upset, a deadline may be missed, a credential may be exposed, or authority is unclear.

## Common Situations That Require Escalation
- Security or privacy concerns
- Client complaints or dissatisfaction
- Requests for pricing exceptions or discounts
- Requests to change project scope or deadlines
- Technical issues affecting clients
- Bugs or permission issues in Ghost Portal
- Suspicious emails, files, or login activity
- Media or public inquiries
- Legal, financial, or contract questions
- Any situation where you're unsure of the correct action

## Founder Review
Founder review required before this policy is treated as final legal or contractual language.
$policy$,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "sourceKey" = 'policy_confidentiality-policy';
