import { AuthenticatedRequest } from "@/types";
import { Response } from "express";
import { resolveUploadPath, assertUploadExists } from "../../utils/files/uploadPaths";
import speechToTextService from "../../services/transcription/SpeechToTextService";
import textSummarizationService from "../../services/summary/TextSummarizationService";
import { AppError } from "../../lib/errors/AppError";
import handleControllerError from "../../lib/http/handleControllerError";

export async function generateVideoSummary(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { videoData } = req.body;

    const fileRef = videoData?.videoFileName || videoData?.videoUrl;
    if (!fileRef) {
      res.status(400).json({ error: "Video file is required" });
      return;
    }

    const filePath = resolveUploadPath(fileRef);
    assertUploadExists(filePath, "Video file not found");

    const transcript = await speechToTextService.transcribeFile(filePath);
    const summary = await textSummarizationService.summarizeCached(transcript, {
      length: "medium",
      style: "bullets",
    });

    res.status(200).json({ summary, transcriptLength: transcript.length });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    handleControllerError(res, error, "Failed to process video");
  }
}
