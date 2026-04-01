import { prepare, layout } from "@chenglou/pretext";
import {
  BUILTIN_NOTE_TYPES,
  BUILTIN_ARCHETYPES,
  BUILTIN_STRUCTURES,
  CUSTOM_ARCHETYPES_KEY,
  CUSTOM_NOTE_TYPES_KEY,
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
  loadJsonItem,
  loadBoards as loadBoardsFromStorage,
  loadCustomArchetypes as loadCustomArchetypesFromStorage,
  loadCustomStructures as loadCustomStructuresFromStorage,
  loadSettings as loadSettingsFromStorage,
  saveJsonItem,
  saveBoards as saveBoardsToStorage,
  saveCustomArchetypes as saveCustomArchetypesToStorage,
  saveCustomStructures as saveCustomStructuresToStorage,
  saveSettings as saveSettingsToStorage,
} from "./storage";
import {
  boardCardTemplate,
  columnMenuTemplate,
  noteTemplate,
  renderStructureOptionsHtml,
  structurePhaseRowTemplate,
} from "./ui-render";
import { createGroupModalController } from "./group-modals";
import { createNavigationController } from "./navigation";
import { createBoardInteractionsController } from "./board-interactions";
import { createBoardNoteActionsController } from "./board-note-actions";

const loadedBoards = loadBoards();
let boards = loadedBoards || [];
const GROUPS_KEY = "structurer.groups.v1";
let groups = loadGroups();
let currentBoardId = null;
let currentGroupId = null;
let boardBackGroupId = null;
let editingNoteId = null;
let boardActionsModalBoardId = null;
let customStructures = loadCustomStructures();
let customArchetypes = loadCustomArchetypes();
let customNoteTypes = loadCustomNoteTypes();
let pendingNoteTypeColorResolve = null;
const initialSettings = loadSettings();
let columnMinWidth = initialSettings.columnMinWidth ?? DEFAULT_COLUMN_WIDTH;
let wrapColumns = initialSettings.wrapColumns ?? true;

const landingView = document.querySelector("#landing-view");
const homeView = document.querySelector("#home-view");
const groupView = document.querySelector("#group-view");
const editorView = document.querySelector("#editor-view");
const groupsList = document.querySelector("#groups-list");
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
const modalRenameBoardBtn = document.querySelector("#modal-rename-board");
const modalAddBoardToGroupBtn = document.querySelector("#modal-add-board-to-group");
const modalExportBoardBtn = document.querySelector("#modal-export-board");
const modalDeleteBoardBtn = document.querySelector("#modal-delete-board");
const groupActionsModalOverlay = document.querySelector("#group-actions-modal-overlay");
const closeGroupActionsModalBtn = document.querySelector("#close-group-actions-modal");
const modalReorderGroupBoardsBtn = document.querySelector("#modal-reorder-group-boards");
const modalRemoveBoardFromGroupBtn = document.querySelector("#modal-remove-board-from-group");
const groupReorderModalOverlay = document.querySelector("#group-reorder-modal-overlay");
const closeGroupReorderModalBtn = document.querySelector("#close-group-reorder-modal");
const groupReorderListEl = document.querySelector("#group-reorder-list");
const groupReorderStatusEl = document.querySelector("#group-reorder-status");
const goLandingFromDashboardBtn = document.querySelector("#go-landing-from-dashboard");
const goDashboardFromBoardBtn = document.querySelector("#go-dashboard-from-board");
const goDashboardFromGroupBtn = document.querySelector("#go-dashboard-from-group");
const editorTitle = document.querySelector("#editor-title");
const structureNameEl = document.querySelector("#structure-name");
const groupTitleEl = document.querySelector("#group-title");
const groupSubtitleEl = document.querySelector("#group-subtitle");
const optionsButton = document.querySelector("#options-button");
const optionsMenu = document.querySelector("#options-menu");
const openResizeModalBtn = document.querySelector("#open-resize-modal");
const toggleWrapColumnsBtn = document.querySelector("#toggle-wrap-columns");
const resetPhaseOrderBtn = document.querySelector("#reset-phase-order");
const resetAppDataBtn = document.querySelector("#reset-app-data");
const resizeModalOverlay = document.querySelector("#resize-modal-overlay");
const closeResizeModalBtn = document.querySelector("#close-resize-modal");
const columnWidthSlider = document.querySelector("#column-width-slider");
const columnWidthValue = document.querySelector("#column-width-value");
const noteTypeColorModalOverlay = document.querySelector("#note-type-color-modal-overlay");
const noteTypeColorGrid = document.querySelector("#note-type-color-grid");
const cancelNoteTypeColorBtn = document.querySelector("#cancel-note-type-color");
const goDashboardBtn = document.querySelector("#go-dashboard");

const boardEl = document.querySelector("#board");
const groupBoardStackEl = document.querySelector("#group-board-stack");
const insightsEl = document.querySelector("#insights");

function loadBoards() {
  return loadBoardsFromStorage(STORAGE_KEY);
}

function saveBoards() {
  saveBoardsToStorage(STORAGE_KEY, boards);
}

function loadGroups() {
  const parsed = loadJsonItem(GROUPS_KEY, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.slug === "string" &&
      Array.isArray(item.boardIds),
  );
}

function saveGroups() {
  saveJsonItem(GROUPS_KEY, groups);
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

function loadCustomNoteTypes() {
  const parsed = loadJsonItem(CUSTOM_NOTE_TYPES_KEY, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.label === "string" &&
      typeof item.color === "string",
  );
}

function saveCustomNoteTypes() {
  saveJsonItem(CUSTOM_NOTE_TYPES_KEY, customNoteTypes);
}

function getAllNoteTypes() {
  return [...BUILTIN_NOTE_TYPES, ...customNoteTypes];
}

function noteTypeById(id) {
  return (
    getAllNoteTypes().find((item) => item.id === id) || {
      id,
      label: String(id || "note")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      color: "#f3f4f6",
    }
  );
}

function getNoteTypeColorPalette() {
  return [
    "#fde68a",
    "#fecaca",
    "#c7d2fe",
    "#bbf7d0",
    "#fed7aa",
    "#fbcfe8",
    "#d9f99d",
    "#bae6fd",
    "#e9d5ff",
    "#f5d0fe",
    "#fdba74",
    "#a7f3d0",
  ];
}

function getUsedNoteTypeColors() {
  return new Set(getAllNoteTypes().map((item) => String(item.color || "").toLowerCase()));
}

function createCustomNoteType(label, color) {
  const trimmed = label.trim();
  if (!trimmed) return null;
  const baseId = `custom_${slugifyTitle(trimmed)}`;
  let id = baseId;
  let suffix = 2;
  while (getAllNoteTypes().some((item) => item.id === id)) {
    id = `${baseId}_${suffix}`;
    suffix += 1;
  }
  const noteType = {
    id,
    label: trimmed,
    color: color || "#f3f4f6",
  };
  customNoteTypes.push(noteType);
  saveCustomNoteTypes();
  return noteType;
}

function openNoteTypeColorPicker() {
  if (!noteTypeColorModalOverlay || !noteTypeColorGrid) return Promise.resolve(null);
  const palette = getNoteTypeColorPalette();
  const used = getUsedNoteTypeColors();
  const available = palette.filter((color) => !used.has(color.toLowerCase()));
  const choices = available.length > 0 ? available : palette;
  noteTypeColorGrid.innerHTML = choices
    .map(
      (color, index) => `<button
      type="button"
      class="color-swatch ${index === 0 ? "selected" : ""}"
      data-role="pick-note-type-color"
      data-color="${color}"
      aria-label="Choose color ${color}"
      title="${color}"
      style="background:${color};"
    ></button>`,
    )
    .join("");
  noteTypeColorModalOverlay.classList.remove("hidden");
  return new Promise((resolve) => {
    pendingNoteTypeColorResolve = resolve;
  });
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

function ensureUniqueGroupSlug(baseSlug, excludedGroupId = null) {
  let slug = baseSlug;
  let suffix = 2;
  while (groups.some((group) => group.slug === slug && group.id !== excludedGroupId)) {
    slug = `${baseSlug}_${suffix}`;
    suffix += 1;
  }
  return slug;
}

function getCurrentBoard() {
  return boards.find((board) => board.id === currentBoardId) || null;
}

function getCurrentGroup() {
  return groups.find((group) => group.id === currentGroupId) || null;
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

function groupCardTemplate(group) {
  const boardTitles = group.boardIds
    .map((id) => boards.find((board) => board.id === id)?.title)
    .filter(Boolean);
  return `
    <article class="board-card" data-group-id="${group.id}" role="button" tabindex="0" aria-label="Open group ${group.title}">
      <div>
        <strong>${group.title}</strong>
        <div class="board-meta">
          <div class="board-meta-line">Group • ${group.boardIds.length} boards</div>
          <div class="board-meta-line">${boardTitles.length > 0 ? boardTitles.join(" • ") : "No boards yet"}</div>
          <div class="board-meta-line">Updated ${formatDate(group.updatedAt)}</div>
        </div>
      </div>
      <div class="board-actions">
        <button type="button" class="action-button" data-role="group-actions" aria-label="Group actions">
          <span class="action-icon" aria-hidden="true">⋯</span>
          <span class="action-label">Actions</span>
        </button>
      </div>
    </article>
  `;
}

function identityPhaseOrder(length) {
  return Array.from({ length }, (_, index) => index);
}

function isValidPhaseOrder(order, phaseCount) {
  if (!Array.isArray(order) || order.length !== phaseCount) return false;
  const unique = new Set(order);
  if (unique.size !== phaseCount) return false;
  return order.every((value) => Number.isInteger(value) && value >= 0 && value < phaseCount);
}

function getBoardPhaseOrder(board) {
  const phaseCount = getStructureConfig(board.structureId).phases.length;
  if (isValidPhaseOrder(board.phaseOrder, phaseCount)) return board.phaseOrder;
  return identityPhaseOrder(phaseCount);
}

function getBoardPhases(board) {
  const structure = getStructureConfig(board.structureId);
  const order = getBoardPhaseOrder(board);
  return order.map((phaseIndex) => structure.phases[phaseIndex]);
}

function reorderPhaseAndNotes(board, sourceIndex, targetIndex) {
  const phaseCount = getStructureConfig(board.structureId).phases.length;
  if (sourceIndex === targetIndex || sourceIndex < 0 || targetIndex < 0) return;
  if (sourceIndex >= phaseCount || targetIndex >= phaseCount) return;
  const oldOrder = getBoardPhaseOrder(board);
  const newOrder = [...oldOrder];
  const [moved] = newOrder.splice(sourceIndex, 1);
  newOrder.splice(targetIndex, 0, moved);
  applyPhaseOrder(board, newOrder);
}

function applyPhaseOrder(board, newOrder) {
  const phaseCount = getStructureConfig(board.structureId).phases.length;
  if (!isValidPhaseOrder(newOrder, phaseCount)) return;
  const oldOrder = getBoardPhaseOrder(board);
  const phaseIdToNewVisualIndex = new Map();
  newOrder.forEach((phaseId, visualIndex) => phaseIdToNewVisualIndex.set(phaseId, visualIndex));

  board.notes.forEach((note) => {
    const phaseId = oldOrder[note.column];
    if (phaseId === undefined) return;
    const nextColumn = phaseIdToNewVisualIndex.get(phaseId);
    if (Number.isInteger(nextColumn)) note.column = nextColumn;
  });
  normalizeOrders(board.notes, board.structureId);
  board.phaseOrder = newOrder;
}

function renderHome() {
  const validBoardIds = new Set(boards.map((board) => board.id));
  groups.forEach((group) => {
    group.boardIds = group.boardIds.filter((id) => validBoardIds.has(id));
  });
  saveGroups();

  const sortedGroups = [...groups].sort((a, b) => b.updatedAt - a.updatedAt);
  groupsList.innerHTML = sortedGroups.map(groupCardTemplate).join("");
  groupsList.style.display = sortedGroups.length > 0 ? "grid" : "none";

  const sortedBoards = [...boards].sort((a, b) => b.updatedAt - a.updatedAt);
  boardsList.innerHTML = sortedBoards
    .map((board) => {
      const structure = getStructureConfig(board.structureId);
      return boardCardTemplate(board, structure.name, formatDate(board.updatedAt));
    })
    .join("");
  emptyState.style.display = boards.length === 0 && groups.length === 0 ? "block" : "none";
}

function renderEditor() {
  const board = getCurrentBoard();
  if (!board) return;
  const structure = getStructureConfig(board.structureId);
  const phases = getBoardPhases(board);
  const archetypes = getAllArchetypes();
  const noteTypes = getAllNoteTypes();
  const editingId = editingNoteId;

  editorTitle.textContent = board.title;
  structureNameEl.textContent = structure.name;
  boardEl.innerHTML = phases
    .map((phase, columnIndex) => {
      const noteItems = getColumnNotes(board.notes, columnIndex);
      return `
      <section class="column" data-column="${columnIndex}">
        <div class="phase-head">
          <div class="phase-title-wrap">
            <button class="phase-drag" data-role="phase-drag-handle" title="Drag phase" draggable="true">⋮⋮</button>
            <h2 class="phase-title">${formatPhaseTitle(phase)}</h2>
          </div>
          <button class="phase-add" data-role="open-column-menu" title="Add note">+</button>
          ${columnMenuTemplate(columnIndex, archetypes, noteTypes)}
        </div>
        <div class="notes">${noteItems
          .map((note) =>
            noteTemplate(
              note,
              archetypes,
              archetypeById(note.archetype || "none"),
              noteTypeById(note.kind),
              note.id === editingId,
            ),
          )
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

  insightsEl.textContent = `Note #${note.id} | Type: ${noteTypeById(note.kind).label} | Estimated lines: ${
    metrics.lineCount
  } | Estimated height: ${Math.round(
    metrics.height,
  )}px | ${archetypeText}`;
}

const navigation = createNavigationController({
  views: { landingView, homeView, groupView, editorView },
  homeRoute: HOME_ROUTE,
  getBoards: () => boards,
  getGroups: () => groups,
  getCurrentBoardId: () => currentBoardId,
  setCurrentBoardId: (id) => {
    currentBoardId = id;
  },
  setCurrentGroupId: (id) => {
    currentGroupId = id;
  },
  setBoardBackGroupId: (id) => {
    boardBackGroupId = id;
  },
  clearEditingNoteId: () => {
    editingNoteId = null;
  },
  renderHome,
  renderEditor,
  renderGroup,
  renderInsights,
  applyColumnWidth,
  applyWrapColumns,
});

function showHome() {
  navigation.showHome();
}

function showLanding() {
  navigation.showLanding();
}

function showBoard(boardId) {
  navigation.showBoard(boardId);
}

function renderGroup() {
  const group = getCurrentGroup();
  if (!group) return;
  const groupBoards = group.boardIds.map((id) => boards.find((board) => board.id === id)).filter(Boolean);
  groupTitleEl.textContent = group.title;
  groupSubtitleEl.textContent = `${groupBoards.length} boards`;
  groupBoardStackEl.innerHTML = groupBoards
    .map((board) => {
      const structure = getStructureConfig(board.structureId);
      const phases = getBoardPhases(board);
      return `
      <section class="group-board-card">
        <header class="group-board-head">
          <div>
            <h2>${board.title}</h2>
            <p class="subtitle">${structure.name}</p>
          </div>
          <button class="ghost-button" data-role="open-board-from-group" data-board-id="${board.id}" type="button">Open board</button>
        </header>
        <section class="board wrap-columns group-board-preview">
          ${phases
            .map((phase, columnIndex) => {
              const noteItems = getColumnNotes(board.notes, columnIndex);
              return `
              <section class="column">
                <div class="phase-head">
                  <h2 class="phase-title">${formatPhaseTitle(phase)}</h2>
                </div>
                <div class="notes">
                  ${noteItems
                    .map((note) => {
                      const type = noteTypeById(note.kind);
                      const header =
                        note.kind === "character"
                          ? `${archetypeById(note.archetype || "none").label}${note.characterName ? ` - ${note.characterName}` : ""}`
                          : type.label;
                      return `<article class="note group-note-readonly" style="--note-bg:${type.color};">
                        <div class="note-head"><span class="badge">${header}</span></div>
                        <div class="group-note-text">${(note.text || "").trim() || "Empty note"}</div>
                      </article>`;
                    })
                    .join("")}
                </div>
              </section>
            `;
            })
            .join("")}
        </section>
      </section>
    `;
    })
    .join("");
}

function showGroup(groupId) {
  navigation.showGroup(groupId);
}

function touchBoard(board) {
  board.updatedAt = Date.now();
  saveBoards();
}

const groupModalController = createGroupModalController({
  elements: {
    groupActionsModalOverlay,
    closeGroupActionsModalBtn,
    modalReorderGroupBoardsBtn,
    modalRemoveBoardFromGroupBtn,
    groupReorderModalOverlay,
    closeGroupReorderModalBtn,
    groupReorderListEl,
    groupReorderStatusEl,
  },
  getGroups: () => groups,
  setGroups: (nextGroups) => {
    groups = nextGroups;
  },
  getBoards: () => boards,
  getCurrentGroupId: () => currentGroupId,
  saveGroups,
  renderHome,
  renderGroup,
  openHome,
});

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
    phaseOrder: identityPhaseOrder(structure.phases.length),
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
    collapsed: Boolean(note.collapsed),
  }));

  return {
    id: crypto.randomUUID(),
    title: demoData.title || "Demo Board",
    slug: ensureUniqueSlug(slugifyTitle(demoData.title || "demo_board")),
    structureId: structure.id,
    structure: structure.name,
    phaseOrder: isValidPhaseOrder(demoData.phaseOrder, structure.phases.length)
      ? [...demoData.phaseOrder]
      : identityPhaseOrder(structure.phases.length),
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
    phaseOrder: getBoardPhaseOrder(board),
    noteTypes: getAllNoteTypes(),
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
        collapsed: Boolean(note.collapsed),
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
  if (Array.isArray(parsed.noteTypes)) {
    parsed.noteTypes.forEach((type) => {
      if (!type || typeof type.id !== "string" || typeof type.label !== "string" || typeof type.color !== "string") {
        return;
      }
      if (BUILTIN_NOTE_TYPES.some((item) => item.id === type.id)) return;
      if (customNoteTypes.some((item) => item.id === type.id)) return;
      customNoteTypes.push({ id: type.id, label: type.label, color: type.color });
    });
    saveCustomNoteTypes();
  }
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
      collapsed: Boolean(note.collapsed),
    };
  });

  const newBoard = {
    id: crypto.randomUUID(),
    title,
    slug: ensureUniqueSlug(slugifyTitle(title)),
    structureId: structure.id,
    structure: structure.name,
    phaseOrder: isValidPhaseOrder(parsed.phaseOrder, structure.phases.length)
      ? [...parsed.phaseOrder]
      : identityPhaseOrder(structure.phases.length),
    nextNoteId: notes.length + 1,
    notes,
    updatedAt: Date.now(),
  };
  normalizeOrders(newBoard.notes, newBoard.structureId);
  boards.push(newBoard);
  saveBoards();
  renderHome();
}

function openBoard(boardId, replaceRoute = false, fromGroupId = null) {
  navigation.openBoard(boardId, replaceRoute, fromGroupId);
}

function openHome(replaceRoute = false) {
  navigation.openHome(replaceRoute);
}

function openLanding(replaceRoute = false) {
  navigation.openLanding(replaceRoute);
}

function openGroup(groupId, replaceRoute = false) {
  navigation.openGroup(groupId, replaceRoute);
}

function syncRouteToState(replaceRoute = true) {
  navigation.syncRouteToState(replaceRoute);
}

const boardInteractions = createBoardInteractionsController({
  boardEl,
  getCurrentBoard,
  getStructureConfig,
  getColumnNotes,
  reorderPhaseAndNotes,
  touchBoard,
  renderEditor,
  renderInsights,
  setEditingNoteId: (id) => {
    editingNoteId = id;
  },
});

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

groupsList.addEventListener("click", (event) => {
  const groupCard = event.target.closest("[data-group-id]");
  if (!groupCard) return;
  const actionButton = event.target.closest('button[data-role="group-actions"]');
  if (actionButton) {
    groupModalController.openGroupActionsModal(groupCard.dataset.groupId);
    return;
  }
  openGroup(groupCard.dataset.groupId);
});

groupsList.addEventListener("keydown", (event) => {
  const groupCard = event.target.closest("[data-group-id]");
  if (!groupCard) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openGroup(groupCard.dataset.groupId);
  }
});

goLandingFromDashboardBtn.addEventListener("click", () => {
  openLanding();
});

goDashboardFromBoardBtn.addEventListener("click", () => {
  if (boardBackGroupId && groups.some((group) => group.id === boardBackGroupId)) {
    openGroup(boardBackGroupId);
    return;
  }
  openHome();
});

goDashboardFromGroupBtn.addEventListener("click", () => {
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

groupBoardStackEl.addEventListener("click", (event) => {
  const openBtn = event.target.closest('[data-role="open-board-from-group"]');
  if (!openBtn) return;
  openBoard(openBtn.dataset.boardId, false, currentGroupId);
});

if (noteTypeColorGrid) {
  noteTypeColorGrid.addEventListener("click", (event) => {
    const btn = event.target.closest('[data-role="pick-note-type-color"]');
    if (!btn || !pendingNoteTypeColorResolve) return;
    const picked = btn.dataset.color;
    noteTypeColorModalOverlay.classList.add("hidden");
    const resolve = pendingNoteTypeColorResolve;
    pendingNoteTypeColorResolve = null;
    resolve(picked);
  });
}

if (cancelNoteTypeColorBtn) {
  cancelNoteTypeColorBtn.addEventListener("click", () => {
    noteTypeColorModalOverlay.classList.add("hidden");
    if (pendingNoteTypeColorResolve) {
      const resolve = pendingNoteTypeColorResolve;
      pendingNoteTypeColorResolve = null;
      resolve(null);
    }
  });
}

closeBoardActionsModalBtn.addEventListener("click", () => {
  closeBoardActionsModal();
});

modalExportBoardBtn.addEventListener("click", () => {
  const board = boards.find((item) => item.id === boardActionsModalBoardId);
  if (!board) return;
  downloadBoard(board);
  closeBoardActionsModal();
});

if (modalRenameBoardBtn) {
  modalRenameBoardBtn.addEventListener("click", () => {
    const board = boards.find((item) => item.id === boardActionsModalBoardId);
    if (!board) return;
    const nextTitle = window.prompt("Rename board:", board.title);
    if (nextTitle === null) return;
    const trimmed = nextTitle.trim();
    if (!trimmed) return;
    board.title = trimmed;
    board.slug = ensureUniqueSlug(slugifyTitle(trimmed), board.id);
    touchBoard(board);
    renderHome();
    closeBoardActionsModal();
  });
}

if (modalAddBoardToGroupBtn) {
  modalAddBoardToGroupBtn.addEventListener("click", () => {
    const board = boards.find((item) => item.id === boardActionsModalBoardId);
    if (!board) return;
    const hint = groups.length > 0 ? `Existing: ${groups.map((g) => g.title).join(", ")}` : "No groups yet.";
    const groupName = window.prompt(`Group name to add this board.\n${hint}`);
    if (!groupName) return;
    const trimmed = groupName.trim();
    if (!trimmed) return;
    let group = groups.find((item) => item.title.toLowerCase() === trimmed.toLowerCase());
    if (!group) {
      group = {
        id: crypto.randomUUID(),
        title: trimmed,
        slug: ensureUniqueGroupSlug(slugifyTitle(trimmed)),
        boardIds: [],
        updatedAt: Date.now(),
      };
      groups.push(group);
    }
    if (!group.boardIds.includes(board.id)) {
      group.boardIds.push(board.id);
    }
    group.updatedAt = Date.now();
    saveGroups();
    renderHome();
    closeBoardActionsModal();
  });
}

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

if (resetPhaseOrderBtn) {
  resetPhaseOrderBtn.addEventListener("click", () => {
    closeOptionsMenu();
    const board = getCurrentBoard();
    if (!board) return;
    applyPhaseOrder(board, identityPhaseOrder(getStructureConfig(board.structureId).phases.length));
    touchBoard(board);
    renderEditor();
  });
}

resetAppDataBtn.addEventListener("click", () => {
  closeOptionsMenu();
  const confirmed = window.confirm(
    "Reset all app data? This will delete all boards and settings, then reload the app.",
  );
  if (!confirmed) return;

  clearKeys([STORAGE_KEY, SETTINGS_KEY, CUSTOM_STRUCTURES_KEY, CUSTOM_ARCHETYPES_KEY, CUSTOM_NOTE_TYPES_KEY, GROUPS_KEY]);
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
const boardNoteActions = createBoardNoteActionsController({
  boardEl,
  boardInteractions,
  getCurrentBoard,
  getEditingNoteId: () => editingNoteId,
  setEditingNoteId: (id) => {
    editingNoteId = id;
  },
  normalizeOrders,
  touchBoard,
  renderEditor,
  renderInsights,
  createCustomArchetype,
  openNoteTypeColorPicker,
  createCustomNoteType,
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".options-wrap")) {
    closeOptionsMenu();
  }
  if (!event.target.closest(".phase-head")) {
    boardNoteActions.closeAllColumnMenus();
  }
  if (!event.target.closest(".note")) {
    if (editingNoteId !== null) {
      editingNoteId = null;
      renderEditor();
    }
  }
});

document.addEventListener("mouseup", () => {
  boardInteractions.clearPointerState();
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
  if (!isValidPhaseOrder(board.phaseOrder, getStructureConfig(board.structureId).phases.length)) {
    board.phaseOrder = identityPhaseOrder(getStructureConfig(board.structureId).phases.length);
  }
  normalizeOrders(board.notes, board.structureId);
});
if (loadedBoards === null) {
  boards = DEMO_BOARD_DATA.map((demo) => createDemoBoardFromJson(demo));
}
boards.forEach((board) => {
  const baseSlug = slugifyTitle(board.title || "board");
  board.slug = ensureUniqueSlug(board.slug || baseSlug, board.id);
});
groups.forEach((group) => {
  const baseSlug = slugifyTitle(group.title || "group");
  group.slug = ensureUniqueGroupSlug(group.slug || baseSlug, group.id);
  group.boardIds = group.boardIds.filter((boardId) => boards.some((board) => board.id === boardId));
});
saveBoards();
saveGroups();
window.addEventListener("popstate", () => {
  syncRouteToState(false);
});
applyColumnWidth();
applyWrapColumns();
applyDevFlags();
renderStructureOptions("hero_journey");
renderStructurePhaseRows(["", "", ""]);
syncRouteToState(true);
