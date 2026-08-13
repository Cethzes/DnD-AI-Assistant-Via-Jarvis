export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

export interface RetrievedNote extends Note {
  score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RetrievedNote[];
  isStreaming?: boolean;
}

export const CATEGORIES = [
  "npc",
  "location",
  "plot",
  "item",
  "faction",
  "general",
] as const;

export type Category = (typeof CATEGORIES)[number];
