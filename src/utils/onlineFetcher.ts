import type { ReferenceDocument } from "../types/analysis";

/**
 * Extract prominent topic phrases & keywords from the user's document
 * to query live online knowledge bases.
 */
export function extractSearchKeywords(text: string): string[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 5 && l.length < 120 && !l.startsWith("http") && !l.includes("Table"));

  // Check for explicit title indicators
  const titleCandidate = lines.find(
    (l) => l.toLowerCase().startsWith("project title:") || l.toLowerCase().startsWith("title:")
  );

  const keywords: string[] = [];

  if (titleCandidate) {
    const cleanTitle = titleCandidate.replace(/^(project )?title:\s*/i, "").trim();
    if (cleanTitle.length > 3) keywords.push(cleanTitle);
  }

  // Look at the first 3 substantive lines for topics
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (line.length > 10 && line.length < 80 && !keywords.includes(line)) {
      keywords.push(line);
      if (keywords.length >= 3) break;
    }
  }

  // Also extract top non-stopword bigram/unigram themes from the text
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4);

  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }

  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const topWords = sorted.slice(0, 3).map((pair) => pair[0]);
  if (topWords.length > 0) {
    keywords.push(topWords.join(" "));
  }

  return keywords.slice(0, 4);
}

/**
 * Fetch live Wikipedia articles and extracts dynamically based on user input.
 */
export async function fetchOnlineWikipediaCorpus(
  queries: string[],
  onStatus?: (status: string) => void
): Promise<ReferenceDocument[]> {
  const onlineDocs: ReferenceDocument[] = [];
  const fetchedTitles = new Set<string>();

  for (const query of queries) {
    try {
      if (onStatus) onStatus(`Searching online knowledge base for "${query.slice(0, 40)}"...`);
      
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&utf8=&format=json&origin=*`;
      
      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) });
      if (!searchRes.ok) continue;
      
      const searchJson = await searchRes.json();
      const hits = searchJson?.query?.search || [];
      const topHits = hits.slice(0, 2);

      const titlesToFetch = topHits
        .map((h: { title: string }) => h.title)
        .filter((t: string) => !fetchedTitles.has(t));

      if (titlesToFetch.length === 0) continue;
      titlesToFetch.forEach((t: string) => fetchedTitles.add(t));

      if (onStatus) onStatus(`Fetching live reference extracts for ${titlesToFetch.join(", ")}...`);

      const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(
        titlesToFetch.join("|")
      )}&format=json&origin=*`;

      const extractRes = await fetch(extractUrl, { signal: AbortSignal.timeout(4000) });
      if (!extractRes.ok) continue;

      const extractJson = await extractRes.json();
      const pages = extractJson?.query?.pages || {};

      for (const pageId in pages) {
        const page = pages[pageId];
        if (page && page.extract && page.extract.length > 100) {
          onlineDocs.push({
            id: `online-wiki-${pageId}`,
            title: page.title,
            source: "Wikipedia (Live Online Knowledge Base)",
            year: new Date().getFullYear(),
            text: page.extract.slice(0, 12000), // grab up to first 12,000 characters
          });
        }
      }
    } catch {
      // Continue gracefully if network error or timeout occurs
    }
  }

  return onlineDocs;
}

/**
 * Fetch online CrossRef metadata for academic queries.
 */
export async function fetchOnlineCrossRefCorpus(
  query: string,
  onStatus?: (status: string) => void
): Promise<ReferenceDocument[]> {
  try {
    if (onStatus) onStatus(`Querying academic literature via CrossRef...`);
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=2`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    const json = await res.json();
    const items = json?.message?.items || [];
    const docs: ReferenceDocument[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const title = Array.isArray(item.title) ? item.title[0] : item.title || "Scholarly Article";
      const abstract = item.abstract ? item.abstract.replace(/<[^>]+>/g, " ") : "";
      if (abstract && abstract.length > 50) {
        docs.push({
          id: `online-crossref-${i + 1}`,
          title,
          source: `CrossRef Academic DOI (${item.DOI || "Scholarly Paper"})`,
          year: item.created?.["date-parts"]?.[0]?.[0] || new Date().getFullYear(),
          text: abstract,
        });
      }
    }
    return docs;
  } catch {
    return [];
  }
}
