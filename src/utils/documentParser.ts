// Client-side multi-format document parser.
// Extracts clean text from .pdf, .docx, .txt, .md, and rich text documents directly in browser memory.

import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure PDF.js worker using reliable HTTPS CDN matching installed version
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export const SUPPORTED_FILE_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt", ".md", ".rtf"];

export interface ExtractedDocument {
  text: string;
  fileName: string;
  pageCount?: number;
  wordCount: number;
}

/**
 * Extract text from a PDF file (.pdf)
 */
export async function extractTextFromPdf(file: File): Promise<{ text: string; pageCount: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => (item && typeof item.str === "string" ? item.str : ""))
        .filter(Boolean);
      
      const combinedPageText = pageStrings.join(" ").replace(/\s+/g, " ").trim();
      if (combinedPageText.length > 0) {
        pageTexts.push(combinedPageText);
      }
    }

    const fullText = pageTexts.join("\n\n").trim();
    if (!fullText) {
      throw new Error("No readable text found in this PDF. It may contain scanned images without OCR.");
    }

    return { text: fullText, pageCount };
  } catch (err: any) {
    console.error("PDF Extraction error:", err);
    throw new Error(err.message || "Failed to parse PDF document.");
  }
}

/**
 * Extract text from a Microsoft Word file (.docx)
 */
export async function extractTextFromDocx(file: File): Promise<{ text: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value.trim();

    if (!text) {
      throw new Error("No readable text found in this Word document.");
    }

    return { text };
  } catch (err: any) {
    console.error("DOCX Extraction error:", err);
    throw new Error(err.message || "Failed to parse Word document.");
  }
}

/**
 * Main parser entry point handling any supported file type.
 */
export async function parseUploadedFile(file: File): Promise<ExtractedDocument> {
  const lowerName = file.name.toLowerCase();
  let text = "";
  let pageCount: number | undefined;

  if (lowerName.endsWith(".pdf")) {
    const pdfRes = await extractTextFromPdf(file);
    text = pdfRes.text;
    pageCount = pdfRes.pageCount;
  } else if (lowerName.endsWith(".docx") || lowerName.endsWith(".doc")) {
    const docxRes = await extractTextFromDocx(file);
    text = docxRes.text;
  } else if (
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".rtf") ||
    file.type.startsWith("text/")
  ) {
    text = await file.text();
  } else {
    throw new Error(
      `Unsupported file format: ${file.name}. Please upload a PDF (.pdf), Word (.docx), or Text (.txt, .md) document.`
    );
  }

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return {
    text: text.trim(),
    fileName: file.name,
    pageCount,
    wordCount: words.length,
  };
}
