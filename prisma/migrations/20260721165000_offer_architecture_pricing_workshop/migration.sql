ALTER TYPE "PricingStatus" ADD VALUE IF NOT EXISTS 'Provisional';
ALTER TYPE "PricingStatus" ADD VALUE IF NOT EXISTS 'UnderReview';
ALTER TYPE "PricingStatus" ADD VALUE IF NOT EXISTS 'Retired';

CREATE TYPE "OfferType" AS ENUM (
  'GrowthPartnership',
  'StandaloneService',
  'ProductSubscription',
  'CustomEnterpriseEngagement'
);

CREATE TYPE "PriceDisplayMode" AS ENUM (
  'Fixed',
  'Range',
  'FounderReviewRequired',
  'CustomPricing'
);

CREATE TYPE "PricingBasis" AS ENUM (
  'Project',
  'MonthlyRetainer',
  'Subscription',
  'PerUnit',
  'UsageBased',
  'Custom'
);

CREATE TYPE "FinancingStatus" AS ENUM (
  'FinancingUnavailable',
  'FinancingAvailable',
  'FinancingApplicationRequired',
  'ThirdPartyFinancing',
  'CustomFinancingTerms'
);

ALTER TABLE "Lead" ADD COLUMN "businessAge" TEXT,
ADD COLUMN "employeeCount" TEXT,
ADD COLUMN "approximateRevenue" TEXT,
ADD COLUMN "currentWebsite" TEXT,
ADD COLUMN "currentLeadFlow" TEXT,
ADD COLUMN "currentCrm" TEXT,
ADD COLUMN "currentAdvertising" TEXT,
ADD COLUMN "currentAutomation" TEXT,
ADD COLUMN "mainPainPoint" TEXT,
ADD COLUMN "urgency" TEXT,
ADD COLUMN "budgetComfort" TEXT,
ADD COLUMN "decisionMakerStatus" TEXT,
ADD COLUMN "desiredOutcome" TEXT,
ADD COLUMN "internalCapacity" TEXT,
ADD COLUMN "numberOfLocations" TEXT,
ADD COLUMN "regulatedIndustry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "existingVendor" TEXT,
ADD COLUMN "preferredOfferType" "OfferType",
ADD COLUMN "recommendedGhostOffer" TEXT,
ADD COLUMN "recommendedServiceId" TEXT;

ALTER TABLE "ServiceOffering" ADD COLUMN "offerType" "OfferType" NOT NULL DEFAULT 'StandaloneService',
ADD COLUMN "setupFeeCents" INTEGER,
ADD COLUMN "annualFeeCents" INTEGER,
ADD COLUMN "internalMinimumCents" INTEGER,
ADD COLUMN "standardPriceCents" INTEGER,
ADD COLUMN "standardMonthlyPriceCents" INTEGER,
ADD COLUMN "discountFloorCents" INTEGER,
ADD COLUMN "targetGrossMargin" DECIMAL(65,30),
ADD COLUMN "estimatedSetupHours" DECIMAL(65,30),
ADD COLUMN "estimatedMonthlyHours" DECIMAL(65,30),
ADD COLUMN "directCostsCents" INTEGER,
ADD COLUMN "softwareCostsCents" INTEGER,
ADD COLUMN "contractorCostsCents" INTEGER,
ADD COLUMN "pricingBasis" "PricingBasis",
ADD COLUMN "priceDisplayMode" "PriceDisplayMode" NOT NULL DEFAULT 'FounderReviewRequired',
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedById" TEXT,
ADD COLUMN "reviewDate" TIMESTAMP(3),
ADD COLUMN "minimumTermMonths" INTEGER,
ADD COLUMN "cancellationTerms" TEXT,
ADD COLUMN "earlyCancellationTerms" TEXT,
ADD COLUMN "buyoutAmountCents" INTEGER,
ADD COLUMN "employeeQuotePermission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "financingStatus" "FinancingStatus" NOT NULL DEFAULT 'FinancingUnavailable',
ADD COLUMN "financingNotes" TEXT,
ADD COLUMN "websiteIncluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "websiteInclusion" TEXT,
ADD COLUMN "websiteType" TEXT,
ADD COLUMN "pageAllowance" TEXT,
ADD COLUMN "featureAllowance" TEXT,
ADD COLUMN "designLevel" TEXT,
ADD COLUMN "revisionAllowance" TEXT,
ADD COLUMN "buildValueCents" INTEGER,
ADD COLUMN "monthlyRecoveryAmountCents" INTEGER,
ADD COLUMN "transferEligibility" TEXT,
ADD COLUMN "ownershipTransferTiming" TEXT,
ADD COLUMN "websiteOwnershipTerms" TEXT,
ADD COLUMN "supportLevel" TEXT,
ADD COLUMN "supportResponseTarget" TEXT,
ADD COLUMN "reportingFrequency" TEXT,
ADD COLUMN "meetingFrequency" TEXT,
ADD COLUMN "scopeAssumptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "exclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "customerFacingNotes" TEXT,
ADD COLUMN "customerFacingInclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "customerFacingExclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "approvedWording" TEXT,
ADD COLUMN "escalationTriggers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "upgradePath" TEXT,
ADD COLUMN "downgradePath" TEXT,
ADD COLUMN "requiredAcknowledgement" TEXT;

CREATE TABLE "PricingApprovalRequest" (
  "id" TEXT NOT NULL,
  "leadId" TEXT,
  "serviceId" TEXT,
  "business" TEXT NOT NULL,
  "recommendedOffer" TEXT NOT NULL,
  "currentPain" TEXT NOT NULL,
  "requestedPricing" TEXT,
  "requestedDiscount" TEXT,
  "requestedTerm" TEXT,
  "requestedAddOns" TEXT,
  "competitorInformation" TEXT,
  "budgetIndication" TEXT,
  "recommendation" TEXT NOT NULL,
  "urgency" "Priority" NOT NULL DEFAULT 'Medium',
  "meetingDate" TIMESTAMP(3),
  "notes" TEXT,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'Open',
  "founderResponse" TEXT,
  "conditions" TEXT,
  "expiresAt" TIMESTAMP(3),
  "requesterId" TEXT NOT NULL,
  "deciderId" TEXT,
  "decisionAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PricingApprovalRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceOffering_offerType_active_displayOrder_idx" ON "ServiceOffering"("offerType", "active", "displayOrder");
CREATE INDEX "ServiceOffering_pricingStatus_idx" ON "ServiceOffering"("pricingStatus");
CREATE INDEX "PricingApprovalRequest_leadId_status_idx" ON "PricingApprovalRequest"("leadId", "status");
CREATE INDEX "PricingApprovalRequest_serviceId_status_idx" ON "PricingApprovalRequest"("serviceId", "status");
CREATE INDEX "PricingApprovalRequest_requesterId_status_idx" ON "PricingApprovalRequest"("requesterId", "status");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_recommendedServiceId_fkey" FOREIGN KEY ("recommendedServiceId") REFERENCES "ServiceOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceOffering" ADD CONSTRAINT "ServiceOffering_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PricingApprovalRequest" ADD CONSTRAINT "PricingApprovalRequest_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PricingApprovalRequest" ADD CONSTRAINT "PricingApprovalRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PricingApprovalRequest" ADD CONSTRAINT "PricingApprovalRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PricingApprovalRequest" ADD CONSTRAINT "PricingApprovalRequest_deciderId_fkey" FOREIGN KEY ("deciderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
