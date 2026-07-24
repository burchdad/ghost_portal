import { FinancingStatus, OfferType, PriceDisplayMode, PricingBasis, PricingStatus, ServiceCategory, type PrismaClient } from "@prisma/client";

type PrismaLike = PrismaClient;

const reviewNotice = "Pricing is currently under Founder review and may not be quoted without approval.";

const addOns = [
  "Additional website pages",
  "Additional locations",
  "Additional users",
  "Additional social platforms",
  "Additional social posts",
  "Additional videos",
  "Additional blogs",
  "Additional email campaigns",
  "Human cold calling",
  "Appointment setting",
  "CRM management",
  "Reputation management",
  "Ad management",
  "Paid-ad spend",
  "Custom dashboard",
  "Advanced reporting",
  "Rush delivery",
  "Custom integration",
  "API usage",
  "Training",
  "On-site consulting",
  "After-hours support",
  "Priority support",
  "Additional development hours"
];

const offers = [
  growthPartnership({
    id: "seed_offer_founder_launch",
    slug: "founder-launch",
    name: "Founder Launch",
    displayOrder: 1,
    monthlyPriceCents: 49700,
    priceRangeMinCents: 39700,
    priceRangeMaxCents: 69700,
    setupFeeCents: 25000,
    minimumTermMonths: 12,
    idealCustomer: "New businesses, solo entrepreneurs, small local businesses, businesses under approximately $100,000 annual revenue, and businesses relaunching or entering a new market.",
    included: ["Up to five-page starter website", "Hosting and maintenance", "Google Business Profile optimization", "Basic SEO, AEO, and GEO setup", "Four social posts per month", "Lead capture form", "Monthly performance summary", "Monthly growth call"],
    exclusions: ["E-commerce", "Custom applications", "Paid advertising", "Human cold calling", "Appointment setting", "Advanced automations", "Large content production", "Third-party subscriptions", "Major redesigns after approval"],
    approvedWording: "Founder Launch is designed for smaller businesses that need a professional foundation without a large upfront technology investment. It can include a starter website, hosting, visibility support, social content, and ongoing guidance under one monthly partnership.",
    websiteInclusion: "Hosted and maintained by Ghost during agreement. Ownership transfers after minimum term completion. Early cancellation requires buyout. Buyout amount and domain treatment remain Founder-editable.",
    pageAllowance: "5 pages",
    revisionAllowance: "Founder editable",
    supportResponseTarget: "Founder editable",
    scopeAssumptions: ["12-month minimum when a website is included", "Starter website framework", "Four social posts per month", "Monthly growth call included", "Third-party software costs billed separately"],
    escalationTriggers: ["E-commerce", "Custom applications", "Paid advertising", "Human cold calling", "Appointment setting", "Advanced automations", "Large content production", "Ownership transfer questions"]
  }),
  growthPartnership({
    id: "seed_offer_startup",
    slug: "startup-growth-partnership",
    name: "Startup",
    displayOrder: 2,
    monthlyPriceCents: null,
    priceRangeMinCents: 99700,
    priceRangeMaxCents: 199700,
    setupFeeCents: 50000,
    minimumTermMonths: null,
    idealCustomer: "Businesses with 1-5 employees, up to approximately $250,000 annual revenue, needing support across website, visibility, content, and lead capture.",
    included: ["Website support and management", "Social media management", "SEO", "Basic GEO", "Basic AEO", "Content creation", "Monthly reporting", "Email marketing", "Lead-capture forms", "Monthly strategy call", "Basic automations", "Website care", "Reputation foundation"],
    exclusions: ["Brand-new unlimited custom website by default", "Advanced integrations without approval", "Advertising spend", "Unlimited content"],
    approvedWording: "Startup is for businesses building consistent momentum that need coordinated visibility, website support, content, and lead capture.",
    websiteInclusion: "A website may be included, rebuilt, or substantially upgraded based on monthly price, minimum term, existing condition, required complexity, and Founder approval.",
    scopeAssumptions: ["Delivery limits are Founder editable", "Website inclusion is not automatic"],
    escalationTriggers: ["New website request", "Custom functionality", "E-commerce", "Heavy content needs"]
  }),
  growthPartnership({
    id: "seed_offer_growth",
    slug: "growth-partnership",
    name: "Growth",
    displayOrder: 3,
    monthlyPriceCents: null,
    priceRangeMinCents: 249700,
    priceRangeMaxCents: 499700,
    setupFeeCents: 100000,
    minimumTermMonths: null,
    idealCustomer: "Businesses with approximately 6-20 employees or $250,000-$2 million annual revenue seeking more leads, conversions, CRM support, and coordinated marketing.",
    included: ["Startup-approved services", "Paid-ad management", "Advanced SEO", "Advanced AEO", "Advanced GEO", "Video content creation", "CRM management", "Funnel management", "Reputation management", "Lead-generation campaigns", "Conversion optimization", "Quarterly growth strategy", "Vega-assisted outreach", "Sales pipeline reporting", "Campaign analytics"],
    exclusions: ["Advertising spend", "Third-party platform fees unless explicitly included", "Human cold calling unless added", "Appointment setting unless added"],
    approvedWording: "Growth is for established companies that need coordinated marketing, visibility, CRM, lead-generation, and revenue support.",
    websiteInclusion: "Website upgrades may be included only within approved scope and term assumptions.",
    scopeAssumptions: ["Ad spend remains separate", "Human outreach is an add-on unless explicitly included"],
    escalationTriggers: ["Ad spend questions", "Human calling", "Appointment setting", "High lead volume", "Multiple locations"]
  }),
  growthPartnership({
    id: "seed_offer_scale",
    slug: "scale-growth-partnership",
    name: "Scale",
    displayOrder: 4,
    monthlyPriceCents: null,
    priceRangeMinCents: 500000,
    priceRangeMaxCents: 1000000,
    setupFeeCents: 250000,
    minimumTermMonths: null,
    idealCustomer: "Businesses with approximately 21-50 employees or $2 million-$10 million annual revenue needing integrated marketing, technology, automation, reporting, and strategy.",
    included: ["Growth-approved services", "Fractional CTO support", "Fractional CAIO support", "AI strategy", "Workflow automation", "KPI dashboards", "Team training", "Custom integrations", "Process optimization", "Priority development queue", "Advanced reporting", "Data integration", "Department-level automation", "Custom Nova, Vega, Echo, or GEO deployment"],
    exclusions: ["Final pricing without discovery", "Custom SLAs without review", "Unapproved enterprise architecture"],
    approvedWording: "Scale is for companies that need integrated marketing, technology, automation, reporting, and fractional executive-level support.",
    websiteInclusion: "Website or application work requires discovery and Founder approval.",
    scopeAssumptions: ["Always requires discovery and Founder approval"],
    escalationTriggers: ["Any final pricing request", "Fractional executive support", "Custom integrations", "Security requirements"]
  }),
  {
    id: "seed_offer_enterprise",
    slug: "enterprise-custom-engagement",
    name: "Enterprise",
    offerType: OfferType.CustomEnterpriseEngagement,
    category: ServiceCategory.CustomDevelopment,
    shortExplanation: "Custom enterprise engagement for larger, complex, regulated, or multi-location organizations.",
    internalExplanation: "Enterprise must always show custom pricing after discovery and technical review.",
    problemsSolved: ["Complex digital operations", "Multi-location architecture", "Enterprise AI rollout", "Custom software needs", "Security and compliance planning"],
    idealCustomer: "Organizations with 50+ employees, $10 million+ revenue, multi-state operations, enterprise environments, regulated industries, or dedicated support needs.",
    includedDeliverables: ["SaaS development", "Custom software development", "Mobile application development", "Enterprise AI rollout", "Multi-location architecture", "Data and business intelligence", "Dedicated account team", "Priority support", "Executive consulting", "Security planning", "Custom integrations", "Custom SLAs", "Training programs"],
    optionalAddOns: [],
    oneTimePriceCents: null,
    monthlyPriceCents: null,
    priceRangeMinCents: null,
    priceRangeMaxCents: null,
    setupFeeCents: null,
    pricingStatus: PricingStatus.UnderReview,
    pricingBasis: PricingBasis.Custom,
    priceDisplayMode: PriceDisplayMode.CustomPricing,
    paymentTerms: "Custom pricing after discovery and technical review.",
    minimumEngagement: "Founder to define.",
    qualificationQuestions: ["How many employees and locations are involved?", "Are there regulatory or security requirements?", "What systems must integrate?", "Is a private deployment required?"],
    commonObjections: ["Can you quote this now?", "Can you guarantee an SLA?", "Can this be deployed privately?"],
    approvedResponse: "Custom pricing after discovery and technical review.",
    approvedWording: "Enterprise engagements require discovery and technical review before pricing, scope, timeline, or support terms are confirmed.",
    desiredNextStep: "Schedule discovery with Stephen.",
    alexMayQuote: false,
    employeeQuotePermission: false,
    founderApprovalRequired: true,
    customerFacingNotes: reviewNotice,
    displayOrder: 5,
    active: true
  },
  standaloneWebsite(),
  existingService("seed_service_website_care_plan", "website-care-plan", "Website Care Plan", OfferType.StandaloneService, ServiceCategory.WebsiteCare, null, 19700, "Current provisional reference: $197 per month.", ["Hosting", "Maintenance", "Security monitoring", "Backups", "Performance monitoring", "SEO monitoring", "Monthly edits"], ["Major changes", "Third-party fees", "E-commerce support unless approved"]),
  existingService("seed_service_digital_business_cards", "digital-business-card-service", "Digital Business Card Service", OfferType.ProductSubscription, ServiceCategory.DigitalBusinessCards, null, 2000, "Current provisional reference: $20 per card per month. Example: 20 cards equals $400 per month.", ["Personalized digital business card", "Business branding", "Contact information", "Tap or scan access", "Google review links", "Facebook review links"], ["Setup fee not approved", "NFC hardware", "Printing", "White-label option"]),
  existingService("seed_service_custom_ai_systems", "custom-ai-systems", "Custom AI Systems", OfferType.StandaloneService, ServiceCategory.CustomAISystems, null, null, "Pricing requires founder review after discovery.", ["Discovery", "Setup or implementation planning", "Monthly support structure", "Training options"], ["Final price before discovery"]),
  existingService("seed_service_seo_aeo_geo", "seo-aeo-geo-services", "SEO / AEO / GEO Services", OfferType.StandaloneService, ServiceCategory.SEOAEO_GEO, null, null, "Founder pricing approval required.", ["Initial audit fields", "Setup fields", "Monthly optimization fields", "Content fields", "GEO monitoring fields"], ["Guaranteed rankings", "Final pricing without approval"]),
  existingService("seed_service_lead_generation", "lead-generation-services", "Lead Generation Services", OfferType.StandaloneService, ServiceCategory.LeadGeneration, null, null, "Founder pricing approval required.", ["Setup fee fields", "Monthly platform fee fields", "Per-lead fields", "Appointment-setting fields", "CRM integration fields"], ["Confusing raw leads with booked appointments", "Guaranteed closed clients"]),
  existingService("seed_service_social_marketing", "social-media-and-marketing-services", "Social Media and Marketing Services", OfferType.StandaloneService, ServiceCategory.Marketing, null, null, "Founder pricing approval required.", ["Content package fields", "Posting package fields", "Video/reel fields", "Ad management fields", "Newsletter fields"], ["Advertising spend", "Guaranteed results"]),
  provisionalProduct("seed_product_geo_audit", "geo-visibility-audit", "GEO Visibility Audit", ServiceCategory.SEOAEO_GEO, ["Audit fee", "Reporting fee", "Website remediation fee"]),
  provisionalProduct("seed_product_geo_setup", "geo-setup-and-remediation", "GEO Setup and Remediation", ServiceCategory.SEOAEO_GEO, ["Setup fee", "Content fee", "Citation fee", "Website remediation fee"]),
  provisionalProduct("seed_product_geo_monthly", "monthly-geo-management", "Monthly GEO Management", ServiceCategory.SEOAEO_GEO, ["Monthly fee", "Content fee", "Reporting fee", "GEO monitoring"]),
  provisionalProduct("seed_product_vega_setup", "vega-setup", "Vega Setup", ServiceCategory.LeadGeneration, ["Setup fee", "CRM integration fee", "Data-provider costs", "AI usage costs"]),
  provisionalProduct("seed_product_vega_subscription", "vega-platform-subscription", "Vega Platform Subscription", ServiceCategory.LeadGeneration, ["Monthly platform fee", "Lead volume", "Email volume", "AI usage costs"]),
  provisionalProduct("seed_product_echo_content", "echo-content-generation", "Echo Content Generation", ServiceCategory.Marketing, ["Monthly content volume", "Posts", "Blogs", "Newsletters", "Approval workflow"]),
  provisionalProduct("seed_product_echo_managed_social", "managed-social-media", "Managed Social Media", ServiceCategory.SocialMedia, ["Platforms", "Posts", "Videos", "Reels", "Community management", "Reporting"]),
  provisionalProduct("seed_product_nova_dashboard", "nova-executive-dashboard", "Nova Executive Dashboard", ServiceCategory.CustomAISystems, ["Setup", "Monthly license", "User count", "Data-source integrations", "Hosting", "API usage"]),
  provisionalProduct("seed_product_nova_operations", "nova-operations-assistant", "Nova Operations Assistant", ServiceCategory.CustomAISystems, ["Setup", "Monthly license", "Department integrations", "Training", "Ongoing support"])
];

export async function seedPricing(prisma: PrismaLike, founderId: string) {
  for (const offer of offers) {
    const saved = await prisma.serviceOffering.upsert({
      where: { id: offer.id },
      update: { ...offer, updatedById: founderId },
      create: { ...offer, updatedById: founderId, effectiveDate: new Date(Date.UTC(2026, 6, 21)) }
    });

    if (saved.id === "seed_service_digital_business_cards") {
      await prisma.setupFee.upsert({
        where: { id: "seed_setup_digital_business_cards_founder_required" },
        update: { approvalRequired: true, priceCents: null, notes: "Founder approval required. Do not invent setup fee." },
        create: {
          id: "seed_setup_digital_business_cards_founder_required",
          serviceId: saved.id,
          name: "Setup fee",
          approvalRequired: true,
          notes: "Founder approval required. Do not invent setup fee."
        }
      });
    }
  }

  const attachTargets = await prisma.serviceOffering.findMany({ select: { id: true } });
  const targetIds = new Set(attachTargets.map((target) => target.id));
  for (const target of ["seed_offer_founder_launch", "seed_offer_growth", "seed_service_lead_generation", "seed_service_social_marketing", "seed_service_seo_aeo_geo"]) {
    if (!targetIds.has(target)) continue;
    for (const name of addOns) {
      await prisma.serviceAddOn.upsert({
        where: { id: `seed_addon_${target}_${slug(name)}` },
        update: { active: true, approvalRequired: true },
        create: {
          id: `seed_addon_${target}_${slug(name)}`,
          serviceId: target,
          name,
          description: "Founder-editable add-on. Pricing intentionally not seeded.",
          approvalRequired: true
        }
      });
    }
  }
}

function growthPartnership(input: {
  id: string;
  slug: string;
  name: string;
  displayOrder: number;
  monthlyPriceCents: number | null;
  priceRangeMinCents: number;
  priceRangeMaxCents: number;
  setupFeeCents: number;
  minimumTermMonths: number | null;
  idealCustomer: string;
  included: string[];
  exclusions: string[];
  approvedWording: string;
  websiteInclusion: string;
  pageAllowance?: string;
  revisionAllowance?: string;
  supportResponseTarget?: string;
  scopeAssumptions: string[];
  escalationTriggers: string[];
}) {
  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    offerType: OfferType.GrowthPartnership,
    category: ServiceCategory.Marketing,
    shortExplanation: `${input.name} is a proposed Ghost Growth Partnership tier for ongoing monthly support across multiple business functions.`,
    internalExplanation: `${input.name} is under Founder review and may be used for training and pricing workshop discussion only.`,
    problemsSolved: ["Fragmented growth work", "Website and visibility gaps", "Inconsistent marketing", "Lead follow-up gaps", "Need for ongoing strategy"],
    idealCustomer: input.idealCustomer,
    includedDeliverables: input.included,
    optionalAddOns: addOns,
    oneTimePriceCents: null,
    monthlyPriceCents: input.monthlyPriceCents,
    priceRangeMinCents: input.priceRangeMinCents,
    priceRangeMaxCents: input.priceRangeMaxCents,
    setupFeeCents: input.setupFeeCents,
    pricingStatus: PricingStatus.UnderReview,
    pricingBasis: PricingBasis.MonthlyRetainer,
    priceDisplayMode: PriceDisplayMode.Range,
    paymentTerms: "Monthly partnership. Final terms require Founder approval.",
    minimumEngagement: input.minimumTermMonths ? `${input.minimumTermMonths}-month minimum when configured conditions apply.` : "Founder editable.",
    minimumTermMonths: input.minimumTermMonths,
    cancellationTerms: "Founder editable per offer.",
    earlyCancellationTerms: "Early cancellation may trigger website buyout when a website is included.",
    typicalTimeline: "Founder to approve after discovery.",
    qualificationQuestions: ["Is the business looking for one solution or ongoing support across several areas?", "What is the business age?", "How many employees are involved?", "What broad revenue range fits?", "What is the current lead flow?", "What is the main pain point?"],
    commonObjections: ["Can you quote this now?", "Is a website included?", "Is ad spend included?", "Are results guaranteed?"],
    approvedResponse: reviewNotice,
    desiredNextStep: "Qualify needs, then request Founder review before quoting.",
    alexMayQuote: false,
    employeeQuotePermission: false,
    founderApprovalRequired: true,
    financingStatus: FinancingStatus.FinancingApplicationRequired,
    financingNotes: "Financing options may be available for qualified businesses, subject to approval and final terms.",
    websiteIncluded: true,
    websiteInclusion: input.websiteInclusion,
    pageAllowance: input.pageAllowance,
    revisionAllowance: input.revisionAllowance,
    websiteOwnershipTerms: "Founder editable. Do not promise ownership transfer without checking the agreement.",
    supportResponseTarget: input.supportResponseTarget,
    reportingFrequency: input.name === "Growth" || input.name === "Scale" ? "Founder editable; may be monthly or more frequent." : "Monthly performance summary.",
    meetingFrequency: input.name === "Growth" ? "Quarterly growth strategy plus Founder-editable cadence." : "Monthly growth call unless Founder edits.",
    scopeAssumptions: input.scopeAssumptions,
    exclusions: input.exclusions,
    customerFacingNotes: reviewNotice,
    customerFacingInclusions: input.included,
    customerFacingExclusions: input.exclusions,
    approvedWording: input.approvedWording,
    escalationTriggers: input.escalationTriggers,
    upgradePath: "Move to a higher partnership tier when scope, lead volume, locations, support burden, or integrations increase.",
    downgradePath: "Move to a standalone offer when the business only needs one specific solution.",
    requiredAcknowledgement: "I understand this pricing is under Founder review and may not be quoted externally.",
    active: true,
    displayOrder: input.displayOrder,
    reviewPriority: input.displayOrder,
    reviewPriorityLabel: input.displayOrder <= 4 ? "Initial approval priority before Alex begins outreach." : "Secondary review."
  };
}

function standaloneWebsite() {
  return {
    id: "seed_service_custom_website_build",
    slug: "custom-website-build",
    name: "Standalone Custom Website",
    offerType: OfferType.StandaloneService,
    category: ServiceCategory.Websites,
    shortExplanation: "A standalone website project for customers who want a website without a broad Growth Partnership.",
    internalExplanation: "Preserves the existing $2,000 reference as a provisional standalone offer, not Ghost's default positioning.",
    problemsSolved: ["Outdated website", "Poor mobile experience", "Weak first impression", "Missing contact flow"],
    idealCustomer: "Customer who wants a straightforward small-business website, prefers a one-time project, or does not want a long-term monthly agreement.",
    includedDeliverables: ["Custom website design", "Development", "Mobile responsiveness", "Standard contact forms", "Basic performance optimization", "Unlimited revisions during the initial build until approved scope is completed"],
    optionalAddOns: ["Starter Website", "Growth Website", "Premium Website", "E-commerce Website", "Custom Web Application", "Portal or Dashboard"],
    oneTimePriceCents: 200000,
    monthlyPriceCents: null,
    standardPriceCents: 200000,
    pricingStatus: PricingStatus.UnderReview,
    pricingBasis: PricingBasis.Project,
    priceDisplayMode: PriceDisplayMode.Fixed,
    paymentTerms: "50% deposit to begin. 50% due at completion.",
    minimumEngagement: "Founder to approve final scope.",
    typicalTimeline: "Founder confirms timeline after reviewing scope.",
    qualificationQuestions: ["Is this a standalone website buyer or better fit for a partnership?", "What pages are needed?", "Are e-commerce, portals, dashboards, or custom apps required?", "Is content ready?"],
    commonObjections: ["Can I just buy the website?", "Do I have to sign up monthly?", "Can this include an app or e-commerce?"],
    approvedResponse: reviewNotice,
    desiredNextStep: "Confirm whether standalone website, partnership, or subscription model fits best.",
    alexMayQuote: false,
    employeeQuotePermission: false,
    founderApprovalRequired: true,
    financingStatus: FinancingStatus.FinancingApplicationRequired,
    financingNotes: "Financing options may be available for qualified businesses, subject to approval and final terms.",
    websiteIncluded: false,
    websiteOwnershipTerms: "Project ownership and transfer terms require Founder-approved agreement.",
    scopeAssumptions: ["Straightforward small-business website", "No advanced application functionality", "No e-commerce unless separately approved"],
    exclusions: ["Custom applications", "E-commerce", "Complex integrations", "Large content migration", "Enterprise security", "Unusual deadlines"],
    customerFacingNotes: reviewNotice,
    customerFacingInclusions: ["Standalone website project", "Mobile-responsive build", "Standard contact forms"],
    customerFacingExclusions: ["Advanced functionality", "Custom applications", "E-commerce unless approved"],
    approvedWording: "We can support one specific need, such as a standalone website, or we can become an ongoing growth partner across several areas of the business.",
    escalationTriggers: ["Custom portal", "E-commerce", "Complex integration", "Large content migration", "Custom AI", "Multi-location architecture", "Enterprise security", "Unusual deadline"],
    active: true,
    displayOrder: 20,
    reviewPriority: 3,
    reviewPriorityLabel: "Initial approval priority: standalone website reference."
  };
}

function existingService(id: string, slugValue: string, name: string, offerType: OfferType, category: ServiceCategory, oneTimePriceCents: number | null, monthlyPriceCents: number | null, note: string, included: string[], exclusions: string[]) {
  return {
    id,
    slug: slugValue,
    name,
    offerType,
    category,
    shortExplanation: `${name} is available as a ${offerType === OfferType.ProductSubscription ? "standalone product subscription" : "standalone service"} when it fits the prospect's needs.`,
    internalExplanation: `${note} ${reviewNotice}`,
    problemsSolved: ["Specific operational or growth need", "Standalone buyer fit", "Clearer scope before broader partnership"],
    idealCustomer: "Prospect who needs this specific solution without necessarily entering a broad Growth Partnership.",
    includedDeliverables: included,
    optionalAddOns: [],
    oneTimePriceCents,
    monthlyPriceCents,
    standardPriceCents: oneTimePriceCents,
    standardMonthlyPriceCents: monthlyPriceCents,
    pricingStatus: PricingStatus.UnderReview,
    pricingBasis: offerType === OfferType.ProductSubscription ? PricingBasis.Subscription : monthlyPriceCents ? PricingBasis.MonthlyRetainer : PricingBasis.Project,
    priceDisplayMode: oneTimePriceCents || monthlyPriceCents ? PriceDisplayMode.Fixed : PriceDisplayMode.FounderReviewRequired,
    paymentTerms: note,
    minimumEngagement: "Founder editable.",
    typicalTimeline: "Founder to approve after scope review.",
    qualificationQuestions: ["Is this a standalone need or part of a broader business growth problem?", "What outcome does the business want?", "What current tools or vendors are involved?"],
    commonObjections: ["Can you quote this now?", "What is included?", "Can this be bundled with other services?"],
    approvedResponse: reviewNotice,
    desiredNextStep: "Gather context and request Founder review before quoting.",
    alexMayQuote: false,
    employeeQuotePermission: false,
    founderApprovalRequired: true,
    financingStatus: FinancingStatus.FinancingApplicationRequired,
    financingNotes: "Financing options may be available for qualified businesses, subject to approval and final terms.",
    scopeAssumptions: ["Standard assumptions require Founder approval before quoting externally."],
    exclusions,
    customerFacingNotes: reviewNotice,
    customerFacingInclusions: included,
    customerFacingExclusions: exclusions,
    approvedWording: "Ghost can support one specific solution or recommend an ongoing Growth Partnership when several areas need to work together.",
    escalationTriggers: ["Discount request", "Custom scope", "Unclear terms", "Unapproved add-ons", "Pricing question"],
    active: true,
    displayOrder: offerType === OfferType.ProductSubscription ? 40 : 30,
    reviewPriority: priorityFor(id),
    reviewPriorityLabel: priorityFor(id) <= 7 ? "Initial approval priority before Alex begins outreach." : "Secondary review."
  };
}

function provisionalProduct(id: string, slugValue: string, name: string, category: ServiceCategory, editableFields: string[]) {
  return {
    id,
    slug: slugValue,
    name,
    offerType: OfferType.ProductSubscription,
    category,
    shortExplanation: `${name} is a provisional standalone product offer pending Founder pricing approval.`,
    internalExplanation: `Founder pricing approval required. Editable pricing fields: ${editableFields.join(", ")}.`,
    problemsSolved: ["Standalone product need", "Specific system or visibility gap"],
    idealCustomer: "Prospect with a focused need that may not require a full Growth Partnership.",
    includedDeliverables: editableFields,
    optionalAddOns: [],
    oneTimePriceCents: null,
    monthlyPriceCents: null,
    pricingStatus: PricingStatus.UnderReview,
    pricingBasis: PricingBasis.Subscription,
    priceDisplayMode: PriceDisplayMode.FounderReviewRequired,
    paymentTerms: "Founder pricing approval required.",
    minimumEngagement: "Founder editable.",
    typicalTimeline: "Founder to approve.",
    qualificationQuestions: ["What is the specific problem?", "Is this better as a standalone product or partnership component?", "What systems must connect?"],
    commonObjections: ["Can you quote this now?", "Is this a lead or an appointment?", "What platform fees are separate?"],
    approvedResponse: reviewNotice,
    desiredNextStep: "Gather context and request Founder pricing approval.",
    alexMayQuote: false,
    employeeQuotePermission: false,
    founderApprovalRequired: true,
    customerFacingNotes: reviewNotice,
    customerFacingInclusions: editableFields,
    customerFacingExclusions: ["Final pricing before Founder approval"],
    approvedWording: "This offer is available for focused needs, but pricing requires Founder approval before it can be quoted.",
    escalationTriggers: ["Pricing request", "Discount request", "Custom scope", "Integration needs"],
    active: true,
    displayOrder: 50,
    reviewPriority: priorityFor(id),
    reviewPriorityLabel: priorityFor(id) <= 7 ? "Initial approval priority before Alex begins outreach." : "Secondary review.",
    customPricingFields: { editableFields }
  };
}

function priorityFor(id: string) {
  if (id === "seed_service_website_care_plan") return 4;
  if (id === "seed_product_geo_audit") return 5;
  if (id === "seed_product_vega_setup") return 6;
  if (id === "seed_service_digital_business_cards") return 7;
  return 99;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
