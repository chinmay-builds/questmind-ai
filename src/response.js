export function createPlaceholderResponse({ game, mode, players, question, attachments = 0 }) {
  const imageNote = attachments
    ? ` I can see ${attachments} attached image${attachments === 1 ? "" : "s"} queued for the future vision module.`
    : "";
  return `[PLACEHOLDER] For ${game} · ${mode} · ${players} players: I’ve logged “${question}”. A real rules-aware answer will appear here when QuestMind Core is connected.${imageNote}`;
}
