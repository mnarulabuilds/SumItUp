import { AuthenticatedRequest } from "@/types";
import { Response } from "express";
import urlContentService from "../../services/summary/UrlContentService";
import textSummarizationService from "../../services/summary/TextSummarizationService";
import { AppError } from "../../lib/errors/AppError";
import handleControllerError from "../../lib/http/handleControllerError";

export async function generateUrlSummary(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ error: "URL is required" });
      return;
    }

    const textContent = await urlContentService.extractMainText(url);
    const summary = await textSummarizationService.summarizeCached(textContent);

    res.status(200).json({
      summary: summary || "Could not generate summary from content.",
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    handleControllerError(
      res,
      error,
      "Failed to process URL. Ensure it is accessible."
    );
  }
}
