ALTER TABLE "ServiceOffering" ADD COLUMN "founderSetupHours" DECIMAL(65,30),
ADD COLUMN "founderMonthlyHours" DECIMAL(65,30),
ADD COLUMN "contractorSetupHours" DECIMAL(65,30),
ADD COLUMN "contractorMonthlyHours" DECIMAL(65,30),
ADD COLUMN "founderHourlyCostCents" INTEGER,
ADD COLUMN "contractorHourlyCostCents" INTEGER,
ADD COLUMN "apiCostsCents" INTEGER,
ADD COLUMN "hostingCostsCents" INTEGER,
ADD COLUMN "dataProviderCostsCents" INTEGER,
ADD COLUMN "advertisingManagementCents" INTEGER,
ADD COLUMN "supportReserveCents" INTEGER,
ADD COLUMN "riskReserveCents" INTEGER,
ADD COLUMN "paymentProcessingFeePercent" DECIMAL(65,30),
ADD COLUMN "noSetupFeeRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "reviewPriority" INTEGER NOT NULL DEFAULT 99,
ADD COLUMN "reviewPriorityLabel" TEXT,
ADD COLUMN "changeReason" TEXT;

CREATE TABLE "PricingAcknowledgement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "serviceVersion" TIMESTAMP(3) NOT NULL,
  "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PricingAcknowledgement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PricingAcknowledgement_userId_serviceId_serviceVersion_key" ON "PricingAcknowledgement"("userId", "serviceId", "serviceVersion");
CREATE INDEX "PricingAcknowledgement_serviceId_acknowledgedAt_idx" ON "PricingAcknowledgement"("serviceId", "acknowledgedAt");
CREATE INDEX "PricingAcknowledgement_userId_acknowledgedAt_idx" ON "PricingAcknowledgement"("userId", "acknowledgedAt");

CREATE INDEX "ServiceOffering_reviewPriority_pricingStatus_idx" ON "ServiceOffering"("reviewPriority", "pricingStatus");

ALTER TABLE "PricingAcknowledgement" ADD CONSTRAINT "PricingAcknowledgement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PricingAcknowledgement" ADD CONSTRAINT "PricingAcknowledgement_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
