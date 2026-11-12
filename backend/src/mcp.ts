import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { addNote, listNotes, retrieveRelevantNotes } from "./services/notesStore.js";

const server = new McpServer({ name: "dnd", version: "1.0.0" });
const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });

server.registerTool(
  "search_lore",
  {
    description: "Search the DM's campaign notes (NPCs, locations, plot, rules) for passages relevant to a question.",
    inputSchema: { query: z.string(), topK: z.number().int().min(1).max(20).optional() },
  },
  async ({ query, topK }) =>
    json((await retrieveRelevantNotes(query, topK ?? 5)).map(({ title, category, content, score }) => ({ title, category, content, score })))
);

server.registerTool(
  "list_notes",
  { description: "List titles and categories of all campaign notes.", inputSchema: {} },
  async () => json([...new Map(listNotes().map((n) => [n.title, { title: n.title, category: n.category }])).values()])
);

server.registerTool(
  "add_note",
  {
    description: "Save a new campaign note (e.g. something that just happened in session).",
    inputSchema: { title: z.string(), content: z.string(), category: z.string().optional() },
  },
  async ({ title, content, category }) => json({ saved: (await addNote(title, content, category ?? "general")).length })
);

await server.connect(new StdioServerTransport());
