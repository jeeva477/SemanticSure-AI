// Similarity signal calculations: TF-IDF + cosine similarity, word/bigram/
// trigram overlap, and exact-match detection. Each function is a pure,
// deterministic calculation over real token data — nothing is fabricated.

import { contentTokens, ngrams, normalizeForComparison, semanticTokens, termFrequencyCounts } from "./textProcessing";

/**
 * Build an IDF (inverse document frequency) table from a corpus of
 * tokenized "documents" (here, reference sentences). Standard smoothed
 * IDF: idf(t) = ln((1 + N) / (1 + df(t))) + 1
 * This keeps every term's weight positive and well-defined even for terms
 * that appear in every document.
 */
export function buildIDF(corpusTokenLists: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  const N = corpusTokenLists.length;

  for (const tokens of corpusTokenLists) {
    const seen = new Set(tokens);
    for (const term of seen) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, docFreq] of df.entries()) {
    idf.set(term, Math.log((1 + N) / (1 + docFreq)) + 1);
  }
  return idf;
}

/** Compute a TF-IDF weighted vector (as a Map term -> weight) for a token list. */
export function tfidfVector(tokens: string[], idf: Map<string, number>): Map<string, number> {
  const tf = termFrequencyCounts(tokens);
  const vector = new Map<string, number>();
  for (const [term, count] of tf.entries()) {
    const weight = count * (idf.get(term) ?? 1); // unseen terms default to idf=1
    vector.set(term, weight);
  }
  return vector;
}

/** Cosine similarity between two sparse vectors, represented as Maps. */
export function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  if (a.size === 0 || b.size === 0) return 0;

  let dot = 0;
  // Iterate the smaller map for efficiency.
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const [term, weight] of smaller.entries()) {
    const otherWeight = larger.get(term);
    if (otherWeight !== undefined) dot += weight * otherWeight;
  }

  let normA = 0;
  for (const w of a.values()) normA += w * w;
  let normB = 0;
  for (const w of b.values()) normB += w * w;

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Jaccard overlap between two token sets: |intersection| / |union|. */
export function jaccardOverlap(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Word overlap (unigram Jaccard). */
export function wordOverlap(tokensA: string[], tokensB: string[]): number {
  return jaccardOverlap(tokensA, tokensB);
}

/** Bigram overlap (Jaccard over 2-grams). */
export function bigramOverlap(tokensA: string[], tokensB: string[]): number {
  return jaccardOverlap(ngrams(tokensA, 2), ngrams(tokensB, 2));
}

/** Trigram overlap (Jaccard over 3-grams). */
export function trigramOverlap(tokensA: string[], tokensB: string[]): number {
  return jaccardOverlap(ngrams(tokensA, 3), ngrams(tokensB, 3));
}

/**
 * Exact match: true if two sentences are identical once case, punctuation,
 * and whitespace differences are normalized away.
 */
export function isExactMatch(sentenceA: string, sentenceB: string): boolean {
  const a = normalizeForComparison(sentenceA);
  const b = normalizeForComparison(sentenceB);
  return a.length > 0 && a === b;
}

// ---------------------------------------------------------------------------
// Paraphrase signals. These operate on CONTENT words only (stopwords carry
// no meaning and only inflate raw overlap), and they are what let the engine
// recognize a reworded sentence that no longer shares exact phrases.
// ---------------------------------------------------------------------------

/** Content-word overlap: Jaccard over stopword-filtered tokens. */
export function contentWordOverlap(tokensA: string[], tokensB: string[]): number {
  return jaccardOverlap(contentTokens(tokensA), contentTokens(tokensB));
}

/**
 * Synonym overlap: Jaccard over content words mapped to canonical synonym
 * groups. This is the core paraphrase signal — "vehicle" now counts as
 * "car", "purchase" as "buy", and so on.
 */
export function synonymOverlap(tokensA: string[], tokensB: string[]): number {
  return jaccardOverlap(semanticTokens(tokensA), semanticTokens(tokensB));
}

/**
 * Word-order overlap: the length of the longest common subsequence of
 * content words divided by the longer sentence's content-word count.
 * A sentence that keeps the same content words in roughly the same order
 * while swapping connective tissue scores high here even when its exact
 * phrases differ.
 */
export function wordOrderOverlap(tokensA: string[], tokensB: string[]): number {
  const a = contentTokens(tokensA);
  const b = contentTokens(tokensB);
  if (a.length === 0 || b.length === 0) return 0;

  // Standard LCS DP over the two content-word sequences.
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const lcsLength = dp[a.length][b.length];
  return lcsLength / Math.max(a.length, b.length);
}
