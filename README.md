# 🐉 AI DM Assistant

A retrieval-augmented generation (RAG) assistant for Dungeons & Dragons Dungeon
Masters. Paste in your campaign lore — NPCs, locations, plot threads — and ask
questions or get in-character help. The assistant retrieves the most relevant
notes and grounds its answers in them, instead of hallucinating details that
contradict your campaign.

Built as a full-stack demo of a real RAG pipeline: chunking, embeddings,
vector similarity search, and streamed LLM generation, wired up end-to-end.

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
                  Claude generates a grounded,
                  streamed answer citing sources
```

1. **Notes are chunked and embedded.** Long notes are split into ~800-character
   chunks (paragraph-aware, with overlap) so retrieval stays precise. Each
   chunk is embedded with [Voyage AI](https://voyageai.com) — Anthropic's
   recommended embeddings provider — and stored in SQLite alongside the raw
   text.
2. **Questions are embedded and matched.** When you ask something, the query
   is embedded and scored against every stored chunk with cosine similarity.
   The top-k matches become context.
3. **Claude answers, grounded in that context.** The retrieved notes are
   injected into the system/user prompt, and Claude streams back a response
   via Server-Sent Events. The UI shows exactly which notes were used and
   their relevance score, so you can trust (and debug) what the assistant is
   doing.

## Stack

- **Backend:** Node.js, TypeScript, Express, `better-sqlite3`, Anthropic SDK
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Embeddings:** Voyage AI (`voyage-3.5-lite`)
- **LLM:** Claude (via the Anthropic API), streamed responses

The vector search is a straightforward in-memory cosine similarity scan over
rows in SQLite — no vector database required to run this locally. It's
structured so swapping in `pgvector`, Pinecone, or Chroma at scale is a
contained change (see `backend/src/services/notesStore.ts`).

## Getting started

### 1. Get API keys

- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com/)
- **Voyage AI key** — [dashboard.voyageai.com](https://dashboard.voyageai.com/)
  (free tier is plenty for local dev)

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
# then edit backend/.env and paste in your keys
```

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
    services/      embeddings, chunking, vector search, Claude generation
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

## License

MIT — do whatever you'd like with this.
