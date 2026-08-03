ALTER TABLE "Lead"
  ADD COLUMN "ghostCrmStatus" TEXT NOT NULL DEFAULT 'Not Synced',
  ADD COLUMN "ghostCrmExternalId" TEXT,
  ADD COLUMN "ghostCrmPayload" JSONB,
  ADD COLUMN "ghostCrmSyncedAt" TIMESTAMP(3),
  ADD COLUMN "ghostCrmSyncError" TEXT,
  ADD COLUMN "ghostCrmSyncAttempts" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Lead_ghostCrmStatus_ghostCrmSyncedAt_idx" ON "Lead"("ghostCrmStatus", "ghostCrmSyncedAt");
