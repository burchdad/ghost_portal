ALTER TYPE "KnowledgeAttemptStatus" ADD VALUE IF NOT EXISTS 'NeedsReview';

CREATE TABLE "KnowledgeCheckAttemptUnlock" (
  "id" TEXT NOT NULL,
  "checkId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "unlockedById" TEXT NOT NULL,
  "reason" TEXT,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgeCheckAttemptUnlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KnowledgeCheckAttemptUnlock_checkId_userId_usedAt_idx" ON "KnowledgeCheckAttemptUnlock"("checkId", "userId", "usedAt");
CREATE INDEX "KnowledgeCheckAttemptUnlock_unlockedById_createdAt_idx" ON "KnowledgeCheckAttemptUnlock"("unlockedById", "createdAt");

ALTER TABLE "KnowledgeCheckAttemptUnlock" ADD CONSTRAINT "KnowledgeCheckAttemptUnlock_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "KnowledgeCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeCheckAttemptUnlock" ADD CONSTRAINT "KnowledgeCheckAttemptUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeCheckAttemptUnlock" ADD CONSTRAINT "KnowledgeCheckAttemptUnlock_unlockedById_fkey" FOREIGN KEY ("unlockedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
