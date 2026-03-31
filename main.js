import { prepare, layout } from "@chenglou/pretext";

const STORAGE_KEY = "structurer.boards.v1";
const SETTINGS_KEY = "structurer.settings.v1";
const HOME_ROUTE = "/dashboard";
const DEFAULT_COLUMN_WIDTH = 180;

const phases = [
  "Ordinary World",
  "Call to Adventure",
  "Refusal of the Call",
  "Meeting the Mentor",
  "Crossing the Threshold",
  "Tests, Allies, Enemies",
  "Approach to the Inmost Cave",
  "Ordeal",
  "Reward",
  "The Road Back",
  "Resurrection",
  "Return with the Elixir",
];

const archetypes = [
  { id: "hero", icon: "🛡️", label: "Hero" },
  { id: "mentor", icon: "🧙", label: "Mentor" },
  { id: "ally", icon: "🤝", label: "Ally" },
  { id: "herald", icon: "📣", label: "Herald" },
  { id: "guardian", icon: "🚧", label: "Threshold Guardian" },
  { id: "shadow", icon: "🕶️", label: "Shadow/Antagonist" },
  { id: "trickster", icon: "🃏", label: "Trickster" },
  { id: "shapeshifter", icon: "🦊", label: "Shapeshifter" },
];

let boards = loadBoards();
let currentBoardId = null;
let draggedNoteId = null;
const initialSettings = loadSettings();
let columnMinWidth = initialSettings.columnMinWidth || DEFAULT_COLUMN_WIDTH;
let wrapColumns = initialSettings.wrapColumns || false;

const homeView = document.querySelector("#home-view");
const editorView = document.querySelector("#editor-view");
const boardsList = document.querySelector("#boards-list");
const emptyState = document.querySelector("#empty-state");
const createBoardForm = document.querySelector("#create-board-form");
const boardTitleInput = document.querySelector("#board-title");
const backHomeBtn = document.querySelector("#back-home");
const editorTitle = document.querySelector("#editor-title");
const optionsButton = document.querySelector("#options-button");
const optionsMenu = document.querySelector("#options-menu");
const openResizeModalBtn = document.querySelector("#open-resize-modal");
const toggleWrapColumnsBtn = document.querySelector("#toggle-wrap-columns");
const resizeModalOverlay = document.querySelector("#resize-modal-overlay");
const closeResizeModalBtn = document.querySelector("#close-resize-modal");
const columnWidthSlider = document.querySelector("#column-width-slider");
const columnWidthValue = document.querySelector("#column-width-value");

const boardEl = document.querySelector("#board");
const insightsEl = document.querySelector("#insights");

function loadBoards() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveBoards() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}

function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ columnMinWidth, wrapColumns }));
}

function applyColumnWidth() {
  document.documentElement.style.setProperty("--column-min-width", `${columnMinWidth}px`);
  columnWidthSlider.value = String(columnMinWidth);
  columnWidthValue.textContent = `${columnMinWidth}px`;
}

function applyWrapColumns() {
  boardEl.classList.toggle("wrap-columns", wrapColumns);
  toggleWrapColumnsBtn.textContent = `Wrap columns: ${wrapColumns ? "On" : "Off"}`;
}

function slugifyTitle(title) {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "board";
}

function ensureUniqueSlug(baseSlug, excludedBoardId = null) {
  let slug = baseSlug;
  let suffix = 2;
  while (boards.some((board) => board.slug === slug && board.id !== excludedBoardId)) {
    slug = `${baseSlug}_${suffix}`;
    suffix += 1;
  }
  return slug;
}

function normalizePathname(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function boardRoutePath(board) {
  return `/${board.slug}`;
}

function navigateTo(path, replace = false) {
  const target = normalizePathname(path);
  const current = normalizePathname(window.location.pathname);
  if (target === current) return;
  if (replace) {
    window.history.replaceState({}, "", target);
    return;
  }
  window.history.pushState({}, "", target);
}

function getCurrentBoard() {
  return boards.find((board) => board.id === currentBoardId) || null;
}

function kindLabel(kind) {
  if (kind === "plot") return "Plot";
  if (kind === "character") return "Character";
  return "Theme";
}

function archetypeById(id) {
  return archetypes.find((item) => item.id === id) || archetypes[0];
}

function estimateTextMetrics(text) {
  const trimmed = text.trim();
  if (!trimmed) return { height: 0, lineCount: 0 };
  const prepared = prepare(trimmed, '14px "Helvetica Neue"');
  return layout(prepared, 210, 20);
}

function getColumnNotes(notes, column) {
  return notes
    .filter((note) => note.column === column)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function normalizeOrders(notes) {
  for (let columnIndex = 0; columnIndex < phases.length; columnIndex += 1) {
    const inColumn = getColumnNotes(notes, columnIndex);
    inColumn.forEach((note, index) => {
      note.order = index;
    });
  }
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function boardCardTemplate(board) {
  const noteCount = board.notes.length;
  return `
    <article class="board-card" data-board-id="${board.id}">
      <div>
        <strong>${board.title}</strong>
        <div class="board-meta">${noteCount} notes • Updated ${formatDate(board.updatedAt)}</div>
      </div>
      <button type="button" data-role="open-board">Open</button>
    </article>
  `;
}

function noteTemplate(note) {
  const archetype = archetypeById(note.archetype || "hero");
  const characterUI =
    note.kind === "character"
      ? `
      <div class="character-fields">
        <input
          type="text"
          data-role="character-name"
          value="${note.characterName || ""}"
          placeholder="Character name"
          aria-label="Character name"
        />
        <select data-role="archetype" aria-label="Character archetype">
          ${archetypes
            .map(
              (a) =>
                `<option value="${a.id}" ${
                  a.id === (note.archetype || "hero") ? "selected" : ""
                }>${a.icon} ${a.label}</option>`,
            )
            .join("")}
        </select>
      </div>
    `
      : "";

  return `
    <article class="note" data-id="${note.id}" data-kind="${note.kind}" draggable="true">
      <div class="note-head">
        <span class="badge">${kindLabel(note.kind)} ${
          note.kind === "character" ? archetype.icon : ""
        }</span>
        <button class="delete" data-role="delete" title="Delete note">✕</button>
      </div>
      ${characterUI}
      <textarea data-role="text" placeholder="Write your note...">${note.text || ""}</textarea>
    </article>
  `;
}

function columnMenuTemplate(columnIndex) {
  return `
    <div class="column-menu hidden" data-role="column-menu">
      <button class="menu-item" data-role="quick-add" data-kind="plot" data-column="${columnIndex}">
        Add plot note
      </button>
      <button class="menu-item" data-role="quick-add" data-kind="theme" data-column="${columnIndex}">
        Add theme note
      </button>
      <button class="menu-item" data-role="toggle-character-submenu">
        Add character note ▸
      </button>
      <div class="submenu hidden" data-role="character-submenu">
        <div class="submenu-title">Choose archetype</div>
        ${archetypes
          .map(
            (archetype) => `
          <button
            class="menu-item"
            data-role="quick-add-character"
            data-column="${columnIndex}"
            data-archetype="${archetype.id}"
          >
            ${archetype.icon} ${archetype.label}
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderHome() {
  const sortedBoards = [...boards].sort((a, b) => b.updatedAt - a.updatedAt);
  boardsList.innerHTML = sortedBoards.map(boardCardTemplate).join("");
  emptyState.style.display = boards.length === 0 ? "block" : "none";
}

function renderEditor() {
  const board = getCurrentBoard();
  if (!board) return;

  editorTitle.textContent = board.title;
  boardEl.innerHTML = phases
    .map((phase, columnIndex) => {
      const noteItems = getColumnNotes(board.notes, columnIndex);
      return `
      <section class="column" data-column="${columnIndex}">
        <div class="phase-head">
          <h2 class="phase-title">${columnIndex + 1}. ${phase}</h2>
          <button class="phase-add" data-role="open-column-menu" title="Add note">+</button>
          ${columnMenuTemplate(columnIndex)}
        </div>
        <div class="notes">${noteItems.map(noteTemplate).join("")}</div>
      </section>
    `;
    })
    .join("");
}

function renderInsights(note) {
  if (!note) {
    insightsEl.textContent = "Select or edit a note to view writing metrics and details.";
    return;
  }
  const metrics = estimateTextMetrics(note.text || "");
  const archetypeText =
    note.kind === "character"
      ? `Archetype: ${archetypeById(note.archetype || "hero").label}`
      : "Archetype: -";

  insightsEl.textContent = `Note #${note.id} | Type: ${kindLabel(
    note.kind,
  )} | Estimated lines: ${metrics.lineCount} | Estimated height: ${Math.round(
    metrics.height,
  )}px | ${archetypeText}`;
}

function showHome() {
  currentBoardId = null;
  homeView.classList.remove("hidden");
  editorView.classList.add("hidden");
  renderHome();
}

function showBoard(boardId) {
  const board = boards.find((item) => item.id === boardId);
  if (!board) {
    showHome();
    return;
  }
  currentBoardId = boardId;
  homeView.classList.add("hidden");
  editorView.classList.remove("hidden");
  renderEditor();
  renderInsights(null);
  applyColumnWidth();
  applyWrapColumns();
}

function touchBoard(board) {
  board.updatedAt = Date.now();
  saveBoards();
}

function createBoard(title) {
  const baseSlug = slugifyTitle(title);
  const slug = ensureUniqueSlug(baseSlug);
  const newBoard = {
    id: crypto.randomUUID(),
    title: title.trim(),
    slug,
    nextNoteId: 1,
    notes: [],
    updatedAt: Date.now(),
  };
  boards.push(newBoard);
  saveBoards();
  renderHome();
}

function openBoard(boardId, replaceRoute = false) {
  const board = boards.find((item) => item.id === boardId);
  if (!board) {
    showHome();
    navigateTo(HOME_ROUTE, replaceRoute);
    return;
  }
  showBoard(boardId);
  navigateTo(boardRoutePath(board), replaceRoute);
}

function openHome(replaceRoute = false) {
  showHome();
  navigateTo(HOME_ROUTE, replaceRoute);
}

function syncRouteToState(replaceRoute = true) {
  const path = normalizePathname(window.location.pathname);
  if (path === "/" || path === HOME_ROUTE) {
    openHome(replaceRoute);
    return;
  }

  const slug = path.slice(1);
  const board = boards.find((item) => item.slug === slug);
  if (!board) {
    openHome(replaceRoute);
    return;
  }
  showBoard(board.id);
}

function addNote(kind, column, archetype = "hero") {
  const board = getCurrentBoard();
  if (!board) return;
  const newOrder = getColumnNotes(board.notes, column).length;
  board.notes.push({
    id: board.nextNoteId++,
    kind,
    column,
    order: newOrder,
    text: "",
    characterName: "",
    archetype,
  });
  touchBoard(board);
  renderEditor();
  renderInsights(board.notes[board.notes.length - 1]);
}

function getDropIndex(notesContainer, pointerY) {
  const candidateNotes = [...notesContainer.querySelectorAll(".note")].filter(
    (noteEl) => Number(noteEl.dataset.id) !== draggedNoteId,
  );
  for (let index = 0; index < candidateNotes.length; index += 1) {
    const rect = candidateNotes[index].getBoundingClientRect();
    if (pointerY < rect.top + rect.height / 2) return index;
  }
  return candidateNotes.length;
}

function moveNote(noteId, targetColumn, targetIndex) {
  const board = getCurrentBoard();
  if (!board) return;
  const movingNote = board.notes.find((note) => note.id === noteId);
  if (!movingNote) return;

  const sourceColumn = movingNote.column;
  const clampedIndex = Math.max(0, targetIndex);

  if (sourceColumn === targetColumn) {
    const reordered = getColumnNotes(board.notes, sourceColumn).filter((note) => note.id !== noteId);
    reordered.splice(clampedIndex, 0, movingNote);
    reordered.forEach((note, index) => {
      note.order = index;
    });
    return;
  }

  const sourceList = getColumnNotes(board.notes, sourceColumn).filter((note) => note.id !== noteId);
  sourceList.forEach((note, index) => {
    note.order = index;
  });

  const targetList = getColumnNotes(board.notes, targetColumn);
  movingNote.column = targetColumn;
  targetList.splice(clampedIndex, 0, movingNote);
  targetList.forEach((note, index) => {
    note.order = index;
  });
}

createBoardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = boardTitleInput.value.trim();
  if (!title) return;
  createBoard(title);
  boardTitleInput.value = "";
});

boardsList.addEventListener("click", (event) => {
  const target = event.target;
  if (target.dataset.role !== "open-board") return;
  const boardCard = target.closest(".board-card");
  if (!boardCard) return;
  openBoard(boardCard.dataset.boardId);
});

backHomeBtn.addEventListener("click", () => {
  openHome();
});

function closeOptionsMenu() {
  optionsMenu.classList.add("hidden");
}

function openResizeModal() {
  resizeModalOverlay.classList.remove("hidden");
}

function closeResizeModal() {
  resizeModalOverlay.classList.add("hidden");
}

optionsButton.addEventListener("click", (event) => {
  event.stopPropagation();
  optionsMenu.classList.toggle("hidden");
});

openResizeModalBtn.addEventListener("click", () => {
  closeOptionsMenu();
  openResizeModal();
});

toggleWrapColumnsBtn.addEventListener("click", () => {
  wrapColumns = !wrapColumns;
  applyWrapColumns();
  saveSettings();
});

closeResizeModalBtn.addEventListener("click", () => {
  closeResizeModal();
});

columnWidthSlider.addEventListener("input", (event) => {
  columnMinWidth = Number(event.target.value);
  applyColumnWidth();
  saveSettings();
});

function closeAllColumnMenus() {
  boardEl.querySelectorAll('[data-role="column-menu"]').forEach((menu) => {
    menu.classList.add("hidden");
  });
  boardEl.querySelectorAll('[data-role="character-submenu"]').forEach((submenu) => {
    submenu.classList.add("hidden");
  });
}

boardEl.addEventListener("input", (event) => {
  const target = event.target;
  const noteEl = target.closest(".note");
  const board = getCurrentBoard();
  if (!noteEl || !board) return;

  const id = Number(noteEl.dataset.id);
  const note = board.notes.find((item) => item.id === id);
  if (!note) return;

  if (target.dataset.role === "text") {
    note.text = target.value;
  } else if (target.dataset.role === "character-name") {
    note.characterName = target.value;
  } else if (target.dataset.role === "archetype") {
    note.archetype = target.value;
    renderEditor();
  }

  touchBoard(board);
  renderInsights(note);
});

boardEl.addEventListener("click", (event) => {
  const target = event.target;

  if (target.dataset.role === "open-column-menu") {
    const columnEl = target.closest(".column");
    if (!columnEl) return;
    const menu = columnEl.querySelector('[data-role="column-menu"]');
    const willOpen = menu.classList.contains("hidden");
    closeAllColumnMenus();
    if (willOpen) {
      menu.classList.remove("hidden");
    }
    return;
  }

  if (target.dataset.role === "toggle-character-submenu") {
    const menu = target.closest('[data-role="column-menu"]');
    if (!menu) return;
    const submenu = menu.querySelector('[data-role="character-submenu"]');
    submenu.classList.toggle("hidden");
    return;
  }

  if (target.dataset.role === "quick-add") {
    addNote(target.dataset.kind, Number(target.dataset.column));
    closeAllColumnMenus();
    return;
  }

  if (target.dataset.role === "quick-add-character") {
    addNote("character", Number(target.dataset.column), target.dataset.archetype);
    closeAllColumnMenus();
    return;
  }

  const noteEl = target.closest(".note");
  const board = getCurrentBoard();
  if (!noteEl || !board) return;

  const id = Number(noteEl.dataset.id);
  const note = board.notes.find((item) => item.id === id);
  if (!note) return;

  if (target.dataset.role === "delete") {
    board.notes = board.notes.filter((item) => item.id !== id);
    normalizeOrders(board.notes);
    touchBoard(board);
    renderEditor();
    renderInsights(null);
    return;
  }
  renderInsights(note);
});

boardEl.addEventListener("dragstart", (event) => {
  const target = event.target;
  if (target.closest("textarea, input, select, button")) {
    event.preventDefault();
    return;
  }
  const noteEl = target.closest(".note");
  if (!noteEl) return;

  draggedNoteId = Number(noteEl.dataset.id);
  noteEl.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", String(draggedNoteId));
});

boardEl.addEventListener("dragover", (event) => {
  if (draggedNoteId === null) return;
  const columnEl = event.target.closest(".column");
  if (!columnEl) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
});

boardEl.addEventListener("drop", (event) => {
  if (draggedNoteId === null) return;
  const columnEl = event.target.closest(".column");
  if (!columnEl) return;
  const notesContainer = columnEl.querySelector(".notes");
  if (!notesContainer) return;
  event.preventDefault();

  const targetColumn = Number(columnEl.dataset.column);
  const targetIndex = getDropIndex(notesContainer, event.clientY);
  moveNote(draggedNoteId, targetColumn, targetIndex);

  const board = getCurrentBoard();
  const movedNote = board ? board.notes.find((note) => note.id === draggedNoteId) : null;
  draggedNoteId = null;
  if (board) touchBoard(board);
  renderEditor();
  renderInsights(movedNote || null);
});

boardEl.addEventListener("dragend", () => {
  draggedNoteId = null;
  boardEl.querySelectorAll(".note.is-dragging").forEach((note) => note.classList.remove("is-dragging"));
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".options-wrap")) {
    closeOptionsMenu();
  }
  if (!event.target.closest(".phase-head")) {
    closeAllColumnMenus();
  }
});

resizeModalOverlay.addEventListener("click", (event) => {
  if (event.target === resizeModalOverlay) {
    closeResizeModal();
  }
});

boards.forEach((board) => normalizeOrders(board.notes));
boards.forEach((board) => {
  const baseSlug = slugifyTitle(board.title || "board");
  board.slug = ensureUniqueSlug(board.slug || baseSlug, board.id);
});
saveBoards();
window.addEventListener("popstate", () => {
  syncRouteToState(false);
});
applyColumnWidth();
applyWrapColumns();
syncRouteToState(true);
