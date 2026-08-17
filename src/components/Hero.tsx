import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section id="top" className="hero-aura" style={styles.hero}>
      <div className="container hero-grid">
        <div className="reveal">
          <div style={styles.chipRow}>
            <span style={styles.chip}>Plagiarism Check</span>
            <span style={styles.chip}>Paraphrase Detection</span>
            <span style={styles.chip}>Originality Report</span>
          </div>
          <h1 style={styles.h1}>
            Write with confidence.
            <br />
            <span className="grad-text">Prove your originality.</span>
          </h1>
          <p style={styles.sub}>
            Check your document for plagiarism and paraphrasing, discover
            where your writing needs improvement, and generate a
            professional originality report.
          </p>
          <div style={styles.actions}>
            <Link to="/analyze" className="btn btn-primary">
              Analyze Document
            </Link>
            <a href="#how-it-works" className="btn btn-secondary">
              How It Works
            </a>
          </div>
        </div>

        <div className="reveal" style={{ animationDelay: "0.1s" }}>
          <DocumentPreview />
        </div>
      </div>
    </section>
  );
}

function DocumentPreview() {
  return (
    <div style={styles.card} aria-hidden="true">
      <div style={styles.cardTopBar}>
        <span style={styles.docDot} />
        <span style={styles.docName}>manuscript_review.docx</span>
        <span style={styles.docStatus}>Live Preview</span>
      </div>

      <div style={styles.docBody}>
        <p style={styles.docText}>
          The growing use of language models has changed how researchers
          approach academic writing.{" "}
          <Flag n={1} tone="amber">
            Recent analysis suggests a notable share of submitted drafts
            contain passages that closely resemble existing published work.
          </Flag>{" "}
          Distinguishing original argument from reformulated text remains a
          persistent challenge for reviewers.{" "}
          <Flag n={2} tone="violet">
            Similar meaning conveyed through alternate wording is flagged as
            a potential paraphrase.
          </Flag>{" "}
          <Flag n={3} tone="green">
            Independent verification of source material continues to be the
            most reliable safeguard.
          </Flag>
        </p>
      </div>

      <div className="stat-row" style={styles.statRow}>
        <Stat label="Originality" value="87%" tone="green" />
        <Stat label="Plagiarism Risk" value="Low" tone="green" />
        <Stat label="Paraphrase Risk" value="Medium" tone="violet" />
        <Stat label="Sentences to Review" value="6" tone="neutral" />
      </div>
      <p style={styles.disclaimer}>Illustrative preview, not a live result</p>
    </div>
  );
}

function Flag({
  n,
  tone,
  children,
}: {
  n: number;
  tone: "amber" | "green" | "violet";
  children: string;
}) {
  const color =
    tone === "amber" ? "var(--amber)" : tone === "violet" ? "var(--violet)" : "var(--green)";
  return (
    <span
      style={{
        borderBottom: `2px solid ${color}`,
        paddingBottom: 1,
        position: "relative",
      }}
    >
      {children}
      <sup style={{ color, fontFamily: "var(--font-mono)", fontSize: 10, marginLeft: 2 }}>
        {n}
      </sup>
    </span>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "amber" | "violet" | "neutral";
}) {
  const color =
    tone === "green"
      ? "var(--green)"
      : tone === "amber"
      ? "var(--amber)"
      : tone === "violet"
      ? "var(--violet)"
      : "var(--white)";
  return (
    <div style={styles.stat}>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  hero: {
    padding: "88px 0 80px",
  },
  h1: {
    fontSize: "clamp(36px, 5vw, 54px)",
    lineHeight: 1.12,
    marginTop: 16,
    maxWidth: 600,
  },
  sub: {
    fontSize: 17,
    lineHeight: 1.65,
    marginTop: 22,
    maxWidth: 480,
  },
  actions: {
    display: "flex",
    gap: 14,
    marginTop: 34,
    flexWrap: "wrap",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: 28,
    boxShadow: "0 24px 60px -30px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.08)",
  },
  cardTopBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    paddingBottom: 18,
    marginBottom: 20,
    borderBottom: "1px solid var(--border)",
  },
  docDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--green)",
    display: "inline-block",
  },
  docName: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  docStatus: {
    marginLeft: "auto",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-muted)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  docBody: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "20px 22px",
  },
  docText: {
    fontFamily: "var(--font-display)",
    fontSize: 15.5,
    lineHeight: 1.75,
    color: "var(--text-secondary)",
  },
  statRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginTop: 20,
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 10px",
    textAlign: "center",
  },
  statValue: {
    fontFamily: "var(--font-mono)",
    fontSize: 17,
    fontWeight: 500,
  },
  statLabel: {
    fontSize: 10.5,
    color: "var(--text-muted)",
    lineHeight: 1.3,
  },
  disclaimer: {
    marginTop: 14,
    fontSize: 11,
    color: "var(--text-muted)",
    textAlign: "center",
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    background: "rgba(59, 130, 246, 0.08)",
    border: "1px solid rgba(59, 130, 246, 0.25)",
    borderRadius: "var(--radius-sm)",
    padding: "5px 12px",
  },
};
