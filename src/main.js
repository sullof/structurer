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
  EDITOR_QUICK_HELP_DISMISSED_KEY,
  STORAGE_KEY,
  STRUCTURER_DEV_FLAG_KEY,
} from "./core/app-config";
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
} from "./core/storage";
import {
  addNoteModalBodyTemplate,
  boardCardTemplate,
  dashboardAiPromptCtaCardTemplate,
  noteTemplate,
  renderStructureOptionsHtml,
  structureAlteredEditPhaseRowTemplate,
  structurePhaseRowTemplate,
} from "./ui/ui-render";
import { titleLineTemplate } from "./components/title-line";
import { createGroupModalController } from "./controllers/group-modals";
import { createNavigationController } from "./core/navigation";
import { buildLlmStoryAnalysisPrompt } from "./features/ai-story-analysis-prompt.js";
import { createBoardInteractionsController } from "./controllers/board-interactions";
import { createBoardNoteActionsController } from "./controllers/board-note-actions";
import { createInlineTitleEditController } from "./controllers/inline-title-edit.js";
import { appAlert, appDialog, closeAppAlertIfOpen, dismissAllAppAlerts } from "./ui/app-alert.js";
import { initModalScrollLock } from "./ui/modal-scroll-lock.js";
import { createSharedViewActionsController } from "./controllers/shared-view-actions.js";
import {
  promptStoryExportOptions as promptStoryExportOptionsModal,
  promptStorySlugOptions as promptStorySlugOptionsModal,
} from "./modals/story-action-modals.js";
import { createDashboardActionsModalController } from "./modals/dashboard-actions-modal.js";
import { createEditArchetypesModalController } from "./modals/edit-archetypes-modal.js";
import { createEditNoteTypesModalController } from "./modals/edit-note-types-modal.js";
import { createDashboardFlowModalsController } from "./modals/dashboard-flow-modals.js";
import packageJson from "../package.json";
import { validateStructureAuthor, validateStructureDescription } from "./features/structure-metadata.js";

const loadedBoards = loadBoards();
let boards = loadedBoards || [];
const GROUPS_KEY = "structurer.groups.v1";
const NO_STRUCTURE_OPTION_VALUE = "__no_structure__";
/** Latest `schemaVersion` for `exportType: structurer.story` exports and AI prompt output. */
const STORY_JSON_SCHEMA_LATEST = 3;
/** Structure template JSON from the dashboard preview (built-in or user catalog). */
const STRUCTURES_PACK_EXPORT_TYPE = "structurer.structure";
/** Legacy packs and community extensions. */
const STRUCTURES_PACK_EXPORT_TYPE_LEGACY = "structurer.custom-structures";
const SHARED_BOOKMARKS_KEY = "structurer.sharedBookmarks.v1";
const PHASE_COMMENTS_LOCAL_NOTICE_SHOWN_KEY = "structurer.phaseCommentsLocalNoticeShown.v1";
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
let editStoryStructureModalBoardId = null;
let customStructures = loadCustomStructures();
let customStructureActivity = loadCustomStructureActivity();
let customArchetypes = loadCustomArchetypes();
let customNoteTypes = loadCustomNoteTypes();
const initialSettings = loadSettings();
let columnMinWidth = initialSettings.columnMinWidth ?? DEFAULT_COLUMN_WIDTH;
let wrapColumns = initialSettings.wrapColumns ?? true;
let showDemoBoards = initialSettings.showDemoBoards ?? true;

const landingView = document.querySelector("#landing-view");
const homeView = document.querySelector("#home-view");
const helpView = document.querySelector("#help-view");
const privacyView = document.querySelector("#privacy-view");
const termsView = document.querySelector("#terms-view");
const aiAnalysisPromptView = document.querySelector("#ai-analysis-prompt-view");
const sharedView = document.querySelector("#shared-view");
const groupView = document.querySelector("#group-view");
const editorView = document.querySelector("#editor-view");
const phaseView = document.querySelector("#phase-view");
const notFoundView = document.querySelector("#not-found-view");
const groupsList = document.querySelector("#groups-list");
const boardsList = document.querySelector("#boards-list");
const sharedBookmarksList = document.querySelector("#shared-bookmarks-list");
const dashboardStructuresList = document.querySelector("#dashboard-structures-list");
const dashboardGroupsHeading = document.querySelector("#dashboard-groups-heading");
const dashboardBoardsHeading = document.querySelector("#dashboard-boards-heading");
const dashboardSharedHeading = document.querySelector("#dashboard-shared-heading");
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
const modalChangeBoardSlugBtn = document.querySelector("#modal-change-board-slug");
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
const structurePreviewModalExportBtn = document.querySelector("#structure-preview-modal-export");
const dashboardResetDemoActionBtn = document.querySelector("#dashboard-reset-demo-action");
const dashboardFactoryResetActionBtn = document.querySelector("#dashboard-factory-reset-action");
const dashboardExportBackupActionBtn = document.querySelector("#dashboard-export-backup-action");
/** Set while structure preview is open; used by Export (custom catalog structures only). */
let structurePreviewExportTargetId = null;
const dashboardImportStructuresActionBtn = document.querySelector("#dashboard-import-structures-action");
const dashboardRemoveStructuresActionBtn = document.querySelector("#dashboard-remove-structures-action");
const dashboardRemoveStructuresModalOverlay = document.querySelector("#dashboard-remove-structures-modal-overlay");
const removeStructuresListEl = document.querySelector("#remove-structures-list");
const removeStructuresEmptyEl = document.querySelector("#remove-structures-empty");
const closeDashboardRemoveStructuresModalBtn = document.querySelector("#close-dashboard-remove-structures-modal");
const confirmRemoveStructuresBtn = document.querySelector("#confirm-remove-structures-btn");
const dashboardRestoreBackupActionBtn = document.querySelector("#dashboard-restore-backup-action");
const restoreAppBackupInput = document.querySelector("#restore-app-backup-input");
const importCustomStructuresInput = document.querySelector("#import-custom-structures-input");
const dashboardImportStructuresModalOverlay = document.querySelector("#dashboard-import-structures-modal-overlay");
const closeDashboardImportStructuresModalBtn = document.querySelector("#close-dashboard-import-structures-modal");
const importCustomStructuresFileButton = document.querySelector("#import-custom-structures-file-button");
const openImportStructuresPasteFromModalBtn = document.querySelector("#open-import-structures-paste-from-modal");
const dashboardImportStructuresPasteModalOverlay = document.querySelector("#dashboard-import-structures-paste-modal-overlay");
const closeDashboardImportStructuresPasteModalBtn = document.querySelector("#close-dashboard-import-structures-paste-modal");
const importStructuresPasteForm = document.querySelector("#import-structures-paste-form");
const importStructuresPasteText = document.querySelector("#import-structures-paste-text");
const openImportStoryActionBtn = document.querySelector("#open-import-story-action");
const openViewSharedStoryActionBtn = document.querySelector("#open-view-shared-story-action");
const dashboardImportModalOverlay = document.querySelector("#dashboard-import-modal-overlay");
const closeDashboardImportModalBtn = document.querySelector("#close-dashboard-import-modal");
const openImportStoryPasteFromModalBtn = document.querySelector("#open-import-story-paste-from-modal");
const dashboardImportStoryPasteModalOverlay = document.querySelector("#dashboard-import-story-paste-modal-overlay");
const closeDashboardImportStoryPasteModalBtn = document.querySelector("#close-dashboard-import-story-paste-modal");
const importStoryPasteForm = document.querySelector("#import-story-paste-form");
const importStoryPasteText = document.querySelector("#import-story-paste-text");
const aiPromptStructureSelect = document.querySelector("#ai-prompt-structure-select");
const aiPromptWorkTitleInput = document.querySelector("#ai-prompt-work-title");
const aiPromptMediumSelect = document.querySelector("#ai-prompt-medium-select");
const aiPromptAnalysisLangSelect = document.querySelector("#ai-prompt-analysis-language-select");
const aiPromptAnalysisLangCustomWrap = document.querySelector("#ai-prompt-analysis-language-custom-wrap");
const aiPromptAnalysisLangCustomInput = document.querySelector("#ai-prompt-analysis-language-custom");
const aiPromptOutputTextarea = document.querySelector("#ai-prompt-output");
const copyAiPromptBtn = document.querySelector("#copy-ai-prompt-btn");
const aiAnalysisPromptForm = document.querySelector("#ai-analysis-prompt-form");
const goHelpFromAiAnalysisPromptBtn = document.querySelector("#go-help-from-ai-analysis-prompt");
const goDashboardFromAiAnalysisPromptBtn = document.querySelector("#go-dashboard-from-ai-analysis-prompt");
const goAiAnalysisPromptFromHelpBtn = document.querySelector("#go-ai-analysis-prompt-from-help");
const openCreateSeriesActionBtn = document.querySelector("#open-create-series-action");
const dashboardCreateSeriesModalOverlay = document.querySelector("#dashboard-create-series-modal-overlay");
const closeDashboardCreateSeriesModalBtn = document.querySelector("#close-dashboard-create-series-modal");
const goLandingFromDashboardBtn = document.querySelector("#go-landing-from-dashboard");
const goHelpBtn = document.querySelector("#go-help");
const goHelpFromDashboardBtn = document.querySelector("#go-help-from-dashboard");
const goDashboardFromHelpBtn = document.querySelector("#go-dashboard-from-help");
const goDashboardFromPrivacyBtn = document.querySelector("#go-dashboard-from-privacy");
const goDashboardFromTermsBtn = document.querySelector("#go-dashboard-from-terms");
const notFoundGenericDashboardBtn = document.querySelector("#not-found-generic-dashboard");
const notFoundGenericLandingBtn = document.querySelector("#not-found-generic-landing");
const notFoundSharingDashboardBtn = document.querySelector("#not-found-sharing-dashboard");
const notFoundSharingHelpBtn = document.querySelector("#not-found-sharing-help");
const notFoundSharingLandingBtn = document.querySelector("#not-found-sharing-landing");
const goHomeFromSharedBtn = document.querySelector("#go-home-from-shared");
const sharedStoryPageTitleEl = document.querySelector("#shared-story-page-title");
const sharedStoryPageSubtitleEl = document.querySelector("#shared-story-page-subtitle");
const sharedStoryStatusEl = document.querySelector("#shared-story-status");
const sharedStoryPreviewHostEl = document.querySelector("#shared-story-preview-host");
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
const openNoteHeightModeMenuBtn = document.querySelector("#open-note-height-mode-modal");
const editorBoardActionsBtn = document.querySelector("#editor-board-actions-btn");
const groupViewActionsBtn = document.querySelector("#group-view-actions-btn");
const modalDefineCustomNoteTypeBtn = document.querySelector("#modal-define-custom-note-type");
const modalDefineCustomArchetypeBtn = document.querySelector("#modal-define-custom-archetype");
const boardActionsSectionsEl = document.querySelector("#board-actions-modal-sections");
const boardActionsDemoSectionEl = document.querySelector("#board-actions-demo-section");
const modalResetPhaseOrderBtn = document.querySelector("#modal-reset-phase-order");
const modalEditStoryStructureBtn = document.querySelector("#modal-edit-story-structure");
const editStoryStructureModalOverlay = document.querySelector("#edit-story-structure-modal-overlay");
const closeEditStoryStructureModalBtn = document.querySelector("#close-edit-story-structure-modal");
const editAlteredStructureForm = document.querySelector("#edit-altered-structure-form");
const editAlteredStructurePhasesListEl = document.querySelector("#edit-altered-structure-phases-list");
const editAlteredStructureAddRowBtn = document.querySelector("#edit-altered-structure-add-row");
const resetDemoDataBtn = document.querySelector("#reset-demo-data");
const resetAppDataBtn = document.querySelector("#reset-app-data");
const resizeModalOverlay = document.querySelector("#resize-modal-overlay");
const closeResizeModalBtn = document.querySelector("#close-resize-modal");
const noteHeightModeCurrentEl = document.querySelector("#note-height-mode-current");
const noteHeightModeSwitchBtn = document.querySelector("#note-height-mode-switch-btn");
const closeNoteHeightModeModalBtn = document.querySelector("#close-note-height-mode-modal");
const columnWidthSlider = document.querySelector("#column-width-slider");
const columnWidthValue = document.querySelector("#column-width-value");
const goDashboardBtn = document.querySelector("#go-dashboard");
const goBoardFromPhaseBtn = document.querySelector("#go-board-from-phase");
const editorBreadcrumbCurrentEl = document.querySelector("#editor-breadcrumb-current");
const groupBreadcrumbCurrentEl = document.querySelector("#group-breadcrumb-current");
const phaseBreadcrumbCurrentEl = document.querySelector("#phase-breadcrumb-current");
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
const addNoteModalOverlay = document.querySelector("#add-note-modal-overlay");
const addNoteModalBodyRoot = document.querySelector("#add-note-modal-body-root");
const addNoteModalTitleEl = document.querySelector("#add-note-modal-title");
const addNoteModalCancelBtn = document.querySelector("#add-note-modal-cancel");
const editorQuickHelpEl = document.querySelector("#editor-quick-help");
const dismissEditorQuickHelpBtn = document.querySelector("#dismiss-editor-quick-help");
const groupBoardStackEl = document.querySelector("#group-board-stack");
const homeListControlsEl = document.querySelector(".home-list-controls");
const dashboardSectionDividerEl = document.querySelector(".dashboard-section-divider");
const toggleDemoVisibilityBtn = document.querySelector("#toggle-demo-visibility");
const openCreateStructureInlineBtn = document.querySelector("#open-create-structure-inline");
const openCreateStoryEmptyStateBtn = document.querySelector("#open-create-story-empty-state");
const homeCollapsiblePanels = [...document.querySelectorAll("#home-view .collapsible-panel")];
document.querySelectorAll(".app-history-back-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    window.history.back();
  });
});
document.addEventListener("click", (event) => {
  if (event.target.closest(".app-breadcrumb-home")) {
    event.preventDefault();
    openLanding();
    return;
  }
  if (event.target.closest(".app-breadcrumb-dashboard")) {
    event.preventDefault();
    openHome();
  }
});
let addBoardToGroupTargetBoardId = null;
let pendingRestoreBackupText = null;
let sharedStoryRenderRequestId = 0;
let sharedStoryBookmarks = loadSharedBookmarks();
const sharedViewActions = createSharedViewActionsController({
  ensureSafeSharedSourceUrl: (rawValue) => ensureSafeSharedSourceUrl(rawValue),
  onOpenJson: (sourceUrl) => {
    window.open(sourceUrl, "_blank", "noopener");
  },
  onSaveBookmark: async ({ sourceUrl, title }) => {
    const result = upsertSharedBookmark(sourceUrl, title);
    if (!result.ok) {
      await appAlert("Could not save this bookmark.");
      return false;
    }
    renderHome();
    await appAlert("Shared bookmark saved.");
    return true;
  },
  onOpenResizeModal: () => {
    openResizeModal();
  },
  onToggleWrapColumns: () => {
    wrapColumns = !wrapColumns;
    applyWrapColumns();
    saveSettings();
  },
});
sharedViewActions.init();
const dashboardActionsModal = createDashboardActionsModalController();
dashboardActionsModal.init();
const editArchetypesModal = createEditArchetypesModalController({
  getAllArchetypes,
  getBuiltinArchetypes: () => BUILTIN_ARCHETYPES,
  getCustomArchetypes: () => customArchetypes,
  setCustomArchetypes: (next) => {
    customArchetypes = next;
  },
  saveCustomArchetypes,
  isArchetypeInUse: (archetypeId) =>
    boards.some((board) => board.notes.some((note) => note.kind === "character" && (note.archetype || "none") === archetypeId)),
  getArchetypeById: archetypeById,
  escapeHtml,
  appAlert,
  onAfterChange: () => {
    renderEditor();
    if (currentGroupId) renderGroup();
    renderHome();
  },
  promptCustomArchetypeName,
  createCustomArchetype,
  closeBoardActionsModal,
});
editArchetypesModal.init();
const editNoteTypesModal = createEditNoteTypesModalController({
  getAllNoteTypes,
  getBuiltinNoteTypes: () => BUILTIN_NOTE_TYPES,
  getCustomNoteTypes: () => customNoteTypes,
  setCustomNoteTypes: (next) => {
    customNoteTypes = next;
  },
  saveCustomNoteTypes,
  getNoteTypeById: noteTypeById,
  getNoteTypeColorPalette,
  parseHexColorInput,
  normalizeHexColor,
  isValidHexColor,
  isNoteTypeInUse,
  getNoteTypeOverrides: () => noteTypeOverrides,
  saveNoteTypeOverrides,
  appAlert,
  onAfterChange: () => {
    renderEditor();
    if (currentGroupId) renderGroup();
    if (phaseView && !phaseView.classList.contains("hidden")) {
      renderPhaseDetailView();
    }
    renderHome();
  },
  promptCustomNoteType,
  createCustomNoteType,
  closeBoardActionsModal,
  escapeHtml,
});
editNoteTypesModal.init();
const dashboardFlowModals = createDashboardFlowModalsController({
  dismissAllAppAlerts,
  closeOptionsMenu,
  closeDashboardActionsModal: () => closeDashboardActionsModal(),
  closeDashboardRemoveStructuresModal: () => closeDashboardRemoveStructuresModal(),
  closeDeleteStoryModal: () => closeDeleteStoryModal(),
  boardTitleInput,
  structureNameInput,
  importStoryPasteText,
  importStructuresPasteText,
});

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

function loadSharedBookmarks() {
  const parsed = loadJsonItem(SHARED_BOOKMARKS_KEY, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.url === "string" &&
        typeof item.title === "string",
    )
    .map((item) => ({
      id: item.id,
      url: item.url,
      title: item.title,
      updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
    }));
}

function saveSharedBookmarks() {
  saveJsonItem(SHARED_BOOKMARKS_KEY, sharedStoryBookmarks);
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
  saveSettingsToStorage(SETTINGS_KEY, {
    columnMinWidth,
    wrapColumns,
    showDemoBoards,
  });
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

function isAlteredStructureEntry(structure) {
  return Boolean(
    structure &&
      structure.isAlteredStructure === true &&
      typeof structure.ownerBoardUid === "string" &&
      structure.ownerBoardUid,
  );
}

/** Built-in + catalog custom structures only (excludes per-story altered structures). */
function getCatalogStructureList() {
  return getAllStructureList().filter((item) => !isAlteredStructureEntry(item));
}

function boardUsesOwnAlteredStructure(board) {
  if (!board?.uid) return false;
  const cfg = getStructureConfig(board.structureId);
  return isAlteredStructureEntry(cfg) && cfg.ownerBoardUid === board.uid;
}

/** HTML: escaped structure title + visual-only <span>(altered)</span> when the board uses its own altered template. */
function boardStructureDisplayLineHtml(board) {
  const structure = getStructureConfig(board.structureId);
  let html = escapeHtml(structure.name);
  if (boardUsesOwnAlteredStructure(board)) {
    html += ' <span class="structure-name-altered-suffix">(altered)</span>';
  }
  return html;
}

function removeAlteredStructuresOwnedByBoardUid(boardUid) {
  if (!boardUid) return;
  const next = customStructures.filter((s) => !isAlteredStructureEntry(s) || s.ownerBoardUid !== boardUid);
  if (next.length === customStructures.length) return;
  customStructures = next;
  saveCustomStructures();
}

function pruneOrphanAlteredStructures() {
  const uids = new Set(boards.map((b) => b.uid).filter(Boolean));
  const next = customStructures.filter((s) => !isAlteredStructureEntry(s) || uids.has(s.ownerBoardUid));
  if (next.length === customStructures.length) return;
  customStructures = next;
  saveCustomStructures();
}

function clonePhasesDeepForAlteredFork(phases) {
  if (!Array.isArray(phases)) return [];
  return phases.map((p) => {
    const { title, description } = parsePhaseEntry(p);
    return description ? { title, description } : { title };
  });
}

function generateUniqueAlteredStructureId(seedName) {
  const base = `altered_${slugifyTitle(seedName) || "structure"}`;
  let id = base;
  let suffix = 2;
  while (getAllStructures()[id]) {
    id = `${base}_${suffix}`;
    suffix += 1;
  }
  return id;
}

function forkCurrentBoardToAlteredStructure(board) {
  if (!board?.uid) return { ok: false, reason: "no-board" };
  const cfg = getStructureConfig(board.structureId);
  if (isAlteredStructureEntry(cfg) && cfg.ownerBoardUid === board.uid) {
    return { ok: false, reason: "already-altered" };
  }
  const name = String(cfg.name || "").trim() || "Structure";
  const id = generateUniqueAlteredStructureId(name);
  const now = Date.now();
  const newStructure = {
    id,
    uid: generateUniqueUid(),
    name,
    phases: clonePhasesDeepForAlteredFork(cfg.phases),
    updatedAt: now,
    isAlteredStructure: true,
    ownerBoardUid: board.uid,
  };
  if (typeof cfg.description === "string" && cfg.description.trim()) {
    newStructure.description = cfg.description.trim();
  }
  if (typeof cfg.author === "string" && cfg.author.trim()) {
    newStructure.author = cfg.author.trim();
  }
  customStructures.push(newStructure);
  board.structureId = id;
  board.structure = name;
  saveCustomStructures();
  touchBoard(board);
  saveBoards();
  return { ok: true, structure: newStructure };
}

function isVisualColumnEmpty(board, visualIndex) {
  if (!board || !Number.isInteger(visualIndex) || visualIndex < 0) return false;
  const order = getBoardPhaseOrder(board);
  if (visualIndex >= order.length) return false;
  if (board.notes.some((note) => note.column === visualIndex)) return false;
  normalizeBoardPhaseComments(board);
  const uid = getPhaseUidByVisualColumn(board, visualIndex);
  if (!uid) return true;
  const comments = board.phaseComments[uid];
  return !Array.isArray(comments) || comments.length === 0;
}

function showAlteredStructureIntroDialog() {
  return appDialog({
    title: "Edit the structure",
    message: "",
    confirmLabel: "Continue",
    render(root, api) {
      root.innerHTML = `
        <p class="subtitle" style="margin-top:0;line-height:1.45;">
          If you continue, Structurer will create an altered structure used only by this story.
          Other stories keep using the shared template.
          You can rename it under the story title (double-click the structure name).
        </p>
        <label class="factory-reset-confirm-checkbox" style="margin-top:14px;">
          <input type="checkbox" id="altered-structure-intro-ack" />
          <span>I understand this structure will be for this story only.</span>
        </label>
      `;
      const cb = root.querySelector("#altered-structure-intro-ack");
      api.setConfirmEnabled(false);
      cb.addEventListener("change", () => api.setConfirmEnabled(Boolean(cb.checked)));
      return () => (cb.checked ? true : null);
    },
  });
}

function collectAlteredStructurePhaseRowStatesFromDOM() {
  if (!editAlteredStructurePhasesListEl) return [];
  return [...editAlteredStructurePhasesListEl.querySelectorAll(".structure-phase-row")].map((row) => {
    const raw = row.dataset.structurePhaseOrigin;
    const parsed = raw === undefined || raw === "" ? null : Number(raw);
    return {
      originIndex: Number.isInteger(parsed) ? parsed : null,
      title: row.querySelector('[data-role="phase-input"]')?.value ?? "",
      description: row.querySelector('[data-role="phase-description-input"]')?.value ?? "",
    };
  });
}

function alteredPhaseRowCanRemoveFromBoard(board, originIndex) {
  if (originIndex === null) return true;
  const v = getBoardPhaseOrder(board).indexOf(originIndex);
  if (v < 0) return false;
  return isVisualColumnEmpty(board, v);
}

function renderAlteredStructureEditorRows(board, states) {
  if (!editAlteredStructurePhasesListEl) return;
  editAlteredStructurePhasesListEl.innerHTML = states
    .map((state, i) => {
      const canRemove = alteredPhaseRowCanRemoveFromBoard(board, state.originIndex);
      const phase = normalizeStructureFormPhaseValue({
        title: state.title,
        description: state.description,
      });
      return structureAlteredEditPhaseRowTemplate(i, phase, state.originIndex, canRemove);
    })
    .join("");
}

function fillAlteredStructureEditorForm(board) {
  const st = getStructureConfig(board.structureId);
  const states = st.phases.map((phase, structureIndex) => {
    const p = normalizeStructureFormPhaseValue(phase);
    return {
      originIndex: structureIndex,
      title: p.title,
      description: p.description,
    };
  });
  renderAlteredStructureEditorRows(board, states);
}

async function applyAlteredStructureEditorSave(boardId) {
  const board = boards.find((b) => b.id == boardId);
  if (!board || !boardUsesOwnAlteredStructure(board)) return { ok: false };
  const st = customStructures.find((s) => s.id === board.structureId);
  if (!st || !Array.isArray(st.phases)) return { ok: false };
  const oldN = st.phases.length;
  const rows = collectAlteredStructurePhaseRowStatesFromDOM();
  if (rows.length < 2) {
    await appAlert("Please keep at least 2 phases.");
    return { ok: false };
  }

  let seenNew = false;
  const phaseEntries = [];
  for (const r of rows) {
    const title = r.title.trim();
    if (!title) {
      await appAlert("Every phase needs a name.");
      return { ok: false };
    }
    const description = r.description.trim();
    const phaseObj = description ? { title, description } : { title };

    if (r.originIndex === null) {
      seenNew = true;
      phaseEntries.push({ kind: "new", phase: phaseObj });
    } else {
      if (seenNew) {
        await appAlert("New phases must be added at the bottom of the list.");
        return { ok: false };
      }
      const oi = r.originIndex;
      if (!Number.isInteger(oi) || oi < 0 || oi >= oldN) {
        await appAlert("Invalid phase list. Close this dialog and open Edit the structure again.");
        return { ok: false };
      }
      const prevOld = phaseEntries.filter((e) => e.kind === "old").map((e) => e.oldIndex);
      if (prevOld.length && oi <= prevOld[prevOld.length - 1]) {
        await appAlert("Invalid phase list. Close this dialog and open Edit the structure again.");
        return { ok: false };
      }
      phaseEntries.push({ kind: "old", oldIndex: oi, phase: phaseObj });
    }
  }

  const keptSet = new Set(phaseEntries.filter((e) => e.kind === "old").map((e) => e.oldIndex));
  for (let i = 0; i < oldN; i += 1) {
    if (keptSet.has(i)) continue;
    const v = getBoardPhaseOrder(board).indexOf(i);
    if (v < 0 || !isVisualColumnEmpty(board, v)) {
      await appAlert(
        "Cannot drop a phase that still has notes or phase comments. Clear them first, or add the phase back.",
      );
      return { ok: false };
    }
  }

  const oldOrder = [...getBoardPhaseOrder(board)];
  const oldUids = [...ensureBoardPhaseUids(board)];
  const R = new Set(
    Array.from({ length: oldN }, (_, idx) => idx).filter((idx) => !keptSet.has(idx)),
  );

  const oldToNew = new Map();
  const newPhases = [];
  const newUids = [];
  phaseEntries.forEach((e) => {
    newPhases.push(e.phase);
    if (e.kind === "old") {
      oldToNew.set(e.oldIndex, newPhases.length - 1);
      newUids.push(oldUids[e.oldIndex]);
    } else {
      newUids.push(generateUniqueUid());
    }
  });

  const newOrder = [];
  for (let v = 0; v < oldOrder.length; v += 1) {
    const pid = oldOrder[v];
    if (R.has(pid)) continue;
    newOrder.push(oldToNew.get(pid));
  }
  const newTail = phaseEntries.filter((e) => e.kind === "new").length;
  const oldKeptCount = keptSet.size;
  for (let j = 0; j < newTail; j += 1) {
    newOrder.push(oldKeptCount + j);
  }

  R.forEach((i) => {
    const uid = oldUids[i];
    if (uid && board.phaseComments && board.phaseComments[uid]) {
      delete board.phaseComments[uid];
    }
  });

  st.phases = newPhases;
  board.phaseUids = newUids;
  board.phaseOrder = newOrder;

  const now = Date.now();
  board.notes.forEach((note) => {
    const pid = oldOrder[note.column];
    if (pid === undefined || R.has(pid)) return;
    const npid = oldToNew.get(pid);
    if (!Number.isInteger(npid)) return;
    const newCol = newOrder.indexOf(npid);
    if (newCol >= 0) {
      note.column = newCol;
      note.updatedAt = now;
    }
  });

  normalizeBoardPhaseComments(board);
  normalizeOrders(board.notes, board.structureId);
  st.updatedAt = now;
  saveCustomStructures();
  touchBoard(board);
  saveBoards();
  return { ok: true };
}

function openEditStoryStructureModal(boardId) {
  if (!editStoryStructureModalOverlay) return;
  const board = boards.find((b) => b.id == boardId);
  if (!board || !boardUsesOwnAlteredStructure(board)) return;
  editStoryStructureModalBoardId = boardId;
  fillAlteredStructureEditorForm(board);
  editStoryStructureModalOverlay.classList.remove("hidden");
  const firstInput = editAlteredStructurePhasesListEl?.querySelector('[data-role="phase-input"]');
  if (firstInput) firstInput.focus();
}

function closeEditStoryStructureModal() {
  if (!editStoryStructureModalOverlay) return;
  editStoryStructureModalOverlay.classList.add("hidden");
  editStoryStructureModalBoardId = null;
}

function normalizePhasesFromAlteredStoryImport(phases, pathLabel = "alteredStructure.phases") {
  if (!Array.isArray(phases) || phases.length < 2) {
    throw new Error(`Invalid story JSON: ${pathLabel} must include at least 2 phases.`);
  }
  return phases.map((phase, index) => {
    try {
      return normalizeImportedStructurePhase(phase, `${pathLabel}[${index}]`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        msg
          .replace(/^Invalid custom structures file/, "Invalid story JSON")
          .replace(/^Invalid structures file/, "Invalid story JSON"),
      );
    }
  });
}

function createAlteredStructureForImportedStory(alteredPayload, ownerBoardUid, fallbackStructureName) {
  const phases = normalizePhasesFromAlteredStoryImport(alteredPayload.phases);
  const nameRaw =
    typeof alteredPayload.name === "string" && alteredPayload.name.trim()
      ? alteredPayload.name.trim()
      : String(fallbackStructureName || "").trim() || "Altered structure";
  const id = generateUniqueAlteredStructureId(nameRaw);
  const now = Date.now();
  const row = {
    id,
    uid: generateUniqueUid(),
    name: nameRaw,
    phases,
    updatedAt: Number.isFinite(alteredPayload.updatedAt) ? alteredPayload.updatedAt : now,
    isAlteredStructure: true,
    ownerBoardUid,
  };
  if (typeof alteredPayload.description === "string" && alteredPayload.description.trim()) {
    row.description = alteredPayload.description.trim();
  }
  if (typeof alteredPayload.author === "string" && alteredPayload.author.trim()) {
    row.author = alteredPayload.author.trim();
  }
  customStructures.push(row);
  saveCustomStructures();
  return row;
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
    // Built-in note type ids keep their canonical labels to avoid id/label mismatch confusion.
    label: base.label,
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

function applyDevFlags() {
  // Reset commands are now always available from the dashboard.
}

function isStructurerDevEnabled() {
  try {
    return localStorage.getItem(STRUCTURER_DEV_FLAG_KEY) === "true";
  } catch {
    return false;
  }
}

function applyColumnWidth() {
  document.documentElement.style.setProperty("--column-min-width", `${columnMinWidth}px`);
  columnWidthSlider.value = String(columnMinWidth);
  columnWidthValue.textContent = `${columnMinWidth}px`;
}

function applyWrapColumns() {
  boardEl.classList.toggle("wrap-columns", wrapColumns);
  toggleWrapColumnsBtn.textContent = `Wrap columns: ${wrapColumns ? "On" : "Off"}`;
  sharedViewActions.setWrapColumnsEnabled(wrapColumns);
}

function getAdaptiveNoteBodyCapPx() {
  return Math.min(260, Math.floor(window.innerHeight * 0.32));
}

/** Pixel height for adaptive textarea when `customHeight` is unset: fit content up to cap; empty note keeps a small tap target. */
function adaptiveNoteTextareaHeightPx(note, scrollHeight, cap) {
  const hasText = String(note?.text ?? "").trim().length > 0;
  const minEmpty = 56;
  return Math.max(hasText ? 0 : minEmpty, Math.min(scrollHeight, cap));
}

/** Target height if this note used automatic sizing (no customHeight). Used to clear customHeight when user drags back to “natural”. */
function getAdaptiveNoteBodyNaturalTargetPx(note, body) {
  const cap = getAdaptiveNoteBodyCapPx();
  if (body.matches("textarea")) {
    return Math.round(adaptiveNoteTextareaHeightPx(note, body.scrollHeight, cap));
  }
  return Math.round(Math.min(body.scrollHeight, cap));
}

function fillNoteHeightModeModal() {
  if (!noteHeightModeCurrentEl || !noteHeightModeSwitchBtn) return;
  const board = getCurrentBoard();
  if (!board) {
    noteHeightModeCurrentEl.textContent =
      "Open a story in the editor first. Note height applies only to that story, not to every story on the dashboard.";
    noteHeightModeSwitchBtn.disabled = true;
    noteHeightModeSwitchBtn.textContent = "Switch mode";
    return;
  }
  noteHeightModeSwitchBtn.disabled = false;
  if (boardUsesClassicNoteHeight(board)) {
    noteHeightModeCurrentEl.textContent =
      "This story uses full height: each note grows to show all of its text. While editing, drag the bottom-right corner of the textarea to resize the card.";
    noteHeightModeSwitchBtn.textContent = "Switch this story to capped height (long notes scroll inside)";
  } else {
    noteHeightModeCurrentEl.textContent =
      "This story uses capped height: long notes stop at about the viewport height and scroll inside the card. Drag the resize grip in the bottom-right corner of a note to change that note's height.";
    noteHeightModeSwitchBtn.textContent = "Switch this story to full height (notes grow with all text)";
  }
}

function openNoteHeightModeModal() {
  const el = document.getElementById("note-height-mode-modal-overlay");
  if (!el) return;
  fillNoteHeightModeModal();
  el.classList.remove("hidden");
  el.setAttribute("aria-hidden", "false");
}

function closeNoteHeightModeModal() {
  const el = document.getElementById("note-height-mode-modal-overlay");
  if (!el) return;
  el.classList.add("hidden");
  el.setAttribute("aria-hidden", "true");
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function focusAppAlertConfirmIfEnabled() {
  const confirmBtn = document.querySelector("#app-alert-confirm");
  if (confirmBtn && !confirmBtn.disabled) confirmBtn.click();
}

function promptCustomArchetypeName() {
  return appDialog({
    title: "Custom archetype",
    message: "Enter a name for this archetype.",
    confirmLabel: "Add",
    render(root, api) {
      root.innerHTML = `
        <fieldset class="app-dialog-fieldset">
          <legend class="app-dialog-legend">Name</legend>
          <input
            type="text"
            id="structurer-custom-archetype-input"
            class="app-dialog-text-input"
            maxlength="80"
            autocomplete="off"
            aria-label="Archetype name"
          />
        </fieldset>`;
      const input = root.querySelector("#structurer-custom-archetype-input");
      const sync = () => api.setConfirmEnabled(input.value.trim().length > 0);
      input.addEventListener("input", sync);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (input.value.trim()) focusAppAlertConfirmIfEnabled();
        }
      });
      sync();
      window.setTimeout(() => input.focus(), 0);
      return () => {
        const v = input.value.trim();
        return v.length ? v : null;
      };
    },
  });
}

function promptCustomNoteType() {
  return appDialog({
    title: "Custom note type",
    message: "Choose a name and a color for this type.",
    confirmLabel: "Add",
    render(root, api) {
      const palette = getNoteTypeColorPalette();
      const used = getUsedNoteTypeColors();
      const available = palette.filter((color) => !used.has(color.toLowerCase()));
      const choices = available.length > 0 ? available : palette;
      let selectedColor = choices[0] || "#f3f4f6";
      const choicesHtml = choices
        .map(
          (color, index) =>
            `<button type="button" class="color-swatch${index === 0 ? " selected" : ""}" data-role="pick-custom-note-type-color" data-color="${escapeHtml(
              color,
            )}" aria-label="Color ${escapeHtml(color)}" title="${escapeHtml(color)}" style="background:${escapeHtml(color)};"></button>`,
        )
        .join("");
      root.innerHTML = `
        <div class="app-dialog-custom-note-type">
          <fieldset class="app-dialog-fieldset">
            <legend class="app-dialog-legend">Type name</legend>
            <input
              type="text"
              id="structurer-custom-note-type-input"
              class="app-dialog-text-input"
              maxlength="80"
              autocomplete="off"
              aria-label="Note type name"
            />
          </fieldset>
          <p class="app-dialog-section-label">Color</p>
          <div class="color-grid color-grid--app-dialog-note-type">${choicesHtml}</div>
        </div>`;
      const input = root.querySelector("#structurer-custom-note-type-input");
      const grid = root.querySelector(".color-grid");
      const sync = () => api.setConfirmEnabled(input.value.trim().length > 0 && Boolean(selectedColor));
      input.addEventListener("input", sync);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (input.value.trim() && selectedColor) focusAppAlertConfirmIfEnabled();
        }
      });
      grid.addEventListener("click", (e) => {
        const btn = e.target.closest('[data-role="pick-custom-note-type-color"]');
        if (!btn) return;
        selectedColor = btn.dataset.color;
        grid.querySelectorAll(".color-swatch").forEach((b) => b.classList.toggle("selected", b === btn));
        sync();
      });
      sync();
      window.setTimeout(() => input.focus(), 0);
      return () => {
        const label = input.value.trim();
        if (!label || !selectedColor) return null;
        return { label, color: selectedColor };
      };
    },
  });
}

function isNoteTypeInUse(typeId) {
  return boards.some((board) => board.notes.some((note) => note.kind === typeId));
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

/** Full-height note bodies (classic). Adaptive/capped mode when `board.adaptiveNoteHeights === true`. */
function boardUsesClassicNoteHeight(board) {
  return board == null || board.adaptiveNoteHeights !== true;
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
  const structures = getCatalogStructureList();
  let activeId = selectedId || boardStructureSelect.value || "hero_journey";
  if (activeId !== NO_STRUCTURE_OPTION_VALUE && !structures.some((s) => s.id === activeId)) {
    activeId = structures[0]?.id || "hero_journey";
  }
  boardStructureSelect.innerHTML = renderStructureOptionsHtml(structures, activeId);
  const noStructureOption = document.createElement("option");
  noStructureOption.value = NO_STRUCTURE_OPTION_VALUE;
  noStructureOption.textContent = "No structure (start from scratch)";
  if (activeId === NO_STRUCTURE_OPTION_VALUE) {
    noStructureOption.selected = true;
  }
  boardStructureSelect.append(noStructureOption);
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
  const userSeriesClass = dashboardGroupTier(group) === 0 ? " board-card-user" : "";
  return `
    <article class="board-card${userSeriesClass}" data-group-id="${group.id}" role="button" tabindex="0" aria-label="Open series ${group.title}">
      <div>
        <strong>${titleLineTemplate({
          titleHtml: escapeHtml(group.title),
          labelText: isDemoSeries ? "Demo" : "",
          labelVariant: isDemoSeries ? "demo" : "",
          labelPosition: "right",
        })}</strong>
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
  if (!boardUsesOwnAlteredStructure(board)) return;
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

function sharedBookmarkCardTemplate(bookmark) {
  const safeTitle = escapeHtml(bookmark.title || "Shared story");
  let hostLabel = bookmark.url;
  try {
    hostLabel = new URL(bookmark.url).host || bookmark.url;
  } catch {
    // Keep original URL for malformed legacy rows.
  }
  const updatedAtText = formatDate(bookmark.updatedAt);
  return `
    <article class="board-card board-card-shared" data-role="shared-bookmark-card" data-shared-bookmark-id="${bookmark.id}" role="button" tabindex="0" aria-label="Open shared bookmark ${safeTitle}">
      <div>
        <strong>${titleLineTemplate({
          titleHtml: `<span class="board-card-title-text">${safeTitle}</span>`,
          labelText: "Shared",
          labelVariant: "shared",
          labelPosition: "right",
        })}</strong>
        <div class="board-meta">
          <div class="board-meta-line">${escapeHtml(hostLabel)}</div>
          <div class="board-meta-line">Updated ${updatedAtText}</div>
        </div>
      </div>
      <div class="board-actions">
        <button type="button" class="action-button danger-menu-item" data-role="remove-shared-bookmark" aria-label="Remove shared bookmark">
          <span class="action-icon" aria-hidden="true">✕</span>
        </button>
      </div>
    </article>
  `;
}

function upsertSharedBookmark(url, title) {
  const safeUrl = ensureSafeSharedSourceUrl(url);
  if (!safeUrl) return { ok: false, error: "invalid-url" };
  const trimmedTitle = String(title || "").trim() || "Shared story";
  const existing = sharedStoryBookmarks.find((item) => item.url === safeUrl);
  const now = Date.now();
  if (existing) {
    existing.title = trimmedTitle;
    existing.updatedAt = now;
    saveSharedBookmarks();
    return { ok: true, created: false, bookmark: existing };
  }
  const next = {
    id: crypto.randomUUID(),
    url: safeUrl,
    title: trimmedTitle,
    updatedAt: now,
  };
  sharedStoryBookmarks.push(next);
  saveSharedBookmarks();
  return { ok: true, created: true, bookmark: next };
}

function renderHome() {
  const validBoardIds = new Set(boards.map((board) => board.id));
  demoBoardIds = demoBoardIds.filter((id) => validBoardIds.has(id));
  saveDemoBoardIds();
  groups.forEach((group) => {
    group.boardIds = group.boardIds.filter((id) => validBoardIds.has(id));
  });
  saveGroups();

  const sortedGroups = [...groups]
    .filter((group) => {
      // When demos are hidden, hide series made only of demo stories and/or AI analysis imports.
      if (showDemoBoards) return true;
      return !group.boardIds.every((id) => {
        const b = boards.find((item) => item.id === id);
        return b && isDemoOrAiAnalysisBoard(b);
      });
    })
    .sort((a, b) => {
      const ta = dashboardGroupTier(a);
      const tb = dashboardGroupTier(b);
      if (ta !== tb) return ta - tb;
      return b.updatedAt - a.updatedAt;
    });
  groupsList.innerHTML = sortedGroups.map(groupCardTemplate).join("");
  groupsList.style.display = sortedGroups.length > 0 ? "grid" : "none";

  const sortedBoards = [...boards]
    .filter((board) => showDemoBoards || !isDemoOrAiAnalysisBoard(board))
    .sort((a, b) => {
      const ta = dashboardStoryTier(a);
      const tb = dashboardStoryTier(b);
      if (ta !== tb) return ta - tb;
      return b.updatedAt - a.updatedAt;
    });
  boardsList.innerHTML =
    sortedBoards
      .map((board) => {
        return boardCardTemplate(
          board,
          boardStructureDisplayLineHtml(board),
          formatDate(board.updatedAt),
          isDemoBoard(board),
          inlineTitleEdit.getEditingStoryBoardId(),
          isAiAnalysisImportBoard(board),
        );
      })
      .join("") + dashboardAiPromptCtaCardTemplate();
  const sortedSharedBookmarks = [...sharedStoryBookmarks].sort((a, b) => b.updatedAt - a.updatedAt);
  if (sharedBookmarksList) {
    sharedBookmarksList.innerHTML = sortedSharedBookmarks.map(sharedBookmarkCardTemplate).join("");
    sharedBookmarksList.style.display = sortedSharedBookmarks.length > 0 ? "grid" : "none";
  }
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
    const structureItems = getCatalogStructureList()
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
    dashboardBoardsHeading.classList.remove("hidden");
  }
  if (dashboardSharedHeading) {
    dashboardSharedHeading.classList.toggle("hidden", sortedSharedBookmarks.length === 0);
  }
  const hasAtLeastOneNonDemoStory = boards.some((board) => !isDemoOrAiAnalysisBoard(board));
  emptyState.style.display = hasAtLeastOneNonDemoStory ? "none" : "block";
  applyDemoVisibilityControl();
  renderCreateGroupBoardCheckboxes();
  updateDashboardRemoveStructuresActionState();
}

function syncEditorQuickHelpVisibility() {
  if (!editorQuickHelpEl) return;
  if (loadJsonItem(EDITOR_QUICK_HELP_DISMISSED_KEY, false)) {
    editorQuickHelpEl.classList.add("hidden");
    return;
  }
  editorQuickHelpEl.classList.remove("hidden");
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
  const allowPhaseReorder = boardUsesOwnAlteredStructure(board);
  const showModifiedTag = isModifiedOrder && !allowPhaseReorder;

  const editorTitleMarkup =
    board.id === inlineTitleEdit.getEditingStoryBoardId()
      ? `<input class="inline-story-title-input editor-title-input" type="text" maxlength="80" value="${escapeHtml(board.title)}" data-role="inline-story-title-input" data-board-id="${board.id}" aria-label="Story name" />`
      : `<span class="editor-title-text" data-role="board-title-dblclick">${escapeHtml(board.title)}</span>`;
  const editorLine = titleLineTemplate({
    titleHtml: editorTitleMarkup,
    labelText: isDemoBoard(board) ? "Demo" : isAiAnalysisImportBoard(board) ? "AI analysis" : "",
    labelVariant: isDemoBoard(board) ? "demo" : isAiAnalysisImportBoard(board) ? "analysis" : "",
    labelPosition: "right",
  });
  editorTitle.innerHTML = `<div class="inline-story-title-root" data-role="inline-story-title-root" data-board-id="${board.id}"><span class="inline-story-title-host" data-role="inline-story-title-host">${editorLine}</span></div>`;
  const structDisplayBase = structure.name;
  const structDisplay = showModifiedTag ? `${structDisplayBase} (modified)` : structDisplayBase;
  const canEditStructureName = boardUsesOwnAlteredStructure(board);
  const alteredSuffixHtml = ' <span class="structure-name-altered-suffix">(altered)</span>';
  const structureSubtitleMarkup = canEditStructureName
    ? board.id === inlineTitleEdit.getEditingStructureBoardId()
      ? `<span class="structure-name-inline-edit-row"><input class="inline-structure-name-input structure-name-input" type="text" maxlength="80" value="${escapeHtml(structure.name)}" data-role="inline-structure-name-input" data-board-id="${board.id}" aria-label="Structure template name" />${alteredSuffixHtml}</span>`
      : `<span class="structure-name-editable" data-role="structure-name-dblclick" data-board-id="${board.id}" title="Double-click to rename">${escapeHtml(structure.name)}${showModifiedTag ? " (modified)" : ""}${alteredSuffixHtml}</span>`
    : escapeHtml(structDisplay);
  structureNameEl.innerHTML = structureSubtitleMarkup;
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
              ${
                allowPhaseReorder
                  ? '<button class="phase-drag" data-role="phase-drag-handle" title="Drag to reorder phase columns" draggable="true">⋮⋮</button>'
                  : ""
              }
              ${phaseTitleHtml}
            </div>
            <div class="phase-head-actions">
              <button class="phase-expand" data-role="open-phase-comments" data-column="${columnIndex}" title="Open phase details">🔍</button>
              <button class="phase-add" data-role="open-column-menu" title="Add note">+</button>
            </div>
          </div>
          ${helpPanel}
        </div>
        <div class="notes">${noteItems
          .map((note) =>
            noteTemplate(
              note,
              archetypes,
              archetypeById(note.archetype || "none"),
              noteTypeById(note.kind),
              note.id === editingId,
              boardUsesClassicNoteHeight(board),
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
  syncEditorQuickHelpVisibility();
  if (editorBreadcrumbCurrentEl) {
    editorBreadcrumbCurrentEl.textContent = (board.title || "").trim() || "Story";
  }
}

function autoResizeTextareas() {
  const board = getCurrentBoard();
  if (!board) return;

  boardEl.querySelectorAll('textarea[data-role="text"]').forEach((textarea) => {
    const noteId = Number(textarea.dataset.noteId);
    const note = board.notes.find((item) => item.id === noteId);
    if (!note || note.customHeight) return;
    if (boardUsesClassicNoteHeight(board) || !textarea.classList.contains("note-text-body--adaptive")) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(textarea.scrollHeight, 74)}px`;
      return;
    }
    const cap = getAdaptiveNoteBodyCapPx();
    textarea.style.height = "auto";
    const sh = textarea.scrollHeight;
    const h = adaptiveNoteTextareaHeightPx(note, sh, cap);
    textarea.style.height = `${h}px`;
    textarea.style.overflowY = sh > cap ? "auto" : "hidden";
  });
}

const navigation = createNavigationController({
  views: {
    landingView,
    homeView,
    sharedView,
    helpView,
    privacyView,
    termsView,
    aiAnalysisPromptView,
    groupView,
    editorView,
    phaseView,
    notFoundView,
  },
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
  renderSharedStory,
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
  const groupLine = titleLineTemplate({
    titleHtml: groupTitleMarkup,
    labelText: isDemoSeries ? "Demo" : "",
    labelVariant: isDemoSeries ? "demo" : "",
    labelPosition: "right",
  });
  groupTitleEl.innerHTML = `<span class="inline-story-title-host" data-role="inline-story-title-host">${groupLine}</span>`;
  groupSubtitleEl.textContent = `${groupBoards.length} stories`;
  if (groupBreadcrumbCurrentEl) {
    groupBreadcrumbCurrentEl.textContent = (group.title || "").trim() || "Series";
  }
  groupBoardStackEl.innerHTML = groupBoards
    .map((board) => {
      const structure = getStructureConfig(board.structureId);
      const phases = getBoardPhases(board);
      return `
      <section class="group-board-card">
        <header class="group-board-head">
          <div>
            <h2><div class="inline-story-title-root" data-board-id="${board.id}"><span class="inline-story-title-host">${titleLineTemplate({
              titleHtml: `<span class="group-board-title-text">${escapeHtml(board.title)}</span>`,
              labelText: isDemoBoard(board) ? "Demo" : isAiAnalysisImportBoard(board) ? "AI analysis" : "",
              labelVariant: isDemoBoard(board) ? "demo" : isAiAnalysisImportBoard(board) ? "analysis" : "",
              labelPosition: "right",
            })}</span></div></h2>
            <p class="subtitle">${boardStructureDisplayLineHtml(board)}</p>
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

function ensureSafeSharedSourceUrl(rawValue) {
  const candidate = String(rawValue || "").trim();
  if (!candidate) return null;
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  const protocol = parsed.protocol.toLowerCase();
  const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (protocol !== "https:" && !(protocol === "http:" && isLocalhost)) return null;
  return parsed.toString();
}

function openSharedStoryRouteFromSourceUrl(sourceUrl, replaceRoute = false) {
  const safeUrl = ensureSafeSharedSourceUrl(sourceUrl);
  if (!safeUrl) return false;
  const encoded = encodeURIComponent(safeUrl);
  const hash = `#/shared?src=${encoded}`;
  if (replaceRoute) {
    const base = window.location.pathname === "/shared" ? "/" : window.location.pathname;
    window.location.replace(`${base}${hash}`);
    return true;
  }
  window.location.hash = hash;
  return true;
}

function getHashQueryParam(name) {
  const hash = String(window.location.hash || "");
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return "";
  const queryIndex = raw.indexOf("?");
  if (queryIndex < 0) return "";
  const value = new URLSearchParams(raw.slice(queryIndex + 1)).get(name);
  return typeof value === "string" ? value.trim() : "";
}

function canonicalizeUrlToHashRoutesForPrivacy() {
  const search = new URLSearchParams(window.location.search || "");
  const hasSearch = String(window.location.search || "").length > 1;
  const pathname = window.location.pathname || "/";
  const hash = String(window.location.hash || "");
  const hashHasRoute = hash.startsWith("#/");
  const hashSrc = getHashQueryParam("src");
  const legacySrc = search.get("src");

  // Compatibility: old shared links like /shared?src=... or /?src=... become /#/shared?src=...
  if (legacySrc && (!hashHasRoute || !hashSrc)) {
    const safe = ensureSafeSharedSourceUrl(legacySrc);
    if (safe) {
      const encoded = encodeURIComponent(safe);
      window.location.replace(`/#/shared?src=${encoded}`);
      return true;
    }
  }

  // Privacy: drop non-hash query params (e.g. fbclid) once the app is loaded.
  if (hasSearch && hashHasRoute) {
    const cleanPath = pathname === "/shared" ? "/" : pathname;
    window.location.replace(`${cleanPath}${hash}`);
    return true;
  }

  return false;
}

function getSharedPreviewDataFromStoryJson(rawText) {
  const trimmed = String(rawText ?? "").trim();
  if (!trimmed) {
    throw new Error("The shared file is empty. Provide a valid Structurer story JSON.");
  }
  const maybeHtml = trimmed.startsWith("<!doctype") || trimmed.startsWith("<html") || trimmed.startsWith("<?xml");
  if (maybeHtml) {
    throw new Error("The shared file is not JSON. Use a direct public URL to a `.json` file.");
  }
  let parsed;
  try {
    parsed = JSON.parse(stripLeadingTrailingOutsideJsonObject(trimmed));
  } catch {
    throw new Error("The shared file is not valid JSON (it may be corrupted).");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("The shared file is not a valid JSON object.");
  }
  if (parsed.exportType && parsed.exportType !== "structurer.story") {
    throw new Error(
      `This JSON is not a Structurer story export (found exportType "${parsed.exportType}").`,
    );
  }
  if (!Array.isArray(parsed.notes)) {
    throw new Error(
      'This JSON is valid, but it is not a Structurer story. Expected a story payload with a root "notes" array.',
    );
  }
  const storySchemaVersion = normalizeImportedStorySchemaVersion(parsed);
  let structure;
  if (parsed.alteredStructure && typeof parsed.alteredStructure === "object" && Array.isArray(parsed.alteredStructure.phases)) {
    const phases = normalizePhasesFromAlteredStoryImport(parsed.alteredStructure.phases);
    structure = {
      id: "shared_altered_structure",
      name:
        (typeof parsed.alteredStructure.name === "string" && parsed.alteredStructure.name.trim()) ||
        (typeof parsed.structure === "string" && parsed.structure.trim()) ||
        "Altered structure",
      phases,
    };
  } else {
    structure = resolveStoryImportCatalogStructure(parsed, storySchemaVersion);
  }
  const phaseCount = structure.phases.length;
  const importedPhaseOrder = isValidPhaseOrder(parsed.phaseOrder, phaseCount)
    ? [...parsed.phaseOrder]
    : identityPhaseOrder(phaseCount);
  const importedPhaseUids = Array.isArray(parsed.phaseUids) ? parsed.phaseUids : [];
  const normalizedPreviewPhaseUids = identityPhaseOrder(phaseCount).map((phaseId) => {
    const candidate = importedPhaseUids[phaseId];
    return typeof candidate === "string" && candidate ? candidate : generateUniqueUid();
  });
  const previewPhases = importedPhaseOrder.map((phaseIndex) => structure.phases[phaseIndex]);
  const noteTypes = [...BUILTIN_NOTE_TYPES];
  if (Array.isArray(parsed.noteTypes)) {
    parsed.noteTypes.forEach((noteType) => {
      if (!noteType || typeof noteType.id !== "string" || typeof noteType.label !== "string") return;
      if (noteTypes.some((item) => item.id === noteType.id)) return;
      noteTypes.push({
        id: noteType.id,
        label: noteType.label.trim() || noteType.id,
        color: typeof noteType.color === "string" && isValidHexColor(noteType.color) ? normalizeHexColor(noteType.color) : "#f3f4f6",
      });
    });
  }
  const archetypes = [...BUILTIN_ARCHETYPES];
  if (Array.isArray(parsed.archetypes)) {
    parsed.archetypes.forEach((archetype) => {
      if (!archetype || typeof archetype.id !== "string" || typeof archetype.label !== "string") return;
      if (archetypes.some((item) => item.id === archetype.id)) return;
      archetypes.push({
        id: archetype.id,
        label: archetype.label.trim() || archetype.id,
        icon: typeof archetype.icon === "string" ? archetype.icon : "✨",
      });
    });
  }
  const notes = parsed.notes.map((note, index) => {
    const column = Number.isInteger(note.column) ? note.column : 0;
    return {
      id: index + 1,
      kind: typeof note.kind === "string" && note.kind ? note.kind : "plot",
      column: Math.max(0, Math.min(column, phaseCount - 1)),
      order: Number.isInteger(note.order) ? note.order : index,
      text: typeof note.text === "string" ? note.text : "",
      characterName: typeof note.characterName === "string" ? note.characterName : "",
      archetype: typeof note.archetype === "string" && note.archetype ? note.archetype : "none",
      collapsed: Boolean(note.collapsed),
    };
  });
  const phaseCommentsByColumn = identityPhaseOrder(phaseCount).map(() => []);
  if (parsed.phaseComments && typeof parsed.phaseComments === "object" && !Array.isArray(parsed.phaseComments)) {
    const phaseUidToPhaseId = new Map();
    normalizedPreviewPhaseUids.forEach((uid, phaseId) => {
      phaseUidToPhaseId.set(uid, phaseId);
    });
    const phaseIdToColumn = new Map();
    importedPhaseOrder.forEach((phaseId, columnIndex) => {
      phaseIdToColumn.set(phaseId, columnIndex);
    });
    Object.entries(parsed.phaseComments).forEach(([phaseKey, comments]) => {
      if (!Array.isArray(comments)) return;
      let targetColumn = null;
      if (phaseUidToPhaseId.has(phaseKey)) {
        const phaseId = phaseUidToPhaseId.get(phaseKey);
        targetColumn = phaseIdToColumn.get(phaseId);
      } else {
        const legacyColumn = Number(phaseKey);
        if (Number.isInteger(legacyColumn) && legacyColumn >= 0 && legacyColumn < phaseCount) {
          targetColumn = legacyColumn;
        }
      }
      if (!Number.isInteger(targetColumn) || targetColumn < 0 || targetColumn >= phaseCount) return;
      const normalizedComments = comments
        .filter((comment) => comment && typeof comment === "object")
        .map((comment, index) => ({
          id: Number.isInteger(comment.id) ? comment.id : index + 1,
          createdAt: Number.isFinite(comment.createdAt) ? comment.createdAt : Date.now(),
          text: typeof comment.text === "string" ? comment.text.trim() : "",
        }))
        .filter((comment) => comment.text.length > 0)
        .sort((a, b) => a.createdAt - b.createdAt || a.id - b.id)
        .map((comment) => comment.text);
      if (normalizedComments.length === 0) return;
      phaseCommentsByColumn[targetColumn].push(...normalizedComments);
    });
  }
  return {
    uid: typeof parsed.uid === "string" && parsed.uid ? parsed.uid : "",
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "Shared story",
    structureName: structure.name,
    phases: previewPhases,
    notes,
    phaseCommentsByColumn,
    noteTypes,
    archetypes,
  };
}

function renderSharedStoryPreview(preview) {
  if (!sharedStoryPreviewHostEl) return;
  const noteTypeByIdForPreview = (id) =>
    preview.noteTypes.find((item) => item.id === id) || {
      id,
      label: String(id || "note")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      color: "#f3f4f6",
    };
  const archetypeByIdForPreview = (id) =>
    preview.archetypes.find((item) => item.id === id) || {
      id,
      label: String(id || "none"),
      icon: "",
    };
  sharedStoryPreviewHostEl.innerHTML = `
    <section class="group-board-card">
      <section class="board wrap-columns group-board-preview">
        ${preview.phases
          .map((phase, columnIndex) => {
            const noteItems = getColumnNotes(preview.notes, columnIndex);
            const phaseComments = Array.isArray(preview.phaseCommentsByColumn?.[columnIndex])
              ? preview.phaseCommentsByColumn[columnIndex]
              : [];
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
                      const type = noteTypeByIdForPreview(note.kind);
                      const archetype = archetypeByIdForPreview(note.archetype || "none");
                      const textPreview = (note.text || "").trim();
                      const characterLabel =
                        note.kind === "character"
                          ? [archetype?.label || "", note.characterName || ""]
                              .map((part) => part.trim())
                              .filter(Boolean)
                              .join(" - ") || "Character"
                          : "";
                      const collapsedPreview =
                        note.kind === "character" ? characterLabel || textPreview || "Character note" : textPreview || "Empty note";
                      const header =
                        note.kind === "character" ? `${archetype.label}${note.characterName ? ` - ${note.characterName}` : ""}` : type.label;
                      const collapsed = Boolean(note.collapsed);
                      return `<article class="note group-note-readonly${collapsed ? " is-collapsed" : ""}" style="--note-bg:${type.color};">
                        <div class="note-head">
                          ${
                            collapsed
                              ? `<div class="collapsed-preview" title="${escapeHtml(collapsedPreview)}">${escapeHtml(
                                  collapsedPreview,
                                )}</div>`
                              : `<span class="badge">${escapeHtml(header)}</span>`
                          }
                        </div>
                        ${collapsed ? "" : `<div class="group-note-text">${escapeHtml((note.text || "").trim() || "Empty note")}</div>`}
                      </article>`;
                    })
                    .join("")}
                </div>
                ${
                  phaseComments.length > 0
                    ? `<section class="shared-phase-comments" aria-label="Phase comments">
                        <h3 class="shared-phase-comments-title">COMMENTS (${phaseComments.length})</h3>
                        <div class="shared-phase-comments-list">
                          ${phaseComments
                            .map(
                              (commentText) =>
                                `<article class="shared-phase-comment-item"><p class="shared-phase-comment-text">${escapeHtml(commentText)}</p></article>`,
                            )
                            .join("")}
                        </div>
                      </section>`
                    : ""
                }
              </section>
            `;
          })
          .join("")}
      </section>
    </section>
  `;
}

async function renderSharedStory(sourceUrl) {
  const requestId = ++sharedStoryRenderRequestId;
  if (sharedStoryPreviewHostEl) {
    sharedStoryPreviewHostEl.innerHTML = "";
  }
  sharedViewActions.setControlsVisible(false);
  if (sharedStoryPageTitleEl) {
    sharedStoryPageTitleEl.textContent = "Shared story (read-only)";
  }
  if (sharedStoryPageSubtitleEl) {
    sharedStoryPageSubtitleEl.textContent = "";
    sharedStoryPageSubtitleEl.classList.add("hidden");
  }
  sharedViewActions.setBookmarkState({ title: "Shared story", hidden: true });
  const safeUrl = ensureSafeSharedSourceUrl(sourceUrl);
  if (!safeUrl) {
    if (sharedStoryStatusEl) {
      sharedStoryStatusEl.classList.remove("hidden");
      sharedStoryStatusEl.textContent =
        "Missing or invalid source URL. Open a link like /#/shared?src=https://... with a public Structurer story JSON.";
    }
    return;
  }
  if (sharedStoryStatusEl) {
    sharedStoryStatusEl.classList.remove("hidden");
    sharedStoryStatusEl.textContent = "Loading shared story...";
  }
  sharedViewActions.setControlsVisible(true, safeUrl);
  try {
    const loaded = await loadSharedStoryFromUrlForPreview(safeUrl);
    if (requestId !== sharedStoryRenderRequestId) return;
    const preview = loaded.preview;
    if (sharedStoryPageTitleEl) {
      sharedStoryPageTitleEl.innerHTML = titleLineTemplate({
        titleHtml: escapeHtml(preview.title),
        titleClass: "shared-title-text",
        labelText: "Shared",
        labelVariant: "shared",
        labelExtraClass: "shared-title-badge",
        labelPosition: "right",
      });
    }
    if (sharedStoryPageSubtitleEl) {
      sharedStoryPageSubtitleEl.textContent = preview.structureName || "";
      sharedStoryPageSubtitleEl.classList.toggle("hidden", !preview.structureName);
    }
    renderSharedStoryPreview(preview);
    const alreadyBookmarked = sharedStoryBookmarks.some((item) => item.url === safeUrl);
    sharedViewActions.setBookmarkState({ title: preview.title || "Shared story", hidden: alreadyBookmarked });
    if (sharedStoryStatusEl) {
      sharedStoryStatusEl.textContent = "";
      sharedStoryStatusEl.classList.add("hidden");
    }
  } catch (error) {
    if (sharedStoryStatusEl) {
      sharedStoryStatusEl.classList.remove("hidden");
      sharedStoryStatusEl.textContent =
        error instanceof Error
          ? error.message
          : "Could not load shared story. Check that the URL is public and CORS allows access.";
    }
  }
}

async function loadSharedStoryFromUrlForPreview(sourceUrl) {
  const safeUrl = ensureSafeSharedSourceUrl(sourceUrl);
  if (!safeUrl) {
    throw new Error("Missing or invalid source URL.");
  }
  let response;
  try {
    response = await fetch(safeUrl, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      redirect: "follow",
      cache: "no-store",
    });
  } catch {
    throw new Error("Could not fetch shared JSON. Check that the URL is public and CORS allows access.");
  }
  if (!response.ok) {
    throw new Error(`Could not fetch shared JSON (${response.status}).`);
  }
  const rawText = await response.text();
  const maxChars = 4 * 1024 * 1024;
  if (rawText.length > maxChars) {
    throw new Error("Shared JSON is too large. Ask the sender to use file export/import.");
  }
  const preview = getSharedPreviewDataFromStoryJson(rawText);
  return { safeUrl, rawText, preview };
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

function commitBoardStructureRenameFromInline(boardId, trimmed) {
  const board = boards.find((b) => b.id === boardId);
  if (!board || !boardUsesOwnAlteredStructure(board)) return;
  const idx = customStructures.findIndex((s) => s.id === board.structureId);
  if (idx < 0) return;
  const name = String(trimmed ?? "").trim();
  if (!name) {
    renderHome();
    if (currentBoardId === boardId) renderEditor();
    if (currentGroupId && groups.some((g) => g.id === currentGroupId && g.boardIds.includes(boardId))) {
      renderGroup();
    }
    return;
  }
  if (name === customStructures[idx].name) {
    renderHome();
    if (currentBoardId === boardId) renderEditor();
    if (currentGroupId && groups.some((g) => g.id === currentGroupId && g.boardIds.includes(boardId))) {
      renderGroup();
    }
    return;
  }
  customStructures[idx].name = name;
  board.structure = name;
  customStructures[idx].updatedAt = Date.now();
  saveCustomStructures();
  touchBoard(board);
  renderHome();
  if (currentBoardId === boardId) renderEditor();
  if (currentGroupId && groups.some((g) => g.id === currentGroupId && g.boardIds.includes(boardId))) {
    renderGroup();
  }
}

const inlineTitleEdit = createInlineTitleEditController({
  getBoards: () => boards,
  getGroups: () => groups,
  getCurrentBoardId: () => currentBoardId,
  getCurrentGroupId: () => currentGroupId,
  touchBoard,
  clearBoardCardPendingOpenTimer: () => {
    clearTimeout(boardCardPendingOpenTimer);
    boardCardPendingOpenTimer = null;
  },
  commitGroupTitleRenameFromModal,
  renderHome,
  renderEditor,
  renderGroup,
  canEditBoardStructure: (boardId) => {
    const b = boards.find((x) => x.id === boardId);
    return Boolean(b && boardUsesOwnAlteredStructure(b));
  },
  commitBoardStructureRenameFromInline,
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

function createBoardWithInitialAlteredStructure(title, phases, alteredStructureName = "Unstructured") {
  const trimmedTitle = String(title || "").trim();
  const normalizedPhases = (Array.isArray(phases) ? phases : [])
    .map((phase) => {
      const phaseTitle = String(phase?.title || "").trim();
      if (!phaseTitle) return null;
      const phaseDescription = String(phase?.description || "").trim();
      return phaseDescription ? { title: phaseTitle, description: phaseDescription } : { title: phaseTitle };
    })
    .filter(Boolean);
  if (!trimmedTitle) {
    throw new Error("Story title is required.");
  }
  if (normalizedPhases.length < 1) {
    throw new Error("Please add at least 1 phase.");
  }
  const structureName = String(alteredStructureName || "").trim() || "Unstructured";
  const boardUid = generateUniqueUid();
  const structureId = generateUniqueAlteredStructureId(structureName);
  const now = Date.now();
  const alteredStructure = {
    id: structureId,
    uid: generateUniqueUid(),
    name: structureName,
    phases: normalizedPhases,
    updatedAt: now,
    isAlteredStructure: true,
    ownerBoardUid: boardUid,
  };
  customStructures.push(alteredStructure);
  saveCustomStructures();

  const baseSlug = slugifyTitle(trimmedTitle);
  const slug = ensureUniqueSlug(baseSlug);
  const newBoard = {
    id: crypto.randomUUID(),
    uid: boardUid,
    title: trimmedTitle,
    slug,
    structureId: alteredStructure.id,
    structure: alteredStructure.name,
    phaseOrder: identityPhaseOrder(alteredStructure.phases.length),
    phaseUids: identityPhaseOrder(alteredStructure.phases.length).map(() => generateUniqueUid()),
    nextNoteId: 1,
    nextCommentId: 1,
    notes: [],
    phaseComments: {},
    phaseCommentsVersion: 2,
    onboardingAddNotesHintSeen: false,
    updatedAt: now,
  };
  boards.push(newBoard);
  saveBoards();
  renderHome();
  return newBoard;
}

function collectStoryScratchPhaseRowsFromHost(hostEl) {
  if (!hostEl) return [];
  return [...hostEl.querySelectorAll(".structure-phase-row")].map((row) => ({
    title: row.querySelector('[data-role="phase-input"]')?.value ?? "",
    description: row.querySelector('[data-role="phase-description-input"]')?.value ?? "",
  }));
}

function renderStoryScratchPhaseRows(hostEl, values) {
  if (!hostEl) return;
  const safeValues = Array.isArray(values) && values.length > 0 ? values : [{ title: "", description: "" }];
  hostEl.innerHTML = safeValues
    .map((value, index) => structurePhaseRowTemplate(index, normalizeStructureFormPhaseValue(value)))
    .join("");
  const rows = hostEl.querySelectorAll(".structure-phase-row");
  rows.forEach((row) => {
    const removeButton = row.querySelector('[data-role="remove-phase-row"]');
    if (!removeButton) return;
    const canRemove = rows.length > 1;
    removeButton.disabled = !canRemove;
    removeButton.title = canRemove ? "Remove row" : "At least 1 phase is required.";
  });
}

async function promptCreateStoryFromScratch(initialTitle = "") {
  return appDialog({
    title: "Start story without a structure",
    message:
      "Create a private altered structure used only by this story. You can start with one phase and add more later.",
    confirmLabel: "Create story",
    render(root, api) {
      root.innerHTML = `
        <fieldset class="app-dialog-fieldset">
          <legend class="app-dialog-legend">Story name</legend>
          <input
            type="text"
            id="structurer-story-scratch-title"
            class="app-dialog-text-input"
            maxlength="80"
            autocomplete="off"
            aria-label="Story name"
          />
        </fieldset>
        <fieldset class="app-dialog-fieldset">
          <legend class="app-dialog-legend">Structure name (optional)</legend>
          <input
            type="text"
            id="structurer-story-scratch-structure-name"
            class="app-dialog-text-input"
            maxlength="80"
            autocomplete="off"
            aria-label="Structure name"
            placeholder="Unstructured"
          />
        </fieldset>
        <p class="app-dialog-section-label">Phases</p>
        <div id="structurer-story-scratch-phases" class="structure-phases-list"></div>
        <div class="structure-form-actions">
          <button id="structurer-story-scratch-add-row" class="ghost-button" type="button">Add row</button>
        </div>
      `;
      const titleInput = root.querySelector("#structurer-story-scratch-title");
      const structureNameInput = root.querySelector("#structurer-story-scratch-structure-name");
      const phasesHost = root.querySelector("#structurer-story-scratch-phases");
      const addRowBtn = root.querySelector("#structurer-story-scratch-add-row");
      const sync = () => {
        const storyTitle = titleInput.value.trim();
        const phaseCount = collectStoryScratchPhaseRowsFromHost(phasesHost).filter((row) => row.title.trim()).length;
        api.setConfirmEnabled(Boolean(storyTitle) && phaseCount >= 1);
      };
      renderStoryScratchPhaseRows(phasesHost, [{ title: "Phase 1", description: "" }]);
      titleInput.value = String(initialTitle || "").trim();
      if (titleInput.value) {
        structureNameInput.value = `${titleInput.value} structure`;
      }
      titleInput.addEventListener("input", sync);
      structureNameInput.addEventListener("input", sync);
      phasesHost.addEventListener("input", sync);
      phasesHost.addEventListener("click", (event) => {
        const removeButton = event.target.closest('button[data-role="remove-phase-row"]');
        if (!removeButton || removeButton.disabled) return;
        const row = removeButton.closest(".structure-phase-row");
        if (!row || !phasesHost.contains(row)) return;
        row.remove();
        renderStoryScratchPhaseRows(phasesHost, collectStoryScratchPhaseRowsFromHost(phasesHost));
        sync();
      });
      addRowBtn.addEventListener("click", () => {
        const values = collectStoryScratchPhaseRowsFromHost(phasesHost);
        values.push({ title: "", description: "" });
        renderStoryScratchPhaseRows(phasesHost, values);
        const inputs = phasesHost.querySelectorAll('[data-role="phase-input"]');
        const last = inputs[inputs.length - 1];
        if (last) last.focus();
        sync();
      });
      sync();
      window.setTimeout(() => titleInput.focus(), 0);
      return () => {
        const storyTitle = titleInput.value.trim();
        const structureName = structureNameInput.value.trim() || "Unstructured";
        const phases = collectStoryScratchPhaseRowsFromHost(phasesHost)
          .map((row) => {
            const title = row.title.trim();
            if (!title) return null;
            const description = row.description.trim();
            return description ? { title, description } : { title };
          })
          .filter(Boolean);
        if (!storyTitle || phases.length < 1) return null;
        return { title: storyTitle, structureName, phases };
      };
    },
  });
}

function createDemoBoardFromJson(demoData) {
  const structureEntry = getCatalogStructureList().find(
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
    adaptiveNoteHeights: demoData.adaptiveNoteHeights === false ? false : true,
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

/** Story imported from LLM JSON that included root `aiAnalysisImport: true` (Build AI import prompt). */
function isAiAnalysisImportBoard(board) {
  return Boolean(board && board.aiAnalysisImport === true);
}

/** Hidden when "Hide demos" is off: built-in demos and optional AI analysis imports. */
function isDemoOrAiAnalysisBoard(board) {
  return isDemoBoard(board) || isAiAnalysisImportBoard(board);
}

/** Dashboard ordering: 0 = user-authored, 1 = AI analysis import, 2 = demo. */
function dashboardStoryTier(board) {
  if (!board) return 2;
  if (isDemoBoard(board)) return 2;
  if (isAiAnalysisImportBoard(board)) return 1;
  return 0;
}

/** Series tier: same buckets — any user story forces tier 0; else min of members. */
function dashboardGroupTier(group) {
  let minTier = 2;
  for (const id of group.boardIds || []) {
    const b = boards.find((item) => item.id === id);
    if (!b) continue;
    const t = dashboardStoryTier(b);
    if (t === 0) return 0;
    minTier = Math.min(minTier, t);
  }
  return minTier;
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
  removeAlteredStructuresOwnedByBoardUid(board.uid);
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
  delete board.aiAnalysisImport;
  board.updatedAt = Date.now();
  saveBoards();
}

function applyDemoVisibilityControl() {
  if (!toggleDemoVisibilityBtn) return;
  const hasAiAnalysis = boards.some(isAiAnalysisImportBoard);
  if (showDemoBoards) {
    toggleDemoVisibilityBtn.textContent = hasAiAnalysis ? "Hide demos and AI analyses" : "Hide demos";
  } else {
    toggleDemoVisibilityBtn.textContent = hasAiAnalysis ? "Show demos and AI analyses" : "Show demos";
  }
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

/** Append any new `DEMO_BOARD_DATA` entries missing from local boards (title + structure), and flag them as demos. */
function ensureMissingDemoBoardsPresent() {
  let added = false;
  DEMO_BOARD_DATA.forEach((demo) => {
    const demoSlug = slugifyTitle(demo.title || "");
    const structureName = demo.structure || "Hero's Journey";
    const exists = boards.some(
      (b) => slugifyTitle(b.title || "") === demoSlug && b.structure === structureName,
    );
    if (exists) return;
    const board = createDemoBoardFromJson(demo);
    boards.push(board);
    demoBoardIds.push(board.id);
    added = true;
  });
  if (added) {
    saveDemoBoardIds();
    saveBoards();
  }
}

function ensureMatrixTrilogySeriesDemo() {
  const normalize = (value) => String(value || "").trim().toLowerCase();
  const trilogyTitle = "The Matrix Trilogy";
  const matrixTitle = "The Matrix";
  const reloadedTitle = "The Matrix Reloaded";
  const revolutionTitle = "The Matrix Revolutions";

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
  return boardToExportPayloadWithOptions(board, { includePhaseComments: true });
}

function boardToExportPayloadWithOptions(board, options = {}) {
  const includePhaseComments = options.includePhaseComments !== false;
  const structure = getStructureConfig(board.structureId);
  const phaseUids = ensureBoardPhaseUids(board);
  normalizeBoardPhaseComments(board);
  const exportedPhaseComments = {};
  if (includePhaseComments) {
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
  }
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
  const payload = {
    exportType: "structurer.story",
    schemaVersion: STORY_JSON_SCHEMA_LATEST,
    uid: board.uid,
    updatedAt: board.updatedAt,
    title: board.title,
    structureId: structure.id,
    structure: structure.name,
    phaseOrder: getBoardPhaseOrder(board),
    phaseUids,
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
  if (board.aiAnalysisImport === true) {
    payload.aiAnalysisImport = true;
  }
  if (board.adaptiveNoteHeights === true) {
    payload.adaptiveNoteHeights = true;
  }
  if (boardUsesOwnAlteredStructure(board)) {
    const st = getStructureConfig(board.structureId);
    payload.alteredStructure = {
      name: st.name,
      phases: clonePhasesDeepForAlteredFork(st.phases),
      updatedAt: Number.isFinite(st.updatedAt) ? st.updatedAt : Date.now(),
    };
    if (typeof st.description === "string" && st.description.trim()) {
      payload.alteredStructure.description = st.description.trim();
    }
    if (typeof st.author === "string" && st.author.trim()) {
      payload.alteredStructure.author = st.author.trim();
    }
  }
  if (includePhaseComments) {
    payload.phaseCommentsVersion = 2;
    payload.phaseComments = exportedPhaseComments;
  }
  return payload;
}

function boardHasAnyPhaseComments(board) {
  if (!board) return false;
  normalizeBoardPhaseComments(board);
  const phaseUids = ensureBoardPhaseUids(board);
  return phaseUids.some((phaseUid) => {
    const list = board.phaseComments[phaseUid];
    return Array.isArray(list) && list.length > 0;
  });
}

function downloadBoard(board, options = {}) {
  const payload = boardToExportPayloadWithOptions(board, options);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stableSlug = typeof board.slug === "string" && board.slug.trim() ? board.slug.trim() : "";
  const filename = `${stableSlug || slugifyTitle(board.title || "story")}.json`;
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

/** Local date/time for structure export filenames: YYMMDDTHHmm (e.g. 260405T1942). */
function formatStructureExportFilenameTimestamp(d = new Date()) {
  const yy = String(d.getFullYear() % 100).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yy}${mm}${dd}T${hh}${mi}`;
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

function customStructureToExportRow(structure) {
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
}

/**
 * Download one structure from the preview modal as `structurer.structure` JSON.
 * Ids are unchanged: user-added rows keep stored id/uid; built-ins use canonical `structure.id` and `uid` when set, else
 * `uid` equals `id`. Import accepts this type and legacy `structurer.custom-structures`; entries whose id is a local built-in
 * are skipped (no duplicate custom row). Download filename: `{id}.json` (same idea as extension packs).
 */
function exportStructurePreviewTemplate(structureId) {
  const structure = getAllStructures()[structureId];
  if (!structure || isAlteredStructureEntry(structure)) return;

  const isUserCatalogCustom = customStructures.some((s) => s.id === structureId && !isAlteredStructureEntry(s));
  let row;
  if (isUserCatalogCustom) {
    row = customStructureToExportRow(structure);
  } else {
    const uid =
      typeof structure.uid === "string" && structure.uid.trim() ? structure.uid.trim() : structure.id;
    row = {
      id: structure.id,
      uid,
      name: structure.name,
      phases: clonePhasesDeepForAlteredFork(structure.phases),
      updatedAt: Date.now(),
    };
    if (typeof structure.description === "string" && structure.description.trim()) {
      row.description = structure.description.trim();
    }
    if (typeof structure.author === "string" && structure.author.trim()) {
      row.author = structure.author.trim();
    }
  }

  const payload = {
    exportType: STRUCTURES_PACK_EXPORT_TYPE,
    schemaVersion: 2,
    exportedAt: Date.now(),
    appVersion: packageJson.version || "",
    structures: [row],
  };
  const filename = `${structure.id || "structure"}.json`;
  downloadJsonFile(payload, filename);
}

function normalizeImportedStructurePhase(phase, pathLabel) {
  if (typeof phase === "string") {
    const title = String(phase || "").trim();
    if (!title) {
      throw new Error(`Invalid structures file: ${pathLabel} must be a non-empty string or object with title.`);
    }
    return title;
  }
  if (phase && typeof phase === "object" && !Array.isArray(phase)) {
    const title = String(phase.title ?? phase.name ?? "").trim();
    if (!title) {
      throw new Error(`Invalid structures file: ${pathLabel} must include a non-empty title.`);
    }
    const description = typeof phase.description === "string" ? phase.description.trim() : "";
    return description ? { title, description } : { title };
  }
  throw new Error(`Invalid structures file: ${pathLabel} must be a string or { title, description? }.`);
}

/**
 * Remove LLM/chat noise (e.g. `json` + ``` fences, intro text) by keeping the span from the first `{` to the last `}`.
 * Structurer story and structure-template exports are a single root JSON object.
 */
function stripLeadingTrailingOutsideJsonObject(rawText) {
  const s = String(rawText ?? "").trim();
  if (!s) return s;
  const open = s.indexOf("{");
  const close = s.lastIndexOf("}");
  if (open === -1 || close === -1 || close < open) return s;
  return s.slice(open, close + 1);
}

function normalizeImportedStorySchemaVersion(parsed) {
  const v = parsed.schemaVersion;
  if (v == null) return 1;
  if (v === 1 || v === 2 || v === 3) return v;
  throw new Error(
    "Invalid story JSON: unsupported schemaVersion (expected 1, 2, or 3; omit the field for legacy imports).",
  );
}

/**
 * Resolves catalog structure for import (not used when `alteredStructure` is present).
 * Versions 1–2: match by root `structure` display name (legacy). Version 3: `structureId` only.
 */
function resolveStoryImportCatalogStructure(parsed, storySchemaVersion) {
  if (storySchemaVersion === STORY_JSON_SCHEMA_LATEST) {
    const sid = typeof parsed.structureId === "string" ? parsed.structureId.trim() : "";
    if (!sid) {
      throw new Error(
        'Invalid story JSON: schemaVersion 3 requires a non-empty "structureId" matching a structure installed in this browser.',
      );
    }
    const entry = getAllStructures()[sid];
    if (!entry) {
      throw new Error(
        `No structure with id "${sid}" is installed in this browser. If you expected a built-in framework, use Reset demos on the dashboard to restore defaults, or import the matching custom structures file first.`,
      );
    }
    return entry;
  }
  const structureEntry = getCatalogStructureList().find((item) => item.name === parsed.structure);
  return structureEntry || BUILTIN_STRUCTURES.hero_journey;
}

function parseStructureTemplatesPack(rawText) {
  const parsed = JSON.parse(stripLeadingTrailingOutsideJsonObject(rawText));
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid structures file.");
  }
  const exportType = parsed.exportType;
  const isLegacy = exportType === STRUCTURES_PACK_EXPORT_TYPE_LEGACY;
  const isUnified = exportType === STRUCTURES_PACK_EXPORT_TYPE;
  if (!isLegacy && !isUnified) {
    throw new Error(
      'Invalid structures file: unsupported exportType (expected "structurer.structure" or legacy "structurer.custom-structures").',
    );
  }
  const schemaVersion = parsed.schemaVersion;
  if (schemaVersion != null && schemaVersion !== 1 && schemaVersion !== 2) {
    throw new Error("Invalid structures file: unsupported schemaVersion (expected 1 or 2).");
  }
  if (!Array.isArray(parsed.structures) || parsed.structures.length === 0) {
    throw new Error("Invalid structures file: structures must be a non-empty array.");
  }
  const builtInIds = new Set(Object.keys(BUILTIN_STRUCTURES));
  const localByUid = new Map(customStructures.map((item) => [item.uid, item]));
  const localById = new Map(customStructures.map((item) => [item.id, item]));
  const seenIds = new Set();
  const seenUids = new Set();
  const seenFingerprints = new Set();
  const fileLabel = isLegacy ? "Invalid custom structures file" : "Invalid structures file";

  const normalized = parsed.structures.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`${fileLabel}: entry #${index + 1} must be an object.`);
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
      throw new Error(`${fileLabel}: entry #${index + 1} is missing required fields.`);
    }
    if (isLegacy) {
      if (!/^custom_[a-z0-9_]+$/.test(id)) {
        throw new Error(`${fileLabel}: entry #${index + 1} has invalid id "${id}".`);
      }
      if (builtInIds.has(id)) {
        throw new Error(`${fileLabel}: id "${id}" conflicts with a built-in structure.`);
      }
    } else if (!/^[a-z][a-z0-9_]*$/.test(id)) {
      throw new Error(
        `${fileLabel}: entry #${index + 1} has invalid id "${id}" (use lowercase letters, digits, underscores only).`,
      );
    }
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(uid)) {
      throw new Error(`${fileLabel}: entry #${index + 1} has invalid uid "${uid}".`);
    }
    if (phases.length < 2 || phases.some((phase) => !phase)) {
      throw new Error(`${fileLabel}: entry #${index + 1} must include at least 2 non-empty phases.`);
    }
    if (seenIds.has(id)) {
      throw new Error(`${fileLabel}: duplicate id "${id}".`);
    }
    if (seenUids.has(uid)) {
      throw new Error(`${fileLabel}: duplicate uid "${uid}".`);
    }
    const fingerprint = normalizeStructureFingerprint(name, phases);
    if (seenFingerprints.has(fingerprint)) {
      throw new Error(`${fileLabel}: duplicate structure content for "${name}".`);
    }
    seenIds.add(id);
    seenUids.add(uid);
    seenFingerprints.add(fingerprint);

    const localBySameId = localById.get(id);
    if (localBySameId && localBySameId.uid !== uid) {
      throw new Error(`${fileLabel}: id "${id}" conflicts with another local structure.`);
    }
    const localBySameUid = localByUid.get(uid);
    if (localBySameUid && localBySameUid.id !== id) {
      throw new Error(`${fileLabel}: uid "${uid}" conflicts with local id mapping.`);
    }
    const entry = { id, uid, name, phases, updatedAt };
    if (Object.prototype.hasOwnProperty.call(item, "description")) {
      if (typeof item.description !== "string") {
        throw new Error(`${fileLabel}: entry #${index + 1} description must be a string when present.`);
      }
      const descRes = validateStructureDescription(item.description);
      if (!descRes.ok) {
        throw new Error(`${fileLabel}: entry #${index + 1}: ${descRes.error}`);
      }
      entry.description = descRes.value;
    }
    if (Object.prototype.hasOwnProperty.call(item, "author")) {
      if (typeof item.author !== "string") {
        throw new Error(`${fileLabel}: entry #${index + 1} author must be a string when present.`);
      }
      const authRes = validateStructureAuthor(item.author);
      if (!authRes.ok) {
        throw new Error(`${fileLabel}: entry #${index + 1}: ${authRes.error}`);
      }
      entry.author = authRes.value;
    }
    return entry;
  });

  return { exportType, structures: normalized };
}

function importCustomStructuresFromText(rawText) {
  const { structures: imported } = parseStructureTemplatesPack(rawText);
  const builtInIdSet = new Set(Object.keys(BUILTIN_STRUCTURES));
  const localByUid = new Map(customStructures.map((item) => [item.uid, item]));
  const localByFingerprint = new Map(
    customStructures.map((item) => [normalizeStructureFingerprint(item.name, item.phases), item]),
  );

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let skippedBuiltinCount = 0;
  const importTimestamp = Date.now();

  imported.forEach((incoming) => {
    if (builtInIdSet.has(incoming.id)) {
      skippedBuiltinCount += 1;
      skippedCount += 1;
      return;
    }
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

  return {
    createdCount,
    updatedCount,
    skippedCount,
    skippedBuiltinCount,
    total: imported.length,
  };
}

function getCustomStructureImportSuccessMessage(result) {
  const changedCount = result.createdCount + result.updatedCount;
  const skippedBuiltin = result.skippedBuiltinCount || 0;
  if (changedCount > 0 && result.skippedCount === 0) {
    return "Import completed. The structure is now available in the Active structures list.";
  }
  if (changedCount > 0 && result.skippedCount > 0) {
    return "Import completed. Some structures were added/updated, while others were already present and were skipped.";
  }
  if (
    changedCount === 0 &&
    result.skippedCount > 0 &&
    skippedBuiltin > 0 &&
    skippedBuiltin === result.total
  ) {
    return "Nothing was imported: every entry uses an id that is already a built-in framework in this app.";
  }
  return "Nothing changed. This structure is already present and up to date.";
}

function getCustomStructureImportErrorMessage(error) {
  const message = error instanceof Error ? error.message : "";
  if (!message) {
    return "Import failed. The file appears to be invalid or corrupted.";
  }
  if (message.startsWith("Invalid custom structures file") || message.startsWith("Invalid structures file")) {
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
      sharedStoryBookmarks,
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
  const nextSharedStoryBookmarks = Array.isArray(data.sharedStoryBookmarks) ? data.sharedStoryBookmarks : [];

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
    SHARED_BOOKMARKS_KEY,
    PHASE_HELP_STATE_KEY,
    EDITOR_QUICK_HELP_DISMISSED_KEY,
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
  saveJsonItem(SHARED_BOOKMARKS_KEY, nextSharedStoryBookmarks);

  window.location.assign(`#${HOME_ROUTE}`);
  return parsed;
}

function closeBoardActionsModal() {
  boardActionsModalOverlay.classList.add("hidden");
  boardActionsModalBoardId = null;
  if (boardActionsSectionsEl) {
    boardActionsSectionsEl.querySelectorAll("details.dashboard-actions-section").forEach((details) => {
      details.open = false;
    });
  }
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
    const altered = Boolean(board && boardUsesOwnAlteredStructure(board));
    modalResetPhaseOrderBtn.disabled = !canReset;
    if (!canReset) {
      modalResetPhaseOrderBtn.title = altered
        ? "Phase order already matches the structure"
        : "Phase order matches the template. Use Story actions → Edit the structure to create an altered copy, then you can reorder columns by dragging.";
    } else {
      modalResetPhaseOrderBtn.title = "Restore phase columns to the order defined by the structure template";
    }
  }
  if (modalEditStoryStructureBtn) {
    const altered = Boolean(board && boardUsesOwnAlteredStructure(board));
    modalEditStoryStructureBtn.disabled = false;
    modalEditStoryStructureBtn.title = altered
      ? "Add phases or remove empty ones for this story's template only."
      : "Creates a story-specific structure copy, then opens the structure editor.";
  }
  if (boardActionsDemoSectionEl) {
    const isDemo = Boolean(board && isDemoBoard(board));
    boardActionsDemoSectionEl.hidden = !isDemo;
  }
  if (modalResetDemoBoardBtn) {
    const isDemo = Boolean(board && isDemoBoard(board));
    modalResetDemoBoardBtn.disabled = false;
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
  const parsed = JSON.parse(stripLeadingTrailingOutsideJsonObject(rawText));
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.notes)) {
    throw new Error("Invalid story JSON format.");
  }

  const storySchemaVersion = normalizeImportedStorySchemaVersion(parsed);

  const normalizeKey = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

  const existingByUid =
    typeof parsed.uid === "string" && parsed.uid
      ? boards.find((board) => board.uid === parsed.uid)
      : null;
  const resolvedBoardUid =
    typeof parsed.uid === "string" && parsed.uid ? parsed.uid : generateUniqueUid();

  let structure;
  if (existingByUid) {
    if (parsed.alteredStructure && typeof parsed.alteredStructure === "object" && Array.isArray(parsed.alteredStructure.phases)) {
      const cfg = getStructureConfig(existingByUid.structureId);
      if (!isAlteredStructureEntry(cfg) || cfg.ownerBoardUid !== existingByUid.uid) {
        throw new Error(
          `Cannot merge story "${existingByUid.title}": this import includes an altered structure that does not match this story on this device.`,
        );
      }
      const importedPhases = normalizePhasesFromAlteredStoryImport(parsed.alteredStructure.phases);
      const idx = customStructures.findIndex((s) => s.id === cfg.id);
      if (idx < 0) {
        throw new Error(`Cannot merge story "${existingByUid.title}": altered structure is missing locally.`);
      }
      customStructures[idx].phases = importedPhases;
      if (Object.prototype.hasOwnProperty.call(parsed.alteredStructure, "description")) {
        if (typeof parsed.alteredStructure.description === "string" && parsed.alteredStructure.description.trim()) {
          customStructures[idx].description = parsed.alteredStructure.description.trim();
        } else {
          delete customStructures[idx].description;
        }
      }
      if (Object.prototype.hasOwnProperty.call(parsed.alteredStructure, "author")) {
        if (typeof parsed.alteredStructure.author === "string" && parsed.alteredStructure.author.trim()) {
          customStructures[idx].author = parsed.alteredStructure.author.trim();
        } else {
          delete customStructures[idx].author;
        }
      }
      const importName =
        typeof parsed.alteredStructure.name === "string" && parsed.alteredStructure.name.trim()
          ? parsed.alteredStructure.name.trim()
          : typeof parsed.structure === "string" && parsed.structure.trim()
            ? parsed.structure.trim()
            : cfg.name;
      customStructures[idx].name = importName;
      existingByUid.structure = importName;
      if (Number.isFinite(parsed.alteredStructure.updatedAt)) {
        customStructures[idx].updatedAt = parsed.alteredStructure.updatedAt;
      }
      saveCustomStructures();
      structure = getStructureConfig(existingByUid.structureId);
    } else if (boardUsesOwnAlteredStructure(existingByUid)) {
      structure = getStructureConfig(existingByUid.structureId);
    } else {
      structure = resolveStoryImportCatalogStructure(parsed, storySchemaVersion);
    }
  } else if (
    parsed.alteredStructure &&
    typeof parsed.alteredStructure === "object" &&
    Array.isArray(parsed.alteredStructure.phases)
  ) {
    structure = createAlteredStructureForImportedStory(parsed.alteredStructure, resolvedBoardUid, parsed.structure);
  } else {
    structure = resolveStoryImportCatalogStructure(parsed, storySchemaVersion);
  }

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

  const mergeTrustsImportedAlteredLayout =
    Boolean(existingByUid) &&
    Boolean(
      parsed.alteredStructure &&
        typeof parsed.alteredStructure === "object" &&
        Array.isArray(parsed.alteredStructure.phases),
    ) &&
    boardUsesOwnAlteredStructure(existingByUid);

  if (existingByUid) {
    if (mergeTrustsImportedAlteredLayout) {
      existingByUid.phaseUids = [...normalizedImportedPhaseUids];
      existingByUid.phaseOrder = [...importedPhaseOrder];
    }
    ensureBoardPhaseUids(existingByUid);
    normalizeBoardPhaseComments(existingByUid);
    const existingPhaseOrder = getBoardPhaseOrder(existingByUid);
    if (existingByUid.structureId !== structure.id) {
      throw new Error(
        `Cannot merge story "${existingByUid.title}": structure mismatch (${existingByUid.structure} vs ${structure.name}).`,
      );
    }
    if (!mergeTrustsImportedAlteredLayout) {
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
    }

    const maxNoteColumn = Math.max(0, phaseCount - 1);
    const clampNoteColumn = (col) => Math.max(0, Math.min(Number.isInteger(col) ? col : 0, maxNoteColumn));

    const localByUid = new Map(existingByUid.notes.map((note) => [note.uid, note]));
    notes.forEach((importedNote) => {
      const localNote = localByUid.get(importedNote.uid);
      if (!localNote) {
        const nextId =
          existingByUid.notes.reduce((max, note) => Math.max(max, Number(note.id) || 0), 0) + 1;
        existingByUid.notes.push({
          ...importedNote,
          id: nextId,
          column: clampNoteColumn(importedNote.column),
        });
        return;
      }
      if ((importedNote.updatedAt || 0) > (localNote.updatedAt || 0)) {
        localNote.kind = importedNote.kind;
        localNote.column = clampNoteColumn(importedNote.column);
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

    if (mergeTrustsImportedAlteredLayout) {
      const keep = new Set(existingByUid.phaseUids);
      Object.keys(existingByUid.phaseComments).forEach((uid) => {
        if (!keep.has(uid)) delete existingByUid.phaseComments[uid];
      });
    }

    if (importedBoardUpdatedAt > (existingByUid.updatedAt || 0)) {
      existingByUid.title = title;
      existingByUid.slug = ensureUniqueSlug(slugifyTitle(title), existingByUid.id);
      existingByUid.updatedAt = importedBoardUpdatedAt;
    } else {
      existingByUid.updatedAt = Math.max(existingByUid.updatedAt || 0, importedBoardUpdatedAt);
    }
    if (Object.prototype.hasOwnProperty.call(parsed, "aiAnalysisImport")) {
      if (parsed.aiAnalysisImport === true) {
        existingByUid.aiAnalysisImport = true;
      } else {
        delete existingByUid.aiAnalysisImport;
      }
    }
    if (Object.prototype.hasOwnProperty.call(parsed, "adaptiveNoteHeights")) {
      if (parsed.adaptiveNoteHeights === true) {
        existingByUid.adaptiveNoteHeights = true;
      } else {
        delete existingByUid.adaptiveNoteHeights;
      }
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
    return { boardId: existingByUid.id, merged: true };
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
    uid: resolvedBoardUid,
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
  if (parsed.aiAnalysisImport === true) {
    newBoard.aiAnalysisImport = true;
  }
  if (parsed.adaptiveNoteHeights === true) {
    newBoard.adaptiveNoteHeights = true;
  }
  normalizeOrders(newBoard.notes, newBoard.structureId);
  boards.push(newBoard);
  saveBoards();
  renderHome();
  return { boardId: newBoard.id, merged: false };
}

async function tryImportBoardFromJsonWithFeedback(rawText, options = {}) {
  const { onSuccess } = options;
  try {
    const result = importBoardFromJson(rawText);
    closeDashboardImportModal();
    closeDashboardImportStructuresModal();
    closeDashboardActionsModal();
    closeDashboardImportStoryPasteModal();
    await appAlert("Story imported successfully.");
    if (typeof onSuccess === "function") {
      onSuccess(result);
    }
  } catch (error) {
    if (error instanceof Error && error.code === "PHASE_ORDER_CONFLICT" && error.phaseOrderConflict) {
      openPhaseOrderConflictModal(error.phaseOrderConflict);
    } else {
      await appAlert(
        error instanceof Error ? error.message : "Import failed. Please use a valid Structurer story JSON.",
      );
    }
  }
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

function openAiAnalysisPrompt(replaceRoute = false) {
  inlineTitleEdit.flush();
  navigation.openAiAnalysisPrompt(replaceRoute);
  refreshAiAnalysisPromptPage();
}

function openGroup(groupId, replaceRoute = false) {
  inlineTitleEdit.flush();
  navigation.openGroup(groupId, replaceRoute);
}

function syncRouteToState(replaceRoute = true) {
  navigation.syncRouteToState(replaceRoute);
  if (aiAnalysisPromptView && !aiAnalysisPromptView.classList.contains("hidden")) {
    refreshAiAnalysisPromptPage();
  }
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
  if (phaseBreadcrumbCurrentEl) {
    phaseBreadcrumbCurrentEl.textContent = phaseName;
  }
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
  canReorderPhases: () => {
    const b = getCurrentBoard();
    return Boolean(b && boardUsesOwnAlteredStructure(b));
  },
});

createBoardForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = boardTitleInput.value.trim();
  if (!title) return;
  let newBoard = null;
  if (boardStructureSelect.value === NO_STRUCTURE_OPTION_VALUE) {
    const payload = await promptCreateStoryFromScratch(title);
    if (!payload) return;
    newBoard = createBoardWithInitialAlteredStructure(payload.title, payload.phases, payload.structureName);
  } else {
    newBoard = createBoard(title, boardStructureSelect.value);
  }
  boardTitleInput.value = "";
  renderStructureOptions();
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
  renderHome();
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
  if (boardCard.dataset.role === "dashboard-ai-prompt-cta") {
    openAiAnalysisPrompt();
    return;
  }
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
    if (boardCard.dataset.role === "dashboard-ai-prompt-cta") {
      openAiAnalysisPrompt();
      return;
    }
    openBoard(boardCard.dataset.boardId);
  }
});

if (sharedBookmarksList) {
  sharedBookmarksList.addEventListener("click", async (event) => {
    const card = event.target.closest('[data-role="shared-bookmark-card"]');
    if (!card) return;
    const bookmarkId = card.dataset.sharedBookmarkId;
    if (!bookmarkId) return;
    const bookmark = sharedStoryBookmarks.find((item) => item.id === bookmarkId);
    if (!bookmark) return;
    const removeBtn = event.target.closest('[data-role="remove-shared-bookmark"]');
    if (removeBtn) {
      const confirmed = await appAlert(`Remove shared bookmark "${bookmark.title}"?`, { confirm: true });
      if (!confirmed) return;
      sharedStoryBookmarks = sharedStoryBookmarks.filter((item) => item.id !== bookmarkId);
      saveSharedBookmarks();
      renderHome();
      return;
    }
    openSharedStoryRouteFromSourceUrl(bookmark.url);
  });

  sharedBookmarksList.addEventListener("keydown", (event) => {
    if (event.target.closest("button")) return;
    const card = event.target.closest('[data-role="shared-bookmark-card"]');
    if (!card) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const bookmarkId = card.dataset.sharedBookmarkId;
      const bookmark = sharedStoryBookmarks.find((item) => item.id === bookmarkId);
      if (!bookmark) return;
      openSharedStoryRouteFromSourceUrl(bookmark.url);
    }
  });
}

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

if (notFoundGenericDashboardBtn) {
  notFoundGenericDashboardBtn.addEventListener("click", () => {
    openHome();
  });
}

if (notFoundGenericLandingBtn) {
  notFoundGenericLandingBtn.addEventListener("click", () => {
    openLanding();
  });
}

if (notFoundSharingDashboardBtn) {
  notFoundSharingDashboardBtn.addEventListener("click", () => {
    openHome();
  });
}

if (notFoundSharingHelpBtn) {
  notFoundSharingHelpBtn.addEventListener("click", () => {
    openHelp();
  });
}

if (notFoundSharingLandingBtn) {
  notFoundSharingLandingBtn.addEventListener("click", () => {
    openLanding();
  });
}

if (goHomeFromSharedBtn) {
  goHomeFromSharedBtn.addEventListener("click", () => {
    openLanding();
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

if (dismissEditorQuickHelpBtn && editorQuickHelpEl) {
  dismissEditorQuickHelpBtn.addEventListener("click", () => {
    saveJsonItem(EDITOR_QUICK_HELP_DISMISSED_KEY, true);
    editorQuickHelpEl.classList.add("hidden");
  });
}

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
    await tryImportBoardFromJsonWithFeedback(text);
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
  phaseCommentInput.addEventListener("focus", async () => {
    const alreadyShown = loadJsonItem(PHASE_COMMENTS_LOCAL_NOTICE_SHOWN_KEY, false) === true;
    if (alreadyShown) return;
    saveJsonItem(PHASE_COMMENTS_LOCAL_NOTICE_SHOWN_KEY, true);
    await appAlert(
      "Phase comments are local to this browser/computer only. They are not sent to other users unless you explicitly export and share the story JSON.",
    );
  });
}

if (phaseCommentForm) {
  phaseCommentForm.addEventListener("submit", async (event) => {
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
  modalExportBoardBtn.addEventListener("click", async () => {
    const board = boards.find((item) => item.id === boardActionsModalBoardId);
    if (!board) return;
    const exportOptions = await promptStoryExportOptionsModal({
      board,
      boardHasAnyPhaseComments,
      appDialog,
    });
    if (!exportOptions) return;
    downloadBoard(board, exportOptions);
    closeBoardActionsModal();
  });
}

if (modalChangeBoardSlugBtn) {
  modalChangeBoardSlugBtn.addEventListener("click", async () => {
    const board = boards.find((item) => item.id === boardActionsModalBoardId);
    if (!board) return;
    const result = await promptStorySlugOptionsModal({
      board,
      appDialog,
      slugifyTitle,
      escapeHtml,
    });
    if (!result) return;
    const nextSlug = ensureUniqueSlug(result.baseSlug, board.id);
    const currentSlug = typeof board.slug === "string" ? board.slug.trim() : "";
    if (nextSlug === currentSlug) {
      closeBoardActionsModal();
      return;
    }
    board.slug = nextSlug;
    touchBoard(board);
    closeBoardActionsModal();
    if (nextSlug !== result.baseSlug) {
      await appAlert(`That URL was already used. Saved as "${nextSlug}" instead.`);
    }
    if (currentBoardId === board.id) {
      openBoard(board.id, true, boardBackGroupId);
      return;
    }
    renderHome();
    if (currentGroupId && groups.some((g) => g.id === currentGroupId && g.boardIds.includes(board.id))) {
      renderGroup();
    }
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
    const structureEl = event.target.closest('[data-role="structure-name-dblclick"]');
    if (structureEl && currentBoardId) {
      event.preventDefault();
      inlineTitleEdit.beginStructure(currentBoardId);
      return;
    }
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

if (modalDefineCustomArchetypeBtn) {
  modalDefineCustomArchetypeBtn.addEventListener("click", () => {
    closeBoardActionsModal();
    promptCustomArchetypeName().then((name) => {
      if (!name) return;
      const created = createCustomArchetype(name);
      if (!created) return;
      if (currentBoardId) renderEditor();
      renderHome();
    });
  });
}

if (modalDefineCustomNoteTypeBtn) {
  modalDefineCustomNoteTypeBtn.addEventListener("click", () => {
    closeBoardActionsModal();
    promptCustomNoteType().then((result) => {
      if (!result) return;
      const createdType = createCustomNoteType(result.label, result.color);
      if (!createdType) return;
      if (currentBoardId) renderEditor();
      renderHome();
    });
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

if (modalEditStoryStructureBtn) {
  modalEditStoryStructureBtn.addEventListener("click", async () => {
    const boardId = boardActionsModalBoardId;
    if (!boardId) return;
    const board = boards.find((item) => item.id == boardId);
    if (!board) return;
    closeBoardActionsModal();
    if (!boardUsesOwnAlteredStructure(board)) {
      const agreed = await showAlteredStructureIntroDialog();
      if (!agreed) return;
      const result = forkCurrentBoardToAlteredStructure(board);
      if (!result.ok) {
        if (result.reason === "already-altered") {
          await appAlert("This story already uses an altered structure. Rename it below the story title (double-click).");
        }
        return;
      }
      renderStructureOptions();
      if (currentBoardId === boardId) {
        renderEditor();
      }
      renderHome();
    }
    openEditStoryStructureModal(boardId);
  });
}

if (closeEditStoryStructureModalBtn) {
  closeEditStoryStructureModalBtn.addEventListener("click", () => {
    closeEditStoryStructureModal();
  });
}

if (editStoryStructureModalOverlay) {
  editStoryStructureModalOverlay.addEventListener("click", (event) => {
    if (event.target === editStoryStructureModalOverlay) {
      closeEditStoryStructureModal();
    }
  });
}

if (editAlteredStructureAddRowBtn && editAlteredStructurePhasesListEl) {
  editAlteredStructureAddRowBtn.addEventListener("click", () => {
    const boardId = editStoryStructureModalBoardId;
    if (!boardId) return;
    const board = boards.find((item) => item.id == boardId);
    if (!board) return;
    const states = collectAlteredStructurePhaseRowStatesFromDOM();
    states.push({ originIndex: null, title: "", description: "" });
    renderAlteredStructureEditorRows(board, states);
    const inputs = editAlteredStructurePhasesListEl.querySelectorAll('[data-role="phase-input"]');
    const last = inputs[inputs.length - 1];
    if (last) last.focus();
  });
}

if (editAlteredStructurePhasesListEl) {
  editAlteredStructurePhasesListEl.addEventListener("click", (event) => {
    const removeButton = event.target.closest('button[data-role="remove-phase-row"]');
    if (!removeButton || removeButton.disabled) return;
    const boardId = editStoryStructureModalBoardId;
    if (!boardId) return;
    const board = boards.find((item) => item.id == boardId);
    if (!board) return;
    const row = removeButton.closest(".structure-phase-row");
    if (!row || !editAlteredStructurePhasesListEl.contains(row)) return;
    const rows = editAlteredStructurePhasesListEl.querySelectorAll(".structure-phase-row");
    if (rows.length <= 2) return;
    row.remove();
    const states = collectAlteredStructurePhaseRowStatesFromDOM();
    renderAlteredStructureEditorRows(board, states);
  });
}

if (editAlteredStructureForm) {
  editAlteredStructureForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const boardId = editStoryStructureModalBoardId;
    if (!boardId) return;
    const result = await applyAlteredStructureEditorSave(boardId);
    if (!result.ok) return;
    renderStructureOptions();
    if (currentBoardId === boardId) {
      renderEditor();
    }
    renderHome();
    closeEditStoryStructureModal();
    await appAlert("Structure updated.");
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
  const doomed = boards.find((item) => item.id === deletedId);
  if (doomed?.uid) {
    removeAlteredStructuresOwnedByBoardUid(doomed.uid);
  }
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
  dashboardActionsModal.close();
}

function initBoardActionsExclusiveAccordion() {
  if (!boardActionsSectionsEl) return;
  boardActionsSectionsEl.addEventListener("toggle", (event) => {
    const details = event.target;
    if (!(details instanceof HTMLDetailsElement) || !details.matches(".dashboard-actions-section")) return;
    if (!details.open) return;
    boardActionsSectionsEl.querySelectorAll("details.dashboard-actions-section").forEach((other) => {
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
  if (structurePreviewModalExportBtn) {
    structurePreviewModalExportBtn.addEventListener("click", () => {
      if (structurePreviewExportTargetId) {
        exportStructurePreviewTemplate(structurePreviewExportTargetId);
      }
    });
  }
  if (structurePreviewModalOverlay) {
    structurePreviewModalOverlay.addEventListener("click", (event) => {
      if (event.target === structurePreviewModalOverlay) closeStructurePreviewModal();
    });
  }
}

function closeDashboardCreateStoryModal() {
  dashboardFlowModals.closeCreateStory();
}

function closeDashboardCreateStructureModal() {
  dashboardFlowModals.closeCreateStructure();
}

function closeStructurePreviewModal() {
  if (!structurePreviewModalOverlay) return;
  structurePreviewExportTargetId = null;
  if (structurePreviewModalExportBtn) {
    structurePreviewModalExportBtn.hidden = true;
  }
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
  if (structurePreviewModalExportBtn) {
    const isAltered = isAlteredStructureEntry(structure);
    structurePreviewExportTargetId = isAltered ? null : structureId;
    structurePreviewModalExportBtn.hidden = isAltered;
  }
  structurePreviewModalOverlay.classList.remove("hidden");
}

function closeDashboardImportModal() {
  dashboardFlowModals.closeImport();
}

function closeDashboardImportStructuresModal() {
  dashboardFlowModals.closeImportStructures();
}

function openDashboardImportStructuresModal() {
  dashboardFlowModals.openImportStructures();
}

function closeDashboardImportStoryPasteModal() {
  dashboardFlowModals.closeImportStoryPaste();
}

function openDashboardImportStoryPasteModal() {
  dashboardFlowModals.openImportStoryPaste();
}

function syncAiPromptAnalysisLanguageCustomVisibility() {
  if (!aiPromptAnalysisLangCustomWrap || !aiPromptAnalysisLangSelect) return;
  aiPromptAnalysisLangCustomWrap.classList.toggle("hidden", aiPromptAnalysisLangSelect.value !== "other");
}

function getAiPromptAnalysisLanguage() {
  if (!aiPromptAnalysisLangSelect) return "English";
  if (aiPromptAnalysisLangSelect.value === "other") {
    const custom = aiPromptAnalysisLangCustomInput ? aiPromptAnalysisLangCustomInput.value.trim() : "";
    return custom || "English";
  }
  return aiPromptAnalysisLangSelect.value;
}

function refreshAiAnalysisPromptPage() {
  if (!aiPromptStructureSelect || !aiPromptOutputTextarea) return;
  const catalog = getCatalogStructureList();
  const previous = aiPromptStructureSelect.value;
  aiPromptStructureSelect.innerHTML = catalog
    .map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`)
    .join("");
  if (catalog.some((s) => s.id === previous)) {
    aiPromptStructureSelect.value = previous;
  }
  syncAiPromptOutputFromForm();
}

function syncAiPromptOutputFromForm() {
  if (!aiPromptStructureSelect || !aiPromptOutputTextarea) return;
  syncAiPromptAnalysisLanguageCustomVisibility();
  const id = aiPromptStructureSelect.value;
  const entry = getCatalogStructureList().find((s) => s.id === id) || getCatalogStructureList()[0];
  if (!entry) {
    aiPromptOutputTextarea.value = "";
    return;
  }
  const phaseTitles = (entry.phases || []).map((p) => formatPhaseTitle(p));
  if (phaseTitles.length === 0) {
    aiPromptOutputTextarea.value = "This structure has no phases.";
    return;
  }
  const workTitle = aiPromptWorkTitleInput ? aiPromptWorkTitleInput.value.trim() : "";
  const medium = aiPromptMediumSelect ? aiPromptMediumSelect.value : "unspecified";
  const analysisLanguage = getAiPromptAnalysisLanguage();
  const noteKinds = BUILTIN_NOTE_TYPES.map((t) => ({ id: t.id, label: t.label }));
  const archetypes = BUILTIN_ARCHETYPES.map((a) => ({ id: a.id, label: a.label, icon: a.icon }));
  aiPromptOutputTextarea.value = buildLlmStoryAnalysisPrompt({
    structureId: entry.id,
    structureName: entry.name,
    workTitle: workTitle || "(work title — fill in above)",
    medium,
    analysisLanguage,
    phaseTitles,
    noteKinds,
    archetypes,
  });
}

function closeDashboardCreateSeriesModal() {
  dashboardFlowModals.closeCreateSeries();
}

function closeDashboardImportStructuresPasteModal() {
  dashboardFlowModals.closeImportStructuresPaste();
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
  closeDashboardImportStructuresModal();
  closeDashboardImportStoryPasteModal();
  closeDashboardImportModal();
  closeDashboardCreateSeriesModal();
  closeDeleteStoryModal();
  populateRemoveStructuresModalList();
  dashboardRemoveStructuresModalOverlay.classList.remove("hidden");
}

function openDashboardActionsModal() {
  dismissAllAppAlerts();
  closeOptionsMenu();
  closeDashboardCreateStoryModal();
  closeDashboardCreateStructureModal();
  closeDashboardImportStructuresPasteModal();
  closeDashboardImportStructuresModal();
  closeDashboardImportStoryPasteModal();
  closeDashboardImportModal();
  closeDashboardCreateSeriesModal();
  closeDeleteStoryModal();
  closeDashboardRemoveStructuresModal();
  dashboardActionsModal.open();
}

function openDashboardCreateStoryModal() {
  dashboardFlowModals.openCreateStory();
}

function openDashboardCreateStructureModal() {
  dashboardFlowModals.openCreateStructure();
}

function openDashboardImportModal() {
  dashboardFlowModals.openImport();
}

function openDashboardCreateSeriesModal() {
  dashboardFlowModals.openCreateSeries();
}

function openDashboardImportStructuresPasteModal() {
  dashboardFlowModals.openImportStructuresPaste();
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

if (openNoteHeightModeMenuBtn) {
  openNoteHeightModeMenuBtn.addEventListener("click", () => {
    closeOptionsMenu();
    openNoteHeightModeModal();
  });
}

if (noteHeightModeSwitchBtn) {
  noteHeightModeSwitchBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const board = getCurrentBoard();
    if (!board) return;
    if (board.adaptiveNoteHeights === true) {
      delete board.adaptiveNoteHeights;
    } else {
      board.adaptiveNoteHeights = true;
    }
    touchBoard(board);
    renderEditor();
    fillNoteHeightModeModal();
    closeNoteHeightModeModal();
    requestAnimationFrame(() => {
      closeNoteHeightModeModal();
    });
  });
}

if (closeNoteHeightModeModalBtn) {
  closeNoteHeightModeModalBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeNoteHeightModeModal();
  });
}

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

if (openViewSharedStoryActionBtn) {
  openViewSharedStoryActionBtn.addEventListener("click", async () => {
    const result = await appDialog({
      title: "View shared story from URL",
      message: "Paste a public URL to a Structurer story JSON file.",
      confirmLabel: "View",
      render(root, api) {
        root.innerHTML = `
          <fieldset class="app-dialog-fieldset">
            <legend class="app-dialog-legend">Story JSON URL</legend>
            <input
              type="url"
              id="structurer-shared-story-url-input"
              class="app-dialog-text-input"
              maxlength="2048"
              autocomplete="off"
              placeholder="https://..."
              aria-label="Story JSON URL"
            />
          </fieldset>
          <p class="subtitle">The file must be publicly reachable and allow browser fetches (CORS).</p>
        `;
        const input = root.querySelector("#structurer-shared-story-url-input");
        const sync = () => api.setConfirmEnabled(Boolean(ensureSafeSharedSourceUrl(input.value)));
        input.addEventListener("input", sync);
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (ensureSafeSharedSourceUrl(input.value)) focusAppAlertConfirmIfEnabled();
          }
        });
        sync();
        window.setTimeout(() => input.focus(), 0);
        return () => ensureSafeSharedSourceUrl(input.value) || null;
      },
    });
    if (!result) return;
    try {
      await loadSharedStoryFromUrlForPreview(result);
    } catch (error) {
      await appAlert(error instanceof Error ? error.message : "Could not validate the shared story URL.");
      return;
    }
    closeDashboardActionsModal();
    openSharedStoryRouteFromSourceUrl(result);
  });
}

if (openCreateSeriesActionBtn) {
  openCreateSeriesActionBtn.addEventListener("click", () => {
    openDashboardCreateSeriesModal();
  });
}

if (closeDashboardImportModalBtn) {
  closeDashboardImportModalBtn.addEventListener("click", () => {
    closeDashboardImportModal();
  });
}

if (closeDashboardImportStructuresModalBtn) {
  closeDashboardImportStructuresModalBtn.addEventListener("click", () => {
    closeDashboardImportStructuresModal();
  });
}

if (openImportStructuresPasteFromModalBtn) {
  openImportStructuresPasteFromModalBtn.addEventListener("click", () => {
    openDashboardImportStructuresPasteModal();
  });
}

if (openImportStoryPasteFromModalBtn) {
  openImportStoryPasteFromModalBtn.addEventListener("click", () => {
    openDashboardImportStoryPasteModal();
  });
}

if (closeDashboardImportStoryPasteModalBtn) {
  closeDashboardImportStoryPasteModalBtn.addEventListener("click", () => {
    closeDashboardImportStoryPasteModal();
  });
}

if (importStoryPasteForm && importStoryPasteText) {
  importStoryPasteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const rawText = importStoryPasteText.value.trim();
    if (!rawText) return;
    const maxChars = 4 * 1024 * 1024;
    if (rawText.length > maxChars) {
      await appAlert("Pasted JSON is too large. Please use a smaller payload or file import.");
      return;
    }
    await tryImportBoardFromJsonWithFeedback(rawText);
  });
}

if (goHelpFromAiAnalysisPromptBtn) {
  goHelpFromAiAnalysisPromptBtn.addEventListener("click", () => {
    openHelp();
  });
}

if (goDashboardFromAiAnalysisPromptBtn) {
  goDashboardFromAiAnalysisPromptBtn.addEventListener("click", () => {
    openHome();
  });
}

if (goAiAnalysisPromptFromHelpBtn) {
  goAiAnalysisPromptFromHelpBtn.addEventListener("click", () => {
    openAiAnalysisPrompt();
  });
}

if (aiAnalysisPromptForm) {
  aiAnalysisPromptForm.addEventListener("input", () => {
    syncAiPromptOutputFromForm();
  });
  aiAnalysisPromptForm.addEventListener("change", () => {
    syncAiPromptOutputFromForm();
  });
}

if (copyAiPromptBtn && aiPromptOutputTextarea) {
  copyAiPromptBtn.addEventListener("click", async () => {
    const text = aiPromptOutputTextarea.value;
    if (!text.trim()) {
      await appAlert("Nothing to copy yet. Fill in the work title and pick a structure.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      await appAlert("Prompt copied to clipboard.");
    } catch {
      aiPromptOutputTextarea.focus();
      aiPromptOutputTextarea.select();
      await appAlert("Could not copy automatically. The prompt is selected — press Ctrl/Cmd+C to copy.");
    }
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

if (dashboardImportStructuresModalOverlay) {
  dashboardImportStructuresModalOverlay.addEventListener("click", (event) => {
    if (event.target === dashboardImportStructuresModalOverlay) closeDashboardImportStructuresModal();
  });
}

if (dashboardImportStoryPasteModalOverlay) {
  dashboardImportStoryPasteModalOverlay.addEventListener("click", (event) => {
    if (event.target === dashboardImportStoryPasteModalOverlay) closeDashboardImportStoryPasteModal();
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
  closeDashboardImportStructuresModal();
  closeDashboardImportStoryPasteModal();
  closeDashboardImportStructuresPasteModal();
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
  closeDashboardImportStructuresModal();
  closeDashboardImportStoryPasteModal();
  closeDashboardImportStructuresPasteModal();
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
      SHARED_BOOKMARKS_KEY,
      PHASE_HELP_STATE_KEY,
      EDITOR_QUICK_HELP_DISMISSED_KEY,
    ]);
    window.location.assign(`#${HOME_ROUTE}`);
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
  const consumeEscape = () => {
    event.preventDefault();
    event.stopPropagation();
  };
  if (closeAppAlertIfOpen()) return;
  if (factoryResetModalOverlay && !factoryResetModalOverlay.classList.contains("hidden")) {
    consumeEscape();
    closeFactoryResetModal();
    return;
  }
  if (resetDemosModalOverlay && !resetDemosModalOverlay.classList.contains("hidden")) {
    consumeEscape();
    closeResetDemosModal();
    return;
  }
  if (restoreBackupModalOverlay && !restoreBackupModalOverlay.classList.contains("hidden")) {
    consumeEscape();
    closeRestoreBackupModal();
    return;
  }
  if (deleteStoryModalOverlay && !deleteStoryModalOverlay.classList.contains("hidden")) {
    consumeEscape();
    closeDeleteStoryModal();
    return;
  }
  if (boardActionsModalOverlay && !boardActionsModalOverlay.classList.contains("hidden")) {
    consumeEscape();
    closeBoardActionsModal();
    return;
  }
  if (groupActionsModalOverlay && !groupActionsModalOverlay.classList.contains("hidden")) {
    consumeEscape();
    groupModalController.closeGroupActionsModal();
    return;
  }
  if (groupReorderModalOverlay && !groupReorderModalOverlay.classList.contains("hidden")) {
    consumeEscape();
    void groupModalController.closeGroupReorderModal();
    return;
  }
  if (dashboardCreateStoryModalOverlay && !dashboardCreateStoryModalOverlay.classList.contains("hidden")) {
    consumeEscape();
    closeDashboardCreateStoryModal();
    return;
  }
  if (newStoryOnboardingModalOverlay && !newStoryOnboardingModalOverlay.classList.contains("hidden")) {
    return;
  }
  if (dashboardCreateStructureModalOverlay && !dashboardCreateStructureModalOverlay.classList.contains("hidden")) {
    consumeEscape();
    closeDashboardCreateStructureModal();
    return;
  }
  if (dashboardImportModalOverlay && !dashboardImportModalOverlay.classList.contains("hidden")) {
    consumeEscape();
    closeDashboardImportModal();
    return;
  }
  if (
    dashboardImportStructuresModalOverlay &&
    !dashboardImportStructuresModalOverlay.classList.contains("hidden")
  ) {
    consumeEscape();
    closeDashboardImportStructuresModal();
    return;
  }
  if (
    dashboardImportStoryPasteModalOverlay &&
    !dashboardImportStoryPasteModalOverlay.classList.contains("hidden")
  ) {
    consumeEscape();
    closeDashboardImportStoryPasteModal();
    return;
  }
  if (dashboardCreateSeriesModalOverlay && !dashboardCreateSeriesModalOverlay.classList.contains("hidden")) {
    consumeEscape();
    closeDashboardCreateSeriesModal();
    return;
  }
  if (editNoteTypesModal.isOpen()) {
    consumeEscape();
    editNoteTypesModal.close();
    return;
  }
  if (editArchetypesModal.isOpen()) {
    consumeEscape();
    editArchetypesModal.close();
    return;
  }
  if (
    dashboardImportStructuresPasteModalOverlay &&
    !dashboardImportStructuresPasteModalOverlay.classList.contains("hidden")
  ) {
    consumeEscape();
    closeDashboardImportStructuresPasteModal();
    return;
  }
  if (
    dashboardRemoveStructuresModalOverlay &&
    !dashboardRemoveStructuresModalOverlay.classList.contains("hidden")
  ) {
    consumeEscape();
    closeDashboardRemoveStructuresModal();
    return;
  }
  if (dashboardActionsModal.isOpen()) {
    consumeEscape();
    closeDashboardActionsModal();
    return;
  }
  if (sharedViewActions.isActionsMenuOpen()) {
    consumeEscape();
    sharedViewActions.closeActionsMenu();
    return;
  }
  if (sharedViewActions.isOptionsMenuOpen()) {
    consumeEscape();
    sharedViewActions.closeOptionsMenu();
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
    closeDashboardImportModal();
    closeDashboardImportStoryPasteModal();
    closeDashboardImportStructuresModal();
    closeDashboardImportStructuresPasteModal();
    openFactoryResetModal();
  });
}

if (dashboardExportBackupActionBtn) {
  dashboardExportBackupActionBtn.addEventListener("click", () => {
    closeDashboardActionsModal();
    exportFullAppBackup();
  });
}

if (dashboardImportStructuresActionBtn) {
  dashboardImportStructuresActionBtn.addEventListener("click", () => {
    openDashboardImportStructuresModal();
  });
}

if (importCustomStructuresFileButton && importCustomStructuresInput) {
  importCustomStructuresFileButton.addEventListener("click", () => {
    importCustomStructuresInput.click();
  });
}

if (importCustomStructuresInput) {
  importCustomStructuresInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = importCustomStructuresFromText(text);
      closeDashboardImportStructuresModal();
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

let noteTextResizeState = null;

function finishNoteTextResize(event, persist) {
  if (!noteTextResizeState || event.pointerId !== noteTextResizeState.pointerId) return;
  const st = noteTextResizeState;
  noteTextResizeState = null;
  try {
    st.grip.releasePointerCapture(event.pointerId);
  } catch {
    /* already released */
  }
  if (!persist) return;
  const board = getCurrentBoard();
  if (!board) return;
  const note = board.notes.find((n) => n.id === st.noteId);
  if (!note) return;
  const finalH = Math.round(st.body.offsetHeight);
  const natural = getAdaptiveNoteBodyNaturalTargetPx(note, st.body);
  const tolerance = 12;
  if (Math.abs(finalH - natural) <= tolerance) {
    delete note.customHeight;
    st.body.style.height = "";
    st.body.style.maxHeight = "";
    st.body.style.overflowY = "";
    if (st.body.matches("textarea")) {
      autoResizeTextareas();
    }
  } else {
    note.customHeight = finalH;
  }
  note.updatedAt = Date.now();
  touchBoard(board);
}

boardEl.addEventListener("pointerdown", (event) => {
  if (boardUsesClassicNoteHeight(getCurrentBoard())) return;
  const grip = event.target.closest('[data-role="note-text-resize-grip"]');
  if (!grip) return;
  event.preventDefault();
  event.stopPropagation();
  const body = grip.previousElementSibling;
  if (!(body instanceof HTMLElement) || !body.classList.contains("note-text-body")) return;
  const noteId = Number(grip.dataset.noteId);
  const board = getCurrentBoard();
  if (!board) return;
  const note = board.notes.find((n) => n.id === noteId);
  if (!note) return;
  const startH = body.offsetHeight;
  const startY = event.clientY;
  noteTextResizeState = { noteId, body, grip, startH, startY, pointerId: event.pointerId };
  grip.setPointerCapture(event.pointerId);
});

boardEl.addEventListener("pointermove", (event) => {
  if (!noteTextResizeState || event.pointerId !== noteTextResizeState.pointerId) return;
  const { body, startH, startY } = noteTextResizeState;
  const minH = 28;
  const dy = event.clientY - startY;
  const next = Math.max(minH, startH + dy);
  body.style.height = `${next}px`;
  body.style.maxHeight = "none";
  body.style.overflowY = "auto";
});

boardEl.addEventListener("pointerup", (event) => {
  finishNoteTextResize(event, true);
});

boardEl.addEventListener("pointercancel", (event) => {
  finishNoteTextResize(event, true);
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
      if (boardUsesClassicNoteHeight(board) || !target.classList.contains("note-text-body--adaptive")) {
        target.style.height = `${Math.max(target.scrollHeight, 74)}px`;
      } else {
        const cap = getAdaptiveNoteBodyCapPx();
        const sh = target.scrollHeight;
        const h = adaptiveNoteTextareaHeightPx(note, sh, cap);
        target.style.height = `${h}px`;
        target.style.overflowY = sh > cap ? "auto" : "hidden";
      }
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
  addNoteModal: {
    overlay: addNoteModalOverlay,
    bodyRoot: addNoteModalBodyRoot,
    titleEl: addNoteModalTitleEl,
    cancelBtn: addNoteModalCancelBtn,
  },
  buildAddNoteModalBody: (columnIndex) =>
    addNoteModalBodyTemplate(columnIndex, getAllArchetypes(), getAllNoteTypes()),
  getPhaseTitleForColumn: (columnIndex) => {
    const board = getCurrentBoard();
    if (!board) return "";
    const phases = getBoardPhases(board);
    const phase = phases[columnIndex];
    return phase ? formatPhaseTitle(phase) : "";
  },
});

document.addEventListener("click", (event) => {
  inlineTitleEdit.handleDocumentClick(event);

  if (!event.target.closest(".options-wrap")) {
    closeOptionsMenu();
    sharedViewActions.closeMenus();
  }
  if (!event.target.closest(".phase-head") && !event.target.closest("#add-note-modal-overlay")) {
    boardNoteActions.closeAllColumnMenus();
  }
  if (
    !event.target.closest(".note") &&
    !event.target.closest("#add-note-modal-overlay") &&
    !event.target.closest("#note-height-mode-modal-overlay")
  ) {
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

(() => {
  const noteHeightOverlay = document.getElementById("note-height-mode-modal-overlay");
  if (!noteHeightOverlay) return;
  noteHeightOverlay.addEventListener("click", (event) => {
    if (event.target === noteHeightOverlay) {
      closeNoteHeightModeModal();
    }
  });
})();

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

ensureMissingDemoBoardsPresent();
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
pruneOrphanAlteredStructures();
saveBoards();
saveGroups();
canonicalizeUrlToHashRoutesForPrivacy();
window.addEventListener("hashchange", () => {
  syncRouteToState(false);
});
applyColumnWidth();
applyWrapColumns();
applyDevFlags();
applyDemoVisibilityControl();
initBoardActionsExclusiveAccordion();
initStructurePreviewModal();
initModalScrollLock();
renderStructureOptions("hero_journey");
renderStructurePhaseRows();
syncRouteToState(true);

const appVersionEl = document.querySelector("#app-version");
if (appVersionEl && packageJson.version) {
  appVersionEl.textContent = packageJson.version;
}

if (isStructurerDevEnabled()) {
  window.structurerDev = {
    /** Removes `customHeight` from every note on the board currently open in the editor. No-op if not on a story. */
    clearCustomNoteHeightsForOpenStory() {
      const board = getCurrentBoard();
      if (!board) {
        console.warn("structurerDev.clearCustomNoteHeightsForOpenStory: no open story (open the editor for a board first).");
        return { ok: false, reason: "no_board" };
      }
      let cleared = 0;
      for (const note of board.notes) {
        if (note.customHeight != null) {
          delete note.customHeight;
          cleared += 1;
        }
      }
      if (cleared === 0) {
        console.info("structurerDev.clearCustomNoteHeightsForOpenStory: no notes had customHeight.");
        return { ok: true, cleared: 0 };
      }
      touchBoard(board);
      renderEditor();
      console.info(`structurerDev.clearCustomNoteHeightsForOpenStory: cleared ${cleared} note(s).`);
      return { ok: true, cleared };
    },
  };
}
