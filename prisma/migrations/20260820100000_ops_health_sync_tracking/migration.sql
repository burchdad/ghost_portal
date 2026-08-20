ALTER TABLE "Lead"
  ADD COLUMN "missionControlSyncErrorCode" TEXT,
  ADD COLUMN "missionControlSyncErrorMessage" TEXT,
  ADD COLUMN "missionControlLastAttemptAt" TIMESTAMP(3),
  ADD COLUMN "missionControlSyncAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "isTestRecord" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Lead"
SET "isTestRecord" = true
WHERE lower("company") LIKE 'codex qa%'
   OR lower("company") LIKE 'codex smoke%'
   OR lower("company") LIKE 'codex test%';

CREATE INDEX "Lead_isTestRecord_archivedAt_idx" ON "Lead"("isTestRecord", "archivedAt");
