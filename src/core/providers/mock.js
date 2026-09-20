import { normalizeAssistantResponse, validateQuestRequest } from "../contracts.js";

export const mockProvider = {
  name: "mock",
  answer(input) {
    const request = validateQuestRequest(input);
    const attachmentNote = request.attachments.length
      ? ` I’ve queued ${request.attachments.length} attached image${request.attachments.length === 1 ? "" : "s"} for a future vision pass.`
      : "";
    const normalized = normalizeAssistantResponse(`[PLACEHOLDER] For ${request.game} · ${request.mode} · ${request.playerCount} ${request.playerCount === 1 ? "player" : "players"}: I’ve logged “${request.question}”. A rules-aware answer will appear here when a real provider is connected.${attachmentNote}`);
    return {
      text: normalized.answer,
      evidence: normalized.evidence,
      provider: "mock",
      context: {
        game: request.game,
        mode: request.mode,
        playerCount: request.playerCount,
        attachmentCount: request.attachments.length,
      },
    };
  },
};
