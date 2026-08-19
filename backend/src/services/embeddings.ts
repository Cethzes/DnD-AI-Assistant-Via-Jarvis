const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EMBEDDING_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

async function embedOne(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Ollama embeddings request failed (${res.status}): ${body}\n` +
        `Make sure you've pulled the embedding model: "ollama pull ${EMBEDDING_MODEL}"`
    );
  }

  const data = (await res.json()) as { embedding: number[] };
  return data.embedding;
}

/**
 * Ollama's /api/embeddings endpoint embeds one prompt per call (no native
 * batch endpoint), so we just fire requests concurrently. Fine at the
 * scale of a DM's campaign notes.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(embedOne));
}

export async function embedQuery(text: string): Promise<number[]> {
  return embedOne(text);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
