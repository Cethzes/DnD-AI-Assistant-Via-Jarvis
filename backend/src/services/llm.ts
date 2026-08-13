import Anthropic from "@anthropic-ai/sdk";
import type { RetrievedNote } from "./notesStore.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";

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

export async function generateAnswer(
  question: string,
  retrievedNotes: RetrievedNote[]
): Promise<string> {
  const contextBlock = buildContextBlock(retrievedNotes);

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Campaign notes retrieved for this question:\n\n${contextBlock}\n\n---\n\nDM's question: ${question}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}

/**
 * Streaming variant used by the /api/chat SSE endpoint so the frontend
 * can render tokens as they arrive instead of waiting for the full reply.
 */
export async function streamAnswer(
  question: string,
  retrievedNotes: RetrievedNote[],
  onToken: (token: string) => void
): Promise<void> {
  const contextBlock = buildContextBlock(retrievedNotes);

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Campaign notes retrieved for this question:\n\n${contextBlock}\n\n---\n\nDM's question: ${question}`,
      },
    ],
  });

  stream.on("text", (token) => onToken(token));
  await stream.finalMessage();
}
