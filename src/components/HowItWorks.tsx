import type { CSSProperties } from "react";

const STEPS = [
  {
    n: "01",
    title: "Upload",
    body: "Upload your document in a few seconds.",
  },
  {
    n: "02",
    title: "Analyze",
    body: "SemanticSure AI analyzes the content for originality.",
  },
  {
    n: "03",
    title: "Improve",
    body: "Review flagged passages and suggested changes.",
  },
  {
    n: "04",
    title: "Report",
    body: "Generate your professional originality report.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section" style={{ background: "var(--surface)" }}>
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">How It Works</span>
          <h2>From draft to report in four steps</h2>
        </div>

        <div style={styles.row}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={styles.stepWrap} className="reveal">
              <div className="hover-card card-accent" style={{ ...styles.step, animationDelay: `${i * 0.06}s` }}>
                <span style={styles.num}>{s.n}</span>
                <h3 style={styles.title}>{s.title}</h3>
                <p style={styles.body}>{s.body}</p>
              </div>
              {i < STEPS.length - 1 && <span style={styles.connector} aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: 0,
  },
  stepWrap: {
    flex: "1 1 220px",
    display: "flex",
    alignItems: "stretch",
    minWidth: 200,
  },
  step: {
    flex: 1,
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "26px 22px",
    marginRight: 16,
    marginBottom: 16,
  },
  connector: {
    display: "none",
  },
  num: {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    color: "var(--blue-bright)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 30,
    padding: "4px 8px",
    borderRadius: "var(--radius-sm)",
    background: "rgba(59, 130, 246, 0.1)",
    border: "1px solid rgba(59, 130, 246, 0.25)",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 1.55,
  },
};
