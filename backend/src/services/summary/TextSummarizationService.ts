import crypto from "crypto";
import axios from "axios";
import textUtils from "../../utils/text";
import cacheService from "../../cache";
import { SummaryOptions } from "./SummaryOptions";

const SUMMARY_CACHE_TTL_SECONDS = 60 * 30;

function cacheKeyForText(text: string, options?: SummaryOptions): string {
  const hash = crypto
    .createHash("sha256")
    .update(text)
    .update(JSON.stringify(options || {}))
    .digest("hex");
  return `summary:text:${hash}`;
}

async function summarizeWithOpenAI(text: string, options?: SummaryOptions): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const lengthGuide =
    options?.length === "short"
      ? "2-3 sentences"
      : options?.length === "long"
        ? "8-10 sentences"
        : "4-6 sentences";

  const styleGuide =
    options?.style === "bullets"
      ? "Use bullet points."
      : options?.style === "insights"
        ? "Use numbered key insights."
        : "Use clear paragraphs.";

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: process.env.OPENAI_SUMMARY_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an expert summarizer. Preserve facts, names, and decisions. Avoid hallucination.",
        },
        {
          role: "user",
          content: `Summarize the following content in ${lengthGuide}. ${styleGuide}\n\n${text.slice(0, 120000)}`,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : null;
}

export class TextSummarizationService {
  summarize(text: string, options?: SummaryOptions): string {
    if (!text || !text.trim()) {
      return "";
    }
    return textUtils.generateSummaryFromText(text, options || {});
  }

  async summarizeCached(text: string, options?: SummaryOptions): Promise<string> {
    const normalized = text.trim();
    if (!normalized) {
      return "";
    }

    const key = cacheKeyForText(normalized, options);
    const cached = cacheService.get<string>(key);
    if (cached !== undefined) {
      return cached;
    }

    let summary: string | null = null;
    try {
      summary = await summarizeWithOpenAI(normalized, options);
    } catch (error) {
      console.warn("OpenAI summarization unavailable, using extractive fallback.", error);
    }

    if (!summary) {
      summary = this.summarize(normalized, options);
    }

    cacheService.set(key, summary, SUMMARY_CACHE_TTL_SECONDS);
    return summary;
  }
}

const textSummarizationService = new TextSummarizationService();

export default textSummarizationService;
