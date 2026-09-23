export interface BillingPlan {
  id: "free" | "plus" | "pro";
  name: string;
  priceCents: number;
  interval: "month";
  tokensIncluded: number;
  adFree: boolean;
  features: string[];
}

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    priceCents: 0,
    interval: "month",
    tokensIncluded: 100,
    adFree: false,
    features: ["Basic summaries", "Watch ads to earn tokens"],
  },
  {
    id: "plus",
    name: "Plus",
    priceCents: 999,
    interval: "month",
    tokensIncluded: 1000,
    adFree: true,
    features: ["Higher quality summaries", "Ad-free experience", "Meeting summaries"],
  },
  {
    id: "pro",
    name: "Pro",
    priceCents: 1999,
    interval: "month",
    tokensIncluded: 5000,
    adFree: true,
    features: ["Priority processing", "Long-form content", "All Plus features"],
  },
];

export default BILLING_PLANS;
