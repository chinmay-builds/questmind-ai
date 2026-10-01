import { normalizeAssistantResponse, validateQuestRequest } from "../contracts.js";

const GREETING_REGEX = /^(hi|hello|hey|yo|greetings|good\s+(morning|afternoon|evening)|howdy|sup|how\s+are\s+you|who\s+are\s+you|what\s+can\s+you\s+do|thanks|thank\s+you)\b/i;

const OFF_TOPIC_REGEX = /\b(python|javascript|typescript|html|css|sql|coding|programming|weather|president|election|recipe|cook|bake|movie|stock\s+market|crypto|homework|physics|calculus|flight|hotel)\b/i;

export const mockProvider = {
  name: "mock",
  answer(input) {
    const request = validateQuestRequest(input);
    const q = request.question.trim();
    const attachmentNote = request.attachments.length
      ? ` I’ve queued ${request.attachments.length} attached image${request.attachments.length === 1 ? "" : "s"} for a future vision pass.`
      : "";

    if (GREETING_REGEX.test(q)) {
      const normalized = normalizeAssistantResponse(
        `ANSWER: Hello! I'm QuestMind, your table-side companion for ${request.game} (${request.mode} mode, ${request.playerCount} ${request.playerCount === 1 ? "player" : "players"}). Ask me about rules, setup, turn choices, or card interactions!${attachmentNote}\nEVIDENCE: QuestMind Table-Side Companion.`
      );
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
    }

    if (OFF_TOPIC_REGEX.test(q)) {
      const normalized = normalizeAssistantResponse(
        `ANSWER: I'm QuestMind, a dedicated board-game companion. I can only assist with tabletop rules, strategies, turn options, and game setups. What's happening in your game of ${request.game}?\nEVIDENCE: Tabletop scope policy.`
      );
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
    }

    const normalized = normalizeAssistantResponse(
      `ANSWER: For ${request.game} · ${request.mode} · ${request.playerCount} ${request.playerCount === 1 ? "player" : "players"}: Regarding “${q}”, verify your turn sequence and card effects according to ${request.game} core rules.${attachmentNote}\nEVIDENCE: ${request.ruleContext.evidence || `${request.game} Official Rules`}.`
    );
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
