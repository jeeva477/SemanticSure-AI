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
  EXACT_MATCH: "var(--red)",
};

const STATUS_LABEL: Record<SentenceClassification, string> = {
  CLEAN: "Clean",
  POSSIBLE_SIMILARITY: "Possible similarity",
  HIGH_SIMILARITY: "High similarity",
  POSSIBLE_PARAPHRASE: "Possible paraphrase",
  HIGH_PARAPHRASE: "High paraphrase likelihood",
  EXACT_MATCH: "Exact match",
};

export default function SentenceInspector({
  sentences,
  selectedIndex: controlledIndex,
  onSelectSentence,
}: Props) {
  const nonEmpty = sentences.filter((s) => s.text.trim().length > 0);
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

  return (
    <div className="inspector-grid">
      <div style={styles.listCol}>
        <h3 style={styles.colHeading}>Manuscript Inspector</h3>
        <ul style={styles.list} role="list">
          {nonEmpty.map((s) => {
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
                      {s.classification !== "CLEAN" ? ` · ${s.score}%` : ""}
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
            {sentence.score}% similarity · {sentence.paraphraseScore}% paraphrase
          </span>
        )}
      </div>

      <p style={styles.detailLabel}>Your text</p>
      <p style={styles.detailQuote}>{sentence.text}</p>

      {sentence.bestMatch && (
        <>
          <p style={styles.detailLabel}>Reference text</p>
          <p style={styles.detailQuote}>{sentence.bestMatch.referenceText}</p>
          <p style={styles.sourceLine}>
            Source: {sentence.bestMatch.referenceTitle} — {sentence.bestMatch.referenceSource}
            {sentence.bestMatch.referenceYear ? `, ${sentence.bestMatch.referenceYear}` : ""}
          </p>

          <p style={styles.detailLabel}>Similarity breakdown</p>
          <div className="signal-grid">
            <SignalBar label="TF-IDF" value={sentence.bestMatch.signals.tfidfSimilarity} />
            <SignalBar label="Word overlap" value={sentence.bestMatch.signals.wordOverlap} />
            <SignalBar label="Bigram overlap" value={sentence.bestMatch.signals.bigramOverlap} />
            <SignalBar label="Trigram overlap" value={sentence.bestMatch.signals.trigramOverlap} />
          </div>

          <p style={styles.detailLabel}>Paraphrase breakdown</p>
          <div className="signal-grid">
            <SignalBar label="Content word overlap" value={sentence.bestMatch.signals.contentWordOverlap} />
            <SignalBar label="Synonym overlap" value={sentence.bestMatch.signals.synonymOverlap} />
            <SignalBar label="Word-order retention" value={sentence.bestMatch.signals.wordOrderOverlap} />
          </div>
        </>
      )}

      <p style={styles.detailLabel}>Why it was flagged</p>
      <p style={styles.detailBody}>{sentence.reason}</p>

      <p style={styles.detailLabel}>Recommended action</p>
      <p style={styles.detailBody}>{sentence.recommendedAction}</p>
    </div>
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
  listCol: {},
  colHeading: {
    fontSize: 15,
    marginBottom: 14,
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
    gap: 10,
    textAlign: "left",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 12px",
    cursor: "pointer",
    color: "var(--white)",
    transition: "border-color 0.15s ease, background 0.15s ease",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    marginTop: 5,
    flexShrink: 0,
  },
  listText: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  listSentence: {
    fontSize: 13.5,
    lineHeight: 1.4,
  },
  listStatus: {
    fontSize: 11.5,
    fontFamily: "var(--font-mono)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  detailCol: {},
  detailCard: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "22px 24px",
  },
  detailHead: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  badge: {
    fontSize: 11.5,
    fontFamily: "var(--font-mono)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    border: "1px solid",
    borderRadius: "var(--radius-sm)",
    padding: "3px 10px",
  },
  detailScore: {
    fontSize: 13,
    color: "var(--text-muted)",
  },
  detailLabel: {
    fontSize: 11.5,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--text-muted)",
    marginTop: 16,
    marginBottom: 6,
  },
  detailQuote: {
    fontSize: 14.5,
    lineHeight: 1.6,
    fontStyle: "italic",
    color: "var(--white)",
  },
  sourceLine: {
    fontSize: 12.5,
    color: "var(--text-muted)",
    marginTop: 4,
  },
  detailBody: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "var(--text-secondary)",
  },
  signalLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "var(--text-muted)",
    marginBottom: 4,
  },
  signalLabel: {},
  signalValue: {
    fontFamily: "var(--font-mono)",
  },
  signalTrack: {
    height: 5,
    borderRadius: 3,
    background: "var(--surface)",
    overflow: "hidden",
  },
  signalFill: {
    height: "100%",
    background: "var(--blue-bright)",
    borderRadius: 3,
  },
  emptyDetail: {
    border: "1px dashed var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "40px 24px",
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: 14,
  },
};
