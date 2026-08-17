// Report generation. Every function here reads from the SAME
// DocumentAnalysis object rendered in the UI — nothing is recalculated or
// faked for the report.

import type { DocumentAnalysis } from "../types/analysis";

export const REPORT_DISCLAIMER =
  "This report compares the document with the reference material available to this application. Similarity is evidence for review, not proof of plagiarism.";

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
      return "Exact Textual Match";
    case "HIGH_SIMILARITY":
      return "High Textual Similarity";
    case "HIGH_PARAPHRASE":
      return "High Paraphrase Likelihood";
    case "POSSIBLE_SIMILARITY":
      return "Possible Similarity — Requires Review";
    case "POSSIBLE_PARAPHRASE":
      return "Possible Paraphrase — Requires Review";
    default:
      return "Clean";
  }
}

/** Export the full analysis as a JSON string (for the "Export JSON" button). */
export function exportAnalysisAsJSON(analysis: DocumentAnalysis): string {
  return JSON.stringify(
    {
      product: "SemanticSure AI",
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
  lines.push("SEMANTICSURE AI — DOCUMENT ANALYSIS REPORT");
  lines.push("=".repeat(48));
  lines.push(`Document: ${analysis.documentName}`);
  lines.push(`Analysis Date: ${formatDate(analysis.analyzedAt)}`);
  lines.push(`Analysis ID: ${analysis.analysisId}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push("-".repeat(48));
  lines.push(`Originality: ${analysis.originalityScore}%`);
  lines.push(`Similarity Risk: ${analysis.similarityRisk.score}% (${analysis.similarityRisk.label})`);
  lines.push(`Paraphrase Risk: ${analysis.paraphraseRisk.score}% (${analysis.paraphraseRisk.label})`);
  lines.push(`Review Risk: ${analysis.reviewRisk.score}% (${analysis.reviewRisk.label})`);
  lines.push(`Sentences Requiring Review: ${analysis.flaggedCount} of ${analysis.stats.sentenceCount}`);
  lines.push("");
  lines.push("DOCUMENT STATISTICS");
  lines.push("-".repeat(48));
  lines.push(`Word Count: ${analysis.stats.wordCount}`);
  lines.push(`Sentence Count: ${analysis.stats.sentenceCount}`);
  lines.push(`Reading Time: ${analysis.stats.readingTimeMinutes} min`);
  lines.push(`Vocabulary Diversity: ${analysis.stats.vocabularyDiversity}%`);
  lines.push("");
  lines.push("SENTENCE-LEVEL FINDINGS");
  lines.push("-".repeat(48));

  analysis.sentences.forEach((s) => {
    if (s.classification === "CLEAN") return;
    lines.push("");
    lines.push(`[${s.index + 1}] ${classificationLabel(s.classification)} — similarity ${s.score}%, paraphrase ${s.paraphraseScore}%`);
    lines.push(`Your text: "${s.text}"`);
    if (s.bestMatch) {
      lines.push(`Reference: "${s.bestMatch.referenceText}"`);
      lines.push(`Source: ${s.bestMatch.referenceTitle} — ${s.bestMatch.referenceSource}${s.bestMatch.referenceYear ? `, ${s.bestMatch.referenceYear}` : ""}`);
    }
    lines.push(`Finding: ${s.reason}`);
    lines.push(`Recommended Action: ${s.recommendedAction}`);
  });

  if (analysis.flaggedCount === 0) {
    lines.push("");
    lines.push("No sentences were flagged for review.");
  }

  lines.push("");
  lines.push("REFERENCE SCOPE");
  lines.push("-".repeat(48));
  lines.push(analysis.referenceScopeNote);
  lines.push("");
  lines.push("DISCLAIMER");
  lines.push("-".repeat(48));
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
          <span class="score">${s.score}%</span>
        </div>
        <p class="label">Your text (sentence ${s.index + 1})</p>
        <p class="quote">${escapeHtml(s.text)}</p>
        ${
          s.bestMatch
            ? `<p class="label">Reference</p>
               <p class="quote">${escapeHtml(s.bestMatch.referenceText)}</p>
               <p class="source">Source: ${escapeHtml(s.bestMatch.referenceTitle)} — ${escapeHtml(s.bestMatch.referenceSource)}${s.bestMatch.referenceYear ? `, ${s.bestMatch.referenceYear}` : ""}</p>`
            : ""
        }
        <p class="label">Finding</p>
        <p>${escapeHtml(s.reason)}</p>
        <p class="label">Recommended Action</p>
        <p>${escapeHtml(s.recommendedAction)}</p>
      </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>SemanticSure AI Report — ${escapeHtml(analysis.documentName)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; max-width: 780px; margin: 40px auto; padding: 0 24px; line-height: 1.55; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  .meta { color: #555; font-size: 13px; margin-bottom: 24px; }
  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 24px 0; }
  .summary div { border: 1px solid #ccc; border-radius: 6px; padding: 10px 12px; }
  .summary .val { font-size: 20px; font-weight: bold; }
  .summary .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
  h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #ccc; padding-bottom: 6px; margin-top: 32px; }
  .finding { border: 1px solid #ddd; border-radius: 8px; padding: 14px 16px; margin: 14px 0; page-break-inside: avoid; }
  .finding-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .badge { font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; background: #eee; }
  .badge-exact-match { background: #fde2e1; color: #a11; }
  .badge-high-similarity { background: #ffe9c7; color: #a55b00; }
  .badge-high-paraphrase { background: #f3e8ff; color: #6b21a8; }
  .badge-possible-similarity { background: #fff4cc; color: #806600; }
  .badge-possible-paraphrase { background: #ede9fe; color: #5b21b6; }
  .score { font-weight: bold; }
  .label { font-size: 11px; text-transform: uppercase; color: #777; margin: 10px 0 2px; }
  .quote { font-style: italic; margin: 0; }
  .source { font-size: 12px; color: #555; }
  .disclaimer { margin-top: 32px; font-size: 12px; color: #555; border-top: 1px solid #ccc; padding-top: 12px; }
  @media print { body { margin: 0; padding: 24px; } }
</style>
</head>
<body>
  <h1>SemanticSure AI — Document Analysis Report</h1>
  <div class="meta">
    Document: ${escapeHtml(analysis.documentName)}<br/>
    Analysis Date: ${escapeHtml(formatDate(analysis.analyzedAt))}<br/>
    Analysis ID: ${escapeHtml(analysis.analysisId)}
  </div>

  <div class="summary">
    <div><div class="val">${analysis.originalityScore}%</div><div class="lbl">Originality</div></div>
    <div><div class="val">${analysis.similarityRisk.score}%</div><div class="lbl">Similarity Risk (${analysis.similarityRisk.label})</div></div>
    <div><div class="val">${analysis.paraphraseRisk.score}%</div><div class="lbl">Paraphrase Risk (${analysis.paraphraseRisk.label})</div></div>
    <div><div class="val">${analysis.reviewRisk.score}%</div><div class="lbl">Review Risk (${analysis.reviewRisk.label})</div></div>
    <div><div class="val">${analysis.flaggedCount}/${analysis.stats.sentenceCount}</div><div class="lbl">Flagged Sentences</div></div>
  </div>

  <h2>Document Statistics</h2>
  <p>
    Word Count: ${analysis.stats.wordCount} &nbsp;•&nbsp;
    Sentence Count: ${analysis.stats.sentenceCount} &nbsp;•&nbsp;
    Reading Time: ${analysis.stats.readingTimeMinutes} min &nbsp;•&nbsp;
    Vocabulary Diversity: ${analysis.stats.vocabularyDiversity}%
  </p>

  <h2>Sentence-Level Findings</h2>
  ${rows || "<p>No sentences were flagged for review.</p>"}

  <h2>Reference Scope</h2>
  <p>${escapeHtml(analysis.referenceScopeNote)}</p>

  <div class="disclaimer">${escapeHtml(REPORT_DISCLAIMER)}</div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Open a new window with the printable report and trigger the print dialog. */
export function printReport(analysis: DocumentAnalysis) {
  const html = buildPrintableHTML(analysis);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  // Give the new window a moment to render before invoking print.
  setTimeout(() => win.print(), 300);
}
