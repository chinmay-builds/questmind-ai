import { getGame, getPlayerOptions, games } from "./games.js";

const gameSummaries = {
  "Catan": "Resource trading and building on hexagonal island. Turn: Roll dice for production (on 7, robber activates and players with 8+ cards discard half), trade resources, build roads, settlements, cities, or development cards. 10 Victory Points to win.",
  "Scythe": "Asymmetric dieselpunk 4X engine builder. Turn: Choose one section on player mat for top/bottom actions (Move, Bolster, Trade, Produce). Combat uses Power dial + Combat cards. First to 6 stars triggers end; Popularity determines score.",
  "Wingspan": "Engine-building bird collection game over 4 rounds. 4 core actions: Play a bird, Gain food (Forest), Lay eggs (Grasslands), Draw cards (Wetlands). End-of-round goals and bonus cards determine final points.",
  "Root": "Asymmetric woodland war game. Marquise de Cat builds economy; Eyrie Dynasty programs decrees; Woodland Alliance spreads sympathy and revolts; Vagabond completes quests. First to 30 VP or Dominance win.",
  "Gloomhaven": "Tactical cooperative card-driven dungeon crawler. Each turn play 2 cards (one top action, one bottom action) using initiative values. Exhaustion occurs when cards cannot be rested or played.",
  "Terraforming Mars": "Corporate engine building on Mars. Raise global parameters: Temperature (+2C), Oxygen (+1%), and 9 Oceans. Play project cards with tag synergies. Maxing all three parameters triggers game end.",
  "Spirit Island": "Cooperative complex settler-destruction game. Spirits combine Fast and Slow elemental power cards to defend Dahan natives and destroy Invader Explorers, Towns, and Cities before Blight spreads.",
  "Ark Nova": "Modern zoo design and animal conservation. 5 action cards upgrade when reaching strength 5 (Cards, Build, Animals, Association, Sponsors). Game ends when Appeal and Conservation markers cross.",
  "Ticket to Ride": "Train route drafting and claiming. Turn: Draw 2 Train Car cards, Claim a route by playing matching color cards, or Draw Destination Tickets. Longest route and completed tickets award points.",
  "Betrayal at House on the Hill": "Tile-exploration tile haunt game. Explore rooms, collect Items and Omens. Rolling Haunt checks triggers the Haunt, revealing a Traitor with distinct win conditions against the Heroes.",
  "Dune: Imperium": "Deck-building and worker placement on Arrakis. Send agents to board spaces matching card faction symbols to gain spice, solaris, and troops. Resolve end-of-round combat conflict.",
  "Everdell": "Tableau building and worker placement in a woodland valley. 3 actions: Place a Worker, Play a Card (Critter or Construction using berries/resources or free occupancy), or Prepare for Season.",
  "7 Wonders": "Card drafting civilization builder across 3 Ages. Draft 1 card simultaneously: Build structure, Construct Wonder stage, or Discard for 3 coins. Score Military, Science, Commercial, and Guilds.",
  "Pandemic": "Cooperative disease outbreak containment. 4 actions per turn (Move, Treat disease, Share knowledge, Discover cure). Draw Player cards (Epidemic intensifies infection) then infect cities.",
  "The Crew": "Cooperative trick-taking space mission game. Limited communication; players must ensure specific crew members win designated task cards without speaking about hand contents.",
  "Azul": "Tile drafting and mosaic pattern building. Draft matching tiles from a factory display or center pool to pattern lines; excess tiles overflow to floor line for negative points.",
  "Carcassonne": "Tile placement and meeple worker placement. Draw and place terrain tile; place meeple as Knight (City), Thief (Road), Monk (Cloister), or Farmer (Field). Score when completed.",
  "Dominion": "Pioneering deck building game. Turn: 1 Action, 1 Buy, Cleanup hand and draw 5 cards. Purchase Action cards, Treasures, and Victory point cards. Game ends when Provinces or 3 piles empty.",
  "Mansions of Madness": "App-driven cooperative Lovecraftian investigation. Explore maps, solve puzzles, fight monsters, and gather clues across rounds divided into Investigation and Mythos phases.",
  "Blood on the Clocktower": "Social deduction and bluffing game with a Storyteller. Good team seeks the Demon while Evil team kills Townsfolk and Outsiders. Dead players still retain ghost votes.",
};

const catalog = new Map(games.flatMap((game) => game.modes.map((mode) => [
  `${game.name}::${mode}`,
  {
    game: game.name,
    mode,
    summary: gameSummaries[game.name] ?? `Standard official rules and mechanics for ${game.name} (${mode} mode).`,
    evidence: `${game.name} Official Rulebook`,
  },
])));

export function getRuleContext(gameName, mode) {
  return catalog.get(`${gameName}::${mode}`) ?? {
    game: gameName,
    mode,
    summary: gameSummaries[gameName] ?? `Standard official rules and mechanics for ${gameName} (${mode} mode).`,
    evidence: `${gameName} Official Rulebook`,
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
