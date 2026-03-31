import { prepare, layout } from "@chenglou/pretext";
import {
  BUILTIN_ARCHETYPES,
  BUILTIN_STRUCTURES,
  CUSTOM_ARCHETYPES_KEY,
  CUSTOM_STRUCTURES_KEY,
  DEFAULT_COLUMN_WIDTH,
  DEV_RESET_FLAG_KEY,
  HOME_ROUTE,
  SETTINGS_KEY,
  STORAGE_KEY,
} from "./app-config";
import { DEMO_BOARD_DATA } from "./demo-boards";
import {
  clearKeys,
  isFlagEnabled,
  loadBoards as loadBoardsFromStorage,
  loadCustomArchetypes as loadCustomArchetypesFromStorage,
  loadCustomStructures as loadCustomStructuresFromStorage,
  loadSettings as loadSettingsFromStorage,
  saveBoards as saveBoardsToStorage,
  saveCustomArchetypes as saveCustomArchetypesToStorage,
  saveCustomStructures as saveCustomStructuresToStorage,
  saveSettings as saveSettingsToStorage,
} from "./storage";
import {
  boardCardTemplate,
  columnMenuTemplate,
  kindLabel,
  noteTemplate,
  renderStructureOptionsHtml,
  structurePhaseRowTemplate,
} from "./ui-render";

const loadedBoards = loadBoards();
let boards = loadedBoards || [];
let currentBoardId = null;
let draggedNoteId = null;
let resizingNoteId = null;
let boardActionsModalBoardId = null;
let customStructures = loadCustomStructures();
let customArchetypes = loadCustomArchetypes();
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
const createStructureForm = document.querySelector("#create-structure-form");
const structureNameInput = document.querySelector("#structure-name-input");
const structurePhasesList = document.querySelector("#structure-phases-list");
const addStructurePhaseBtn = document.querySelector("#add-structure-phase");
const importBoardButton = document.querySelector("#import-board-button");
const importBoardInput = document.querySelector("#import-board-input");
const boardActionsModalOverlay = document.querySelector("#board-actions-modal-overlay");
const closeBoardActionsModalBtn = document.querySelector("#close-board-actions-modal");
const modalExportBoardBtn = document.querySelector("#modal-export-board");
const modalDeleteBoardBtn = document.querySelector("#modal-delete-board");
const goLandingFromDashboardBtn = document.querySelector("#go-landing-from-dashboard");
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
  return loadBoardsFromStorage(STORAGE_KEY);
}

function saveBoards() {
  saveBoardsToStorage(STORAGE_KEY, boards);
}

function loadSettings() {
  return loadSettingsFromStorage(SETTINGS_KEY);
}

function saveSettings() {
  saveSettingsToStorage(SETTINGS_KEY, { columnMinWidth, wrapColumns });
}

function loadCustomStructures() {
  return loadCustomStructuresFromStorage(CUSTOM_STRUCTURES_KEY);
}

function saveCustomStructures() {
  saveCustomStructuresToStorage(CUSTOM_STRUCTURES_KEY, customStructures);
}

function loadCustomArchetypes() {
  return loadCustomArchetypesFromStorage(CUSTOM_ARCHETYPES_KEY);
}

function saveCustomArchetypes() {
  saveCustomArchetypesToStorage(CUSTOM_ARCHETYPES_KEY, customArchetypes);
}

function getAllStructures() {
  const map = { ...BUILTIN_STRUCTURES };
  for (const structure of customStructures) {
    map[structure.id] = structure;
  }
  return map;
}

function getAllStructureList() {
  return Object.values(getAllStructures());
}

function getAllArchetypes() {
  return [...BUILTIN_ARCHETYPES, ...customArchetypes];
}

function isDevResetEnabled() {
  return isFlagEnabled(DEV_RESET_FLAG_KEY);
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
  return getAllStructures()[structureId] || BUILTIN_STRUCTURES.hero_journey;
}

function renderStructureOptions(selectedId = null) {
  const structures = getAllStructureList();
  const activeId = selectedId || boardStructureSelect.value || "hero_journey";
  boardStructureSelect.innerHTML = renderStructureOptionsHtml(structures, activeId);
}

function renderStructurePhaseRows(values = ["", "", ""]) {
  structurePhasesList.innerHTML = values
    .map((value, index) => structurePhaseRowTemplate(index, value))
    .join("");
}

function archetypeById(id) {
  return getAllArchetypes().find((item) => item.id === id) || BUILTIN_ARCHETYPES[0];
}

function createCustomArchetype(label) {
  const trimmed = label.trim();
  if (!trimmed) return null;
  const baseId = `custom_${slugifyTitle(trimmed)}`;
  let id = baseId;
  let suffix = 2;
  while (getAllArchetypes().some((item) => item.id === id)) {
    id = `${baseId}_${suffix}`;
    suffix += 1;
  }
  const archetype = {
    id,
    icon: "✨",
    label: trimmed,
  };
  customArchetypes.push(archetype);
  saveCustomArchetypes();
  return archetype;
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

function formatPhaseTitle(phase) {
  return String(phase || "").trim();
}

function renderHome() {
  const sortedBoards = [...boards].sort((a, b) => b.updatedAt - a.updatedAt);
  boardsList.innerHTML = sortedBoards
    .map((board) => {
      const structure = getStructureConfig(board.structureId);
      return boardCardTemplate(board, structure.name, formatDate(board.updatedAt));
    })
    .join("");
  emptyState.style.display = boards.length === 0 ? "block" : "none";
}

function renderEditor() {
  const board = getCurrentBoard();
  if (!board) return;
  const structure = getStructureConfig(board.structureId);
  const phases = structure.phases;
  const archetypes = getAllArchetypes();

  editorTitle.textContent = board.title;
  structureNameEl.textContent = structure.name;
  boardEl.innerHTML = phases
    .map((phase, columnIndex) => {
      const noteItems = getColumnNotes(board.notes, columnIndex);
      return `
      <section class="column" data-column="${columnIndex}">
        <div class="phase-head">
          <h2 class="phase-title">${formatPhaseTitle(phase)}</h2>
          <button class="phase-add" data-role="open-column-menu" title="Add note">+</button>
          ${columnMenuTemplate(columnIndex, archetypes)}
        </div>
        <div class="notes">${noteItems
          .map((note) => noteTemplate(note, archetypes, archetypeById(note.archetype || "none")))
          .join("")}</div>
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
  const structureEntry = getAllStructureList().find(
    (item) => item.name === (demoData.structure || "Hero's Journey"),
  );
  const structure = structureEntry || BUILTIN_STRUCTURES.hero_journey;
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

function closeBoardActionsModal() {
  boardActionsModalOverlay.classList.add("hidden");
  boardActionsModalBoardId = null;
}

function openBoardActionsModal(boardId) {
  boardActionsModalBoardId = boardId;
  boardActionsModalOverlay.classList.remove("hidden");
}

function importBoardFromJson(rawText) {
  const parsed = JSON.parse(rawText);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.notes)) {
    throw new Error("Invalid board JSON format.");
  }

  const structureEntry = getAllStructureList().find((item) => item.name === parsed.structure);
  const structure = structureEntry || BUILTIN_STRUCTURES.hero_journey;
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

addStructurePhaseBtn.addEventListener("click", () => {
  const values = [...structurePhasesList.querySelectorAll('[data-role="phase-input"]')].map((input) => input.value);
  values.push("");
  renderStructurePhaseRows(values);
});

structurePhasesList.addEventListener("click", (event) => {
  const removeButton = event.target.closest('button[data-role="remove-phase-row"]');
  if (!removeButton) return;
  const rows = [...structurePhasesList.querySelectorAll(".structure-phase-row")];
  if (rows.length <= 2) return;
  removeButton.closest(".structure-phase-row").remove();
  const values = [...structurePhasesList.querySelectorAll('[data-role="phase-input"]')].map((input) => input.value);
  renderStructurePhaseRows(values);
});

createStructureForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = structureNameInput.value.trim();
  if (!name) return;

  const phaseValues = [...structurePhasesList.querySelectorAll('[data-role="phase-input"]')]
    .map((input) => input.value.trim())
    .filter(Boolean);

  if (phaseValues.length < 2) {
    window.alert("Please add at least 2 phases.");
    return;
  }

  const baseId = `custom_${slugifyTitle(name)}`;
  let id = baseId;
  let suffix = 2;
  while (getAllStructures()[id]) {
    id = `${baseId}_${suffix}`;
    suffix += 1;
  }

  customStructures.push({
    id,
    name,
    phases: phaseValues,
  });
  saveCustomStructures();
  renderStructureOptions(id);
  structureNameInput.value = "";
  renderStructurePhaseRows(["", "", ""]);
  window.alert(`Structure "${name}" saved.`);
});

boardsList.addEventListener("click", (event) => {
  const boardCard = event.target.closest(".board-card");
  if (!boardCard) return;
  const boardId = boardCard.dataset.boardId;
  const actionButton = event.target.closest("button[data-role]");
  if (actionButton && actionButton.dataset.role === "board-actions") {
    openBoardActionsModal(boardId);
    return;
  }
  openBoard(boardId);
});

boardsList.addEventListener("keydown", (event) => {
  if (event.target.closest("button")) return;
  const boardCard = event.target.closest(".board-card");
  if (!boardCard) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openBoard(boardCard.dataset.boardId);
  }
});

goLandingFromDashboardBtn.addEventListener("click", () => {
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

closeBoardActionsModalBtn.addEventListener("click", () => {
  closeBoardActionsModal();
});

modalExportBoardBtn.addEventListener("click", () => {
  const board = boards.find((item) => item.id === boardActionsModalBoardId);
  if (!board) return;
  downloadBoard(board);
  closeBoardActionsModal();
});

modalDeleteBoardBtn.addEventListener("click", () => {
  const board = boards.find((item) => item.id === boardActionsModalBoardId);
  if (!board) return;
  const confirmed = window.confirm(`Delete board "${board.title}"? This action cannot be undone.`);
  if (!confirmed) return;
  boards = boards.filter((item) => item.id !== board.id);
  saveBoards();
  renderHome();
  closeBoardActionsModal();
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

  clearKeys([STORAGE_KEY, SETTINGS_KEY, CUSTOM_STRUCTURES_KEY, CUSTOM_ARCHETYPES_KEY]);
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

  if (target.dataset.role === "define-custom-archetype") {
    const newName = window.prompt("Custom archetype name:");
    if (!newName) return;
    const created = createCustomArchetype(newName);
    if (!created) return;
    addNote("character", Number(target.dataset.column), created.id);
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

boardActionsModalOverlay.addEventListener("click", (event) => {
  if (event.target === boardActionsModalOverlay) {
    closeBoardActionsModal();
  }
});

boards.forEach((board) => {
  const guessedStructure = getAllStructureList().find((item) => item.name === board.structure);
  if (!board.structureId) {
    board.structureId = guessedStructure ? guessedStructure.id : "hero_journey";
  }
  board.structure = getStructureConfig(board.structureId).name;
  normalizeOrders(board.notes, board.structureId);
});
if (loadedBoards === null) {
  boards = DEMO_BOARD_DATA.map((demo) => createDemoBoardFromJson(demo));
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
renderStructureOptions("hero_journey");
renderStructurePhaseRows(["", "", ""]);
syncRouteToState(true);
