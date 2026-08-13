import type { Note, RetrievedNote } from "./types";

export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch("/api/notes");
  if (!res.ok) throw new Error("Failed to fetch notes");
  const data = await res.json();
  return data.notes;
}

export async function createNote(
  title: string,
  content: string,
  category: string
): Promise<Note[]> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, category }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create note");
  }
  const data = await res.json();
  return data.chunks;
}

export async function removeNote(id: string): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete note");
}

export interface StreamHandlers {
  onSources: (sources: RetrievedNote[]) => void;
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

/**
 * Consumes the /api/chat Server-Sent Events stream. Parses `event: X` /
 * `data: {...}` blocks manually since we're using fetch + ReadableStream
 * rather than EventSource (which can't send a POST body).
 */
export async function streamChat(question: string, handlers: StreamHandlers): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok || !res.body) {
    handlers.onError("Failed to reach the assistant");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const evt of events) {
      const lines = evt.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!eventLine || !dataLine) continue;

      const eventName = eventLine.replace("event:", "").trim();
      const data = JSON.parse(dataLine.replace("data:", "").trim());

      if (eventName === "sources") handlers.onSources(data.sources);
      else if (eventName === "token") handlers.onToken(data.token);
      else if (eventName === "done") handlers.onDone();
      else if (eventName === "error") handlers.onError(data.message);
    }
  }
}
