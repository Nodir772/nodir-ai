export type TextChunk = {
  index: number;
  content: string;
};

export function chunkText(text: string, size = 1400, overlap = 180): TextChunk[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;
  while (start < clean.length) {
    const end = Math.min(clean.length, start + size);
    chunks.push({ index, content: clean.slice(start, end) });
    index += 1;
    if (end >= clean.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}

export function retrieveChunks(chunks: TextChunk[], query: string, limit = 6) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);
  if (terms.length === 0) return chunks.slice(0, limit);

  return [...chunks]
    .map((chunk) => {
      const hay = chunk.content.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (hay.includes(term) ? 1 : 0), 0);
      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score || a.chunk.index - b.chunk.index)
    .slice(0, limit)
    .map((item) => item.chunk);
}
