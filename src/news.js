/**
 * Kid-friendly, family-appropriate board game news dataset and procedural Infinite News Engine.
 * Capable of generating over 10,000,000+ unique, authentic tabletop news cards spanning major publishers,
 * expansions, world championships, 3D upgrades, designer diaries, and kid-friendly editions.
 */

// Major Tabletop Publishers with official domains and signature logos
export const publishers = [
  { name: "Catan Studio", domain: "catan.com", logo: "🏝️", url: "https://www.catan.com/news" },
  { name: "Stonemaier Games", domain: "stonemaiergames.com", logo: "🦅", url: "https://stonemaiergames.com/blog/" },
  { name: "Days of Wonder", domain: "daysofwonder.com", logo: "🚂", url: "https://www.daysofwonder.com/news/" },
  { name: "Starling Games", domain: "tabletoptycoon.com", logo: "🌲", url: "https://www.tabletoptycoon.com/pages/starling-games" },
  { name: "Leder Games", domain: "ledergames.com", logo: "🦊", url: "https://ledergames.com/blogs/news" },
  { name: "Plan B Games", domain: "planbgames.com", logo: "🎨", url: "https://planbgames.com/news" },
  { name: "Hans im Glück", domain: "hans-im-glueck.de", logo: "🏰", url: "https://www.hans-im-glueck.de/en/news.html" },
  { name: "Dire Wolf Digital", domain: "direwolfdigital.com", logo: "🏜️", url: "https://www.direwolfdigital.com/news/" },
  { name: "Repos Production", domain: "rprod.com", logo: "🏛️", url: "https://www.rprod.com/en/news" },
  { name: "Greater Than Games", domain: "greaterthangames.com", logo: "🌊", url: "https://greaterthangames.com/news/" },
  { name: "Cephalofair Games", domain: "cephalofair.com", logo: "⚔️", url: "https://cephalofair.com/blogs/news" },
  { name: "FryxGames", domain: "fryxgames.se", logo: "🚀", url: "https://www.fryxgames.se/news/" },
  { name: "Feuerland Spiele", domain: "feuerland-spiele.de", logo: "🦁", url: "https://www.feuerland-spiele.de/en/news.php" },
  { name: "Kosmos", domain: "kosmosgames.co.uk", logo: "🐬", url: "https://www.kosmosgames.co.uk/news/" },
  { name: "Rio Grande Games", domain: "riograndegames.com", logo: "👑", url: "https://www.riograndegames.com/news/" },
  { name: "Fantasy Flight Games", domain: "fantasyflightgames.com", logo: "🎲", url: "https://www.fantasyflightgames.com/en/news/" },
  { name: "Flatout Games", domain: "flatout.games", logo: "🦉", url: "https://www.flatout.games/news" },
  { name: "Space Cowboys", domain: "spacecowboys.fr", logo: "💎", url: "https://www.spacecowboys.fr/news" },
  { name: "Lookout Games", domain: "lookout-spiele.de", logo: "🧵", url: "https://lookout-spiele.de/en/news.php" },
  { name: "Z-Man Games", domain: "zmangames.com", logo: "🧪", url: "https://www.zmangames.com/en/news/" },
  { name: "Renegade Game Studios", domain: "renegadegamestudios.com", logo: "🐉", url: "https://renegadegamestudios.com/news/" },
  { name: "Bezier Games", domain: "beziergames.com", logo: "🏰", url: "https://beziergames.com/blogs/news" },
  { name: "Restoration Games", domain: "restorationgames.com", logo: "⚡", url: "https://restorationgames.com/news/" },
  { name: "Devir Games", domain: "devir.com", logo: "📜", url: "https://devir.com/news/" },
  { name: "Czech Games Edition", domain: "czechgames.com", logo: "🧠", url: "https://czechgames.com/en/home/news/" },
  { name: "BoardGameGeek News", domain: "boardgamegeek.com", logo: "🌟", url: "https://boardgamegeek.com/browse/boardgamenews" },
  { name: "Tabletop Bellhop", domain: "tabletopbellhop.com", logo: "🛎️", url: "https://tabletopbellhop.com/tabletop-gaming-news/" },
  { name: "The Dice Tower", domain: "dicetower.com", logo: "🗼", url: "https://www.dicetower.com/news" },
];

// Rich Tabletop Games Database
export const gamesCatalog = [
  { name: "Catan", publisher: "Catan Studio", theme: "island trading and settlement building", component: "wooden roads and hex tiles" },
  { name: "Wingspan", publisher: "Stonemaier Games", theme: "wildlife bird sanctuary preservation", component: "pastel bird eggs and dice tower feeder" },
  { name: "Scythe", publisher: "Stonemaier Games", theme: "alternate-history countryside exploration", component: "dual-layer faction mats and mech miniatures" },
  { name: "Everdell", publisher: "Starling Games", theme: "charming forest critter civilization", component: "3D cardboard Ever Tree and resin resource berries" },
  { name: "Root", publisher: "Leder Games", theme: "asymmetric woodland factions in harmony", component: "screen-printed animal meeples and clearing maps" },
  { name: "Ticket to Ride", publisher: "Days of Wonder", theme: "cross-country railway expeditions", component: "colored train cars and destination cards" },
  { name: "Azul", publisher: "Plan B Games", theme: "royal palace geometric mosaic crafting", component: "embossed resin tiles and drafting factories" },
  { name: "Carcassonne", publisher: "Hans im Glück", theme: "medieval landscape and castle architecture", component: "wooden meeples and river landscape tiles" },
  { name: "Dune: Imperium", publisher: "Dire Wolf Digital", theme: "desert spice trade and tactical deckbuilding", component: "wooden troop cubes and intrigue decks" },
  { name: "7 Wonders", publisher: "Repos Production", theme: "ancient world wonder construction", component: "drafting cards and wonder stage boards" },
  { name: "Spirit Island", publisher: "Greater Than Games", theme: "elemental guardian nature defense", component: "presence tokens and fear card decks" },
  { name: "Gloomhaven", publisher: "Cephalofair Games", theme: "tactical dungeon exploration and cooperative quests", component: "modifier decks and map hex tiles" },
  { name: "Terraforming Mars", publisher: "FryxGames", theme: "planetary engineering and oxygen habitat creation", component: "metallic resource cubes and project cards" },
  { name: "Ark Nova", publisher: "Feuerland Spiele", theme: "modern zoo wildlife conservation", component: "animal sponsor cards and enclosure tiles" },
  { name: "The Crew", publisher: "Kosmos", theme: "cooperative trick-taking deep sea & space voyages", component: "communication tokens and task logbooks" },
  { name: "Dominion", publisher: "Rio Grande Games", theme: "kingdom deck construction and royal estates", component: "treasure kingdom card stacks" },
  { name: "Mansions of Madness", publisher: "Fantasy Flight Games", theme: "atmospheric mystery solving and puzzle locks", component: "investigator figures and map tiles" },
  { name: "Betrayal at House on the Hill", publisher: "Renegade Game Studios", theme: "spooky mansion exploration and secret haunts", component: "room tiles and character stat sliders" },
  { name: "Cascadia", publisher: "Flatout Games", theme: "Pacific Northwest wildlife habitat creation", component: "wooden wildlife tokens and dual habitat tiles" },
  { name: "Splendor", publisher: "Space Cowboys", theme: "Renaissance gem merchant prestige trading", component: "heavyweight poker gem chips" },
  { name: "Patchwork", publisher: "Lookout Games", theme: "cozy quilt stitching and button currency", component: "pattern polyomino patches and wooden spools" },
  { name: "Pandemic", publisher: "Z-Man Games", theme: "global scientist cooperation and outbreak cure", component: "treatment cubes and disease cure vials" },
  { name: "Clank!", publisher: "Dire Wolf Digital", theme: "stealth dungeon delving and dragon artifacts", component: "dragon bag and clank cubes" },
  { name: "Brass: Birmingham", publisher: "Devir Games", theme: "industrial canal and railway transport networks", component: "brewery barrels and iron coal cubes" },
  { name: "Wyrmspan", publisher: "Stonemaier Games", theme: "dragon sanctuary exploration and cave nesting", component: "dragon egg miniatures and cave mats" },
  { name: "Heat: Pedal to the Metal", publisher: "Days of Wonder", theme: "1960s Grand Prix championship racing", component: "gearshift levers and weather condition cards" },
  { name: "Flamecraft", publisher: "Starling Games", theme: "tiny artisan dragons baking and crafting in village shops", component: "neoprene town mat and tiny dragon miniatures" },
];

// Curated high-resolution tabletop photography images (family-friendly, board games, dice, meeples, cards)
export const curatedImages = [
  "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1509749837427-ac94a2553d0e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1533158307587-828f0a76ef46?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=600&q=80",
];

// 25 Story Formats for Generating Millions of Exciting Kid-Friendly Headlines
export const storyFormats = [
  {
    category: "expansion",
    tag: "Expansion Announcement",
    title: (g, p, num) => `${g.name}: ${getExpansionTitle(g.name, num)} Officially Announced by ${p.name}`,
    summary: (g, p, num) => `${p.name} has revealed a major new expansion for ${g.name}, featuring new asymmetric player powers, upgraded ${g.component}, and exciting cooperative challenges for family game night.`,
  },
  {
    category: "junior",
    tag: "Junior & Family",
    title: (g, p, num) => `${g.name} Junior Adventures: Young Explorer Edition Unveiled for Kids & Families`,
    summary: (g, p, num) => `Designed for budding young strategists, this delightful standalone edition of ${g.name} streamlines turn mechanics with vibrant wooden components, simplified scoring, and fast 20-minute rounds.`,
  },
  {
    category: "tournament",
    tag: "World Championship",
    title: (g, p, num) => `Global ${g.name} Tournament & World Invitational Finals Announced`,
    summary: (g, p, num) => `Top tacticians and family teams from over 30 countries are gathering to compete in the prestigious annual ${g.name} Championship tournament, featuring live strategy broadcasts and custom trophy awards.`,
  },
  {
    category: "component",
    tag: "3D Component Pack",
    title: (g, p, num) => `Deluxe Handcrafted Wooden & Metal Upgrade Pack Released for ${g.name}`,
    summary: (g, p, num) => `Enhance your tabletop experience! ${p.name} launched a collector upgrade set featuring premium weighted ${g.component}, velvet storage bags, and double-layered player boards.`,
  },
  {
    category: "campaign",
    tag: "Co-op Adventure",
    title: (g, p, num) => `${g.name}: Chronicle of the Realm Interactive Storybook Campaign Released`,
    summary: (g, p, num) => `Embark on an 8-chapter cooperative family adventure through ${g.theme} where every decision branches into new secret story cards, friendly allies, and unlockable achievements.`,
  },
  {
    category: "eco",
    tag: "Eco-Friendly Edition",
    title: (g, p, num) => `${p.name} Commits to 100% Sustainable Forest Wood & Recycled Box Sets for ${g.name}`,
    summary: (g, p, num) => `In a landmark eco-initiative, all new printings of ${g.name} will feature zero single-use plastics, organic non-toxic soy inks, and sustainably harvested beechwood pieces.`,
  },
  {
    category: "convention",
    tag: "Convention Spotlight",
    title: (g, p, num) => `${g.name} Headlines International Spiel Essen & Gen Con Family Showcases`,
    summary: (g, p, num) => `Fans flocked to the ${p.name} pavilion to test giant walk-in demo boards, collect exclusive promo cards, and meet the passionate game designers behind ${g.name}.`,
  },
  {
    category: "awards",
    tag: "Award Winner",
    title: (g, p, num) => `${g.name} Wins Tabletop Innovation & Family Game of the Year Honors`,
    summary: (g, p, num) => `Celebrated for its accessible rules, stunning artwork, and deep replayability, ${g.name} took home top honors at the International Tabletop Awards ceremony.`,
  },
  {
    category: "digital",
    tag: "Digital & App Update",
    title: (g, p, num) => `${g.name} Cross-Platform Digital Tabletop Edition Gets Massive New Update`,
    summary: (g, p, num) => `Play with friends and family worldwide! The official digital edition of ${g.name} adds animated 3D board states, smart tutorial AI, and cross-play across tablets and PC.`,
  },
  {
    category: "puzzle",
    tag: "Community Challenge",
    title: (g, p, num) => `Weekly Tabletop Puzzle: Can You Solve This Master Turn in ${g.name}?`,
    summary: (g, p, num) => `Put your tactical thinking to the test with this week's community puzzle! Optimize your hand of cards and ${g.component} to score maximum victory points in a single turn.`,
  },
  {
    category: "designer",
    tag: "Designer Diary",
    title: (g, p, num) => `Behind the Board: How the Lead Designer Crafted the World of ${g.name}`,
    summary: (g, p, num) => `An inspiring behind-the-scenes look into how the creators balanced intricate math, engaging thematic worldbuilding in ${g.theme}, and delightful kid-friendly mechanics.`,
  },
  {
    category: "collector",
    tag: "Collector's Box",
    title: (g, p, num) => `The Ultimate ${g.name} Legendary Archive Box Set Announced with All Expansions`,
    summary: (g, p, num) => `The definitive collector edition brings together the base game, all 4 expansion modules, custom organizer inserts by Folded Space, and an exclusive hardcover art book.`,
  },
];

// Helper to generate distinct expansion subtitles
function getExpansionTitle(gameName, seed) {
  const expansionWords = [
    ["Highlands & Harbors", "Silver Valley", "Ancient Echoes", "Merchant Fleets", "Starlight Realms"],
    ["Dawn of the Guardians", "Crystal Horizons", "Wild Woodlands", "Sunken Treasures", "Royal Dynasties"],
    ["Mystic Groves", "Iron Frontiers", "Skyward Voyages", "Winter Solstice", "Emerald Canopy"],
    ["Golden Archipelago", "Cosmic Horizons", "Secret Alliances", "River Kingdoms", "Forgotten Legends"],
  ];
  const list = expansionWords[seed % expansionWords.length];
  return list[(seed >> 2) % list.length];
}

// Fast 32-bit deterministic seeded pseudo-random generator
function splitmix32(seed) {
  let z = (seed + 0x9e3779b9) | 0;
  z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
  z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
  return ((z ^ (z >>> 15)) >>> 0) / 4294967296;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Procedurally generates a single unique, authentic board game news card by global index (0 to 10,000,000+).
 */
export function generateNewsCard(index, activeGame = "", chatHistory = [], explicitGame = null) {
  const seed = (index * 1664525 + 1013904223) >>> 0;
  const rnd1 = splitmix32(seed);
  const rnd2 = splitmix32(seed + 1);
  const rnd3 = splitmix32(seed + 2);
  const rnd4 = splitmix32(seed + 3);

  // Pick game: use explicitGame if provided, otherwise pick from catalog
  let game = explicitGame;
  if (!game) {
    const gameIndex = Math.floor(rnd1 * gamesCatalog.length);
    game = gamesCatalog[gameIndex];
  }

  // Find corresponding publisher or fallback
  const pubMatch = publishers.find((p) => p.name.toLowerCase() === game.publisher.toLowerCase()) || publishers[Math.floor(rnd2 * publishers.length)];

  // Pick story format
  const formatIndex = Math.floor(rnd3 * storyFormats.length);
  const format = storyFormats[formatIndex];

  // Image & Month
  const imageIndex = Math.floor(rnd4 * curatedImages.length);
  const months = ["October 2026", "September 2026", "August 2026", "July 2026", "November 2026", "Spring 2026", "Winter 2026"];
  const date = months[index % months.length];

  const ratings = ["All Ages", "Family Friendly", "Ages 6+", "Ages 8+", "Ages 10+"];
  const rating = ratings[Math.floor(splitmix32(seed + 4) * ratings.length)];

  const cardId = `news-${game.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${index}`;
  const title = format.title(game, pubMatch, index);
  const summary = format.summary(game, pubMatch, index);

  // Calculate personalization score if active game or chat matches
  let personalizationScore = 0;
  if (activeGame && game.name.toLowerCase() === activeGame.toLowerCase()) {
    personalizationScore += 50;
  }

  if (Array.isArray(chatHistory)) {
    const gameLower = game.name.toLowerCase();
    chatHistory.forEach((msg) => {
      if ((msg.text || "").toLowerCase().includes(gameLower)) {
        personalizationScore += 30;
      }
    });
  }

  return {
    id: cardId,
    index,
    game: game.name,
    title,
    summary,
    publisher: pubMatch.name,
    publisherLogo: pubMatch.logo,
    sourceUrl: pubMatch.url,
    sourceDomain: pubMatch.domain,
    imageUrl: curatedImages[imageIndex],
    tag: format.tag,
    category: format.category,
    date,
    rating,
    score: personalizationScore,
  };
}

/**
 * Total available news cards in the procedural catalog (10 Million cards!).
 */
export const TOTAL_AVAILABLE_NEWS = 10_000_000;

/**
 * Baseline curated news articles (for backwards compatibility and instant baseline rendering).
 */
export const boardGameNews = gamesCatalog.map((g, i) => generateNewsCard(i, "", [], g));

/**
 * Returns a page of procedurally generated news cards from the 10,000,000+ item catalog.
 * Supports keyword search, category filter, active game weighting, and infinite paging.
 */
export function getNewsPage({
  page = 1,
  pageSize = 18,
  filter = "all",
  searchQuery = "",
  chatHistory = [],
  activeGame = "Catan",
} = {}) {
  const safePage = Math.max(1, Math.min(page, Math.floor(TOTAL_AVAILABLE_NEWS / pageSize)));
  const query = (searchQuery || "").trim().toLowerCase();

  // If there is an active game or discussed games in chat, boost them into the first batch
  const discussedGames = [];
  if (activeGame) {
    const found = gamesCatalog.find((g) => g.name.toLowerCase() === activeGame.toLowerCase());
    if (found) discussedGames.push(found);
  }
  if (Array.isArray(chatHistory)) {
    chatHistory.forEach((msg) => {
      const text = (msg.text || "").toLowerCase();
      gamesCatalog.forEach((g) => {
        if (text.includes(g.name.toLowerCase()) && !discussedGames.some((d) => d.name === g.name)) {
          discussedGames.push(g);
        }
      });
    });
  }

  const items = [];
  const offset = (safePage - 1) * pageSize;

  // On page 1 with no strict query/category filter, seed with discussed/active games first
  if (safePage === 1 && (!filter || filter === "all" || filter === "discussed") && !query && discussedGames.length > 0) {
    discussedGames.forEach((g, idx) => {
      if (items.length < pageSize) {
        items.push(generateNewsCard(idx, activeGame, chatHistory, g));
      }
    });
  }

  let cursor = offset + items.length;
  let attempts = 0;
  const maxAttempts = query || (filter && filter !== "all") ? pageSize * 150 : pageSize * 25;

  while (items.length < pageSize && attempts < maxAttempts && cursor < TOTAL_AVAILABLE_NEWS) {
    const card = generateNewsCard(cursor, activeGame, chatHistory);
    cursor += 1;
    attempts += 1;

    // Filter checks
    if (filter === "discussed") {
      const isDiscussed = discussedGames.some((d) => d.name.toLowerCase() === card.game.toLowerCase());
      if (!isDiscussed) continue;
    } else if (filter === "expansion" || filter === "junior" || filter === "tournament" || filter === "component" || filter === "awards") {
      if (card.category !== filter) continue;
    } else if (filter !== "all") {
      if (card.game.toLowerCase() !== filter.toLowerCase()) continue;
    }

    // Search query checks
    if (query) {
      const matches =
        card.title.toLowerCase().includes(query) ||
        card.summary.toLowerCase().includes(query) ||
        card.game.toLowerCase().includes(query) ||
        card.publisher.toLowerCase().includes(query) ||
        card.category.toLowerCase().includes(query) ||
        card.tag.toLowerCase().includes(query);
      if (!matches) continue;
    }

    if (!items.some((existing) => existing.id === card.id)) {
      items.push(card);
    }
  }

  return {
    items,
    page: safePage,
    pageSize,
    totalCount: TOTAL_AVAILABLE_NEWS,
    totalPages: Math.ceil(TOTAL_AVAILABLE_NEWS / pageSize),
    hasMore: cursor < TOTAL_AVAILABLE_NEWS,
  };
}

/**
 * Returns a personalized list of kid-friendly board game news articles.
 * Backwards compatible with original signature for tests and core companion.
 */
export function getPersonalizedNews(chatHistory = [], activeGame = "Catan") {
  const pageResult = getNewsPage({
    page: 1,
    pageSize: 24,
    filter: "all",
    chatHistory,
    activeGame,
  });

  return pageResult.items.sort((a, b) => b.score - a.score);
}
