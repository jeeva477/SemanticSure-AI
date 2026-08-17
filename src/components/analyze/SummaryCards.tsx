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

function modeLabel(mode: string): string {
  switch (mode) {
    case "live_online":
      return "🌐 Live Open-Source Knowledge Base";
    case "custom_source":
      return "📄 Dual-Document Custom Comparison";
    case "internal_check":
      return "🔄 Intra-Document Redundancy Mode";
    default:
      return "📚 Standard Reference Corpus";
  }
}

function focusLabel(focus: string): string {
  switch (focus) {
    case "plagiarism_strict":
      return "🎯 Strict Direct Plagiarism Focus";
    case "paraphrase_deep":
      return "🧠 Deep Paraphrase & Semantic Focus";
    default:
      return "⚖️ Balanced Detection Focus";
  }
}

export default function SummaryCards({ analysis }: Props) {
  const { stats, tuning } = analysis;

  return (
    <div>
      {/* Mode and Tuning Badges */}
      <div style={styles.headerBadgeRow}>
        <span style={styles.modeBadge}>{modeLabel(analysis.mode)}</span>
        <span style={styles.focusBadge}>{focusLabel(tuning?.focus || "balanced")}</span>
        <span style={styles.sensitivityBadge}>
          Sensitivity: {(tuning?.sensitivity || "medium").toUpperCase()}
        </span>
        {analysis.activeSourcesCount && (
          <span style={styles.sourceCountBadge}>
            {analysis.activeSourcesCount} Sources Indexed
          </span>
        )}
      </div>

      {/* Main Metric Cards: Originality, Plagiarism Index, Paraphrase Index, Sentences */}
      <div className="grid-4" style={{ marginTop: 12 }}>
        <div style={styles.card}>
          <span className="eyebrow">Overall Originality</span>
          <div style={{ ...styles.bigValue, color: "var(--green)" }}>{analysis.originalityScore}%</div>
          <div style={styles.subLabel}>Calculated Score</div>
        </div>

        <div style={styles.card}>
          <span className="eyebrow">Direct Plagiarism Index</span>
          <div style={{ ...styles.bigValue, color: riskColor(analysis.similarityRisk.label) }}>
            {analysis.plagiarismScore}%
          </div>
          <div style={styles.subLabel}>Verbatim overlap: {analysis.similarityRisk.label}</div>
        </div>

        <div style={styles.card}>
          <span className="eyebrow">Paraphrase Index</span>
          <div style={{ ...styles.bigValue, color: "var(--violet-deep)" }}>
            {analysis.paraphraseScore}%
          </div>
          <div style={styles.subLabel}>Semantic rewrites: {analysis.paraphraseRisk.label}</div>
        </div>

        <div style={styles.card}>
          <span className="eyebrow">Sentences Flagged</span>
          <div style={styles.bigValue}>
            {analysis.flaggedCount}
            <span style={styles.of}> / {stats.sentenceCount}</span>
          </div>
          <div style={styles.subLabel}>Review Risk: {analysis.reviewRisk.label}</div>
        </div>
      </div>

      {/* Document Stats Row */}
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
  headerBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  modeBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--blue-bright)",
    background: "rgba(59, 130, 246, 0.12)",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    borderRadius: "var(--radius-sm)",
    padding: "4px 10px",
    fontFamily: "var(--font-mono)",
  },
  focusBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--violet-deep)",
    background: "rgba(139, 92, 246, 0.12)",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    borderRadius: "var(--radius-sm)",
    padding: "4px 10px",
    fontFamily: "var(--font-mono)",
  },
  sensitivityBadge: {
    fontSize: 12,
    color: "var(--text-secondary)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "4px 10px",
    fontFamily: "var(--font-mono)",
  },
  sourceCountBadge: {
    fontSize: 12,
    color: "var(--text-muted)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "4px 10px",
    fontFamily: "var(--font-mono)",
  },
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
    marginTop: 3,
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
