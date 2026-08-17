import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="section">
      <div className="container">
        <div className="reveal" style={styles.panel}>
          <h2 style={styles.heading}>
            Ready to check your document?{" "}
            <span className="grad-text">See what your writing says.</span>
          </h2>
          <p style={styles.body}>
            Understand your originality, improve your writing, and generate
            a professional report.
          </p>
          <Link to="/analyze" className="btn btn-primary" style={styles.btn}>
            Analyze My Document
          </Link>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  panel: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "64px 40px",
    textAlign: "center",
    boxShadow: "0 0 0 1px rgba(139, 92, 246, 0.08), 0 24px 60px -30px rgba(0,0,0,0.6)",
  },
  heading: {
    fontSize: "clamp(26px, 3.2vw, 34px)",
  },
  body: {
    fontSize: 16,
    maxWidth: 460,
    margin: "16px auto 0",
    lineHeight: 1.6,
  },
  btn: {
    marginTop: 30,
  },
};
