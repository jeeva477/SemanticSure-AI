// Core types for the SemanticSure AI analysis engine.
// Everything here describes REAL, calculated data — nothing here represents
// a hard-coded or fabricated value. See src/utils/analyzer.ts for how these
// are populated.

export type SentenceClassification =
  | "CLEAN"
  | "POSSIBLE_SIMILARITY"
  | "HIGH_SIMILARITY"
  | "POSSIBLE_PARAPHRASE"
  | "HIGH_PARAPHRASE"
  | "EXACT_MATCH";

export type AnalysisMode =
  | "live_online"
  | "custom_source"
  | "internal_check"
  | "standard_corpus";

export type DetectionFocus =
  | "balanced" // Balanced multi-signal evaluation
  | "plagiarism_strict" // Strict verbatim plagiarism & direct copy focus
  | "paraphrase_deep"; // Deep semantic paraphrase & rewording focus

export interface TuningParameters {
  focus: DetectionFocus;
  sensitivity: "low" | "medium" | "high";
  ignoreQuotes: boolean;
  semanticWeight: number; // 0.0 to 1.0
}

export interface AnalysisConfig {
  mode: AnalysisMode;
  customSourceText?: string;
  customSourceName?: string;
  onlineDocs?: ReferenceDocument[];
  tuning?: TuningParameters;
}

/** One entry in the reference corpus (local, custom, or fetched online). */
export interface ReferenceDocument {
  id: string;
  title: string;
  source: string;
  year?: number;
  text: string;
}

/** A single reference sentence, pre-segmented from a ReferenceDocument. */
export interface ReferenceSentence {
  referenceId: string;
  referenceTitle: string;
  referenceSource: string;
  referenceYear?: number;
  sentenceIndex: number;
  text: string;
}

/** Breakdown of the individual signals used to score a sentence pair. */
export interface SimilaritySignals {
  tfidfSimilarity: number; // cosine similarity, 0-1
  wordOverlap: number; // Jaccard overlap of unigrams, 0-1
  bigramOverlap: number; // Jaccard overlap of bigrams, 0-1
  trigramOverlap: number; // Jaccard overlap of trigrams, 0-1
  contentWordOverlap: number; // Jaccard over stopword-filtered tokens, 0-1
  synonymOverlap: number; // Jaccard over synonym-normalized content words, 0-1
  wordOrderOverlap: number; // LCS of content words / longer length, 0-1
  semanticEmbeddingSimilarity: number; // Cosine similarity of open-source vector embeddings, 0-1
  exactMatch: boolean;
}

/** The best-matching reference sentence found for a user sentence. */
export interface MatchEvidence {
  referenceId: string;
  referenceTitle: string;
  referenceSource: string;
  referenceYear?: number;
  referenceText: string;
  signals: SimilaritySignals;
  score: number; // 0-100, weighted combined similarity
}

export interface SentenceAnalysis {
  index: number;
  text: string;
  classification: SentenceClassification;
  score: number; // 0-100 combined lexical similarity of the best match
  paraphraseScore: number; // 0-100 semantic (synonym + vector embedding + word-order) closeness
  bestMatch: MatchEvidence | null;
  reason: string;
  recommendedAction: string;
}

export interface DocumentStats {
  wordCount: number;
  sentenceCount: number;
  readingTimeMinutes: number;
  vocabularyDiversity: number; // percentage, unique words / total words
}

export interface RiskLevel {
  score: number; // 0-100
  label: "Low" | "Medium" | "High";
}

export interface DocumentAnalysis {
  analysisId: string;
  documentName: string;
  analyzedAt: string; // ISO timestamp
  mode: AnalysisMode;
  tuning: TuningParameters;
  sentences: SentenceAnalysis[];
  stats: DocumentStats;
  originalityScore: number; // 0-100
  plagiarismScore: number; // 0-100 direct lexical plagiarism index
  paraphraseScore: number; // 0-100 semantic paraphrase & rewording index
  similarityRisk: RiskLevel;
  paraphraseRisk: RiskLevel;
  reviewRisk: RiskLevel;
  flaggedCount: number;
  referenceScopeNote: string;
  activeSourcesCount?: number;
}
