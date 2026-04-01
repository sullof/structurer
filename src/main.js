import {
  BUILTIN_NOTE_TYPES,
  BUILTIN_ARCHETYPES,
  BUILTIN_STRUCTURES,
  CUSTOM_ARCHETYPES_KEY,
  CUSTOM_NOTE_TYPES_KEY,
  NOTE_TYPE_OVERRIDES_KEY,
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
import packageJson from "../package.json";

const loadedBoards = loadBoards();
let boards = loadedBoards || [];
const GROUPS_KEY = "structurer.groups.v1";
const DEMO_BOARD_IDS_KEY = "structurer.demoBoardIds.v1";
const issuedUids = new Set();
let groups = loadGroups();
let demoBoardIds = loadDemoBoardIds();
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
let showDemoBoards = initialSettings.showDemoBoards ?? true;

const landingView = document.querySelector("#landing-view");
const homeView = document.querySelector("#home-view");
const helpView = document.querySelector("#help-view");
const groupView = document.querySelector("#group-view");
const editorView = document.querySelector("#editor-view");
const groupsList = document.querySelector("#groups-list");
const boardsList = document.querySelector("#boards-list");
const dashboardGroupsHeading = document.querySelector("#dashboard-groups-heading");
const dashboardBoardsHeading = document.querySelector("#dashboard-boards-heading");
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
const addBoardToGroupModalOverlay = document.querySelector("#add-board-to-group-modal-overlay");
const addBoardToGroupListEl = document.querySelector("#add-board-to-group-list");
const closeAddBoardToGroupModalBtn = document.querySelector("#close-add-board-to-group-modal");
const createGroupForm = document.querySelector("#create-group-form");
const createGroupNameInput = document.querySelector("#create-group-name");
const createGroupBoardsListEl = document.querySelector("#create-group-boards-list");
const createGroupBoardsEmptyEl = document.querySelector("#create-group-boards-empty");
const modalExportBoardBtn = document.querySelector("#modal-export-board");
const modalDeleteBoardBtn = document.querySelector("#modal-delete-board");
const groupActionsModalOverlay = document.querySelector("#group-actions-modal-overlay");
const closeGroupActionsModalBtn = document.querySelector("#close-group-actions-modal");
const modalReorderGroupBoardsBtn = document.querySelector("#modal-reorder-group-boards");
const modalRemoveBoardFromGroupBtn = document.querySelector("#modal-remove-board-from-group");
const modalDeleteGroupBtn = document.querySelector("#modal-delete-group");
const groupReorderModalOverlay = document.querySelector("#group-reorder-modal-overlay");
const closeGroupReorderModalBtn = document.querySelector("#close-group-reorder-modal");
const groupReorderListEl = document.querySelector("#group-reorder-list");
const groupReorderStatusEl = document.querySelector("#group-reorder-status");
const phaseOrderConflictModalOverlay = document.querySelector("#phase-order-conflict-modal-overlay");
const closePhaseOrderConflictModalBtn = document.querySelector("#close-phase-order-conflict-modal");
const phaseOrderConflictTitleEl = document.querySelector("#phase-order-conflict-title");
const phaseOrderCurrentListEl = document.querySelector("#phase-order-current-list");
const phaseOrderImportedListEl = document.querySelector("#phase-order-imported-list");
const phaseOrderConflictHintEl = document.querySelector("#phase-order-conflict-hint");
const goLandingFromDashboardBtn = document.querySelector("#go-landing-from-dashboard");
const goHelpBtn = document.querySelector("#go-help");
const goHelpFromDashboardBtn = document.querySelector("#go-help-from-dashboard");
const goDashboardFromHelpBtn = document.querySelector("#go-dashboard-from-help");
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
const editorBoardActionsBtn = document.querySelector("#editor-board-actions-btn");
const groupViewActionsBtn = document.querySelector("#group-view-actions-btn");
const modalEditNoteTypesBtn = document.querySelector("#modal-edit-note-types");
const modalResetPhaseOrderBtn = document.querySelector("#modal-reset-phase-order");
const resetDemoDataBtn = document.querySelector("#reset-demo-data");
const resetAppDataBtn = document.querySelector("#reset-app-data");
const resizeModalOverlay = document.querySelector("#resize-modal-overlay");
const closeResizeModalBtn = document.querySelector("#close-resize-modal");
const columnWidthSlider = document.querySelector("#column-width-slider");
const columnWidthValue = document.querySelector("#column-width-value");
const noteTypeColorModalOverlay = document.querySelector("#note-type-color-modal-overlay");
const noteTypeColorGrid = document.querySelector("#note-type-color-grid");
const cancelNoteTypeColorBtn = document.querySelector("#cancel-note-type-color");
const editNoteTypesModalOverlay = document.querySelector("#edit-note-types-modal-overlay");
const editNoteTypesListEl = document.querySelector("#edit-note-types-list");
const cancelEditNoteTypesBtn = document.querySelector("#cancel-edit-note-types");
const saveEditNoteTypesBtn = document.querySelector("#save-edit-note-types");
const goDashboardBtn = document.querySelector("#go-dashboard");

const boardEl = document.querySelector("#board");
const groupBoardStackEl = document.querySelector("#group-board-stack");
const homeListControlsEl = document.querySelector(".home-list-controls");
const toggleDemoVisibilityBtn = document.querySelector("#toggle-demo-visibility");
const homeCollapsiblePanels = [...document.querySelectorAll("#home-view .collapsible-panel")];
let addBoardToGroupTargetBoardId = null;

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

function loadDemoBoardIds() {
  const parsed = loadJsonItem(DEMO_BOARD_IDS_KEY, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((id) => typeof id === "string");
}

function saveDemoBoardIds() {
  saveJsonItem(DEMO_BOARD_IDS_KEY, demoBoardIds);
}

function generateShortUid(length = 8) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += alphabet[bytes[index] % alphabet.length];
  }
  return value;
}

function hasUidInData(uid) {
  if (boards.some((board) => board.uid === uid || (board.notes || []).some((note) => note.uid === uid))) return true;
  if (groups.some((group) => group.uid === uid)) return true;
  if (customStructures.some((item) => item.uid === uid)) return true;
  if (customArchetypes.some((item) => item.uid === uid)) return true;
  if (customNoteTypes.some((item) => item.uid === uid)) return true;
  return false;
}

function generateUniqueUid() {
  let uid = generateShortUid();
  while (hasUidInData(uid) || issuedUids.has(uid)) {
    uid = generateShortUid();
  }
  issuedUids.add(uid);
  return uid;
}

function loadSettings() {
  return loadSettingsFromStorage(SETTINGS_KEY);
}

function saveSettings() {
  saveSettingsToStorage(SETTINGS_KEY, { columnMinWidth, wrapColumns, showDemoBoards });
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

function isValidHexColor(s) {
  if (typeof s !== "string") return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(s.trim());
}

function normalizeHexColor(s) {
  const t = s.trim();
  const shortForm = /^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/;
  const m = t.match(shortForm);
  if (m) {
    return `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}`.toLowerCase();
  }
  return t.toLowerCase();
}

function parseHexColorInput(raw) {
  let t = String(raw ?? "").trim();
  if (!t) return null;
  if (!t.startsWith("#")) t = `#${t}`;
  if (!isValidHexColor(t)) return null;
  return normalizeHexColor(t);
}

function loadNoteTypeOverrides() {
  const parsed = loadJsonItem(NOTE_TYPE_OVERRIDES_KEY, {});
  if (!parsed || typeof parsed !== "object") return {};
  const out = {};
  for (const [id, ov] of Object.entries(parsed)) {
    if (typeof id !== "string" || !ov || typeof ov !== "object") continue;
    const entry = {};
    if (typeof ov.label === "string" && ov.label.trim()) entry.label = ov.label.trim();
    if (typeof ov.color === "string" && isValidHexColor(ov.color)) entry.color = normalizeHexColor(ov.color);
    if (Object.keys(entry).length) out[id] = entry;
  }
  return out;
}

let noteTypeOverrides = loadNoteTypeOverrides();

function saveNoteTypeOverrides() {
  saveJsonItem(NOTE_TYPE_OVERRIDES_KEY, noteTypeOverrides);
}

function applyBuiltinOverrides(base) {
  const ov = noteTypeOverrides[base.id];
  if (!ov) return { ...base };
  return {
    ...base,
    label: typeof ov.label === "string" && ov.label.trim() ? ov.label.trim() : base.label,
    color: typeof ov.color === "string" && isValidHexColor(ov.color) ? normalizeHexColor(ov.color) : base.color,
  };
}

function getAllNoteTypes() {
  return [...BUILTIN_NOTE_TYPES.map(applyBuiltinOverrides), ...customNoteTypes];
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
    uid: generateUniqueUid(),
    label: trimmed,
    color: color || "#f3f4f6",
    updatedAt: Date.now(),
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
  return isFlagEnabled(DEV_RESET_FLAG_KEY) || isFlagEnabled("activate-reset");
}

function applyDevFlags() {
  const visible = isDevResetEnabled() ? "inline-block" : "none";
  if (resetAppDataBtn) resetAppDataBtn.style.display = visible;
  if (resetDemoDataBtn) resetDemoDataBtn.style.display = visible;
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

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function syncEditNoteTypeRowSwatches(row) {
  const hexInput = row.querySelector(".edit-note-type-hex-input");
  const preview = row.querySelector(".edit-note-type-swatch-preview");
  if (!hexInput || !preview) return;
  const parsed = parseHexColorInput(hexInput.value);
  if (parsed) {
    preview.style.backgroundColor = parsed;
    hexInput.value = parsed;
  }
  row.querySelectorAll(".color-swatch").forEach((btn) => {
    const c = btn.dataset.color;
    btn.classList.toggle("selected", Boolean(parsed && normalizeHexColor(c) === parsed));
  });
}

function isNoteTypeInUse(typeId) {
  return boards.some((board) => board.notes.some((note) => note.kind === typeId));
}

function fillEditNoteTypesModal() {
  if (!editNoteTypesListEl) return;
  const types = getAllNoteTypes();
  const palette = getNoteTypeColorPalette();
  const paletteHtml = palette
    .map(
      (color) =>
        `<button type="button" class="color-swatch" data-role="edit-note-type-swatch" data-color="${color}" aria-label="Pick ${color}" title="${color}" style="background:${color};"></button>`,
    )
    .join("");
  editNoteTypesListEl.innerHTML = types
    .map((t) => {
      const isBuiltin = BUILTIN_NOTE_TYPES.some((b) => b.id === t.id);
      const canDeleteCustom = !isBuiltin && !isNoteTypeInUse(t.id);
      const idLabel = isBuiltin ? `Built-in · ${t.id}` : `Custom · ${t.id}`;
      const baseColor = isValidHexColor(t.color) ? t.color : "#f3f4f6";
      const currentColor = normalizeHexColor(baseColor);
      const safeId = escapeHtml(t.id);
      return `
      <div class="edit-note-type-row" data-note-type-id="${safeId}" data-is-builtin="${isBuiltin}">
        <p class="edit-note-type-row-title">${escapeHtml(idLabel)}</p>
        <div class="edit-note-type-fields">
          <div class="edit-note-type-label-field">
            <label for="ntl-${safeId}">Label</label>
            <input id="ntl-${safeId}" class="edit-note-type-label-input" type="text" maxlength="80" value="${escapeHtml(t.label)}" />
          </div>
          <div class="edit-note-type-hex-field">
            <label for="ntc-${safeId}">Color (hex)</label>
            <div class="edit-note-type-hex-row">
              <input id="ntc-${safeId}" class="edit-note-type-hex-input" type="text" value="${escapeHtml(currentColor)}" placeholder="#RRGGBB or #RGB" autocomplete="off" />
              <span class="edit-note-type-swatch-preview" style="background-color:${escapeHtml(currentColor)}"></span>
            </div>
          </div>
          <div class="color-grid color-grid--edit-row">${paletteHtml}</div>
          ${
            canDeleteCustom
              ? `<div class="edit-note-type-row-delete"><button type="button" class="ghost-button danger-menu-item" data-role="delete-custom-note-type" data-note-type-id="${safeId}">Delete this type</button></div>`
              : ""
          }
        </div>
      </div>`;
    })
    .join("");

  editNoteTypesListEl.querySelectorAll(".edit-note-type-row").forEach((row) => {
    syncEditNoteTypeRowSwatches(row);
  });
}

function openEditNoteTypesModal() {
  if (!editNoteTypesModalOverlay) return;
  fillEditNoteTypesModal();
  editNoteTypesModalOverlay.classList.remove("hidden");
}

function closeEditNoteTypesModal() {
  if (!editNoteTypesModalOverlay) return;
  editNoteTypesModalOverlay.classList.add("hidden");
}

function saveEditNoteTypesFromModal() {
  if (!editNoteTypesListEl) return;
  const rows = editNoteTypesListEl.querySelectorAll(".edit-note-type-row");
  for (const row of rows) {
    const id = row.dataset.noteTypeId;
    const labelInput = row.querySelector(".edit-note-type-label-input");
    const hexInput = row.querySelector(".edit-note-type-hex-input");
    const label = labelInput.value.trim();
    const color = parseHexColorInput(hexInput.value);
    if (!label) {
      window.alert(`Please enter a label for note type "${id}".`);
      labelInput.focus();
      return;
    }
    if (!color) {
      window.alert(`Please enter a valid hex color for "${label}" (e.g. #fef08a or #rgb).`);
      hexInput.focus();
      return;
    }
    const isBuiltin = row.dataset.isBuiltin === "true";
    if (isBuiltin) {
      noteTypeOverrides[id] = { label, color };
    } else {
      const ct = customNoteTypes.find((item) => item.id === id);
      if (ct) {
        ct.label = label;
        ct.color = color;
        ct.updatedAt = Date.now();
      }
    }
  }
  saveNoteTypeOverrides();
  saveCustomNoteTypes();
  closeEditNoteTypesModal();
  renderEditor();
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
    uid: generateUniqueUid(),
    icon: "✨",
    label: trimmed,
    updatedAt: Date.now(),
  };
  customArchetypes.push(archetype);
  saveCustomArchetypes();
  return archetype;
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

function migrateUniqueUids() {
  let changed = false;
  const now = Date.now();

  boards.forEach((board) => {
    if (typeof board.uid !== "string" || !board.uid) {
      board.uid = generateUniqueUid();
      changed = true;
    }
    if (!Number.isFinite(board.updatedAt)) {
      board.updatedAt = now;
      changed = true;
    }
    (board.notes || []).forEach((note) => {
      if (typeof note.uid !== "string" || !note.uid) {
        note.uid = generateUniqueUid();
        changed = true;
      }
      if (!Number.isFinite(note.updatedAt)) {
        note.updatedAt = board.updatedAt || now;
        changed = true;
      }
    });
  });

  groups.forEach((group) => {
    if (typeof group.uid !== "string" || !group.uid) {
      group.uid = generateUniqueUid();
      changed = true;
    }
    if (!Number.isFinite(group.updatedAt)) {
      group.updatedAt = now;
      changed = true;
    }
  });

  customStructures.forEach((item) => {
    if (typeof item.uid !== "string" || !item.uid) {
      item.uid = generateUniqueUid();
      changed = true;
    }
    if (!Number.isFinite(item.updatedAt)) {
      item.updatedAt = now;
      changed = true;
    }
  });

  customArchetypes.forEach((item) => {
    if (typeof item.uid !== "string" || !item.uid) {
      item.uid = generateUniqueUid();
      changed = true;
    }
    if (!Number.isFinite(item.updatedAt)) {
      item.updatedAt = now;
      changed = true;
    }
  });

  customNoteTypes.forEach((item) => {
    if (typeof item.uid !== "string" || !item.uid) {
      item.uid = generateUniqueUid();
      changed = true;
    }
    if (!Number.isFinite(item.updatedAt)) {
      item.updatedAt = now;
      changed = true;
    }
  });

  if (changed) {
    saveBoards();
    saveGroups();
    saveCustomStructures();
    saveCustomArchetypes();
    saveCustomNoteTypes();
  }
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function formatPhaseTitle(phase) {
  return String(phase || "").trim();
}

function renderCreateGroupBoardCheckboxes() {
  if (!createGroupBoardsListEl || !createGroupBoardsEmptyEl) return;
  const sorted = [...boards].sort((a, b) => b.updatedAt - a.updatedAt);
  if (sorted.length === 0) {
    createGroupBoardsListEl.innerHTML = "";
    createGroupBoardsEmptyEl.classList.remove("hidden");
    return;
  }
  createGroupBoardsEmptyEl.classList.add("hidden");
  createGroupBoardsListEl.innerHTML = sorted
    .map(
      (board) => `
    <label class="create-group-board-row">
      <input type="checkbox" name="create-group-board" value="${board.id}" />
      <span>${escapeHtml(board.title)}</span>
    </label>`,
    )
    .join("");
}

function groupCardTemplate(group) {
  const boardTitles = group.boardIds
    .map((id) => boards.find((board) => board.id === id)?.title)
    .filter(Boolean);
  const boardListHtml =
    boardTitles.length > 0
      ? `<ul class="group-board-list">${boardTitles
          .map((title) => `<li class="group-board-list-item">${escapeHtml(title)}</li>`)
          .join("")}</ul>`
      : `<div class="board-meta-line">No boards yet</div>`;
  return `
    <article class="board-card" data-group-id="${group.id}" role="button" tabindex="0" aria-label="Open group ${group.title}">
      <div>
        <strong>${group.title}</strong>
        <div class="board-meta">
          <div class="board-meta-line">Group • ${group.boardIds.length} boards</div>
          ${boardListHtml}
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

function isPhaseOrderModified(board) {
  if (!board) return false;
  const structure = getStructureConfig(board.structureId);
  const defaultOrder = identityPhaseOrder(structure.phases.length);
  const currentOrder = getBoardPhaseOrder(board);
  return currentOrder.some((phaseIndex, index) => phaseIndex !== defaultOrder[index]);
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
  const now = Date.now();
  newOrder.forEach((phaseId, visualIndex) => phaseIdToNewVisualIndex.set(phaseId, visualIndex));

  board.notes.forEach((note) => {
    const phaseId = oldOrder[note.column];
    if (phaseId === undefined) return;
    const nextColumn = phaseIdToNewVisualIndex.get(phaseId);
    if (Number.isInteger(nextColumn)) {
      note.column = nextColumn;
      note.updatedAt = now;
    }
  });
  normalizeOrders(board.notes, board.structureId);
  board.phaseOrder = newOrder;
}

function renderHome() {
  const validBoardIds = new Set(boards.map((board) => board.id));
  demoBoardIds = demoBoardIds.filter((id) => validBoardIds.has(id));
  saveDemoBoardIds();
  groups.forEach((group) => {
    group.boardIds = group.boardIds.filter((id) => validBoardIds.has(id));
  });
  saveGroups();

  const sortedGroups = [...groups].sort((a, b) => b.updatedAt - a.updatedAt);
  groupsList.innerHTML = sortedGroups.map(groupCardTemplate).join("");
  groupsList.style.display = sortedGroups.length > 0 ? "grid" : "none";

  const sortedBoards = [...boards]
    .filter((board) => showDemoBoards || !isDemoBoard(board))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  boardsList.innerHTML = sortedBoards
    .map((board) => {
      const structure = getStructureConfig(board.structureId);
      return boardCardTemplate(board, structure.name, formatDate(board.updatedAt));
    })
    .join("");
  if (homeListControlsEl) {
    boardsList.appendChild(homeListControlsEl);
  }
  if (dashboardGroupsHeading) {
    dashboardGroupsHeading.classList.toggle("hidden", sortedGroups.length === 0);
  }
  if (dashboardBoardsHeading) {
    dashboardBoardsHeading.classList.toggle("hidden", sortedBoards.length === 0);
  }
  emptyState.style.display = sortedBoards.length === 0 && sortedGroups.length === 0 ? "block" : "none";
  applyDemoVisibilityControl();
  renderCreateGroupBoardCheckboxes();
}

function renderEditor() {
  const board = getCurrentBoard();
  if (!board) return;
  const structure = getStructureConfig(board.structureId);
  const phases = getBoardPhases(board);
  const archetypes = getAllArchetypes();
  const noteTypes = getAllNoteTypes();
  const editingId = editingNoteId;
  const isModifiedOrder = isPhaseOrderModified(board);

  editorTitle.textContent = board.title;
  structureNameEl.textContent = isModifiedOrder ? `${structure.name} (modified)` : structure.name;
  boardEl.innerHTML = phases
    .map((phase, columnIndex) => {
      const noteItems = getColumnNotes(board.notes, columnIndex);
      const emptyClass = noteItems.length === 0 ? " column-empty" : "";
      return `
      <section class="column${emptyClass}" data-column="${columnIndex}">
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

const navigation = createNavigationController({
  views: { landingView, homeView, helpView, groupView, editorView },
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
  applyColumnWidth,
  applyWrapColumns,
});

function showHome() {
  navigation.showHome();
}

function showLanding() {
  navigation.showLanding();
}

function showHelp() {
  navigation.showHelp();
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
          <div class="group-board-head-actions">
            <button class="ghost-button" data-role="open-board-from-group" data-board-id="${board.id}" type="button">Edit board</button>
          </div>
        </header>
        <section class="board wrap-columns group-board-preview">
          ${phases
            .map((phase, columnIndex) => {
              const noteItems = getColumnNotes(board.notes, columnIndex);
              const emptyClass = noteItems.length === 0 ? " column-empty" : "";
              return `
              <section class="column${emptyClass}">
                <div class="phase-head">
                  <h2 class="phase-title">${formatPhaseTitle(phase)}</h2>
                </div>
                <div class="notes">
                  ${noteItems
                    .map((note) => {
                      const type = noteTypeById(note.kind);
                      const archetype = archetypeById(note.archetype || "none");
                      const textPreview = (note.text || "").trim();
                      const characterLabel =
                        note.kind === "character"
                          ? [archetype?.label || "", note.characterName || ""]
                              .map((part) => part.trim())
                              .filter(Boolean)
                              .join(" - ") || "Character"
                          : "";
                      const collapsedPreview =
                        note.kind === "character"
                          ? characterLabel || textPreview || "Character note"
                          : textPreview || "Empty note";
                      const header =
                        note.kind === "character"
                          ? `${archetype.label}${note.characterName ? ` - ${note.characterName}` : ""}`
                          : type.label;
                      const collapsed = Boolean(note.collapsed);
                      return `<article class="note group-note-readonly${collapsed ? " is-collapsed" : ""}" data-note-id="${
                        note.id
                      }" data-board-id="${board.id}" style="--note-bg:${type.color};">
                        <div class="note-head">
                          ${
                            collapsed
                              ? `<div class="collapsed-preview" title="${escapeHtml(collapsedPreview)}">${escapeHtml(
                                  collapsedPreview,
                                )}</div>`
                              : `<span class="badge">${escapeHtml(header)}</span>`
                          }
                        </div>
                        ${
                          collapsed
                            ? ""
                            : `<div class="group-note-text">${escapeHtml((note.text || "").trim() || "Empty note")}</div>`
                        }
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
    modalDeleteGroupBtn,
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
  openGroup,
});

function createBoard(title, structureId = "hero_journey") {
  const baseSlug = slugifyTitle(title);
  const slug = ensureUniqueSlug(baseSlug);
  const structure = getStructureConfig(structureId);
  const newBoard = {
    id: crypto.randomUUID(),
    uid: generateUniqueUid(),
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
    uid: typeof note.uid === "string" ? note.uid : generateUniqueUid(),
    kind: note.kind || "plot",
    column: Number.isInteger(note.column) ? note.column : 0,
    order: Number.isInteger(note.order) ? note.order : index,
    text: note.text || "",
    characterName: note.characterName || "",
    archetype: note.archetype || "none",
    collapsed: Boolean(note.collapsed),
    updatedAt: Number.isFinite(note.updatedAt) ? note.updatedAt : Date.now(),
  }));

  return {
    id: crypto.randomUUID(),
    uid: typeof demoData.uid === "string" ? demoData.uid : generateUniqueUid(),
    title: demoData.title || "Demo Board",
    slug: ensureUniqueSlug(slugifyTitle(demoData.title || "demo_board")),
    structureId: structure.id,
    structure: structure.name,
    phaseOrder: isValidPhaseOrder(demoData.phaseOrder, structure.phases.length)
      ? [...demoData.phaseOrder]
      : identityPhaseOrder(structure.phases.length),
    nextNoteId: notes.length + 1,
    notes,
    isDemo: true,
    updatedAt: Number.isFinite(demoData.updatedAt) ? demoData.updatedAt : Date.now(),
  };
}

function isLikelyDemoBoard(board) {
  if (!board) return false;
  if (board.isDemo === true) return true;
  const boardSlug = board.slug || slugifyTitle(board.title || "");
  return DEMO_BOARD_DATA.some((demo) => {
    const demoSlug = slugifyTitle(demo.title || "");
    return demoSlug === boardSlug && demo.structure === board.structure;
  });
}

function isDemoBoard(board) {
  if (!board) return false;
  if (demoBoardIds.includes(board.id)) return true;
  return isLikelyDemoBoard(board);
}

function applyDemoVisibilityControl() {
  if (!toggleDemoVisibilityBtn) return;
  toggleDemoVisibilityBtn.textContent = showDemoBoards ? "Hide demos" : "Show demos";
}

function replaceDemoBoardsOnly() {
  const currentDemoIds = new Set(
    boards
      .filter((board) => demoBoardIds.includes(board.id) || isLikelyDemoBoard(board))
      .map((board) => board.id),
  );
  boards = boards.filter((board) => !currentDemoIds.has(board.id));
  const createdDemoBoards = [];
  DEMO_BOARD_DATA.forEach((demo) => {
    const board = createDemoBoardFromJson(demo);
    boards.push(board);
    createdDemoBoards.push(board);
  });
  demoBoardIds = createdDemoBoards.map((board) => board.id);
  saveDemoBoardIds();
  const validBoardIds = new Set(boards.map((board) => board.id));
  groups = groups
    .map((group) => ({
      ...group,
      boardIds: group.boardIds.filter((id) => validBoardIds.has(id)),
    }))
    .filter((group) => group.boardIds.length > 0);
  saveGroups();
  saveBoards();
}

function boardToExportPayload(board) {
  const structure = getStructureConfig(board.structureId);
  const usedNoteTypeIds = new Set(board.notes.map((note) => note.kind || "plot"));
  const usedArchetypeIds = new Set(
    board.notes
      .filter((note) => note.kind === "character")
      .map((note) => note.archetype || "none"),
  );
  const exportedNoteTypes = getAllNoteTypes().filter(
    (type) => usedNoteTypeIds.has(type.id) && !BUILTIN_NOTE_TYPES.some((builtin) => builtin.id === type.id),
  );
  const exportedArchetypes = getAllArchetypes().filter(
    (archetype) =>
      usedArchetypeIds.has(archetype.id) && !BUILTIN_ARCHETYPES.some((builtin) => builtin.id === archetype.id),
  );
  return {
    uid: board.uid,
    updatedAt: board.updatedAt,
    title: board.title,
    structure: structure.name,
    phaseOrder: getBoardPhaseOrder(board),
    noteTypes: exportedNoteTypes,
    archetypes: exportedArchetypes,
    notes: [...board.notes]
      .sort((a, b) => (a.column - b.column) || ((a.order || 0) - (b.order || 0)))
      .map((note) => ({
        uid: note.uid,
        updatedAt: note.updatedAt,
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

function groupsEligibleForBoard(boardId) {
  const board = boards.find((b) => b.id == boardId);
  if (!board) return [];
  return groups.filter((g) => !g.boardIds.some((bid) => bid == board.id));
}

function openBoardActionsModal(boardId) {
  boardActionsModalBoardId = boardId;
  boardActionsModalOverlay.classList.remove("hidden");
  const board = boards.find((b) => b.id == boardId);
  if (modalAddBoardToGroupBtn) {
    const eligible = groupsEligibleForBoard(boardId);
    modalAddBoardToGroupBtn.disabled = groups.length === 0 || eligible.length === 0;
    if (groups.length === 0) {
      modalAddBoardToGroupBtn.title = "Create a group first";
    } else if (eligible.length === 0) {
      modalAddBoardToGroupBtn.title = "This board is already in every group";
    } else {
      modalAddBoardToGroupBtn.title = "";
    }
  }
  if (modalResetPhaseOrderBtn) {
    const canReset = Boolean(board && isPhaseOrderModified(board));
    modalResetPhaseOrderBtn.disabled = !canReset;
    modalResetPhaseOrderBtn.title = canReset ? "" : "Phase order already matches the structure";
  }
}

function closeAddBoardToGroupModal() {
  if (addBoardToGroupModalOverlay) addBoardToGroupModalOverlay.classList.add("hidden");
  addBoardToGroupTargetBoardId = null;
  const emptyEl = document.querySelector("#add-board-to-group-empty");
  if (emptyEl) {
    emptyEl.classList.add("hidden");
    emptyEl.textContent = "";
  }
  const introEl = document.querySelector("#add-board-to-group-modal-overlay .add-board-to-group-intro");
  if (introEl) introEl.classList.remove("hidden");
  if (addBoardToGroupListEl) {
    addBoardToGroupListEl.classList.remove("hidden");
  }
}

function openAddBoardToGroupModal(boardId) {
  if (!addBoardToGroupModalOverlay || !addBoardToGroupListEl) return;
  if (groups.length === 0) return;
  addBoardToGroupTargetBoardId = boardId;
  const eligible = groupsEligibleForBoard(boardId);
  const emptyEl = document.querySelector("#add-board-to-group-empty");
  const sorted = [...eligible].sort((a, b) => b.updatedAt - a.updatedAt);
  if (sorted.length === 0) {
    addBoardToGroupListEl.innerHTML = "";
    addBoardToGroupListEl.classList.add("hidden");
    const introEl = document.querySelector("#add-board-to-group-modal-overlay .add-board-to-group-intro");
    if (introEl) introEl.classList.add("hidden");
    if (emptyEl) {
      emptyEl.textContent =
        "This board is already in every group. Create a new group from the dashboard, or remove the board from a group first.";
      emptyEl.classList.remove("hidden");
    }
  } else {
    const introEl = document.querySelector("#add-board-to-group-modal-overlay .add-board-to-group-intro");
    if (introEl) introEl.classList.remove("hidden");
    if (emptyEl) emptyEl.classList.add("hidden");
    addBoardToGroupListEl.classList.remove("hidden");
    addBoardToGroupListEl.innerHTML = sorted
      .map(
        (group) => `
    <button type="button" class="ghost-button group-picker-item" data-group-id="${group.id}">
      ${escapeHtml(group.title)} <span class="board-meta">(${group.boardIds.length} boards)</span>
    </button>`,
      )
      .join("");
  }
  addBoardToGroupModalOverlay.classList.remove("hidden");
}

function closePhaseOrderConflictModal() {
  if (phaseOrderConflictModalOverlay) phaseOrderConflictModalOverlay.classList.add("hidden");
}

function openPhaseOrderConflictModal(payload) {
  if (
    !phaseOrderConflictModalOverlay ||
    !phaseOrderConflictTitleEl ||
    !phaseOrderCurrentListEl ||
    !phaseOrderImportedListEl
  ) {
    return;
  }
  const currentOrder = payload?.currentOrder || [];
  const importedOrder = payload?.importedOrder || [];
  const firstMismatchIndex = currentOrder.findIndex((item, index) => item !== importedOrder[index]);
  const renderList = (items, mismatchIndex) =>
    items
      .map((item, index) => {
        const indexLabel = String(index + 1).padStart(2, "0");
        const mismatchClass = index === mismatchIndex ? "is-first-mismatch" : "";
        return `<li class="phase-order-item ${mismatchClass}">
          <span class="phase-order-index">${indexLabel}</span>
          <span>${item}</span>
        </li>`;
      })
      .join("");

  phaseOrderConflictTitleEl.textContent = payload?.boardTitle ? `Board: ${payload.boardTitle}` : "";
  phaseOrderCurrentListEl.innerHTML = renderList(currentOrder, firstMismatchIndex);
  phaseOrderImportedListEl.innerHTML = renderList(importedOrder, firstMismatchIndex);
  if (phaseOrderConflictHintEl) {
    phaseOrderConflictHintEl.textContent =
      "Please manually align the current board phase order, then repeat the import.";
  }
  phaseOrderConflictModalOverlay.classList.remove("hidden");
}

function importBoardFromJson(rawText) {
  const parsed = JSON.parse(rawText);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.notes)) {
    throw new Error("Invalid board JSON format.");
  }

  const normalizeKey = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

  const structureEntry = getAllStructureList().find((item) => item.name === parsed.structure);
  const structure = structureEntry || BUILTIN_STRUCTURES.hero_journey;
  const noteTypeIdMap = new Map();
  const archetypeIdMap = new Map();

  if (Array.isArray(parsed.noteTypes)) {
    let noteTypesChanged = false;
    parsed.noteTypes.forEach((type) => {
      if (!type || typeof type.id !== "string" || typeof type.label !== "string" || typeof type.color !== "string") {
        return;
      }
      if (BUILTIN_NOTE_TYPES.some((item) => item.id === type.id)) {
        noteTypeIdMap.set(type.id, type.id);
        return;
      }
      const byLabelAndColor = getAllNoteTypes().find(
        (item) => normalizeKey(item.label) === normalizeKey(type.label) && normalizeKey(item.color) === normalizeKey(type.color),
      );
      if (byLabelAndColor) {
        noteTypeIdMap.set(type.id, byLabelAndColor.id);
        return;
      }
      const idAlreadyExists = getAllNoteTypes().some((item) => item.id === type.id);
      const importedType = idAlreadyExists
        ? createCustomNoteType(type.label, type.color)
        : {
            id: type.id,
            uid: typeof type.uid === "string" ? type.uid : generateUniqueUid(),
            label: type.label.trim(),
            color: type.color,
            updatedAt: Number.isFinite(type.updatedAt) ? type.updatedAt : Date.now(),
          };
      if (!importedType) return;
      if (!idAlreadyExists) {
        customNoteTypes.push(importedType);
      }
      noteTypesChanged = true;
      noteTypeIdMap.set(type.id, importedType.id);
    });
    if (noteTypesChanged) {
      saveCustomNoteTypes();
    }
  }

  if (Array.isArray(parsed.archetypes)) {
    let archetypesChanged = false;
    parsed.archetypes.forEach((archetype) => {
      if (!archetype || typeof archetype.id !== "string" || typeof archetype.label !== "string") return;
      const existingByName = getAllArchetypes().find(
        (item) => normalizeKey(item.label) === normalizeKey(archetype.label),
      );
      if (existingByName) {
        archetypeIdMap.set(archetype.id, existingByName.id);
        return;
      }
      const baseId = `custom_${slugifyTitle(archetype.label)}`;
      let id = getAllArchetypes().some((item) => item.id === archetype.id) ? baseId : archetype.id;
      let suffix = 2;
      while (getAllArchetypes().some((item) => item.id === id)) {
        id = `${baseId}_${suffix}`;
        suffix += 1;
      }
      customArchetypes.push({
        id,
        uid: typeof archetype.uid === "string" ? archetype.uid : generateUniqueUid(),
        icon: typeof archetype.icon === "string" ? archetype.icon : "✨",
        label: archetype.label.trim(),
        updatedAt: Number.isFinite(archetype.updatedAt) ? archetype.updatedAt : Date.now(),
      });
      archetypesChanged = true;
      archetypeIdMap.set(archetype.id, id);
    });
    if (archetypesChanged) {
      saveCustomArchetypes();
    }
  }
  const title = typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "Imported Board";
  const importedBoardUpdatedAt = Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : Date.now();
  const phaseCount = structure.phases.length;
  const importedPhaseOrder = isValidPhaseOrder(parsed.phaseOrder, structure.phases.length)
    ? [...parsed.phaseOrder]
    : identityPhaseOrder(structure.phases.length);
  const notes = parsed.notes.map((note, index) => {
    const column = Number.isInteger(note.column) ? note.column : 0;
    const importedKind = note.kind || "plot";
    const importedArchetype = note.archetype || "none";
    return {
      id: index + 1,
      uid: typeof note.uid === "string" ? note.uid : generateUniqueUid(),
      updatedAt: Number.isFinite(note.updatedAt) ? note.updatedAt : Date.now(),
      kind: noteTypeIdMap.get(importedKind) || importedKind,
      column: Math.max(0, Math.min(column, phaseCount - 1)),
      order: Number.isInteger(note.order) ? note.order : index,
      text: note.text || "",
      characterName: note.characterName || "",
      archetype: archetypeIdMap.get(importedArchetype) || importedArchetype,
      customHeight: Number.isFinite(note.customHeight) ? note.customHeight : undefined,
      collapsed: Boolean(note.collapsed),
    };
  });

  const existingByUid =
    typeof parsed.uid === "string" && parsed.uid
      ? boards.find((board) => board.uid === parsed.uid)
      : null;
  if (existingByUid) {
    const existingPhaseOrder = getBoardPhaseOrder(existingByUid);
    if (existingByUid.structureId !== structure.id) {
      throw new Error(
        `Cannot merge board "${existingByUid.title}": structure mismatch (${existingByUid.structure} vs ${structure.name}).`,
      );
    }
    const sameOrder =
      existingPhaseOrder.length === importedPhaseOrder.length &&
      existingPhaseOrder.every((value, index) => value === importedPhaseOrder[index]);
    if (!sameOrder) {
      const structurePhases = getStructureConfig(existingByUid.structureId).phases;
      const error = new Error(`Cannot merge board "${existingByUid.title}" because phase order differs.`);
      error.code = "PHASE_ORDER_CONFLICT";
      error.phaseOrderConflict = {
        boardTitle: existingByUid.title,
        currentOrder: existingPhaseOrder.map((phaseIndex) => structurePhases[phaseIndex] || "-"),
        importedOrder: importedPhaseOrder.map((phaseIndex) => structurePhases[phaseIndex] || "-"),
      };
      throw error;
    }

    const localByUid = new Map(existingByUid.notes.map((note) => [note.uid, note]));
    notes.forEach((importedNote) => {
      const localNote = localByUid.get(importedNote.uid);
      if (!localNote) {
        const nextId =
          existingByUid.notes.reduce((max, note) => Math.max(max, Number(note.id) || 0), 0) + 1;
        existingByUid.notes.push({
          ...importedNote,
          id: nextId,
        });
        return;
      }
      if ((importedNote.updatedAt || 0) > (localNote.updatedAt || 0)) {
        localNote.kind = importedNote.kind;
        localNote.column = importedNote.column;
        localNote.order = importedNote.order;
        localNote.text = importedNote.text;
        localNote.characterName = importedNote.characterName;
        localNote.archetype = importedNote.archetype;
        localNote.customHeight = importedNote.customHeight;
        localNote.collapsed = importedNote.collapsed;
        localNote.updatedAt = importedNote.updatedAt;
      }
    });

    if (importedBoardUpdatedAt > (existingByUid.updatedAt || 0)) {
      existingByUid.title = title;
      existingByUid.slug = ensureUniqueSlug(slugifyTitle(title), existingByUid.id);
      existingByUid.updatedAt = importedBoardUpdatedAt;
    } else {
      existingByUid.updatedAt = Math.max(existingByUid.updatedAt || 0, importedBoardUpdatedAt);
    }
    normalizeOrders(existingByUid.notes, existingByUid.structureId);
    existingByUid.nextNoteId =
      existingByUid.notes.reduce((max, note) => Math.max(max, Number(note.id) || 0), 0) + 1;
    saveBoards();
    renderHome();
    return;
  }

  const newBoard = {
    id: crypto.randomUUID(),
    uid: typeof parsed.uid === "string" ? parsed.uid : generateUniqueUid(),
    updatedAt: importedBoardUpdatedAt,
    title,
    slug: ensureUniqueSlug(slugifyTitle(title)),
    structureId: structure.id,
    structure: structure.name,
    phaseOrder: importedPhaseOrder,
    nextNoteId: notes.length + 1,
    notes,
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

function openHelp(replaceRoute = false) {
  navigation.openHelp(replaceRoute);
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
  generateUniqueUid,
  reorderPhaseAndNotes,
  touchBoard,
  renderEditor,
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
    uid: generateUniqueUid(),
    name,
    phases: phaseValues,
    updatedAt: Date.now(),
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

if (goHelpBtn) {
  goHelpBtn.addEventListener("click", () => {
    openHelp();
  });
}

if (goHelpFromDashboardBtn) {
  goHelpFromDashboardBtn.addEventListener("click", () => {
    openHelp();
  });
}

if (goDashboardFromHelpBtn) {
  goDashboardFromHelpBtn.addEventListener("click", () => {
    openHome();
  });
}

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
    if (error instanceof Error && error.code === "PHASE_ORDER_CONFLICT" && error.phaseOrderConflict) {
      openPhaseOrderConflictModal(error.phaseOrderConflict);
    } else {
      window.alert(error instanceof Error ? error.message : "Import failed. Please use a valid Structurer board JSON.");
    }
  } finally {
    importBoardInput.value = "";
  }
});

groupBoardStackEl.addEventListener("click", (event) => {
  const openBtn = event.target.closest('[data-role="open-board-from-group"]');
  if (!openBtn) return;
  openBoard(openBtn.dataset.boardId, false, currentGroupId);
});

groupBoardStackEl.addEventListener("dblclick", (event) => {
  if (event.target.closest("button")) return;
  const noteHead = event.target.closest(".group-note-readonly .note-head");
  if (!noteHead) return;
  const noteEl = noteHead.closest(".note.group-note-readonly");
  if (!noteEl) return;
  const boardId = noteEl.dataset.boardId;
  const noteId = Number(noteEl.dataset.noteId);
  const board = boards.find((item) => item.id === boardId);
  if (!board) return;
  const note = board.notes.find((item) => item.id === noteId);
  if (!note) return;
  note.collapsed = !note.collapsed;
  note.updatedAt = Date.now();
  touchBoard(board);
  renderGroup();
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

if (editNoteTypesListEl) {
  editNoteTypesListEl.addEventListener("click", (event) => {
    const delBtn = event.target.closest('[data-role="delete-custom-note-type"]');
    if (delBtn) {
      const id = delBtn.dataset.noteTypeId;
      if (!id || BUILTIN_NOTE_TYPES.some((b) => b.id === id) || isNoteTypeInUse(id)) return;
      const typeLabel = noteTypeById(id).label;
      const confirmed = window.confirm(`Delete note type "${typeLabel}"? This cannot be undone.`);
      if (!confirmed) return;
      customNoteTypes = customNoteTypes.filter((item) => item.id !== id);
      delete noteTypeOverrides[id];
      saveCustomNoteTypes();
      saveNoteTypeOverrides();
      fillEditNoteTypesModal();
      renderEditor();
      return;
    }
    const sw = event.target.closest('[data-role="edit-note-type-swatch"]');
    if (!sw) return;
    const row = sw.closest(".edit-note-type-row");
    if (!row || !editNoteTypesListEl.contains(row)) return;
    const hexInput = row.querySelector(".edit-note-type-hex-input");
    hexInput.value = normalizeHexColor(sw.dataset.color);
    syncEditNoteTypeRowSwatches(row);
  });
  editNoteTypesListEl.addEventListener("input", (event) => {
    if (!event.target.classList.contains("edit-note-type-hex-input")) return;
    const row = event.target.closest(".edit-note-type-row");
    if (row) syncEditNoteTypeRowSwatches(row);
  });
  editNoteTypesListEl.addEventListener("focusout", (event) => {
    if (!event.target.classList.contains("edit-note-type-hex-input")) return;
    const parsed = parseHexColorInput(event.target.value);
    if (parsed) event.target.value = parsed;
    const row = event.target.closest(".edit-note-type-row");
    if (row) syncEditNoteTypeRowSwatches(row);
  });
}

if (cancelEditNoteTypesBtn) {
  cancelEditNoteTypesBtn.addEventListener("click", () => closeEditNoteTypesModal());
}
if (saveEditNoteTypesBtn) {
  saveEditNoteTypesBtn.addEventListener("click", () => saveEditNoteTypesFromModal());
}
if (editNoteTypesModalOverlay) {
  editNoteTypesModalOverlay.addEventListener("click", (event) => {
    if (event.target === editNoteTypesModalOverlay) closeEditNoteTypesModal();
  });
}

if (homeCollapsiblePanels.length > 0) {
  homeCollapsiblePanels.forEach((panel) => {
    panel.addEventListener("toggle", () => {
      if (!panel.open) return;
      homeCollapsiblePanels.forEach((otherPanel) => {
        if (otherPanel !== panel) {
          otherPanel.open = false;
        }
      });
    });
  });
}

closeBoardActionsModalBtn.addEventListener("click", () => {
  closeBoardActionsModal();
});

if (closePhaseOrderConflictModalBtn) {
  closePhaseOrderConflictModalBtn.addEventListener("click", () => {
    closePhaseOrderConflictModal();
  });
}

if (phaseOrderConflictModalOverlay) {
  phaseOrderConflictModalOverlay.addEventListener("click", (event) => {
    if (event.target === phaseOrderConflictModalOverlay) {
      closePhaseOrderConflictModal();
    }
  });
}

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
    if (currentBoardId === board.id) {
      renderEditor();
    }
    if (currentGroupId && groups.some((g) => g.id === currentGroupId && g.boardIds.includes(board.id))) {
      renderGroup();
    }
    closeBoardActionsModal();
  });
}

if (modalEditNoteTypesBtn) {
  modalEditNoteTypesBtn.addEventListener("click", () => {
    closeBoardActionsModal();
    openEditNoteTypesModal();
  });
}

if (modalResetPhaseOrderBtn) {
  modalResetPhaseOrderBtn.addEventListener("click", () => {
    const boardId = boardActionsModalBoardId;
    if (!boardId) return;
    const board = boards.find((item) => item.id == boardId);
    if (!board || !isPhaseOrderModified(board)) return;
    applyPhaseOrder(board, identityPhaseOrder(getStructureConfig(board.structureId).phases.length));
    touchBoard(board);
    closeBoardActionsModal();
    if (currentBoardId == boardId) {
      renderEditor();
    }
    if (
      currentGroupId &&
      groups.some((g) => g.id === currentGroupId && g.boardIds.some((bid) => bid == boardId))
    ) {
      renderGroup();
    }
  });
}

if (modalAddBoardToGroupBtn) {
  modalAddBoardToGroupBtn.addEventListener("click", () => {
    const boardId = boardActionsModalBoardId;
    if (!boardId || groups.length === 0) return;
    closeBoardActionsModal();
    openAddBoardToGroupModal(boardId);
  });
}

if (addBoardToGroupListEl) {
  addBoardToGroupListEl.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-group-id]");
    if (!btn) return;
    const boardId = addBoardToGroupTargetBoardId;
    if (!boardId) return;
    const group = groups.find((item) => item.id === btn.dataset.groupId);
    const board = boards.find((item) => item.id === boardId);
    if (!group || !board) return;
    if (group.boardIds.includes(board.id)) {
      window.alert(`"${board.title}" is already in "${group.title}".`);
      return;
    }
    group.boardIds.push(board.id);
    group.updatedAt = Date.now();
    saveGroups();
    renderHome();
    closeAddBoardToGroupModal();
  });
}

if (closeAddBoardToGroupModalBtn) {
  closeAddBoardToGroupModalBtn.addEventListener("click", () => {
    closeAddBoardToGroupModal();
  });
}

if (addBoardToGroupModalOverlay) {
  addBoardToGroupModalOverlay.addEventListener("click", (event) => {
    if (event.target === addBoardToGroupModalOverlay) {
      closeAddBoardToGroupModal();
    }
  });
}

if (createGroupForm && createGroupNameInput) {
  createGroupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = createGroupNameInput.value.trim();
    if (!title) return;
    const checkedIds = [...createGroupForm.querySelectorAll('input[name="create-group-board"]:checked')].map(
      (input) => input.value,
    );
    if (checkedIds.length === 0) {
      window.alert("Select at least one board to include.");
      return;
    }
    const group = {
      id: crypto.randomUUID(),
      uid: generateUniqueUid(),
      title,
      slug: ensureUniqueGroupSlug(slugifyTitle(title)),
      boardIds: [...checkedIds],
      updatedAt: Date.now(),
    };
    groups.push(group);
    saveGroups();
    createGroupForm.reset();
    renderHome();
    openGroup(group.id);
  });
}

modalDeleteBoardBtn.addEventListener("click", () => {
  const board = boards.find((item) => item.id === boardActionsModalBoardId);
  if (!board) return;
  const confirmed = window.confirm(`Delete board "${board.title}"? This action cannot be undone.`);
  if (!confirmed) return;
  const deletedId = board.id;
  boards = boards.filter((item) => item.id !== deletedId);
  groups.forEach((g) => {
    g.boardIds = g.boardIds.filter((id) => id !== deletedId);
  });
  saveBoards();
  saveGroups();
  renderHome();
  if (currentBoardId === deletedId) {
    openHome();
  }
  if (currentGroupId) {
    renderGroup();
  }
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

if (editorBoardActionsBtn) {
  editorBoardActionsBtn.addEventListener("click", () => {
    const board = getCurrentBoard();
    if (!board) return;
    openBoardActionsModal(board.id);
  });
}

if (groupViewActionsBtn) {
  groupViewActionsBtn.addEventListener("click", () => {
    if (currentGroupId) {
      groupModalController.openGroupActionsModal(currentGroupId);
    }
  });
}

resetAppDataBtn.addEventListener("click", () => {
  closeOptionsMenu();
  const confirmed = window.confirm(
    "Reset all app data? This will delete all boards and settings, then reload the app.",
  );
  if (!confirmed) return;

  clearKeys([
    STORAGE_KEY,
    SETTINGS_KEY,
    CUSTOM_STRUCTURES_KEY,
    CUSTOM_ARCHETYPES_KEY,
    CUSTOM_NOTE_TYPES_KEY,
    NOTE_TYPE_OVERRIDES_KEY,
    GROUPS_KEY,
    DEMO_BOARD_IDS_KEY,
  ]);
  window.location.assign(HOME_ROUTE);
});

if (resetDemoDataBtn) {
  resetDemoDataBtn.addEventListener("click", () => {
    closeOptionsMenu();
    const confirmed = window.confirm(
      "Reset demo boards only? Your personal boards and custom settings/types/archetypes will be kept.",
    );
    if (!confirmed) return;
    replaceDemoBoardsOnly();
    openHome();
  });
}

if (toggleDemoVisibilityBtn) {
  toggleDemoVisibilityBtn.addEventListener("click", () => {
    showDemoBoards = !showDemoBoards;
    saveSettings();
    renderHome();
  });
}

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
    note.updatedAt = Date.now();
    if (!note.customHeight) {
      target.style.height = "auto";
      target.style.height = `${Math.max(target.scrollHeight, 74)}px`;
    }
  } else if (target.dataset.role === "character-name") {
    note.characterName = target.value;
    note.updatedAt = Date.now();
  } else if (target.dataset.role === "archetype") {
    note.archetype = target.value;
    note.updatedAt = Date.now();
    renderEditor();
  }

  touchBoard(board);
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
  demoBoardIds = boards.map((board) => board.id);
  saveDemoBoardIds();
} else if (demoBoardIds.length === 0) {
  demoBoardIds = boards.filter((board) => isLikelyDemoBoard(board)).map((board) => board.id);
  saveDemoBoardIds();
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
migrateUniqueUids();
saveBoards();
saveGroups();
window.addEventListener("popstate", () => {
  syncRouteToState(false);
});
applyColumnWidth();
applyWrapColumns();
applyDevFlags();
applyDemoVisibilityControl();
renderStructureOptions("hero_journey");
renderStructurePhaseRows(["", "", ""]);
syncRouteToState(true);

const appVersionEl = document.querySelector("#app-version");
if (appVersionEl && packageJson.version) {
  appVersionEl.textContent = `v${packageJson.version}`;
}
