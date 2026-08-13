/**
 * Splits long text into overlapping chunks so retrieval can pull back
 * focused snippets instead of entire (possibly huge) notes. Chunking by
 * paragraph first, then falling back to a fixed size, keeps related
 * sentences together more often than a naive fixed-window split.
 */
export function chunkText(
  text: string,
  maxChunkChars = 800,
  overlapChars = 120
): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxChunkChars) return [trimmed];

  const paragraphs = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > maxChunkChars && current) {
      chunks.push(current.trim());
      // start next chunk with a small overlap for context continuity
      current = current.slice(-overlapChars) + "\n\n" + para;
    } else {
      current = current ? current + "\n\n" + para : para;
    }

    // paragraph itself is too big; hard-split it
    while (current.length > maxChunkChars) {
      chunks.push(current.slice(0, maxChunkChars).trim());
      current = current.slice(maxChunkChars - overlapChars);
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
