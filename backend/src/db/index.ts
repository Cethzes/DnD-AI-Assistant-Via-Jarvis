import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "..", "data.sqlite");

// Uses Node's built-in SQLite module (node:sqlite) instead of the
// better-sqlite3 native addon. This avoids the native-compilation step
// entirely (no Visual Studio / build-tools / node-gyp required on
// Windows), at the cost of requiring a fairly recent Node version
// (v22.5+, unflagged from ~v23). Requires Node >= 22.5.0.
export const db = new DatabaseSync(dbPath);

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
