const natural = require("natural");
const stopwords = require("stopwords").english;

const tokenizer = new natural.WordTokenizer();
const sentenceTokenizer = new natural.SentenceTokenizer();

function sentenceSimilarity(sent1, sent2) {
  const tokens1 = tokenizer.tokenize(sent1).map((t) => t.toLowerCase());
  const tokens2 = tokenizer.tokenize(sent2).map((t) => t.toLowerCase());

  const allTokens = new Set([...tokens1, ...tokens2]);
  const tokenList = Array.from(allTokens).filter((t) => !stopwords.includes(t));

  if (tokenList.length === 0) return 0;

  const vec1 = tokenList.map((t) => (tokens1.includes(t) ? 1 : 0));
  const vec2 = tokenList.map((t) => (tokens2.includes(t) ? 1 : 0));

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < tokenList.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

function pickSentenceCount(totalSentences, options = {}) {
  const length = options.length || "medium";
  const ratio = length === "short" ? 0.2 : length === "long" ? 0.45 : 0.3;
  const cap = length === "short" ? 4 : length === "long" ? 10 : 6;
  return Math.max(2, Math.min(cap, Math.floor(totalSentences * ratio)));
}

function formatSummary(sentences, style = "paragraph") {
  if (style === "bullets") {
    return sentences.map((s) => `• ${s.trim()}`).join("\n");
  }
  if (style === "insights") {
    return sentences.map((s, i) => `${i + 1}. ${s.trim()}`).join("\n");
  }
  return sentences.join(" ");
}

const generateSummaryFromText = (text, options = {}) => {
  if (!text) return "";

  const sentences = sentenceTokenizer.tokenize(text);
  if (sentences.length <= 3) return formatSummary(sentences, options.style);

  const scores = new Array(sentences.length).fill(0);

  for (let i = 0; i < sentences.length; i++) {
    for (let j = 0; j < sentences.length; j++) {
      if (i === j) continue;
      scores[i] += sentenceSimilarity(sentences[i], sentences[j]);
    }

    const sentLower = sentences[i].toLowerCase();
    if (sentLower.includes("in conclusion") || sentLower.includes("summar")) scores[i] *= 1.25;
    if (sentLower.includes("important") || sentLower.includes("significant")) scores[i] *= 1.15;
    if (sentLower.includes("decision") || sentLower.includes("action item")) scores[i] *= 1.2;
  }

  const indexedScores = scores.map((score, index) => ({ score, index }));
  indexedScores.sort((a, b) => b.score - a.score);

  const count = pickSentenceCount(sentences.length, options);
  const topIndices = indexedScores.slice(0, count).map((item) => item.index);
  topIndices.sort((a, b) => a - b);

  return formatSummary(topIndices.map((i) => sentences[i]), options.style);
};

module.exports = generateSummaryFromText;
