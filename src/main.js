import {
  BUILTIN_NOTE_TYPES,
  BUILTIN_ARCHETYPES,
  BUILTIN_STRUCTURES,
  CUSTOM_ARCHETYPES_KEY,
  CUSTOM_NOTE_TYPES_KEY,
  NOTE_TYPE_OVERRIDES_KEY,
  CUSTOM_STRUCTURES_KEY,
  DEFAULT_COLUMN_WIDTH,
  HOME_ROUTE,
  SETTINGS_KEY,
  PHASE_HELP_STATE_KEY,
  STORAGE_KEY,
} from "./app-config";
import { DEMO_BOARD_DATA } from "./demo-boards";
import {
  clearKeys,
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
import { createInlineTitleEditController } from "./inline-title-edit.js";
import { appAlert, closeAppAlertIfOpen, dismissAllAppAlerts } from "./app-alert.js";
import packageJson from "../package.json";
import { validateStructureAuthor, validateStructureDescription } from "./structure-metadata.js";

const loadedBoards = loadBoards();
let boards = loadedBoards || [];
const GROUPS_KEY = "structurer.groups.v1";
const DEMO_BOARD_IDS_KEY = "structurer.demoBoardIds.v1";
const CUSTOM_STRUCTURE_ACTIVITY_KEY = "structurer.customStructureActivity.v1";
const issuedUids = new Set();
let groups = loadGroups();
let demoBoardIds = loadDemoBoardIds();
let currentBoardId = null;
let currentGroupId = null;
let boardBackGroupId = null;
let editingNoteId = null;
let boardCardPendingOpenTimer = null;
let activePhaseCommentsColumn = null;
let phaseHelpStateByBoard = loadJsonItem(PHASE_HELP_STATE_KEY, {}) || {};
let phaseHelpOpenColumns = new Set();
let phaseHelpBoardId = null;
let editingPhaseCommentUid = null;
let boardActionsModalBoardId = null;
let customStructures = loadCustomStructures();
let customStructureActivity = loadCustomStructureActivity();
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
const privacyView = document.querySelector("#privacy-view");
const termsView = document.querySelector("#terms-view");
const groupView = document.querySelector("#group-view");
const editorView = document.querySelector("#editor-view");
const phaseView = document.querySelector("#phase-view");
const groupsList = document.querySelector("#groups-list");
const boardsList = document.querySelector("#boards-list");
const dashboardStructuresList = document.querySelector("#dashboard-structures-list");
const dashboardGroupsHeading = document.querySelector("#dashboard-groups-heading");
const dashboardBoardsHeading = document.querySelector("#dashboard-boards-heading");
const emptyState = document.querySelector("#empty-state");
const createBoardForm = document.querySelector("#create-board-form");
const boardTitleInput = document.querySelector("#board-title");
const boardStructureSelect = document.querySelector("#board-structure");
const createStructureForm = document.querySelector("#create-structure-form");
const structureNameInput = document.querySelector("#structure-name-input");
const structureDescriptionInput = document.querySelector("#structure-description-input");
const structureAuthorInput = document.querySelector("#structure-author-input");
const structurePhasesList = document.querySelector("#structure-phases-list");
const addStructurePhaseBtn = document.querySelector("#add-structure-phase");
const importBoardButton = document.querySelector("#import-board-button");
const importBoardInput = document.querySelector("#import-board-input");
const boardActionsModalOverlay = document.querySelector("#board-actions-modal-overlay");
const closeBoardActionsModalBtn = document.querySelector("#close-board-actions-modal");
const modalAddBoardToGroupBtn = document.querySelector("#modal-add-board-to-group");
const addBoardToGroupModalOverlay = document.querySelector("#add-board-to-group-modal-overlay");
const addBoardToGroupListEl = document.querySelector("#add-board-to-group-list");
const closeAddBoardToGroupModalBtn = document.querySelector("#close-add-board-to-group-modal");
const createGroupForm = document.querySelector("#create-group-form");
const createGroupNameInput = document.querySelector("#create-group-name");
const createGroupBoardsListEl = document.querySelector("#create-group-boards-list");
const createGroupBoardsEmptyEl = document.querySelector("#create-group-boards-empty");
const modalExportBoardBtn = document.querySelector("#modal-export-board");
const modalResetDemoBoardBtn = document.querySelector("#modal-reset-demo-board");
const modalDeleteBoardBtn = document.querySelector("#modal-delete-board");
const deleteStoryModalOverlay = document.querySelector("#delete-story-modal-overlay");
const deleteStoryModalIntroEl = document.querySelector("#delete-story-modal-intro");
const deleteStoryConfirmCheckbox = document.querySelector("#delete-story-confirm-checkbox");
const cancelDeleteStoryBtn = document.querySelector("#cancel-delete-story");
const confirmDeleteStoryBtn = document.querySelector("#confirm-delete-story");
let pendingDeleteStoryBoardId = null;
const groupActionsModalOverlay = document.querySelector("#group-actions-modal-overlay");
const closeGroupActionsModalBtn = document.querySelector("#close-group-actions-modal");
const modalReorderGroupBoardsBtn = document.querySelector("#modal-reorder-group-boards");
const modalDeleteGroupBtn = document.querySelector("#modal-delete-group");
const groupReorderModalOverlay = document.querySelector("#group-reorder-modal-overlay");
const closeGroupReorderModalBtn = document.querySelector("#close-group-reorder-modal");
const groupReorderListEl = document.querySelector("#group-reorder-list");
const groupReorderAddSelectEl = document.querySelector("#group-reorder-add-select");
const groupReorderSeriesNameInputEl = document.querySelector("#group-reorder-series-name");
const groupReorderStatusEl = document.querySelector("#group-reorder-status");
const phaseOrderConflictModalOverlay = document.querySelector("#phase-order-conflict-modal-overlay");
const closePhaseOrderConflictModalBtn = document.querySelector("#close-phase-order-conflict-modal");
const phaseOrderConflictTitleEl = document.querySelector("#phase-order-conflict-title");
const phaseOrderCurrentListEl = document.querySelector("#phase-order-current-list");
const phaseOrderImportedListEl = document.querySelector("#phase-order-imported-list");
const phaseOrderConflictHintEl = document.querySelector("#phase-order-conflict-hint");
const factoryResetModalOverlay = document.querySelector("#factory-reset-modal-overlay");
const cancelFactoryResetBtn = document.querySelector("#cancel-factory-reset");
const confirmFactoryResetBtn = document.querySelector("#confirm-factory-reset");
const factoryResetConfirmCheckbox = document.querySelector("#factory-reset-confirm-checkbox");
const resetDemosModalOverlay = document.querySelector("#reset-demos-modal-overlay");
const cancelResetDemosBtn = document.querySelector("#cancel-reset-demos");
const confirmResetDemosBtn = document.querySelector("#confirm-reset-demos");
const restoreBackupModalOverlay = document.querySelector("#restore-backup-modal-overlay");
const cancelRestoreBackupBtn = document.querySelector("#cancel-restore-backup");
const confirmRestoreBackupBtn = document.querySelector("#confirm-restore-backup");
const restoreBackupConfirmCheckbox = document.querySelector("#restore-backup-confirm-checkbox");
const dashboardActionsBtn = document.querySelector("#dashboard-actions-btn");
const dashboardActionsModalOverlay = document.querySelector("#dashboard-actions-modal-overlay");
const dashboardActionsSectionsEl = document.querySelector(".dashboard-actions-modal-sections");
const closeDashboardActionsModalBtn = document.querySelector("#close-dashboard-actions-modal");
const openCreateStoryActionBtn = document.querySelector("#open-create-story-action");
const dashboardCreateStoryModalOverlay = document.querySelector("#dashboard-create-story-modal-overlay");
const closeDashboardCreateStoryModalBtn = document.querySelector("#close-dashboard-create-story-modal");
const newStoryOnboardingModalOverlay = document.querySelector("#new-story-onboarding-modal-overlay");
const confirmNewStoryOnboardingBtn = document.querySelector("#confirm-new-story-onboarding");
const openCreateStructureActionBtn = document.querySelector("#open-create-structure-action");
const dashboardCreateStructureModalOverlay = document.querySelector("#dashboard-create-structure-modal-overlay");
const closeDashboardCreateStructureModalBtn = document.querySelector("#close-dashboard-create-structure-modal");
const structurePreviewModalOverlay = document.querySelector("#structure-preview-modal-overlay");
const structurePreviewModalTitleEl = document.querySelector("#structure-preview-modal-title");
const structurePreviewModalMetaEl = document.querySelector("#structure-preview-modal-meta");
const structurePreviewModalPhasesEl = document.querySelector("#structure-preview-modal-phases");
const closeStructurePreviewModalBtn = document.querySelector("#close-structure-preview-modal");
const dashboardResetDemoActionBtn = document.querySelector("#dashboard-reset-demo-action");
const dashboardFactoryResetActionBtn = document.querySelector("#dashboard-factory-reset-action");
const dashboardExportBackupActionBtn = document.querySelector("#dashboard-export-backup-action");
const dashboardExportStructuresActionBtn = document.querySelector("#dashboard-export-structures-action");
const dashboardImportStructuresActionBtn = document.querySelector("#dashboard-import-structures-action");
const dashboardImportStructuresPasteActionBtn = document.querySelector("#dashboard-import-structures-paste-action");
const dashboardRemoveStructuresActionBtn = document.querySelector("#dashboard-remove-structures-action");
const dashboardRemoveStructuresModalOverlay = document.querySelector("#dashboard-remove-structures-modal-overlay");
const removeStructuresListEl = document.querySelector("#remove-structures-list");
const removeStructuresEmptyEl = document.querySelector("#remove-structures-empty");
const closeDashboardRemoveStructuresModalBtn = document.querySelector("#close-dashboard-remove-structures-modal");
const confirmRemoveStructuresBtn = document.querySelector("#confirm-remove-structures-btn");
const dashboardRestoreBackupActionBtn = document.querySelector("#dashboard-restore-backup-action");
const restoreAppBackupInput = document.querySelector("#restore-app-backup-input");
const importCustomStructuresInput = document.querySelector("#import-custom-structures-input");
const dashboardImportStructuresPasteModalOverlay = document.querySelector("#dashboard-import-structures-paste-modal-overlay");
const closeDashboardImportStructuresPasteModalBtn = document.querySelector("#close-dashboard-import-structures-paste-modal");
const importStructuresPasteForm = document.querySelector("#import-structures-paste-form");
const importStructuresPasteText = document.querySelector("#import-structures-paste-text");
const openImportStoryActionBtn = document.querySelector("#open-import-story-action");
const dashboardImportModalOverlay = document.querySelector("#dashboard-import-modal-overlay");
const closeDashboardImportModalBtn = document.querySelector("#close-dashboard-import-modal");
const openCreateSeriesActionBtn = document.querySelector("#open-create-series-action");
const dashboardCreateSeriesModalOverlay = document.querySelector("#dashboard-create-series-modal-overlay");
const closeDashboardCreateSeriesModalBtn = document.querySelector("#close-dashboard-create-series-modal");
const goLandingFromDashboardBtn = document.querySelector("#go-landing-from-dashboard");
const goHelpBtn = document.querySelector("#go-help");
const goHelpFromDashboardBtn = document.querySelector("#go-help-from-dashboard");
const goDashboardFromHelpBtn = document.querySelector("#go-dashboard-from-help");
const goDashboardFromPrivacyBtn = document.querySelector("#go-dashboard-from-privacy");
const goDashboardFromTermsBtn = document.querySelector("#go-dashboard-from-terms");
const goDashboardFromBoardBtn = document.querySelector("#go-dashboard-from-board");
const goDashboardFromGroupBtn = document.querySelector("#go-dashboard-from-group");
const goPrivacyFromFooterBtn = document.querySelector("#go-privacy-from-footer");
const goTermsFromFooterBtn = document.querySelector("#go-terms-from-footer");
const goHelpFromFooterBtn = document.querySelector("#go-help-from-footer");
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
const goBoardFromPhaseBtn = document.querySelector("#go-board-from-phase");
const phaseCommentsTitleEl = document.querySelector("#phase-comments-title");
const phaseCommentsSubtitleEl = document.querySelector("#phase-comments-subtitle");
const phaseNotesListEl = document.querySelector("#phase-notes-list");
const phaseNotesEmptyEl = document.querySelector("#phase-notes-empty");
const phaseCommentsListEl = document.querySelector("#phase-comments-list");
const phaseCommentsEmptyEl = document.querySelector("#phase-comments-empty");
const phaseCommentForm = document.querySelector("#phase-comment-form");
const phaseCommentInput = document.querySelector("#phase-comment-input");
const phaseCommentCharCountEl = document.querySelector("#phase-comment-char-count");
const savePhaseCommentBtn = document.querySelector("#save-phase-comment-btn");

const boardEl = document.querySelector("#board");
const groupBoardStackEl = document.querySelector("#group-board-stack");
const homeListControlsEl = document.querySelector(".home-list-controls");
const dashboardSectionDividerEl = document.querySelector(".dashboard-section-divider");
const toggleDemoVisibilityBtn = document.querySelector("#toggle-demo-visibility");
const openCreateStructureInlineBtn = document.querySelector("#open-create-structure-inline");
const openCreateStoryEmptyStateBtn = document.querySelector("#open-create-story-empty-state");
const homeCollapsiblePanels = [...document.querySelectorAll("#home-view .collapsible-panel")];
let addBoardToGroupTargetBoardId = null;
let pendingRestoreBackupText = null;

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

function loadCustomStructureActivity() {
  const parsed = loadJsonItem(CUSTOM_STRUCTURE_ACTIVITY_KEY, {});
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const normalized = {};
  Object.entries(parsed).forEach(([uid, ts]) => {
    const value = Number(ts);
    if (!uid || !Number.isFinite(value) || value <= 0) return;
    normalized[uid] = value;
  });
  return normalized;
}

function saveCustomStructureActivity() {
  saveJsonItem(CUSTOM_STRUCTURE_ACTIVITY_KEY, customStructureActivity);
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

function getStructureIdsUsedByBoards() {
  return new Set(boards.map((board) => board.structureId).filter(Boolean));
}

function getUnusedCustomStructures() {
  const used = getStructureIdsUsedByBoards();
  return customStructures.filter((structure) => !used.has(structure.id));
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

function applyDevFlags() {
  // Reset commands are now always available from the dashboard.
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

async function saveEditNoteTypesFromModal() {
  if (!editNoteTypesListEl) return;
  const rows = editNoteTypesListEl.querySelectorAll(".edit-note-type-row");
  for (const row of rows) {
    const id = row.dataset.noteTypeId;
    const labelInput = row.querySelector(".edit-note-type-label-input");
    const hexInput = row.querySelector(".edit-note-type-hex-input");
    const label = labelInput.value.trim();
    const color = parseHexColorInput(hexInput.value);
    if (!label) {
      await appAlert(`Please enter a label for note type "${id}".`);
      labelInput.focus();
      return;
    }
    if (!color) {
      await appAlert(`Please enter a valid hex color for "${label}" (e.g. #fef08a or #rgb).`);
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

function ensureBoardPhaseUids(board) {
  if (!board) return [];
  const phaseCount = getStructureConfig(board.structureId).phases.length;
  if (!Array.isArray(board.phaseUids)) {
    board.phaseUids = [];
  }
  for (let phaseId = 0; phaseId < phaseCount; phaseId += 1) {
    const current = board.phaseUids[phaseId];
    if (typeof current !== "string" || !current) {
      board.phaseUids[phaseId] = generateUniqueUid();
    }
  }
  if (board.phaseUids.length > phaseCount) {
    board.phaseUids = board.phaseUids.slice(0, phaseCount);
  }
  return board.phaseUids;
}

function getPhaseUidByVisualColumn(board, columnIndex) {
  if (!board || !Number.isInteger(columnIndex) || columnIndex < 0) return null;
  const order = getBoardPhaseOrder(board);
  const phaseId = order[columnIndex];
  if (!Number.isInteger(phaseId) || phaseId < 0) return null;
  const phaseUids = ensureBoardPhaseUids(board);
  return phaseUids[phaseId] || null;
}

function normalizeBoardPhaseComments(board) {
  if (!board || !Number.isInteger(board.nextCommentId)) {
    board.nextCommentId = 1;
  }
  if (!board || !board.phaseComments || typeof board.phaseComments !== "object" || Array.isArray(board.phaseComments)) {
    board.phaseComments = {};
  }

  const phaseUids = ensureBoardPhaseUids(board);
  const currentOrder = getBoardPhaseOrder(board);
  const normalizedByPhaseUid = {};
  let maxCommentId = 0;

  Object.entries(board.phaseComments).forEach(([phaseKey, comments]) => {
    if (!Array.isArray(comments)) return;
    let targetPhaseUid = null;
    if (phaseUids.includes(phaseKey)) {
      targetPhaseUid = phaseKey;
    } else {
      // Backward compatibility: legacy data used visual column index as object key.
      const numericColumn = Number(phaseKey);
      const legacyPhaseId = currentOrder[numericColumn];
      if (Number.isInteger(legacyPhaseId) && legacyPhaseId >= 0) {
        targetPhaseUid = phaseUids[legacyPhaseId] || null;
      }
    }
    if (!targetPhaseUid) return;
    normalizedByPhaseUid[targetPhaseUid] = (normalizedByPhaseUid[targetPhaseUid] || []).concat(
      comments
      .filter((comment) => comment && typeof comment === "object")
      .map((comment) => {
        const id = Number.isInteger(comment.id) ? comment.id : board.nextCommentId++;
        maxCommentId = Math.max(maxCommentId, id);
        return {
          id,
          uid: typeof comment.uid === "string" && comment.uid ? comment.uid : generateUniqueUid(),
          text: typeof comment.text === "string" ? comment.text : "",
          createdAt: Number.isFinite(comment.createdAt) ? comment.createdAt : Date.now(),
          updatedAt: Number.isFinite(comment.updatedAt) ? comment.updatedAt : Date.now(),
        };
      }),
    );
  });

  Object.keys(normalizedByPhaseUid).forEach((phaseUid) => {
    normalizedByPhaseUid[phaseUid] = normalizedByPhaseUid[phaseUid].sort(
      (a, b) => a.createdAt - b.createdAt || a.id - b.id,
    );
  });

  board.phaseComments = normalizedByPhaseUid;
  board.phaseCommentsVersion = 2;
  board.nextCommentId = Math.max(board.nextCommentId || 1, maxCommentId + 1);
}

function getPhaseComments(board, columnIndex) {
  if (!board) return [];
  normalizeBoardPhaseComments(board);
  const phaseUid = getPhaseUidByVisualColumn(board, columnIndex);
  if (!phaseUid) return [];
  const items = Array.isArray(board.phaseComments[phaseUid]) ? board.phaseComments[phaseUid] : [];
  return [...items].sort((a, b) => a.createdAt - b.createdAt || a.id - b.id);
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

const DEFAULT_STRUCTURE_PHASE_ROWS = [
  { title: "", description: "" },
  { title: "", description: "" },
  { title: "", description: "" },
];

function normalizeStructureFormPhaseValue(value) {
  if (value == null || value === "") return { title: "", description: "" };
  if (typeof value === "string") return { title: value, description: "" };
  if (typeof value === "object") {
    return {
      title: String(value.title ?? ""),
      description: String(value.description ?? ""),
    };
  }
  return { title: "", description: "" };
}

function renderStructurePhaseRows(values = DEFAULT_STRUCTURE_PHASE_ROWS) {
  structurePhasesList.innerHTML = values
    .map((value, index) => structurePhaseRowTemplate(index, normalizeStructureFormPhaseValue(value)))
    .join("");
}

function collectStructurePhaseRowsFromDOM() {
  return [...structurePhasesList.querySelectorAll(".structure-phase-row")].map((row) => ({
    title: row.querySelector('[data-role="phase-input"]')?.value ?? "",
    description: row.querySelector('[data-role="phase-description-input"]')?.value ?? "",
  }));
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
    normalizeBoardPhaseComments(board);
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

function parsePhaseEntry(phase) {
  if (phase == null) return { title: "" };
  if (typeof phase === "string") {
    return { title: String(phase).trim() };
  }
  if (typeof phase === "object" && !Array.isArray(phase)) {
    const title = String(phase.title ?? phase.name ?? "").trim();
    const rawDesc = typeof phase.description === "string" ? phase.description.trim() : "";
    const description = rawDesc ? rawDesc : undefined;
    return { title, description };
  }
  return { title: String(phase).trim() };
}

function formatPhaseTitle(phase) {
  return parsePhaseEntry(phase).title;
}

function getPhaseDescription(phase) {
  return parsePhaseEntry(phase).description ?? "";
}

function buildPhaseHelpOpenSetForBoard(board) {
  const phases = getBoardPhases(board);
  const stored = phaseHelpStateByBoard[board.id];
  const next = new Set();
  if (!Array.isArray(stored)) return next;
  stored.forEach((idx) => {
    if (!Number.isInteger(idx) || idx < 0 || idx >= phases.length) return;
    if (getPhaseDescription(phases[idx])) next.add(idx);
  });
  return next;
}

function persistPhaseHelpStateForBoard(boardId, openSet) {
  const arr = Array.from(openSet).sort((a, b) => a - b);
  if (arr.length === 0) {
    delete phaseHelpStateByBoard[boardId];
  } else {
    phaseHelpStateByBoard[boardId] = arr;
  }
  saveJsonItem(PHASE_HELP_STATE_KEY, phaseHelpStateByBoard);
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
  const isDemoSeries = group.boardIds.length > 0 && group.boardIds.every((id) => isDemoBoard(boards.find((board) => board.id === id)));
  const boardTitles = group.boardIds
    .map((id) => boards.find((board) => board.id === id)?.title)
    .filter(Boolean);
  const boardListHtml =
    boardTitles.length > 0
      ? `<ul class="group-board-list">${boardTitles
          .map((title) => `<li class="group-board-list-item">${escapeHtml(title)}</li>`)
          .join("")}</ul>`
      : `<div class="board-meta-line">No stories yet</div>`;
  return `
    <article class="board-card" data-group-id="${group.id}" role="button" tabindex="0" aria-label="Open series ${group.title}">
      <div>
        <strong>${isDemoSeries ? '<span class="demo-label">Demo</span> ' : ""}${group.title}</strong>
        <div class="board-meta">
          <div class="board-meta-line">Series • ${group.boardIds.length} stories</div>
          ${boardListHtml}
          <div class="board-meta-line">Updated ${formatDate(group.updatedAt)}</div>
        </div>
      </div>
      <div class="board-actions">
        <button type="button" class="action-button" data-role="group-actions" aria-label="Series actions">
          <span class="action-icon" aria-hidden="true">⋯</span>
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

  const demoBoardIdSet = new Set(demoBoardIds);
  const sortedGroups = [...groups]
    .filter((group) => {
      // When demos are hidden, also hide demo-only series (series made exclusively of demo stories).
      if (showDemoBoards) return true;
      return !group.boardIds.every((id) => demoBoardIdSet.has(id));
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
  groupsList.innerHTML = sortedGroups.map(groupCardTemplate).join("");
  groupsList.style.display = sortedGroups.length > 0 ? "grid" : "none";

  const sortedBoards = [...boards]
    .filter((board) => showDemoBoards || !isDemoBoard(board))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  boardsList.innerHTML = sortedBoards
    .map((board) => {
      const structure = getStructureConfig(board.structureId);
      return boardCardTemplate(
        board,
        structure.name,
        formatDate(board.updatedAt),
        isDemoBoard(board),
        inlineTitleEdit.getEditingStoryBoardId(),
      );
    })
    .join("");
  if (homeListControlsEl) {
    groupsList.insertAdjacentElement("afterend", homeListControlsEl);
  }
  if (dashboardSectionDividerEl && homeListControlsEl) {
    homeListControlsEl.insertAdjacentElement("afterend", dashboardSectionDividerEl);
  }
  if (dashboardStructuresList) {
    const oneHourMs = 60 * 60 * 1000;
    const now = Date.now();
    const customIds = new Set(customStructures.map((structure) => structure.id));
    const structureItems = getAllStructureList()
      .map((structure) => {
        const isCustom = customIds.has(structure.id);
        const activityAt = Number(customStructureActivity[structure.uid]) || 0;
        const updatedAt = Number(structure.updatedAt) || 0;
        const freshnessTs = Math.max(activityAt, updatedAt);
        const isNew = isCustom && now - freshnessTs >= 0 && now - freshnessTs < oneHourMs;
        return { id: structure.id, name: structure.name, isNew };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    dashboardStructuresList.innerHTML = structureItems
      .map(
        (item) =>
          `<li><button type="button" class="dashboard-structure-preview-btn" data-structure-id="${escapeHtml(item.id)}">${escapeHtml(item.name)}${item.isNew ? ' <span class="dashboard-structure-badge-new">NEW</span>' : ""}</button></li>`,
      )
      .join("");
  }
  if (dashboardGroupsHeading) {
    dashboardGroupsHeading.classList.toggle("hidden", sortedGroups.length === 0);
  }
  if (dashboardBoardsHeading) {
    dashboardBoardsHeading.classList.toggle("hidden", sortedBoards.length === 0);
  }
  const hasAtLeastOneNonDemoStory = boards.some((board) => !isDemoBoard(board));
  emptyState.style.display = hasAtLeastOneNonDemoStory ? "none" : "block";
  applyDemoVisibilityControl();
  renderCreateGroupBoardCheckboxes();
  updateDashboardRemoveStructuresActionState();
}

function renderEditor() {
  const board = getCurrentBoard();
  if (!board) return;
  if (phaseHelpBoardId !== board.id) {
    phaseHelpBoardId = board.id;
    phaseHelpOpenColumns = buildPhaseHelpOpenSetForBoard(board);
  }
  const structure = getStructureConfig(board.structureId);
  const phases = getBoardPhases(board);
  const archetypes = getAllArchetypes();
  const noteTypes = getAllNoteTypes();
  const editingId = editingNoteId;
  const isModifiedOrder = isPhaseOrderModified(board);

  const editorTitleMarkup =
    board.id === inlineTitleEdit.getEditingStoryBoardId()
      ? `<input class="inline-story-title-input editor-title-input" type="text" maxlength="80" value="${escapeHtml(board.title)}" data-role="inline-story-title-input" data-board-id="${board.id}" aria-label="Story name" />`
      : `<span class="editor-title-text" data-role="board-title-dblclick">${escapeHtml(board.title)}</span>`;
  editorTitle.innerHTML = `<div class="inline-story-title-root" data-role="inline-story-title-root" data-board-id="${board.id}"><span class="inline-story-title-host" data-role="inline-story-title-host">${isDemoBoard(board) ? '<span class="demo-label">Demo</span> ' : ""}${editorTitleMarkup}</span></div>`;
  structureNameEl.textContent = isModifiedOrder ? `${structure.name} (modified)` : structure.name;
  boardEl.innerHTML = phases
    .map((phase, columnIndex) => {
      const noteItems = getColumnNotes(board.notes, columnIndex);
      const phaseComments = getPhaseComments(board, columnIndex);
      const commentCount = phaseComments.length;
      const emptyClass = noteItems.length === 0 ? " column-empty" : "";
      const phaseDesc = getPhaseDescription(phase);
      const helpOpen = phaseDesc && phaseHelpOpenColumns.has(columnIndex);
      const phaseTitleLabel = escapeHtml(formatPhaseTitle(phase));
      const phaseTitleHtml = phaseDesc
        ? `<button type="button" class="phase-title phase-title-toggle" data-role="phase-description-toggle" data-column="${columnIndex}" aria-expanded="${Boolean(helpOpen)}"${helpOpen ? ` aria-controls="phase-help-${columnIndex}"` : ""} aria-label="${helpOpen ? "Hide" : "Show"} phase description" title="Show or hide phase description"><span class="phase-description-indicator" aria-hidden="true">ⓘ</span><span class="phase-title-label">${phaseTitleLabel}</span></button>`
        : `<h2 class="phase-title">${phaseTitleLabel}</h2>`;
      const helpPanel =
        phaseDesc && helpOpen
          ? `<p class="phase-help-panel" id="phase-help-${columnIndex}" role="region">${escapeHtml(phaseDesc)}</p>`
          : "";
      return `
      <section class="column${emptyClass}" data-column="${columnIndex}">
        <div class="phase-head">
          <div class="phase-head-top">
            <div class="phase-title-wrap">
              <button class="phase-drag" data-role="phase-drag-handle" title="Drag phase" draggable="true">⋮⋮</button>
              ${phaseTitleHtml}
            </div>
            <div class="phase-head-actions">
              <button class="phase-expand" data-role="open-phase-comments" data-column="${columnIndex}" title="Open phase details">🔍</button>
              <button class="phase-add" data-role="open-column-menu" title="Add note">+</button>
            </div>
          </div>
          ${helpPanel}
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
        ${
          commentCount > 0
            ? `<button class="phase-comments-summary" data-role="open-phase-comments" data-column="${columnIndex}" type="button">${commentCount} ${
                commentCount === 1 ? "comment" : "comments"
              }</button>`
            : ""
        }
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
  views: { landingView, homeView, helpView, privacyView, termsView, groupView, editorView, phaseView },
  homeRoute: HOME_ROUTE,
  getBoards: () => boards,
  getGroups: () => groups,
  getStructureConfig,
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
  renderPhaseDetail: (boardId, phaseIndex) => {
    currentBoardId = boardId;
    activePhaseCommentsColumn = phaseIndex;
    editingPhaseCommentUid = null;
    renderPhaseDetailView();
  },
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

function closeNewStoryOnboardingModal() {
  if (!newStoryOnboardingModalOverlay) return;
  newStoryOnboardingModalOverlay.classList.add("hidden");
}

function openNewStoryOnboardingModal() {
  if (!newStoryOnboardingModalOverlay) return;
  newStoryOnboardingModalOverlay.classList.remove("hidden");
}

function markCurrentBoardOnboardingSeen() {
  const board = getCurrentBoard();
  if (!board) return;
  if (board.onboardingAddNotesHintSeen === true) return;
  board.onboardingAddNotesHintSeen = true;
  saveBoards();
}

function renderGroup() {
  const group = getCurrentGroup();
  if (!group) return;
  const groupBoards = group.boardIds.map((id) => boards.find((board) => board.id === id)).filter(Boolean);
  const isDemoSeries = groupBoards.length > 0 && groupBoards.every((board) => isDemoBoard(board));
  const groupTitleMarkup =
    inlineTitleEdit.getEditingGroupId() === group.id
      ? `<input class="inline-group-title-input" type="text" maxlength="120" value="${escapeHtml(group.title)}" data-role="inline-group-title-input" data-group-id="${group.id}" aria-label="Series name" />`
      : `<span class="group-title-text" data-role="group-title-dblclick">${escapeHtml(group.title)}</span>`;
  groupTitleEl.innerHTML = `<span class="inline-story-title-host" data-role="inline-story-title-host">${isDemoSeries ? '<span class="demo-label">Demo</span> ' : ""}${groupTitleMarkup}</span>`;
  groupSubtitleEl.textContent = `${groupBoards.length} stories`;
  groupBoardStackEl.innerHTML = groupBoards
    .map((board) => {
      const structure = getStructureConfig(board.structureId);
      const phases = getBoardPhases(board);
      return `
      <section class="group-board-card">
        <header class="group-board-head">
          <div>
            <h2><div class="inline-story-title-root" data-board-id="${board.id}"><span class="inline-story-title-host">${isDemoBoard(board) ? '<span class="demo-label">Demo</span> ' : ""}<span class="group-board-title-text">${escapeHtml(board.title)}</span></span></div></h2>
            <p class="subtitle">${structure.name}</p>
          </div>
          <div class="group-board-head-actions">
            <button class="ghost-button" data-role="open-board-from-group" data-board-id="${board.id}" type="button">Edit story</button>
          </div>
        </header>
        <section class="board wrap-columns group-board-preview">
          ${phases
            .map((phase, columnIndex) => {
              const noteItems = getColumnNotes(board.notes, columnIndex);
              const emptyClass = noteItems.length === 0 ? " column-empty" : "";
              const phaseTitleText = escapeHtml(formatPhaseTitle(phase));
              return `
              <section class="column${emptyClass}">
                <div class="phase-head">
                  <h2 class="phase-title">${phaseTitleText}</h2>
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

function commitGroupTitleRenameFromModal(groupId, rawValue) {
  const trimmed = String(rawValue ?? "").trim();
  const group = groups.find((g) => g.id === groupId);
  if (!group) return { ok: true };
  if (!trimmed) return { ok: false, error: "empty" };
  if (trimmed === group.title) return { ok: true };
  group.title = trimmed;
  group.slug = ensureUniqueGroupSlug(slugifyTitle(trimmed), group.id);
  group.updatedAt = Date.now();
  saveGroups();
  renderHome();
  if (currentGroupId === group.id) renderGroup();
  return { ok: true, changed: true };
}

const inlineTitleEdit = createInlineTitleEditController({
  getBoards: () => boards,
  getGroups: () => groups,
  getCurrentBoardId: () => currentBoardId,
  getCurrentGroupId: () => currentGroupId,
  slugifyTitle,
  ensureUniqueSlug,
  touchBoard,
  clearBoardCardPendingOpenTimer: () => {
    clearTimeout(boardCardPendingOpenTimer);
    boardCardPendingOpenTimer = null;
  },
  commitGroupTitleRenameFromModal,
  renderHome,
  renderEditor,
  renderGroup,
});

const groupModalController = createGroupModalController({
  elements: {
    groupActionsModalOverlay,
    closeGroupActionsModalBtn,
    modalReorderGroupBoardsBtn,
    modalDeleteGroupBtn,
    groupReorderModalOverlay,
    closeGroupReorderModalBtn,
    groupReorderListEl,
    groupReorderAddSelectEl,
    groupReorderSeriesNameInput: groupReorderSeriesNameInputEl,
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
  commitGroupTitleRename: commitGroupTitleRenameFromModal,
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
    phaseUids: identityPhaseOrder(structure.phases.length).map(() => generateUniqueUid()),
    nextNoteId: 1,
    nextCommentId: 1,
    notes: [],
    phaseComments: {},
    phaseCommentsVersion: 2,
    onboardingAddNotesHintSeen: false,
    updatedAt: Date.now(),
  };
  boards.push(newBoard);
  saveBoards();
  renderHome();
  return newBoard;
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
    title: demoData.title || "Demo Story",
    slug: ensureUniqueSlug(slugifyTitle(demoData.title || "demo_board")),
    structureId: structure.id,
    structure: structure.name,
    phaseOrder: isValidPhaseOrder(demoData.phaseOrder, structure.phases.length)
      ? [...demoData.phaseOrder]
      : identityPhaseOrder(structure.phases.length),
    phaseUids: identityPhaseOrder(structure.phases.length).map(() => generateUniqueUid()),
    nextNoteId: notes.length + 1,
    nextCommentId: 1,
    notes,
    phaseComments: {},
    phaseCommentsVersion: 2,
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

function resetSingleDemoBoard(board) {
  if (!board) return;
  const boardSlug = board.slug || slugifyTitle(board.title || "");
  let demoData = DEMO_BOARD_DATA.find((demo) => {
    const demoSlug = slugifyTitle(demo.title || "");
    return demoSlug === boardSlug && demo.structure === board.structure;
  });
  if (!demoData) {
    // Fallback for renamed demo stories: if this board is flagged as demo, match by unique structure.
    const sameStructure = DEMO_BOARD_DATA.filter((demo) => demo.structure === board.structure);
    if (isDemoBoard(board) && sameStructure.length === 1) {
      demoData = sameStructure[0];
    }
  }
  if (!demoData) return;
  const fresh = createDemoBoardFromJson(demoData);
  board.structureId = fresh.structureId;
  board.structure = fresh.structure;
  board.phaseOrder = fresh.phaseOrder;
  board.phaseUids = fresh.phaseUids;
  board.nextNoteId = fresh.nextNoteId;
  board.nextCommentId = fresh.nextCommentId;
  board.notes = fresh.notes;
  board.phaseComments = fresh.phaseComments;
  board.phaseCommentsVersion = fresh.phaseCommentsVersion;
  board.isDemo = true;
  board.updatedAt = Date.now();
  saveBoards();
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

function ensureMatrixTrilogySeriesDemo() {
  const normalize = (value) => String(value || "").trim().toLowerCase();
  const trilogyTitle = "The Matrix Trilogy";
  const matrixTitle = "The Matrix";
  const reloadedTitle = "The Matrix Reloaded";
  const revolutionTitle = "The Matrix Revolution";

  const getDemoStoryIdByTitle = (title) =>
    boards.find((b) => b.title === title && demoBoardIds.includes(b.id))?.id || null;

  const matrixId = getDemoStoryIdByTitle(matrixTitle);
  const reloadedId = getDemoStoryIdByTitle(reloadedTitle);
  const revolutionId = getDemoStoryIdByTitle(revolutionTitle);
  if (!matrixId || !reloadedId || !revolutionId) return;

  const desiredOrder = [matrixId, reloadedId, revolutionId];
  let series = groups.find((g) => normalize(g.title) === normalize(trilogyTitle)) || null;
  if (!series) {
    series = {
      id: crypto.randomUUID(),
      uid: generateUniqueUid(),
      title: trilogyTitle,
      slug: slugifyTitle(trilogyTitle),
      boardIds: [...desiredOrder],
      updatedAt: Date.now(),
    };
    groups.push(series);
    saveGroups();
    return;
  }

  const currentIds = series.boardIds || [];
  const currentSet = new Set(currentIds);
  const allCurrentIdsAreDemo = currentIds.length > 0 && currentIds.every((id) => demoBoardIds.includes(id));

  let changed = false;
  if (allCurrentIdsAreDemo) {
    if (currentIds.join("|") !== desiredOrder.join("|")) {
      series.boardIds = [...desiredOrder];
      changed = true;
    }
  } else {
    const missingInOrder = desiredOrder.filter((id) => !currentSet.has(id));
    if (missingInOrder.length > 0) {
      series.boardIds = [...currentIds, ...missingInOrder];
      changed = true;
    }
  }

  if (!changed) return;
  series.updatedAt = Date.now();
  saveGroups();
}

function boardToExportPayload(board) {
  const structure = getStructureConfig(board.structureId);
  const phaseUids = ensureBoardPhaseUids(board);
  normalizeBoardPhaseComments(board);
  const exportedPhaseComments = {};
  phaseUids.forEach((phaseUid) => {
    const comments = Array.isArray(board.phaseComments[phaseUid]) ? board.phaseComments[phaseUid] : [];
    exportedPhaseComments[phaseUid] = comments
      .map((comment) => ({
        id: Number.isInteger(comment.id) ? comment.id : undefined,
        uid: typeof comment.uid === "string" && comment.uid ? comment.uid : generateUniqueUid(),
        text: typeof comment.text === "string" ? comment.text : "",
        createdAt: Number.isFinite(comment.createdAt) ? comment.createdAt : Date.now(),
        updatedAt: Number.isFinite(comment.updatedAt) ? comment.updatedAt : Date.now(),
      }))
      .sort((a, b) => a.createdAt - b.createdAt || (a.id || 0) - (b.id || 0));
  });
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
    phaseUids,
    phaseCommentsVersion: 2,
    phaseComments: exportedPhaseComments,
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
  const filename = `${slugifyTitle(board.title || "story")}.json`;
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadJsonFile(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function normalizeStructureFingerprint(name, phases) {
  const normalizedName = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const normalizedPhases = Array.isArray(phases)
    ? phases
        .map((phase) => String(parsePhaseEntry(phase).title || "").trim().toLowerCase().replace(/\s+/g, " "))
        .join("|")
    : "";
  return `${normalizedName}::${normalizedPhases}`;
}

function exportCustomStructures() {
  const payload = {
    exportType: "structurer.custom-structures",
    schemaVersion: 2,
    exportedAt: Date.now(),
    appVersion: packageJson.version || "",
    structures: customStructures.map((structure) => {
      const row = {
        id: structure.id,
        uid: structure.uid,
        name: structure.name,
        phases: Array.isArray(structure.phases) ? structure.phases : [],
        updatedAt: Number.isFinite(structure.updatedAt) ? structure.updatedAt : Date.now(),
      };
      if (typeof structure.description === "string" && structure.description.trim()) {
        row.description = structure.description.trim();
      }
      if (typeof structure.author === "string" && structure.author.trim()) {
        row.author = structure.author.trim();
      }
      return row;
    }),
  };
  const stamp = new Date().toISOString().replace(/[:]/g, "-").slice(0, 19);
  downloadJsonFile(payload, `structurer-custom-structures-${stamp}.json`);
}

function normalizeImportedStructurePhase(phase, pathLabel) {
  if (typeof phase === "string") {
    const title = String(phase || "").trim();
    if (!title) {
      throw new Error(`Invalid custom structures file: ${pathLabel} must be a non-empty string or object with title.`);
    }
    return title;
  }
  if (phase && typeof phase === "object" && !Array.isArray(phase)) {
    const title = String(phase.title ?? phase.name ?? "").trim();
    if (!title) {
      throw new Error(`Invalid custom structures file: ${pathLabel} must include a non-empty title.`);
    }
    const description = typeof phase.description === "string" ? phase.description.trim() : "";
    return description ? { title, description } : { title };
  }
  throw new Error(`Invalid custom structures file: ${pathLabel} must be a string or { title, description? }.`);
}

function parseImportedCustomStructures(rawText) {
  const parsed = JSON.parse(rawText);
  if (!parsed || typeof parsed !== "object" || parsed.exportType !== "structurer.custom-structures") {
    throw new Error("Invalid custom structures file.");
  }
  const schemaVersion = parsed.schemaVersion;
  if (schemaVersion != null && schemaVersion !== 1 && schemaVersion !== 2) {
    throw new Error("Invalid custom structures file: unsupported schemaVersion (expected 1 or 2).");
  }
  if (!Array.isArray(parsed.structures) || parsed.structures.length === 0) {
    throw new Error("Invalid custom structures file: structures must be a non-empty array.");
  }
  const builtInIds = new Set(Object.keys(BUILTIN_STRUCTURES));
  const localByUid = new Map(customStructures.map((item) => [item.uid, item]));
  const localById = new Map(customStructures.map((item) => [item.id, item]));
  const seenIds = new Set();
  const seenUids = new Set();
  const seenFingerprints = new Set();
  const normalized = parsed.structures.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Invalid custom structures file: entry #${index + 1} must be an object.`);
    }
    const id = typeof item.id === "string" ? item.id.trim() : "";
    const uid = typeof item.uid === "string" ? item.uid.trim() : "";
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const phases = Array.isArray(item.phases)
      ? item.phases.map((phase, pi) =>
          normalizeImportedStructurePhase(phase, `entry #${index + 1} phase #${pi + 1}`),
        )
      : null;
    const updatedAt = Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now();

    if (!id || !uid || !name || !phases) {
      throw new Error(`Invalid custom structures file: entry #${index + 1} is missing required fields.`);
    }
    if (!/^custom_[a-z0-9_]+$/.test(id)) {
      throw new Error(`Invalid custom structures file: entry #${index + 1} has invalid id "${id}".`);
    }
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(uid)) {
      throw new Error(`Invalid custom structures file: entry #${index + 1} has invalid uid "${uid}".`);
    }
    if (phases.length < 2 || phases.some((phase) => !phase)) {
      throw new Error(`Invalid custom structures file: entry #${index + 1} must include at least 2 non-empty phases.`);
    }
    if (builtInIds.has(id)) {
      throw new Error(`Invalid custom structures file: id "${id}" conflicts with a built-in structure.`);
    }
    if (seenIds.has(id)) {
      throw new Error(`Invalid custom structures file: duplicate id "${id}".`);
    }
    if (seenUids.has(uid)) {
      throw new Error(`Invalid custom structures file: duplicate uid "${uid}".`);
    }
    const fingerprint = normalizeStructureFingerprint(name, phases);
    if (seenFingerprints.has(fingerprint)) {
      throw new Error(`Invalid custom structures file: duplicate structure content for "${name}".`);
    }
    seenIds.add(id);
    seenUids.add(uid);
    seenFingerprints.add(fingerprint);

    const localBySameId = localById.get(id);
    if (localBySameId && localBySameId.uid !== uid) {
      throw new Error(`Invalid custom structures file: id "${id}" conflicts with another local structure.`);
    }
    const localBySameUid = localByUid.get(uid);
    if (localBySameUid && localBySameUid.id !== id) {
      throw new Error(`Invalid custom structures file: uid "${uid}" conflicts with local id mapping.`);
    }
    const entry = { id, uid, name, phases, updatedAt };
    if (Object.prototype.hasOwnProperty.call(item, "description")) {
      if (typeof item.description !== "string") {
        throw new Error(
          `Invalid custom structures file: entry #${index + 1} description must be a string when present.`,
        );
      }
      const descRes = validateStructureDescription(item.description);
      if (!descRes.ok) {
        throw new Error(`Invalid custom structures file: entry #${index + 1}: ${descRes.error}`);
      }
      entry.description = descRes.value;
    }
    if (Object.prototype.hasOwnProperty.call(item, "author")) {
      if (typeof item.author !== "string") {
        throw new Error(
          `Invalid custom structures file: entry #${index + 1} author must be a string when present.`,
        );
      }
      const authRes = validateStructureAuthor(item.author);
      if (!authRes.ok) {
        throw new Error(`Invalid custom structures file: entry #${index + 1}: ${authRes.error}`);
      }
      entry.author = authRes.value;
    }
    return entry;
  });

  return normalized;
}

function importCustomStructuresFromText(rawText) {
  const imported = parseImportedCustomStructures(rawText);
  const localByUid = new Map(customStructures.map((item) => [item.uid, item]));
  const localByFingerprint = new Map(
    customStructures.map((item) => [normalizeStructureFingerprint(item.name, item.phases), item]),
  );

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const importTimestamp = Date.now();

  imported.forEach((incoming) => {
    const localByUidMatch = localByUid.get(incoming.uid);
    if (localByUidMatch) {
      if ((incoming.updatedAt || 0) > (localByUidMatch.updatedAt || 0)) {
        localByUidMatch.name = incoming.name;
        localByUidMatch.phases = incoming.phases;
        localByUidMatch.updatedAt = incoming.updatedAt;
        if (Object.prototype.hasOwnProperty.call(incoming, "description")) {
          if (incoming.description) localByUidMatch.description = incoming.description;
          else delete localByUidMatch.description;
        }
        if (Object.prototype.hasOwnProperty.call(incoming, "author")) {
          if (incoming.author) localByUidMatch.author = incoming.author;
          else delete localByUidMatch.author;
        }
        customStructureActivity[localByUidMatch.uid] = importTimestamp;
        updatedCount += 1;
      } else {
        skippedCount += 1;
      }
      return;
    }
    const localByFingerprintMatch = localByFingerprint.get(
      normalizeStructureFingerprint(incoming.name, incoming.phases),
    );
    if (localByFingerprintMatch) {
      if ((incoming.updatedAt || 0) > (localByFingerprintMatch.updatedAt || 0)) {
        localByFingerprintMatch.name = incoming.name;
        localByFingerprintMatch.phases = incoming.phases;
        localByFingerprintMatch.updatedAt = incoming.updatedAt;
        if (Object.prototype.hasOwnProperty.call(incoming, "description")) {
          if (incoming.description) localByFingerprintMatch.description = incoming.description;
          else delete localByFingerprintMatch.description;
        }
        if (Object.prototype.hasOwnProperty.call(incoming, "author")) {
          if (incoming.author) localByFingerprintMatch.author = incoming.author;
          else delete localByFingerprintMatch.author;
        }
        customStructureActivity[localByFingerprintMatch.uid] = importTimestamp;
        updatedCount += 1;
      } else {
        skippedCount += 1;
      }
      return;
    }
    const created = {
      id: incoming.id,
      uid: incoming.uid,
      name: incoming.name,
      phases: incoming.phases,
      updatedAt: incoming.updatedAt,
    };
    if (incoming.description) created.description = incoming.description;
    if (incoming.author) created.author = incoming.author;
    customStructures.push(created);
    customStructureActivity[incoming.uid] = importTimestamp;
    createdCount += 1;
  });

  if (createdCount > 0 || updatedCount > 0) {
    saveCustomStructures();
    saveCustomStructureActivity();
    renderStructureOptions();
    renderHome();
  }

  return { createdCount, updatedCount, skippedCount, total: imported.length };
}

function getCustomStructureImportSuccessMessage(result) {
  const changedCount = result.createdCount + result.updatedCount;
  if (changedCount > 0 && result.skippedCount === 0) {
    return "Import completed. The structure is now available in the Active structures list.";
  }
  if (changedCount > 0 && result.skippedCount > 0) {
    return "Import completed. Some structures were added/updated, while others were already present and were skipped.";
  }
  return "Nothing changed. This structure is already present and up to date.";
}

function getCustomStructureImportErrorMessage(error) {
  const message = error instanceof Error ? error.message : "";
  if (!message) {
    return "Import failed. The file appears to be invalid or corrupted.";
  }
  if (message.startsWith("Invalid custom structures file")) {
    return "Import failed. The structure file format is invalid or corrupted.";
  }
  return `Import failed. ${message}`;
}

function exportFullAppBackup() {
  const backup = {
    backupType: "structurer.full-backup",
    schemaVersion: 1,
    exportedAt: Date.now(),
    appVersion: packageJson.version || "",
    data: {
      boards,
      settings: { columnMinWidth, wrapColumns, showDemoBoards },
      customStructures,
      customStructureActivity,
      customArchetypes,
      customNoteTypes,
      noteTypeOverrides,
      groups,
      demoBoardIds,
    },
  };
  const stamp = new Date().toISOString().replace(/[:]/g, "-").slice(0, 19);
  downloadJsonFile(backup, `structurer-full-backup-${stamp}.json`);
}

function restoreFullAppBackupFromText(rawText) {
  const parsed = JSON.parse(rawText);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid backup JSON.");
  }
  if (parsed.backupType !== "structurer.full-backup") {
    throw new Error("This file is not a Structurer full backup.");
  }
  const data = parsed.data;
  if (!data || typeof data !== "object") {
    throw new Error("Invalid backup payload: missing data block.");
  }

  const nextBoards = Array.isArray(data.boards) ? data.boards : [];
  const nextSettings = data.settings && typeof data.settings === "object" ? data.settings : {};
  const nextCustomStructures = Array.isArray(data.customStructures) ? data.customStructures : [];
  const nextCustomStructureActivity =
    data.customStructureActivity && typeof data.customStructureActivity === "object" ? data.customStructureActivity : {};
  const nextCustomArchetypes = Array.isArray(data.customArchetypes) ? data.customArchetypes : [];
  const nextCustomNoteTypes = Array.isArray(data.customNoteTypes) ? data.customNoteTypes : [];
  const nextNoteTypeOverrides =
    data.noteTypeOverrides && typeof data.noteTypeOverrides === "object" ? data.noteTypeOverrides : {};
  const nextGroups = Array.isArray(data.groups) ? data.groups : [];
  const nextDemoBoardIds = Array.isArray(data.demoBoardIds) ? data.demoBoardIds : [];

  clearKeys([
    STORAGE_KEY,
    SETTINGS_KEY,
    CUSTOM_STRUCTURES_KEY,
    CUSTOM_STRUCTURE_ACTIVITY_KEY,
    CUSTOM_ARCHETYPES_KEY,
    CUSTOM_NOTE_TYPES_KEY,
    NOTE_TYPE_OVERRIDES_KEY,
    GROUPS_KEY,
    DEMO_BOARD_IDS_KEY,
    PHASE_HELP_STATE_KEY,
  ]);
  saveJsonItem(STORAGE_KEY, nextBoards);
  saveJsonItem(SETTINGS_KEY, nextSettings);
  saveJsonItem(CUSTOM_STRUCTURES_KEY, nextCustomStructures);
  saveJsonItem(CUSTOM_STRUCTURE_ACTIVITY_KEY, nextCustomStructureActivity);
  saveJsonItem(CUSTOM_ARCHETYPES_KEY, nextCustomArchetypes);
  saveJsonItem(CUSTOM_NOTE_TYPES_KEY, nextCustomNoteTypes);
  saveJsonItem(NOTE_TYPE_OVERRIDES_KEY, nextNoteTypeOverrides);
  saveJsonItem(GROUPS_KEY, nextGroups);
  saveJsonItem(DEMO_BOARD_IDS_KEY, nextDemoBoardIds);

  window.location.assign(HOME_ROUTE);
  return parsed;
}

function closeBoardActionsModal() {
  boardActionsModalOverlay.classList.add("hidden");
  boardActionsModalBoardId = null;
}

function closeDeleteStoryModal() {
  if (!deleteStoryModalOverlay) return;
  deleteStoryModalOverlay.classList.add("hidden");
  pendingDeleteStoryBoardId = null;
  if (deleteStoryConfirmCheckbox) {
    deleteStoryConfirmCheckbox.checked = false;
  }
  if (confirmDeleteStoryBtn) {
    confirmDeleteStoryBtn.disabled = true;
  }
}

function openDeleteStoryModal(boardId) {
  if (!deleteStoryModalOverlay) return;
  dismissAllAppAlerts();
  const board = boards.find((item) => item.id === boardId);
  if (!board) return;
  pendingDeleteStoryBoardId = boardId;
  if (deleteStoryModalIntroEl) {
    deleteStoryModalIntroEl.innerHTML = `This will permanently delete <strong>${escapeHtml(
      board.title,
    )}</strong> and all its notes. This cannot be undone.`;
  }
  if (deleteStoryConfirmCheckbox) {
    deleteStoryConfirmCheckbox.checked = false;
  }
  if (confirmDeleteStoryBtn) {
    confirmDeleteStoryBtn.disabled = true;
  }
  deleteStoryModalOverlay.classList.remove("hidden");
  if (cancelDeleteStoryBtn) {
    cancelDeleteStoryBtn.focus();
  }
}

function groupsEligibleForBoard(boardId) {
  const board = boards.find((b) => b.id == boardId);
  if (!board) return [];
  return groups.filter((g) => !g.boardIds.some((bid) => bid == board.id));
}

function openBoardActionsModal(boardId) {
  dismissAllAppAlerts();
  boardActionsModalBoardId = boardId;
  boardActionsModalOverlay.classList.remove("hidden");
  const board = boards.find((b) => b.id == boardId);
  if (modalAddBoardToGroupBtn) {
    const eligible = groupsEligibleForBoard(boardId);
    modalAddBoardToGroupBtn.disabled = groups.length === 0 || eligible.length === 0;
    if (groups.length === 0) {
    modalAddBoardToGroupBtn.title = "Create a series first";
    } else if (eligible.length === 0) {
    modalAddBoardToGroupBtn.title = "This story is already in every series";
    } else {
      modalAddBoardToGroupBtn.title = "";
    }
  }
  if (modalResetPhaseOrderBtn) {
    const canReset = Boolean(board && isPhaseOrderModified(board));
    modalResetPhaseOrderBtn.disabled = !canReset;
    modalResetPhaseOrderBtn.title = canReset ? "" : "Phase order already matches the structure";
  }
  if (modalResetDemoBoardBtn) {
    const isDemo = Boolean(board && isDemoBoard(board));
    modalResetDemoBoardBtn.classList.toggle("hidden", !isDemo);
    modalResetDemoBoardBtn.disabled = !isDemo;
    modalResetDemoBoardBtn.title = isDemo ? "Restore this demo story to its original notes" : "";
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
        "This story is already in every series. Create a new series from the dashboard, or remove the story from a series first.";
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
      ${escapeHtml(group.title)} <span class="board-meta">(${group.boardIds.length} stories)</span>
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

  phaseOrderConflictTitleEl.textContent = payload?.boardTitle ? `Story: ${payload.boardTitle}` : "";
  phaseOrderCurrentListEl.innerHTML = renderList(currentOrder, firstMismatchIndex);
  phaseOrderImportedListEl.innerHTML = renderList(importedOrder, firstMismatchIndex);
  if (phaseOrderConflictHintEl) {
    phaseOrderConflictHintEl.textContent =
      "Please manually align the current story phase order, then repeat the import.";
  }
  phaseOrderConflictModalOverlay.classList.remove("hidden");
}

function importBoardFromJson(rawText) {
  const parsed = JSON.parse(rawText);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.notes)) {
    throw new Error("Invalid story JSON format.");
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
  const title =
    typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "Imported Story";
  const importedBoardUpdatedAt = Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : Date.now();
  const phaseCount = structure.phases.length;
  const importedPhaseOrder = isValidPhaseOrder(parsed.phaseOrder, structure.phases.length)
    ? [...parsed.phaseOrder]
    : identityPhaseOrder(structure.phases.length);
  const importedPhaseUids = Array.isArray(parsed.phaseUids) ? parsed.phaseUids : [];
  const normalizedImportedPhaseUids = identityPhaseOrder(phaseCount).map((phaseId) => {
    const candidate = importedPhaseUids[phaseId];
    return typeof candidate === "string" && candidate ? candidate : generateUniqueUid();
  });
  const normalizeImportedPhaseCommentsByPhaseId = () => {
    const byPhaseId = new Map();
    if (!parsed.phaseComments || typeof parsed.phaseComments !== "object" || Array.isArray(parsed.phaseComments)) {
      return byPhaseId;
    }
    const phaseUidToPhaseId = new Map();
    normalizedImportedPhaseUids.forEach((uid, phaseId) => {
      phaseUidToPhaseId.set(uid, phaseId);
    });
    Object.entries(parsed.phaseComments).forEach(([phaseKey, comments]) => {
      if (!Array.isArray(comments)) return;
      let phaseId = null;
      if (phaseUidToPhaseId.has(phaseKey)) {
        phaseId = phaseUidToPhaseId.get(phaseKey);
      } else {
        const legacyColumn = Number(phaseKey);
        const legacyPhaseId = importedPhaseOrder[legacyColumn];
        if (Number.isInteger(legacyPhaseId)) {
          phaseId = legacyPhaseId;
        }
      }
      if (!Number.isInteger(phaseId) || phaseId < 0 || phaseId >= phaseCount) return;
      const normalizedItems = comments
        .filter((comment) => comment && typeof comment === "object")
        .map((comment, index) => ({
          id: Number.isInteger(comment.id) ? comment.id : index + 1,
          uid: typeof comment.uid === "string" && comment.uid ? comment.uid : generateUniqueUid(),
          text: typeof comment.text === "string" ? comment.text : "",
          createdAt: Number.isFinite(comment.createdAt) ? comment.createdAt : Date.now(),
          updatedAt: Number.isFinite(comment.updatedAt) ? comment.updatedAt : Date.now(),
        }))
        .sort((a, b) => a.createdAt - b.createdAt || a.id - b.id);
      const current = byPhaseId.get(phaseId) || [];
      byPhaseId.set(phaseId, [...current, ...normalizedItems]);
    });
    byPhaseId.forEach((comments, phaseId) => {
      byPhaseId.set(
        phaseId,
        comments.sort((a, b) => a.createdAt - b.createdAt || a.id - b.id),
      );
    });
    return byPhaseId;
  };
  const importedCommentsByPhaseId = normalizeImportedPhaseCommentsByPhaseId();
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
    ensureBoardPhaseUids(existingByUid);
    normalizeBoardPhaseComments(existingByUid);
    const existingPhaseOrder = getBoardPhaseOrder(existingByUid);
    if (existingByUid.structureId !== structure.id) {
      throw new Error(
        `Cannot merge story "${existingByUid.title}": structure mismatch (${existingByUid.structure} vs ${structure.name}).`,
      );
    }
    const sameOrder =
      existingPhaseOrder.length === importedPhaseOrder.length &&
      existingPhaseOrder.every((value, index) => value === importedPhaseOrder[index]);
    if (!sameOrder) {
      const structurePhases = getStructureConfig(existingByUid.structureId).phases;
      const error = new Error(`Cannot merge story "${existingByUid.title}" because phase order differs.`);
      error.code = "PHASE_ORDER_CONFLICT";
      error.phaseOrderConflict = {
        boardTitle: existingByUid.title,
        currentOrder: existingPhaseOrder.map((phaseIndex) =>
          formatPhaseTitle(structurePhases[phaseIndex]) || "-",
        ),
        importedOrder: importedPhaseOrder.map((phaseIndex) =>
          formatPhaseTitle(structurePhases[phaseIndex]) || "-",
        ),
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

    const localCommentLocationsByUid = new Map();
    Object.entries(existingByUid.phaseComments).forEach(([phaseUid, comments]) => {
      if (!Array.isArray(comments)) return;
      comments.forEach((comment) => {
        if (comment && typeof comment.uid === "string" && comment.uid) {
          localCommentLocationsByUid.set(comment.uid, { phaseUid, comment });
        }
      });
    });
    importedCommentsByPhaseId.forEach((comments, phaseId) => {
      const targetPhaseUid = existingByUid.phaseUids[phaseId];
      if (!targetPhaseUid) return;
      if (!Array.isArray(existingByUid.phaseComments[targetPhaseUid])) {
        existingByUid.phaseComments[targetPhaseUid] = [];
      }
      comments.forEach((importedComment) => {
        const localInfo = localCommentLocationsByUid.get(importedComment.uid);
        if (!localInfo) {
          const nextId =
            Number.isInteger(existingByUid.nextCommentId) && existingByUid.nextCommentId > 0
              ? existingByUid.nextCommentId
              : 1;
          existingByUid.nextCommentId = nextId + 1;
          const created = {
            id: nextId,
            uid: importedComment.uid,
            text: importedComment.text,
            createdAt: importedComment.createdAt,
            updatedAt: importedComment.updatedAt,
          };
          existingByUid.phaseComments[targetPhaseUid].push(created);
          localCommentLocationsByUid.set(importedComment.uid, { phaseUid: targetPhaseUid, comment: created });
          return;
        }
        const localComment = localInfo.comment;
        if ((importedComment.updatedAt || 0) > (localComment.updatedAt || 0)) {
          localComment.text = importedComment.text;
          localComment.createdAt = importedComment.createdAt;
          localComment.updatedAt = importedComment.updatedAt;
          if (localInfo.phaseUid !== targetPhaseUid) {
            existingByUid.phaseComments[localInfo.phaseUid] = (existingByUid.phaseComments[localInfo.phaseUid] || []).filter(
              (entry) => entry.uid !== importedComment.uid,
            );
            existingByUid.phaseComments[targetPhaseUid].push(localComment);
            localInfo.phaseUid = targetPhaseUid;
          }
        }
      });
    });
    Object.keys(existingByUid.phaseComments).forEach((phaseUid) => {
      const comments = Array.isArray(existingByUid.phaseComments[phaseUid]) ? existingByUid.phaseComments[phaseUid] : [];
      existingByUid.phaseComments[phaseUid] = comments.sort((a, b) => a.createdAt - b.createdAt || a.id - b.id);
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
    existingByUid.phaseCommentsVersion = 2;
    const maxCommentId = Object.values(existingByUid.phaseComments)
      .flat()
      .reduce((max, comment) => Math.max(max, Number(comment?.id) || 0), 0);
    existingByUid.nextCommentId = Math.max(existingByUid.nextCommentId || 1, maxCommentId + 1);
    saveBoards();
    renderHome();
    return;
  }

  const newPhaseComments = {};
  importedCommentsByPhaseId.forEach((comments, phaseId) => {
    const phaseUid = normalizedImportedPhaseUids[phaseId];
    if (!phaseUid) return;
    newPhaseComments[phaseUid] = comments;
  });
  const maxImportedCommentId = [...importedCommentsByPhaseId.values()]
    .flat()
    .reduce((max, comment) => Math.max(max, Number(comment?.id) || 0), 0);
  const newBoard = {
    id: crypto.randomUUID(),
    uid: typeof parsed.uid === "string" ? parsed.uid : generateUniqueUid(),
    updatedAt: importedBoardUpdatedAt,
    title,
    slug: ensureUniqueSlug(slugifyTitle(title)),
    structureId: structure.id,
    structure: structure.name,
    phaseOrder: importedPhaseOrder,
    phaseUids: normalizedImportedPhaseUids,
    nextNoteId: notes.length + 1,
    nextCommentId: Math.max(maxImportedCommentId + 1, 1),
    notes,
    phaseComments: newPhaseComments,
    phaseCommentsVersion: 2,
  };
  normalizeOrders(newBoard.notes, newBoard.structureId);
  boards.push(newBoard);
  saveBoards();
  renderHome();
}

function openBoard(boardId, replaceRoute = false, fromGroupId = null) {
  inlineTitleEdit.flush();
  navigation.openBoard(boardId, replaceRoute, fromGroupId);
}

function openBoardPhase(boardId, columnIndex, replaceRoute = false, fromGroupId = null) {
  inlineTitleEdit.flush();
  navigation.openBoardPhase(boardId, columnIndex, replaceRoute, fromGroupId);
}

function openHome(replaceRoute = false) {
  inlineTitleEdit.flush();
  navigation.openHome(replaceRoute);
}

function openLanding(replaceRoute = false) {
  inlineTitleEdit.flush();
  navigation.openLanding(replaceRoute);
}

function openHelp(replaceRoute = false) {
  inlineTitleEdit.flush();
  navigation.openHelp(replaceRoute);
}

function openPrivacy(replaceRoute = false) {
  inlineTitleEdit.flush();
  navigation.openPrivacy(replaceRoute);
}

function openTerms(replaceRoute = false) {
  inlineTitleEdit.flush();
  navigation.openTerms(replaceRoute);
}

function openGroup(groupId, replaceRoute = false) {
  inlineTitleEdit.flush();
  navigation.openGroup(groupId, replaceRoute);
}

function syncRouteToState(replaceRoute = true) {
  navigation.syncRouteToState(replaceRoute);
}

function getCurrentPhaseName(board, columnIndex) {
  const phases = getBoardPhases(board);
  if (!Array.isArray(phases) || !phases[columnIndex]) return `Phase ${columnIndex + 1}`;
  return formatPhaseTitle(phases[columnIndex]);
}

function renderPhaseDetailView() {
  const board = getCurrentBoard();
  if (!board || !Number.isInteger(activePhaseCommentsColumn) || !phaseCommentsListEl) return;
  const comments = getPhaseComments(board, activePhaseCommentsColumn);
  const notes = getColumnNotes(board.notes, activePhaseCommentsColumn);
  const phaseName = getCurrentPhaseName(board, activePhaseCommentsColumn);
  if (phaseCommentsTitleEl) phaseCommentsTitleEl.textContent = `Phase details - ${phaseName}`;
  if (phaseCommentsSubtitleEl) {
    phaseCommentsSubtitleEl.textContent = `${board.title} - ${
      comments.length === 1 ? "1 comment" : `${comments.length} comments`
    }`;
  }

  if (phaseNotesListEl) {
    phaseNotesListEl.innerHTML = notes
      .map((note) => {
        const type = noteTypeById(note.kind);
        const archetype = archetypeById(note.archetype || "none");
        const title =
          note.kind === "character"
            ? `${archetype.label}${note.characterName ? ` - ${note.characterName}` : ""}`
            : type.label;
        return `<article class="phase-note-item" style="--note-bg:${escapeHtml(type.color)};">
          <div class="phase-note-item-head">${escapeHtml(title)}</div>
          <p class="phase-note-item-text">${escapeHtml((note.text || "").trim() || "Empty note")}</p>
        </article>`;
      })
      .join("");
  }
  if (phaseNotesEmptyEl) {
    phaseNotesEmptyEl.classList.toggle("hidden", notes.length > 0);
  }

  phaseCommentsListEl.innerHTML = comments
    .map((comment) => {
      const isEditing = editingPhaseCommentUid === comment.uid;
      return `<article class="phase-comment-item${isEditing ? " is-editing" : ""}" data-comment-uid="${comment.uid}">
        ${
          isEditing
            ? `<textarea class="phase-comment-edit-input" data-role="phase-comment-edit-input">${escapeHtml(
                comment.text,
              )}</textarea>`
            : ""
        }
        <div class="phase-comment-actions">
          ${
            isEditing
              ? `<button class="ghost-button" data-role="save-phase-comment-edit" type="button">Save</button>
                 <button class="ghost-button" data-role="cancel-phase-comment-edit" type="button">Cancel</button>`
              : `<button class="icon-action-button" data-role="edit-phase-comment" type="button" aria-label="Edit comment" title="Edit comment">✎</button>
                 <button class="icon-action-button danger-menu-item" data-role="delete-phase-comment" type="button" aria-label="Delete comment" title="Delete comment">✕</button>`
          }
        </div>
        ${
          isEditing
            ? ""
            : `<p class="phase-comment-text">${escapeHtml(comment.text || "")}</p>`
        }
      </article>`;
    })
    .join("");

  if (phaseCommentsEmptyEl) {
    phaseCommentsEmptyEl.classList.toggle("hidden", comments.length > 0);
  }
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
  const newBoard = createBoard(title, boardStructureSelect.value);
  boardTitleInput.value = "";
  closeDashboardCreateStoryModal();
  closeDashboardActionsModal();
  if (newBoard?.id) {
    openBoard(newBoard.id);
    openNewStoryOnboardingModal();
  }
});

addStructurePhaseBtn.addEventListener("click", () => {
  const values = collectStructurePhaseRowsFromDOM();
  values.push({ title: "", description: "" });
  renderStructurePhaseRows(values);
});

structurePhasesList.addEventListener("click", (event) => {
  const removeButton = event.target.closest('button[data-role="remove-phase-row"]');
  if (!removeButton) return;
  const rows = [...structurePhasesList.querySelectorAll(".structure-phase-row")];
  if (rows.length <= 2) return;
  removeButton.closest(".structure-phase-row").remove();
  const values = collectStructurePhaseRowsFromDOM();
  renderStructurePhaseRows(values);
});

structurePhasesList.addEventListener("input", () => {
  // Keep list in sync; no additional actions needed.
});

createStructureForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = structureNameInput.value.trim();
  if (!name) return;

  const rawDesc = structureDescriptionInput ? structureDescriptionInput.value : "";
  const rawAuthor = structureAuthorInput ? structureAuthorInput.value : "";
  const descRes = validateStructureDescription(rawDesc);
  if (!descRes.ok) {
    await appAlert(descRes.error);
    return;
  }
  const authRes = validateStructureAuthor(rawAuthor);
  if (!authRes.ok) {
    await appAlert(authRes.error);
    return;
  }

  const phaseEntries = collectStructurePhaseRowsFromDOM()
    .map((row) => {
      const title = row.title.trim();
      if (!title) return null;
      const description = row.description.trim();
      return description ? { title, description } : { title };
    })
    .filter(Boolean);

  if (phaseEntries.length < 2) {
    await appAlert("Please add at least 2 phases.");
    return;
  }

  const baseId = `custom_${slugifyTitle(name)}`;
  let id = baseId;
  let suffix = 2;
  while (getAllStructures()[id]) {
    id = `${baseId}_${suffix}`;
    suffix += 1;
  }

  const createdAt = Date.now();
  const uid = generateUniqueUid();
  const newStructure = {
    id,
    uid,
    name,
    phases: phaseEntries,
    updatedAt: createdAt,
  };
  if (descRes.value) newStructure.description = descRes.value;
  if (authRes.value) newStructure.author = authRes.value;
  customStructures.push(newStructure);
  customStructureActivity[uid] = createdAt;
  saveCustomStructures();
  saveCustomStructureActivity();
  renderStructureOptions(id);
  structureNameInput.value = "";
  if (structureDescriptionInput) structureDescriptionInput.value = "";
  if (structureAuthorInput) structureAuthorInput.value = "";
  renderStructurePhaseRows();
  await appAlert(`Structure "${name}" saved.`);
  closeDashboardCreateStructureModal();
  closeDashboardActionsModal();
});

boardsList.addEventListener("click", (event) => {
  if (event.target.closest('[data-role="inline-story-title-input"]')) return;
  const cardEarly = event.target.closest(".board-card");
  if (cardEarly && inlineTitleEdit.getEditingStoryBoardId() === cardEarly.dataset.boardId) {
    const root = cardEarly.querySelector('[data-role="inline-story-title-root"]');
    if (root && root.contains(event.target)) return;
  }
  const boardCard = event.target.closest(".board-card");
  if (!boardCard) return;
  const boardId = boardCard.dataset.boardId;
  const actionButton = event.target.closest("button[data-role]");
  if (actionButton && actionButton.dataset.role === "board-actions") {
    openBoardActionsModal(boardId);
    return;
  }
  const titleEl = event.target.closest('[data-role="board-title-dblclick"]');
  if (titleEl) {
    if (event.detail === 2) {
      clearTimeout(boardCardPendingOpenTimer);
      boardCardPendingOpenTimer = null;
      inlineTitleEdit.beginStory(boardId);
      return;
    }
    clearTimeout(boardCardPendingOpenTimer);
    boardCardPendingOpenTimer = window.setTimeout(() => {
      boardCardPendingOpenTimer = null;
      openBoard(boardId);
    }, 280);
    return;
  }
  openBoard(boardId);
});

boardsList.addEventListener("keydown", (event) => {
  if (event.target.closest('[data-role="inline-story-title-input"]')) return;
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

if (goDashboardFromPrivacyBtn) {
  goDashboardFromPrivacyBtn.addEventListener("click", () => {
    openHome();
  });
}

if (goDashboardFromTermsBtn) {
  goDashboardFromTermsBtn.addEventListener("click", () => {
    openHome();
  });
}

if (goPrivacyFromFooterBtn) {
  goPrivacyFromFooterBtn.addEventListener("click", () => {
    openPrivacy();
  });
}

if (goTermsFromFooterBtn) {
  goTermsFromFooterBtn.addEventListener("click", () => {
    openTerms();
  });
}

if (goHelpFromFooterBtn) {
  goHelpFromFooterBtn.addEventListener("click", () => {
    openHelp();
  });
}

goDashboardFromBoardBtn.addEventListener("click", () => {
  if (boardBackGroupId && groups.some((group) => group.id === boardBackGroupId)) {
    openGroup(boardBackGroupId);
    return;
  }
  openHome();
});

if (goBoardFromPhaseBtn) {
  goBoardFromPhaseBtn.addEventListener("click", () => {
    if (!currentBoardId) return;
    openBoard(currentBoardId, false, boardBackGroupId);
  });
}

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
    closeDashboardImportModal();
    closeDashboardActionsModal();
    await appAlert("Story imported successfully.");
  } catch (error) {
    if (error instanceof Error && error.code === "PHASE_ORDER_CONFLICT" && error.phaseOrderConflict) {
      // Keep the import modal open so the user can retry if needed.
      openPhaseOrderConflictModal(error.phaseOrderConflict);
    } else {
      await appAlert(
        error instanceof Error
          ? error.message
          : "Import failed. Please use a valid Structurer story JSON.",
      );
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

boardEl.addEventListener("click", (event) => {
  const descToggle = event.target.closest('[data-role="phase-description-toggle"]');
  if (descToggle) {
    event.preventDefault();
    const columnIndex = Number(descToggle.dataset.column);
    if (!Number.isInteger(columnIndex)) return;
    if (phaseHelpOpenColumns.has(columnIndex)) phaseHelpOpenColumns.delete(columnIndex);
    else phaseHelpOpenColumns.add(columnIndex);
    const board = getCurrentBoard();
    if (board) persistPhaseHelpStateForBoard(board.id, phaseHelpOpenColumns);
    renderEditor();
    return;
  }
  const openPhaseBtn = event.target.closest('[data-role="open-phase-comments"]');
  if (!openPhaseBtn) return;
  const columnIndex = Number(openPhaseBtn.dataset.column);
  if (!Number.isInteger(columnIndex)) return;
  if (!currentBoardId) return;
  openBoardPhase(currentBoardId, columnIndex, false, boardBackGroupId);
});

if (phaseCommentInput) {
  phaseCommentInput.addEventListener("input", () => {
    if (phaseCommentCharCountEl) {
      const n = phaseCommentInput.value.length;
      phaseCommentCharCountEl.textContent = `${n} character${n === 1 ? "" : "s"}`;
    }
  });
}

if (phaseCommentForm) {
  phaseCommentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const board = getCurrentBoard();
    if (!board || !Number.isInteger(activePhaseCommentsColumn) || !phaseCommentInput) return;
    const phaseUid = getPhaseUidByVisualColumn(board, activePhaseCommentsColumn);
    if (!phaseUid) return;
    const text = phaseCommentInput.value.trim();
    if (!text) return;
    normalizeBoardPhaseComments(board);
    const list = board.phaseComments[phaseUid] || [];
    const now = Date.now();
    list.push({
      id: board.nextCommentId++,
      uid: generateUniqueUid(),
      text,
      createdAt: now,
      updatedAt: now,
    });
    board.phaseComments[phaseUid] = list.sort((a, b) => a.createdAt - b.createdAt || a.id - b.id);
    phaseCommentInput.value = "";
    if (phaseCommentCharCountEl) phaseCommentCharCountEl.textContent = "0 characters";
    touchBoard(board);
    renderEditor();
    renderPhaseDetailView();
  });
}

if (phaseCommentsListEl) {
  phaseCommentsListEl.addEventListener("click", async (event) => {
    const board = getCurrentBoard();
    if (!board || !Number.isInteger(activePhaseCommentsColumn)) return;
    const phaseUid = getPhaseUidByVisualColumn(board, activePhaseCommentsColumn);
    if (!phaseUid) return;
    const itemEl = event.target.closest(".phase-comment-item");
    if (!itemEl) return;
    const commentUid = itemEl.dataset.commentUid;
    if (!commentUid) return;
    const comments = getPhaseComments(board, activePhaseCommentsColumn);
    const comment = comments.find((entry) => entry.uid === commentUid);
    if (!comment) return;

    if (event.target.closest('[data-role="edit-phase-comment"]')) {
      editingPhaseCommentUid = commentUid;
      renderPhaseDetailView();
      const inputEl = phaseCommentsListEl.querySelector(
        `.phase-comment-item[data-comment-uid="${commentUid}"] [data-role="phase-comment-edit-input"]`,
      );
      if (inputEl) inputEl.focus();
      return;
    }

    if (event.target.closest('[data-role="cancel-phase-comment-edit"]')) {
      editingPhaseCommentUid = null;
      renderPhaseDetailView();
      return;
    }

    if (event.target.closest('[data-role="save-phase-comment-edit"]')) {
      const inputEl = itemEl.querySelector('[data-role="phase-comment-edit-input"]');
      if (!inputEl) return;
      const text = inputEl.value.trim();
      if (!text) return;
      normalizeBoardPhaseComments(board);
      const source = board.phaseComments[phaseUid] || [];
      const target = source.find((entry) => entry.uid === commentUid);
      if (!target) return;
      target.text = text;
      target.updatedAt = Date.now();
      editingPhaseCommentUid = null;
      touchBoard(board);
      renderEditor();
      renderPhaseDetailView();
      return;
    }

    if (event.target.closest('[data-role="delete-phase-comment"]')) {
      const confirmed = await appAlert("Delete this comment?", { confirm: true });
      if (!confirmed) return;
      normalizeBoardPhaseComments(board);
      const source = board.phaseComments[phaseUid] || [];
      board.phaseComments[phaseUid] = source.filter((entry) => entry.uid !== commentUid);
      editingPhaseCommentUid = null;
      touchBoard(board);
      renderEditor();
      renderPhaseDetailView();
    }
  });
}

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
  editNoteTypesListEl.addEventListener("click", async (event) => {
    const delBtn = event.target.closest('[data-role="delete-custom-note-type"]');
    if (delBtn) {
      const id = delBtn.dataset.noteTypeId;
      if (!id || BUILTIN_NOTE_TYPES.some((b) => b.id === id) || isNoteTypeInUse(id)) return;
      const typeLabel = noteTypeById(id).label;
      const confirmed = await appAlert(`Delete note type "${typeLabel}"? This cannot be undone.`, {
        confirm: true,
      });
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
  saveEditNoteTypesBtn.addEventListener("click", () => void saveEditNoteTypesFromModal());
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

if (modalExportBoardBtn) {
  modalExportBoardBtn.addEventListener("click", () => {
    const board = boards.find((item) => item.id === boardActionsModalBoardId);
    if (!board) return;
    downloadBoard(board);
    closeBoardActionsModal();
  });
}

if (modalResetDemoBoardBtn) {
  modalResetDemoBoardBtn.addEventListener("click", async () => {
    if (!boardActionsModalBoardId) return;
    const board = boards.find((item) => item.id === boardActionsModalBoardId);
    if (!board || !isDemoBoard(board)) return;
    const confirmed = await appAlert("Reset this demo story to its original notes?", { confirm: true });
    if (!confirmed) return;
    resetSingleDemoBoard(board);
    ensureMatrixTrilogySeriesDemo();
    renderHome();
    if (currentBoardId === board.id) {
      renderEditor();
    }
    closeBoardActionsModal();
  });
}

if (editorView) {
  editorView.addEventListener("dblclick", (event) => {
    const titleEl = event.target.closest('[data-role="board-title-dblclick"]');
    if (!titleEl || !currentBoardId) return;
    event.preventDefault();
    inlineTitleEdit.beginStory(currentBoardId);
  });
}

if (groupView) {
  groupView.addEventListener("dblclick", (event) => {
    const titleEl = event.target.closest('[data-role="group-title-dblclick"]');
    if (!titleEl || !currentGroupId) return;
    event.preventDefault();
    inlineTitleEdit.beginGroup(currentGroupId);
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
      void appAlert(`"${board.title}" is already in "${group.title}".`);
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
  createGroupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = createGroupNameInput.value.trim();
    if (!title) return;
    const checkedIds = [...createGroupForm.querySelectorAll('input[name="create-group-board"]:checked')].map(
      (input) => input.value,
    );
    if (checkedIds.length === 0) {
      await appAlert("Select at least one story to include.");
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
    closeDashboardCreateSeriesModal();
    closeDashboardActionsModal();
    openGroup(group.id);
  });
}

modalDeleteBoardBtn.addEventListener("click", () => {
  const board = boards.find((item) => item.id === boardActionsModalBoardId);
  if (!board) return;
  const boardId = board.id;
  closeBoardActionsModal();
  openDeleteStoryModal(boardId);
});

function performDeleteStory(deletedId) {
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
}

if (deleteStoryConfirmCheckbox && confirmDeleteStoryBtn) {
  deleteStoryConfirmCheckbox.addEventListener("change", () => {
    confirmDeleteStoryBtn.disabled = !deleteStoryConfirmCheckbox.checked;
  });
}

if (cancelDeleteStoryBtn) {
  cancelDeleteStoryBtn.addEventListener("click", () => {
    closeDeleteStoryModal();
  });
}

if (deleteStoryModalOverlay) {
  deleteStoryModalOverlay.addEventListener("click", (event) => {
    if (event.target === deleteStoryModalOverlay) {
      closeDeleteStoryModal();
    }
  });
}

if (confirmDeleteStoryBtn) {
  confirmDeleteStoryBtn.addEventListener("click", () => {
    if (!confirmDeleteStoryBtn || confirmDeleteStoryBtn.disabled || !pendingDeleteStoryBoardId) return;
    const deletedId = pendingDeleteStoryBoardId;
    closeDeleteStoryModal();
    performDeleteStory(deletedId);
  });
}

function closeOptionsMenu() {
  optionsMenu.classList.add("hidden");
}

function closeDashboardActionsModal() {
  if (!dashboardActionsModalOverlay) return;
  dashboardActionsModalOverlay.classList.add("hidden");
  if (dashboardActionsSectionsEl) {
    dashboardActionsSectionsEl.querySelectorAll("details.dashboard-actions-section").forEach((details) => {
      details.open = false;
    });
  }
}

function initDashboardActionsExclusiveAccordion() {
  if (!dashboardActionsSectionsEl) return;
  dashboardActionsSectionsEl.addEventListener("toggle", (event) => {
    const details = event.target;
    if (!(details instanceof HTMLDetailsElement) || !details.matches(".dashboard-actions-section")) return;
    if (!details.open) return;
    dashboardActionsSectionsEl.querySelectorAll("details.dashboard-actions-section").forEach((other) => {
      if (other !== details) other.open = false;
    });
  });
}

function initStructurePreviewModal() {
  if (dashboardStructuresList) {
    dashboardStructuresList.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-structure-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-structure-id");
      if (id) openStructurePreviewModal(id);
    });
  }
  if (closeStructurePreviewModalBtn) {
    closeStructurePreviewModalBtn.addEventListener("click", () => closeStructurePreviewModal());
  }
  if (structurePreviewModalOverlay) {
    structurePreviewModalOverlay.addEventListener("click", (event) => {
      if (event.target === structurePreviewModalOverlay) closeStructurePreviewModal();
    });
  }
}

function closeDashboardCreateStoryModal() {
  if (!dashboardCreateStoryModalOverlay) return;
  dashboardCreateStoryModalOverlay.classList.add("hidden");
}

function closeDashboardCreateStructureModal() {
  if (!dashboardCreateStructureModalOverlay) return;
  dashboardCreateStructureModalOverlay.classList.add("hidden");
}

function closeStructurePreviewModal() {
  if (!structurePreviewModalOverlay) return;
  structurePreviewModalOverlay.classList.add("hidden");
}

function openStructurePreviewModal(structureId) {
  if (!structureId || !structurePreviewModalOverlay || !structurePreviewModalTitleEl || !structurePreviewModalPhasesEl) return;
  const structure = getAllStructures()[structureId];
  if (!structure) return;
  structurePreviewModalTitleEl.textContent = structure.name || structureId;
  if (structurePreviewModalMetaEl) {
    const about =
      typeof structure.description === "string" && structure.description.trim()
        ? structure.description.trim()
        : "";
    const credit =
      typeof structure.author === "string" && structure.author.trim() ? structure.author.trim() : "";
    if (about || credit) {
      const aboutBlock = about
        ? `<p class="structure-preview-modal-about">${escapeHtml(about)}</p>`
        : "";
      const creditBlock = credit
        ? `<p class="structure-preview-modal-credit"><span class="structure-preview-modal-credit-label">Credit</span> ${escapeHtml(credit)}</p>`
        : "";
      structurePreviewModalMetaEl.innerHTML = aboutBlock + creditBlock;
      structurePreviewModalMetaEl.classList.remove("hidden");
    } else {
      structurePreviewModalMetaEl.innerHTML = "";
      structurePreviewModalMetaEl.classList.add("hidden");
    }
  }
  const phases = Array.isArray(structure.phases) ? structure.phases : [];
  structurePreviewModalPhasesEl.innerHTML = phases
    .map((phase) => {
      const p = parsePhaseEntry(phase);
      const title = p.title.trim() ? p.title : "(Untitled phase)";
      const desc = getPhaseDescription(phase);
      const descBlock = desc
        ? `<p class="structure-preview-phase-desc">${escapeHtml(desc)}</p>`
        : `<p class="structure-preview-phase-desc structure-preview-phase-desc--empty">No description</p>`;
      return `<li><strong class="structure-preview-phase-title">${escapeHtml(title)}</strong>${descBlock}</li>`;
    })
    .join("");
  structurePreviewModalOverlay.classList.remove("hidden");
}

function closeDashboardImportModal() {
  if (!dashboardImportModalOverlay) return;
  dashboardImportModalOverlay.classList.add("hidden");
}

function closeDashboardCreateSeriesModal() {
  if (!dashboardCreateSeriesModalOverlay) return;
  dashboardCreateSeriesModalOverlay.classList.add("hidden");
}

function closeDashboardImportStructuresPasteModal() {
  if (!dashboardImportStructuresPasteModalOverlay) return;
  dashboardImportStructuresPasteModalOverlay.classList.add("hidden");
  if (importStructuresPasteText) importStructuresPasteText.value = "";
}

function updateDashboardRemoveStructuresActionState() {
  if (!dashboardRemoveStructuresActionBtn) return;
  const unused = getUnusedCustomStructures();
  const has = unused.length > 0;
  dashboardRemoveStructuresActionBtn.disabled = !has;
  if (has) {
    dashboardRemoveStructuresActionBtn.removeAttribute("aria-disabled");
    dashboardRemoveStructuresActionBtn.removeAttribute("title");
  } else {
    dashboardRemoveStructuresActionBtn.setAttribute("aria-disabled", "true");
    dashboardRemoveStructuresActionBtn.title =
      "No custom structures are unused. A structure must not be used by any story to be removed.";
  }
}

function syncRemoveStructuresProceedButtonState() {
  if (!confirmRemoveStructuresBtn || !removeStructuresListEl) return;
  const checked = removeStructuresListEl.querySelectorAll('input[data-role="remove-structure-cb"]:checked');
  confirmRemoveStructuresBtn.disabled = checked.length === 0;
}

function populateRemoveStructuresModalList() {
  if (!removeStructuresListEl || !removeStructuresEmptyEl) return;
  const unused = getUnusedCustomStructures();
  removeStructuresEmptyEl.classList.toggle("hidden", unused.length > 0);
  if (unused.length === 0) {
    removeStructuresListEl.innerHTML = "";
    syncRemoveStructuresProceedButtonState();
    return;
  }
  removeStructuresListEl.innerHTML = unused
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      (structure) => `
    <li>
      <label class="remove-structures-row">
        <input type="checkbox" name="remove-structure" value="${escapeHtml(structure.id)}" checked data-role="remove-structure-cb" />
        <span>${escapeHtml(structure.name)}</span>
      </label>
    </li>`,
    )
    .join("");
  syncRemoveStructuresProceedButtonState();
}

function closeDashboardRemoveStructuresModal() {
  if (!dashboardRemoveStructuresModalOverlay) return;
  dashboardRemoveStructuresModalOverlay.classList.add("hidden");
  if (removeStructuresListEl) removeStructuresListEl.innerHTML = "";
}

function openDashboardRemoveStructuresModal() {
  if (!dashboardRemoveStructuresModalOverlay) return;
  dismissAllAppAlerts();
  closeOptionsMenu();
  closeDashboardActionsModal();
  closeDashboardCreateStoryModal();
  closeDashboardCreateStructureModal();
  closeDashboardImportStructuresPasteModal();
  closeDashboardImportModal();
  closeDashboardCreateSeriesModal();
  closeDeleteStoryModal();
  populateRemoveStructuresModalList();
  dashboardRemoveStructuresModalOverlay.classList.remove("hidden");
}

function openDashboardActionsModal() {
  if (!dashboardActionsModalOverlay) return;
  dismissAllAppAlerts();
  closeOptionsMenu();
  closeDashboardCreateStoryModal();
  closeDashboardCreateStructureModal();
  closeDashboardImportStructuresPasteModal();
  closeDashboardImportModal();
  closeDashboardCreateSeriesModal();
  closeDeleteStoryModal();
  closeDashboardRemoveStructuresModal();
  dashboardActionsModalOverlay.classList.remove("hidden");
}

function openDashboardCreateStoryModal() {
  if (!dashboardCreateStoryModalOverlay) return;
  closeDashboardActionsModal();
  closeDashboardRemoveStructuresModal();
  dashboardCreateStoryModalOverlay.classList.remove("hidden");
  // Focus for faster input.
  if (boardTitleInput) boardTitleInput.focus();
}

function openDashboardCreateStructureModal() {
  if (!dashboardCreateStructureModalOverlay) return;
  closeDashboardActionsModal();
  closeDashboardRemoveStructuresModal();
  dashboardCreateStructureModalOverlay.classList.remove("hidden");
  // Focus for faster input.
  if (structureNameInput) structureNameInput.focus();
}

function openDashboardImportModal() {
  if (!dashboardImportModalOverlay) return;
  closeDashboardActionsModal();
  closeDashboardRemoveStructuresModal();
  dashboardImportModalOverlay.classList.remove("hidden");
}

function openDashboardCreateSeriesModal() {
  if (!dashboardCreateSeriesModalOverlay) return;
  closeDashboardActionsModal();
  closeDashboardRemoveStructuresModal();
  dashboardCreateSeriesModalOverlay.classList.remove("hidden");
}

function openDashboardImportStructuresPasteModal() {
  if (!dashboardImportStructuresPasteModalOverlay) return;
  closeDashboardActionsModal();
  closeDashboardRemoveStructuresModal();
  dashboardImportStructuresPasteModalOverlay.classList.remove("hidden");
  if (importStructuresPasteText) importStructuresPasteText.focus();
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

if (dashboardActionsBtn) {
  dashboardActionsBtn.addEventListener("click", () => {
    openDashboardActionsModal();
  });
}

if (closeDashboardActionsModalBtn) {
  closeDashboardActionsModalBtn.addEventListener("click", () => {
    closeDashboardActionsModal();
  });
}

if (openCreateStoryActionBtn) {
  openCreateStoryActionBtn.addEventListener("click", () => {
    openDashboardCreateStoryModal();
  });
}

if (openCreateStoryEmptyStateBtn) {
  openCreateStoryEmptyStateBtn.addEventListener("click", () => {
    openDashboardCreateStoryModal();
  });
}

if (closeDashboardCreateStoryModalBtn) {
  closeDashboardCreateStoryModalBtn.addEventListener("click", () => {
    closeDashboardCreateStoryModal();
  });
}

if (openCreateStructureActionBtn) {
  openCreateStructureActionBtn.addEventListener("click", () => {
    openDashboardCreateStructureModal();
  });
}

if (openCreateStructureInlineBtn) {
  openCreateStructureInlineBtn.addEventListener("click", () => {
    openDashboardCreateStructureModal();
  });
}

if (closeDashboardCreateStructureModalBtn) {
  closeDashboardCreateStructureModalBtn.addEventListener("click", () => {
    closeDashboardCreateStructureModal();
  });
}

if (openImportStoryActionBtn) {
  openImportStoryActionBtn.addEventListener("click", () => {
    openDashboardImportModal();
  });
}

if (openCreateSeriesActionBtn) {
  openCreateSeriesActionBtn.addEventListener("click", () => {
    openDashboardCreateSeriesModal();
  });
}

if (dashboardImportStructuresPasteActionBtn) {
  dashboardImportStructuresPasteActionBtn.addEventListener("click", () => {
    openDashboardImportStructuresPasteModal();
  });
}

if (closeDashboardImportModalBtn) {
  closeDashboardImportModalBtn.addEventListener("click", () => {
    closeDashboardImportModal();
  });
}

if (closeDashboardCreateSeriesModalBtn) {
  closeDashboardCreateSeriesModalBtn.addEventListener("click", () => {
    closeDashboardCreateSeriesModal();
  });
}

if (closeDashboardImportStructuresPasteModalBtn) {
  closeDashboardImportStructuresPasteModalBtn.addEventListener("click", () => {
    closeDashboardImportStructuresPasteModal();
  });
}

if (dashboardActionsModalOverlay) {
  dashboardActionsModalOverlay.addEventListener("click", (event) => {
    if (event.target === dashboardActionsModalOverlay) closeDashboardActionsModal();
  });
}

if (dashboardCreateStoryModalOverlay) {
  dashboardCreateStoryModalOverlay.addEventListener("click", (event) => {
    if (event.target === dashboardCreateStoryModalOverlay) closeDashboardCreateStoryModal();
  });
}

if (confirmNewStoryOnboardingBtn) {
  confirmNewStoryOnboardingBtn.addEventListener("click", () => {
    markCurrentBoardOnboardingSeen();
    closeNewStoryOnboardingModal();
  });
}

if (dashboardCreateStructureModalOverlay) {
  dashboardCreateStructureModalOverlay.addEventListener("click", (event) => {
    if (event.target === dashboardCreateStructureModalOverlay) closeDashboardCreateStructureModal();
  });
}

if (dashboardImportModalOverlay) {
  dashboardImportModalOverlay.addEventListener("click", (event) => {
    if (event.target === dashboardImportModalOverlay) closeDashboardImportModal();
  });
}

if (dashboardCreateSeriesModalOverlay) {
  dashboardCreateSeriesModalOverlay.addEventListener("click", (event) => {
    if (event.target === dashboardCreateSeriesModalOverlay) closeDashboardCreateSeriesModal();
  });
}

if (dashboardImportStructuresPasteModalOverlay) {
  dashboardImportStructuresPasteModalOverlay.addEventListener("click", (event) => {
    if (event.target === dashboardImportStructuresPasteModalOverlay) closeDashboardImportStructuresPasteModal();
  });
}

if (dashboardRemoveStructuresModalOverlay) {
  dashboardRemoveStructuresModalOverlay.addEventListener("click", (event) => {
    if (event.target === dashboardRemoveStructuresModalOverlay) closeDashboardRemoveStructuresModal();
  });
}

if (removeStructuresListEl) {
  removeStructuresListEl.addEventListener("change", (event) => {
    if (event.target.matches('input[data-role="remove-structure-cb"]')) {
      syncRemoveStructuresProceedButtonState();
    }
  });
}

if (dashboardRemoveStructuresActionBtn) {
  dashboardRemoveStructuresActionBtn.addEventListener("click", () => {
    if (dashboardRemoveStructuresActionBtn.disabled) return;
    openDashboardRemoveStructuresModal();
  });
}

if (closeDashboardRemoveStructuresModalBtn) {
  closeDashboardRemoveStructuresModalBtn.addEventListener("click", () => {
    closeDashboardRemoveStructuresModal();
  });
}

if (confirmRemoveStructuresBtn && removeStructuresListEl) {
  confirmRemoveStructuresBtn.addEventListener("click", async () => {
    const selected = [...removeStructuresListEl.querySelectorAll('input[data-role="remove-structure-cb"]:checked')].map(
      (input) => input.value,
    );
    if (selected.length === 0) return;

    const nameById = new Map(customStructures.map((s) => [s.id, s.name]));
    const names = selected.map((id) => nameById.get(id) || id);

    closeDashboardRemoveStructuresModal();

    const confirmed = await appAlert(
      `The following custom structures will be permanently removed:\n\n${names.map((n) => `• ${n}`).join("\n")}\n\nThis cannot be undone.`,
      { confirm: true },
    );
    if (!confirmed) return;

    const idSet = new Set(selected);
    customStructures.forEach((structure) => {
      if (idSet.has(structure.id) && structure.uid) {
        delete customStructureActivity[structure.uid];
      }
    });
    customStructures = customStructures.filter((s) => !idSet.has(s.id));
    saveCustomStructures();
    saveCustomStructureActivity();
    renderHome();
    if (boardStructureSelect) {
      const sid = boardStructureSelect.value;
      if (sid && !getAllStructures()[sid]) {
        renderStructureOptions("hero_journey");
      } else {
        renderStructureOptions();
      }
    }
  });
}

function openFactoryResetModal() {
  if (!factoryResetModalOverlay) return;

  closeOptionsMenu();
  dismissAllAppAlerts();
  closeDeleteStoryModal();
  factoryResetModalOverlay.classList.remove("hidden");

  if (factoryResetConfirmCheckbox) {
    factoryResetConfirmCheckbox.checked = false;
  }
  if (confirmFactoryResetBtn) {
    confirmFactoryResetBtn.disabled = true;
  }

  // Small accessibility improvement: focus the first action.
  if (cancelFactoryResetBtn) {
    cancelFactoryResetBtn.focus();
  }
}

function closeFactoryResetModal() {
  if (!factoryResetModalOverlay) return;
  factoryResetModalOverlay.classList.add("hidden");
}

function openResetDemosModal() {
  if (!resetDemosModalOverlay) return;
  closeOptionsMenu();
  dismissAllAppAlerts();
  closeDashboardActionsModal();
  closeDashboardCreateStoryModal();
  closeDashboardCreateStructureModal();
  closeDashboardImportModal();
  closeDashboardCreateSeriesModal();
  closeDeleteStoryModal();
  resetDemosModalOverlay.classList.remove("hidden");
  if (cancelResetDemosBtn) {
    cancelResetDemosBtn.focus();
  }
}

function closeResetDemosModal() {
  if (!resetDemosModalOverlay) return;
  resetDemosModalOverlay.classList.add("hidden");
}

function openRestoreBackupModal(rawText) {
  if (!restoreBackupModalOverlay) return;
  pendingRestoreBackupText = rawText;
  closeOptionsMenu();
  dismissAllAppAlerts();
  closeDashboardActionsModal();
  closeDashboardCreateStoryModal();
  closeDashboardCreateStructureModal();
  closeDashboardImportModal();
  closeDashboardCreateSeriesModal();
  closeDeleteStoryModal();
  restoreBackupModalOverlay.classList.remove("hidden");
  if (restoreBackupConfirmCheckbox) {
    restoreBackupConfirmCheckbox.checked = false;
  }
  if (confirmRestoreBackupBtn) {
    confirmRestoreBackupBtn.disabled = true;
  }
  if (cancelRestoreBackupBtn) {
    cancelRestoreBackupBtn.focus();
  }
}

function closeRestoreBackupModal() {
  if (!restoreBackupModalOverlay) return;
  restoreBackupModalOverlay.classList.add("hidden");
  pendingRestoreBackupText = null;
}

if (factoryResetConfirmCheckbox && confirmFactoryResetBtn) {
  factoryResetConfirmCheckbox.addEventListener("change", () => {
    confirmFactoryResetBtn.disabled = !factoryResetConfirmCheckbox.checked;
  });
}

if (cancelFactoryResetBtn) {
  cancelFactoryResetBtn.addEventListener("click", () => {
    closeFactoryResetModal();
  });
}

if (factoryResetModalOverlay) {
  factoryResetModalOverlay.addEventListener("click", (event) => {
    // Click outside the modal closes it.
    if (event.target === factoryResetModalOverlay) {
      closeFactoryResetModal();
    }
  });
}

if (confirmFactoryResetBtn) {
  confirmFactoryResetBtn.addEventListener("click", () => {
    if (!confirmFactoryResetBtn || confirmFactoryResetBtn.disabled) return;

    closeFactoryResetModal();
    clearKeys([
      STORAGE_KEY,
      SETTINGS_KEY,
      CUSTOM_STRUCTURES_KEY,
      CUSTOM_ARCHETYPES_KEY,
      CUSTOM_NOTE_TYPES_KEY,
      NOTE_TYPE_OVERRIDES_KEY,
      GROUPS_KEY,
      DEMO_BOARD_IDS_KEY,
      PHASE_HELP_STATE_KEY,
    ]);
    window.location.assign(HOME_ROUTE);
  });
}

if (cancelResetDemosBtn) {
  cancelResetDemosBtn.addEventListener("click", () => {
    closeResetDemosModal();
  });
}

if (resetDemosModalOverlay) {
  resetDemosModalOverlay.addEventListener("click", (event) => {
    if (event.target === resetDemosModalOverlay) {
      closeResetDemosModal();
    }
  });
}

if (confirmResetDemosBtn) {
  confirmResetDemosBtn.addEventListener("click", () => {
    closeResetDemosModal();
    replaceDemoBoardsOnly();
    ensureMatrixTrilogySeriesDemo();
    openHome();
  });
}

if (restoreBackupConfirmCheckbox && confirmRestoreBackupBtn) {
  restoreBackupConfirmCheckbox.addEventListener("change", () => {
    confirmRestoreBackupBtn.disabled = !restoreBackupConfirmCheckbox.checked;
  });
}

if (cancelRestoreBackupBtn) {
  cancelRestoreBackupBtn.addEventListener("click", () => {
    closeRestoreBackupModal();
  });
}

if (restoreBackupModalOverlay) {
  restoreBackupModalOverlay.addEventListener("click", (event) => {
    if (event.target === restoreBackupModalOverlay) {
      closeRestoreBackupModal();
    }
  });
}

if (confirmRestoreBackupBtn) {
  confirmRestoreBackupBtn.addEventListener("click", async () => {
    if (!confirmRestoreBackupBtn || confirmRestoreBackupBtn.disabled || !pendingRestoreBackupText) return;
    try {
      restoreFullAppBackupFromText(pendingRestoreBackupText);
    } catch (error) {
      await appAlert(error instanceof Error ? error.message : "Backup restore failed.");
      closeRestoreBackupModal();
    }
  });
}

// Close with Escape when the modal is open.
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (closeAppAlertIfOpen()) return;
  if (factoryResetModalOverlay && !factoryResetModalOverlay.classList.contains("hidden")) {
    closeFactoryResetModal();
    return;
  }
  if (resetDemosModalOverlay && !resetDemosModalOverlay.classList.contains("hidden")) {
    closeResetDemosModal();
    return;
  }
  if (restoreBackupModalOverlay && !restoreBackupModalOverlay.classList.contains("hidden")) {
    closeRestoreBackupModal();
    return;
  }
  if (deleteStoryModalOverlay && !deleteStoryModalOverlay.classList.contains("hidden")) {
    closeDeleteStoryModal();
    return;
  }
  if (dashboardCreateStoryModalOverlay && !dashboardCreateStoryModalOverlay.classList.contains("hidden")) {
    closeDashboardCreateStoryModal();
    return;
  }
  if (newStoryOnboardingModalOverlay && !newStoryOnboardingModalOverlay.classList.contains("hidden")) {
    return;
  }
  if (dashboardCreateStructureModalOverlay && !dashboardCreateStructureModalOverlay.classList.contains("hidden")) {
    closeDashboardCreateStructureModal();
    return;
  }
  if (dashboardImportModalOverlay && !dashboardImportModalOverlay.classList.contains("hidden")) {
    closeDashboardImportModal();
    return;
  }
  if (dashboardCreateSeriesModalOverlay && !dashboardCreateSeriesModalOverlay.classList.contains("hidden")) {
    closeDashboardCreateSeriesModal();
    return;
  }
  if (
    dashboardImportStructuresPasteModalOverlay &&
    !dashboardImportStructuresPasteModalOverlay.classList.contains("hidden")
  ) {
    closeDashboardImportStructuresPasteModal();
    return;
  }
  if (
    dashboardRemoveStructuresModalOverlay &&
    !dashboardRemoveStructuresModalOverlay.classList.contains("hidden")
  ) {
    closeDashboardRemoveStructuresModal();
    return;
  }
  if (dashboardActionsModalOverlay && !dashboardActionsModalOverlay.classList.contains("hidden")) {
    closeDashboardActionsModal();
  }
});

if (resetAppDataBtn) {
  resetAppDataBtn.addEventListener("click", () => {
    openFactoryResetModal();
  });
}

if (resetDemoDataBtn) {
  resetDemoDataBtn.addEventListener("click", () => {
    // For consistency, share the same logic also used by the dashboard Actions modal.
    resetDemoData();
  });
}

function resetDemoData() {
  openResetDemosModal();
}

if (dashboardResetDemoActionBtn) {
  dashboardResetDemoActionBtn.addEventListener("click", () => {
    resetDemoData();
  });
}

if (dashboardFactoryResetActionBtn) {
  dashboardFactoryResetActionBtn.addEventListener("click", () => {
    // Close any open dashboard modals first, then open the irreversible confirmation modal.
    closeDashboardActionsModal();
    closeDashboardCreateStoryModal();
    closeDashboardCreateStructureModal();
    openFactoryResetModal();
  });
}

if (dashboardExportBackupActionBtn) {
  dashboardExportBackupActionBtn.addEventListener("click", () => {
    closeDashboardActionsModal();
    exportFullAppBackup();
  });
}

if (dashboardExportStructuresActionBtn) {
  dashboardExportStructuresActionBtn.addEventListener("click", () => {
    closeDashboardActionsModal();
    exportCustomStructures();
  });
}

if (dashboardImportStructuresActionBtn && importCustomStructuresInput) {
  dashboardImportStructuresActionBtn.addEventListener("click", () => {
    closeDashboardActionsModal();
    importCustomStructuresInput.click();
  });

  importCustomStructuresInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = importCustomStructuresFromText(text);
      await appAlert(getCustomStructureImportSuccessMessage(result));
    } catch (error) {
      await appAlert(getCustomStructureImportErrorMessage(error));
    } finally {
      importCustomStructuresInput.value = "";
    }
  });
}

if (importStructuresPasteForm && importStructuresPasteText) {
  importStructuresPasteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const rawText = importStructuresPasteText.value.trim();
    if (!rawText) return;
    const maxChars = 2 * 1024 * 1024;
    if (rawText.length > maxChars) {
      await appAlert("Pasted JSON is too large. Please use a smaller payload or file import.");
      return;
    }
    try {
      const result = importCustomStructuresFromText(rawText);
      closeDashboardImportStructuresPasteModal();
      await appAlert(getCustomStructureImportSuccessMessage(result));
    } catch (error) {
      await appAlert(getCustomStructureImportErrorMessage(error));
    }
  });
}

if (dashboardRestoreBackupActionBtn && restoreAppBackupInput) {
  dashboardRestoreBackupActionBtn.addEventListener("click", () => {
    closeDashboardActionsModal();
    restoreAppBackupInput.click();
  });

  restoreAppBackupInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      // Validate early so user sees immediate feedback before confirmation modal.
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || parsed.backupType !== "structurer.full-backup") {
        throw new Error("This file is not a Structurer full backup.");
      }
      openRestoreBackupModal(text);
    } catch (error) {
      await appAlert(error instanceof Error ? error.message : "Backup restore failed.");
    } finally {
      restoreAppBackupInput.value = "";
    }
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
  inlineTitleEdit.handleDocumentClick(event);

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
  normalizeBoardPhaseComments(board);
});
if (loadedBoards === null) {
  boards = DEMO_BOARD_DATA.map((demo) => createDemoBoardFromJson(demo));
  demoBoardIds = boards.map((board) => board.id);
  saveDemoBoardIds();
} else if (demoBoardIds.length === 0) {
  demoBoardIds = boards.filter((board) => isLikelyDemoBoard(board)).map((board) => board.id);
  saveDemoBoardIds();
}

ensureMatrixTrilogySeriesDemo();

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
initDashboardActionsExclusiveAccordion();
initStructurePreviewModal();
renderStructureOptions("hero_journey");
renderStructurePhaseRows();
syncRouteToState(true);

const appVersionEl = document.querySelector("#app-version");
if (appVersionEl && packageJson.version) {
  appVersionEl.textContent = packageJson.version;
}
