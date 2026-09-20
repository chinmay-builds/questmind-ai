import { games, getPlayerOptions } from "./games.js";
import { askQuestMind } from "./core/api.js";
import { modelAliases } from "./core/config.js";
import { fallbackResponse } from "./core/fallback.js";

const gameSelect = document.querySelector("#game-select");
const modeSelect = document.querySelector("#mode-select");
const modelSelect = document.querySelector("#model-select");
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
const chatView = document.querySelector("#chat-view");
const routeLinks = document.querySelectorAll("[data-route]");
const topbarRoute = document.querySelector("#topbar-route");
const attachments = [];
let messageCount = 1;
const useServerProvider = !["localhost", "127.0.0.1"].includes(window.location.hostname);
let modelRoster = new Map();

function showRoute() {
  const isChat = window.location.hash === "#chat";
  landingView.hidden = isChat;
  chatView.hidden = !isChat;
  document.body.classList.toggle("is-chat", isChat);
  document.title = isChat ? "QuestMind — Table-side companion" : "QuestMind — Your table-side co-pilot";
  topbarRoute.href = isChat ? "/" : "#chat";
  topbarRoute.dataset.route = isChat ? "home" : "chat";
  topbarRoute.innerHTML = isChat ? "BACK TO HOME <span>↩</span>" : "ENTER QUESTMIND <span>↗</span>";
  window.scrollTo({ top: 0, behavior: "instant" });
}

routeLinks.forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  if (link.dataset.route === "chat") history.pushState(null, "", "#chat");
  if (link.dataset.route === "home") history.pushState(null, "", "/");
  showRoute();
}));
window.addEventListener("hashchange", showRoute);
window.addEventListener("popstate", showRoute);

for (const game of games) {
  gameSelect.add(new Option(game.name, game.name));
}

function renderPlayers(game) {
  playerOptions.replaceChildren();
  for (const count of getPlayerOptions(game, modeSelect.value)) {
  const label = document.createElement("label");
  label.className = "player-option";
  label.innerHTML = `<input type="radio" name="players" value="${count}" ${count === 4 ? "checked" : ""}><span>${count}</span>`;
    playerOptions.append(label);
  }
}

function selectedPlayers() {
  return playerOptions.querySelector("input:checked")?.value ?? "4";
}

function updateContext() {
  const game = games.find(({ name }) => name === gameSelect.value) ?? games[0];
  modeSelect.replaceChildren(...game.modes.map((mode) => new Option(mode, mode)));
  updatePlayerContext(game);
}

function updatePlayerContext(game = games.find(({ name }) => name === gameSelect.value) ?? games[0]) {
  const current = Number(selectedPlayers());
  renderPlayers(game);
  const options = getPlayerOptions(game, modeSelect.value);
  const preferred = options.includes(current) ? current : options[0];
  const selected = playerOptions.querySelector(`input[value="${preferred}"]`);
  if (selected) selected.checked = true;
  contextSummary.textContent = `${game.name} · ${modeSelect.value} · ${selectedPlayers()} ${selectedPlayers() === "1" ? "player" : "players"}`;
}

function renderModels() {
  modelSelect.replaceChildren();
  for (const model of modelAliases) {
    const status = modelRoster.get(model.alias);
    const configured = status?.configured ?? (!useServerProvider && model.alias === "rules-sage");
    const option = new Option(`${model.label}${configured ? "" : " — UNAVAILABLE"}`, model.alias);
    option.disabled = !configured;
    modelSelect.add(option);
  }
  const firstAvailable = [...modelSelect.options].find((option) => !option.disabled);
  if (firstAvailable) modelSelect.value = firstAvailable.value;
  modelNote.textContent = useServerProvider
    ? (firstAvailable ? "Server-configured companions are ready." : "No companion is configured yet. Ask an administrator to add model env vars.")
    : "LOCAL MOCK / model aliases are preview-only until a server provider is configured.";
}

async function loadModels() {
  if (!useServerProvider) {
    renderModels();
    return;
  }
  try {
    const response = await fetch("/api/models");
    const payload = await response.json();
    modelRoster = new Map((payload.models ?? []).map((model) => [model.alias, model]));
  } catch {
    modelNote.textContent = "MODEL ROSTER UNAVAILABLE / retrying with server defaults.";
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
}

gameSelect.addEventListener("change", updateContext);
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
      question,
      model: modelSelect.value,
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

updateContext();
renderModels();
loadModels();
showRoute();
