import type { RetrievedNote } from "./notesStore.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL || "llama3.1";

const SYSTEM_PROMPT = `You are an assistant for a tabletop Dungeons & Dragons Dungeon Master.
You help the DM improvise NPC dialogue, recall plot threads, and generate flavor text
DURING a live session, so keep responses tight and usable at the table.

You will be given "campaign notes" retrieved from the DM's own notes as context.
Ground your answers in these notes whenever they're relevant - stay consistent with
established names, places, and plot details. If the notes don't cover something,
say so plainly and improvise something fitting rather than inventing contradictions.

Keep responses concise unless asked for something longer (e.g. a full NPC backstory).
Use a tone appropriate for fantasy tabletop games.`;

function buildContextBlock(notes: RetrievedNote[]): string {
  if (notes.length === 0) {
    return "(No relevant campaign notes were found for this query.)";
  }
  return notes
    .map(
      (n, i) =>
        `[Note ${i + 1} | ${n.category} | "${n.title}" | relevance ${(n.score * 100).toFixed(0)}%]\n${n.content}`
    )
    .join("\n\n---\n\n");
}

function buildMessages(question: string, retrievedNotes: RetrievedNote[]) {
  const contextBlock = buildContextBlock(retrievedNotes);
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Campaign notes retrieved for this question:\n\n${contextBlock}\n\n---\n\nDM's question: ${question}`,
    },
  ];
}

async function assertOllamaReachable() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) throw new Error();
  } catch {
    throw new Error(
      `Can't reach Ollama at ${OLLAMA_URL}. Make sure Ollama is installed and running ` +
        `("ollama serve", or just open the Ollama app), and that you've pulled a model ` +
        `(e.g. "ollama pull ${MODEL}").`
    );
  }
}

export async function generateAnswer(
  question: string,
  retrievedNotes: RetrievedNote[]
): Promise<string> {
  await assertOllamaReachable();

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: buildMessages(question, retrievedNotes),
      stream: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ollama request failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { message: { content: string } };
  return data.message.content;
}

/**
 * Streaming variant used by the /api/chat SSE endpoint so the frontend
 * can render tokens as they arrive instead of waiting for the full reply.
 * Ollama's /api/chat with stream:true returns newline-delimited JSON objects.
 */
export async function streamAnswer(
  question: string,
  retrievedNotes: RetrievedNote[],
  onToken: (token: string) => void
): Promise<void> {
  await assertOllamaReachable();

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: buildMessages(question, retrievedNotes),
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new Error(`Ollama request failed (${res.status}): ${body}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const parsed = JSON.parse(line) as {
        message?: { content: string };
        done: boolean;
      };
      if (parsed.message?.content) onToken(parsed.message.content);
    }
  }
}
