export type SummaryLength = "short" | "medium" | "long";
export type SummaryStyle = "paragraph" | "bullets" | "insights";

export interface SummaryOptions {
  length?: SummaryLength;
  style?: SummaryStyle;
}

export function resolveSentenceCount(length: SummaryLength | undefined, totalSentences: number): number {
  const ratio =
    length === "short" ? 0.2 : length === "long" ? 0.45 : 0.3;
  const cap = length === "short" ? 4 : length === "long" ? 10 : 6;
  return Math.max(2, Math.min(cap, Math.floor(totalSentences * ratio)));
}

export default SummaryOptions;
