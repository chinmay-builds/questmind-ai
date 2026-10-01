import { getRuleDetails } from "../rules.js";

export const GREETING_REGEX = /^(hi+|hello+|hey+|heya+|hiya+|yo+|greetings|good\s+(morning|afternoon|evening|day)|howdy|sup|wass?up|wazzup|what'?s\s+(up|good)|what\s+is\s+up|what\s+up|how\s+are\s+you|how'?s\s+it\s+going|who\s+are\s+you|what\s+can\s+you\s+do|thanks|thank\s+you|ty|thx|cheers)\b/i;

export const OFF_TOPIC_REGEX = /\b(python|javascript|typescript|html|css|sql|coding|programming|weather|president|election|recipe|cook|bake|movie|stock\s+market|crypto|bitcoin|ethereum|homework|physics|calculus|flight|hotel)\b/i;

export function fallbackResponse(request, reason = "The configured provider is unavailable.") {
  const q = typeof request?.question === "string" ? request.question.trim() : "";
  const game = request?.game || "Catan";
  const mode = request?.mode || "Standard";
  const playerCount = request?.playerCount ?? 4;
  const attachmentCount = request?.attachments?.length ?? 0;
  const attachmentNote = attachmentCount
    ? ` (${attachmentCount} attached image${attachmentCount === 1 ? "" : "s"} noted)`
    : "";

  if (GREETING_REGEX.test(q)) {
    return {
      text: `Hello! I'm QuestMind, your table-side companion for ${game} (${mode} mode, ${playerCount} ${playerCount === 1 ? "player" : "players"}). Ask me about rules, setup, turn choices, or card interactions!${attachmentNote}`,
      evidence: "QuestMind Table-Side Companion",
      provider: "fallback",
      context: { game, mode, playerCount, attachmentCount },
    };
  }

  if (OFF_TOPIC_REGEX.test(q)) {
    return {
      text: `I'm QuestMind, a dedicated board-game companion. I can only assist with tabletop rules, strategies, turn options, and game setups. What's happening in your game of ${game}?`,
      evidence: "Tabletop scope policy",
      provider: "fallback",
      context: { game, mode, playerCount, attachmentCount },
    };
  }

  const details = getRuleDetails(game);
  let answerText = "";
  let evidenceText = `${game} Official Rules`;

  if (/build|road|settlement|city|place|placement|deploy|structure|habitat|tile/i.test(q)) {
    answerText = `In ${game}: ${details.buildingRules}`;
    evidenceText = `${game} Official Rules · Building & Placement`;
  } else if (/win|score|points|victory|end game|winner|finish/i.test(q)) {
    answerText = `In ${game}: ${details.winCondition}`;
    evidenceText = `${game} Official Rules · Victory & Scoring`;
  } else if (/turn|phase|action|order|round|how to play|step|start/i.test(q)) {
    answerText = `In ${game}: ${details.turnStructure}`;
    evidenceText = `${game} Official Rules · Turn Structure`;
  } else if (/combat|fight|attack|battle|power dial|conflict|robber|monster/i.test(q)) {
    answerText = `In ${game}: ${details.combatRules}`;
    evidenceText = `${game} Official Rules · Conflict & Combat`;
  } else if (/strategy|tip|opening|next move|advice|trade-off|tactics/i.test(q)) {
    answerText = `For ${game} (${mode} mode, ${playerCount} ${playerCount === 1 ? "player" : "players"}): ${details.strategyTip}`;
    evidenceText = `${game} Strategy Guide`;
  } else if (request?.ruleContext?.summary) {
    answerText = `For ${game} (${mode} mode, ${playerCount} ${playerCount === 1 ? "player" : "players"}): ${request.ruleContext.summary}`;
    evidenceText = request.ruleContext.evidence || `${game} Official Rules`;
  } else {
    answerText = `In ${game} (${mode} mode): ${details.turnStructure} ${details.winCondition}`;
    evidenceText = `${game} Official Rules`;
  }

  return {
    text: `${answerText}${attachmentNote}`,
    evidence: evidenceText,
    provider: "fallback",
    context: { game, mode, playerCount, attachmentCount },
  };
}
