-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "leadId" TEXT;

-- AlterTable
ALTER TABLE "OnboardingModule" ADD COLUMN     "visibleToRoles" "RoleName"[];

-- AlterTable
ALTER TABLE "FileAsset" ADD COLUMN     "approvalId" TEXT,
ADD COLUMN     "feedbackId" TEXT,
ADD COLUMN     "reportId" TEXT;

-- CreateTable
CREATE TABLE "TrialSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trialStartDate" TIMESTAMP(3) NOT NULL,
    "trialEndDate" TIMESTAMP(3) NOT NULL,
    "weeklyHourTarget" DECIMAL(65,30) NOT NULL,
    "maximumTrialHours" DECIMAL(65,30) NOT NULL,
    "hourlyRateCents" INTEGER NOT NULL,
    "primaryTimezone" TEXT NOT NULL DEFAULT 'Asia/Manila',
    "requiredOverlapTimezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrialSettings_userId_key" ON "TrialSettings"("userId");

-- CreateIndex
CREATE INDEX "Task_leadId_idx" ON "Task"("leadId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "Approval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DailyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "FeedbackSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialSettings" ADD CONSTRAINT "TrialSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

