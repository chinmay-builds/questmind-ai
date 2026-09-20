import test from "node:test";
import assert from "node:assert/strict";
import { answerQuestion } from "../src/companion.js";
import { createPlaceholderResponse } from "../src/response.js";

test("returns an explicitly marked placeholder answer", () => {
  const response = answerQuestion("Can I draw two cards?");

  assert.match(response, /^\[PLACEHOLDER\]/);
  assert.match(response, /Can I draw two cards\?/);
});

test("trims whitespace around a question", () => {
  assert.equal(
    answerQuestion("  How does scoring work?  "),
    '[PLACEHOLDER] QuestMind will answer this game question once a rules engine or AI provider is connected: "How does scoring work?"',
  );
});

test("rejects an empty question", () => {
  assert.throws(() => answerQuestion("   "), {
    name: "TypeError",
    message: "A non-empty game or rules question is required.",
  });
});

test("includes the selected context and attachment count in the UI response", () => {
  assert.match(
    createPlaceholderResponse({
      game: "Scythe",
      mode: "Automa",
      players: "2",
      question: "What should I do next?",
      attachments: 2,
    }),
    /Scythe · Automa · 2 players[\s\S]*2 attached images/,
  );
});
