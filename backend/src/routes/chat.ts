import { Router } from "express";
import { retrieveRelevantNotes } from "../services/notesStore.js";
import { streamAnswer } from "../services/llm.js";

export const chatRouter = Router();

/**
 * Server-Sent Events endpoint. Emits:
 *   event: sources  -> the retrieved notes used as context (sent first)
 *   event: token    -> incremental text tokens from Claude
 *   event: done     -> stream finished
 *   event: error    -> something went wrong
 */
chatRouter.post("/", async (req, res) => {
  const { question, topK } = req.body ?? {};
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "question is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const sources = await retrieveRelevantNotes(question, topK ?? 5);
    send("sources", { sources });

    await streamAnswer(question, sources, (token) => {
      send("token", { token });
    });

    send("done", {});
  } catch (err) {
    console.error(err);
    send("error", { message: (err as Error).message || "Something went wrong" });
  } finally {
    res.end();
  }
});
