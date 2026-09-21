import { normalizeAssistantResponse, validateQuestRequest } from "../contracts.js";

export const mockProvider = {
  name: "mock",
  answer(input) {
    const request = validateQuestRequest(input);
    const attachmentNote = request.attachments.length
      ? ` I’ve queued ${request.attachments.length} attached image${request.attachments.length === 1 ? "" : "s"} for a future vision pass.`
      : "";
    const source = request.ruleContext.source?.url ?? request.searchContext.results[0]?.url ?? "";
    const normalized = normalizeAssistantResponse(`[LOCAL PLACEHOLDER] For ${request.game} · ${request.mode} · ${request.playerCount} ${request.playerCount === 1 ? "player" : "players"}: I’ve logged “${request.question}”. I cannot verify a rules answer without supplied rulebook context.${attachmentNote}\nEVIDENCE: ${request.ruleContext.evidence}.${source}`);
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
