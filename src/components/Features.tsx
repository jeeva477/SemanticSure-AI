import type { CSSProperties } from "react";

const FEATURES = [
  {
    icon: <IconScan />,
    title: "Plagiarism Detection",
    body: "Identify potentially copied content by comparing your document against existing published sources.",
  },
  {
    icon: <IconLayers />,
    title: "Paraphrase Detection",
    body: "Identify content that may have been rewritten while keeping a similar meaning to the original source.",
  },
  {
    icon: <IconTarget />,
    title: "Where to Change",
    body: "See exactly which sentences and passages need attention, so you know where to focus your revisions.",
  },
  {
    icon: <IconFile />,
    title: "Professional Reports",
    body: "Generate a clear, detailed originality report you can save, share, or submit alongside your work.",
  },
];

export default function Features() {
  return (
    <section id="features" className="section">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Features</span>
          <h2>Everything you need to verify originality</h2>
        </div>

        <div className="grid-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="reveal hover-card card-accent"
              style={{ ...styles.card, animationDelay: `${i * 0.06}s` }}
            >
              <div style={styles.iconWrap}>{f.icon}</div>
              <h3 style={styles.title}>{f.title}</h3>
              <p style={styles.body}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "28px 24px",
    transition: "border-color 0.2s ease, transform 0.2s ease",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: "var(--radius-sm)",
    background: "var(--card)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--blue-bright)",
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    marginBottom: 10,
  },
  body: {
    fontSize: 14.5,
    lineHeight: 1.6,
  },
};

/* --- minimal line icons, no external icon library --- */

function IconScan() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 3 8l9 5 9-5-9-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 12l9 5 9-5M3 16l9 5 9-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="9" y1="17" x2="15" y2="17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
