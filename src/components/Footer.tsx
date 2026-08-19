import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="container footer-grid">
        <div style={{ maxWidth: 320 }}>
          <Link to="/" style={styles.brand}>
            DeepParaphrase <span style={{ color: "var(--text-muted)" }}>AI</span>
          </Link>
          <p style={styles.tagline}>
            AI-powered plagiarism, paraphrase, and originality analysis.
          </p>
        </div>

        <nav style={styles.links} aria-label="Footer">
          <Link to="/#features" style={styles.link}>
            Features
          </Link>
          <Link to="/#how-it-works" style={styles.link}>
            How It Works
          </Link>
          <Link to="/analyze" style={styles.link}>
            Analyze Document
          </Link>
        </nav>
      </div>
      <div className="container">
        <p style={styles.copyright}>© 2026 DeepParaphrase AI</p>
      </div>
    </footer>
  );
}

const styles: Record<string, CSSProperties> = {
  footer: {
    borderTop: "1px solid var(--border)",
    boxShadow: "0 -1px 0 rgba(139, 92, 246, 0.12)",
    padding: "48px 0 28px",
  },
  brand: {
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: 18,
    color: "var(--white)",
  },
  tagline: {
    fontSize: 13.5,
    marginTop: 10,
    lineHeight: 1.6,
  },
  links: {
    display: "flex",
    gap: 28,
  },
  link: {
    fontSize: 14,
    color: "var(--text-secondary)",
  },
  copyright: {
    fontSize: 12.5,
    color: "var(--text-muted)",
    marginTop: 36,
  },
};
