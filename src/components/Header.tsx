import type { CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();
  const isAnalyzePage = location.pathname === "/analyze";

  return (
    <header style={styles.header}>
      <div className="container" style={styles.inner}>
        <Link to="/" style={styles.brand}>
          <span style={styles.mark} aria-hidden="true">
            D
          </span>
          DeepParaphrase <span style={{ color: "var(--text-muted)" }}>AI</span>
        </Link>

        <nav className="nav-links" style={styles.nav} aria-label="Primary">
          <Link to="/#features" className="nav-link" style={styles.navLink}>
            Features
          </Link>
          <Link to="/#how-it-works" className="nav-link" style={styles.navLink}>
            How It Works
          </Link>
        </nav>

        <Link
          to="/analyze"
          className="btn btn-primary"
          style={styles.cta}
        >
          {isAnalyzePage ? "New Analysis" : "Analyze Document"}
        </Link>
      </div>
    </header>
  );
}

const styles: Record<string, CSSProperties> = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 40,
    background: "rgba(11, 18, 32, 0.82)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid var(--border)",
    boxShadow: "0 1px 0 rgba(59, 130, 246, 0.12)",
  },
  inner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 72,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: 19,
    color: "var(--white)",
  },
  mark: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 7,
    background: "var(--blue)",
    color: "var(--white)",
    fontFamily: "var(--font-mono)",
    fontSize: 14,
    fontWeight: 500,
  },
  nav: {
    display: "flex",
    gap: 32,
  },
  navLink: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-secondary)",
  },
  cta: {
    padding: "10px 20px",
    fontSize: 14,
  },
};
