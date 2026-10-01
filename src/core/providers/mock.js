import { normalizeAssistantResponse, validateQuestRequest } from "../contracts.js";
import { getRuleDetails } from "../../rules.js";
import { GREETING_REGEX, OFF_TOPIC_REGEX } from "../fallback.js";

export const mockProvider = {
  name: "mock",
  answer(input) {
    const request = validateQuestRequest(input);
    const q = request.question.trim();
    const details = getRuleDetails(request.game);
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

    let answerText = `For ${request.game} · ${request.mode} · ${request.playerCount} ${request.playerCount === 1 ? "player" : "players"}: ${request.ruleContext.summary}`;
    let evidenceText = request.ruleContext.evidence || `${request.game} Official Rules`;

    if (/build|road|settlement|city|place|placement|deploy|structure|habitat/i.test(q)) {
      answerText = `In ${request.game}: ${details.buildingRules}`;
      evidenceText = `${request.game} Official Rules · Building & Placement`;
    } else if (/win|score|points|victory|end game|winner/i.test(q)) {
      answerText = `In ${request.game}: ${details.winCondition}`;
      evidenceText = `${request.game} Official Rules · Victory & Scoring`;
    } else if (/turn|phase|action|order|round|how to play|step/i.test(q)) {
      answerText = `In ${request.game}: ${details.turnStructure}`;
      evidenceText = `${request.game} Official Rules · Turn Structure`;
    } else if (/combat|fight|attack|battle|power dial|conflict/i.test(q)) {
      answerText = `In ${request.game}: ${details.combatRules}`;
      evidenceText = `${request.game} Official Rules · Conflict & Combat`;
    } else if (/strategy|tip|opening|next move|advice|trade-off/i.test(q)) {
      answerText = `For ${request.game} (${request.mode} mode, ${request.playerCount} players): ${details.strategyTip}`;
      evidenceText = `${request.game} Strategy Guide`;
    }

    const normalized = normalizeAssistantResponse(
      `ANSWER: ${answerText}${attachmentNote}\nEVIDENCE: ${evidenceText}.`
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
