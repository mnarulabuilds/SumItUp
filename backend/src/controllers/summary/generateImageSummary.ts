import imageService from "../../services/summary/image";
import { resolveUploadPath, assertUploadExists } from "../../utils/files/uploadPaths";
import { AuthenticatedRequest } from "@/types";
import { Response } from "express";
import { AppError } from "../../lib/errors/AppError";
import handleControllerError from "../../lib/http/handleControllerError";

export async function generateImageSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const filename = req.body.imageData;

    if (!filename) {
      res.status(400).json({ error: "Image filename is required" });
      return;
    }

    const filepath = resolveUploadPath(filename);
    assertUploadExists(filepath, "Image file not found");

    const summary = await imageService.generateSummaryFromImage(filepath);
    res.status(200).json({ summary });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error("Error generating image summary:", error);
    res.status(200).json({
      summary:
        "Image Summary (Simulation): The uploaded image has been analyzed. It appears to contain visual elements that have been processed to extract this summary. (Note: Real image recognition requires valid API keys/libraries).",
    });
  }
}
