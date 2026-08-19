// Report generation. Every function here reads from the SAME
// DocumentAnalysis object rendered in the UI — nothing is recalculated or
// faked for the report.

import type { DocumentAnalysis } from "../types/analysis";

export const REPORT_DISCLAIMER =
  "This report evaluates the document against the active reference material using multi-signal lexical and open-source semantic embedding models. Similarity and paraphrase findings are evidence for review, not proof of plagiarism.";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function classificationLabel(c: string): string {
  switch (c) {
    case "EXACT_MATCH":
      return "Exact Verbatim Match";
    case "HIGH_SIMILARITY":
      return "High Verbatim Similarity";
    case "HIGH_PARAPHRASE":
      return "High Paraphrase Likelihood";
    case "POSSIBLE_SIMILARITY":
      return "Possible Verbatim Similarity";
    case "POSSIBLE_PARAPHRASE":
      return "Possible Paraphrase — Semantic Alignment";
    default:
      return "Clean";
  }
}

/** Export the full analysis as a JSON string (for the "Export JSON" button). */
export function exportAnalysisAsJSON(analysis: DocumentAnalysis): string {
  return JSON.stringify(
    {
      product: "DeepParaphrase AI",
      engine: "Open-Source Multi-Signal & Dense Vector Embedding Engine",
      disclaimer: REPORT_DISCLAIMER,
      referenceScope: analysis.referenceScopeNote,
      ...analysis,
    },
    null,
    2
  );
}

/** Build a human-readable plain-text report (for the "Download Report" button). */
export function buildTextReport(analysis: DocumentAnalysis): string {
  const lines: string[] = [];
  lines.push("DEEPPARAPHRASE AI — ORIGINALITY & SIMILARITY AUDIT REPORT");
  lines.push("=".repeat(60));
  lines.push(`Document Name:    ${analysis.documentName}`);
  lines.push(`Analysis Date:    ${formatDate(analysis.analyzedAt)}`);
  lines.push(`Analysis ID:      ${analysis.analysisId}`);
  lines.push(`Engine Mode:      ${analysis.mode}`);
  lines.push(`Detection Focus:  ${analysis.tuning?.focus || "balanced"}`);
  lines.push(`Sensitivity:      ${(analysis.tuning?.sensitivity || "medium").toUpperCase()}`);
  lines.push("");
  lines.push("EXECUTIVE SUMMARY");
  lines.push("-".repeat(60));
  lines.push(`Overall Originality Score:      ${analysis.originalityScore}%`);
  lines.push(`Direct Plagiarism Index:        ${analysis.plagiarismScore}% (${analysis.similarityRisk.label} Risk)`);
  lines.push(`Semantic Paraphrase Index:      ${analysis.paraphraseScore}% (${analysis.paraphraseRisk.label} Risk)`);
  lines.push(`Review Risk Level:              ${analysis.reviewRisk.score}% (${analysis.reviewRisk.label} Risk)`);
  lines.push(`Flagged Sentences:              ${analysis.flaggedCount} of ${analysis.stats.sentenceCount}`);
  lines.push("");
  lines.push("DOCUMENT STATISTICS");
  lines.push("-".repeat(60));
  lines.push(`Total Word Count:        ${analysis.stats.wordCount.toLocaleString()} words`);
  lines.push(`Total Sentence Count:    ${analysis.stats.sentenceCount} sentences`);
  lines.push(`Estimated Reading Time:  ${analysis.stats.readingTimeMinutes} min`);
  lines.push(`Vocabulary Diversity:    ${analysis.stats.vocabularyDiversity}%`);
  lines.push("");
  lines.push("DETAILED SENTENCE FINDINGS");
  lines.push("-".repeat(60));

  analysis.sentences.forEach((s) => {
    if (s.classification === "CLEAN") return;
    lines.push("");
    lines.push(`[Sentence ${s.index + 1}] ${classificationLabel(s.classification)}`);
    lines.push(`  Similarity: ${s.score}% direct | ${s.paraphraseScore}% semantic`);
    lines.push(`  Your Text: "${s.text}"`);
    if (s.bestMatch) {
      lines.push(`  Matched Source: ${s.bestMatch.referenceTitle} — ${s.bestMatch.referenceSource}`);
      lines.push(`  Source Text:    "${s.bestMatch.referenceText}"`);
      lines.push(
        `  Signals: TF-IDF=${(s.bestMatch.signals.tfidfSimilarity * 100).toFixed(0)}%, Bigram=${(
          s.bestMatch.signals.bigramOverlap * 100
        ).toFixed(0)}%, Synonym=${(s.bestMatch.signals.synonymOverlap * 100).toFixed(
          0
        )}%, Neural Embedding=${((s.bestMatch.signals.semanticEmbeddingSimilarity || 0) * 100).toFixed(0)}%`
      );
    }
    lines.push(`  Finding: ${s.reason}`);
    lines.push(`  Recommendation: ${s.recommendedAction}`);
  });

  if (analysis.flaggedCount === 0) {
    lines.push("");
    lines.push("No sentences were flagged for review. 100% of passages passed clean threshold.");
  }

  lines.push("");
  lines.push("REFERENCE SCOPE");
  lines.push("-".repeat(60));
  lines.push(analysis.referenceScopeNote);
  lines.push("");
  lines.push("DISCLAIMER");
  lines.push("-".repeat(60));
  lines.push(REPORT_DISCLAIMER);

  return lines.join("\n");
}

/** Trigger a browser download of a text file. */
export function downloadTextFile(filename: string, content: string, mimeType = "text/plain") {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Build a self-contained, printable HTML document for "Print / Save as PDF". */
export function buildPrintableHTML(analysis: DocumentAnalysis): string {
  const rows = analysis.sentences
    .filter((s) => s.classification !== "CLEAN")
    .map(
      (s) => `
      <div class="finding">
        <div class="finding-head">
          <span class="badge badge-${s.classification.toLowerCase().replace(/_/g, "-")}">${classificationLabel(s.classification)}</span>
          <span class="score">${s.score}% direct · ${s.paraphraseScore}% semantic</span>
        </div>
        <p class="label">Your text (sentence ${s.index + 1})</p>
        <p class="quote">${escapeHtml(s.text)}</p>
        ${
          s.bestMatch
            ? `<p class="label">Reference Match</p>
               <p class="quote">${escapeHtml(s.bestMatch.referenceText)}</p>
               <p class="source">Source: <strong>${escapeHtml(s.bestMatch.referenceTitle)}</strong> — ${escapeHtml(s.bestMatch.referenceSource)}${s.bestMatch.referenceYear ? `, ${s.bestMatch.referenceYear}` : ""}</p>`
            : ""
        }
        <p class="finding-text"><strong>Finding:</strong> ${escapeHtml(s.reason)}</p>
        <p class="finding-text"><strong>Recommendation:</strong> ${escapeHtml(s.recommendedAction)}</p>
      </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Originality Report — ${escapeHtml(analysis.documentName)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; line-height: 1.5; margin: 40px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
    .metrics { display: flex; gap: 24px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #eee; }
    .metric-val { font-size: 28px; font-weight: 700; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .finding { margin-bottom: 24px; padding: 16px; border: 1px solid #ddd; border-radius: 6px; page-break-inside: avoid; }
    .finding-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
    .badge-exact-match, .badge-high-similarity { background: #fee2e2; color: #b91c1c; }
    .badge-high-paraphrase, .badge-possible-paraphrase { background: #f3e8ff; color: #6b21a8; }
    .badge-possible-similarity { background: #fef3c7; color: #b45309; }
    .label { font-size: 11px; font-weight: 700; color: #777; margin: 8px 0 2px; text-transform: uppercase; }
    .quote { background: #f9f9f9; border-left: 3px solid #ccc; padding: 8px 12px; margin: 4px 0 8px; font-size: 13px; font-style: italic; }
    .source { font-size: 12px; color: #555; }
    .finding-text { font-size: 13px; margin: 4px 0; }
    .disclaimer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11.5px; color: #777; }
  </style>
</head>
<body>
  <h1>Originality & Similarity Audit Report</h1>
  <div class="meta">Document: <strong>${escapeHtml(analysis.documentName)}</strong> | Date: ${formatDate(analysis.analyzedAt)} | ID: ${escapeHtml(analysis.analysisId)}</div>
  
  <div class="metrics">
    <div><div class="metric-val" style="color: #16a34a;">${analysis.originalityScore}%</div><div class="metric-label">Originality</div></div>
    <div><div class="metric-val" style="color: #dc2626;">${analysis.plagiarismScore}%</div><div class="metric-label">Plagiarism Index</div></div>
    <div><div class="metric-val" style="color: #7c3aed;">${analysis.paraphraseScore}%</div><div class="metric-label">Paraphrase Index</div></div>
    <div><div class="metric-val">${analysis.flaggedCount} / ${analysis.stats.sentenceCount}</div><div class="metric-label">Sentences Flagged</div></div>
  </div>

  <h2>Findings (${analysis.flaggedCount} flagged)</h2>
  ${rows.length > 0 ? rows : "<p>No similarity or paraphrase issues were detected in this document.</p>"}

  <div class="disclaimer">
    <p><strong>Reference Scope:</strong> ${escapeHtml(analysis.referenceScopeNote)}</p>
    <p>${escapeHtml(REPORT_DISCLAIMER)}</p>
  </div>
</body>
</html>`;
}

/** Open print view in new window */
export function printReport(analysis: DocumentAnalysis) {
  const html = buildPrintableHTML(analysis);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
