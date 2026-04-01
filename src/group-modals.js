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
  openGroup,
}) {
  const {
    groupActionsModalOverlay,
    closeGroupActionsModalBtn,
    modalReorderGroupBoardsBtn,
    modalRemoveBoardFromGroupBtn,
    modalDeleteGroupBtn,
    groupReorderModalOverlay,
    closeGroupReorderModalBtn,
    groupReorderListEl,
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
        (board) => `<div class="reorder-item" draggable="true" data-board-id="${board.id}">
      <span class="reorder-handle">⋮⋮</span>
      <span>${board.title}</span>
    </div>`,
      )
      .join("");
    groupReorderListEl.innerHTML = html;
  }

  function closeGroupReorderModal() {
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
    showGroupReorderStatus("Order saved");
    return true;
  }

  function openGroupReorderModal(group) {
    groupReorderModalGroupId = group.id;
    renderGroupReorderList(group);
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
      closeGroupReorderModal();
    });
  }

  if (modalReorderGroupBoardsBtn) {
    modalReorderGroupBoardsBtn.addEventListener("click", () => {
      const group = getGroups().find((item) => item.id === groupActionsModalGroupId);
      if (!group) return;
      if (group.boardIds.length < 2) {
        window.alert("Reorder is available when the group has at least 2 boards.");
        return;
      }
      openGroupReorderModal(group);
      closeGroupActionsModal();
    });
  }

  if (modalRemoveBoardFromGroupBtn) {
    modalRemoveBoardFromGroupBtn.addEventListener("click", () => {
      const groups = getGroups();
      const boards = getBoards();
      const group = groups.find((item) => item.id === groupActionsModalGroupId);
      if (!group) return;
      const choices = group.boardIds
        .map((id, index) => {
          const board = boards.find((item) => item.id === id);
          return board ? `${index + 1}. ${board.title}` : null;
        })
        .filter(Boolean)
        .join("\n");
      const selectedInput = window.prompt(`Remove which board?\n${choices}`);
      if (!selectedInput) return;
      const selected = Number(selectedInput) - 1;
      if (!Number.isInteger(selected) || selected < 0 || selected >= group.boardIds.length) return;
      group.boardIds.splice(selected, 1);
      if (group.boardIds.length === 0) {
        const nextGroups = groups.filter((item) => item.id !== group.id);
        setGroups(nextGroups);
        if (getCurrentGroupId() === group.id) openHome();
      } else {
        group.updatedAt = Date.now();
      }
      saveGroups();
      renderHome();
      if (getCurrentGroupId() === group.id) renderGroup();
      closeGroupActionsModal();
    });
  }

  if (modalDeleteGroupBtn) {
    modalDeleteGroupBtn.addEventListener("click", () => {
      const groups = getGroups();
      const group = groups.find((item) => item.id === groupActionsModalGroupId);
      if (!group) return;
      const confirmed = window.confirm(`Delete group "${group.title}"? This action cannot be undone.`);
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
      closeGroupReorderModal();
    }
  });

  groupReorderListEl.addEventListener("dragstart", (event) => {
    const item = event.target.closest(".reorder-item");
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

  return { openGroupActionsModal, closeGroupActionsModal, closeGroupReorderModal };
}
