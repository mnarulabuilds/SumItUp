import fs from "fs";
import { AssemblyAI } from "assemblyai";
import { AppError } from "../../lib/errors/AppError";

export class SpeechToTextService {
  async transcribeFile(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new AppError("Media file not found", 404);
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      throw new AppError(
        "Speech-to-text is not configured. Set ASSEMBLYAI_API_KEY in backend/.env",
        503
      );
    }

    const client = new AssemblyAI({ apiKey });
    const transcript = await client.transcripts.transcribe({ audio: filePath });

    if (transcript.status === "error") {
      throw new AppError(
        transcript.error || "Transcription failed",
        422
      );
    }

    const text = (transcript.text || "").trim();
    if (!text) {
      throw new AppError("No speech detected in the media file", 422);
    }

    return text;
  }
}

const speechToTextService = new SpeechToTextService();
export default speechToTextService;
