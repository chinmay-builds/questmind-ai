const definitions = [
  ["Catan", ["Standard", "Cities & Knights", "Seafarers"], 3, 4],
  ["Scythe", ["Normal", "Automa", "Rise of Fenris"], 2, 5],
  ["Wingspan", ["Base Game", "Solo / Automa", "Asia"], 2, 5],
  ["Root", ["Competitive", "Solo / Clockwork", "Two-player"], 2, 4],
  ["Gloomhaven", ["Campaign", "Jaws of the Lion", "Solo scenario"], 2, 4],
  ["Terraforming Mars", ["Standard", "Solo challenge", "Prelude"], 2, 5],
  ["Ark Nova", ["Standard", "Solo zoo", "Marine Worlds"], 2, 4],
  ["Spirit Island", ["Standard", "Solo spirit", "Adversary"], 1, 4],
  ["Ticket to Ride", ["Classic", "Europe", "1910 expansion"], 2, 5],
  ["Betrayal at House on the Hill", ["Third edition", "Cooperative", "Haunt"], 3, 6],
  ["Dune: Imperium", ["Competitive", "Solo / House Hagal", "Uprising"], 2, 4],
  ["Everdell", ["Standard", "Solo / Rugwort", "Mistwood"], 2, 4],
  ["7 Wonders", ["Classic", "Leaders", "Cities"], 2, 7],
  ["Pandemic", ["Standard", "Heroic", "Solo"], 2, 4],
  ["The Crew", ["Mission deck", "Two-player", "Solo variant"], 2, 5],
  ["Azul", ["Classic", "Summer Pavilion", "Queen's Garden"], 2, 4],
  ["Carcassonne", ["Base game", "Hunters & Gatherers", "Solo"], 2, 5],
  ["Dominion", ["First game", "Random kingdom", "Seaside"], 2, 4],
  ["Mansions of Madness", ["Scenario", "One investigator", "With app"], 2, 5],
  ["Blood on the Clocktower", ["Trouble Brewing", "Sects & Violets", "Custom script"], 5, 20],
];

export const games = definitions.map(([name, modes, minPlayers, maxPlayers]) => ({
  name,
  modes,
  minPlayers,
  maxPlayers,
  playerOptions: Array.from({ length: maxPlayers - minPlayers + 1 }, (_, index) => minPlayers + index),
}));

export function getGame(name) {
  return games.find((game) => game.name === name);
}

export function getPlayerOptions(game, mode) {
  const normalizedMode = String(mode ?? "").trim();
  if (/two-player|duet/i.test(normalizedMode)) return [2];
  if (/automa|solo|one investigator|house hagal|rugwort|clockwork/i.test(normalizedMode)) return [1];
  if (game?.name === "Wingspan" && /asia/i.test(normalizedMode)) return [1, 2];
  if (game?.name === "Scythe" && /rise of fenris/i.test(normalizedMode)) return [1, 2, 3, 4, 5];
  if (game?.name === "Mansions of Madness" && /with app/i.test(normalizedMode)) return [1, 2, 3, 4, 5];
  return game?.playerOptions ?? [];
}
