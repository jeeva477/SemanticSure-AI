// The SemanticSure AI analysis engine with Open-Source Models & Multi-Mode Support.
//
// Supports:
// 1. Live Online Open-Source Knowledge Base (Wikipedia + CrossRef)
// 2. Custom Source / Two-Document Direct Comparison
// 3. Intra-Document Self-Similarity & Redundancy Check
// 4. Standard Curated Reference Corpus
// 5. Plagiarism vs Paraphrase Focus & Model Fine-Tuning

import type {
  AnalysisConfig,
  DetectionFocus,
  DocumentAnalysis,
  MatchEvidence,
  ReferenceDocument,
  ReferenceSentence,
  SentenceAnalysis,
  SentenceClassification,
  SimilaritySignals,
  TuningParameters,
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
import {
  embeddingCosineSimilarity,
  generateSemanticEmbedding,
} from "./openSourceEmbeddings";

export const MAX_DOCUMENT_CHARACTERS = 100000;

export const DEFAULT_TUNING: TuningParameters = {
  focus: "balanced",
  sensitivity: "medium",
  ignoreQuotes: true,
  semanticWeight: 0.25,
};

// ---------------------------------------------------------------------------
// Reference corpus preparation
// ---------------------------------------------------------------------------

export interface PreparedReferenceContext {
  sentences: ReferenceSentence[];
  tokenLists: string[][];
  vectors: Map<string, number>[];
  embeddings: Float32Array[];
  idf: Map<string, number>;
}

export function buildReferenceContext(
  docs: ReferenceDocument[],
  focus: DetectionFocus = "balanced"
): PreparedReferenceContext {
  const sentences: ReferenceSentence[] = [];
  for (const doc of docs) {
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

  const tokenLists = sentences.map((s) => tokenizeWords(s.text));
  const idf = buildIDF(tokenLists);
  const vectors = tokenLists.map((tokens) => tfidfVector(tokens, idf));
  const embeddings = sentences.map((s) => generateSemanticEmbedding(s.text, focus));

  return { sentences, tokenLists, vectors, embeddings, idf };
}

const DEFAULT_REFERENCE_CONTEXT = buildReferenceContext(REFERENCE_CORPUS);

// ---------------------------------------------------------------------------
// Dynamic Scoring weights and thresholds
// ---------------------------------------------------------------------------

function getScoringWeights(tuning: TuningParameters) {
  const sem = tuning.semanticWeight;
  const remaining = Math.max(0.1, 1 - sem);

  if (tuning.focus === "plagiarism_strict") {
    return {
      tfidf: remaining * 0.4,
      word: remaining * 0.25,
      bigram: remaining * 0.2,
      trigram: remaining * 0.15,
      embedding: sem * 0.5,
    };
  }

  if (tuning.focus === "paraphrase_deep") {
    return {
      tfidf: remaining * 0.3,
      word: remaining * 0.2,
      bigram: remaining * 0.15,
      trigram: remaining * 0.1,
      embedding: sem * 1.5,
    };
  }

  return {
    tfidf: remaining * 0.35,
    word: remaining * 0.22,
    bigram: remaining * 0.18,
    trigram: remaining * 0.12,
    embedding: sem,
  };
}

function getParaphraseWeights(tuning: TuningParameters) {
  if (tuning.focus === "paraphrase_deep") {
    return {
      synonym: 0.45,
      contentWord: 0.2,
      wordOrder: 0.15,
      embedding: 0.35,
    };
  }
  return {
    synonym: 0.4,
    contentWord: 0.25,
    wordOrder: 0.15,
    embedding: 0.2,
  };
}

function getThresholds(tuning: TuningParameters) {
  let delta = 0;
  if (tuning.sensitivity === "high") delta = -7;
  if (tuning.sensitivity === "low") delta = 8;

  if (tuning.focus === "plagiarism_strict") {
    return {
      highSimilarity: Math.max(35, 50 + delta),
      possibleSimilarity: Math.max(18, 22 + delta),
      highParaphrase: Math.max(45, 60 + delta),
      possibleParaphrase: Math.max(25, 35 + delta),
    };
  }

  if (tuning.focus === "paraphrase_deep") {
    return {
      highSimilarity: Math.max(45, 58 + delta),
      possibleSimilarity: Math.max(20, 28 + delta),
      highParaphrase: Math.max(35, 48 + delta),
      possibleParaphrase: Math.max(18, 25 + delta),
    };
  }

  return {
    highSimilarity: Math.max(40, 55 + delta),
    possibleSimilarity: Math.max(20, 25 + delta),
    highParaphrase: Math.max(40, 55 + delta),
    possibleParaphrase: Math.max(20, 30 + delta),
  };
}

function isQuotedOrCited(text: string): boolean {
  const trimmed = text.trim();
  // Starts and ends with quotation marks
  const isQuoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("“") && trimmed.endsWith("”")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));
  // Contains academic citation pattern e.g. [1], [12], (Smith, 2020)
  const isCited = /\[\d{1,3}\]|\([A-Z][a-z]+(\s+et\s+al\.)?,\s*\d{4}\)/.test(trimmed);
  return isQuoted || isCited;
}

function combinedParaphraseScore(
  synonym: number,
  contentWord: number,
  wordOrder: number,
  embeddingSim: number,
  tuning: TuningParameters
): number {
  const pWeights = getParaphraseWeights(tuning);
  const weighted =
    synonym * pWeights.synonym +
    contentWord * pWeights.contentWord +
    wordOrder * pWeights.wordOrder +
    embeddingSim * pWeights.embedding;
  return Math.round(weighted * 1000) / 10;
}

function classify(
  score: number,
  paraphraseScore: number,
  exact: boolean,
  tuning: TuningParameters,
  isQuote: boolean
): SentenceClassification {
  // If user enabled ignoreQuotes and sentence is legitimately quoted/cited, mark clean/waived
  if (tuning.ignoreQuotes && isQuote && !exact) {
    return "CLEAN";
  }

  const th = getThresholds(tuning);

  if (exact) return "EXACT_MATCH";

  if (tuning.focus === "plagiarism_strict") {
    if (score >= th.highSimilarity) return "HIGH_SIMILARITY";
    if (score >= th.possibleSimilarity) return "POSSIBLE_SIMILARITY";
    if (paraphraseScore >= th.highParaphrase) return "HIGH_PARAPHRASE";
    if (paraphraseScore >= th.possibleParaphrase) return "POSSIBLE_PARAPHRASE";
    return "CLEAN";
  }

  if (tuning.focus === "paraphrase_deep") {
    if (paraphraseScore >= th.highParaphrase) return "HIGH_PARAPHRASE";
    if (score >= th.highSimilarity) return "HIGH_SIMILARITY";
    if (paraphraseScore >= th.possibleParaphrase) return "POSSIBLE_PARAPHRASE";
    if (score >= th.possibleSimilarity) return "POSSIBLE_SIMILARITY";
    return "CLEAN";
  }

  // Balanced mode
  if (score >= th.highSimilarity) return "HIGH_SIMILARITY";
  if (paraphraseScore >= th.highParaphrase) return "HIGH_PARAPHRASE";
  if (paraphraseScore >= th.possibleParaphrase && paraphraseScore > score) {
    return "POSSIBLE_PARAPHRASE";
  }
  if (score >= th.possibleSimilarity) return "POSSIBLE_SIMILARITY";
  if (paraphraseScore >= th.possibleParaphrase) return "POSSIBLE_PARAPHRASE";
  return "CLEAN";
}

function reasonFor(
  classification: SentenceClassification,
  match: MatchEvidence | null,
  paraphraseScore: number,
  tuning: TuningParameters
): string {
  const sourceContext = match ? ` (${match.referenceTitle})` : "";
  const focusNote =
    tuning.focus === "plagiarism_strict"
      ? " [Strict Plagiarism Focus]"
      : tuning.focus === "paraphrase_deep"
      ? " [Deep Paraphrase Focus]"
      : "";

  switch (classification) {
    case "EXACT_MATCH":
      return `This sentence is textually identical to a sentence in ${match?.referenceSource || "the reference material"}${sourceContext}.${focusNote}`;
    case "HIGH_SIMILARITY":
      return `This sentence shares substantial verbatim phrasing with ${match?.referenceSource || "a reference sentence"}${sourceContext} (lexical similarity ${match?.score ?? 0}%).${focusNote}`;
    case "HIGH_PARAPHRASE":
      return `This sentence preserves the semantic core of ${match?.referenceSource || "a reference sentence"}${sourceContext} with structural rewriting (open-source semantic agreement ${paraphraseScore}% vs lexical ${match?.score ?? 0}%).${focusNote}`;
    case "POSSIBLE_SIMILARITY":
      return `This sentence shares vocabulary and phrasing with ${match?.referenceSource || "a reference sentence"}${sourceContext} (similarity ${match?.score ?? 0}%).`;
    case "POSSIBLE_PARAPHRASE":
      return `This sentence aligns in meaning with ${match?.referenceSource || "a reference sentence"}${sourceContext} based on open-source vector embeddings and synonyms (semantic score ${paraphraseScore}%).`;
    default:
      return "No meaningful lexical plagiarism or semantic paraphrase overlap was detected against the active knowledge sources.";
  }
}

function recommendedActionFor(classification: SentenceClassification): string {
  switch (classification) {
    case "EXACT_MATCH":
      return "Rewrite this passage in your own original words and provide a formal citation to the primary source.";
    case "HIGH_SIMILARITY":
      return "Restructure the sentence syntax and check whether the source concepts require direct quotation marks or attribution.";
    case "HIGH_PARAPHRASE":
      return "Ensure this paraphrased idea has been substantially re-articulated in your own voice and properly referenced.";
    case "POSSIBLE_SIMILARITY":
      return "Review against the matched source to confirm phrasing is sufficiently distinct.";
    case "POSSIBLE_PARAPHRASE":
      return "Verify that the underlying thought is appropriately restated or credited.";
    default:
      return "No action needed.";
  }
}

// ---------------------------------------------------------------------------
// Sentence-level analysis
// ---------------------------------------------------------------------------

function analyzeSentenceWithContext(
  sentenceText: string,
  index: number,
  docIdf: Map<string, number>,
  ctx: PreparedReferenceContext,
  tuning: TuningParameters,
  excludeIndex?: number
): SentenceAnalysis {
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
  const embedding = generateSemanticEmbedding(sentenceText, tuning.focus);
  const isQuote = isQuotedOrCited(sentenceText);
  const weights = getScoringWeights(tuning);

  let bestLexical: MatchEvidence | null = null;
  let bestParaphrase: { evidence: MatchEvidence; score: number } | null = null;

  for (let i = 0; i < ctx.sentences.length; i++) {
    if (excludeIndex !== undefined && i === excludeIndex) continue;

    const ref = ctx.sentences[i];
    const refTokens = ctx.tokenLists[i];
    const refVector = ctx.vectors[i];
    const refEmbedding = ctx.embeddings[i];

    const exact = isExactMatch(sentenceText, ref.text);
    const tfidfSimilarity = cosineSimilarity(vector, refVector);
    const wordOver = wordOverlap(tokens, refTokens);
    const biOver = bigramOverlap(tokens, refTokens);
    const triOver = trigramOverlap(tokens, refTokens);
    const contentOver = contentWordOverlap(tokens, refTokens);
    const synOver = synonymOverlap(tokens, refTokens);
    const orderOver = wordOrderOverlap(tokens, refTokens);
    const embeddingSim = embeddingCosineSimilarity(embedding, refEmbedding);

    const signals: SimilaritySignals = {
      tfidfSimilarity,
      wordOverlap: wordOver,
      bigramOverlap: biOver,
      trigramOverlap: triOver,
      contentWordOverlap: contentOver,
      synonymOverlap: synOver,
      wordOrderOverlap: orderOver,
      semanticEmbeddingSimilarity: embeddingSim,
      exactMatch: exact,
    };

    const weighted =
      tfidfSimilarity * weights.tfidf +
      wordOver * weights.word +
      biOver * weights.bigram +
      triOver * weights.trigram +
      embeddingSim * weights.embedding;

    const score = exact ? 100 : Math.round(weighted * 1000) / 10;
    const paraphraseScore = combinedParaphraseScore(synOver, contentOver, orderOver, embeddingSim, tuning);

    const candidate: MatchEvidence = {
      referenceId: ref.referenceId,
      referenceTitle: ref.referenceTitle,
      referenceSource: ref.referenceSource,
      referenceYear: ref.referenceYear,
      referenceText: ref.text,
      signals,
      score,
    };

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

  const classification = classify(lexicalScore, paraphraseScore, exact, tuning, isQuote);

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
    reason: reasonFor(classification, bestMatch, paraphraseScore, tuning),
    recommendedAction: recommendedActionFor(classification),
  };
}

// ---------------------------------------------------------------------------
// Document-level scoring
// ---------------------------------------------------------------------------

const CATEGORY_PENALTY: Record<SentenceClassification, number> = {
  CLEAN: 0,
  POSSIBLE_SIMILARITY: 0.25,
  POSSIBLE_PARAPHRASE: 0.3,
  HIGH_SIMILARITY: 0.6,
  HIGH_PARAPHRASE: 0.55,
  EXACT_MATCH: 1,
};

function computeOriginality(sentences: SentenceAnalysis[]): number {
  const scored = sentences.filter((s) => s.text.trim().length > 0);
  if (scored.length === 0) return 100;

  const totalPenalty = scored.reduce((sum, s) => {
    const categoryPenalty = CATEGORY_PENALTY[s.classification];
    const continuousPenalty = s.score / 100;
    return sum + (categoryPenalty * 0.7 + continuousPenalty * 0.3);
  }, 0);

  const originality = 100 * (1 - totalPenalty / scored.length);
  return Math.round(Math.max(0, Math.min(100, originality)) * 10) / 10;
}

function computePlagiarismScore(sentences: SentenceAnalysis[]): number {
  const scored = sentences.filter((s) => s.text.trim().length > 0);
  if (scored.length === 0) return 0;
  const avgLexical = scored.reduce((sum, s) => sum + s.score, 0) / scored.length;
  return Math.round(avgLexical * 10) / 10;
}

function computeDocumentParaphraseScore(sentences: SentenceAnalysis[]): number {
  const scored = sentences.filter((s) => s.text.trim().length > 0);
  if (scored.length === 0) return 0;
  const avgParaphrase = scored.reduce((sum, s) => sum + s.paraphraseScore, 0) / scored.length;
  return Math.round(avgParaphrase * 10) / 10;
}

function computeSimilarityRisk(score: number): { score: number; label: "Low" | "Medium" | "High" } {
  const label = score >= 50 ? "High" : score >= 22 ? "Medium" : "Low";
  return { score, label };
}

function computeParaphraseRisk(score: number): { score: number; label: "Low" | "Medium" | "High" } {
  const label = score >= 50 ? "High" : score >= 28 ? "Medium" : "Low";
  return { score, label };
}

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

export function analyzeDocument(
  rawText: string,
  documentName: string,
  config?: AnalysisConfig
): DocumentAnalysis {
  const mode = config?.mode || "standard_corpus";
  const tuning = config?.tuning || DEFAULT_TUNING;
  const sentenceTexts = splitSentences(rawText);
  const allTokens = tokenizeWords(rawText);

  let refContext: PreparedReferenceContext;
  let referenceScopeNote = "Results are based on the reference material available to this application.";
  let activeSourcesCount = REFERENCE_CORPUS.length;

  if (mode === "custom_source" && config?.customSourceText) {
    const customDocs: ReferenceDocument[] = [
      {
        id: "custom-src-001",
        title: config.customSourceName || "Custom Reference Material",
        source: "User-Provided Comparison Source",
        year: new Date().getFullYear(),
        text: config.customSourceText,
      },
    ];
    refContext = buildReferenceContext(customDocs, tuning.focus);
    referenceScopeNote = `Direct side-by-side comparison with provided source document "${config.customSourceName || "Reference Document"}".`;
    activeSourcesCount = 1;
  } else if (mode === "internal_check") {
    const internalDoc: ReferenceDocument[] = [
      {
        id: "internal-self",
        title: "Intra-Document Context",
        source: "Same Document (Self-Similarity Check)",
        year: new Date().getFullYear(),
        text: rawText,
      },
    ];
    refContext = buildReferenceContext(internalDoc, tuning.focus);
    referenceScopeNote = "Evaluated for intra-document self-similarity, duplicated paragraphs, and repetitive phrasing.";
    activeSourcesCount = 1;
  } else if (mode === "live_online" && config?.onlineDocs && config.onlineDocs.length > 0) {
    const combinedDocs = [...config.onlineDocs, ...REFERENCE_CORPUS];
    refContext = buildReferenceContext(combinedDocs, tuning.focus);
    referenceScopeNote = `Cross-checked against live open-source knowledge bases (${config.onlineDocs.length} online articles fetched) & foundational corpus.`;
    activeSourcesCount = combinedDocs.length;
  } else {
    refContext = DEFAULT_REFERENCE_CONTEXT;
    referenceScopeNote = "Cross-checked against foundational reference corpus with open-source semantic embedding models.";
  }

  // Build combined document IDF space
  const docSentenceTokenLists = sentenceTexts.map((s) => tokenizeWords(s));
  const combinedIdfCorpus = [...refContext.tokenLists, ...docSentenceTokenLists];
  const docIdf = buildIDF(combinedIdfCorpus);

  const sentences = sentenceTexts.map((text, i) =>
    analyzeSentenceWithContext(
      text,
      i,
      docIdf,
      refContext,
      tuning,
      mode === "internal_check" ? i : undefined
    )
  );

  const wordCount = countWords(rawText);
  const stats = {
    wordCount,
    sentenceCount: sentences.length,
    readingTimeMinutes: estimateReadingTimeMinutes(wordCount),
    vocabularyDiversity: vocabularyDiversity(allTokens),
  };

  const originalityScore = computeOriginality(sentences);
  const plagiarismScore = computePlagiarismScore(sentences);
  const docParaphraseScore = computeDocumentParaphraseScore(sentences);

  const similarityRisk = computeSimilarityRisk(plagiarismScore);
  const paraphraseRisk = computeParaphraseRisk(docParaphraseScore);
  const reviewRisk = computeReviewRisk(sentences);
  const flaggedCount = sentences.filter((s) => s.classification !== "CLEAN").length;

  return {
    analysisId: generateAnalysisId(),
    documentName,
    analyzedAt: new Date().toISOString(),
    mode,
    tuning,
    sentences,
    stats,
    originalityScore,
    plagiarismScore,
    paraphraseScore: docParaphraseScore,
    similarityRisk,
    paraphraseRisk,
    reviewRisk,
    flaggedCount,
    referenceScopeNote,
    activeSourcesCount,
  };
}
