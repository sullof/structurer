const STORY_INPUT = '[data-role="inline-story-title-input"]';
const GROUP_INPUT = '[data-role="inline-group-title-input"]';
const STRUCTURE_INPUT = '[data-role="inline-structure-name-input"]';

/**
 * Shared inline title editing for story (board) titles, series (group) titles, and altered structure names:
 * single active edit, ignore-first-outside-click, focus/select, Enter/Escape, focusout commit.
 */
export function createInlineTitleEditController(options) {
  const {
    getBoards,
    getGroups,
    getCurrentBoardId,
    getCurrentGroupId,
    touchBoard,
    clearBoardCardPendingOpenTimer,
    commitGroupTitleRenameFromModal,
    renderHome,
    renderEditor,
    renderGroup,
    canEditBoardStructure,
    commitBoardStructureRenameFromInline,
  } = options;

  let editing = null;
  let ignoreNextOutsideClick = false;

  function getEditingStoryBoardId() {
    return editing?.kind === "story" ? editing.boardId : null;
  }

  function getEditingGroupId() {
    return editing?.kind === "group" ? editing.groupId : null;
  }

  function getEditingStructureBoardId() {
    return editing?.kind === "structure" ? editing.boardId : null;
  }

  function renderAfterStoryTitleChange(boardId) {
    renderHome();
    if (getCurrentBoardId() === boardId) renderEditor();
    const gid = getCurrentGroupId();
    if (gid && getGroups().some((g) => g.id === gid && g.boardIds.includes(boardId))) {
      renderGroup();
    }
  }

  function renderAfterGroupTitleChange(groupId) {
    renderHome();
    if (getCurrentGroupId() === groupId) renderGroup();
  }

  function renderAfterStructureNameChange(boardId) {
    renderHome();
    if (getCurrentBoardId() === boardId) renderEditor();
    const gid = getCurrentGroupId();
    if (gid && getGroups().some((g) => g.id === gid && g.boardIds.includes(boardId))) {
      renderGroup();
    }
  }

  function commitStory(boardId, rawValue) {
    if (editing?.kind !== "story" || editing.boardId !== boardId) return;
    const board = getBoards().find((b) => b.id === boardId);
    if (!board) {
      editing = null;
      return;
    }
    const trimmed = String(rawValue ?? "").trim();
    editing = null;
    if (!trimmed) {
      renderAfterStoryTitleChange(boardId);
      return;
    }
    if (trimmed === board.title) {
      renderAfterStoryTitleChange(boardId);
      return;
    }
    board.title = trimmed;
    touchBoard(board);
    renderAfterStoryTitleChange(boardId);
  }

  function commitGroup(groupId, rawValue) {
    if (editing?.kind !== "group" || editing.groupId !== groupId) return;
    const trimmed = String(rawValue ?? "").trim();
    editing = null;
    if (!trimmed) {
      renderAfterGroupTitleChange(groupId);
      return;
    }
    const result = commitGroupTitleRenameFromModal(groupId, trimmed);
    if (!result.ok) {
      renderAfterGroupTitleChange(groupId);
      return;
    }
    if (!result.changed) {
      renderAfterGroupTitleChange(groupId);
    }
  }

  function commitStructure(boardId, rawValue) {
    if (editing?.kind !== "structure" || editing.boardId !== boardId) return;
    const board = getBoards().find((b) => b.id === boardId);
    editing = null;
    if (!board) {
      return;
    }
    const trimmed = String(rawValue ?? "").trim();
    if (!trimmed) {
      renderAfterStructureNameChange(boardId);
      return;
    }
    if (typeof commitBoardStructureRenameFromInline === "function") {
      commitBoardStructureRenameFromInline(boardId, trimmed);
    } else {
      renderAfterStructureNameChange(boardId);
    }
  }

  function flush() {
    if (editing?.kind === "story") {
      const id = editing.boardId;
      const input = document.querySelector(`${STORY_INPUT}[data-board-id="${id}"]`);
      const val = input ? input.value : (getBoards().find((b) => b.id === id)?.title ?? "");
      commitStory(id, val);
    } else if (editing?.kind === "group") {
      const id = editing.groupId;
      const input = document.querySelector(GROUP_INPUT);
      const val = input ? input.value : (getGroups().find((g) => g.id === id)?.title ?? "");
      commitGroup(id, val);
    } else if (editing?.kind === "structure") {
      const id = editing.boardId;
      const input = document.querySelector(`${STRUCTURE_INPUT}[data-board-id="${id}"]`);
      const board = getBoards().find((b) => b.id === id);
      const fallback = board?.structure ?? "";
      const val = input ? input.value : fallback;
      commitStructure(id, val);
    }
  }

  function isInsideStoryEdit(event, boardId) {
    const input = document.querySelector(`${STORY_INPUT}[data-board-id="${boardId}"]`);
    const root = input?.closest('[data-role="inline-story-title-root"]');
    return Boolean(root && root.contains(event.target));
  }

  function isInsideGroupEdit(event, groupId) {
    const input = document.querySelector(GROUP_INPUT);
    if (!input || input.dataset.groupId !== groupId) return false;
    const root = input.closest("#group-title");
    return Boolean(root && root.contains(event.target));
  }

  function isInsideStructureEdit(event, boardId) {
    const root = document.querySelector("#structure-name");
    return Boolean(root && root.contains(event.target));
  }

  function beginStory(boardId) {
    flush();
    if (clearBoardCardPendingOpenTimer) clearBoardCardPendingOpenTimer();
    editing = { kind: "story", boardId };
    ignoreNextOutsideClick = true;
    renderHome();
    if (getCurrentBoardId() === boardId) renderEditor();
    const gid = getCurrentGroupId();
    if (gid && getGroups().some((g) => g.id === gid && g.boardIds.includes(boardId))) {
      renderGroup();
    }
    const input = document.querySelector(`${STORY_INPUT}[data-board-id="${boardId}"]`);
    if (input) {
      input.focus({ preventScroll: true });
      input.select();
      if (document.activeElement !== input) {
        requestAnimationFrame(() => {
          input.focus({ preventScroll: true });
          input.select();
        });
      }
    }
  }

  function beginGroup(groupId) {
    flush();
    editing = { kind: "group", groupId };
    ignoreNextOutsideClick = true;
    renderHome();
    if (getCurrentBoardId()) renderEditor();
    renderGroup();
    const input = document.querySelector(GROUP_INPUT);
    if (input) {
      input.focus({ preventScroll: true });
      input.select();
      if (document.activeElement !== input) {
        requestAnimationFrame(() => {
          input.focus({ preventScroll: true });
          input.select();
        });
      }
    }
  }

  function beginStructure(boardId) {
    if (typeof canEditBoardStructure !== "function" || !canEditBoardStructure(boardId)) return;
    flush();
    editing = { kind: "structure", boardId };
    ignoreNextOutsideClick = true;
    if (getCurrentBoardId() === boardId) renderEditor();
    const input = document.querySelector(`${STRUCTURE_INPUT}[data-board-id="${boardId}"]`);
    if (input) {
      input.focus({ preventScroll: true });
      input.select();
      if (document.activeElement !== input) {
        requestAnimationFrame(() => {
          input.focus({ preventScroll: true });
          input.select();
        });
      }
    }
  }

  function cancelStoryEdit(boardId) {
    if (editing?.kind !== "story" || editing.boardId !== boardId) return;
    editing = null;
    renderAfterStoryTitleChange(boardId);
  }

  function cancelGroupEdit(groupId) {
    if (editing?.kind !== "group" || editing.groupId !== groupId) return;
    editing = null;
    renderHome();
    if (getCurrentGroupId() === groupId) renderGroup();
  }

  function cancelStructureEdit(boardId) {
    if (editing?.kind !== "structure" || editing.boardId !== boardId) return;
    editing = null;
    renderAfterStructureNameChange(boardId);
  }

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape" && event.key !== "Enter") return;
      const structureInput = event.target.closest(STRUCTURE_INPUT);
      if (structureInput) {
        const bid = structureInput.dataset.boardId;
        if (event.key === "Escape") {
          event.preventDefault();
          cancelStructureEdit(bid);
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          commitStructure(bid, structureInput.value);
          return;
        }
      }
      const groupInput = event.target.closest(GROUP_INPUT);
      if (groupInput) {
        const gid = groupInput.dataset.groupId;
        if (event.key === "Escape") {
          event.preventDefault();
          cancelGroupEdit(gid);
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          commitGroup(gid, groupInput.value);
          return;
        }
      }
      const input = event.target.closest(STORY_INPUT);
      if (!input) return;
      const storyBoardId = input.dataset.boardId;
      if (event.key === "Escape") {
        event.preventDefault();
        cancelStoryEdit(storyBoardId);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        commitStory(storyBoardId, input.value);
      }
    },
    true,
  );

  document.addEventListener(
    "focusout",
    (event) => {
      const structureTarget = event.target;
      if (structureTarget?.matches?.(STRUCTURE_INPUT)) {
        const bid = structureTarget.dataset.boardId;
        if (editing?.kind === "structure" && editing.boardId === bid) {
          const valueSnapshot = structureTarget.value;
          queueMicrotask(() => {
            if (editing?.kind !== "structure" || editing.boardId !== bid) return;
            commitStructure(bid, valueSnapshot);
          });
        }
        return;
      }
      const groupTarget = event.target;
      if (groupTarget?.matches?.(GROUP_INPUT)) {
        const gid = groupTarget.dataset.groupId;
        if (editing?.kind === "group" && editing.groupId === gid) {
          const valueSnapshot = groupTarget.value;
          queueMicrotask(() => {
            if (editing?.kind !== "group" || editing.groupId !== gid) return;
            commitGroup(gid, valueSnapshot);
          });
        }
        return;
      }
      const target = event.target;
      if (!target?.matches?.(STORY_INPUT)) return;
      const boardId = target.dataset.boardId;
      if (editing?.kind !== "story" || editing.boardId !== boardId) return;
      const valueSnapshot = target.value;
      queueMicrotask(() => {
        if (editing?.kind !== "story" || editing.boardId !== boardId) return;
        commitStory(boardId, valueSnapshot);
      });
    },
    true,
  );

  function handleDocumentClick(event) {
    if (ignoreNextOutsideClick) {
      ignoreNextOutsideClick = false;
      return;
    }
    if (editing?.kind === "group") {
      const id = editing.groupId;
      if (!isInsideGroupEdit(event, id)) {
        const input = document.querySelector(GROUP_INPUT);
        commitGroup(id, input ? input.value : getGroups().find((g) => g.id === id)?.title ?? "");
      }
    } else if (editing?.kind === "structure") {
      const id = editing.boardId;
      if (!isInsideStructureEdit(event, id)) {
        const input = document.querySelector(`${STRUCTURE_INPUT}[data-board-id="${id}"]`);
        const board = getBoards().find((b) => b.id === id);
        commitStructure(id, input ? input.value : board?.structure ?? "");
      }
    } else if (editing?.kind === "story") {
      const id = editing.boardId;
      if (!isInsideStoryEdit(event, id)) {
        const input = document.querySelector(`${STORY_INPUT}[data-board-id="${id}"]`);
        commitStory(id, input ? input.value : getBoards().find((b) => b.id === id)?.title ?? "");
      }
    }
  }

  return {
    getEditingStoryBoardId,
    getEditingGroupId,
    getEditingStructureBoardId,
    beginStory,
    beginGroup,
    beginStructure,
    flush,
    handleDocumentClick,
  };
}
