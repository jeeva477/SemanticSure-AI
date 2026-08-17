import type { DocumentAnalysis } from "../../types/analysis";
import { buildTextReport, downloadTextFile, exportAnalysisAsJSON, printReport } from "../../utils/report";

interface Props {
  analysis: DocumentAnalysis;
}

export default function ReportActions({ analysis }: Props) {
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

  return (
    <div className="report-actions">
      <button type="button" className="btn btn-primary" onClick={handleDownloadReport}>
        Download Report
      </button>
      <button type="button" className="btn btn-secondary" onClick={handlePrint}>
        Print / Save as PDF
      </button>
      <button type="button" className="btn btn-secondary" onClick={handleExportJSON}>
        Export JSON
      </button>
    </div>
  );
}

function safeName(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "document";
}
