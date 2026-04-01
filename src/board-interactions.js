export function createBoardInteractionsController({
  boardEl,
  getCurrentBoard,
  getStructureConfig,
  getColumnNotes,
  generateUniqueUid,
  reorderPhaseAndNotes,
  touchBoard,
  renderEditor,
  renderInsights,
  setEditingNoteId,
}) {
  let draggedNoteId = null;
  let draggedPhaseIndex = null;
  let armedNoteDragId = null;
  let noteDropPreview = null;
  let phaseDropPreviewIndex = null;
  let resizingNoteId = null;

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

  function clearNoteDropPreview() {
    noteDropPreview = null;
    boardEl.querySelectorAll(".note-drop-placeholder").forEach((el) => el.remove());
  }

  function renderNoteDropPreview(columnEl, targetIndex) {
    const notesContainer = columnEl.querySelector(".notes");
    if (!notesContainer) return;
    notesContainer.querySelectorAll(".note-drop-placeholder").forEach((el) => el.remove());
    const placeholder = document.createElement("div");
    placeholder.className = "note-drop-placeholder";
    const noteNodes = [...notesContainer.querySelectorAll(".note")].filter(
      (noteEl) => Number(noteEl.dataset.id) !== draggedNoteId,
    );
    if (targetIndex >= noteNodes.length) {
      notesContainer.appendChild(placeholder);
    } else {
      notesContainer.insertBefore(placeholder, noteNodes[targetIndex]);
    }
  }

  function clearPhaseDropPreview() {
    phaseDropPreviewIndex = null;
    const placeholder = boardEl.querySelector(".phase-drop-placeholder");
    if (placeholder) placeholder.remove();
  }

  function renderPhaseDropPreview(insertionIndex) {
    const realColumns = [...boardEl.querySelectorAll(".column")];
    let placeholder = boardEl.querySelector(".phase-drop-placeholder");
    if (!placeholder) {
      placeholder = document.createElement("section");
      placeholder.className = "phase-drop-placeholder";
    }
    const cappedIndex = Math.max(0, Math.min(insertionIndex, realColumns.length));
    if (cappedIndex >= realColumns.length) {
      boardEl.appendChild(placeholder);
    } else {
      boardEl.insertBefore(placeholder, realColumns[cappedIndex]);
    }
  }

  function moveNote(noteId, targetColumn, targetIndex) {
    const board = getCurrentBoard();
    if (!board) return;
    const now = Date.now();
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
        note.updatedAt = now;
      });
      return;
    }

    const sourceList = getColumnNotes(board.notes, sourceColumn).filter((note) => note.id !== noteId);
    sourceList.forEach((note, index) => {
      note.order = index;
      note.updatedAt = now;
    });

    const targetList = getColumnNotes(board.notes, safeTargetColumn);
    movingNote.column = safeTargetColumn;
    targetList.splice(clampedIndex, 0, movingNote);
    targetList.forEach((note, index) => {
      note.order = index;
      note.updatedAt = now;
    });
  }

  function addNote(kind, column, archetype = "none") {
    const board = getCurrentBoard();
    if (!board) return;
    const phaseCount = getStructureConfig(board.structureId).phases.length;
    const safeColumn = Math.max(0, Math.min(column, phaseCount - 1));
    const newOrder = getColumnNotes(board.notes, safeColumn).length;
    const newNoteId = board.nextNoteId++;
    board.notes.push({
      id: newNoteId,
      uid: generateUniqueUid(),
      updatedAt: Date.now(),
      kind,
      column: safeColumn,
      order: newOrder,
      text: "",
      characterName: "",
      archetype,
      collapsed: false,
    });
    setEditingNoteId(newNoteId);
    touchBoard(board);
    renderEditor();
    renderInsights(board.notes[board.notes.length - 1]);
  }

  boardEl.addEventListener("dragstart", (event) => {
    const target = event.target;
    if (target.closest('[data-role="phase-drag-handle"]')) {
      const columnEl = target.closest(".column");
      if (!columnEl) return;
      draggedPhaseIndex = Number(columnEl.dataset.column);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", `phase:${draggedPhaseIndex}`);
      return;
    }
    if (target.closest(".note")) {
      const noteEl = target.closest(".note");
      const noteId = Number(noteEl?.dataset.id);
      if (Number.isInteger(noteId) && armedNoteDragId === noteId) {
        draggedNoteId = noteId;
        noteEl.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(draggedNoteId));
        return;
      }
      event.preventDefault();
      return;
    }
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
    if (draggedPhaseIndex !== null) {
      const columnEl = event.target.closest(".column");
      const placeholderEl = event.target.closest(".phase-drop-placeholder");
      if (!columnEl && !placeholderEl) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (!columnEl) return;
      const rect = columnEl.getBoundingClientRect();
      const targetColumn = Number(columnEl.dataset.column);
      const insertionIndex = targetColumn + (event.clientX > rect.left + rect.width / 2 ? 1 : 0);
      if (phaseDropPreviewIndex !== insertionIndex) {
        phaseDropPreviewIndex = insertionIndex;
        renderPhaseDropPreview(insertionIndex);
      }
      return;
    }
    if (draggedNoteId === null) return;
    const columnEl = event.target.closest(".column");
    if (!columnEl) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const notesContainer = columnEl.querySelector(".notes");
    if (!notesContainer) return;
    const targetIndex = getDropIndex(notesContainer, event.clientY);
    const targetColumn = Number(columnEl.dataset.column);
    if (!noteDropPreview || noteDropPreview.column !== targetColumn || noteDropPreview.index !== targetIndex) {
      noteDropPreview = { column: targetColumn, index: targetIndex };
      renderNoteDropPreview(columnEl, targetIndex);
    }
  });

  boardEl.addEventListener("drop", (event) => {
    if (draggedPhaseIndex !== null) {
      const columnEl = event.target.closest(".column");
      const placeholderEl = event.target.closest(".phase-drop-placeholder");
      if (!columnEl && !placeholderEl) return;
      event.preventDefault();
      const board = getCurrentBoard();
      if (!board) return;
      const phaseCount = getStructureConfig(board.structureId).phases.length;
      const insertionIndex =
        phaseDropPreviewIndex === null ? Number(columnEl?.dataset.column || 0) : phaseDropPreviewIndex;
      const targetColumn = insertionIndex > draggedPhaseIndex ? insertionIndex - 1 : insertionIndex;
      reorderPhaseAndNotes(board, draggedPhaseIndex, Math.max(0, Math.min(targetColumn, phaseCount - 1)));
      draggedPhaseIndex = null;
      clearPhaseDropPreview();
      touchBoard(board);
      renderEditor();
      renderInsights(null);
      return;
    }
    if (draggedNoteId === null) return;
    const columnEl = event.target.closest(".column");
    if (!columnEl) return;
    const notesContainer = columnEl.querySelector(".notes");
    if (!notesContainer) return;
    event.preventDefault();

    const targetColumn = noteDropPreview ? noteDropPreview.column : Number(columnEl.dataset.column);
    const targetIndex = noteDropPreview ? noteDropPreview.index : getDropIndex(notesContainer, event.clientY);
    moveNote(draggedNoteId, targetColumn, targetIndex);

    const board = getCurrentBoard();
    const movedNote = board ? board.notes.find((note) => note.id === draggedNoteId) : null;
    draggedNoteId = null;
    clearNoteDropPreview();
    if (board) touchBoard(board);
    renderEditor();
    renderInsights(movedNote || null);
  });

  boardEl.addEventListener("dragend", () => {
    draggedNoteId = null;
    draggedPhaseIndex = null;
    armedNoteDragId = null;
    clearNoteDropPreview();
    clearPhaseDropPreview();
    boardEl.querySelectorAll(".note.is-dragging").forEach((note) => note.classList.remove("is-dragging"));
  });

  boardEl.addEventListener("mousedown", (event) => {
    const target = event.target;
    if (target.closest('[data-role="note-drag-handle"]')) {
      const noteEl = target.closest(".note");
      armedNoteDragId = Number(noteEl?.dataset.id);
    } else {
      armedNoteDragId = null;
    }
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
    note.updatedAt = Date.now();
    touchBoard(board);
    resizingNoteId = null;
  });

  return {
    addNote,
    clearPointerState() {
      resizingNoteId = null;
      armedNoteDragId = null;
    },
  };
}
