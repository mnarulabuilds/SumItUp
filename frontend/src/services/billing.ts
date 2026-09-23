import api from "./api";

export async function fetchWallet() {
  const { data } = await api.get("/billing/wallet");
  return data;
}

export async function fetchPlans() {
  const { data } = await api.get("/billing/plans");
  return data.plans;
}

export async function subscribeToPlan(planId: string) {
  const { data } = await api.post("/billing/subscribe", { planId });
  return data;
}

export async function topUpWallet(amountCents: number) {
  const { data } = await api.post("/billing/wallet/top-up", { amountCents });
  return data;
}

export async function watchAdEarnTokens(adId: string) {
  const { data } = await api.post("/token/earn", { adId });
  return data;
}

export async function createDonation(amountCents: number, message?: string) {
  const { data } = await api.post("/donations", { amountCents, message });
  return data;
}
