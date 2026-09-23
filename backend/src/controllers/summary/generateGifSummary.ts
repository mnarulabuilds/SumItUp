import imageService from "../../services/summary/image";
import { resolveUploadPath, assertUploadExists } from "../../utils/files/uploadPaths";
import { AuthenticatedRequest } from "@/types";
import { Response } from "express";
import { AppError } from "../../lib/errors/AppError";
import handleControllerError from "../../lib/http/handleControllerError";

export async function generateGifSummary(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const filename = req.body.imageData || req.body.gifData?.gifUrl;

    if (!filename) {
      res.status(400).json({ error: "GIF filename is required" });
      return;
    }

    const filepath = resolveUploadPath(filename);
    assertUploadExists(filepath, "GIF file not found");

    const summary = await imageService.generateSummaryFromImage(filepath);
    res.status(200).json({
      summary,
      note: "GIF summarization uses visual classification on the source file; animated frame OCR may be limited.",
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    handleControllerError(res, error, "Failed to generate GIF summary");
  }
}
