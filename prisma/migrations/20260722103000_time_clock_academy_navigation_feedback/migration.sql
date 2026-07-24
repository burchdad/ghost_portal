ALTER TYPE "FeedbackType" ADD VALUE IF NOT EXISTS 'EmployeeOnboardingBeta';

CREATE TYPE "WorkShiftStatus" AS ENUM ('ClockedIn', 'OnBreak', 'Completed', 'AwaitingCorrection');
CREATE TYPE "TimeCorrectionStatus" AS ENUM ('Requested', 'UnderReview', 'Approved', 'Rejected');
CREATE TYPE "AcademyQuestionDifficulty" AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE "AcademyQuestionPublishStatus" AS ENUM ('Draft', 'Approved', 'Retired');

ALTER TABLE "CourseModule" ADD COLUMN "primarySopId" TEXT;

ALTER TABLE "KnowledgeCheckQuestion" ADD COLUMN "moduleId" TEXT,
ADD COLUMN "sopId" TEXT,
ADD COLUMN "learningObjective" TEXT,
ADD COLUMN "incorrectExplanation" TEXT,
ADD COLUMN "difficulty" "AcademyQuestionDifficulty" NOT NULL DEFAULT 'Beginner',
ADD COLUMN "status" "AcademyQuestionPublishStatus" NOT NULL DEFAULT 'Approved',
ADD COLUMN "createdById" TEXT,
ADD COLUMN "approvedById" TEXT;

CREATE TABLE "WorkShift" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "grossMinutes" INTEGER,
  "breakMinutes" INTEGER NOT NULL DEFAULT 0,
  "netMinutes" INTEGER,
  "status" "WorkShiftStatus" NOT NULL DEFAULT 'ClockedIn',
  "correctionStatus" "TimeCorrectionStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkShift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkBreak" (
  "id" TEXT NOT NULL,
  "shiftId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "durationMinutes" INTEGER,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkBreak_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimeCorrectionRequest" (
  "id" TEXT NOT NULL,
  "shiftId" TEXT,
  "requesterId" TEXT NOT NULL,
  "requestedStartTime" TIMESTAMP(3),
  "requestedEndTime" TIMESTAMP(3),
  "requestedBreakDuration" INTEGER,
  "reason" TEXT NOT NULL,
  "supportingNote" TEXT,
  "status" "TimeCorrectionStatus" NOT NULL DEFAULT 'Requested',
  "founderComment" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TimeCorrectionRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkShift_userId_status_idx" ON "WorkShift"("userId", "status");
CREATE INDEX "WorkShift_startedAt_idx" ON "WorkShift"("startedAt");
CREATE INDEX "WorkBreak_shiftId_startedAt_idx" ON "WorkBreak"("shiftId", "startedAt");
CREATE INDEX "TimeCorrectionRequest_requesterId_status_idx" ON "TimeCorrectionRequest"("requesterId", "status");
CREATE INDEX "TimeCorrectionRequest_shiftId_idx" ON "TimeCorrectionRequest"("shiftId");

ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_primarySopId_fkey" FOREIGN KEY ("primarySopId") REFERENCES "SOPArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "KnowledgeCheckQuestion" ADD CONSTRAINT "KnowledgeCheckQuestion_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeCheckQuestion" ADD CONSTRAINT "KnowledgeCheckQuestion_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "SOPArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkShift" ADD CONSTRAINT "WorkShift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkBreak" ADD CONSTRAINT "WorkBreak_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "WorkShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeCorrectionRequest" ADD CONSTRAINT "TimeCorrectionRequest_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "WorkShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TimeCorrectionRequest" ADD CONSTRAINT "TimeCorrectionRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeCorrectionRequest" ADD CONSTRAINT "TimeCorrectionRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
