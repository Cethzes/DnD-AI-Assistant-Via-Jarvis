import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "..", "data.sqlite");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Notes table: each row is a chunk of campaign lore with its embedding
// stored as a JSON-encoded float array. This is intentionally simple
// (no vector extension required) so the project runs anywhere SQLite runs.
// Swap this for pgvector/Pinecone/Chroma if you outgrow in-memory cosine search.
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    embedding TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export interface NoteRow {
  id: string;
  title: string;
  content: string;
  category: string;
  embedding: string;
  created_at: string;
}
