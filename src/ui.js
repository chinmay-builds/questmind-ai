import { games } from "./games.js";
import { askQuestMind } from "./core/api.js";

const gameSelect = document.querySelector("#game-select");
const modeSelect = document.querySelector("#mode-select");
const modelSelect = document.querySelector("#model-select");
const webSearchToggle = document.querySelector("#web-search-toggle");
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

async function loadModelConfig() {
  const models = useServerProvider ? await fetch("/api/config").then((response) => response.ok ? response.json() : null).catch(() => null) : null;
  const options = models?.models?.length ? models.models : ["openrouter/free"];
  modelSelect.replaceChildren(...options.map((model) => new Option(model, model)));
}

const useServerProvider = !["localhost", "127.0.0.1"].includes(window.location.hostname);

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

for (const count of [1, 2, 3, 4, 5, 6]) {
  const label = document.createElement("label");
  label.className = "player-option";
  label.innerHTML = `<input type="radio" name="players" value="${count}" ${count === 4 ? "checked" : ""}><span>${count}</span>`;
  playerOptions.append(label);
}

function selectedPlayers() {
  return playerOptions.querySelector("input:checked")?.value ?? "4";
}

function updateContext() {
  const game = games.find(({ name }) => name === gameSelect.value) ?? games[0];
  modeSelect.replaceChildren(...game.modes.map((mode) => new Option(mode, mode)));
  contextSummary.textContent = `${game.name} · ${modeSelect.value} · ${selectedPlayers()} ${selectedPlayers() === "1" ? "player" : "players"}`;
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
playerOptions.addEventListener("change", updateContext);
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
    throw new Error(payload?.error?.message ?? `QuestMind API failed (${response.status}).`);
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
  try {
    const response = await requestAnswer({
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
    });
    questionInput.value = "";
    attachments.splice(0).forEach(({ url }) => URL.revokeObjectURL(url));
    renderAttachments();
    window.setTimeout(() => addMessage("assistant", response.text, [], response.evidence), 260);
    composerNote.textContent = useServerProvider ? "CONNECTED VIA QUESTMIND CORE." : "LOCAL MOCK / NO AI CONNECTED";
  } catch (error) {
    addMessage("assistant", `ERROR: ${error.message} Please try again or check the server configuration.`);
    composerNote.textContent = "CONNECTION ERROR / NO FALLBACK WAS USED";
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "SEND";
  }
});

updateContext();
loadModelConfig();
showRoute();
