import { Response } from "express";
import User from "../../models/User";
import { AuthenticatedRequest } from "../../types";
import { BILLING_PLANS } from "../../config/billingPlans";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function getPlans(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(200).json({ plans: BILLING_PLANS });
}

export async function getWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.status(200).json({
    tokens: user.tokens,
    walletBalanceCents: user.walletBalanceCents,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    adEligible: user.adEligible,
  });
}

export async function subscribe(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const { planId } = req.body as { planId?: string };

  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const plan = BILLING_PLANS.find((p) => p.id === planId);
  if (!plan || plan.id === "free") {
    res.status(400).json({ error: "Invalid subscription plan" });
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.walletBalanceCents < plan.priceCents) {
    res.status(402).json({
      error: "Insufficient wallet balance. Top up your wallet to subscribe.",
      requiredCents: plan.priceCents,
      walletBalanceCents: user.walletBalanceCents,
    });
    return;
  }

  user.walletBalanceCents -= plan.priceCents;
  user.subscriptionPlan = plan.id;
  user.subscriptionExpiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
  user.tokens += plan.tokensIncluded;
  user.adEligible = plan.id === "free";
  await user.save();

  res.status(200).json({
    message: `Subscribed to ${plan.name}`,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    tokens: user.tokens,
    walletBalanceCents: user.walletBalanceCents,
  });
}

export async function topUpWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const { amountCents } = req.body as { amountCents?: number };

  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!amountCents || amountCents < 100 || amountCents > 50000) {
    res.status(400).json({ error: "amountCents must be between 100 and 50000" });
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  user.walletBalanceCents += amountCents;
  await user.save();

  res.status(200).json({
    message: "Wallet topped up (demo ledger — integrate Stripe for production payments)",
    walletBalanceCents: user.walletBalanceCents,
  });
}

const billingController = {
  getPlans,
  getWallet,
  subscribe,
  topUpWallet,
};

export default billingController;
