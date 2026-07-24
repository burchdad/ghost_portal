-- Expand lead and feedback vocabulary for Alex's sales operations trial.
ALTER TYPE "LeadStage" ADD VALUE IF NOT EXISTS 'Researching';
ALTER TYPE "LeadStage" ADD VALUE IF NOT EXISTS 'ReadyToCall';
ALTER TYPE "LeadStage" ADD VALUE IF NOT EXISTS 'Attempted';
ALTER TYPE "LeadStage" ADD VALUE IF NOT EXISTS 'Connected';
ALTER TYPE "LeadStage" ADD VALUE IF NOT EXISTS 'Interested';
ALTER TYPE "LeadStage" ADD VALUE IF NOT EXISTS 'FollowUp';
ALTER TYPE "LeadStage" ADD VALUE IF NOT EXISTS 'MeetingScheduled';
ALTER TYPE "LeadStage" ADD VALUE IF NOT EXISTS 'DoNotContact';

ALTER TYPE "FeedbackType" ADD VALUE IF NOT EXISTS 'ConfusingWording';
ALTER TYPE "FeedbackType" ADD VALUE IF NOT EXISTS 'BrokenWorkflow';
ALTER TYPE "FeedbackType" ADD VALUE IF NOT EXISTS 'PermissionIssue';
ALTER TYPE "FeedbackType" ADD VALUE IF NOT EXISTS 'TrainingIssue';
ALTER TYPE "FeedbackType" ADD VALUE IF NOT EXISTS 'PricingQuestion';
ALTER TYPE "FeedbackType" ADD VALUE IF NOT EXISTS 'ServiceQuestion';
ALTER TYPE "FeedbackType" ADD VALUE IF NOT EXISTS 'ProcessImprovement';

CREATE TYPE "ServiceCategory" AS ENUM (
  'Websites',
  'WebsiteCare',
  'AIAutomation',
  'CustomAISystems',
  'LeadGeneration',
  'SEOAEO_GEO',
  'Marketing',
  'SocialMedia',
  'Applications',
  'DigitalBusinessCards',
  'Consulting',
  'FractionalLeadership',
  'CustomDevelopment'
);

CREATE TYPE "PricingStatus" AS ENUM ('Approved', 'FounderManagedRequired', 'CustomScope', 'Inactive');
CREATE TYPE "PriceFrequency" AS ENUM ('OneTime', 'Monthly', 'Annual', 'PerUnitMonthly', 'UsageBased');

ALTER TABLE "Lead" ADD COLUMN "jobTitle" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "industry" TEXT,
ADD COLUMN "location" TEXT,
ADD COLUMN "timezone" TEXT,
ADD COLUMN "leadSource" TEXT,
ADD COLUMN "whySelected" TEXT,
ADD COLUMN "existingTechnology" TEXT,
ADD COLUMN "websiteStatus" TEXT,
ADD COLUMN "marketingStatus" TEXT,
ADD COLUMN "aiOpportunity" TEXT,
ADD COLUMN "suggestedService" TEXT,
ADD COLUMN "conversationAngle" TEXT,
ADD COLUMN "previousEmailHistory" TEXT,
ADD COLUMN "previousCallHistory" TEXT,
ADD COLUMN "callResult" TEXT,
ADD COLUMN "appointmentDate" TIMESTAMP(3),
ADD COLUMN "doNotContact" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "CallActivity" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "nextAction" TEXT,
  "followUpDate" TIMESTAMP(3),
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CallActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceOffering" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" "ServiceCategory" NOT NULL,
  "shortExplanation" TEXT NOT NULL,
  "internalExplanation" TEXT NOT NULL,
  "problemsSolved" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "idealCustomer" TEXT NOT NULL,
  "includedDeliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "optionalAddOns" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "oneTimePriceCents" INTEGER,
  "monthlyPriceCents" INTEGER,
  "priceRangeMinCents" INTEGER,
  "priceRangeMaxCents" INTEGER,
  "pricingStatus" "PricingStatus" NOT NULL DEFAULT 'FounderManagedRequired',
  "paymentTerms" TEXT,
  "minimumEngagement" TEXT,
  "typicalTimeline" TEXT,
  "qualificationQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "commonObjections" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "approvedResponse" TEXT NOT NULL,
  "desiredNextStep" TEXT NOT NULL,
  "alexMayQuote" BOOLEAN NOT NULL DEFAULT false,
  "founderApprovalRequired" BOOLEAN NOT NULL DEFAULT true,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "internalNotes" TEXT,
  "founderNotes" TEXT,
  "pricingNotes" TEXT,
  "customPricingFields" JSONB,
  "approvalThreshold" TEXT,
  "effectiveDate" TIMESTAMP(3),
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "ServiceOffering_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PricingTier" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "priceCents" INTEGER,
  "monthlyCents" INTEGER,
  "frequency" "PriceFrequency",
  "includedUsage" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PricingTier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceAddOn" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "priceCents" INTEGER,
  "monthlyCents" INTEGER,
  "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceAddOn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecurringFee" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "monthlyCents" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecurringFee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SetupFee" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priceCents" INTEGER,
  "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SetupFee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceDiscount" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "maxPercent" INTEGER,
  "notes" TEXT,
  "requiresFounderApproval" BOOLEAN NOT NULL DEFAULT true,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceDiscount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServicePackage" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "setupPriceCents" INTEGER,
  "monthlyPriceCents" INTEGER,
  "discount" TEXT,
  "minimumTerm" TEXT,
  "paymentSchedule" TEXT,
  "includedUsage" TEXT,
  "optionalAddOns" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "internalDeliveryCostCents" INTEGER,
  "employeeQuotePermission" BOOLEAN NOT NULL DEFAULT false,
  "founderApprovalThreshold" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "ServicePackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PackageItem" (
  "id" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "notes" TEXT,
  CONSTRAINT "PackageItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PricingHistory" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT,
  "packageId" TEXT,
  "changedById" TEXT,
  "action" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "effectiveDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PricingHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceOffering_slug_key" ON "ServiceOffering"("slug");
CREATE INDEX "ServiceOffering_active_displayOrder_idx" ON "ServiceOffering"("active", "displayOrder");
CREATE INDEX "ServiceOffering_category_idx" ON "ServiceOffering"("category");
CREATE INDEX "ServiceOffering_alexMayQuote_founderApprovalRequired_idx" ON "ServiceOffering"("alexMayQuote", "founderApprovalRequired");
CREATE INDEX "PricingTier_serviceId_active_idx" ON "PricingTier"("serviceId", "active");
CREATE INDEX "ServiceAddOn_serviceId_active_idx" ON "ServiceAddOn"("serviceId", "active");
CREATE UNIQUE INDEX "ServicePackage_slug_key" ON "ServicePackage"("slug");
CREATE INDEX "ServicePackage_active_displayOrder_idx" ON "ServicePackage"("active", "displayOrder");
CREATE UNIQUE INDEX "PackageItem_packageId_serviceId_key" ON "PackageItem"("packageId", "serviceId");
CREATE INDEX "PricingHistory_serviceId_createdAt_idx" ON "PricingHistory"("serviceId", "createdAt");
CREATE INDEX "PricingHistory_packageId_createdAt_idx" ON "PricingHistory"("packageId", "createdAt");
CREATE INDEX "CallActivity_leadId_occurredAt_idx" ON "CallActivity"("leadId", "occurredAt");
CREATE INDEX "CallActivity_userId_occurredAt_idx" ON "CallActivity"("userId", "occurredAt");

ALTER TABLE "CallActivity" ADD CONSTRAINT "CallActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallActivity" ADD CONSTRAINT "CallActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceOffering" ADD CONSTRAINT "ServiceOffering_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PricingTier" ADD CONSTRAINT "PricingTier_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceAddOn" ADD CONSTRAINT "ServiceAddOn_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringFee" ADD CONSTRAINT "RecurringFee_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SetupFee" ADD CONSTRAINT "SetupFee_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceDiscount" ADD CONSTRAINT "ServiceDiscount_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServicePackage" ADD CONSTRAINT "ServicePackage_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PackageItem" ADD CONSTRAINT "PackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ServicePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PackageItem" ADD CONSTRAINT "PackageItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PricingHistory" ADD CONSTRAINT "PricingHistory_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PricingHistory" ADD CONSTRAINT "PricingHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
