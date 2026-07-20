-- CreateEnum
CREATE TYPE "AcademyContentType" AS ENUM ('Learning', 'SOP', 'Policy', 'Knowledge', 'ToolGuide');

-- CreateEnum
CREATE TYPE "AcademyAssignmentStatus" AS ENUM ('Assigned', 'InProgress', 'Completed', 'Paused', 'Archived');

-- CreateEnum
CREATE TYPE "AcademyQuestionStatus" AS ENUM ('Open', 'Answered', 'Resolved', 'ConvertedToFAQ');

-- CreateEnum
CREATE TYPE "AcademyUrgency" AS ENUM ('Normal', 'Urgent');

-- CreateEnum
CREATE TYPE "KnowledgeQuestionType" AS ENUM ('MultipleChoice', 'TrueFalse', 'ScenarioChoice', 'ShortResponse');

-- CreateEnum
CREATE TYPE "KnowledgeAttemptStatus" AS ENUM ('Passed', 'Failed', 'FounderReview');

-- CreateEnum
CREATE TYPE "ModuleResourceType" AS ENUM ('InternalLink', 'ExternalLink', 'DownloadableFile', 'VideoUrl', 'Screenshot', 'Template', 'Checklist', 'RelatedSOP', 'RelatedKnowledgeArticle');

-- CreateEnum
CREATE TYPE "SOPCategory" AS ENUM ('Operations', 'ClientOperations', 'LeadOperations', 'MeetingsExecutiveSupport', 'ContentMarketingSupport');

-- CreateTable
CREATE TABLE "LearningPath" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "visibleToRoles" "RoleName"[] DEFAULT ARRAY[]::"RoleName"[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "estimatedTotalMinutes" INTEGER NOT NULL DEFAULT 0,
    "seedManaged" BOOLEAN NOT NULL DEFAULT true,
    "founderReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPathAssignment" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "status" "AcademyAssignmentStatus" NOT NULL DEFAULT 'Assigned',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "required" BOOLEAN NOT NULL DEFAULT true,
    "customNotes" TEXT,

    CONSTRAINT "LearningPathAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "seedManaged" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseModule" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "learningObjectives" TEXT[],
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "contentType" "AcademyContentType" NOT NULL DEFAULT 'Learning',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "audienceRoles" "RoleName"[] DEFAULT ARRAY[]::"RoleName"[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "acknowledgementRequired" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgementText" TEXT,
    "knowledgeCheckRequired" BOOLEAN NOT NULL DEFAULT false,
    "minimumPassingScore" INTEGER NOT NULL DEFAULT 80,
    "ownerId" TEXT,
    "lastReviewed" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "founderReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "seedManaged" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleSection" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "ModuleSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleResource" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "type" "ModuleResourceType" NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ModuleResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCheck" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "passingScore" INTEGER NOT NULL DEFAULT 80,
    "unlimitedRetries" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "KnowledgeCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCheckQuestion" (
    "id" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "type" "KnowledgeQuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "requiredFounderReview" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "KnowledgeCheckQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCheckOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "KnowledgeCheckOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCheckAttempt" (
    "id" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "status" "KnowledgeAttemptStatus" NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewerId" TEXT,
    "reviewerNotes" TEXT,

    CONSTRAINT "KnowledgeCheckAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "moduleVersion" INTEGER NOT NULL,
    "acknowledgementAccepted" BOOLEAN NOT NULL DEFAULT false,
    "knowledgeCheckAttemptId" TEXT,
    "founderReviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyAcknowledgement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "moduleVersion" INTEGER NOT NULL,
    "statement" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeModuleNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeModuleNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeQuestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT,
    "urgency" "AcademyUrgency" NOT NULL DEFAULT 'Normal',
    "status" "AcademyQuestionStatus" NOT NULL DEFAULT 'Open',
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answeredById" TEXT,
    "answeredAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "convertedToFaqAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOPArticle" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "SOPCategory" NOT NULL,
    "purpose" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "audienceRoles" "RoleName"[] DEFAULT ARRAY[]::"RoleName"[],
    "trigger" TEXT NOT NULL,
    "requiredInputs" TEXT[],
    "body" TEXT NOT NULL,
    "approvalPoints" TEXT[],
    "escalationConditions" TEXT[],
    "completionCriteria" TEXT[],
    "relatedTemplates" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "seedManaged" BOOLEAN NOT NULL DEFAULT true,
    "founderReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "lastReviewed" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "SOPArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOPStep" (
    "id" TEXT NOT NULL,
    "sopId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,

    CONSTRAINT "SOPStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticleVersion" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeArticleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAudience" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "role" "RoleName" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ContentAudience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequiredReadingAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "assignedById" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequiredReadingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "percent" INTEGER NOT NULL DEFAULT 0,
    "estimatedMinutesRemaining" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "target" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningPath_sourceKey_key" ON "LearningPath"("sourceKey");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPath_slug_key" ON "LearningPath"("slug");

-- CreateIndex
CREATE INDEX "LearningPath_active_idx" ON "LearningPath"("active");

-- CreateIndex
CREATE INDEX "LearningPathAssignment_userId_status_idx" ON "LearningPathAssignment"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathAssignment_pathId_userId_key" ON "LearningPathAssignment"("pathId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_sourceKey_key" ON "Course"("sourceKey");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_pathId_sortOrder_idx" ON "Course"("pathId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CourseModule_sourceKey_key" ON "CourseModule"("sourceKey");

-- CreateIndex
CREATE UNIQUE INDEX "CourseModule_slug_key" ON "CourseModule"("slug");

-- CreateIndex
CREATE INDEX "CourseModule_courseId_sortOrder_idx" ON "CourseModule"("courseId", "sortOrder");

-- CreateIndex
CREATE INDEX "CourseModule_published_contentType_idx" ON "CourseModule"("published", "contentType");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleSection_moduleId_sortOrder_key" ON "ModuleSection"("moduleId", "sortOrder");

-- CreateIndex
CREATE INDEX "ModuleResource_moduleId_sortOrder_idx" ON "ModuleResource"("moduleId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCheck_moduleId_key" ON "KnowledgeCheck"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCheckQuestion_checkId_sortOrder_key" ON "KnowledgeCheckQuestion"("checkId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCheckOption_questionId_sortOrder_key" ON "KnowledgeCheckOption"("questionId", "sortOrder");

-- CreateIndex
CREATE INDEX "KnowledgeCheckAttempt_checkId_userId_submittedAt_idx" ON "KnowledgeCheckAttempt"("checkId", "userId", "submittedAt");

-- CreateIndex
CREATE INDEX "ModuleCompletion_userId_completedAt_idx" ON "ModuleCompletion"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleCompletion_userId_moduleId_moduleVersion_key" ON "ModuleCompletion"("userId", "moduleId", "moduleVersion");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyAcknowledgement_userId_moduleId_moduleVersion_key" ON "PolicyAcknowledgement"("userId", "moduleId", "moduleVersion");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeModuleNote_userId_moduleId_key" ON "EmployeeModuleNote"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "EmployeeQuestion_userId_status_idx" ON "EmployeeQuestion"("userId", "status");

-- CreateIndex
CREATE INDEX "EmployeeQuestion_moduleId_status_idx" ON "EmployeeQuestion"("moduleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SOPArticle_sourceKey_key" ON "SOPArticle"("sourceKey");

-- CreateIndex
CREATE UNIQUE INDEX "SOPArticle_slug_key" ON "SOPArticle"("slug");

-- CreateIndex
CREATE INDEX "SOPArticle_published_category_idx" ON "SOPArticle"("published", "category");

-- CreateIndex
CREATE UNIQUE INDEX "SOPStep_sopId_stepNumber_key" ON "SOPStep"("sopId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticleVersion_articleId_version_key" ON "KnowledgeArticleVersion"("articleId", "version");

-- CreateIndex
CREATE INDEX "ContentAudience_role_idx" ON "ContentAudience"("role");

-- CreateIndex
CREATE UNIQUE INDEX "ContentAudience_contentType_contentId_role_key" ON "ContentAudience"("contentType", "contentId", "role");

-- CreateIndex
CREATE INDEX "RequiredReadingAssignment_userId_completedAt_idx" ON "RequiredReadingAssignment"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RequiredReadingAssignment_userId_contentType_contentId_key" ON "RequiredReadingAssignment"("userId", "contentType", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyProgress_userId_pathId_key" ON "AcademyProgress"("userId", "pathId");

-- CreateIndex
CREATE INDEX "AcademyActivity_userId_createdAt_idx" ON "AcademyActivity"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "LearningPathAssignment" ADD CONSTRAINT "LearningPathAssignment_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathAssignment" ADD CONSTRAINT "LearningPathAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathAssignment" ADD CONSTRAINT "LearningPathAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleSection" ADD CONSTRAINT "ModuleSection_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleResource" ADD CONSTRAINT "ModuleResource_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeCheck" ADD CONSTRAINT "KnowledgeCheck_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeCheckQuestion" ADD CONSTRAINT "KnowledgeCheckQuestion_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "KnowledgeCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeCheckOption" ADD CONSTRAINT "KnowledgeCheckOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "KnowledgeCheckQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeCheckAttempt" ADD CONSTRAINT "KnowledgeCheckAttempt_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "KnowledgeCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleCompletion" ADD CONSTRAINT "ModuleCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleCompletion" ADD CONSTRAINT "ModuleCompletion_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcknowledgement" ADD CONSTRAINT "PolicyAcknowledgement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcknowledgement" ADD CONSTRAINT "PolicyAcknowledgement_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeModuleNote" ADD CONSTRAINT "EmployeeModuleNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeModuleNote" ADD CONSTRAINT "EmployeeModuleNote_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeQuestion" ADD CONSTRAINT "EmployeeQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeQuestion" ADD CONSTRAINT "EmployeeQuestion_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeQuestion" ADD CONSTRAINT "EmployeeQuestion_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOPStep" ADD CONSTRAINT "SOPStep_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "SOPArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticleVersion" ADD CONSTRAINT "KnowledgeArticleVersion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyProgress" ADD CONSTRAINT "AcademyProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyProgress" ADD CONSTRAINT "AcademyProgress_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyActivity" ADD CONSTRAINT "AcademyActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

