import { v4 as uuidv4 } from "uuid";
import { db, type NoteRow } from "../db/index.js";
import { chunkText } from "./chunk.js";
import { cosineSimilarity, embedQuery, embedTexts } from "./embeddings.js";

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

export interface RetrievedNote extends Note {
  score: number;
}

function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    createdAt: row.created_at,
  };
}

/**
 * Adds a lore note. Long notes are chunked so retrieval can be precise;
 * each chunk is stored as its own row but shares the parent title/category
 * so the UI can still group results sensibly.
 */
export async function addNote(
  title: string,
  content: string,
  category: string
): Promise<Note[]> {
  const chunks = chunkText(content);
  const embeddings = await embedTexts(chunks);

  const insert = db.prepare(
    `INSERT INTO notes (id, title, content, category, embedding) VALUES (?, ?, ?, ?, ?)`
  );

  const inserted: Note[] = [];
  const insertMany = db.transaction((rows: { chunk: string; embedding: number[] }[]) => {
    for (const { chunk, embedding } of rows) {
      const id = uuidv4();
      insert.run(id, title, chunk, category, JSON.stringify(embedding));
      inserted.push({ id, title, content: chunk, category, createdAt: new Date().toISOString() });
    }
  });

  insertMany(chunks.map((chunk, i) => ({ chunk, embedding: embeddings[i] })));
  return inserted;
}

export function listNotes(): Note[] {
  const rows = db.prepare(`SELECT * FROM notes ORDER BY created_at DESC`).all() as NoteRow[];
  return rows.map(rowToNote);
}

export function deleteNote(id: string): void {
  db.prepare(`DELETE FROM notes WHERE id = ?`).run(id);
}

/**
 * Core retrieval step: embed the query, score it against every stored
 * chunk with cosine similarity, and return the top-k. Fine for a
 * portfolio-scale note count (hundreds-to-low-thousands of chunks);
 * swap for an ANN index (pgvector, HNSW, etc.) at larger scale.
 */
export async function retrieveRelevantNotes(
  query: string,
  topK = 5
): Promise<RetrievedNote[]> {
  const rows = db.prepare(`SELECT * FROM notes`).all() as NoteRow[];
  if (rows.length === 0) return [];

  const queryEmbedding = await embedQuery(query);

  const scored = rows.map((row) => ({
    ...rowToNote(row),
    score: cosineSimilarity(queryEmbedding, JSON.parse(row.embedding)),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
