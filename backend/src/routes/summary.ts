import express from "express";
import summaryController from "../controllers/summary";
import authMiddleware from "../middleware/auth";
import asyncHandler from "../lib/http/asyncHandler";

const router = express.Router();

router.use(authMiddleware as express.RequestHandler);

router.post(
  "/generate/audio",
  asyncHandler(summaryController.generateAudioSummary as express.RequestHandler)
);
router.post(
  "/generate/image",
  asyncHandler(summaryController.generateImageSummary as express.RequestHandler)
);
router.post(
  "/generate/video",
  asyncHandler(summaryController.generateVideoSummary as express.RequestHandler)
);
router.post(
  "/generate/gif",
  asyncHandler(summaryController.generateGifSummary as express.RequestHandler)
);
router.post(
  "/generate/url",
  asyncHandler(summaryController.generateUrlSummary as express.RequestHandler)
);
router.post(
  "/generate/book",
  asyncHandler(summaryController.generateBookSummary as express.RequestHandler)
);
router.post(
  "/generate/pdf",
  asyncHandler(summaryController.generatePDFSummary as express.RequestHandler)
);
router.post(
  "/generate/meeting",
  asyncHandler(summaryController.generateMeetingSummary as express.RequestHandler)
);

export default router;
