import { appAlert } from "../ui/app-alert.js";

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

export function createGroupModalController({
  elements,
  getGroups,
  setGroups,
  getBoards,
  getCurrentGroupId,
  saveGroups,
  renderHome,
  renderGroup,
  openHome,
  commitGroupTitleRename,
}) {
  const {
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
  } = elements;

  let groupActionsModalGroupId = null;
  let groupReorderModalGroupId = null;
  let draggedReorderBoardId = null;
  let groupReorderDropIndex = null;
  let groupReorderCommitted = false;
  let groupReorderStatusTimer = null;

  function closeGroupActionsModal() {
    groupActionsModalOverlay.classList.add("hidden");
    groupActionsModalGroupId = null;
  }

  function renderGroupReorderList(group) {
    const html = group.boardIds
      .map((id) => getBoards().find((item) => item.id === id))
      .filter(Boolean)
      .map(
        (board) => `<div class="reorder-item" data-board-id="${board.id}">
      <span class="reorder-handle" draggable="true" aria-hidden="true">⋮⋮</span>
      <span class="reorder-item-title">${escapeHtml(board.title)}</span>
      <button type="button" class="reorder-remove ghost-button" data-board-id="${board.id}" aria-label="Remove from series">✕</button>
    </div>`,
      )
      .join("");
    groupReorderListEl.innerHTML = html;
  }

  function populateAddSelect(group) {
    if (!groupReorderAddSelectEl) return;
    const inSeries = new Set(group.boardIds);
    const eligible = getBoards()
      .filter((b) => !inSeries.has(b.id))
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
    groupReorderAddSelectEl.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = eligible.length === 0 ? "No other stories to add" : "Add a story...";
    groupReorderAddSelectEl.appendChild(placeholder);
    eligible.forEach((board) => {
      const opt = document.createElement("option");
      opt.value = board.id;
      opt.textContent = board.title;
      groupReorderAddSelectEl.appendChild(opt);
    });
    groupReorderAddSelectEl.disabled = eligible.length === 0;
    groupReorderAddSelectEl.value = "";
  }

  function finishCloseGroupReorderModal() {
    groupReorderModalOverlay.classList.add("hidden");
    groupReorderModalGroupId = null;
    draggedReorderBoardId = null;
    groupReorderDropIndex = null;
    groupReorderCommitted = false;
    if (groupReorderStatusTimer) {
      window.clearTimeout(groupReorderStatusTimer);
      groupReorderStatusTimer = null;
    }
    if (groupReorderStatusEl) {
      groupReorderStatusEl.textContent = "";
      groupReorderStatusEl.classList.remove("is-visible");
    }
    groupReorderListEl.querySelectorAll(".reorder-placeholder").forEach((el) => el.remove());
    if (groupReorderAddSelectEl) {
      groupReorderAddSelectEl.innerHTML = "";
      groupReorderAddSelectEl.disabled = true;
    }
    if (groupReorderSeriesNameInputEl) {
      groupReorderSeriesNameInputEl.value = "";
    }
  }

  async function tryCloseGroupReorderModal() {
    if (groupReorderSeriesNameInputEl && groupReorderModalGroupId && commitGroupTitleRename) {
      const result = commitGroupTitleRename(groupReorderModalGroupId, groupReorderSeriesNameInputEl.value);
      if (result.ok) {
        if (result.changed) showGroupReorderStatus("Series name saved");
      } else if (result.error === "empty") {
        const g = getGroups().find((item) => item.id === groupReorderModalGroupId);
        if (g) groupReorderSeriesNameInputEl.value = g.title;
        await appAlert("Series name cannot be empty.");
        return;
      }
    }
    finishCloseGroupReorderModal();
  }

  function showGroupReorderStatus(message) {
    if (!groupReorderStatusEl) return;
    if (groupReorderStatusTimer) {
      window.clearTimeout(groupReorderStatusTimer);
      groupReorderStatusTimer = null;
    }
    groupReorderStatusEl.textContent = message;
    groupReorderStatusEl.classList.add("is-visible");
    groupReorderStatusTimer = window.setTimeout(() => {
      groupReorderStatusEl.classList.remove("is-visible");
      groupReorderStatusEl.textContent = "";
      groupReorderStatusTimer = null;
    }, 1000);
  }

  function commitGroupReorderIfNeeded() {
    if (!draggedReorderBoardId || !Number.isInteger(groupReorderDropIndex)) return false;
    const groups = getGroups();
    const group = groups.find((item) => item.id === groupReorderModalGroupId);
    if (!group) return false;
    const currentIds = [...group.boardIds];
    const from = currentIds.indexOf(draggedReorderBoardId);
    if (from < 0) return false;
    const idsWithoutDragged = currentIds.filter((id) => id !== draggedReorderBoardId);
    const insertIndex = Math.max(0, Math.min(groupReorderDropIndex, idsWithoutDragged.length));
    idsWithoutDragged.splice(insertIndex, 0, draggedReorderBoardId);
    if (idsWithoutDragged.join("|") === currentIds.join("|")) return false;
    group.boardIds = idsWithoutDragged;
    group.updatedAt = Date.now();
    saveGroups();
    renderHome();
    if (getCurrentGroupId() === group.id) renderGroup();
    renderGroupReorderList(group);
    populateAddSelect(group);
    showGroupReorderStatus("Order saved");
    return true;
  }

  function removeBoardFromSeries(boardId) {
    const groups = getGroups();
    const group = groups.find((item) => item.id === groupReorderModalGroupId);
    if (!group) return;
    const idx = group.boardIds.indexOf(boardId);
    if (idx < 0) return;
    group.boardIds.splice(idx, 1);
    if (group.boardIds.length === 0) {
      const nextGroups = groups.filter((item) => item.id !== group.id);
      setGroups(nextGroups);
      saveGroups();
      renderHome();
      if (getCurrentGroupId() === group.id) openHome();
      finishCloseGroupReorderModal();
      closeGroupActionsModal();
      return;
    }
    group.updatedAt = Date.now();
    saveGroups();
    renderHome();
    if (getCurrentGroupId() === group.id) renderGroup();
    renderGroupReorderList(group);
    populateAddSelect(group);
    showGroupReorderStatus("Story removed");
  }

  function addBoardToSeries(boardId) {
    const groups = getGroups();
    const group = groups.find((item) => item.id === groupReorderModalGroupId);
    if (!group) return;
    if (group.boardIds.includes(boardId)) return;
    group.boardIds.push(boardId);
    group.updatedAt = Date.now();
    saveGroups();
    renderHome();
    if (getCurrentGroupId() === group.id) renderGroup();
    renderGroupReorderList(group);
    populateAddSelect(group);
    showGroupReorderStatus("Story added");
  }

  function openGroupReorderModal(group) {
    groupReorderModalGroupId = group.id;
    if (groupReorderSeriesNameInputEl) {
      groupReorderSeriesNameInputEl.value = group.title;
    }
    renderGroupReorderList(group);
    populateAddSelect(group);
    groupReorderModalOverlay.classList.remove("hidden");
  }

  function openGroupActionsModal(groupId) {
    groupActionsModalGroupId = groupId;
    groupActionsModalOverlay.classList.remove("hidden");
  }

  if (closeGroupActionsModalBtn) {
    closeGroupActionsModalBtn.addEventListener("click", () => {
      closeGroupActionsModal();
    });
  }

  if (closeGroupReorderModalBtn) {
    closeGroupReorderModalBtn.addEventListener("click", () => {
      void tryCloseGroupReorderModal();
    });
  }

  if (modalReorderGroupBoardsBtn) {
    modalReorderGroupBoardsBtn.addEventListener("click", () => {
      const group = getGroups().find((item) => item.id === groupActionsModalGroupId);
      if (!group) return;
      openGroupReorderModal(group);
      closeGroupActionsModal();
    });
  }

  if (modalDeleteGroupBtn) {
    modalDeleteGroupBtn.addEventListener("click", async () => {
      const groups = getGroups();
      const group = groups.find((item) => item.id === groupActionsModalGroupId);
      if (!group) return;
      const confirmed = await appAlert(`Delete series "${group.title}"? This action cannot be undone.`, {
        confirm: true,
      });
      if (!confirmed) return;
      const nextGroups = groups.filter((item) => item.id !== group.id);
      setGroups(nextGroups);
      saveGroups();
      renderHome();
      if (getCurrentGroupId() === group.id) {
        openHome();
      }
      closeGroupActionsModal();
    });
  }

  groupActionsModalOverlay.addEventListener("click", (event) => {
    if (event.target === groupActionsModalOverlay) {
      closeGroupActionsModal();
    }
  });

  groupReorderModalOverlay.addEventListener("click", (event) => {
    if (event.target === groupReorderModalOverlay) {
      void tryCloseGroupReorderModal();
    }
  });

  if (groupReorderSeriesNameInputEl && commitGroupTitleRename) {
    groupReorderSeriesNameInputEl.addEventListener("blur", async () => {
      if (!groupReorderModalGroupId) return;
      const result = commitGroupTitleRename(groupReorderModalGroupId, groupReorderSeriesNameInputEl.value);
      if (result.ok) {
        if (result.changed) showGroupReorderStatus("Series name saved");
        return;
      }
      if (result.error === "empty") {
        const g = getGroups().find((item) => item.id === groupReorderModalGroupId);
        if (g) groupReorderSeriesNameInputEl.value = g.title;
        await appAlert("Series name cannot be empty.");
      }
    });
    groupReorderSeriesNameInputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        groupReorderSeriesNameInputEl.blur();
      }
    });
  }

  if (groupReorderAddSelectEl) {
    groupReorderAddSelectEl.addEventListener("change", () => {
      const id = groupReorderAddSelectEl.value;
      if (!id) return;
      addBoardToSeries(id);
    });
  }

  groupReorderListEl.addEventListener("click", (event) => {
    const btn = event.target.closest(".reorder-remove");
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    const boardId = btn.dataset.boardId;
    if (boardId) removeBoardFromSeries(boardId);
  });

  groupReorderListEl.addEventListener("dragstart", (event) => {
    const handle = event.target.closest(".reorder-handle");
    if (!handle) return;
    const item = handle.closest(".reorder-item");
    if (!item) return;
    draggedReorderBoardId = item.dataset.boardId;
    groupReorderDropIndex = null;
    groupReorderCommitted = false;
    item.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedReorderBoardId);
    }
  });

  groupReorderListEl.addEventListener("dragover", (event) => {
    if (!draggedReorderBoardId) return;
    event.preventDefault();
    groupReorderListEl.querySelectorAll(".reorder-placeholder").forEach((el) => el.remove());
    const items = [...groupReorderListEl.querySelectorAll(".reorder-item")].filter(
      (el) => el.dataset.boardId !== draggedReorderBoardId,
    );
    let insertIndex = items.length;
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const rect = item.getBoundingClientRect();
      if (event.clientY < rect.top + rect.height / 2) {
        insertIndex = index;
        break;
      }
    }
    groupReorderDropIndex = insertIndex;
    const placeholder = document.createElement("div");
    placeholder.className = "reorder-placeholder";
    if (insertIndex >= items.length) {
      groupReorderListEl.appendChild(placeholder);
    } else {
      items[insertIndex].insertAdjacentElement("beforebegin", placeholder);
    }
  });

  groupReorderListEl.addEventListener("drop", (event) => {
    if (!draggedReorderBoardId) return;
    event.preventDefault();
    groupReorderCommitted = commitGroupReorderIfNeeded();
  });

  groupReorderListEl.addEventListener("dragend", () => {
    if (!groupReorderCommitted) {
      commitGroupReorderIfNeeded();
    }
    groupReorderCommitted = false;
    draggedReorderBoardId = null;
    groupReorderDropIndex = null;
    groupReorderListEl.querySelectorAll(".reorder-placeholder").forEach((el) => el.remove());
    groupReorderListEl.querySelectorAll(".reorder-item.is-dragging").forEach((el) => el.classList.remove("is-dragging"));
  });

  return { openGroupActionsModal, closeGroupActionsModal, closeGroupReorderModal: tryCloseGroupReorderModal };
}
