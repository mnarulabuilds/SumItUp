import fs from "fs";
const pdf = require("pdf-parse");
import textSummarizationService from "../../services/summary/TextSummarizationService";
import { resolveUploadPath, assertUploadExists } from "../../utils/files/uploadPaths";
import { AuthenticatedRequest } from "@/types";
import { Response } from "express";
import handleControllerError from "../../lib/http/handleControllerError";
import { AppError } from "../../lib/errors/AppError";

export async function generatePDFSummary(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { pdfData } = req.body;

    if (!pdfData || !pdfData.pdfUrl) {
      res.status(400).json({ error: "PDF filename is required" });
      return;
    }

    const filepath = resolveUploadPath(pdfData.pdfUrl);
    assertUploadExists(filepath, "PDF file not found");

    const dataBuffer = fs.readFileSync(filepath);

    let textContent = "";
    try {
      const data = await pdf(dataBuffer);
      textContent = data.text;
    } catch (pdfError) {
      console.error("PDF parsing critical failure:", pdfError);
      res.status(500).json({ error: "Failed to parse PDF document structure." });
      return;
    }

    const cleanText = textContent.replace(/\s+/g, " ").trim();

    if (cleanText.length < 50) {
      res.status(400).json({
        error: "PDF contains insufficient text. Ensure it is not a scanned image.",
        details: `Extracted only ${cleanText.length} characters.`,
      });
      return;
    }

    const summary = await textSummarizationService.summarizeCached(cleanText);

    res.status(200).json({
      summary: summary || "Summary generation yielded no result.",
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    handleControllerError(res, error, "Internal Server Error during PDF processing");
  }
}
