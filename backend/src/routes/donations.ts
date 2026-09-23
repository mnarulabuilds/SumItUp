import express from "express";
import authMiddleware from "../middleware/auth";
import asyncHandler from "../lib/http/asyncHandler";
import donationsController from "../controllers/donations";

const router = express.Router();

router.use(authMiddleware as express.RequestHandler);

router.post("/", asyncHandler(donationsController.createDonation as express.RequestHandler));
router.get("/mine", asyncHandler(donationsController.listMyDonations as express.RequestHandler));

export default router;
