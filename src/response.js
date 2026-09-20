import { askQuestMind } from "./core/api.js";

export function createPlaceholderResponse({ game, mode, players, question, attachments = 0 }) {
  const result = askQuestMind({
    game,
    mode,
    playerCount: Number(players),
    question,
    attachments: Array.from({ length: attachments }, (_, index) => ({
      name: `board-state-${index + 1}.png`,
      type: "image/png",
    })),
  }, { provider: "mock" });
  return result.text;
}
