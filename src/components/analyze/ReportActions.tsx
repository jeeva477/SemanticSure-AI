import { useState } from "react";
import type { DocumentAnalysis } from "../../types/analysis";
import { buildTextReport, downloadTextFile, exportAnalysisAsJSON, printReport } from "../../utils/report";

interface Props {
  analysis: DocumentAnalysis;
}

export default function ReportActions({ analysis }: Props) {
  const [copied, setCopied] = useState(false);

  function handleDownloadReport() {
    downloadTextFile(`${safeName(analysis.documentName)}-semanticsure-report.txt`, buildTextReport(analysis));
  }

  function handleExportJSON() {
    downloadTextFile(
      `${safeName(analysis.documentName)}-semanticsure-report.json`,
      exportAnalysisAsJSON(analysis),
      "application/json"
    );
  }

  function handlePrint() {
    printReport(analysis);
  }

  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(buildTextReport(analysis));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard permission fails
    }
  }

  return (
    <div className="report-actions" style={{ alignItems: "center" }}>
      <button type="button" className="btn btn-primary" onClick={handleDownloadReport}>
        Download Report
      </button>
      <button type="button" className="btn btn-secondary" onClick={handlePrint}>
        Print / Save as PDF
      </button>
      <button type="button" className="btn btn-secondary" onClick={handleExportJSON}>
        Export JSON
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleCopySummary}
        style={{
          borderColor: copied ? "var(--green)" : "var(--border)",
          color: copied ? "var(--green)" : "var(--white)",
        }}
      >
        {copied ? "Copied Summary! ✓" : "Copy Summary to Clipboard"}
      </button>
    </div>
  );
}

function safeName(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "document";
}
