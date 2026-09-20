export function fallbackResponse(request, reason = "The configured provider is unavailable.") {
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
