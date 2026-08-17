import { useState, type CSSProperties } from "react";
import type { DocumentAnalysis, SentenceAnalysis, SentenceClassification } from "../../types/analysis";

interface Props {
  analysis: DocumentAnalysis;
  selectedSentenceIndex: number | null;
  onSelectSentence: (index: number) => void;
}

const STATUS_COLOR: Record<SentenceClassification, string> = {
  CLEAN: "var(--green)",
  POSSIBLE_SIMILARITY: "var(--amber)",
  HIGH_SIMILARITY: "var(--red)",
  POSSIBLE_PARAPHRASE: "var(--violet)",
  HIGH_PARAPHRASE: "var(--violet-deep)",
  EXACT_MATCH: "#dc2626",
};

export default function ReportCharts({ analysis, selectedSentenceIndex, onSelectSentence }: Props) {
  const [filter, setFilter] = useState<"ALL" | "FLAGGED" | "CLEAN">("ALL");
  const [hoveredSentence, setHoveredSentence] = useState<SentenceAnalysis | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const sentences = analysis.sentences.filter((s) => s.text.trim().length > 0);

  const filteredSentences = sentences.filter((s) => {
    if (filter === "FLAGGED") return s.classification !== "CLEAN";
    if (filter === "CLEAN") return s.classification === "CLEAN";
    return true;
  });

  // Calculate distribution metrics
  const counts = {
    CLEAN: sentences.filter((s) => s.classification === "CLEAN").length,
    POSSIBLE_SIMILARITY: sentences.filter((s) => s.classification === "POSSIBLE_SIMILARITY").length,
    HIGH_SIMILARITY: sentences.filter((s) => s.classification === "HIGH_SIMILARITY").length,
    POSSIBLE_PARAPHRASE: sentences.filter((s) => s.classification === "POSSIBLE_PARAPHRASE").length,
    HIGH_PARAPHRASE: sentences.filter((s) => s.classification === "HIGH_PARAPHRASE").length,
    EXACT_MATCH: sentences.filter((s) => s.classification === "EXACT_MATCH").length,
  };

  const total = sentences.length || 1;
  const pcts = {
    CLEAN: Math.round((counts.CLEAN / total) * 100),
    POSSIBLE_SIMILARITY: Math.round((counts.POSSIBLE_SIMILARITY / total) * 100),
    HIGH_SIMILARITY: Math.round((counts.HIGH_SIMILARITY / total) * 100),
    POSSIBLE_PARAPHRASE: Math.round((counts.POSSIBLE_PARAPHRASE / total) * 100),
    HIGH_PARAPHRASE: Math.round((counts.HIGH_PARAPHRASE / total) * 100),
    EXACT_MATCH: Math.round((counts.EXACT_MATCH / total) * 100),
  };

  // Calculate average signal scores across flagged sentences (or all if none)
  const flagged = sentences.filter((s) => s.bestMatch !== null);
  const targetForSignals = flagged.length > 0 ? flagged : sentences;
  const avgTfidf =
    Math.round(
      (targetForSignals.reduce((acc, s) => acc + (s.bestMatch?.signals.tfidfSimilarity ?? 0), 0) /
        (targetForSignals.length || 1)) *
        100
    );
  const avgWord =
    Math.round(
      (targetForSignals.reduce((acc, s) => acc + (s.bestMatch?.signals.wordOverlap ?? 0), 0) /
        (targetForSignals.length || 1)) *
        100
    );
  const avgBigram =
    Math.round(
      (targetForSignals.reduce((acc, s) => acc + (s.bestMatch?.signals.bigramOverlap ?? 0), 0) /
        (targetForSignals.length || 1)) *
        100
    );
  const avgTrigram =
    Math.round(
      (targetForSignals.reduce((acc, s) => acc + (s.bestMatch?.signals.trigramOverlap ?? 0), 0) /
        (targetForSignals.length || 1)) *
        100
    );
  const avgSynonym =
    Math.round(
      (targetForSignals.reduce((acc, s) => acc + (s.bestMatch?.signals.synonymOverlap ?? 0), 0) /
        (targetForSignals.length || 1)) *
        100
    );
  const avgWordOrder =
    Math.round(
      (targetForSignals.reduce((acc, s) => acc + (s.bestMatch?.signals.wordOrderOverlap ?? 0), 0) /
        (targetForSignals.length || 1)) *
        100
    );

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <span className="eyebrow">Visual Telemetry</span>
          <h2 style={styles.title}>Originality & Risk Analysis Graphs</h2>
        </div>
        <div style={styles.badgeWrap}>
          <span
            style={{
              ...styles.statusBadge,
              borderColor:
                analysis.originalityScore >= 80
                  ? "var(--green)"
                  : analysis.originalityScore >= 50
                  ? "var(--amber)"
                  : "var(--red)",
              color:
                analysis.originalityScore >= 80
                  ? "var(--green)"
                  : analysis.originalityScore >= 50
                  ? "var(--amber)"
                  : "var(--red)",
            }}
          >
            {analysis.originalityScore >= 80
              ? "Verified Authentic"
              : analysis.originalityScore >= 50
              ? "Moderate Similarity"
              : "Substantial Overlap"}
          </span>
        </div>
      </div>

      {/* Top row: 3 Cards (Radial Gauge, Distribution Donut/Bar, Multi-Signal Analysis) */}
      <div className="report-top-grid" style={styles.topGrid}>
        {/* Card 1: Radial Originality Score */}
        <div style={styles.subCard}>
          <h3 style={styles.cardHeading}>Originality Index</h3>
          <p style={styles.cardSub}>Composite originality calculated across sentence vectors</p>
          <div style={styles.gaugeContainer}>
            <RadialGauge score={analysis.originalityScore} />
          </div>
          <div style={styles.gaugeFooter}>
            <div style={styles.gaugeStat}>
              <span style={styles.statLabel}>Similarity Risk</span>
              <span
                style={{
                  ...styles.statValue,
                  color:
                    analysis.similarityRisk.label === "High"
                      ? "var(--red)"
                      : analysis.similarityRisk.label === "Medium"
                      ? "var(--amber)"
                      : "var(--green)",
                }}
              >
                {analysis.similarityRisk.score}% ({analysis.similarityRisk.label})
              </span>
            </div>
            <div style={styles.gaugeStat}>
              <span style={styles.statLabel}>Paraphrase Risk</span>
              <span
                style={{
                  ...styles.statValue,
                  color:
                    analysis.paraphraseRisk.label === "High"
                      ? "var(--violet-deep)"
                      : analysis.paraphraseRisk.label === "Medium"
                      ? "var(--violet)"
                      : "var(--green)",
                }}
              >
                {analysis.paraphraseRisk.score}% ({analysis.paraphraseRisk.label})
              </span>
            </div>
            <div style={styles.gaugeStat}>
              <span style={styles.statLabel}>Review Risk</span>
              <span
                style={{
                  ...styles.statValue,
                  color:
                    analysis.reviewRisk.label === "High"
                      ? "var(--red)"
                      : analysis.reviewRisk.label === "Medium"
                      ? "var(--amber)"
                      : "var(--green)",
                }}
              >
                {analysis.reviewRisk.score}% ({analysis.reviewRisk.label})
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Sentence Classification Breakdown */}
        <div style={styles.subCard}>
          <h3 style={styles.cardHeading}>Sentence Distribution</h3>
          <p style={styles.cardSub}>Classification breakdown across {sentences.length} sentences</p>
          <div style={styles.donutWrap}>
            <DonutChart counts={counts} total={total} />
          </div>
          <div style={styles.distributionList}>
            <DistributionItem
              color="var(--green)"
              label="Clean"
              count={counts.CLEAN}
              pct={pcts.CLEAN}
            />
            <DistributionItem
              color="var(--amber)"
              label="Possible Similarity"
              count={counts.POSSIBLE_SIMILARITY}
              pct={pcts.POSSIBLE_SIMILARITY}
            />
            <DistributionItem
              color="var(--violet)"
              label="Possible Paraphrase"
              count={counts.POSSIBLE_PARAPHRASE}
              pct={pcts.POSSIBLE_PARAPHRASE}
            />
            <DistributionItem
              color="var(--red)"
              label="High Similarity"
              count={counts.HIGH_SIMILARITY}
              pct={pcts.HIGH_SIMILARITY}
            />
            <DistributionItem
              color="var(--violet-deep)"
              label="High Paraphrase"
              count={counts.HIGH_PARAPHRASE}
              pct={pcts.HIGH_PARAPHRASE}
            />
            <DistributionItem
              color="#dc2626"
              label="Exact Match"
              count={counts.EXACT_MATCH}
              pct={pcts.EXACT_MATCH}
            />
          </div>
        </div>

        {/* Card 3: Multi-Signal Semantic Spectrum */}
        <div style={styles.subCard}>
          <h3 style={styles.cardHeading}>Multi-Factor Signals</h3>
          <p style={styles.cardSub}>Comparative vector & n-gram overlap metrics</p>
          <div style={styles.signalMetrics}>
            <SignalMeter label="TF-IDF Semantic Cosine" value={avgTfidf} />
            <SignalMeter label="Unigram Word Overlap" value={avgWord} />
            <SignalMeter label="Bigram Phrase Overlap" value={avgBigram} />
            <SignalMeter label="Trigram Structure Overlap" value={avgTrigram} />
            <SignalMeter
              label="Synonym Semantic Overlap"
              value={avgSynonym}
              helper="Meaning-aware, catches reworded content"
              highlight="var(--violet)"
            />
            <SignalMeter
              label="Word-Order Retention"
              value={avgWordOrder}
              helper="Longest common word subsequence"
              highlight="var(--violet)"
            />
            <SignalMeter
              label="Lexical Diversity"
              value={Math.round(analysis.stats.vocabularyDiversity)}
              helper="Unique word ratio"
              highlight="var(--blue-bright)"
            />
          </div>
        </div>
      </div>

      {/* Bottom Main Chart: Interactive Sentence Similarity Progression Timeline */}
      <div style={styles.timelineCard}>
        <div style={styles.timelineHeader}>
          <div>
            <h3 style={styles.cardHeading}>Sentence Similarity Progression Graph</h3>
            <p style={styles.cardSub}>
              Interactive timeline mapping similarity scores across the document from sentence #1 to #{sentences.length}.
              Click any bar to inspect details in the manuscript inspector below.
            </p>
          </div>
          <div style={styles.filterGroup}>
            <button
              type="button"
              style={{
                ...styles.filterBtn,
                ...(filter === "ALL" ? styles.filterBtnActive : {}),
              }}
              onClick={() => setFilter("ALL")}
            >
              All ({sentences.length})
            </button>
            <button
              type="button"
              style={{
                ...styles.filterBtn,
                ...(filter === "FLAGGED" ? styles.filterBtnActive : {}),
              }}
              onClick={() => setFilter("FLAGGED")}
            >
              Flagged ({analysis.flaggedCount})
            </button>
            <button
              type="button"
              style={{
                ...styles.filterBtn,
                ...(filter === "CLEAN" ? styles.filterBtnActive : {}),
              }}
              onClick={() => setFilter("CLEAN")}
            >
              Clean ({counts.CLEAN})
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={styles.legendRow}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "var(--green)" }} />
            <span>Clean (&lt; 25%)</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "var(--amber)" }} />
            <span>Possible (25% - 54%)</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "var(--violet)" }} />
            <span>Paraphrase</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "var(--red)" }} />
            <span>High Similarity (&ge; 55%)</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "#dc2626" }} />
            <span>Exact Match (100%)</span>
          </div>
        </div>

        {/* The Graph Canvas / SVG container */}
        <div style={styles.chartScrollArea}>
          <div style={styles.chartWrapper}>
            <ProgressionChart
              sentences={filteredSentences}
              selectedSentenceIndex={selectedSentenceIndex}
              onSelectSentence={onSelectSentence}
              onHoverSentence={(sentence, pos) => {
                setHoveredSentence(sentence);
                setTooltipPos(pos);
              }}
            />
          </div>
        </div>

        {/* Interactive Tooltip popup */}
        {hoveredSentence && tooltipPos && (
          <div
            style={{
              ...styles.tooltip,
              left: Math.min(Math.max(tooltipPos.x, 140), window.innerWidth - 260),
              top: tooltipPos.y - 120,
            }}
          >
            <div style={styles.tooltipHead}>
              <span
                style={{
                  ...styles.tooltipBadge,
                  background: STATUS_COLOR[hoveredSentence.classification],
                }}
              />
              <span style={styles.tooltipTitle}>Sentence #{hoveredSentence.index + 1}</span>
              <span style={styles.tooltipScore}>{hoveredSentence.score}% match</span>
            </div>
            <p style={styles.tooltipText}>"{truncate(hoveredSentence.text, 100)}"</p>
            {hoveredSentence.classification !== "CLEAN" && (
              <p style={{ ...styles.tooltipSource, color: STATUS_COLOR[hoveredSentence.classification] }}>
                Paraphrase closeness: {hoveredSentence.paraphraseScore}%
              </p>
            )}
            {hoveredSentence.bestMatch && (
              <p style={styles.tooltipSource}>
                Match: {hoveredSentence.bestMatch.referenceTitle}
              </p>
            )}
            <span style={styles.tooltipHint}>Click bar to inspect in manuscript</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Radial Gauge Component (SVG)
// ---------------------------------------------------------------------------
function RadialGauge({ score }: { score: number }) {
  const radius = 64;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Use a 270 degree arc (3/4 circle)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (score / 100) * arcLength;

  const scoreColor =
    score >= 80 ? "var(--green)" : score >= 50 ? "var(--amber)" : "var(--red)";

  return (
    <div style={styles.gaugeWrapper}>
      <svg height={150} width={150} viewBox="0 0 150 150">
        <g transform="translate(75,75) rotate(135)">
          {/* Background Track Arc */}
          <circle
            stroke="var(--surface)"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={0}
            cy={0}
          />
          {/* Active Score Arc */}
          <circle
            stroke={scoreColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: "stroke-dashoffset 1s ease-in-out, stroke 0.4s ease",
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={0}
            cy={0}
          />
        </g>
        {/* Center Text */}
        <text
          x="75"
          y="74"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--white)"
          fontFamily="var(--font-display)"
          fontSize="32"
          fontWeight="700"
        >
          {score}%
        </text>
        <text
          x="75"
          y="100"
          textAnchor="middle"
          fill="var(--text-muted)"
          fontFamily="var(--font-mono)"
          fontSize="10"
          style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          Originality
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut / Ring Breakdown Component
// ---------------------------------------------------------------------------
function DonutChart({
  counts,
  total,
}: {
  counts: {
    CLEAN: number;
    POSSIBLE_SIMILARITY: number;
    HIGH_SIMILARITY: number;
    POSSIBLE_PARAPHRASE: number;
    HIGH_PARAPHRASE: number;
    EXACT_MATCH: number;
  };
  total: number;
}) {
  const radius = 54;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const segments: { key: keyof typeof counts; color: string }[] = [
    { key: "CLEAN", color: "var(--green)" },
    { key: "POSSIBLE_SIMILARITY", color: "var(--amber)" },
    { key: "POSSIBLE_PARAPHRASE", color: "var(--violet)" },
    { key: "HIGH_SIMILARITY", color: "var(--red)" },
    { key: "HIGH_PARAPHRASE", color: "var(--violet-deep)" },
    { key: "EXACT_MATCH", color: "#dc2626" },
  ];

  let offset = 0;

  return (
    <div style={{ position: "relative", width: 120, height: 120 }}>
      <svg width={120} height={120} viewBox="0 0 120 120">
        <g transform="translate(60,60) rotate(-90)">
          {segments.map((seg) => {
            const len = (counts[seg.key] / total) * circumference;
            if (counts[seg.key] <= 0) return null;
            const dashOffset = offset;
            offset += len;
            return (
              <circle
                key={seg.key}
                stroke={seg.color}
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={`${len} ${circumference}`}
                strokeDashoffset={-dashOffset}
                r={normalizedRadius}
                cx={0}
                cy={0}
              />
            );
          })}
        </g>
        <text
          x="60"
          y="56"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--white)"
          fontFamily="var(--font-mono)"
          fontSize="16"
          fontWeight="600"
        >
          {total}
        </text>
        <text
          x="60"
          y="74"
          textAnchor="middle"
          fill="var(--text-muted)"
          fontFamily="var(--font-mono)"
          fontSize="8.5"
          style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}
        >
          Sentences
        </text>
      </svg>
    </div>
  );
}

function DistributionItem({
  color,
  label,
  count,
  pct,
}: {
  color: string;
  label: string;
  count: number;
  pct: number;
}) {
  return (
    <div style={styles.distItem}>
      <div style={styles.distLeft}>
        <span style={{ ...styles.distDot, background: color }} />
        <span style={styles.distLabel}>{label}</span>
      </div>
      <div style={styles.distRight}>
        <span style={styles.distCount}>{count}</span>
        <span style={styles.distPct}>({pct}%)</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multi-Signal Meter Component
// ---------------------------------------------------------------------------
function SignalMeter({
  label,
  value,
  helper,
  highlight,
}: {
  label: string;
  value: number;
  helper?: string;
  highlight?: string;
}) {
  const barColor =
    highlight ?? (value >= 55 ? "var(--red)" : value >= 25 ? "var(--amber)" : "var(--green)");

  return (
    <div style={styles.meterItem}>
      <div style={styles.meterLabelRow}>
        <span style={styles.meterLabel}>{label}</span>
        <span style={{ ...styles.meterValue, color: barColor }}>{value}%</span>
      </div>
      <div style={styles.meterTrack}>
        <div
          style={{
            ...styles.meterFill,
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: barColor,
          }}
        />
      </div>
      {helper && <span style={styles.meterHelper}>{helper}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Progression Chart Component
// ---------------------------------------------------------------------------
function ProgressionChart({
  sentences,
  selectedSentenceIndex,
  onSelectSentence,
  onHoverSentence,
}: {
  sentences: SentenceAnalysis[];
  selectedSentenceIndex: number | null;
  onSelectSentence: (index: number) => void;
  onHoverSentence: (sentence: SentenceAnalysis | null, pos: { x: number; y: number } | null) => void;
}) {
  const chartHeight = 220;
  const paddingBottom = 30;
  const paddingTop = 20;
  const plotHeight = chartHeight - paddingBottom - paddingTop;
  const minBarWidth = 24;
  const gap = 10;
  const chartWidth = Math.max(760, sentences.length * (minBarWidth + gap) + 60);

  if (sentences.length === 0) {
    return (
      <div style={styles.emptyChart}>
        <p>No sentences match the selected filter.</p>
      </div>
    );
  }

  const y55 = paddingTop + plotHeight * (1 - 55 / 100);
  const y25 = paddingTop + plotHeight * (1 - 25 / 100);

  return (
    <svg
      width={chartWidth}
      height={chartHeight}
      style={{ display: "block", overflow: "visible" }}
    >
      {/* Grid Lines & Threshold Guides */}
      <line
        x1={35}
        y1={paddingTop}
        x2={chartWidth - 10}
        y2={paddingTop}
        stroke="var(--border)"
        strokeDasharray="3 3"
        strokeOpacity={0.4}
      />
      <text x={8} y={paddingTop + 4} fill="var(--text-muted)" fontSize={10} fontFamily="var(--font-mono)">
        100%
      </text>

      {/* High Similarity Threshold Line (55%) */}
      <line
        x1={35}
        y1={y55}
        x2={chartWidth - 10}
        y2={y55}
        stroke="var(--red)"
        strokeDasharray="4 4"
        strokeOpacity={0.5}
      />
      <text x={12} y={y55 + 3} fill="var(--red)" fontSize={9} fontFamily="var(--font-mono)" opacity={0.8}>
        55%
      </text>

      {/* Possible Similarity Threshold Line (25%) */}
      <line
        x1={35}
        y1={y25}
        x2={chartWidth - 10}
        y2={y25}
        stroke="var(--amber)"
        strokeDasharray="4 4"
        strokeOpacity={0.5}
      />
      <text x={12} y={y25 + 3} fill="var(--amber)" fontSize={9} fontFamily="var(--font-mono)" opacity={0.8}>
        25%
      </text>

      {/* Bottom Base Line (0%) */}
      <line
        x1={35}
        y1={paddingTop + plotHeight}
        x2={chartWidth - 10}
        y2={paddingTop + plotHeight}
        stroke="var(--border)"
      />
      <text x={16} y={paddingTop + plotHeight + 3} fill="var(--text-muted)" fontSize={10} fontFamily="var(--font-mono)">
        0%
      </text>

      {/* Bars for Each Sentence */}
      {sentences.map((s, i) => {
        const x = 45 + i * (minBarWidth + gap);
        // Minimum visual height of 4px for 0% scores so it's always interactable
        const barHeight = Math.max(4, (s.score / 100) * plotHeight);
        const y = paddingTop + plotHeight - barHeight;
        const isSelected = selectedSentenceIndex === s.index;
        const color = STATUS_COLOR[s.classification];

        return (
          <g
            key={s.index}
            style={{ cursor: "pointer" }}
            onClick={() => onSelectSentence(s.index)}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onHoverSentence(s, { x: rect.left + rect.width / 2, y: rect.top });
            }}
            onMouseLeave={() => onHoverSentence(null, null)}
          >
            {/* Hover Target Area */}
            <rect
              x={x - gap / 2}
              y={paddingTop}
              width={minBarWidth + gap}
              height={plotHeight + 24}
              fill="transparent"
            />

            {/* Selection Highlight Glow/Border */}
            {isSelected && (
              <rect
                x={x - 3}
                y={y - 4}
                width={minBarWidth + 6}
                height={barHeight + 8}
                rx={5}
                fill="none"
                stroke="var(--blue-bright)"
                strokeWidth={2}
              />
            )}

            {/* Background pill track */}
            <rect
              x={x}
              y={paddingTop}
              width={minBarWidth}
              height={plotHeight}
              rx={3}
              fill="var(--surface)"
              opacity={0.6}
            />

            {/* Value Bar */}
            <rect
              x={x}
              y={y}
              width={minBarWidth}
              height={barHeight}
              rx={3}
              fill={color}
              opacity={isSelected ? 1 : 0.85}
              style={{ transition: "opacity 0.2s ease, transform 0.2s ease" }}
            />

            {/* Score label above bar */}
            {s.score > 0 && (
              <text
                x={x + minBarWidth / 2}
                y={Math.max(12, y - 5)}
                textAnchor="middle"
                fill={color}
                fontSize={9}
                fontFamily="var(--font-mono)"
                fontWeight="500"
              >
                {Math.round(s.score)}%
              </text>
            )}

            {/* Sentence Number on X-Axis */}
            <text
              x={x + minBarWidth / 2}
              y={paddingTop + plotHeight + 16}
              textAnchor="middle"
              fill={isSelected ? "var(--white)" : "var(--text-muted)"}
              fontSize={10}
              fontFamily="var(--font-mono)"
              fontWeight={isSelected ? "600" : "400"}
            >
              #{s.index + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  title: {
    fontSize: "clamp(20px, 2.5vw, 26px)",
    marginTop: 4,
  },
  badgeWrap: {
    display: "flex",
    alignItems: "center",
  },
  statusBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    padding: "6px 14px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid",
    background: "rgba(255, 255, 255, 0.02)",
    fontWeight: 500,
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20,
  },
  subCard: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "20px 22px",
    display: "flex",
    flexDirection: "column",
  },
  cardHeading: {
    fontSize: 16,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12.5,
    color: "var(--text-muted)",
    lineHeight: 1.4,
    marginBottom: 16,
  },
  gaugeContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "8px 0 16px",
  },
  gaugeWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeFooter: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
    marginTop: "auto",
    paddingTop: 14,
    borderTop: "1px solid var(--border)",
  },
  gaugeStat: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.04em",
  },
  statValue: {
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "var(--font-mono)",
  },
  donutWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "4px 0 14px",
  },
  distributionList: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    marginTop: "auto",
    paddingTop: 12,
    borderTop: "1px solid var(--border)",
  },
  distItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 12.5,
  },
  distLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  distDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  distLabel: {
    color: "var(--text-secondary)",
  },
  distRight: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "var(--font-mono)",
    fontSize: 12,
  },
  distCount: {
    color: "var(--white)",
    fontWeight: 500,
  },
  distPct: {
    color: "var(--text-muted)",
  },
  signalMetrics: {
    display: "flex",
    flexDirection: "column",
    gap: 11,
    marginTop: "auto",
  },
  meterItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  meterLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
  },
  meterLabel: {
    color: "var(--text-secondary)",
  },
  meterValue: {
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
  },
  meterTrack: {
    height: 6,
    borderRadius: 3,
    background: "var(--surface)",
    overflow: "hidden",
  },
  meterFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.6s ease",
  },
  meterHelper: {
    fontSize: 10.5,
    color: "var(--text-muted)",
  },
  timelineCard: {
    position: "relative",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "24px 26px",
  },
  timelineHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
  },
  filterGroup: {
    display: "flex",
    gap: 6,
    background: "var(--surface)",
    padding: 4,
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
  },
  filterBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-muted)",
    padding: "6px 12px",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    borderRadius: 4,
    cursor: "pointer",
    transition: "background 0.15s ease, color 0.15s ease",
  },
  filterBtnActive: {
    background: "var(--card)",
    color: "var(--white)",
    fontWeight: 600,
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 20,
    fontSize: 12,
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  chartScrollArea: {
    width: "100%",
    overflowX: "auto",
    paddingBottom: 8,
  },
  chartWrapper: {
    minWidth: "100%",
  },
  emptyChart: {
    padding: "48px 0",
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: 14,
  },
  tooltip: {
    position: "fixed",
    zIndex: 50,
    background: "rgba(17, 24, 39, 0.95)",
    border: "1px solid var(--border)",
    backdropFilter: "blur(12px)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 14px",
    maxWidth: 280,
    pointerEvents: "none",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    transform: "translate(-50%, -100%)",
  },
  tooltipHead: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  tooltipBadge: {
    width: 7,
    height: 7,
    borderRadius: "50%",
  },
  tooltipTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--white)",
  },
  tooltipScore: {
    marginLeft: "auto",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-muted)",
  },
  tooltipText: {
    fontSize: 12.5,
    color: "var(--text-secondary)",
    lineHeight: 1.4,
    margin: 0,
    fontStyle: "italic",
  },
  tooltipSource: {
    fontSize: 11,
    color: "var(--blue-bright)",
    margin: 0,
  },
  tooltipHint: {
    fontSize: 10,
    color: "var(--text-muted)",
    borderTop: "1px solid var(--border)",
    paddingTop: 4,
    marginTop: 2,
    fontFamily: "var(--font-mono)",
  },
};
