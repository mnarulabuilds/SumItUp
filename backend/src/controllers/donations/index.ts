import { Response } from "express";
import User from "../../models/User";
import Donation from "../../models/Donation";
import { AuthenticatedRequest } from "../../types";

export async function createDonation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const { amountCents, message } = req.body as {
    amountCents?: number;
    message?: string;
  };

  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!amountCents || amountCents < 100 || amountCents > 100000) {
    res.status(400).json({ error: "Donation must be between $1 and $1000" });
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.walletBalanceCents < amountCents) {
    res.status(402).json({
      error: "Insufficient wallet balance for donation",
      walletBalanceCents: user.walletBalanceCents,
    });
    return;
  }

  user.walletBalanceCents -= amountCents;
  await user.save();

  const donation = await Donation.create({
    userId,
    amountCents,
    message,
    status: "completed",
  });

  res.status(201).json({
    message: "Thank you for supporting SumItUp!",
    donationId: donation._id,
    walletBalanceCents: user.walletBalanceCents,
  });
}

export async function listMyDonations(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const donations = await Donation.find({ userId }).sort({ createdAt: -1 }).limit(20);
  res.status(200).json({ donations });
}

const donationsController = {
  createDonation,
  listMyDonations,
};

export default donationsController;
