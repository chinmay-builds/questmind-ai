import { InvalidQuestRequestError } from "./errors.js";
import { validateGameContext } from "../rules.js";

/**
 * @typedef {{ name: string, type: string, size?: number, dataUrl?: string }} ImageAttachment
 * @typedef {{
 *   game: string,
 *   mode: string,
 *   playerCount: number,
 *   question: string,
 *   attachments?: ImageAttachment[],
 *   model?: string
 * }} QuestRequest
 * @typedef {{ text: string, evidence: string, provider: string, context: { game: string, mode: string, playerCount: number, attachmentCount: number } }} QuestResponse
 */

export function validateQuestRequest(input) {
  if (!input || typeof input !== "object") {
    throw new InvalidQuestRequestError("A request object is required.");
  }

  const { game, mode, playerCount, question, model, webSearch, attachments = [] } = input;
  if (typeof game !== "string" || !game.trim()) {
    throw new InvalidQuestRequestError("game must be a non-empty string.");
  }
  if (typeof mode !== "string" || !mode.trim()) {
    throw new InvalidQuestRequestError("mode must be a non-empty string.");
  }
  if (!Number.isInteger(playerCount)) {
    throw new InvalidQuestRequestError("playerCount must be an integer.");
  }
  if (typeof question !== "string" || !question.trim()) {
    throw new InvalidQuestRequestError("question must be a non-empty string.");
  }
  if (!Array.isArray(attachments)) {
    throw new InvalidQuestRequestError("attachments must be an array.");
  }
  if (model !== undefined && (typeof model !== "string" || !model.trim())) {
    throw new InvalidQuestRequestError("model must be a non-empty alias.");
  }
  const contextValidation = validateGameContext(game.trim(), mode.trim(), playerCount);
  if (!contextValidation.ok) throw new InvalidQuestRequestError(contextValidation.message);
  for (const attachment of attachments) {
    if (!attachment || typeof attachment.name !== "string" || typeof attachment.type !== "string") {
      throw new InvalidQuestRequestError("Each attachment needs a name and MIME type.");
    }
    if (!attachment.type.startsWith("image/")) {
      throw new InvalidQuestRequestError(`Attachment "${attachment.name}" is not an image.`);
    }
  }
  return {
    game: game.trim(),
    mode: mode.trim(),
    playerCount,
    question: question.trim(),
    model: typeof model === "string" && model.trim() ? model.trim().toLowerCase() : undefined,
    webSearch: webSearch !== false,
    ruleContext: contextValidation.context,
    attachments: attachments.map(({ name, type, size, dataUrl }) => ({ name, type, size, dataUrl })),
  };
}

export function normalizeAssistantResponse(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new InvalidQuestRequestError("Provider response must contain a non-empty answer.");
  }
  const cleaned = text.replace(/<[^>]*>/g, "").trim();
  const answerMatch = cleaned.match(/(?:^|\n)\s*ANSWER:\s*([\s\S]*?)(?=\n\s*EVIDENCE:|$)/i);
  const evidenceMatch = cleaned.match(/(?:^|\n)\s*EVIDENCE:\s*([\s\S]*)$/i);
  const answer = (answerMatch?.[1] ?? cleaned).trim();
  const evidence = (evidenceMatch?.[1] ?? "Not provided — this answer is not verified against a supplied rulebook or source.").trim();
  if (!answer) throw new InvalidQuestRequestError("Provider response must contain a non-empty answer.");
  return { answer, evidence };
}
