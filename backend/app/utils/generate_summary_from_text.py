import math
import re
from typing import Any

STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "as", "by",
    "is", "was", "are", "were", "be", "been", "being", "have", "has", "had", "do", "does",
    "did", "will", "would", "could", "should", "may", "might", "must", "shall", "can",
    "this", "that", "these", "those", "it", "its", "with", "from", "they", "them", "their",
}


def _tokenize(text: str) -> list[str]:
    return re.findall(r"\b\w+\b", text.lower())


def _split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p for p in parts if p]


def _sentence_similarity(sent1: str, sent2: str) -> float:
    tokens1 = _tokenize(sent1)
    tokens2 = _tokenize(sent2)
    all_tokens = sorted(set(tokens1) | set(tokens2))
    token_list = [t for t in all_tokens if t not in STOPWORDS]
    if not token_list:
        return 0.0
    vec1 = [1 if t in tokens1 else 0 for t in token_list]
    vec2 = [1 if t in tokens2 else 0 for t in token_list]
    dot = sum(a * b for a, b in zip(vec1, vec2))
    mag1 = math.sqrt(sum(a * a for a in vec1))
    mag2 = math.sqrt(sum(b * b for b in vec2))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot / (mag1 * mag2)


def _pick_sentence_count(total: int, options: dict[str, Any]) -> int:
    length = options.get("length", "medium")
    ratio = 0.2 if length == "short" else 0.45 if length == "long" else 0.3
    cap = 4 if length == "short" else 10 if length == "long" else 6
    return max(2, min(cap, int(total * ratio)))


def _format_summary(sentences: list[str], style: str = "paragraph") -> str:
    if style == "bullets":
        return "\n".join(f"• {s.strip()}" for s in sentences)
    if style == "insights":
        return "\n".join(f"{i + 1}. {s.strip()}" for i, s in enumerate(sentences))
    return " ".join(sentences)


def generate_summary_from_text(text: str | None, options: dict[str, Any] | None = None) -> str:
    if not text:
        return ""
    options = options or {}
    sentences = _split_sentences(text)
    if len(sentences) <= 3:
        return _format_summary(sentences, options.get("style", "paragraph"))

    scores = [0.0] * len(sentences)
    for i, sent_i in enumerate(sentences):
        for j, sent_j in enumerate(sentences):
            if i == j:
                continue
            scores[i] += _sentence_similarity(sent_i, sent_j)
        lower = sent_i.lower()
        if "in conclusion" in lower or "summar" in lower:
            scores[i] *= 1.25
        if "important" in lower or "significant" in lower:
            scores[i] *= 1.15
        if "decision" in lower or "action item" in lower:
            scores[i] *= 1.2

    indexed = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    count = _pick_sentence_count(len(sentences), options)
    top_indices = sorted(i for i, _ in indexed[:count])
    return _format_summary([sentences[i] for i in top_indices], options.get("style", "paragraph"))
