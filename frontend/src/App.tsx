import NotesPanel from "./components/NotesPanel";
import ChatPanel from "./components/ChatPanel";

export default function App() {
  return (
    <div className="flex h-screen flex-col bg-inkwell">
      <header className="border-b border-stone-700 px-6 py-4">
        <h1 className="font-display text-2xl text-ember">🐉 AI DM Assistant</h1>
        <p className="text-xs text-stone-500">
          A retrieval-augmented assistant grounded in your own campaign lore
        </p>
      </header>

      <main className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[380px_1fr]">
        <section className="overflow-hidden border-b border-stone-700 md:border-b-0 md:border-r">
          <NotesPanel />
        </section>
        <section className="overflow-hidden">
          <ChatPanel />
        </section>
      </main>
    </div>
  );
}
