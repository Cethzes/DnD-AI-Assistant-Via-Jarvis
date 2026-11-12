// End-to-end RAG check against the real DB: store, recall by meaning, clean up. Run: npm run check
import assert from "node:assert/strict";
import { addNote, deleteNote, retrieveRelevantNotes } from "./services/notesStore.js";

const tag = `selfcheck-${Date.now()}`;
const ids = [
  ...(await addNote(`${tag} Vexa`, "Vexa is a tiefling blacksmith in Emberfall who secretly forges weapons for the thieves' guild.", "npc")),
  ...(await addNote(`${tag} Saltmarsh`, "A rainy fishing village on the coast, famous for smuggler caves under the cliffs.", "location")),
  ...(await addNote(`${tag} Grapple`, "Grappling uses an Athletics check contested by Athletics or Acrobatics.", "rules")),
].map((n) => n.id);

try {
  const cases: [string, string][] = [
    ["who makes swords for the criminals?", "Vexa"],
    ["where could the party find hidden sea caves?", "Saltmarsh"],
    ["how do I wrestle an enemy to the ground", "Grapple"],
  ];
  for (const [query, expected] of cases) {
    const top = (await retrieveRelevantNotes(query, 50)).find((n) => n.title.startsWith(tag));
    assert.equal(top?.title, `${tag} ${expected}`, query);
    console.log(`ok  "${query}" -> ${expected} (${top!.score.toFixed(3)})`);
  }
} finally {
  ids.forEach(deleteNote);
}
