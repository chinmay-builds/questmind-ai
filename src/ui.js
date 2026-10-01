import { games, getPlayerOptions } from "./games.js";
import { askQuestMind } from "./core/api.js";
import { modelAliases } from "./core/config.js";
import { fallbackResponse } from "./core/fallback.js";
import {
  fetchSession,
  getStoredUser,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
} from "./auth.js";
import { saveGameSession, loadUserSessions } from "./history.js";
import {
  boardGameNews,
  getPersonalizedNews,
  getNewsPage,
  TOTAL_AVAILABLE_NEWS,
} from "./news.js";

const gameSelect = document.querySelector("#game-select");
const modeSelect = document.querySelector("#mode-select");
const modelSelect = document.querySelector("#model-select");
const webSearchToggle = document.querySelector("#web-search-toggle");
const modelNote = document.querySelector("#model-note");
const playerOptions = document.querySelector("#player-options");
const contextSummary = document.querySelector("#context-summary");
const composer = document.querySelector("#composer");
const questionInput = document.querySelector("#question-input");
const stream = document.querySelector("#message-stream");
const chatCount = document.querySelector("#chat-count");
const imageInput = document.querySelector("#image-input");
const attachButton = document.querySelector("#attach-button");
const attachmentStrip = document.querySelector("#attachment-strip");
const composerNote = document.querySelector("#composer-note");
const landingView = document.querySelector("#landing-view");
const feedView = document.querySelector("#feed-view");
const chatView = document.querySelector("#chat-view");
const routeLinks = document.querySelectorAll("[data-route]");
const topbarRoute = document.querySelector("#topbar-route");
const topbarFeedBtn = document.querySelector("#topbar-feed-btn");
const syncIndicator = document.querySelector("#sync-indicator");

// News Feed Elements
const newsGrid = document.querySelector("#news-grid");
const feedFilterBar = document.querySelector("#feed-filter-bar");
const feedSubtitle = document.querySelector("#feed-subtitle");
const feedSearchInput = document.querySelector("#feed-search-input");
const feedSearchClear = document.querySelector("#feed-search-clear");
const feedStatsTotal = document.querySelector("#feed-stats-total");
const feedStatsShowing = document.querySelector("#feed-stats-showing");
const feedStatsPage = document.querySelector("#feed-stats-page");
const btnLoadMore = document.querySelector("#btn-load-more");
const btnRandomPage = document.querySelector("#btn-random-page");
const btnTopPage = document.querySelector("#btn-top-page");

// Article Reader Modal Elements
const articleModal = document.querySelector("#article-modal");
const articleModalClose = document.querySelector("#article-modal-close");
const articleModalLogo = document.querySelector("#article-modal-logo");
const articleModalPubName = document.querySelector("#article-modal-publisher-name");
const articleModalDomainDate = document.querySelector("#article-modal-domain-date");
const articleModalImg = document.querySelector("#article-modal-img");
const articleModalTag = document.querySelector("#article-modal-tag");
const articleModalGame = document.querySelector("#article-modal-game");
const articleModalRating = document.querySelector("#article-modal-rating");
const articleModalTitle = document.querySelector("#article-modal-title");
const articleModalSummary = document.querySelector("#article-modal-summary");
const articleModalBody = document.querySelector("#article-modal-body");
const articleModalVisitBtn = document.querySelector("#article-modal-visit-btn");
const articleModalAskBtn = document.querySelector("#article-modal-ask-btn");
let activeArticleItem = null;

// Auth Elements
const authModal = document.querySelector("#auth-modal");
const authButton = document.querySelector("#auth-button");
const heroAuthBtn = document.querySelector("#hero-auth-btn");
const authClose = document.querySelector("#auth-close");
const authAlert = document.querySelector("#auth-alert");
const authTabs = document.querySelectorAll(".auth-tab");
const tabGoogle = document.querySelector("#tab-google");
const tabSignin = document.querySelector("#tab-signin");
const tabSignup = document.querySelector("#tab-signup");
const authProfile = document.querySelector("#auth-profile");
const signinEmail = document.querySelector("#signin-email");
const signinPassword = document.querySelector("#signin-password");
const signupName = document.querySelector("#signup-name");
const signupEmail = document.querySelector("#signup-email");
const signupPassword = document.querySelector("#signup-password");
const btnSigninSubmit = document.querySelector("#btn-signin-submit");
const btnSignupSubmit = document.querySelector("#btn-signup-submit");
const btnGoogleSignin = document.querySelector("#btn-google-signin");
const btnSignout = document.querySelector("#btn-signout");
const btnReturn = document.querySelector("#btn-return");
const profileName = document.querySelector("#profile-name");
const profileEmail = document.querySelector("#profile-email");
const profileAvatar = document.querySelector("#profile-avatar");

// History Elements
const historyList = document.querySelector("#history-list");
const historyToggle = document.querySelector("#history-toggle");

const attachments = [];
let messageCount = 1;
let currentChatHistory = [];
let activeUser = null;
let currentAuthMode = "google";
let currentFeedFilter = "all";
let feedCurrentPage = 1;
const feedPageSize = 18;
let feedSearchQuery = "";
let feedLoadedItems = [];
let useServerProvider = true;
let modelRoster = new Map();

function showRoute() {
  const hash = window.location.hash;
  const isChat = hash === "#chat";
  const isFeed = hash === "#feed";
  const isHome = !isChat && !isFeed;

  landingView.hidden = !isHome;
  feedView.hidden = !isFeed;
  chatView.hidden = !isChat;

  document.body.classList.toggle("is-chat", isChat);
  document.body.classList.toggle("is-feed", isFeed);

  if (isChat) {
    document.title = "QuestMind — Table-side Companion";
    topbarRoute.href = "/";
    topbarRoute.dataset.route = "home";
    topbarRoute.innerHTML = "BACK TO HOME <span>↩</span>";
  } else if (isFeed) {
    document.title = "QuestMind — Tabletop News Feed";
    topbarRoute.href = "#chat";
    topbarRoute.dataset.route = "chat";
    topbarRoute.innerHTML = "ENTER QUESTMIND <span>↗</span>";
    renderNewsFeed();
  } else {
    document.title = "QuestMind — Your Table-side Co-pilot";
    topbarRoute.href = "#chat";
    topbarRoute.dataset.route = "chat";
    topbarRoute.innerHTML = "ENTER QUESTMIND <span>↗</span>";
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

routeLinks.forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  const route = link.dataset.route;
  if (route === "chat") history.pushState(null, "", "#chat");
  else if (route === "feed") history.pushState(null, "", "#feed");
  else if (route === "home") history.pushState(null, "", "/");
  showRoute();
}));
window.addEventListener("hashchange", showRoute);
window.addEventListener("popstate", showRoute);

for (const game of games) {
  gameSelect.add(new Option(game.name, game.name));
}

function renderPlayers(game) {
  const current = Number(playerOptions.querySelector("input:checked")?.value ?? 4);
  playerOptions.replaceChildren();
  const options = getPlayerOptions(game, modeSelect.value);
  const preferred = options.includes(current) ? current : options[0];
  for (const count of options) {
    const label = document.createElement("label");
    label.className = "player-option";
    label.innerHTML = `<input type="radio" name="players" value="${count}" ${count === preferred ? "checked" : ""}><span>${count}</span>`;
    playerOptions.append(label);
  }
}

function selectedPlayers() {
  return playerOptions.querySelector("input:checked")?.value ?? "1";
}

function updateContext() {
  const game = games.find(({ name }) => name === gameSelect.value) ?? games[0];
  modeSelect.replaceChildren(...game.modes.map((mode) => new Option(mode, mode)));
  updatePlayerContext(game);
}

function updatePlayerContext(game = games.find(({ name }) => name === gameSelect.value) ?? games[0]) {
  renderPlayers(game);
  contextSummary.textContent = `${game.name} · ${modeSelect.value} · ${selectedPlayers()} ${selectedPlayers() === "1" ? "player" : "players"}`;
}

function renderModels() {
  modelSelect.replaceChildren();
  for (const model of modelAliases) {
    const status = modelRoster.get(model.alias);
    const configured = status ? status.configured : true;
    const option = new Option(`${model.label}${status && !configured ? " — UNAVAILABLE" : ""}`, model.alias);
    option.disabled = status ? !configured : false;
    modelSelect.add(option);
  }
  const firstAvailable = [...modelSelect.options].find((option) => !option.disabled);
  if (firstAvailable) modelSelect.value = firstAvailable.value;
  modelNote.textContent = modelRoster.size > 0
    ? (firstAvailable ? "Server-configured companions are ready." : "No companion is configured yet. Set model env vars on the server.")
    : "AI Companions active (Rules Sage, Strategy Coach, Tabletop Tactician, Lorekeeper).";
}

async function loadModels() {
  try {
    const response = await fetch("/api/models");
    if (response.ok) {
      const payload = await response.json();
      modelRoster = new Map((payload.models ?? []).map((model) => [model.alias, model]));
      useServerProvider = true;
    } else {
      useServerProvider = false;
    }
  } catch {
    useServerProvider = false;
  }
  renderModels();
}

function renderAttachments() {
  attachmentStrip.replaceChildren();
  for (const [index, attachment] of attachments.entries()) {
    const chip = document.createElement("div");
    chip.className = "attachment-chip";
    chip.innerHTML = `<img src="${attachment.url}" alt=""><span>${attachment.file.name}</span><button type="button" aria-label="Remove ${attachment.file.name}">×</button>`;
    chip.querySelector("button").addEventListener("click", () => {
      URL.revokeObjectURL(attachments[index].url);
      attachments.splice(index, 1);
      renderAttachments();
    });
    attachmentStrip.append(chip);
  }
}

function addMessage(kind, text, imageUrls = [], evidence = "") {
  const message = document.createElement("article");
  message.className = `message message-${kind}`;
  message.innerHTML = `<div class="message-meta"><span class="avatar">${kind === "assistant" ? "Q" : "YOU"}</span><span>${kind === "assistant" ? "QUESTMIND" : "YOU"}</span><time>JUST NOW</time></div><p></p>`;
  message.querySelector("p").textContent = text;
  if (evidence) {
    const source = document.createElement("div");
    source.className = "message-evidence";
    source.textContent = `EVIDENCE / ${evidence}`;
    message.append(source);
  }
  if (imageUrls.length) {
    const images = document.createElement("div");
    images.className = "message-images";
    imageUrls.forEach((url) => {
      const image = document.createElement("img");
      image.src = url;
      image.alt = "Attached board state";
      images.append(image);
    });
    message.append(images);
  }
  stream.append(message);
  message.scrollIntoView({ behavior: "smooth", block: "nearest" });
  messageCount += 1;
  chatCount.textContent = `${String(messageCount).padStart(2, "0")} MESSAGES`;

  currentChatHistory.push({
    kind,
    text,
    evidence,
    time: Date.now(),
  });

  // Automatically persist to Neon database if user is connected
  if (activeUser) {
    saveGameSession({
      game: gameSelect.value,
      mode: modeSelect.value,
      playerCount: Number(selectedPlayers()),
      companionAlias: modelSelect.value,
      history: currentChatHistory,
      notes: `Session for ${gameSelect.value} (${modeSelect.value})`,
    });
  }
}

gameSelect.addEventListener("change", () => {
  updateContext();
  currentChatHistory = [];
});
modeSelect.addEventListener("change", () => updatePlayerContext());
playerOptions.addEventListener("change", () => updatePlayerContext());
attachButton.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", () => {
  for (const file of imageInput.files) {
    if (file.type.startsWith("image/")) attachments.push({ file, url: URL.createObjectURL(file) });
  }
  imageInput.value = "";
  renderAttachments();
});

function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error(`Could not read ${file.name}.`)));
    reader.readAsDataURL(file);
  });
}

async function requestAnswer(request) {
  if (!useServerProvider) return askQuestMind(request, { provider: "mock" });
  const response = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message ?? `QuestMind API failed (${response.status}).`);
    error.code = payload?.error?.code;
    error.fallback = payload?.fallback;
    throw error;
  }
  return payload;
}

composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question) return;
  const imageUrls = attachments.map(({ url }) => url);
  addMessage("user", question, imageUrls);
  const submitButton = composer.querySelector(".send-button");
  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = "THINKING…";
  composerNote.textContent = useServerProvider ? "CONNECTING TO QUESTMIND CORE…" : "LOCAL MOCK / NO AI CONNECTED";

  const request = {
    game: gameSelect.value,
    mode: modeSelect.value,
    playerCount: Number(selectedPlayers()),
    model: modelSelect.value,
    webSearch: webSearchToggle.checked,
    question,
    attachments: await Promise.all(attachments.map(async ({ file }) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: await fileAsDataUrl(file),
    }))),
  };

  try {
    const response = await requestAnswer(request);
    questionInput.value = "";
    attachments.splice(0).forEach(({ url }) => URL.revokeObjectURL(url));
    renderAttachments();
    window.setTimeout(() => addMessage("assistant", response.text, [], response.evidence), 260);
    composerNote.textContent = useServerProvider ? "CONNECTED VIA QUESTMIND CORE." : "LOCAL MOCK / NO AI CONNECTED";
  } catch (error) {
    const fallback = error.fallback ?? fallbackResponse(request, error.message);
    addMessage("assistant", fallback.text, [], fallback.evidence);
    composerNote.textContent = `CONNECTION ERROR / ${error.code ?? "RETRY AVAILABLE"}`;
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "SEND";
  }
});

// ── ARTICLE DISPATCH MODAL ──

function openArticleModal(item) {
  activeArticleItem = item;
  if (articleModalLogo) articleModalLogo.textContent = item.publisherLogo;
  if (articleModalPubName) articleModalPubName.textContent = item.publisher;
  if (articleModalDomainDate) articleModalDomainDate.textContent = `${item.sourceDomain} · ${item.date}`;
  if (articleModalImg) {
    articleModalImg.src = item.imageUrl;
    articleModalImg.alt = item.title;
  }
  if (articleModalTag) articleModalTag.textContent = item.tag;
  if (articleModalGame) articleModalGame.textContent = item.game;
  if (articleModalRating) articleModalRating.textContent = item.rating;
  if (articleModalTitle) articleModalTitle.textContent = item.title;
  if (articleModalSummary) articleModalSummary.textContent = item.summary;
  if (articleModalBody) articleModalBody.innerHTML = item.articleBody || `<p>${item.summary}</p>`;
  if (articleModalVisitBtn) {
    articleModalVisitBtn.href = item.sourceUrl;
    articleModalVisitBtn.innerHTML = `<span>VISIT OFFICIAL ${item.publisher.toUpperCase()} PAGE</span> <span>↗</span>`;
  }
  if (articleModal) articleModal.hidden = false;
}

function closeArticleModal() {
  if (articleModal) articleModal.hidden = true;
}

articleModalClose?.addEventListener("click", closeArticleModal);
articleModal?.addEventListener("click", (e) => {
  if (e.target === articleModal) closeArticleModal();
});

articleModalAskBtn?.addEventListener("click", () => {
  if (activeArticleItem) {
    const exists = Array.from(gameSelect.options).some((opt) => opt.value.toLowerCase() === activeArticleItem.game.toLowerCase());
    if (!exists) {
      gameSelect.add(new Option(activeArticleItem.game, activeArticleItem.game));
    }
    gameSelect.value = activeArticleItem.game;
    updateContext();
    closeArticleModal();
    history.pushState(null, "", "#chat");
    showRoute();
    questionInput.focus();
  }
});

// ── NEWS FEED RENDERING ──

function createNewsCardElement(item) {
  const card = document.createElement("article");
  card.className = "news-card";
  card.innerHTML = `
    <div class="news-card-publisher">
      <div class="publisher-info">
        <span class="publisher-logo">${item.publisherLogo}</span>
        <span class="publisher-name">${item.publisher}</span>
      </div>
      <span class="publisher-domain">${item.sourceDomain}</span>
    </div>
    <div class="news-card-media" role="button" tabindex="0" title="Read story: ${item.title}">
      <img src="${item.imageUrl}" alt="${item.title}" loading="lazy" />
      <span class="news-tag-pill">${item.tag}</span>
    </div>
    <div class="news-card-body">
      <h3 class="news-card-title" role="button" tabindex="0" title="Read full story">${item.title}</h3>
      <p class="news-card-summary">${item.summary}</p>
      <div class="news-card-footer">
        <div class="news-meta-left">
          <span class="news-game-tag">${item.game}</span>
          <span class="news-date">${item.date}</span>
          <span class="news-rating-tag">${item.rating}</span>
        </div>
        <div class="news-card-buttons">
          <button type="button" class="btn-read-story" title="Read story dispatch">STORY</button>
          <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer" class="btn-read-source" title="Open exact page on ${item.sourceDomain}">
            VISIT ${item.sourceDomain.toUpperCase()} <span>↗</span>
          </a>
        </div>
      </div>
    </div>
  `;

  card.querySelector(".news-card-title")?.addEventListener("click", () => openArticleModal(item));
  card.querySelector(".news-card-media")?.addEventListener("click", () => openArticleModal(item));
  card.querySelector(".btn-read-story")?.addEventListener("click", () => openArticleModal(item));

  return card;
}

function renderNewsFeed(append = false) {
  if (!append) {
    feedLoadedItems = [];
    newsGrid.replaceChildren();
  }

  const pageResult = getNewsPage({
    page: feedCurrentPage,
    pageSize: feedPageSize,
    filter: currentFeedFilter,
    searchQuery: feedSearchQuery,
    chatHistory: currentChatHistory,
    activeGame: gameSelect.value,
  });

  feedLoadedItems = append ? [...feedLoadedItems, ...pageResult.items] : pageResult.items;

  if (currentChatHistory.length > 0) {
    feedSubtitle.textContent = `Personalized for your active session of ${gameSelect.value} and recent companion questions.`;
  } else {
    feedSubtitle.textContent = `Kid-friendly, exciting board game announcements, expansions, and publisher highlights across 10,000,000+ procedural cards.`;
  }

  if (pageResult.items.length === 0 && !append) {
    newsGrid.innerHTML = `<div class="history-empty" style="grid-column: 1 / -1; text-align: center; padding: 40px; font-size: 15px;">No news cards found matching "${feedSearchQuery || currentFeedFilter}". Try another search or filter!</div>`;
  } else {
    pageResult.items.forEach((item) => {
      newsGrid.append(createNewsCardElement(item));
    });
  }

  // Update Stats & Controls
  if (feedStatsShowing) {
    feedStatsShowing.textContent = `Showing ${feedLoadedItems.length} of ${pageResult.totalCount.toLocaleString()} cards`;
  }
  if (feedStatsPage) {
    feedStatsPage.textContent = `Page ${pageResult.page.toLocaleString()} of ${pageResult.totalPages.toLocaleString()}`;
  }
  if (btnLoadMore) {
    btnLoadMore.hidden = !pageResult.hasMore;
    btnLoadMore.querySelector("span").textContent = `LOAD MORE NEWS (PAGE ${(pageResult.page + 1).toLocaleString()})`;
  }
}

// Search input handling with debounce
let searchDebounceTimer = null;
feedSearchInput?.addEventListener("input", (e) => {
  feedSearchQuery = e.target.value.trim();
  if (feedSearchClear) feedSearchClear.hidden = !feedSearchQuery;
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    feedCurrentPage = 1;
    renderNewsFeed(false);
  }, 180);
});

feedSearchClear?.addEventListener("click", () => {
  if (feedSearchInput) feedSearchInput.value = "";
  feedSearchQuery = "";
  feedSearchClear.hidden = true;
  feedCurrentPage = 1;
  renderNewsFeed(false);
});

feedFilterBar?.querySelectorAll(".feed-filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    feedFilterBar.querySelectorAll(".feed-filter").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    currentFeedFilter = btn.dataset.filter;
    feedCurrentPage = 1;
    renderNewsFeed(false);
  });
});

btnLoadMore?.addEventListener("click", () => {
  feedCurrentPage += 1;
  renderNewsFeed(true);
});

btnRandomPage?.addEventListener("click", () => {
  // Jump to a random page between 2 and 500,000 to demonstrate millions of cards
  feedCurrentPage = Math.floor(Math.random() * 500000) + 2;
  renderNewsFeed(false);
  newsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
});

btnTopPage?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ── AUTH & MODAL LOGIC ──

function setAuthAlert(msg) {
  if (msg) {
    authAlert.textContent = `⚠️ ${msg}`;
    authAlert.hidden = false;
  } else {
    authAlert.hidden = true;
    authAlert.textContent = "";
  }
}

function updateAuthState(user) {
  activeUser = user;
  if (user) {
    authButton.innerHTML = `<span>⚡ ${user.name || user.email.split("@")[0]}</span>`;
    authButton.classList.add("is-logged-in");
    syncIndicator.textContent = "NEON POSTGRESQL SYNC ACTIVE";
    syncIndicator.style.color = "var(--green)";
    loadHistory();
  } else {
    authButton.innerHTML = `<span>⚡ SIGN IN</span>`;
    authButton.classList.remove("is-logged-in");
    syncIndicator.textContent = "TABLE-SIDE AI / 4 COMPANIONS ACTIVE";
    syncIndicator.style.color = "";
    historyList.innerHTML = `<div class="history-empty">Sign in to sync past game sessions.</div>`;
  }
}

function renderAuthModal() {
  setAuthAlert("");
  if (activeUser) {
    tabGoogle.hidden = true;
    tabSignin.hidden = true;
    tabSignup.hidden = true;
    document.querySelector("#auth-tabs").hidden = true;
    authProfile.hidden = false;
    profileName.textContent = activeUser.name || "Player";
    profileEmail.textContent = activeUser.email;
    profileAvatar.textContent = (activeUser.name || activeUser.email || "P")[0].toUpperCase();
  } else {
    authProfile.hidden = true;
    document.querySelector("#auth-tabs").hidden = false;
    authTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.authMode === currentAuthMode));

    tabGoogle.hidden = currentAuthMode !== "google";
    tabSignin.hidden = currentAuthMode !== "signIn";
    tabSignup.hidden = currentAuthMode !== "signUp";
  }
}

function openAuthModal(mode = "google") {
  currentAuthMode = mode;
  renderAuthModal();
  authModal.hidden = false;
}

function closeAuthModal() {
  authModal.hidden = true;
}

authButton?.addEventListener("click", () => openAuthModal("google"));
heroAuthBtn?.addEventListener("click", () => openAuthModal("google"));
authClose?.addEventListener("click", closeAuthModal);
btnReturn?.addEventListener("click", closeAuthModal);
authModal?.addEventListener("click", (e) => {
  if (e.target === authModal) closeAuthModal();
});

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentAuthMode = tab.dataset.authMode;
    renderAuthModal();
  });
});

btnGoogleSignin?.addEventListener("click", async () => {
  btnGoogleSignin.disabled = true;
  setAuthAlert("");
  const res = await signInWithGoogle();
  if (!res.success) {
    setAuthAlert(res.error);
    btnGoogleSignin.disabled = false;
  }
});

// EMAIL SIGN IN FORM
tabSignin?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setAuthAlert("");
  btnSigninSubmit.disabled = true;
  btnSigninSubmit.textContent = "VERIFYING…";

  const email = signinEmail.value.trim();
  const password = signinPassword.value;

  const res = await signInWithEmail(email, password);
  if (res.success && res.user) {
    updateAuthState(res.user);
    closeAuthModal();
  } else {
    setAuthAlert(res.error || "No account found with this email. Please create an account first.");
  }
  btnSigninSubmit.disabled = false;
  btnSigninSubmit.textContent = "⚡ SIGN IN TO QUESTMIND";
});

// EMAIL SIGN UP FORM
tabSignup?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setAuthAlert("");
  btnSignupSubmit.disabled = true;
  btnSignupSubmit.textContent = "CREATING…";

  const name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value;

  const res = await signUpWithEmail(name, email, password);
  if (res.success && res.user) {
    updateAuthState(res.user);
    closeAuthModal();
  } else {
    setAuthAlert(res.error || "An account with this email already exists. Please sign in instead.");
  }
  btnSignupSubmit.disabled = false;
  btnSignupSubmit.textContent = "⚡ CREATE CAPTAIN ACCOUNT";
});

btnSignout?.addEventListener("click", async () => {
  await signOut();
  updateAuthState(null);
  closeAuthModal();
});

// ── HISTORY LOADING ──

async function loadHistory() {
  if (!activeUser) return;
  historyList.innerHTML = `<div class="history-empty">Loading Neon sessions…</div>`;
  const sessions = await loadUserSessions(activeUser.id || activeUser.email);
  if (!sessions || sessions.length === 0) {
    historyList.innerHTML = `<div class="history-empty">No past sessions saved yet.</div>`;
    return;
  }
  historyList.replaceChildren();
  sessions.forEach((s) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "history-item";
    const dateStr = s.updated_at ? new Date(s.updated_at).toLocaleDateString() : "Recent";
    const msgCount = Array.isArray(s.history) ? s.history.length : 0;
    item.innerHTML = `
      <div class="history-item-game">${s.game} (${s.mode || "Standard"})</div>
      <div class="history-item-meta">${s.companion_alias || "Rules Sage"} · ${msgCount} msgs · ${dateStr}</div>
    `;
    item.addEventListener("click", () => {
      gameSelect.value = s.game;
      updateContext();
      if (s.mode) modeSelect.value = s.mode;
      updatePlayerContext();
      if (s.companion_alias) modelSelect.value = s.companion_alias;

      // Restore messages
      if (Array.isArray(s.history) && s.history.length > 0) {
        stream.replaceChildren();
        currentChatHistory = [];
        messageCount = 0;
        s.history.forEach((m) => {
          addMessage(m.kind, m.text, [], m.evidence);
        });
      }
    });
    historyList.append(item);
  });
}

historyToggle?.addEventListener("click", () => {
  if (!activeUser) {
    openAuthModal("google");
  } else {
    document.querySelector("#history-panel")?.scrollIntoView({ behavior: "smooth" });
  }
});

// ── INITIALIZE ──

updateContext();
renderModels();
loadModels();
showRoute();

// Check existing session
fetchSession().then((user) => {
  if (user) updateAuthState(user);
});
