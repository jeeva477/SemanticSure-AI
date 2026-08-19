import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { SentenceAnalysis, SentenceClassification } from "../../types/analysis";

interface Props {
  sentences: SentenceAnalysis[];
  selectedIndex?: number | null;
  onSelectSentence?: (index: number) => void;
}

const STATUS_COLOR: Record<SentenceClassification, string> = {
  CLEAN: "var(--green)",
  POSSIBLE_SIMILARITY: "var(--amber)",
  HIGH_SIMILARITY: "var(--red)",
  POSSIBLE_PARAPHRASE: "var(--violet)",
  HIGH_PARAPHRASE: "var(--violet-deep)",
  EXACT_MATCH: "#dc2626",
};

const STATUS_LABEL: Record<SentenceClassification, string> = {
  CLEAN: "Clean",
  POSSIBLE_SIMILARITY: "Possible similarity",
  HIGH_SIMILARITY: "High verbatim similarity",
  POSSIBLE_PARAPHRASE: "Possible paraphrase",
  HIGH_PARAPHRASE: "High paraphrase likelihood",
  EXACT_MATCH: "Exact verbatim match",
};

type InspectorFilter = "ALL" | "PLAGIARISM" | "PARAPHRASE" | "CLEAN";

export default function SentenceInspector({
  sentences,
  selectedIndex: controlledIndex,
  onSelectSentence,
}: Props) {
  const [filter, setFilter] = useState<InspectorFilter>("ALL");
  const nonEmpty = sentences.filter((s) => s.text.trim().length > 0);

  const filtered = nonEmpty.filter((s) => {
    if (filter === "PLAGIARISM") {
      return s.classification === "EXACT_MATCH" || s.classification === "HIGH_SIMILARITY" || s.classification === "POSSIBLE_SIMILARITY";
    }
    if (filter === "PARAPHRASE") {
      return s.classification === "HIGH_PARAPHRASE" || s.classification === "POSSIBLE_PARAPHRASE";
    }
    if (filter === "CLEAN") {
      return s.classification === "CLEAN";
    }
    return true;
  });

  const [internalIndex, setInternalIndex] = useState<number | null>(
    nonEmpty.find((s) => s.classification !== "CLEAN")?.index ?? (nonEmpty[0]?.index ?? null)
  );

  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;
  const selected = activeIndex !== null ? nonEmpty.find((s) => s.index === activeIndex) ?? null : null;

  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  function handleSelect(index: number) {
    if (onSelectSentence) {
      onSelectSentence(index);
    } else {
      setInternalIndex(index);
    }
  }

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeIndex]);

  const plagCount = nonEmpty.filter(
    (s) => s.classification === "EXACT_MATCH" || s.classification === "HIGH_SIMILARITY" || s.classification === "POSSIBLE_SIMILARITY"
  ).length;

  const paraCount = nonEmpty.filter(
    (s) => s.classification === "HIGH_PARAPHRASE" || s.classification === "POSSIBLE_PARAPHRASE"
  ).length;

  const cleanCount = nonEmpty.filter((s) => s.classification === "CLEAN").length;

  return (
    <div className="inspector-grid">
      <div style={styles.listCol}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={styles.colHeading}>Manuscript Inspector</h3>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {filtered.length} sentences
          </span>
        </div>

        {/* Categorical filter pills */}
        <div style={styles.filterRow}>
          <button
            type="button"
            style={{
              ...styles.filterPill,
              background: filter === "ALL" ? "var(--blue-bright)" : "var(--surface)",
              color: filter === "ALL" ? "var(--bg)" : "var(--text-secondary)",
              fontWeight: filter === "ALL" ? 700 : 400,
            }}
            onClick={() => setFilter("ALL")}
          >
            All ({nonEmpty.length})
          </button>

          <button
            type="button"
            style={{
              ...styles.filterPill,
              background: filter === "PLAGIARISM" ? "rgba(239, 68, 68, 0.2)" : "var(--surface)",
              color: filter === "PLAGIARISM" ? "var(--red)" : "var(--text-secondary)",
              borderColor: filter === "PLAGIARISM" ? "var(--red)" : "var(--border)",
              fontWeight: filter === "PLAGIARISM" ? 700 : 400,
            }}
            onClick={() => setFilter("PLAGIARISM")}
          >
            🎯 Plagiarism ({plagCount})
          </button>

          <button
            type="button"
            style={{
              ...styles.filterPill,
              background: filter === "PARAPHRASE" ? "rgba(139, 92, 246, 0.2)" : "var(--surface)",
              color: filter === "PARAPHRASE" ? "var(--violet)" : "var(--text-secondary)",
              borderColor: filter === "PARAPHRASE" ? "var(--violet)" : "var(--border)",
              fontWeight: filter === "PARAPHRASE" ? 700 : 400,
            }}
            onClick={() => setFilter("PARAPHRASE")}
          >
            🧠 Paraphrase ({paraCount})
          </button>

          <button
            type="button"
            style={{
              ...styles.filterPill,
              background: filter === "CLEAN" ? "rgba(34, 197, 94, 0.2)" : "var(--surface)",
              color: filter === "CLEAN" ? "var(--green)" : "var(--text-secondary)",
              borderColor: filter === "CLEAN" ? "var(--green)" : "var(--border)",
              fontWeight: filter === "CLEAN" ? 700 : 400,
            }}
            onClick={() => setFilter("CLEAN")}
          >
            🟢 Clean ({cleanCount})
          </button>
        </div>

        <ul style={styles.list} role="list">
          {filtered.map((s) => {
            const isSelected = activeIndex === s.index;
            return (
              <li key={s.index}>
                <button
                  ref={isSelected ? activeItemRef : null}
                  type="button"
                  onClick={() => handleSelect(s.index)}
                  style={{
                    ...styles.listItem,
                    borderColor: isSelected ? "var(--blue-bright)" : "var(--border)",
                    background: isSelected ? "var(--surface)" : "var(--card)",
                  }}
                  aria-current={isSelected}
                >
                  <span
                    aria-hidden="true"
                    style={{ ...styles.statusDot, background: STATUS_COLOR[s.classification] }}
                  />
                  <span style={styles.listText}>
                    <span style={styles.listSentence}>{truncate(s.text, 90)}</span>
                    <span style={{ ...styles.listStatus, color: STATUS_COLOR[s.classification] }}>
                      {STATUS_LABEL[s.classification]}
                      {s.classification !== "CLEAN" ? ` · ${s.score}% lexical / ${s.paraphraseScore}% semantic` : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div style={styles.detailCol}>
        {selected ? (
          <SentenceDetail sentence={selected} />
        ) : (
          <div style={styles.emptyDetail}>
            <p>Select a sentence to inspect its evidence and recommended action.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SentenceDetail({ sentence }: { sentence: SentenceAnalysis }) {
  const color = STATUS_COLOR[sentence.classification];
  return (
    <div style={styles.detailCard}>
      <div style={styles.detailHead}>
        <span style={{ ...styles.badge, color, borderColor: color }}>{STATUS_LABEL[sentence.classification]}</span>
        {sentence.classification !== "CLEAN" && (
          <span style={styles.detailScore}>
            {sentence.score}% direct similarity · {sentence.paraphraseScore}% paraphrase alignment
          </span>
        )}
      </div>

      <p style={styles.detailLabel}>Your manuscript text (Matching keywords highlighted)</p>
      <HighlightedMatchText
        text={sentence.text}
        referenceText={sentence.bestMatch ? sentence.bestMatch.referenceText : ""}
      />

      {sentence.bestMatch && (
        <>
          <p style={styles.detailLabel}>Matched reference source</p>
          <HighlightedMatchText
            text={sentence.bestMatch.referenceText}
            referenceText={sentence.text}
          />
          <p style={styles.sourceLine}>
            Source: <strong>{sentence.bestMatch.referenceTitle}</strong> — {sentence.bestMatch.referenceSource}
            {sentence.bestMatch.referenceYear ? `, ${sentence.bestMatch.referenceYear}` : ""}
          </p>

          <p style={styles.detailLabel}>Direct Plagiarism Signals</p>
          <div className="signal-grid">
            <SignalBar label="TF-IDF Cosine" value={sentence.bestMatch.signals.tfidfSimilarity} />
            <SignalBar label="Word unigram overlap" value={sentence.bestMatch.signals.wordOverlap} />
            <SignalBar label="Bigram phrase match" value={sentence.bestMatch.signals.bigramOverlap} />
            <SignalBar label="Trigram structural overlap" value={sentence.bestMatch.signals.trigramOverlap} />
          </div>

          <p style={styles.detailLabel}>Open-Source Semantic Paraphrase Signals</p>
          <div className="signal-grid">
            <SignalBar label="Neural Vector Embedding Cosine" value={sentence.bestMatch.signals.semanticEmbeddingSimilarity || 0} />
            <SignalBar label="Synonym cluster overlap" value={sentence.bestMatch.signals.synonymOverlap} />
            <SignalBar label="Content word overlap" value={sentence.bestMatch.signals.contentWordOverlap} />
            <SignalBar label="Word-order retention (LCS)" value={sentence.bestMatch.signals.wordOrderOverlap} />
          </div>
        </>
      )}

      <p style={styles.detailLabel}>Evaluation rationale</p>
      <p style={styles.detailBody}>{sentence.reason}</p>

      <p style={styles.detailLabel}>Recommended action</p>
      <p style={styles.detailBody}>{sentence.recommendedAction}</p>
    </div>
  );
}

function HighlightedMatchText({ text, referenceText }: { text: string; referenceText: string }) {
  if (!referenceText) {
    return <p style={styles.detailQuote}>{text}</p>;
  }

  const refWords = new Set(
    referenceText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  const tokens = text.split(/(\s+)/);

  return (
    <p style={styles.detailQuote}>
      {tokens.map((token, i) => {
        const clean = token.toLowerCase().replace(/[^a-z0-9]/g, "");
        const isMatch = clean.length > 2 && refWords.has(clean);
        return isMatch ? (
          <mark
            key={i}
            style={{
              background: "rgba(245, 158, 11, 0.25)",
              color: "var(--amber)",
              borderRadius: "4px",
              padding: "1px 4px",
              fontWeight: 500,
              fontStyle: "normal",
            }}
          >
            {token}
          </mark>
        ) : (
          <span key={i}>{token}</span>
        );
      })}
    </p>
  );
}

function SignalBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div style={styles.signalLabelRow}>
        <span style={styles.signalLabel}>{label}</span>
        <span style={styles.signalValue}>{pct}%</span>
      </div>
      <div style={styles.signalTrack}>
        <div style={{ ...styles.signalFill, width: `${pct}%` }} />
      </div>
    </div>
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

const styles: Record<string, CSSProperties> = {
  listCol: {
    display: "flex",
    flexDirection: "column",
  },
  colHeading: {
    fontSize: 16,
    margin: 0,
  },
  filterRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  filterPill: {
    fontSize: 11.5,
    padding: "4px 8px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    transition: "all 0.2s ease",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxHeight: 520,
    overflowY: "auto",
  },
  listItem: {
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "12px 14px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border)",
    textAlign: "left",
    cursor: "pointer",
    transition: "background 0.2s ease, border-color 0.2s ease",
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    marginTop: 6,
    flexShrink: 0,
  },
  listText: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0,
  },
  listSentence: {
    fontSize: 13.5,
    color: "var(--white)",
    lineHeight: 1.45,
    fontFamily: "var(--font-body)",
  },
  listStatus: {
    fontSize: 11.5,
    fontFamily: "var(--font-mono)",
  },
  detailCol: {},
  emptyDetail: {
    padding: 32,
    textAlign: "center",
    color: "var(--text-muted)",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
  },
  detailCard: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  detailHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  badge: {
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid",
  },
  detailScore: {
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    color: "var(--text-muted)",
  },
  detailLabel: {
    fontSize: 11.5,
    fontFamily: "var(--font-mono)",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginTop: 4,
    marginBottom: -4,
  },
  detailQuote: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "var(--white)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 14px",
    margin: 0,
    fontStyle: "italic",
  },
  sourceLine: {
    fontSize: 12,
    color: "var(--text-secondary)",
    marginTop: -4,
    fontFamily: "var(--font-mono)",
  },
  detailBody: {
    fontSize: 13.5,
    lineHeight: 1.6,
    color: "var(--text-secondary)",
    margin: 0,
  },
  signalLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11.5,
    fontFamily: "var(--font-mono)",
    color: "var(--text-muted)",
    marginBottom: 3,
  },
  signalLabel: {},
  signalValue: {
    color: "var(--white)",
    fontWeight: 600,
  },
  signalTrack: {
    height: 5,
    borderRadius: 3,
    background: "var(--surface)",
    overflow: "hidden",
    border: "1px solid var(--border)",
  },
  signalFill: {
    height: "100%",
    background: "var(--gradient-primary)",
  },
};
