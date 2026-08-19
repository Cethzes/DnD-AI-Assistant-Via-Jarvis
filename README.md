# 🐉 AI DM Assistant

A retrieval-augmented generation (RAG) assistant for Dungeons & Dragons Dungeon
Masters. Paste in your campaign lore — NPCs, locations, plot threads — and ask
questions or get in-character help. The assistant retrieves the most relevant
notes and grounds its answers in them, instead of hallucinating details that
contradict your campaign.

Runs **entirely locally** via [Ollama](https://ollama.com) — no API keys, no
cloud costs, no signups. Built as a full-stack demo of a real RAG pipeline:
chunking, embeddings, vector similarity search, and streamed LLM generation,
wired up end-to-end.

## How it works

```
 ┌────────────┐      ┌──────────────┐      ┌────────────────┐
 │  Add Note   │ ───▶ │ Chunk + Embed│ ───▶ │  SQLite store   │
 └────────────┘      └──────────────┘      │ (text + vector) │
                                             └────────────────┘
                                                     ▲
 ┌────────────┐      ┌──────────────┐              │
 │ Ask a       │ ───▶ │ Embed query  │ ─────────────┘
 │ question    │      └──────────────┘
 └────────────┘              │
                              ▼
                     cosine similarity search
                       (top-k relevant notes)
                              │
                              ▼
                 Local LLM (via Ollama) generates a
                 grounded, streamed answer citing sources
```

1. **Notes are chunked and embedded.** Long notes are split into ~800-character
   chunks (paragraph-aware, with overlap) so retrieval stays precise. Each
   chunk is embedded locally via Ollama's embeddings endpoint and stored in
   SQLite alongside the raw text.
2. **Questions are embedded and matched.** When you ask something, the query
   is embedded and scored against every stored chunk with cosine similarity.
   The top-k matches become context.
3. **The local model answers, grounded in that context.** The retrieved notes
   are injected into the prompt, and the model streams back a response via
   Server-Sent Events. The UI shows exactly which notes were used and their
   relevance score, so you can trust (and debug) what the assistant is doing.

## Stack

- **Backend:** Node.js, TypeScript, Express, `better-sqlite3`
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **LLM + Embeddings:** [Ollama](https://ollama.com), running fully local
  (default models: `llama3.1` for chat, `nomic-embed-text` for embeddings)

The vector search is a straightforward in-memory cosine similarity scan over
rows in SQLite — no vector database required. It's structured so swapping in
`pgvector`, Pinecone, or Chroma at scale is a contained change (see
`backend/src/services/notesStore.ts`). Swapping Ollama for a cloud provider
(Anthropic, OpenAI, Gemini) later is also a contained change — only
`backend/src/services/llm.ts` and `embeddings.ts` would need to change.

## Getting started

### 1. Install Ollama and pull the models

Download Ollama from [ollama.com/download](https://ollama.com/download), then:

```bash
ollama pull llama3.1
ollama pull nomic-embed-text
```

Ollama runs as a background service after install. If it's not already
running, start it with `ollama serve`.

### 2. Install project dependencies

```bash
npm run install:all
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

The defaults in `.env.example` match a standard local Ollama install, so you
likely won't need to change anything.

### 4. Run it

```bash
npm run dev
```

This starts the backend on `http://localhost:3001` and the frontend on
`http://localhost:5173` (Vite proxies `/api` requests to the backend).

## Project structure

```
backend/
  src/
    db/            SQLite setup
    services/      embeddings, chunking, vector search, LLM generation
    routes/        /api/notes, /api/chat (SSE streaming)
    index.ts        Express app entry point
frontend/
  src/
    components/    NotesPanel, ChatPanel
    lib/           API client, shared types
    App.tsx
```

## Possible extensions

- Swap SQLite cosine search for `pgvector` or an ANN index at scale
- Add NPC dialogue generation with persona-locked system prompts per NPC
- Session log ingestion (auto-summarize a session transcript into notes)
- Multi-campaign support with campaign switching
- Auth + persistence per DM account (currently single-user, local-only)
- Swap Ollama for a cloud LLM provider (Anthropic, OpenAI, Gemini) for
  better generation quality, at the cost of API fees

## License

MIT — do whatever you'd like with this.
