import "dotenv/config";
import cors from "cors";
import express from "express";
import { notesRouter } from "./routes/notes.js";
import { chatRouter } from "./routes/chat.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/notes", notesRouter);
app.use("/api/chat", chatRouter);

app.listen(PORT, () => {
  console.log(`AI DM Assistant backend listening on http://localhost:${PORT}`);
});
