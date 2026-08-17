import { useRef, useState, type CSSProperties } from "react";
import { countWords } from "../../utils/textProcessing";
import { splitSentences } from "../../utils/textProcessing";
import { MAX_DOCUMENT_CHARACTERS } from "../../utils/analyzer";

const SUPPORTED_EXTENSIONS = [".txt", ".md"];

const SAMPLE_DOCS = [
  {
    name: "Sample 1: Academic AI Study (Mixed Overlap)",
    docName: "academic_ai_study.txt",
    text: `The growing use of machine learning algorithms has fundamentally altered how scientific researchers interpret vast datasets. Machine learning is a branch of artificial intelligence that enables computers to learn patterns from data and make predictions without being explicitly programmed for every task. Recent investigations highlight how novel neural architectures improve feature extraction across domains. Distinguishing original arguments from paraphrased source literature remains a central priority for peer reviewers. Independent verification of source material continues to be the most reliable safeguard.`,
  },
  {
    name: "Sample 2: Workplace Strategy (Authentic / Clean)",
    docName: "workplace_strategy_brief.md",
    text: `Our leadership team conducted a quarterly assessment of distributed team productivity across twelve departments. Regular asynchronous updates reduced total meeting hours while preserving project velocity and cross-functional alignment. Continuous investment in documentation tooling and structured mentoring proved crucial for engineer onboarding and retention.`,
  },
  {
    name: "Sample 3: Environmental Essay (High Similarity)",
    docName: "environmental_review.txt",
    text: `Rising concentrations of greenhouse gases in the atmosphere are the primary driver of long-term global temperature increases. Photosynthesis is the process by which plants convert light energy into chemical energy stored in glucose. Primary sources, such as letters, official records, and firsthand accounts, provide direct evidence about events from the period in which they were created.`,
  },
  {
    name: "Sample 4: Paraphrased Rework (Paraphrase Detection)",
    docName: "paraphrased_rework.txt",
    text: `Machine learning is a field of artificial intelligence that lets computers find patterns in data and make predictions without explicit programming for each task. Modern systems improve their own performance as they encounter more examples instead of following fixed rules.`,
  },
];

interface Props {
  onAnalyze: (text: string, documentName: string) => void;
}

export default function DocumentInput({ onAnalyze }: Props) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = countWords(text);
  const sentenceCount = splitSentences(text).length;

  function loadSample(sample: (typeof SAMPLE_DOCS)[0]) {
    setText(sample.text);
    setFileName(sample.docName);
    setError(null);
  }

  function reset() {
    setText("");
    setFileName(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFile(file: File) {
    setError(null);
    const lowerName = file.name.toLowerCase();
    const isSupported = SUPPORTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    if (!isSupported) {
      setError("This file format is not supported in the current version.");
      return;
    }

    try {
      const content = await file.text();
      if (content.length > MAX_DOCUMENT_CHARACTERS) {
        setError(
          `This document is too large to analyze (limit: ${MAX_DOCUMENT_CHARACTERS.toLocaleString()} characters). Please shorten it and try again.`
        );
        return;
      }
      setText(content);
      setFileName(file.name);
    } catch {
      setError("Unable to read this document.");
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleAnalyzeClick() {
    setError(null);
    if (text.trim().length === 0) {
      setError("Please upload or enter a document before analyzing.");
      return;
    }
    if (text.length > MAX_DOCUMENT_CHARACTERS) {
      setError(
        `This document is too large to analyze (limit: ${MAX_DOCUMENT_CHARACTERS.toLocaleString()} characters). Please shorten it and try again.`
      );
      return;
    }
    onAnalyze(text, fileName ?? "Pasted document");
  }

  return (
    <div>
      <div
        className="dropzone"
        style={styles.dropzone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div style={styles.dropzoneInner}>
          <IconUpload />
          <p style={styles.dropzoneText}>
            Drag and drop a <strong>.txt</strong> or <strong>.md</strong> file, or{" "}
            <button type="button" style={styles.linkButton} onClick={() => fileInputRef.current?.click()}>
              browse your files
            </button>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            style={{ display: "none" }}
            onChange={handleFileInputChange}
            aria-label="Upload document"
          />
        </div>
      </div>

      {/* Quick Sample Presets */}
      <div style={{ marginTop: 18 }}>
        <div style={styles.sampleHeader}>
          <span className="eyebrow" style={{ fontSize: 11 }}>
            Or try a quick demo preset:
          </span>
        </div>
        <div style={styles.sampleGrid}>
          {SAMPLE_DOCS.map((sample) => (
            <button
              key={sample.name}
              type="button"
              className="preset-card-btn"
              onClick={() => loadSample(sample)}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", marginBottom: 3 }}>
                {sample.name}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {sample.docName}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.orRow}>
        <span style={styles.orLine} />
        <span style={styles.orText}>or paste your text below</span>
        <span style={styles.orLine} />
      </div>

      <label htmlFor="paste-area" style={{ display: "none" }}>
        Document text
      </label>
      <textarea
        id="paste-area"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setFileName(null);
          setError(null);
        }}
        placeholder="Paste your document text here…"
        style={styles.textarea}
        rows={10}
        aria-describedby={error ? "input-error" : undefined}
      />

      <div style={styles.metaRow}>
        <div style={styles.metaStats}>
          {fileName && <span style={styles.fileChip}>{fileName}</span>}
          <span style={styles.metaItem}>{wordCount.toLocaleString()} words</span>
          <span style={styles.metaItem}>{sentenceCount.toLocaleString()} sentences</span>
        </div>
        {(text.length > 0 || fileName) && (
          <button type="button" className="btn btn-secondary" style={styles.resetBtn} onClick={reset}>
            Remove / Reset
          </button>
        )}
      </div>

      {error && (
        <p id="input-error" role="alert" style={styles.error}>
          {error}
        </p>
      )}

      <button type="button" className="btn btn-primary" style={styles.analyzeBtn} onClick={handleAnalyzeClick}>
        Analyze Document
      </button>
    </div>
  );
}

function IconUpload() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V4M12 4 7 9M12 4l5 5" stroke="var(--blue-bright)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" stroke="var(--blue-bright)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const styles: Record<string, CSSProperties> = {
  dropzone: {
    border: "1.5px dashed var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "36px 24px",
    background: "var(--card)",
  },
  dropzoneInner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    textAlign: "center",
  },
  dropzoneText: {
    fontSize: 14.5,
    color: "var(--text-secondary)",
  },
  linkButton: {
    background: "none",
    border: "none",
    padding: 0,
    color: "var(--blue-bright)",
    fontWeight: 600,
    fontSize: "inherit",
    cursor: "pointer",
    textDecoration: "underline",
  },
  orRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "20px 0",
  },
  orLine: {
    flex: 1,
    height: 1,
    background: "var(--border)",
  },
  orText: {
    fontSize: 12,
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  textarea: {
    width: "100%",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "14px 16px",
    color: "var(--white)",
    fontFamily: "var(--font-body)",
    fontSize: 14.5,
    lineHeight: 1.6,
    resize: "vertical",
    minHeight: 180,
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
  },
  metaStats: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  metaItem: {
    fontSize: 13,
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },
  fileChip: {
    fontSize: 12.5,
    color: "var(--white)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "4px 10px",
  },
  resetBtn: {
    fontSize: 13,
    padding: "8px 16px",
  },
  error: {
    marginTop: 14,
    color: "var(--red)",
    fontSize: 13.5,
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 14px",
  },
  sampleHeader: {
    marginBottom: 8,
  },
  sampleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: 10,
  },
  analyzeBtn: {
    marginTop: 20,
    width: "100%",
    padding: "14px 24px",
    fontSize: 15.5,
  },
};
