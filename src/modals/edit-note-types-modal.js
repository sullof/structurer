export function createEditNoteTypesModalController({
  getAllNoteTypes,
  getBuiltinNoteTypes,
  getCustomNoteTypes,
  setCustomNoteTypes,
  saveCustomNoteTypes,
  getNoteTypeById,
  getNoteTypeColorPalette,
  parseHexColorInput,
  normalizeHexColor,
  isValidHexColor,
  isNoteTypeInUse,
  getNoteTypeOverrides,
  saveNoteTypeOverrides,
  appAlert,
  onAfterChange,
  promptCustomNoteType,
  createCustomNoteType,
  closeBoardActionsModal,
  escapeHtml,
}) {
  const modalEditNoteTypesBtn = document.querySelector("#modal-edit-note-types");
  const overlayEl = document.querySelector("#edit-note-types-modal-overlay");
  const listEl = document.querySelector("#edit-note-types-list");
  const cancelBtn = document.querySelector("#cancel-edit-note-types");
  const addBtn = document.querySelector("#add-custom-note-type-from-edit");
  const resetBuiltinBtn = document.querySelector("#reset-builtin-note-type-colors");
  const saveBtn = document.querySelector("#save-edit-note-types");

  function syncRowSwatches(row) {
    const hexInput = row.querySelector(".edit-note-type-hex-input");
    const preview = row.querySelector(".edit-note-type-swatch-preview");
    if (!hexInput || !preview) return;
    const parsed = parseHexColorInput(hexInput.value);
    if (parsed) {
      preview.style.backgroundColor = parsed;
      hexInput.value = parsed;
    }
    row.querySelectorAll(".color-swatch").forEach((btn) => {
      const c = btn.dataset.color;
      btn.classList.toggle("selected", Boolean(parsed && normalizeHexColor(c) === parsed));
    });
  }

  function fill() {
    if (!listEl) return;
    const types = getAllNoteTypes();
    const builtin = getBuiltinNoteTypes();
    const palette = getNoteTypeColorPalette();
    const paletteHtml = palette
      .map(
        (color) =>
          `<button type="button" class="color-swatch" data-role="edit-note-type-swatch" data-color="${color}" aria-label="Pick ${color}" title="${color}" style="background:${color};"></button>`,
      )
      .join("");

    listEl.innerHTML = types
      .map((t) => {
        const isBuiltin = builtin.some((b) => b.id === t.id);
        const canDeleteCustom = !isBuiltin && !isNoteTypeInUse(t.id);
        const idLabel = isBuiltin ? `Built-in · ${t.id}` : `Custom · ${t.id}`;
        const baseColor = isValidHexColor(t.color) ? t.color : "#f3f4f6";
        const currentColor = normalizeHexColor(baseColor);
        const safeId = escapeHtml(t.id);
        return `
      <div class="edit-note-type-row" data-note-type-id="${safeId}" data-is-builtin="${isBuiltin}">
        <p class="edit-note-type-row-title">${escapeHtml(idLabel)}</p>
        <div class="edit-note-type-fields">
          <div class="edit-note-type-label-field">
            <label for="ntl-${safeId}">Label</label>
            <input id="ntl-${safeId}" class="edit-note-type-label-input" type="text" maxlength="80" value="${escapeHtml(t.label)}" ${
              isBuiltin ? 'readonly aria-readonly="true" title="Built-in labels are fixed; only color can be changed."' : ""
            } />
          </div>
          <div class="edit-note-type-hex-field">
            <label for="ntc-${safeId}">Color (hex)</label>
            <div class="edit-note-type-hex-row">
              <input id="ntc-${safeId}" class="edit-note-type-hex-input" type="text" value="${escapeHtml(currentColor)}" placeholder="#RRGGBB or #RGB" autocomplete="off" />
              <span class="edit-note-type-swatch-preview" style="background-color:${escapeHtml(currentColor)}"></span>
            </div>
          </div>
          <div class="color-grid color-grid--edit-row">${paletteHtml}</div>
          ${
            canDeleteCustom
              ? `<div class="edit-note-type-row-delete"><button type="button" class="ghost-button danger-menu-item" data-role="delete-custom-note-type" data-note-type-id="${safeId}">Delete this type</button></div>`
              : ""
          }
        </div>
      </div>`;
      })
      .join("");

    listEl.querySelectorAll(".edit-note-type-row").forEach((row) => {
      syncRowSwatches(row);
    });
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

  async function resetBuiltinColors() {
    const confirmed = await appAlert("Reset all built-in note type colors to factory defaults?", { confirm: true });
    if (!confirmed) return;
    const overrides = getNoteTypeOverrides();
    getBuiltinNoteTypes().forEach((builtin) => {
      delete overrides[builtin.id];
    });
    saveNoteTypeOverrides();
    fill();
    onAfterChange();
    await appAlert("Built-in note type colors restored.");
    close();
  }

  async function save() {
    if (!listEl) return;
    const rows = listEl.querySelectorAll(".edit-note-type-row");
    const overrides = getNoteTypeOverrides();
    for (const row of rows) {
      const id = row.dataset.noteTypeId;
      const labelInput = row.querySelector(".edit-note-type-label-input");
      const hexInput = row.querySelector(".edit-note-type-hex-input");
      const label = labelInput.value.trim();
      const color = parseHexColorInput(hexInput.value);
      if (!label) {
        await appAlert(`Please enter a label for note type "${id}".`);
        labelInput.focus();
        return;
      }
      if (!color) {
        await appAlert(`Please enter a valid hex color for "${label}" (e.g. #fef08a or #rgb).`);
        hexInput.focus();
        return;
      }
      const isBuiltin = row.dataset.isBuiltin === "true";
      if (isBuiltin) {
        overrides[id] = { color };
      } else {
        const ct = getCustomNoteTypes().find((item) => item.id === id);
        if (ct) {
          ct.label = label;
          ct.color = color;
          ct.updatedAt = Date.now();
        }
      }
    }
    saveNoteTypeOverrides();
    saveCustomNoteTypes();
    close();
    onAfterChange();
  }

  function init() {
    if (listEl) {
      listEl.addEventListener("click", async (event) => {
        const delBtn = event.target.closest('[data-role="delete-custom-note-type"]');
        if (delBtn) {
          const id = delBtn.dataset.noteTypeId;
          if (!id || getBuiltinNoteTypes().some((b) => b.id === id) || isNoteTypeInUse(id)) return;
          const typeLabel = getNoteTypeById(id).label;
          const confirmed = await appAlert(`Delete note type "${typeLabel}"? This cannot be undone.`, {
            confirm: true,
          });
          if (!confirmed) return;
          setCustomNoteTypes(getCustomNoteTypes().filter((item) => item.id !== id));
          const overrides = getNoteTypeOverrides();
          delete overrides[id];
          saveCustomNoteTypes();
          saveNoteTypeOverrides();
          fill();
          onAfterChange();
          return;
        }
        const sw = event.target.closest('[data-role="edit-note-type-swatch"]');
        if (!sw) return;
        const row = sw.closest(".edit-note-type-row");
        if (!row || !listEl.contains(row)) return;
        const hexInput = row.querySelector(".edit-note-type-hex-input");
        hexInput.value = normalizeHexColor(sw.dataset.color);
        syncRowSwatches(row);
      });

      listEl.addEventListener("input", (event) => {
        if (!event.target.classList.contains("edit-note-type-hex-input")) return;
        const row = event.target.closest(".edit-note-type-row");
        if (row) syncRowSwatches(row);
      });

      listEl.addEventListener("focusout", (event) => {
        if (!event.target.classList.contains("edit-note-type-hex-input")) return;
        const parsed = parseHexColorInput(event.target.value);
        if (parsed) event.target.value = parsed;
        const row = event.target.closest(".edit-note-type-row");
        if (row) syncRowSwatches(row);
      });
    }

    if (cancelBtn) cancelBtn.addEventListener("click", () => close());
    if (saveBtn) saveBtn.addEventListener("click", () => void save());
    if (resetBuiltinBtn) resetBuiltinBtn.addEventListener("click", () => void resetBuiltinColors());
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        promptCustomNoteType().then((result) => {
          if (!result) return;
          const createdType = createCustomNoteType(result.label, result.color);
          if (!createdType) return;
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
    if (modalEditNoteTypesBtn) {
      modalEditNoteTypesBtn.addEventListener("click", () => {
        closeBoardActionsModal();
        open();
      });
    }
  }

  return { init, open, close, isOpen };
}
