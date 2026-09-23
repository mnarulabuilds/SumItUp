import fs from "fs";
import path from "path";
import audioUtils from "../../utils/audio";
import textSummarizationService from "../../services/summary/TextSummarizationService";
import { resolveUploadPath } from "../../utils/files/uploadPaths";
import { AuthenticatedRequest } from "@/types";
import { Response } from "express";
import handleControllerError from "../../lib/http/handleControllerError";

const LEGACY_DIR = path.resolve("src/utils/audio/audios/");

function resolveAudioFilePath(audioFileName: string): string | null {
  try {
    return resolveUploadPath(audioFileName);
  } catch {
    return null;
  }
}

export async function generateAudioSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { audioData } = req.body;

    if (!audioData || !audioData.audioFileName || !audioData.format) {
      res.status(400).json({ error: "Invalid audio data provided." });
      return;
    }

    if (!["mp3", "wav"].includes(audioData.format)) {
      res.status(400).json({ error: "Audio format not supported" });
      return;
    }

    let filePath = resolveAudioFilePath(audioData.audioFileName);
    if (!filePath || !fs.existsSync(filePath)) {
      filePath = path.resolve(LEGACY_DIR, path.basename(audioData.audioFileName));
      if (!fs.existsSync(filePath)) {
        res.status(400).json({ error: "Audio file not found." });
        return;
      }
    }

    const textFromAudio = await audioUtils.convertAudioToText(filePath);

    if (!textFromAudio) {
      res.status(400).json({ error: "No text found in the audio." });
      return;
    }

    const summary = await textSummarizationService.summarizeCached(textFromAudio);

    res.status(200).json({ summary });
  } catch (error) {
    handleControllerError(res, error, "Internal Server Error");
  }
}

export default generateAudioSummary;
