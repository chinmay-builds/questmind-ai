import { getRuleDetails, validateGameContext } from "../rules.js";
import { InvalidQuestRequestError } from "./errors.js";

const MAX_SCENARIO_LENGTH = 2_000;
const MAX_GOAL_LENGTH = 500;
const MAX_EXPERIENCE_LENGTH = 500;

function cleanText(value, field, { required = false, maxLength } = {}) {
  if (typeof value !== "string") {
    if (required) throw new InvalidQuestRequestError(`${field} must be a non-empty string.`);
    return "";
  }
  const text = value.trim();
  if (required && !text) throw new InvalidQuestRequestError(`${field} must be a non-empty string.`);
  if (maxLength && text.length > maxLength) {
    throw new InvalidQuestRequestError(`${field} must be ${maxLength} characters or fewer.`);
  }
  return text;
}

export function validateLessonRequest(input) {
  if (!input || typeof input !== "object") {
    throw new InvalidQuestRequestError("A lesson request object is required.");
  }

  const game = cleanText(input.game, "game", { required: true, maxLength: 100 });
  const mode = cleanText(input.mode, "mode", { required: true, maxLength: 100 });
  const scenario = cleanText(input.scenario, "scenario", {
    required: true,
    maxLength: MAX_SCENARIO_LENGTH,
  });
  const goal = cleanText(input.goal, "goal", { maxLength: MAX_GOAL_LENGTH });
  const experience = cleanText(input.experience, "experience", { maxLength: MAX_EXPERIENCE_LENGTH });
  const playerCount = Number(input.playerCount);

  if (!Number.isInteger(playerCount)) {
    throw new InvalidQuestRequestError("playerCount must be an integer.");
  }

  const context = validateGameContext(game, mode, playerCount);
  if (!context.ok) throw new InvalidQuestRequestError(context.message);

  return {
    game: context.game.name,
    mode,
    playerCount,
    scenario,
    goal,
    experience,
  };
}

function playerLabel(playerCount) {
  return `${playerCount} ${playerCount === 1 ? "player" : "players"}`;
}

function buildDecisionCheck(game, details) {
  if (game === "Catan") {
    return {
      prompt: "Before you act, which sequence best fits this situation?",
      options: [
        "Trade for the missing resource, then build the settlement if the distance rule is legal.",
        "Build any settlement immediately, even if it is not connected to your road network.",
        "Spend all resources on roads without checking whether the destination is blocked.",
      ],
      answer: "Trade for the missing resource, then build the settlement if the distance rule is legal.",
      explanation: details.buildingRules,
    };
  }

  return {
    prompt: "What should you verify before taking your next action?",
    options: [
      "The current phase, your legal action options, and the rule that determines whether the move is allowed.",
      "Only the points gained immediately; legality can be checked after the turn.",
      "Whether another player has already taken a similar action.",
    ],
    answer: "The current phase, your legal action options, and the rule that determines whether the move is allowed.",
    explanation: `${details.turnStructure} ${details.buildingRules}`,
  };
}

/**
 * Build a useful first lesson without waiting on a model or web search.
 * The scenario is deliberately carried through every section so the lesson
 * teaches from the player's actual table moment instead of generic rules.
 */
export function buildLesson(input) {
  const request = validateLessonRequest(input);
  const details = getRuleDetails(request.game);
  const decisionCheck = buildDecisionCheck(request.game, details);
  const goalText = request.goal || `make a legal, confident next move in ${request.game}`;
  const experienceText = request.experience || "new to this situation";

  return {
    title: `${request.game}: your next move, explained`,
    subtitle: `A guided lesson for ${request.mode} with ${playerLabel(request.playerCount)}`,
    provider: "local-rules",
    context: {
      game: request.game,
      mode: request.mode,
      playerCount: request.playerCount,
      scenario: request.scenario,
      goal: goalText,
      experience: experienceText,
    },
    sections: [
      {
        type: "scenario",
        title: "Start with what happened",
        body: `You said: “${request.scenario}” This lesson uses that moment as the table state. We will not skip ahead to a generic rules summary; first we identify the decision you were trying to make and the constraint that mattered.`,
      },
      {
        type: "diagnosis",
        title: "What to notice",
        body: `Your immediate goal is to ${goalText}. For ${request.game}, the key rule frame is: ${details.turnStructure} ${details.buildingRules}`,
      },
      {
        type: "rule",
        title: "The rule behind the moment",
        body: `${details.combatRules} The outcome you want to check is also tied to the win condition: ${details.winCondition}`,
      },
      {
        type: "guided-turn",
        title: "Work through the next turn",
        steps: [
          `Restate the table state from your scenario and name whose turn or phase it is.`,
          "List the resources, cards, units, or legal actions that are actually available right now.",
          "Check the restriction that can invalidate the tempting move before spending anything.",
          `Choose the line that best supports your goal to ${goalText}.`,
          "After the action, say what changed and what the next player can now do.",
        ],
        body: `Because you described your experience as ${experienceText}, take this one decision at a time. If the scenario changes, pause and rebuild the legal options rather than continuing from an assumption.`,
      },
      {
        type: "strategy",
        title: "Why this matters later",
        body: `${details.strategyTip} In your specific scenario, compare the immediate benefit with the position it creates for the next round. A legal move that preserves options is usually stronger than a flashy move that leaves no follow-up.`,
      },
      {
        type: "check",
        title: "Check your understanding",
        ...decisionCheck,
      },
      {
        type: "follow-up",
        title: "Bring the next table moment",
        body: "Tell QuestMind what happened after this decision, including the phase, available resources or cards, and what another player did. The next lesson can then continue from that exact state instead of restarting from the rules.",
      },
    ],
  };
}

export { MAX_SCENARIO_LENGTH };
