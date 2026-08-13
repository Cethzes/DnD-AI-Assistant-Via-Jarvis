import { useEffect, useState } from "react";
import { createNote, fetchNotes, removeNote } from "../lib/api";
import { CATEGORIES, type Note } from "../lib/types";

const categoryColors: Record<string, string> = {
  npc: "bg-purple-900/40 text-purple-200 border-purple-700",
  location: "bg-emerald-900/40 text-emerald-200 border-emerald-700",
  plot: "bg-red-900/40 text-red-200 border-red-700",
  item: "bg-amber-900/40 text-amber-200 border-amber-700",
  faction: "bg-blue-900/40 text-blue-200 border-blue-700",
  general: "bg-stone-800 text-stone-300 border-stone-600",
};

export default function NotesPanel() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setNotes(await fetchNotes());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createNote(title.trim(), content.trim(), category);
      setTitle("");
      setContent("");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await removeNote(id);
    } catch {
      await refresh();
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-stone-700 p-4">
        <h2 className="font-display text-lg text-parchment">Campaign Notes</h2>
        <p className="mt-1 text-xs text-stone-400">
          Add lore, NPCs, and plot threads. The assistant retrieves relevant notes automatically.
        </p>
      </div>

      <form onSubmit={handleAdd} className="space-y-2 border-b border-stone-700 p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. 'Garrik the Tavern Keeper')"
          className="w-full rounded-md border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-parchment placeholder:text-stone-500 focus:border-ember focus:outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Details, personality, secrets, plot relevance..."
          rows={4}
          className="w-full resize-none rounded-md border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-parchment placeholder:text-stone-500 focus:border-ember focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-stone-600 bg-stone-900 px-2 py-1.5 text-sm text-parchment focus:border-ember focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving || !title.trim() || !content.trim()}
            className="ml-auto rounded-md bg-ember px-4 py-1.5 text-sm font-medium text-parchment transition hover:bg-ember/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : "Add Note"}
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-stone-500">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-stone-500">
            No notes yet. Add your first piece of lore above to give the assistant something to work with.
          </p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="group rounded-lg border border-stone-700 bg-stone-900/60 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${categoryColors[note.category] ?? categoryColors.general}`}
                    >
                      {note.category}
                    </span>
                    <h3 className="mt-1 text-sm font-semibold text-parchment">{note.title}</h3>
                  </div>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-xs text-stone-500 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                    aria-label="Delete note"
                  >
                    ✕
                  </button>
                </div>
                <p className="mt-1 line-clamp-3 text-xs text-stone-400">{note.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
