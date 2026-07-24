export function formatCents(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return "Not set";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(cents / 100);
}

export function displayCategory(category: string) {
  return category
    .replace("SEOAEO_GEO", "SEO / AEO / GEO")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace("AI ", "AI ");
}

export function canEmployeeQuoteOffer(input: { pricingStatus: string; alexMayQuote?: boolean; employeeQuotePermission?: boolean }) {
  return input.pricingStatus === "Approved" && Boolean(input.alexMayQuote || input.employeeQuotePermission);
}

export function pricingStatusNotice(pricingStatus: string) {
  if (pricingStatus === "UnderReview") {
    return "Pricing is currently under Founder review. Request approval before quoting it externally.";
  }
  if (pricingStatus === "Retired") {
    return "This offer is retired and may not be quoted.";
  }
  return null;
}

export type PricingCalculatorInput = {
  setupFeeCents?: number | null;
  monthlyPriceCents?: number | null;
  minimumTermMonths?: number | null;
  founderSetupHours?: number | null;
  founderMonthlyHours?: number | null;
  contractorSetupHours?: number | null;
  contractorMonthlyHours?: number | null;
  founderHourlyCostCents?: number | null;
  contractorHourlyCostCents?: number | null;
  softwareCostsCents?: number | null;
  apiCostsCents?: number | null;
  hostingCostsCents?: number | null;
  dataProviderCostsCents?: number | null;
  advertisingManagementCents?: number | null;
  supportReserveCents?: number | null;
  riskReserveCents?: number | null;
  paymentProcessingFeePercent?: number | null;
  targetGrossMargin?: number | null;
  monthlyRecoveryAmountCents?: number | null;
};

export function calculatePricing(input: PricingCalculatorInput) {
  const setupLabor =
    money(input.founderSetupHours) * money(input.founderHourlyCostCents) +
    money(input.contractorSetupHours) * money(input.contractorHourlyCostCents);
  const monthlyLabor =
    money(input.founderMonthlyHours) * money(input.founderHourlyCostCents) +
    money(input.contractorMonthlyHours) * money(input.contractorHourlyCostCents);
  const monthlyDirectCost =
    monthlyLabor +
    money(input.softwareCostsCents) +
    money(input.apiCostsCents) +
    money(input.hostingCostsCents) +
    money(input.dataProviderCostsCents) +
    money(input.advertisingManagementCents) +
    money(input.supportReserveCents) +
    money(input.riskReserveCents);
  const monthlyProcessingFee = money(input.monthlyPriceCents) * (money(input.paymentProcessingFeePercent) / 100);
  const totalMonthlyDeliveryCost = Math.round(monthlyDirectCost + monthlyProcessingFee);
  const grossMonthlyProfit = money(input.monthlyPriceCents) - totalMonthlyDeliveryCost;
  const grossMargin = money(input.monthlyPriceCents) > 0 ? grossMonthlyProfit / money(input.monthlyPriceCents) : null;
  const setupGap = Math.max(0, setupLabor - money(input.setupFeeCents));
  const breakEvenMonth = grossMonthlyProfit > 0 && setupGap > 0 ? Math.ceil(setupGap / grossMonthlyProfit) : setupGap === 0 ? 0 : null;
  const websiteRecoveryPeriod = money(input.monthlyRecoveryAmountCents) > 0 && setupGap > 0 ? Math.ceil(setupGap / money(input.monthlyRecoveryAmountCents)) : null;
  const discountFloorCents = Math.ceil(totalMonthlyDeliveryCost / Math.max(0.01, 1 - money(input.targetGrossMargin) / 100));

  return {
    totalSetupCostCents: Math.round(setupLabor),
    totalMonthlyDeliveryCostCents: totalMonthlyDeliveryCost,
    grossMonthlyProfitCents: Math.round(grossMonthlyProfit),
    grossMargin,
    breakEvenMonth,
    websiteRecoveryPeriod,
    recommendedMinimumTermMonths: Math.max(money(input.minimumTermMonths), breakEvenMonth ?? 0, websiteRecoveryPeriod ?? 0),
    discountFloorCents
  };
}

export function pricingWarnings(input: PricingCalculatorInput & {
  pricingStatus?: string;
  employeeQuotePermission?: boolean | null;
  websiteIncluded?: boolean | null;
  cancellationTerms?: string | null;
  websiteOwnershipTerms?: string | null;
  scopeAssumptions?: string[] | null;
  exclusions?: string[] | null;
}) {
  const calc = calculatePricing(input);
  const warnings: string[] = [];
  if (calc.grossMonthlyProfitCents < 0) warnings.push("Negative margin");
  if (calc.grossMargin !== null && input.targetGrossMargin !== null && input.targetGrossMargin !== undefined && calc.grossMargin * 100 < input.targetGrossMargin) warnings.push("Margin below target");
  if (input.websiteIncluded && calc.websiteRecoveryPeriod !== null && input.minimumTermMonths && calc.websiteRecoveryPeriod > input.minimumTermMonths) warnings.push("Website cost not recovered during minimum term");
  if (money(input.setupFeeCents) < calc.totalSetupCostCents) warnings.push("Setup fee below setup cost");
  if (money(input.founderMonthlyHours) + money(input.contractorMonthlyHours) > 20) warnings.push("Excessive monthly delivery hours");
  if (!input.cancellationTerms) warnings.push("Missing cancellation terms");
  if (input.websiteIncluded && !input.websiteOwnershipTerms) warnings.push("Missing ownership terms");
  if (input.pricingStatus === "UnderReview" && input.employeeQuotePermission) warnings.push("Quote permission enabled while pricing is UnderReview");
  if (!input.scopeAssumptions?.length) warnings.push("Missing scope limits");
  if (!input.exclusions?.length) warnings.push("Missing exclusions");
  return warnings;
}

function money(value: number | null | undefined) {
  return Number(value ?? 0);
}
