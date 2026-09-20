import test from "node:test";
import assert from "node:assert/strict";
import { answerQuestion } from "../src/companion.js";
import { askQuestMind } from "../src/core/api.js";
import { createProvider } from "../src/core/providers/index.js";
import { providerNameFromEnv } from "../src/core/config.js";
import { InvalidQuestRequestError, ProviderNotConfiguredError, UnsupportedProviderError } from "../src/core/errors.js";

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
    askQuestMind({
      game: "Scythe",
      mode: "Automa",
      playerCount: 2,
      question: "What should I do next?",
      attachments: [{ name: "board.png", type: "image/png" }, { name: "card.jpg", type: "image/jpeg" }],
    }, { provider: "mock" }).text,
    /Scythe · Automa · 2 players[\s\S]*2 attached images/,
  );
});

test("rejects malformed core requests", () => {
  assert.throws(() => askQuestMind({ game: "Catan", mode: "Standard", playerCount: 0, question: "Help" }, { provider: "mock" }), InvalidQuestRequestError);
  assert.throws(() => askQuestMind({ game: "Catan", mode: "Standard", playerCount: 4, question: "" }, { provider: "mock" }), InvalidQuestRequestError);
});

test("requires an explicit supported provider", () => {
  assert.throws(() => createProvider(), ProviderNotConfiguredError);
  assert.throws(() => createProvider("hosted-ai"), UnsupportedProviderError);
  assert.equal(createProvider("mock").name, "mock");
  assert.equal(providerNameFromEnv({ QUESTMIND_PROVIDER: "mock" }), "mock");
  assert.throws(() => providerNameFromEnv({}), ProviderNotConfiguredError);
});
