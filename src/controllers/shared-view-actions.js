export function createSharedViewActionsController({
  ensureSafeSharedSourceUrl,
  onOpenJson,
  onSaveBookmark,
  onOpenResizeModal,
  onToggleWrapColumns,
}) {
  const actionsWrapEl = document.querySelector("#shared-story-actions-wrap");
  const actionsBtnEl = document.querySelector("#shared-story-actions-btn");
  const actionsMenuEl = document.querySelector("#shared-story-actions-menu");
  const openJsonBtnEl = document.querySelector("#shared-story-open-json-btn");
  const saveBookmarkBtnEl = document.querySelector("#shared-story-save-bookmark-btn");
  const optionsWrapEl = document.querySelector("#shared-story-options-wrap");
  const optionsBtnEl = document.querySelector("#shared-story-options-btn");
  const optionsMenuEl = document.querySelector("#shared-story-options-menu");
  const openResizeBtnEl = document.querySelector("#shared-open-resize-modal");
  const toggleWrapBtnEl = document.querySelector("#shared-toggle-wrap-columns");

  function closeActionsMenu() {
    if (!actionsMenuEl) return;
    actionsMenuEl.classList.add("hidden");
  }

  function closeOptionsMenu() {
    if (!optionsMenuEl) return;
    optionsMenuEl.classList.add("hidden");
  }

  function closeMenus() {
    closeActionsMenu();
    closeOptionsMenu();
  }

  function setControlsVisible(visible, sourceUrl = "") {
    if (actionsWrapEl) {
      actionsWrapEl.classList.toggle("hidden", !visible);
      if (visible) actionsWrapEl.dataset.sourceUrl = sourceUrl;
      else delete actionsWrapEl.dataset.sourceUrl;
    }
    if (optionsWrapEl) {
      optionsWrapEl.classList.toggle("hidden", !visible);
    }
    if (!visible) closeMenus();
  }

  function setBookmarkState({ title = "Shared story", hidden = false }) {
    if (!saveBookmarkBtnEl) return;
    saveBookmarkBtnEl.dataset.title = title;
    saveBookmarkBtnEl.classList.toggle("hidden", hidden);
  }

  function setWrapColumnsEnabled(isEnabled) {
    if (!toggleWrapBtnEl) return;
    toggleWrapBtnEl.textContent = `Wrap columns: ${isEnabled ? "On" : "Off"}`;
  }

  function isActionsMenuOpen() {
    return Boolean(actionsMenuEl && !actionsMenuEl.classList.contains("hidden"));
  }

  function isOptionsMenuOpen() {
    return Boolean(optionsMenuEl && !optionsMenuEl.classList.contains("hidden"));
  }

  function init() {
    if (actionsBtnEl && actionsMenuEl) {
      actionsBtnEl.addEventListener("click", (event) => {
        event.stopPropagation();
        actionsMenuEl.classList.toggle("hidden");
        closeOptionsMenu();
      });
    }

    if (optionsBtnEl && optionsMenuEl) {
      optionsBtnEl.addEventListener("click", (event) => {
        event.stopPropagation();
        optionsMenuEl.classList.toggle("hidden");
        closeActionsMenu();
      });
    }

    if (openJsonBtnEl) {
      openJsonBtnEl.addEventListener("click", () => {
        const sourceUrl = ensureSafeSharedSourceUrl(actionsWrapEl?.dataset.sourceUrl || "");
        if (!sourceUrl) return;
        closeActionsMenu();
        onOpenJson(sourceUrl);
      });
    }

    if (saveBookmarkBtnEl) {
      saveBookmarkBtnEl.addEventListener("click", async () => {
        const sourceUrl = ensureSafeSharedSourceUrl(actionsWrapEl?.dataset.sourceUrl || "");
        const title = String(saveBookmarkBtnEl.dataset.title || "Shared story");
        if (!sourceUrl) return;
        const saved = await onSaveBookmark({ sourceUrl, title });
        if (!saved) return;
        closeActionsMenu();
        saveBookmarkBtnEl.classList.add("hidden");
      });
    }

    if (openResizeBtnEl) {
      openResizeBtnEl.addEventListener("click", () => {
        closeOptionsMenu();
        onOpenResizeModal();
      });
    }

    if (toggleWrapBtnEl) {
      toggleWrapBtnEl.addEventListener("click", () => {
        onToggleWrapColumns();
      });
    }
  }

  return {
    init,
    closeActionsMenu,
    closeOptionsMenu,
    closeMenus,
    setControlsVisible,
    setBookmarkState,
    setWrapColumnsEnabled,
    isActionsMenuOpen,
    isOptionsMenuOpen,
  };
}
