import { prepare, layout } from "@chenglou/pretext";
import matrixDemo from "./data/matrix-demo.json";
import jurassicParkThreeActDemo from "./data/jurassic-park-three-act-demo.json";
import backToTheFutureSaveTheCatDemo from "./data/back-to-the-future-save-the-cat-demo.json";
import findingNemoStoryCircleDemo from "./data/finding-nemo-story-circle-demo.json";
import harryPotterSevenPointDemo from "./data/harry-potter-seven-point-demo.json";
import prideAndPrejudiceRomancingDemo from "./data/pride-and-prejudice-romancing-the-beat-demo.json";
import inceptionMiceDemo from "./data/inception-mice-quotient-demo.json";

const STORAGE_KEY = "structurer.boards.v1";
const SETTINGS_KEY = "structurer.settings.v1";
const DEV_RESET_FLAG_KEY = "activate.reset";
const HOME_ROUTE = "/dashboard";
const DEFAULT_COLUMN_WIDTH = 260;

const STRUCTURES = {
  hero_journey: {
    id: "hero_journey",
    name: "Hero's Journey",
    phases: [
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
    ],
  },
  three_act: {
    id: "three_act",
    name: "Three-Act Structure",
    phases: [
      "Act I - Setup",
      "Act I - Inciting Incident",
      "Act II - Progressive Complications",
      "Act II - Midpoint",
      "Act II - Crisis",
      "Act II - Break into Act III",
      "Act III - Climax",
      "Act III - Resolution",
    ],
  },
  save_the_cat: {
    id: "save_the_cat",
    name: "Save the Cat",
    phases: [
      "Opening Image",
      "Theme Stated",
      "Set-Up",
      "Catalyst",
      "Debate",
      "Break into Two",
      "B Story",
      "Fun and Games",
      "Midpoint",
      "Bad Guys Close In",
      "All Is Lost",
      "Dark Night of the Soul",
      "Break into Three",
      "Finale",
      "Final Image",
    ],
  },
  story_circle: {
    id: "story_circle",
    name: "Story Circle",
    phases: [
      "1. You (Comfort Zone)",
      "2. Need",
      "3. Go",
      "4. Search",
      "5. Find",
      "6. Take",
      "7. Return",
      "8. Change",
    ],
  },
  seven_point: {
    id: "seven_point",
    name: "7-Point Story Structure",
    phases: [
      "Hook",
      "Plot Turn 1",
      "Pinch Point 1",
      "Midpoint",
      "Pinch Point 2",
      "Plot Turn 2",
      "Resolution",
    ],
  },
  romancing_the_beat: {
    id: "romancing_the_beat",
    name: "Romancing the Beat",
    phases: [
      "Setup and Need",
      "Meet and Spark",
      "No Way / Resistance",
      "Adhesion / Forced Proximity",
      "Deepening Desire",
      "Retreat and Doubt",
      "Breakup / Crisis",
      "Grand Gesture",
      "Commitment / HEA-HFN",
    ],
  },
  mice_quotient: {
    id: "mice_quotient",
    name: "MICE Quotient",
    phases: [
      "Milieu Question Open",
      "Idea Question Open",
      "Character Question Open",
      "Event Question Open",
      "Event Question Close",
      "Character Question Close",
      "Idea Question Close",
      "Milieu Question Close",
    ],
  },
};

const archetypes = [
  { id: "none", icon: "", label: "No specific role" },
  { id: "hero", icon: "🛡️", label: "Hero" },
  { id: "mentor", icon: "🧙", label: "Mentor" },
  { id: "ally", icon: "🤝", label: "Ally" },
  { id: "herald", icon: "📣", label: "Herald" },
  { id: "guardian", icon: "🚧", label: "Threshold Guardian" },
  { id: "shadow", icon: "🕶️", label: "Shadow/Antagonist" },
  { id: "trickster", icon: "🃏", label: "Trickster" },
  { id: "shapeshifter", icon: "🦊", label: "Shapeshifter" },
];

const loadedBoards = loadBoards();
let boards = loadedBoards || [];
let currentBoardId = null;
let draggedNoteId = null;
let resizingNoteId = null;
const initialSettings = loadSettings();
let columnMinWidth = initialSettings.columnMinWidth ?? DEFAULT_COLUMN_WIDTH;
let wrapColumns = initialSettings.wrapColumns ?? true;

const landingView = document.querySelector("#landing-view");
const homeView = document.querySelector("#home-view");
const editorView = document.querySelector("#editor-view");
const boardsList = document.querySelector("#boards-list");
const emptyState = document.querySelector("#empty-state");
const createBoardForm = document.querySelector("#create-board-form");
const boardTitleInput = document.querySelector("#board-title");
const boardStructureSelect = document.querySelector("#board-structure");
const importBoardButton = document.querySelector("#import-board-button");
const importBoardInput = document.querySelector("#import-board-input");
const goLandingFromDashboardBtn = document.querySelector("#go-landing-from-dashboard");
const goHomeFromBoardBtn = document.querySelector("#go-home-from-board");
const goDashboardFromBoardBtn = document.querySelector("#go-dashboard-from-board");
const editorTitle = document.querySelector("#editor-title");
const structureNameEl = document.querySelector("#structure-name");
const optionsButton = document.querySelector("#options-button");
const optionsMenu = document.querySelector("#options-menu");
const openResizeModalBtn = document.querySelector("#open-resize-modal");
const toggleWrapColumnsBtn = document.querySelector("#toggle-wrap-columns");
const resetAppDataBtn = document.querySelector("#reset-app-data");
const resizeModalOverlay = document.querySelector("#resize-modal-overlay");
const closeResizeModalBtn = document.querySelector("#close-resize-modal");
const columnWidthSlider = document.querySelector("#column-width-slider");
const columnWidthValue = document.querySelector("#column-width-value");
const goDashboardBtn = document.querySelector("#go-dashboard");

const boardEl = document.querySelector("#board");
const insightsEl = document.querySelector("#insights");

function loadBoards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
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

function isDevResetEnabled() {
  return localStorage.getItem(DEV_RESET_FLAG_KEY) === "true";
}

function applyDevFlags() {
  resetAppDataBtn.style.display = isDevResetEnabled() ? "inline-block" : "none";
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

function getStructureConfig(structureId) {
  return STRUCTURES[structureId] || STRUCTURES.hero_journey;
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

function normalizeOrders(notes, structureId = "hero_journey") {
  const structure = getStructureConfig(structureId);
  for (let columnIndex = 0; columnIndex < structure.phases.length; columnIndex += 1) {
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
  const structure = getStructureConfig(board.structureId);
  return `
    <article class="board-card" data-board-id="${board.id}">
      <div>
        <strong>${board.title}</strong>
        <div class="board-meta">${structure.name} • ${noteCount} notes • Updated ${formatDate(board.updatedAt)}</div>
      </div>
      <div class="board-actions">
        <button type="button" data-role="open-board">Open</button>
        <button type="button" data-role="export-board">Export</button>
        <button type="button" class="danger-button" data-role="delete-board">Delete</button>
      </div>
    </article>
  `;
}

function noteTemplate(note) {
  const archetype = archetypeById(note.archetype || "none");
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
                  a.id === (note.archetype || "none") ? "selected" : ""
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
          note.kind === "character" && archetype.icon ? archetype.icon : ""
        }</span>
        <button class="delete" data-role="delete" title="Delete note">✕</button>
      </div>
      ${characterUI}
      <textarea
        data-role="text"
        data-note-id="${note.id}"
        style="${note.customHeight ? `height: ${note.customHeight}px;` : ""}"
        placeholder="Write your note..."
      >${note.text || ""}</textarea>
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
  const structure = getStructureConfig(board.structureId);
  const phases = structure.phases;

  editorTitle.textContent = board.title;
  structureNameEl.textContent = structure.name;
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
  autoResizeTextareas();
}

function autoResizeTextareas() {
  const board = getCurrentBoard();
  if (!board) return;

  boardEl.querySelectorAll('textarea[data-role="text"]').forEach((textarea) => {
    const noteId = Number(textarea.dataset.noteId);
    const note = board.notes.find((item) => item.id === noteId);
    if (!note || note.customHeight) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 74)}px`;
  });
}

function renderInsights(note) {
  if (!note) {
    insightsEl.textContent = "Select or edit a note to view writing metrics and details.";
    return;
  }
  const metrics = estimateTextMetrics(note.text || "");
  const archetypeText =
    note.kind === "character"
      ? `Archetype: ${archetypeById(note.archetype || "none").label}`
      : "Archetype: -";

  insightsEl.textContent = `Note #${note.id} | Type: ${kindLabel(
    note.kind,
  )} | Estimated lines: ${metrics.lineCount} | Estimated height: ${Math.round(
    metrics.height,
  )}px | ${archetypeText}`;
}

function showHome() {
  currentBoardId = null;
  landingView.classList.add("hidden");
  homeView.classList.remove("hidden");
  editorView.classList.add("hidden");
  renderHome();
}

function showLanding() {
  currentBoardId = null;
  landingView.classList.remove("hidden");
  homeView.classList.add("hidden");
  editorView.classList.add("hidden");
}

function showBoard(boardId) {
  const board = boards.find((item) => item.id === boardId);
  if (!board) {
    showHome();
    return;
  }
  currentBoardId = boardId;
  landingView.classList.add("hidden");
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

function createBoard(title, structureId = "hero_journey") {
  const baseSlug = slugifyTitle(title);
  const slug = ensureUniqueSlug(baseSlug);
  const structure = getStructureConfig(structureId);
  const newBoard = {
    id: crypto.randomUUID(),
    title: title.trim(),
    slug,
    structureId: structure.id,
    structure: structure.name,
    nextNoteId: 1,
    notes: [],
    updatedAt: Date.now(),
  };
  boards.push(newBoard);
  saveBoards();
  renderHome();
}

function createDemoBoardFromJson(demoData) {
  const structureEntry = Object.values(STRUCTURES).find(
    (item) => item.name === (demoData.structure || "Hero's Journey"),
  );
  const structure = structureEntry || STRUCTURES.hero_journey;
  const notes = (demoData.notes || []).map((note, index) => ({
    id: index + 1,
    kind: note.kind || "plot",
    column: Number.isInteger(note.column) ? note.column : 0,
    order: Number.isInteger(note.order) ? note.order : index,
    text: note.text || "",
    characterName: note.characterName || "",
    archetype: note.archetype || "none",
  }));

  return {
    id: crypto.randomUUID(),
    title: demoData.title || "Demo Board",
    slug: ensureUniqueSlug(slugifyTitle(demoData.title || "demo_board")),
    structureId: structure.id,
    structure: structure.name,
    nextNoteId: notes.length + 1,
    notes,
    updatedAt: Date.now(),
  };
}

function boardToExportPayload(board) {
  const structure = getStructureConfig(board.structureId);
  return {
    title: board.title,
    structure: structure.name,
    notes: [...board.notes]
      .sort((a, b) => (a.column - b.column) || ((a.order || 0) - (b.order || 0)))
      .map((note) => ({
        kind: note.kind || "plot",
        column: Number.isInteger(note.column) ? note.column : 0,
        order: Number.isInteger(note.order) ? note.order : 0,
        text: note.text || "",
        characterName: note.characterName || "",
        archetype: note.archetype || "none",
        customHeight: note.customHeight || undefined,
      })),
  };
}

function downloadBoard(board) {
  const payload = boardToExportPayload(board);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const filename = `${slugifyTitle(board.title || "board")}.json`;
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function importBoardFromJson(rawText) {
  const parsed = JSON.parse(rawText);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.notes)) {
    throw new Error("Invalid board JSON format.");
  }

  const structureEntry = Object.values(STRUCTURES).find((item) => item.name === parsed.structure);
  const structure = structureEntry || STRUCTURES.hero_journey;
  const title = typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "Imported Board";
  const phaseCount = structure.phases.length;
  const notes = parsed.notes.map((note, index) => {
    const column = Number.isInteger(note.column) ? note.column : 0;
    return {
      id: index + 1,
      kind: note.kind || "plot",
      column: Math.max(0, Math.min(column, phaseCount - 1)),
      order: Number.isInteger(note.order) ? note.order : index,
      text: note.text || "",
      characterName: note.characterName || "",
      archetype: note.archetype || "none",
      customHeight: Number.isFinite(note.customHeight) ? note.customHeight : undefined,
    };
  });

  const newBoard = {
    id: crypto.randomUUID(),
    title,
    slug: ensureUniqueSlug(slugifyTitle(title)),
    structureId: structure.id,
    structure: structure.name,
    nextNoteId: notes.length + 1,
    notes,
    updatedAt: Date.now(),
  };
  normalizeOrders(newBoard.notes, newBoard.structureId);
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

function openLanding(replaceRoute = false) {
  showLanding();
  navigateTo("/", replaceRoute);
}

function syncRouteToState(replaceRoute = true) {
  const path = normalizePathname(window.location.pathname);
  if (path === "/") {
    openLanding(replaceRoute);
    return;
  }
  if (path === HOME_ROUTE) {
    openHome(replaceRoute);
    return;
  }

  const slug = path.slice(1);
  const board = boards.find((item) => item.slug === slug);
  if (!board) {
    openLanding(replaceRoute);
    return;
  }
  showBoard(board.id);
}

function addNote(kind, column, archetype = "none") {
  const board = getCurrentBoard();
  if (!board) return;
  const phaseCount = getStructureConfig(board.structureId).phases.length;
  const safeColumn = Math.max(0, Math.min(column, phaseCount - 1));
  const newOrder = getColumnNotes(board.notes, safeColumn).length;
  board.notes.push({
    id: board.nextNoteId++,
    kind,
    column: safeColumn,
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
  const phaseCount = getStructureConfig(board.structureId).phases.length;
  const safeTargetColumn = Math.max(0, Math.min(targetColumn, phaseCount - 1));
  const movingNote = board.notes.find((note) => note.id === noteId);
  if (!movingNote) return;

  const sourceColumn = movingNote.column;
  const clampedIndex = Math.max(0, targetIndex);

  if (sourceColumn === safeTargetColumn) {
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

  const targetList = getColumnNotes(board.notes, safeTargetColumn);
  movingNote.column = safeTargetColumn;
  targetList.splice(clampedIndex, 0, movingNote);
  targetList.forEach((note, index) => {
    note.order = index;
  });
}

createBoardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = boardTitleInput.value.trim();
  if (!title) return;
  createBoard(title, boardStructureSelect.value);
  boardTitleInput.value = "";
});

boardsList.addEventListener("click", (event) => {
  const target = event.target;
  const boardCard = target.closest(".board-card");
  if (!boardCard) return;
  const boardId = boardCard.dataset.boardId;
  if (target.dataset.role === "open-board") {
    openBoard(boardId);
    return;
  }
  if (target.dataset.role === "export-board") {
    const board = boards.find((item) => item.id === boardId);
    if (!board) return;
    downloadBoard(board);
    return;
  }
  if (target.dataset.role === "delete-board") {
    const board = boards.find((item) => item.id === boardId);
    if (!board) return;
    const confirmed = window.confirm(`Delete board "${board.title}"? This action cannot be undone.`);
    if (!confirmed) return;
    boards = boards.filter((item) => item.id !== boardId);
    saveBoards();
    renderHome();
  }
});

goLandingFromDashboardBtn.addEventListener("click", () => {
  openLanding();
});

goHomeFromBoardBtn.addEventListener("click", () => {
  openLanding();
});

goDashboardFromBoardBtn.addEventListener("click", () => {
  openHome();
});

goDashboardBtn.addEventListener("click", () => {
  openHome();
});

importBoardButton.addEventListener("click", () => {
  importBoardInput.click();
});

importBoardInput.addEventListener("change", async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    importBoardFromJson(text);
    window.alert("Board imported successfully.");
  } catch (error) {
    window.alert("Import failed. Please use a valid Structurer board JSON.");
  } finally {
    importBoardInput.value = "";
  }
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

resetAppDataBtn.addEventListener("click", () => {
  closeOptionsMenu();
  const confirmed = window.confirm(
    "Reset all app data? This will delete all boards and settings, then reload the app.",
  );
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  window.location.assign(HOME_ROUTE);
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
    if (!note.customHeight) {
      target.style.height = "auto";
      target.style.height = `${Math.max(target.scrollHeight, 74)}px`;
    }
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
    normalizeOrders(board.notes, board.structureId);
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

boardEl.addEventListener("mousedown", (event) => {
  const target = event.target;
  if (target.matches('textarea[data-role="text"]')) {
    resizingNoteId = Number(target.dataset.noteId);
  }
});

boardEl.addEventListener("mouseup", (event) => {
  const target = event.target;
  if (!target.matches('textarea[data-role="text"]') || resizingNoteId === null) return;
  const board = getCurrentBoard();
  if (!board) return;
  const note = board.notes.find((item) => item.id === resizingNoteId);
  if (!note) return;
  note.customHeight = target.offsetHeight;
  touchBoard(board);
  resizingNoteId = null;
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".options-wrap")) {
    closeOptionsMenu();
  }
  if (!event.target.closest(".phase-head")) {
    closeAllColumnMenus();
  }
});

document.addEventListener("mouseup", () => {
  resizingNoteId = null;
});

resizeModalOverlay.addEventListener("click", (event) => {
  if (event.target === resizeModalOverlay) {
    closeResizeModal();
  }
});

boards.forEach((board) => {
  const guessedStructure = Object.values(STRUCTURES).find((item) => item.name === board.structure);
  if (!board.structureId) {
    board.structureId = guessedStructure ? guessedStructure.id : "hero_journey";
  }
  board.structure = getStructureConfig(board.structureId).name;
  normalizeOrders(board.notes, board.structureId);
});
if (loadedBoards === null) {
  boards = [
    createDemoBoardFromJson(matrixDemo),
    createDemoBoardFromJson(jurassicParkThreeActDemo),
    createDemoBoardFromJson(backToTheFutureSaveTheCatDemo),
    createDemoBoardFromJson(findingNemoStoryCircleDemo),
    createDemoBoardFromJson(harryPotterSevenPointDemo),
    createDemoBoardFromJson(prideAndPrejudiceRomancingDemo),
    createDemoBoardFromJson(inceptionMiceDemo),
  ];
}
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
applyDevFlags();
syncRouteToState(true);
