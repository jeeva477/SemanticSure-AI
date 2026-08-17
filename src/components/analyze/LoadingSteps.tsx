import { useEffect, useState, type CSSProperties } from "react";

// These messages describe exactly what the local engine is doing at each
// stage. No claims about external databases, APIs, or dataset sizes.
const STEPS = [
  "Reading document…",
  "Comparing available reference material…",
  "Calculating sentence similarity…",
  "Preparing your results…",
];

export default function LoadingSteps() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const progress = Math.round(((activeStep + 1) / STEPS.length) * 100);

  return (
    <div style={styles.wrap} role="status" aria-live="polite">
      <div style={styles.spinner} aria-hidden="true" />
      <div style={styles.progressTrack} aria-hidden="true">
        <div
          style={{
            ...styles.progressFill,
            width: `${progress}%`,
            background: activeStep >= STEPS.length - 1 ? "var(--green)" : "var(--gradient-primary)",
          }}
        />
      </div>
      <div style={styles.progressLabel}>{progress}% complete</div>
      <ul style={styles.list}>
        {STEPS.map((step, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          return (
            <li
              key={step}
              style={{
                ...styles.item,
                opacity: active || done ? 1 : 0.35,
                color: done ? "var(--text-muted)" : "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  ...styles.dot,
                  background: done ? "var(--green)" : active ? "var(--blue-bright)" : "var(--border)",
                }}
              >
                {done ? <IconCheck /> : null}
              </span>
              {step}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IconCheck() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1 5.5 3.5 8 9 2" stroke="var(--bg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    padding: "56px 24px",
  },
  spinner: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "3px solid var(--border)",
    borderTopColor: "var(--blue-bright)",
    animation: "spin 0.8s linear infinite",
  },
  progressTrack: {
    width: "100%",
    maxWidth: 420,
    height: 6,
    borderRadius: 3,
    background: "var(--surface)",
    overflow: "hidden",
    border: "1px solid var(--border)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.4s ease, background 0.4s ease",
  },
  progressLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "var(--text-muted)",
    letterSpacing: "0.06em",
  },
  list: {
    listStyle: "none",
    margin: "12px 0 0",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    fontFamily: "var(--font-mono)",
    transition: "opacity 0.3s ease",
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.3s ease",
  },
};