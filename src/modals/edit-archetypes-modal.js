export function createEditArchetypesModalController({
  getAllArchetypes,
  getBuiltinArchetypes,
  getCustomArchetypes,
  setCustomArchetypes,
  saveCustomArchetypes,
  isArchetypeInUse,
  getArchetypeById,
  escapeHtml,
  appAlert,
  onAfterChange,
  promptCustomArchetypeName,
  createCustomArchetype,
  closeBoardActionsModal,
}) {
  const modalEditArchetypesBtn = document.querySelector("#modal-edit-archetypes");
  const overlayEl = document.querySelector("#edit-archetypes-modal-overlay");
  const listEl = document.querySelector("#edit-archetypes-list");
  const cancelBtn = document.querySelector("#cancel-edit-archetypes");
  const saveBtn = document.querySelector("#save-edit-archetypes");
  const addBtn = document.querySelector("#add-custom-archetype-from-edit");

  function fill() {
    if (!listEl) return;
    const builtin = getBuiltinArchetypes();
    const archetypes = getAllArchetypes();
    listEl.innerHTML = archetypes
      .map((archetype) => {
        const isBuiltin = builtin.some((b) => b.id === archetype.id);
        const inUse = isArchetypeInUse(archetype.id);
        const canDeleteCustom = !isBuiltin && !inUse;
        const idLabel = isBuiltin ? `Built-in · ${archetype.id}` : `Custom · ${archetype.id}`;
        const safeId = escapeHtml(archetype.id);
        const safeLabel = escapeHtml(archetype.label);
        const safeIcon = escapeHtml(archetype.icon || "✨");
        return `
      <div class="edit-note-type-row${isBuiltin ? " edit-archetype-row--builtin" : ""}" data-archetype-id="${safeId}" data-is-builtin="${isBuiltin}">
        <p class="edit-note-type-row-title">${escapeHtml(idLabel)}</p>
        <div class="edit-note-type-fields">
          ${
            isBuiltin
              ? `<div class="edit-archetype-builtin-display" aria-label="Built-in archetype">
                  <span class="edit-archetype-builtin-icon" aria-hidden="true">${safeIcon}</span>
                  <span class="edit-archetype-builtin-label">${safeLabel}</span>
                </div>`
              : `<div class="edit-archetype-label-field">
                  <label for="arc-${safeId}">Label</label>
                  <input id="arc-${safeId}" class="edit-archetype-label-input" type="text" maxlength="80" value="${safeLabel}" />
                </div>`
          }
          ${
            canDeleteCustom
              ? `<div class="edit-note-type-row-delete"><button type="button" class="ghost-button danger-menu-item" data-role="delete-custom-archetype" data-archetype-id="${safeId}">Delete this archetype</button></div>`
              : !isBuiltin
                ? `<p class="subtitle" style="margin:0;">Used in one or more notes. Remove those references first to delete this archetype.</p>`
                : ""
          }
        </div>
      </div>`;
      })
      .join("");
  }

  function open() {
    if (!overlayEl) return;
    fill();
    overlayEl.classList.remove("hidden");
  }

  function close() {
    if (!overlayEl) return;
    overlayEl.classList.add("hidden");
  }

  function isOpen() {
    return Boolean(overlayEl && !overlayEl.classList.contains("hidden"));
  }

  async function save() {
    if (!listEl) return;
    const rows = listEl.querySelectorAll(".edit-note-type-row");
    const normalizedLabels = new Set();
    for (const row of rows) {
      const id = row.dataset.archetypeId;
      const input = row.querySelector(".edit-archetype-label-input");
      if (!input) continue; // Built-ins have no editable input.
      const label = String(input.value || "").trim();
      if (!label) {
        await appAlert(`Please enter a label for archetype "${id}".`);
        input.focus();
        return;
      }
      const normalized = label.toLowerCase().replace(/\s+/g, " ");
      if (normalizedLabels.has(normalized)) {
        await appAlert(`Duplicate archetype label "${label}". Please use unique names.`);
        input.focus();
        return;
      }
      normalizedLabels.add(normalized);
      const target = getCustomArchetypes().find((item) => item.id === id);
      if (target) {
        target.label = label;
        target.updatedAt = Date.now();
      }
    }
    saveCustomArchetypes();
    close();
    onAfterChange();
  }

  function init() {
    if (listEl) {
      listEl.addEventListener("click", async (event) => {
        const delBtn = event.target.closest('[data-role="delete-custom-archetype"]');
        if (!delBtn) return;
        const id = delBtn.dataset.archetypeId;
        const builtin = getBuiltinArchetypes();
        if (!id || builtin.some((b) => b.id === id) || isArchetypeInUse(id)) return;
        const archetypeLabel = getArchetypeById(id).label;
        const confirmed = await appAlert(`Delete archetype "${archetypeLabel}"? This cannot be undone.`, {
          confirm: true,
        });
        if (!confirmed) return;
        setCustomArchetypes(getCustomArchetypes().filter((item) => item.id !== id));
        saveCustomArchetypes();
        fill();
        onAfterChange();
      });
    }

    if (cancelBtn) cancelBtn.addEventListener("click", () => close());
    if (saveBtn) saveBtn.addEventListener("click", () => void save());
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        promptCustomArchetypeName().then((name) => {
          if (!name) return;
          const created = createCustomArchetype(name);
          if (!created) return;
          fill();
          onAfterChange();
        });
      });
    }
    if (overlayEl) {
      overlayEl.addEventListener("click", (event) => {
        if (event.target === overlayEl) close();
      });
    }
    if (modalEditArchetypesBtn) {
      modalEditArchetypesBtn.addEventListener("click", () => {
        closeBoardActionsModal();
        open();
      });
    }
  }

  return { init, open, close, isOpen };
}
