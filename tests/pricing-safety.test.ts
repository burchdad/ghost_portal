import { describe, expect, it } from "vitest";
import { calculatePricing, canEmployeeQuoteOffer, pricingStatusNotice, pricingWarnings } from "@/lib/pricing";

describe("pricing safety", () => {
  it("blocks quote permission while pricing is under Founder review", () => {
    expect(canEmployeeQuoteOffer({ pricingStatus: "UnderReview", alexMayQuote: true, employeeQuotePermission: true })).toBe(false);
  });

  it("allows employee quoting only for approved quoteable offers", () => {
    expect(canEmployeeQuoteOffer({ pricingStatus: "Approved", alexMayQuote: true })).toBe(true);
    expect(canEmployeeQuoteOffer({ pricingStatus: "Approved", alexMayQuote: false })).toBe(false);
  });

  it("shows the Founder review notice for under-review pricing", () => {
    expect(pricingStatusNotice("UnderReview")).toContain("Founder review");
  });

  it("calculates monthly profit and margin for workshop pricing", () => {
    const result = calculatePricing({
      monthlyPriceCents: 49700,
      setupFeeCents: 25000,
      founderMonthlyHours: 2,
      founderHourlyCostCents: 7500,
      contractorMonthlyHours: 1,
      contractorHourlyCostCents: 3000,
      softwareCostsCents: 2500
    });

    expect(result.grossMonthlyProfitCents).toBeGreaterThan(0);
    expect(result.grossMargin).toBeGreaterThan(0.5);
  });

  it("warns when under-review pricing has quote permission enabled", () => {
    expect(pricingWarnings({
      pricingStatus: "UnderReview",
      employeeQuotePermission: true,
      cancellationTerms: "30 days",
      scopeAssumptions: ["Defined scope"],
      exclusions: ["Paid advertising"]
    })).toContain("Quote permission enabled while pricing is UnderReview");
  });

  it("warns when Operations-facing approval prerequisites are missing", () => {
    const warnings = pricingWarnings({ websiteIncluded: true, monthlyPriceCents: 10000, targetGrossMargin: 50 });

    expect(warnings).toContain("Missing cancellation terms");
    expect(warnings).toContain("Missing ownership terms");
    expect(warnings).toContain("Missing scope limits");
    expect(warnings).toContain("Missing exclusions");
  });
});
