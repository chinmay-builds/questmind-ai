import { getGame, getPlayerOptions, games } from "./games.js";

const catalog = new Map(games.flatMap((game) => game.modes.map((mode) => [
  `${game.name}::${mode}`,
  {
    game: game.name,
    mode,
    summary: "No verified rule excerpt is loaded for this game and mode yet. Upload or paste the relevant rulebook page before relying on an answer.",
    evidence: "Rulebook context not provided",
    source: null,
  },
])));

const scytheAutoma = {
  game: "Scythe",
  mode: "Automa",
  summary: "The Automa is Scythe's official solo opponent system. This starter note identifies the official variant only; turn-by-turn Automa card rules are not loaded, so do not infer an action from this note.",
  evidence: "Stonemaier Games, Scythe Rules — official Automa rules page",
  source: {
    label: "Stonemaier Games — Scythe Rules",
    url: "https://stonemaiergames.com/games/scythe/scythe-rules/",
  },
};
catalog.set("Scythe::Automa", scytheAutoma);

export function getRuleContext(gameName, mode) {
  return catalog.get(`${gameName}::${mode}`) ?? {
    game: gameName,
    mode,
    summary: "No verified rule context is available for this selection.",
    evidence: "Rulebook context not provided",
    source: null,
  };
}

export function validateGameContext(gameName, mode, playerCount) {
  const game = getGame(gameName);
  if (!game) return { ok: false, message: `Unsupported game "${gameName}".` };
  if (!game.modes.includes(mode)) return { ok: false, message: `Mode "${mode}" is not available for ${game.name}.` };
  const options = getPlayerOptions(game, mode);
  if (!options.includes(playerCount)) {
    return { ok: false, message: `${game.name} / ${mode} supports ${options[0]}-${options.at(-1)} players in this setup.` };
  }
  return { ok: true, game, context: getRuleContext(game.name, mode) };
}

export { catalog as ruleCatalog };
