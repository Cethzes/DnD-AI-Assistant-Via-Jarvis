import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

// Runs in-process (ONNX); weights download once to the transformers.js cache on first use.
const MODEL = "Xenova/bge-small-en-v1.5";
// bge retrieves best when queries (not documents) carry this instruction.
const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";

let extractor: Promise<FeatureExtractionPipeline> | undefined;

async function embed(texts: string[]): Promise<number[][]> {
  extractor ??= pipeline("feature-extraction", MODEL, { dtype: "q8" });
  const output = await (await extractor)(texts, { pooling: "cls", normalize: true });
  return output.tolist() as number[][];
}

export const embedTexts = (texts: string[]) => embed(texts);

export async function embedQuery(text: string): Promise<number[]> {
  return (await embed([QUERY_PREFIX + text]))[0];
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
