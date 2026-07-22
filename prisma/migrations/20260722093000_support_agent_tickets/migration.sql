ALTER TABLE "FeedbackSubmission"
ADD COLUMN "supportKey" TEXT,
ADD COLUMN "missionControlArea" TEXT,
ADD COLUMN "expectedResult" TEXT,
ADD COLUMN "actualResult" TEXT,
ADD COLUMN "workaroundTried" TEXT,
ADD COLUMN "blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "agentSummary" TEXT,
ADD COLUMN "resolutionNotes" TEXT,
ADD COLUMN "resolvedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "FeedbackSubmission_supportKey_key" ON "FeedbackSubmission"("supportKey");
CREATE INDEX "FeedbackSubmission_status_severity_createdAt_idx" ON "FeedbackSubmission"("status", "severity", "createdAt");
CREATE INDEX "FeedbackSubmission_submittedById_status_idx" ON "FeedbackSubmission"("submittedById", "status");
