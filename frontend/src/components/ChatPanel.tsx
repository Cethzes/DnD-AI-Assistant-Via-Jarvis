import { useRef, useState } from "react";
import { streamChat } from "../lib/api";
import type { ChatMessage } from "../lib/types";

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || busy) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", content: question };
    const assistantId = uid();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setBusy(true);
    scrollToBottom();

    function updateAssistant(update: Partial<ChatMessage>) {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, ...update } : m))
      );
    }

    try {
      await streamChat(question, {
        onSources: (sources) => updateAssistant({ sources }),
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + token } : m
            )
          );
          scrollToBottom();
        },
        onDone: () => updateAssistant({ isStreaming: false }),
        onError: (message) =>
          updateAssistant({ content: `⚠️ ${message}`, isStreaming: false }),
      });
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-stone-700 p-4">
        <h2 className="font-display text-lg text-parchment">Ask the Assistant</h2>
        <p className="mt-1 text-xs text-stone-400">
          Grounded in your campaign notes. Try: "What does the party know about the missing shipment?"
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="mt-8 text-center text-sm text-stone-500">
            Ask a question and I'll pull relevant lore from your notes to answer in character.
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-ember text-parchment"
                  : "border border-stone-700 bg-stone-900/60 text-parchment"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">
                {m.content}
                {m.isStreaming && <span className="ml-0.5 animate-pulse">▍</span>}
              </p>

              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 border-t border-stone-700 pt-2">
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-stone-500">
                    Sources
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.sources.map((s) => (
                      <span
                        key={s.id}
                        title={s.content}
                        className="cursor-default rounded border border-stone-600 bg-stone-800 px-2 py-0.5 text-[10px] text-stone-300"
                      >
                        {s.title} · {(s.score * 100).toFixed(0)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="border-t border-stone-700 p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about NPCs, plot threads, locations..."
            className="flex-1 rounded-md border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-parchment placeholder:text-stone-500 focus:border-ember focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-md bg-ember px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ember/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ask
          </button>
        </div>
      </form>
    </div>
  );
}
