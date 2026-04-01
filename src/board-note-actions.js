export function createBoardNoteActionsController({
  boardEl,
  boardInteractions,
  getCurrentBoard,
  getEditingNoteId,
  setEditingNoteId,
  normalizeOrders,
  touchBoard,
  renderEditor,
  createCustomArchetype,
  openNoteTypeColorPicker,
  createCustomNoteType,
}) {
  function closeAllColumnMenus() {
    boardEl.querySelectorAll('[data-role="column-menu"]').forEach((menu) => {
      menu.classList.add("hidden");
    });
    boardEl.querySelectorAll('[data-role="character-submenu"]').forEach((submenu) => {
      submenu.classList.add("hidden");
    });
  }

  /** Lets double-click on the note header toggle collapse before read→edit switches the DOM. */
  let pendingEditTimer = null;
  const EDIT_CLICK_DELAY_MS = 280;

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
      boardInteractions.addNote(target.dataset.kind, Number(target.dataset.column));
      closeAllColumnMenus();
      return;
    }

    if (target.dataset.role === "quick-add-character") {
      boardInteractions.addNote("character", Number(target.dataset.column), target.dataset.archetype);
      closeAllColumnMenus();
      return;
    }

    if (target.dataset.role === "define-custom-archetype") {
      const newName = window.prompt("Custom archetype name:");
      if (!newName) return;
      const created = createCustomArchetype(newName);
      if (!created) return;
      boardInteractions.addNote("character", Number(target.dataset.column), created.id);
      closeAllColumnMenus();
      return;
    }

    if (target.dataset.role === "define-custom-note-type") {
      const newName = window.prompt("Custom note type name:");
      if (!newName) return;
      openNoteTypeColorPicker().then((pickedColor) => {
        if (!pickedColor) return;
        const createdType = createCustomNoteType(newName, pickedColor);
        if (!createdType) return;
        boardInteractions.addNote(createdType.id, Number(target.dataset.column));
      });
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

  return { closeAllColumnMenus };
}
