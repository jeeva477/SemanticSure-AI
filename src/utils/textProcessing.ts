// Text normalization, sentence segmentation, tokenization, and document
// statistics. Every function here is a pure, deterministic transformation
// of the input text — no randomness, no hard-coded results.

/** Collapse whitespace and trim. Used before sentence segmentation. */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Normalize a string for exact-match comparison: lowercase, strip
 * punctuation, collapse whitespace. Two sentences that differ only in
 * capitalization, punctuation, or spacing are still considered an exact
 * textual match.
 */
export function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Split a block of text into sentences.
 *
 * This is a lightweight, regex-based segmenter (no ML). It splits on
 * ./!/? followed by whitespace and a capital letter or end of string,
 * while trying to avoid breaking on common abbreviations (e.g. "Dr.",
 * "e.g.", "U.S.") and numbered-list markers (e.g. "1.", "2."). It is not
 * perfect, but it is deterministic and explainable, which matters more
 * here than perfect linguistic accuracy.
 *
 * Trade-off: because 1-2 digit numbers followed by a period are treated as
 * list markers rather than sentence endings, a sentence that legitimately
 * ends in a short number (e.g. "She turned 21.") will be merged with the
 * sentence that follows it rather than split. This was chosen deliberately
 * because numbered lists are far more common in real documents than
 * sentences ending in a bare 1-2 digit number, and a merged sentence is a
 * much less disruptive failure mode than shredding a list into meaningless
 * one-token fragments like "1.".
 */
export function splitSentences(text: string): string[] {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return [];

  // Protect common abbreviations from being treated as sentence boundaries
  // by temporarily replacing their period with a placeholder.
  const abbreviations = [
    "Mr", "Mrs", "Ms", "Dr", "Prof", "Sr", "Jr", "St",
    "e.g", "i.e", "vs", "etc", "U.S", "U.K", "Inc", "Ltd", "Co",
  ];
  let protectedText = normalized;
  abbreviations.forEach((abbr) => {
    const re = new RegExp(`\\b${abbr.replace(".", "\\.")}\\.`, "g");
    protectedText = protectedText.replace(re, `${abbr}<PERIOD>`);
  });

  // Protect numbered-list markers ("1.", "2.", ... "99.") the same way, so
  // an inline or line-start list item isn't split into a meaningless
  // one-token "sentence" like "1.".
  protectedText = protectedText.replace(/\b(\d{1,2})\.(?=\s)/g, "$1<PERIOD>");

  // Split on sentence-ending punctuation followed by whitespace + capital
  // letter/quote, or end of string.
  const rawSentences = protectedText
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'\u201c])|(?<=[.!?])$/)
    .map((s) => s.replace(/<PERIOD>/g, "."))
    .map((s) => s.trim())
    .filter(Boolean);

  // Fallback: if the regex above produced only one giant sentence but the
  // text clearly has multiple terminators, split more permissively.
  if (rawSentences.length <= 1) {
    const fallback = normalized
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (fallback.length > 1) return fallback;
  }

  return rawSentences;
}

/** Tokenize text into lowercase word tokens, stripping punctuation. */
export function tokenizeWords(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return [];
  return normalized.split(" ").filter((w) => w.length > 0);
}

/** Generate n-grams (as joined strings) from a token list. */
export function ngrams(tokens: string[], n: number): string[] {
  if (tokens.length < n) return [];
  const result: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    result.push(tokens.slice(i, i + n).join(" "));
  }
  return result;
}

/** Word count for a whole document. */
export function countWords(text: string): number {
  return tokenizeWords(text).length;
}

// ---------------------------------------------------------------------------
// Content-word helpers: stopwords, stemming, and a small built-in synonym
// dictionary. These power the paraphrase signals — lexical overlap alone
// cannot see that "buy" and "purchase" (or "car" and "vehicle") carry the
// same meaning. Everything here is a deterministic lookup, no external data.
// ---------------------------------------------------------------------------

/** Common English function words. Excluded from content-word signals only;
 * TF-IDF and exact-match detection still use the full token stream. */
export const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "nor", "so", "yet", "for", "with", "without",
  "of", "to", "in", "on", "at", "by", "from", "as", "into", "onto", "upon", "over",
  "under", "between", "among", "through", "during", "before", "after", "above",
  "below", "about", "against", "around", "within", "across", "along", "beyond",
  "is", "are", "was", "were", "be", "been", "being", "am", "have", "has", "had",
  "having", "do", "does", "did", "done", "doing", "will", "would", "shall",
  "should", "can", "could", "may", "might", "must", "i", "me", "my", "mine",
  "we", "us", "our", "ours", "you", "your", "yours", "he", "him", "his", "she",
  "her", "hers", "it", "its", "they", "them", "their", "theirs", "this", "that",
  "these", "those", "who", "whom", "whose", "which", "what", "when", "where",
  "why", "how", "if", "then", "than", "too", "very", "just", "also", "more",
  "most", "some", "any", "no", "not", "none", "each", "every", "both", "all",
  "few", "many", "much", "other", "another", "such", "only", "own", "same",
  "there", "here", "now", "then", "again", "once", "never", "always", "often",
  "sometimes", "usually", "however", "therefore", "thus", "hence", "instead",
  "because", "since", "while", "though", "although", "until", "unless", "whether",
]);

export function isStopword(word: string): boolean {
  return STOPWORDS.has(word);
}

/** Content tokens: the token stream minus stopwords. */
export function contentTokens(tokens: string[]): string[] {
  return tokens.filter((t) => !isStopword(t));
}

/**
 * Frequent irregular verb/noun forms that simple suffix-stripping would
 * mangle. Mapped to their canonical lemma before synonym lookup.
 */
const IRREGULAR_LEMMAS: Record<string, string> = {
  went: "go", gone: "go", goes: "go", going: "go",
  bought: "buy", buying: "buy", buys: "buy",
  made: "make", making: "make", makes: "make",
  done: "do", does: "do", doing: "do",
  wrote: "write", written: "write", writing: "write", writes: "write",
  saw: "see", seen: "see", seeing: "see", sees: "see",
  gave: "give", given: "give", giving: "give", gives: "give",
  got: "get", gotten: "get", getting: "get", gets: "get",
  knew: "know", known: "know", knowing: "know", knows: "know",
  thought: "think", thinking: "think", thinks: "think",
  took: "take", taken: "take", taking: "take", takes: "take",
  felt: "feel", feeling: "feel", feels: "feel",
  found: "find", finding: "find", finds: "find",
  kept: "keep", keeping: "keep", keeps: "keep",
  held: "hold", holding: "hold", holds: "hold",
  led: "lead", leading: "lead", leads: "lead",
  left: "leave", leaving: "leave", leaves: "leave",
  lost: "lose", losing: "lose", loses: "lose",
  put: "put", putting: "put", puts: "put",
  ran: "run", running: "run", runs: "run",
  said: "say", saying: "say", says: "say",
  spoke: "speak", spoken: "speak", speaking: "speak", speaks: "speak",
  spent: "spend", spending: "spend", spends: "spend",
  stood: "stand", standing: "stand", stands: "stand",
  taught: "teach", teaching: "teach", teaches: "teach",
  told: "tell", telling: "tell", tells: "tell",
  used: "use", using: "use", uses: "use",
  worked: "work", working: "work", works: "work",
  became: "become", becoming: "become", becomes: "become",
  began: "begin", begun: "begin", beginning: "begin", begins: "begin",
  grew: "grow", grown: "grow", growing: "grow", grows: "grow",
  brought: "bring", bringing: "bring", brings: "bring",
  built: "build", building: "build", builds: "build",
  children: "child",
  people: "person",
  men: "man", women: "woman",
  countries: "country",
  companies: "company",
  studies: "study",
  cities: "city",
  bodies: "body",
  families: "family",
  opportunities: "opportunity",
  strategies: "strategy",
};

/**
 * Minimal suffix stemmer used ONLY for building the synonym-lookup key.
 * Deliberately conservative: short words are left untouched, and only the
 * most common English suffixes are stripped. This is an approximation — it
 * is deterministic and explainable, not a full morphological analyzer.
 */
export function lightStem(word: string): string {
  const lower = word.toLowerCase();
  const irregular = IRREGULAR_LEMMAS[lower];
  if (irregular) return irregular;
  if (lower.length < 4) return lower;
  if (lower.endsWith("ies") && lower.length > 5) return `${lower.slice(0, -3)}y`;
  if (lower.endsWith("sses")) return lower.slice(0, -2);
  if (lower.endsWith("ing") && lower.length > 6) return lower.slice(0, -3);
  if (lower.endsWith("ed") && lower.length > 5 && !lower.endsWith("eed")) return lower.slice(0, -2);
  if (lower.endsWith("s") && !lower.endsWith("ss") && lower.length > 4) return lower.slice(0, -1);
  return lower;
}

/**
 * Built-in synonym groups (canonical key = group[0], lowercased). The
 * vocabulary is deliberately scoped to everyday academic/business English so
 * it stays honest: it improves recall for common paraphrasing patterns
 * without pretending to be a full thesaurus. For paraphrase detection we
 * prefer false negatives (missed synonyms) over false positives.
 */
const SYNONYM_GROUPS: string[][] = [
  ["acquire", "purchase", "buy", "purchasing", "procure"],
  ["advantage", "benefit", "gain", "plus", "upside"],
  ["aim", "goal", "objective", "purpose", "target", "intention"],
  ["allow", "permit", "enable", "empower", "facilitate"],
  ["amount", "quantity", "level", "degree", "extent", "number"],
  ["approach", "method", "strategy", "technique", "tactic", "practice"],
  ["area", "field", "domain", "discipline", "realm"],
  ["assess", "evaluate", "review", "appraise", "measure"],
  ["assist", "help", "aid", "support", "back"],
  ["cause", "source", "origin", "driver", "root"],
  ["change", "shift", "alter", "modify", "adjust", "variation", "transition"],
  ["choose", "select", "pick", "opt"],
  ["combine", "merge", "blend", "unify", "integrate"],
  ["common", "widespread", "frequent", "prevalent", "widespread"],
  ["company", "firm", "business", "organization", "enterprise", "corporation"],
  ["concept", "idea", "notion", "principle"],
  ["consider", "regard", "view", "deem", "see"],
  ["cost", "price", "expense", "expenditure", "charge"],
  ["country", "nation", "state", "region"],
  ["create", "build", "develop", "establish", "form", "construct", "produce", "generate", "make"],
  ["customer", "client", "consumer", "buyer"],
  ["damage", "harm", "hurt", "impair", "undermine"],
  ["data", "information", "figures", "statistics"],
  ["decision", "choice", "judgment", "call"],
  ["demand", "requirement", "need"],
  ["develop", "advance", "progress", "evolve", "grow"],
  ["difference", "gap", "distinction", "discrepancy"],
  ["difficult", "hard", "challenging", "tough", "demanding"],
  ["disease", "illness", "sickness", "condition"],
  ["doctor", "physician"],
  ["effect", "impact", "influence", "consequence", "outcome", "result"],
  ["efficient", "effective", "productive"],
  ["employee", "worker", "staff", "workforce", "personnel"],
  ["energy", "power", "electricity"],
  ["ensure", "guarantee", "secure", "assure"],
  ["essential", "necessary", "crucial", "vital", "critical", "key", "important"],
  ["estimate", "approximate", "roughly", "around"],
  ["example", "instance", "case", "illustration"],
  ["expand", "grow", "extend", "broaden", "widen"],
  ["experience", "encounter", "undergo"],
  ["explain", "describe", "clarify", "illustrate"],
  ["expose", "reveal", "uncover", "disclose"],
  ["focus", "concentrate", "center"],
  ["fund", "finance", "funding", "capital", "money", "cash"],
  ["goal", "objective", "target", "aim", "purpose"],
  ["health", "wellbeing", "wellness", "fitness"],
  ["improve", "enhance", "boost", "strengthen", "refine"],
  ["increase", "rise", "grow", "raise", "boost", "climb"],
  ["issue", "problem", "challenge", "difficulty", "concern", "matter"],
  ["job", "work", "employment", "role", "position", "occupation"],
  ["knowledge", "understanding", "expertise", "insight"],
  ["large", "big", "major", "significant", "substantial", "considerable", "huge"],
  ["learn", "study", "understand", "comprehend", "master", "discover", "figure"],
  ["limit", "restrict", "constrain", "cap", "bound"],
  ["maintain", "preserve", "sustain", "keep", "retain"],
  ["manage", "handle", "oversee", "run", "operate"],
  ["medical", "clinical"],
  ["mental", "psychological", "emotional"],
  ["monitor", "track", "observe", "watch"],
  ["need", "require", "necessitate"],
  ["obtain", "gain", "get", "receive", "acquire"],
  ["often", "frequently", "commonly", "regularly", "typically"],
  ["outline", "overview", "summary", "abstract"],
  ["pattern", "trend", "tendency"],
  ["plan", "program", "scheme", "initiative", "project"],
  ["prevent", "stop", "halt", "avoid", "block", "counter"],
  ["problem", "challenge", "difficulty", "issue", "obstacle"],
  ["process", "procedure", "method", "mechanism"],
  ["protect", "guard", "defend", "safeguard", "shield"],
  ["reduce", "decrease", "lower", "cut", "minimize", "diminish"],
  ["research", "study", "investigation", "analysis", "survey"],
  ["risk", "danger", "threat", "hazard"],
  ["rule", "regulation", "policy", "law", "standard"],
  ["say", "state", "mention", "note", "argue", "claim", "suggest", "indicate", "report", "assert"],
  ["security", "safety", "protection"],
  ["skill", "ability", "capability", "competence", "expertise"],
  ["small", "little", "minor", "modest"],
  ["start", "begin", "launch", "establish", "initiate", "commence"],
  ["successful", "effective", "profitable"],
  ["take", "use", "utilize", "employ", "adopt", "apply"],
  ["teach", "educate", "instruct", "train", "coach"],
  ["think", "believe", "consider", "regard"],
  ["time", "period", "duration", "phase", "era"],
  ["vehicle", "car", "automobile"],
  ["way", "means", "manner", "approach", "method"],
  ["workplace", "office", "organization"],
  ["world", "global", "international", "worldwide"],
];

const SYNONYM_LOOKUP = new Map<string, string>();
for (const group of SYNONYM_GROUPS) {
  const canonical = group[0].toLowerCase();
  for (const word of group) {
    const key = lightStem(word);
    if (!SYNONYM_LOOKUP.has(key)) SYNONYM_LOOKUP.set(key, canonical);
  }
}

/**
 * Map a content word to its canonical synonym-group key. Unknown words fall
 * back to their (stemmed) form, so the mapping never discards information.
 */
export function canonicalWord(word: string): string {
  const stemmed = lightStem(word);
  return SYNONYM_LOOKUP.get(stemmed) ?? stemmed;
}

/** Semantic token stream: content words mapped to synonym-group keys. */
export function semanticTokens(tokens: string[]): string[] {
  return contentTokens(tokens).map(canonicalWord);
}

/**
 * Estimated reading time in minutes, based on an average adult silent
 * reading speed of 200 words per minute. Always at least 1 minute for any
 * non-empty document.
 */
export function estimateReadingTimeMinutes(wordCount: number): number {
  if (wordCount === 0) return 0;
  return Math.max(1, Math.round(wordCount / 200));
}

/**
 * Vocabulary diversity: the type-token ratio, expressed as a percentage.
 * unique words / total words. Higher values indicate less repetitive
 * word choice.
 */
export function vocabularyDiversity(tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const unique = new Set(tokens);
  return Math.round((unique.size / tokens.length) * 1000) / 10;
}

/** Word-frequency map for a token list. */
export function termFrequencyCounts(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of tokens) {
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return counts;
}
