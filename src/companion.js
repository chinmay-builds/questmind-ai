/**
 * Return the current response for a game/rules question.
 *
 * The explicit placeholder is intentional: this boundary can later be backed
 * by a rules engine or model without pretending that one exists today.
 *
 * @param {string} question
 * @returns {string}
 */
export function answerQuestion(question) {
  if (typeof question !== "string" || question.trim() === "") {
    throw new TypeError("A non-empty game or rules question is required.");
  }

  return `[PLACEHOLDER] QuestMind will answer this game question once a rules engine or AI provider is connected: "${question.trim()}"`;
}
