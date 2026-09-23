import express from "express";
import authMiddleware from "../middleware/auth";
import asyncHandler from "../lib/http/asyncHandler";
import billingController from "../controllers/billing";

const router = express.Router();

router.use(authMiddleware as express.RequestHandler);

router.get("/plans", asyncHandler(billingController.getPlans as express.RequestHandler));
router.get("/wallet", asyncHandler(billingController.getWallet as express.RequestHandler));
router.post("/subscribe", asyncHandler(billingController.subscribe as express.RequestHandler));
router.post("/wallet/top-up", asyncHandler(billingController.topUpWallet as express.RequestHandler));

export default router;
