import { Router } from "express";
import { addNote, deleteNote, listNotes } from "../services/notesStore.js";

export const notesRouter = Router();

notesRouter.get("/", (_req, res) => {
  try {
    res.json({ notes: listNotes() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list notes" });
  }
});

notesRouter.post("/", async (req, res) => {
  const { title, content, category } = req.body ?? {};
  if (!title || !content) {
    return res.status(400).json({ error: "title and content are required" });
  }
  try {
    const created = await addNote(title, content, category || "general");
    res.status(201).json({ chunks: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message || "Failed to add note" });
  }
});

notesRouter.delete("/:id", (req, res) => {
  try {
    deleteNote(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});
