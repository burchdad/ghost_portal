CREATE TYPE "LeadInterestLevel" AS ENUM ('Unknown', 'Low', 'Possible', 'Interested', 'StrongInterest', 'MeetingRequested');
CREATE TYPE "LeadHandoffStatus" AS ENUM ('OpsOnly', 'SalesReadyNeedsDiscovery', 'QualifiedAwaitingFounderReview', 'SentToMissionControl', 'ReturnedForInformation');

ALTER TABLE "Lead"
ADD COLUMN "createdById" TEXT,
ADD COLUMN "needDiscovered" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "interestLevel" "LeadInterestLevel" NOT NULL DEFAULT 'Unknown',
ADD COLUMN "qualificationSummary" TEXT,
ADD COLUMN "appointmentStatus" TEXT,
ADD COLUMN "handoffStatus" "LeadHandoffStatus" NOT NULL DEFAULT 'OpsOnly',
ADD COLUMN "missionControlStatus" TEXT NOT NULL DEFAULT 'Not Sent',
ADD COLUMN "missionControlStage" TEXT,
ADD COLUMN "missionControlPayload" JSONB,
ADD COLUMN "missionControlSyncedAt" TIMESTAMP(3),
ADD COLUMN "needsStephenReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "needsStephenReason" TEXT,
ADD COLUMN "valueSuggestionRange" TEXT;

ALTER TABLE "CallActivity"
ADD COLUMN "personReached" TEXT,
ADD COLUMN "decisionMakerStatus" TEXT,
ADD COLUMN "objection" TEXT,
ADD COLUMN "callbackRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "doNotContact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "recordingReference" TEXT;

UPDATE "Lead"
SET
  "needsStephenReview" = true,
  "needsStephenReason" = COALESCE("needsStephenReason", 'Migrated from legacy approvalRequired flag.')
WHERE "approvalRequired" = true;

CREATE INDEX "Lead_leadSource_idx" ON "Lead"("leadSource");
CREATE INDEX "Lead_handoffStatus_missionControlStatus_idx" ON "Lead"("handoffStatus", "missionControlStatus");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
