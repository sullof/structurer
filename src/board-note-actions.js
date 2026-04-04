export function createBoardNoteActionsController({
  boardEl,
  boardInteractions,
  getCurrentBoard,
  getEditingNoteId,
  setEditingNoteId,
  normalizeOrders,
  touchBoard,
  renderEditor,
  addNoteModal,
  buildAddNoteModalBody,
  getPhaseTitleForColumn,
}) {
  const { overlay, bodyRoot, titleEl, cancelBtn } = addNoteModal;

  function isAddNoteModalOpen() {
    return overlay && !overlay.classList.contains("hidden");
  }

  function closeAddNoteModal() {
    if (!overlay) return;
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
    if (bodyRoot) bodyRoot.innerHTML = "";
    if (titleEl) titleEl.textContent = "Add note";
  }

  function openAddNoteModal(columnIndex) {
    if (!overlay || !bodyRoot || !buildAddNoteModalBody) return;
    bodyRoot.innerHTML = buildAddNoteModalBody(columnIndex);
    const phaseTitle = getPhaseTitleForColumn ? getPhaseTitleForColumn(columnIndex) : "";
    if (titleEl) {
      titleEl.textContent = phaseTitle ? `Add note to ${phaseTitle}` : "Add note";
    }
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    const firstBtn = bodyRoot.querySelector("button");
    if (firstBtn) firstBtn.focus();
  }

  function handleAddNoteModalAction(target) {
    if (!(target instanceof HTMLElement)) return false;

    if (target.dataset.role === "quick-add") {
      boardInteractions.addNote(target.dataset.kind, Number(target.dataset.column));
      closeAddNoteModal();
      return true;
    }

    if (target.dataset.role === "quick-add-character") {
      boardInteractions.addNote("character", Number(target.dataset.column), target.dataset.archetype);
      closeAddNoteModal();
      return true;
    }

    return false;
  }

  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeAddNoteModal();
    });
  }

  if (bodyRoot) {
    bodyRoot.addEventListener("click", (event) => {
      const target = event.target;
      if (handleAddNoteModalAction(target)) {
        event.stopPropagation();
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => closeAddNoteModal());
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!isAddNoteModalOpen()) return;
    closeAddNoteModal();
  });

  function closeAllColumnMenus() {
    closeAddNoteModal();
  }

  /** Lets double-click on the note header toggle collapse before read→edit switches the DOM. */
  let pendingEditTimer = null;
  const EDIT_CLICK_DELAY_MS = 280;

  boardEl.addEventListener("click", (event) => {
    const target = event.target;

    if (target.dataset.role === "open-column-menu") {
      const columnEl = target.closest(".column");
      if (!columnEl) return;
      const columnIndex = Number(columnEl.dataset.column);
      if (Number.isNaN(columnIndex)) return;
      openAddNoteModal(columnIndex);
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
      if (getEditingNoteId() === id) setEditingNoteId(null);
      normalizeOrders(board.notes, board.structureId);
      touchBoard(board);
      renderEditor();
      return;
    }
    if (!target.closest("textarea, input, select, button")) {
      if (pendingEditTimer) {
        clearTimeout(pendingEditTimer);
        pendingEditTimer = null;
      }
      if (event.detail < 2) {
        pendingEditTimer = window.setTimeout(() => {
          pendingEditTimer = null;
          setEditingNoteId(id);
          renderEditor();
        }, EDIT_CLICK_DELAY_MS);
      }
    }
  });

  boardEl.addEventListener("dblclick", (event) => {
    if (pendingEditTimer) {
      clearTimeout(pendingEditTimer);
      pendingEditTimer = null;
    }
    if (event.target.closest("button, textarea, input, select")) return;
    const noteHead = event.target.closest(".note-head");
    if (!noteHead) return;
    const noteEl = noteHead.closest(".note");
    const board = getCurrentBoard();
    if (!noteEl || !board) return;
    const id = Number(noteEl.dataset.id);
    const note = board.notes.find((item) => item.id === id);
    if (!note) return;
    note.collapsed = !note.collapsed;
    note.updatedAt = Date.now();
    touchBoard(board);
    renderEditor();
  });

  return { closeAllColumnMenus, closeAddNoteModal, isAddNoteModalOpen };
}
