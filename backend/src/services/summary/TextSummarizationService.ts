import crypto from "crypto";
import textUtils from "../../utils/text";
import cacheService from "../../cache";

const SUMMARY_CACHE_TTL_SECONDS = 60 * 30;

function cacheKeyForText(text: string): string {
  const hash = crypto.createHash("sha256").update(text).digest("hex");
  return `summary:text:${hash}`;
}

export class TextSummarizationService {
  summarize(text: string): string {
    if (!text || !text.trim()) {
      return "";
    }
    return textUtils.generateSummaryFromText(text);
  }

  /** Summarize with in-memory cache for identical input text. */
  async summarizeCached(text: string): Promise<string> {
    const normalized = text.trim();
    if (!normalized) {
      return "";
    }

    const key = cacheKeyForText(normalized);
    const cached = cacheService.get<string>(key);
    if (cached !== undefined) {
      return cached;
    }

    const summary = this.summarize(normalized);
    cacheService.set(key, summary, SUMMARY_CACHE_TTL_SECONDS);
    return summary;
  }
}

const textSummarizationService = new TextSummarizationService();

export default textSummarizationService;
