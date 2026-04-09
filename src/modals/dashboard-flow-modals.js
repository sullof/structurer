export function createDashboardFlowModalsController({
  dismissAllAppAlerts,
  closeOptionsMenu,
  closeDashboardActionsModal,
  closeDashboardRemoveStructuresModal,
  closeDeleteStoryModal,
  boardTitleInput,
  structureNameInput,
  importStoryPasteText,
  importStructuresPasteText,
}) {
  const dashboardCreateStoryModalOverlay = document.querySelector("#dashboard-create-story-modal-overlay");
  const dashboardCreateStructureModalOverlay = document.querySelector("#dashboard-create-structure-modal-overlay");
  const dashboardImportModalOverlay = document.querySelector("#dashboard-import-modal-overlay");
  const dashboardImportStructuresModalOverlay = document.querySelector("#dashboard-import-structures-modal-overlay");
  const dashboardImportStoryPasteModalOverlay = document.querySelector("#dashboard-import-story-paste-modal-overlay");
  const dashboardImportStructuresPasteModalOverlay = document.querySelector("#dashboard-import-structures-paste-modal-overlay");
  const dashboardCreateSeriesModalOverlay = document.querySelector("#dashboard-create-series-modal-overlay");

  function closeCreateStory() {
    if (!dashboardCreateStoryModalOverlay) return;
    dashboardCreateStoryModalOverlay.classList.add("hidden");
  }

  function closeCreateStructure() {
    if (!dashboardCreateStructureModalOverlay) return;
    dashboardCreateStructureModalOverlay.classList.add("hidden");
  }

  function closeImport() {
    if (!dashboardImportModalOverlay) return;
    dashboardImportModalOverlay.classList.add("hidden");
  }

  function closeImportStructures() {
    if (!dashboardImportStructuresModalOverlay) return;
    dashboardImportStructuresModalOverlay.classList.add("hidden");
  }

  function closeImportStoryPaste() {
    if (!dashboardImportStoryPasteModalOverlay) return;
    dashboardImportStoryPasteModalOverlay.classList.add("hidden");
    if (importStoryPasteText) importStoryPasteText.value = "";
  }

  function closeCreateSeries() {
    if (!dashboardCreateSeriesModalOverlay) return;
    dashboardCreateSeriesModalOverlay.classList.add("hidden");
  }

  function closeImportStructuresPaste() {
    if (!dashboardImportStructuresPasteModalOverlay) return;
    dashboardImportStructuresPasteModalOverlay.classList.add("hidden");
    if (importStructuresPasteText) importStructuresPasteText.value = "";
  }

  function openImportStructures() {
    if (!dashboardImportStructuresModalOverlay) return;
    closeDashboardActionsModal();
    closeDashboardRemoveStructuresModal();
    closeImportStructuresPaste();
    closeImportStoryPaste();
    closeImport();
    dashboardImportStructuresModalOverlay.classList.remove("hidden");
  }

  function openImportStoryPaste() {
    if (!dashboardImportStoryPasteModalOverlay) return;
    dismissAllAppAlerts();
    closeOptionsMenu();
    closeDashboardActionsModal();
    closeDashboardRemoveStructuresModal();
    closeImport();
    closeImportStructures();
    closeImportStructuresPaste();
    dashboardImportStoryPasteModalOverlay.classList.remove("hidden");
    if (importStoryPasteText) importStoryPasteText.focus();
  }

  function openCreateStory() {
    if (!dashboardCreateStoryModalOverlay) return;
    closeDashboardActionsModal();
    closeDashboardRemoveStructuresModal();
    closeImportStructures();
    dashboardCreateStoryModalOverlay.classList.remove("hidden");
    if (boardTitleInput) boardTitleInput.focus();
  }

  function openCreateStructure() {
    if (!dashboardCreateStructureModalOverlay) return;
    closeDashboardActionsModal();
    closeDashboardRemoveStructuresModal();
    closeImportStructures();
    dashboardCreateStructureModalOverlay.classList.remove("hidden");
    if (structureNameInput) structureNameInput.focus();
  }

  function openImport() {
    if (!dashboardImportModalOverlay) return;
    closeDashboardActionsModal();
    closeDashboardRemoveStructuresModal();
    closeImportStructures();
    closeImportStoryPaste();
    dashboardImportModalOverlay.classList.remove("hidden");
  }

  function openCreateSeries() {
    if (!dashboardCreateSeriesModalOverlay) return;
    closeDashboardActionsModal();
    closeDashboardRemoveStructuresModal();
    closeImportStructures();
    dashboardCreateSeriesModalOverlay.classList.remove("hidden");
  }

  function openImportStructuresPaste() {
    if (!dashboardImportStructuresPasteModalOverlay) return;
    closeDashboardActionsModal();
    closeDashboardRemoveStructuresModal();
    closeImportStoryPaste();
    closeImport();
    closeImportStructures();
    dashboardImportStructuresPasteModalOverlay.classList.remove("hidden");
    if (importStructuresPasteText) importStructuresPasteText.focus();
  }

  return {
    closeCreateStory,
    closeCreateStructure,
    closeImport,
    closeImportStructures,
    closeImportStoryPaste,
    closeCreateSeries,
    closeImportStructuresPaste,
    openCreateStory,
    openCreateStructure,
    openImport,
    openImportStructures,
    openImportStoryPaste,
    openCreateSeries,
    openImportStructuresPaste,
  };
}
