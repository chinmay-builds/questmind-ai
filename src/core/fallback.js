const GREETING_REGEX = /^(hi|hello|hey|yo|greetings|good\s+(morning|afternoon|evening)|howdy|sup|how\s+are\s+you|who\s+are\s+you|what\s+can\s+you\s+do|thanks|thank\s+you)\b/i;

const OFF_TOPIC_REGEX = /\b(python|javascript|typescript|html|css|sql|coding|programming|weather|president|election|recipe|cook|bake|movie|stock\s+market|crypto|homework|physics|calculus|flight|hotel)\b/i;

export function fallbackResponse(request, reason = "The configured provider is unavailable.") {
  const q = typeof request?.question === "string" ? request.question.trim() : "";

  if (GREETING_REGEX.test(q)) {
    return {
      text: `Hello! I'm QuestMind, your table-side companion for ${request.game || "board games"}. Ask me about rules, turns, setup, or strategy!`,
      evidence: "QuestMind Table-Side Companion",
      provider: "fallback",
      context: {
        game: request.game,
        mode: request.mode,
        playerCount: request.playerCount,
        attachmentCount: request.attachments?.length ?? 0,
      },
    };
  }

  if (OFF_TOPIC_REGEX.test(q)) {
    return {
      text: `I'm QuestMind, a dedicated board-game companion. I can only assist with tabletop rules, strategies, turn options, and game setups. What's happening in your game of ${request.game || "board games"}?`,
      evidence: "Tabletop scope policy",
      provider: "fallback",
      context: {
        game: request.game,
        mode: request.mode,
        playerCount: request.playerCount,
        attachmentCount: request.attachments?.length ?? 0,
      },
    };
  }

  return {
    text: `I couldn't verify that rules answer right now. ${reason} Please retry, or upload the relevant rulebook page or board image.`,
    evidence: "Not verified — provider response unavailable.",
    provider: "fallback",
    context: {
      game: request.game,
      mode: request.mode,
      playerCount: request.playerCount,
      attachmentCount: request.attachments?.length ?? 0,
    },
  };
}
