import { AuthenticatedRequest } from "@/types";
import { Response } from "express";
import { resolveUploadPath, assertUploadExists } from "../../utils/files/uploadPaths";
import speechToTextService from "../../services/transcription/SpeechToTextService";
import textSummarizationService from "../../services/summary/TextSummarizationService";
import { AppError } from "../../lib/errors/AppError";
import handleControllerError from "../../lib/http/handleControllerError";

export async function generateMeetingSummary(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { meetingData } = req.body;
    const fileRef = meetingData?.recordingFileName || meetingData?.audioFileName;
    if (!fileRef) {
      res.status(400).json({ error: "Meeting recording file is required" });
      return;
    }

    const filePath = resolveUploadPath(fileRef);
    assertUploadExists(filePath, "Meeting recording not found");

    const transcript = await speechToTextService.transcribeFile(filePath);
    const title = meetingData?.title ? `Meeting: ${meetingData.title}\n\n` : "";

    const summary = await textSummarizationService.summarizeCached(
      `${title}${transcript}`,
      {
        length: "long",
        style: "insights",
      }
    );

    res.status(200).json({
      summary,
      meetingTitle: meetingData?.title || null,
      transcriptLength: transcript.length,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    handleControllerError(res, error, "Failed to summarize meeting");
  }
}
