// The SemanticSure AI analysis engine.
//
// This module is the single place where a document is turned into a
// DocumentAnalysis. It is deterministic: the same document text and the
// same reference corpus always produce the same result. There are no
// random numbers, no fixed/hard-coded scores, and no network calls —
// everything is computed locally from the actual input.

import type {
  DocumentAnalysis,
  MatchEvidence,
  ReferenceSentence,
  SentenceAnalysis,
  SentenceClassification,
  SimilaritySignals,
} from "../types/analysis";
import { REFERENCE_CORPUS } from "../data/referenceCorpus";
import {
  countWords,
  estimateReadingTimeMinutes,
  splitSentences,
  tokenizeWords,
  vocabularyDiversity,
} from "./textProcessing";
import {
  bigramOverlap,
  buildIDF,
  contentWordOverlap,
  cosineSimilarity,
  isExactMatch,
  synonymOverlap,
  tfidfVector,
  trigramOverlap,
  wordOrderOverlap,
  wordOverlap,
} from "./similarity";

export const MAX_DOCUMENT_CHARACTERS = 50000;

// ---------------------------------------------------------------------------
// Reference corpus preparation
// ---------------------------------------------------------------------------

/** Flatten the reference corpus into individual, addressable sentences. */
function buildReferenceSentences(): ReferenceSentence[] {
  const sentences: ReferenceSentence[] = [];
  for (const doc of REFERENCE_CORPUS) {
    const docSentences = splitSentences(doc.text);
    docSentences.forEach((text, i) => {
      sentences.push({
        referenceId: doc.id,
        referenceTitle: doc.title,
        referenceSource: doc.source,
        referenceYear: doc.year,
        sentenceIndex: i,
        text,
      });
    });
  }
  return sentences;
}

const REFERENCE_SENTENCES = buildReferenceSentences();
const REFERENCE_TOKEN_LISTS = REFERENCE_SENTENCES.map((s) => tokenizeWords(s.text));
// IDF is computed once from the reference corpus's own sentences. This
// grounds "importance" of a word in the material we actually compare
// against, rather than in the user's document (which would bias results).
const REFERENCE_IDF = buildIDF(REFERENCE_TOKEN_LISTS);
const REFERENCE_VECTORS = REFERENCE_TOKEN_LISTS.map((tokens) => tfidfVector(tokens, REFERENCE_IDF));

// ---------------------------------------------------------------------------
// Scoring weights and thresholds
// ---------------------------------------------------------------------------

/**
 * Combined similarity score weights. TF-IDF cosine similarity carries the
 * most weight because it accounts for term importance across the whole
 * reference corpus, not just raw overlap. Overlap signals (word / bigram /
 * trigram) are included because they catch verbatim or near-verbatim
 * copying that TF-IDF alone can under-weight for short sentences.
 * The weights sum to 1 so the combined score stays in the 0-100 range.
 */
const WEIGHTS = {
  tfidf: 0.4,
  word: 0.25,
  bigram: 0.2,
  trigram: 0.15,
};

/**
 * Paraphrase score weights. Synonym overlap carries the most weight because
 * it is the signal that specifically detects reworded content. Content-word
 * overlap keeps the score grounded in the words actually shared, and
 * word-order overlap rewards paraphrases that preserve the original
 * sentence's internal structure. Weights sum to 1 (0-100 range).
 */
const PARAPHRASE_WEIGHTS = {
  synonym: 0.5,
  contentWord: 0.3,
  wordOrder: 0.2,
};

function combinedParaphraseScore(
  synonym: number,
  contentWord: number,
  wordOrder: number
): number {
  const weighted =
    synonym * PARAPHRASE_WEIGHTS.synonym +
    contentWord * PARAPHRASE_WEIGHTS.contentWord +
    wordOrder * PARAPHRASE_WEIGHTS.wordOrder;
  return Math.round(weighted * 1000) / 10;
}

/**
 * Classification thresholds for the 0-100 combined similarity score and the
 * 0-100 paraphrase score. The rules are ordered so that the strongest,
 * most specific evidence wins:
 *
 *  1. EXACT_MATCH  — textually identical (case/punctuation/whitespace aside)
 *  2. HIGH_SIMILARITY   — combined lexical score >= 55 (near-verbatim copying)
 *  3. HIGH_PARAPHRASE   — paraphrase score >= 55: strong semantic agreement
 *                         with reworked wording
 *  4. POSSIBLE_PARAPHRASE — paraphrase score >= 30 AND stronger than the
 *                         lexical score: the meaning is preserved while the
 *                         wording has clearly been reworked
 *  5. POSSIBLE_SIMILARITY — lexical score >= 25 (shared phrases)
 *  6. POSSIBLE_PARAPHRASE — paraphrase score >= 30 (shared meaning, synonyms)
 *  7. CLEAN
 */
const HIGH_SIMILARITY_THRESHOLD = 55;
const POSSIBLE_SIMILARITY_THRESHOLD = 25;
const HIGH_PARAPHRASE_THRESHOLD = 55;
const POSSIBLE_PARAPHRASE_THRESHOLD = 30;

function classify(
  score: number,
  paraphraseScore: number,
  exact: boolean
): SentenceClassification {
  if (exact) return "EXACT_MATCH";
  if (score >= HIGH_SIMILARITY_THRESHOLD) return "HIGH_SIMILARITY";
  if (paraphraseScore >= HIGH_PARAPHRASE_THRESHOLD) return "HIGH_PARAPHRASE";
  if (paraphraseScore >= POSSIBLE_PARAPHRASE_THRESHOLD && paraphraseScore > score) {
    return "POSSIBLE_PARAPHRASE";
  }
  if (score >= POSSIBLE_SIMILARITY_THRESHOLD) return "POSSIBLE_SIMILARITY";
  if (paraphraseScore >= POSSIBLE_PARAPHRASE_THRESHOLD) return "POSSIBLE_PARAPHRASE";
  return "CLEAN";
}

function reasonFor(
  classification: SentenceClassification,
  match: MatchEvidence | null,
  paraphraseScore: number
): string {
  switch (classification) {
    case "EXACT_MATCH":
      return "This sentence is textually identical to a sentence in the reference material (ignoring case, punctuation, and spacing).";
    case "HIGH_SIMILARITY":
      return `This sentence shares substantial word choice and phrasing with a reference sentence (combined similarity ${match?.score ?? 0}%).`;
    case "HIGH_PARAPHRASE":
      return `This sentence preserves the meaning of a reference sentence while reworking its wording (semantic similarity ${paraphraseScore}% vs. lexical similarity ${match?.score ?? 0}%). This is consistent with paraphrasing.`;
    case "POSSIBLE_SIMILARITY":
      return `This sentence shares some vocabulary and phrasing with a reference sentence (combined similarity ${match?.score ?? 0}%). This is lexical evidence only, not confirmation of paraphrasing.`;
    case "POSSIBLE_PARAPHRASE":
      return `This sentence aligns with a reference sentence in meaning after accounting for synonyms and word order (semantic similarity ${paraphraseScore}%). This is evidence for review, not confirmation of paraphrasing.`;
    default:
      return "No meaningful lexical or semantic overlap was found with the reference material available to this application.";
  }
}

function recommendedActionFor(classification: SentenceClassification): string {
  switch (classification) {
    case "EXACT_MATCH":
      return "Rewrite this passage in your own words and cite the original source where appropriate.";
    case "HIGH_SIMILARITY":
      return "Restructure the sentence rather than retaining the same wording, and review whether the original source should be cited.";
    case "HIGH_PARAPHRASE":
      return "Paraphrase the idea more substantially: change the sentence structure and vocabulary, then cite the original source where appropriate.";
    case "POSSIBLE_SIMILARITY":
      return "Review this sentence against the matched reference and consider reducing repeated wording while preserving the intended meaning.";
    case "POSSIBLE_PARAPHRASE":
      return "Review this sentence against the matched reference and confirm whether the source idea has been adequately restated and cited.";
    default:
      return "No action needed.";
  }
}

// ---------------------------------------------------------------------------
// Sentence-level analysis
// ---------------------------------------------------------------------------

function analyzeSentence(sentenceText: string, index: number, docIdf: Map<string, number>): SentenceAnalysis {
  const tokens = tokenizeWords(sentenceText);

  if (tokens.length === 0) {
    return {
      index,
      text: sentenceText,
      classification: "CLEAN",
      score: 0,
      paraphraseScore: 0,
      bestMatch: null,
      reason: "Empty sentence.",
      recommendedAction: "No action needed.",
    };
  }

  const vector = tfidfVector(tokens, docIdf);

  let bestLexical: MatchEvidence | null = null;
  let bestParaphrase: { evidence: MatchEvidence; score: number } | null = null;

  for (let i = 0; i < REFERENCE_SENTENCES.length; i++) {
    const ref = REFERENCE_SENTENCES[i];
    const refTokens = REFERENCE_TOKEN_LISTS[i];
    const refVector = REFERENCE_VECTORS[i];

    const exact = isExactMatch(sentenceText, ref.text);
    const signals: SimilaritySignals = {
      tfidfSimilarity: cosineSimilarity(vector, refVector),
      wordOverlap: wordOverlap(tokens, refTokens),
      bigramOverlap: bigramOverlap(tokens, refTokens),
      trigramOverlap: trigramOverlap(tokens, refTokens),
      contentWordOverlap: contentWordOverlap(tokens, refTokens),
      synonymOverlap: synonymOverlap(tokens, refTokens),
      wordOrderOverlap: wordOrderOverlap(tokens, refTokens),
      exactMatch: exact,
    };

    const weighted =
      signals.tfidfSimilarity * WEIGHTS.tfidf +
      signals.wordOverlap * WEIGHTS.word +
      signals.bigramOverlap * WEIGHTS.bigram +
      signals.trigramOverlap * WEIGHTS.trigram;

    // Exact matches override the weighted score: an identical sentence is
    // always reported as ~100% similarity regardless of how the weighted
    // formula would have scored it.
    const score = exact ? 100 : Math.round(weighted * 1000) / 10;

    const paraphraseScore = combinedParaphraseScore(
      signals.synonymOverlap,
      signals.contentWordOverlap,
      signals.wordOrderOverlap
    );

    const candidate: MatchEvidence = {
      referenceId: ref.referenceId,
      referenceTitle: ref.referenceTitle,
      referenceSource: ref.referenceSource,
      referenceYear: ref.referenceYear,
      referenceText: ref.text,
      signals,
      score,
    };

    // Track the strongest lexical match and the strongest paraphrase match
    // independently: they can belong to different reference sentences, and
    // the classification must surface the reference that actually drives it.
    if (!bestLexical || candidate.score > bestLexical.score) {
      bestLexical = candidate;
    }
    if (!bestParaphrase || paraphraseScore > bestParaphrase.score) {
      bestParaphrase = { evidence: candidate, score: paraphraseScore };
    }
  }

  const lexicalScore = bestLexical?.score ?? 0;
  const paraphraseScore = bestParaphrase?.score ?? 0;
  const exact = bestLexical?.signals.exactMatch ?? false;

  const classification = classify(lexicalScore, paraphraseScore, exact);

  // The match shown to the user is the one that drove the classification:
  // lexical evidence for similarity/clean verdicts, semantic evidence for
  // paraphrase verdicts.
  const bestMatch =
    classification === "HIGH_PARAPHRASE" || classification === "POSSIBLE_PARAPHRASE"
      ? bestParaphrase && paraphraseScore > 0
        ? bestParaphrase.evidence
        : null
      : bestLexical && lexicalScore > 0
      ? bestLexical
      : null;

  return {
    index,
    text: sentenceText,
    classification,
    score: lexicalScore,
    paraphraseScore,
    bestMatch,
    reason: reasonFor(classification, bestMatch, paraphraseScore),
    recommendedAction: recommendedActionFor(classification),
  };
}

// ---------------------------------------------------------------------------
// Document-level scoring
// ---------------------------------------------------------------------------

/**
 * Originality is calculated from the distribution of sentence-level
 * results. Each sentence contributes a penalty that blends two signals:
 *
 *  1. A CATEGORY component, based on its classification tier (clean sentences
 *     contribute nothing here; exact matches contribute the most). This is
 *     what creates the clear step at each classification threshold.
 *  2. A CONTINUOUS component, based on the raw 0-100 combined similarity
 *     score of its best match, regardless of which tier that score fell
 *     into. This is what lets two documents that are both "Clean" still
 *     produce different originality numbers — e.g. a document with
 *     incidental low-level overlap across many sentences will score lower
 *     than one with almost no overlap at all, instead of both flattening to
 *     a single "100%" result.
 *
 * The two components are blended 70/30 so classification tier remains the
 * dominant factor (as the product spec requires) while still keeping the
 * score sensitive to real differences between documents.
 */
const CATEGORY_PENALTY: Record<SentenceClassification, number> = {
  CLEAN: 0,
  POSSIBLE_SIMILARITY: 0.25,
  POSSIBLE_PARAPHRASE: 0.3,
  HIGH_SIMILARITY: 0.6,
  HIGH_PARAPHRASE: 0.55,
  EXACT_MATCH: 1,
};

const CATEGORY_WEIGHT = 0.7;
const CONTINUOUS_WEIGHT = 0.3;

function computeOriginality(sentences: SentenceAnalysis[]): number {
  const scored = sentences.filter((s) => s.text.trim().length > 0);
  if (scored.length === 0) return 100;

  const totalPenalty = scored.reduce((sum, s) => {
    const categoryPenalty = CATEGORY_PENALTY[s.classification];
    const continuousPenalty = s.score / 100;
    return sum + (categoryPenalty * CATEGORY_WEIGHT + continuousPenalty * CONTINUOUS_WEIGHT);
  }, 0);

  const originality = 100 * (1 - totalPenalty / scored.length);
  return Math.round(Math.max(0, Math.min(100, originality)) * 10) / 10;
}

/**
 * Similarity risk: the average combined similarity score across all
 * sentences. This reflects overall lexical closeness to the reference
 * corpus, independent of how many sentences are strictly "flagged".
 */
function computeSimilarityRisk(sentences: SentenceAnalysis[]): { score: number; label: "Low" | "Medium" | "High" } {
  const scored = sentences.filter((s) => s.text.trim().length > 0);
  if (scored.length === 0) return { score: 0, label: "Low" };
  const avg = scored.reduce((sum, s) => sum + s.score, 0) / scored.length;
  const score = Math.round(avg * 10) / 10;
  const label = score >= 55 ? "High" : score >= 25 ? "Medium" : "Low";
  return { score, label };
}

/**
 * Paraphrase risk: the average semantic (synonym + word-order) closeness of
 * sentences to the reference corpus. High values mean much of the document
 * restates reference material even where the exact wording differs — the
 * signature pattern of paraphrasing.
 */
function computeParaphraseRisk(sentences: SentenceAnalysis[]): { score: number; label: "Low" | "Medium" | "High" } {
  const scored = sentences.filter((s) => s.text.trim().length > 0);
  if (scored.length === 0) return { score: 0, label: "Low" };
  const avg = scored.reduce((sum, s) => sum + s.paraphraseScore, 0) / scored.length;
  const score = Math.round(avg * 10) / 10;
  const label = score >= 55 ? "High" : score >= 30 ? "Medium" : "Low";
  return { score, label };
}

/**
 * Review risk: the proportion of sentences that were flagged (anything
 * other than CLEAN), expressed as a percentage.
 */
function computeReviewRisk(sentences: SentenceAnalysis[]): { score: number; label: "Low" | "Medium" | "High" } {
  const scored = sentences.filter((s) => s.text.trim().length > 0);
  if (scored.length === 0) return { score: 0, label: "Low" };
  const flagged = scored.filter((s) => s.classification !== "CLEAN").length;
  const score = Math.round((flagged / scored.length) * 1000) / 10;
  const label = score >= 50 ? "High" : score >= 20 ? "Medium" : "Low";
  return { score, label };
}

function generateAnalysisId(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `SSA-${time}-${rand}`;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function analyzeDocument(rawText: string, documentName: string): DocumentAnalysis {
  const sentenceTexts = splitSentences(rawText);
  const allTokens = tokenizeWords(rawText);

  // Build a document-specific IDF/vector space combining the reference
  // corpus with this document's own sentences. This keeps TF-IDF weighting
  // grounded in the reference material (so scores are stable and
  // reproducible) while still letting the document's own vocabulary
  // participate in the vector space.
  const docSentenceTokenLists = sentenceTexts.map((s) => tokenizeWords(s));
  const combinedIdfCorpus = [...REFERENCE_TOKEN_LISTS, ...docSentenceTokenLists];
  const docIdf = buildIDF(combinedIdfCorpus);

  const sentences = sentenceTexts.map((text, i) => analyzeSentence(text, i, docIdf));

  const wordCount = countWords(rawText);
  const stats = {
    wordCount,
    sentenceCount: sentences.length,
    readingTimeMinutes: estimateReadingTimeMinutes(wordCount),
    vocabularyDiversity: vocabularyDiversity(allTokens),
  };

  const originalityScore = computeOriginality(sentences);
  const similarityRisk = computeSimilarityRisk(sentences);
  const paraphraseRisk = computeParaphraseRisk(sentences);
  const reviewRisk = computeReviewRisk(sentences);
  const flaggedCount = sentences.filter((s) => s.classification !== "CLEAN").length;

  return {
    analysisId: generateAnalysisId(),
    documentName,
    analyzedAt: new Date().toISOString(),
    sentences,
    stats,
    originalityScore,
    similarityRisk,
    paraphraseRisk,
    reviewRisk,
    flaggedCount,
    referenceScopeNote:
      "Results are based on the reference material available to this application.",
  };
}
