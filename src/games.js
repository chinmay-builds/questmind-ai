const definitions = [
  ["Catan", ["Standard", "Cities & Knights", "Seafarers"], 3, 4],
  ["Scythe", ["Normal", "Automa", "Rise of Fenris"], 1, 5],
  ["Wingspan", ["Base Game", "Solo / Automa", "Asia"], 1, 5],
  ["Root", ["Competitive", "Solo / Clockwork", "Two-player"], 2, 4],
  ["Gloomhaven", ["Campaign", "Jaws of the Lion", "Solo scenario"], 1, 4],
  ["Terraforming Mars", ["Standard", "Solo challenge", "Prelude"], 1, 5],
  ["Ark Nova", ["Standard", "Solo zoo", "Marine Worlds"], 1, 4],
  ["Spirit Island", ["Standard", "Solo spirit", "Adversary"], 1, 4],
  ["Ticket to Ride", ["Classic", "Europe", "1910 expansion"], 2, 5],
  ["Betrayal at House on the Hill", ["Third edition", "Cooperative", "Haunt"], 3, 6],
  ["Dune: Imperium", ["Competitive", "Solo / House Hagal", "Uprising"], 1, 4],
  ["Everdell", ["Standard", "Solo / Rugwort", "Mistwood"], 1, 4],
  ["7 Wonders", ["Classic", "Leaders", "Cities"], 2, 7],
  ["Pandemic", ["Standard", "Heroic", "Solo"], 2, 4],
  ["The Crew", ["Mission deck", "Two-player", "Solo variant"], 2, 5],
  ["Azul", ["Classic", "Summer Pavilion", "Queen's Garden"], 2, 4],
  ["Carcassonne", ["Base game", "Hunters & Gatherers", "Solo"], 2, 5],
  ["Dominion", ["First game", "Random kingdom", "Seaside"], 2, 4],
  ["Mansions of Madness", ["Scenario", "One investigator", "With app"], 1, 5],
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
  if (/two-player/i.test(mode)) return [2];
  if (/solo|one investigator|house hagal|rugwort/i.test(mode)) return [1];
  return game?.playerOptions ?? [];
}
