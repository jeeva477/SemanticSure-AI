import type { CSSProperties } from "react";
import type { DocumentAnalysis } from "../../types/analysis";

interface Props {
  analysis: DocumentAnalysis;
}

function riskColor(label: "Low" | "Medium" | "High"): string {
  if (label === "High") return "var(--red)";
  if (label === "Medium") return "var(--amber)";
  return "var(--green)";
}

export default function SummaryCards({ analysis }: Props) {
  const { stats } = analysis;

  return (
    <div>
      <div className="grid-4">
        <div style={styles.card}>
          <span className="eyebrow">Originality</span>
          <div style={{ ...styles.bigValue, color: "var(--green)" }}>{analysis.originalityScore}%</div>
        </div>
        <div style={styles.card}>
          <span className="eyebrow">Similarity Risk</span>
          <div style={{ ...styles.bigValue, color: riskColor(analysis.similarityRisk.label) }}>
            {analysis.similarityRisk.score}%
          </div>
          <div style={styles.subLabel}>{analysis.similarityRisk.label}</div>
        </div>
        <div style={styles.card}>
          <span className="eyebrow">Review Risk</span>
          <div style={{ ...styles.bigValue, color: riskColor(analysis.reviewRisk.label) }}>
            {analysis.reviewRisk.score}%
          </div>
          <div style={styles.subLabel}>{analysis.reviewRisk.label}</div>
        </div>
        <div style={styles.card}>
          <span className="eyebrow">Sentences to Review</span>
          <div style={styles.bigValue}>
            {analysis.flaggedCount}
            <span style={styles.of}> / {stats.sentenceCount}</span>
          </div>
        </div>
      </div>

      <div className="grid-4" style={styles.statsRow}>
        <Stat label="Word count" value={stats.wordCount.toLocaleString()} />
        <Stat label="Sentence count" value={stats.sentenceCount.toLocaleString()} />
        <Stat label="Reading time" value={`${stats.readingTimeMinutes} min`} />
        <Stat label="Vocabulary diversity" value={`${stats.vocabularyDiversity}%`} />
      </div>

      <p style={styles.scopeNote}>{analysis.referenceScopeNote}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statItem}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "18px 20px",
  },
  bigValue: {
    fontFamily: "var(--font-display)",
    fontSize: 30,
    fontWeight: 600,
    marginTop: 8,
    color: "var(--white)",
  },
  of: {
    fontSize: 16,
    color: "var(--text-muted)",
    fontFamily: "var(--font-body)",
  },
  subLabel: {
    fontSize: 12.5,
    color: "var(--text-muted)",
    marginTop: 2,
  },
  statsRow: {
    marginTop: 16,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "16px 20px",
  },
  statItem: {
    textAlign: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: 600,
    color: "var(--white)",
    fontFamily: "var(--font-mono)",
  },
  statLabel: {
    fontSize: 12,
    color: "var(--text-muted)",
    marginTop: 4,
  },
  scopeNote: {
    marginTop: 16,
    fontSize: 13,
    color: "var(--text-muted)",
    fontStyle: "italic",
  },
};
