# AI DM Assistant

Campaign memory for a D&D Dungeon Master, driven by voice through
[Jarvis](https://github.com/adewaskar/jarvis). Tell Jarvis about NPCs, places and
plot as they happen; ask him later and he answers from your notes using Claude.

There is no UI and no web server. The project is an MCP server
(`backend/src/mcp.ts`) that Jarvis, or Claude Code itself, calls as tools:

| Tool          | Does                                                         |
|---------------|--------------------------------------------------------------|
| `search_lore` | Semantic search over notes, returns the best-matching chunks |
| `list_notes`  | Titles and categories of every note                          |
| `add_note`    | Chunk, embed and store a note                                |

## How it works

1. **Store.** A note is split into ~800-char overlapping chunks. Each chunk is
   embedded together with its title by `bge-small-en-v1.5`, which runs
   in-process via transformers.js (no API key, no external service; the weights,
   ~33 MB, download once on first use). Text and vector go into `backend/data.sqlite`.
2. **Recall.** The question is embedded and scored against every chunk by cosine
   similarity; the top-k come back to Claude, which writes the answer.

## Setup

Requires Node 22.5+ (for built-in `node:sqlite`).

```bash
cd backend
npm install
npm run check   # stores, recalls and deletes test notes against the real DB
claude mcp add -s user dnd -- node "$PWD/node_modules/tsx/dist/cli.mjs" "$PWD/src/mcp.ts"
```

Jarvis loads every MCP server in your user-scope Claude Code config, so restart
it and say "Hey Jarvis, what do my notes say about…". Searching is always
allowed; `add_note` writes, so Jarvis only runs it with writes enabled.
