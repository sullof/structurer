function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

/** @returns {[number, number, number] | null} */
function parseNoteTypeHex(hex) {
  const raw = String(hex ?? "").trim();
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) {
    h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function normalizedNoteTypeHex(hex) {
  const rgb = parseNoteTypeHex(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function inkForNoteTypeBackground(hex) {
  const rgb = parseNoteTypeHex(hex);
  if (!rgb) return "#111827";
  const [r, g, b] = rgb;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq > 165 ? "#111827" : "#f9fafb";
}

export function renderStructureOptionsHtml(structures, selectedId) {
  return structures
    .map((structure) => {
      const selectedAttr = structure.id === selectedId ? "selected" : "";
      return `<option value="${structure.id}" ${selectedAttr}>${structure.name}</option>`;
    })
    .join("");
}

export function structurePhaseRowTemplate(index, phase = { title: "", description: "" }) {
  const title = escapeHtml(phase.title ?? "");
  const description = escapeHtml(phase.description ?? "");
  return `
    <div class="structure-phase-row">
      <span class="phase-row-index">${index + 1}.</span>
      <input
        type="text"
        class="structure-phase-name-input"
        data-role="phase-input"
        maxlength="80"
        placeholder="Phase name"
        value="${title}"
        required
        aria-label="Phase name"
      />
      <textarea
        class="structure-phase-description-input"
        data-role="phase-description-input"
        maxlength="1200"
        rows="2"
        placeholder="Optional help text for this column"
        aria-label="Phase description (optional)"
      >${description}</textarea>
      <button type="button" class="ghost-button structure-phase-remove-btn" data-role="remove-phase-row" aria-label="Remove row">✕</button>
    </div>
  `;
}

/**
 * Phase row for editing a per-story altered structure: tracks `data-structure-phase-origin` (structure index) or empty for new rows.
 * Remove is disabled when the phase is not empty on the board.
 */
export function structureAlteredEditPhaseRowTemplate(
  rowIndex,
  phase = { title: "", description: "" },
  structurePhaseOrigin,
  canRemove,
) {
  const title = escapeHtml(phase.title ?? "");
  const description = escapeHtml(phase.description ?? "");
  const originAttr =
    structurePhaseOrigin === null || structurePhaseOrigin === undefined
      ? ""
      : ` data-structure-phase-origin="${Number(structurePhaseOrigin)}"`;
  const removeDisabled = canRemove ? "" : " disabled";
  const removeTitle = canRemove
    ? ' title="Remove row"'
    : ' title="You can remove this phase only when it has no notes and no phase comments in this story."';
  return `
    <div class="structure-phase-row"${originAttr}>
      <span class="phase-row-index">${rowIndex + 1}.</span>
      <input
        type="text"
        class="structure-phase-name-input"
        data-role="phase-input"
        maxlength="80"
        placeholder="Phase name"
        value="${title}"
        required
        aria-label="Phase name"
      />
      <textarea
        class="structure-phase-description-input"
        data-role="phase-description-input"
        maxlength="1200"
        rows="2"
        placeholder="Optional help text for this column"
        aria-label="Phase description (optional)"
      >${description}</textarea>
      <button type="button" class="ghost-button structure-phase-remove-btn" data-role="remove-phase-row" aria-label="Remove row"${removeDisabled}${removeTitle}>✕</button>
    </div>
  `;
}

/** @param structureLineHtml — escaped name plus optional UI markers (e.g. altered suffix span); not double-escaped */
export function boardCardTemplate(board, structureLineHtml, updatedAtText, isDemo = false, editingStoryTitleBoardId = null) {
  const noteCount = board.notes.length;
  const safeTitle = escapeHtml(board.title);
  const titleMarkup =
    board.id === editingStoryTitleBoardId
      ? `<input class="inline-story-title-input board-card-title-input" type="text" maxlength="80" value="${escapeHtml(board.title)}" data-role="inline-story-title-input" data-board-id="${board.id}" aria-label="Story name" />`
      : `<span class="board-card-title-text" data-role="board-title-dblclick" data-board-id="${board.id}">${safeTitle}</span>`;
  return `
    <article class="board-card" data-board-id="${board.id}" role="button" tabindex="0" aria-label="Open ${safeTitle}">
      <div>
        <strong><div class="inline-story-title-root" data-role="inline-story-title-root" data-board-id="${board.id}"><span class="inline-story-title-host" data-role="inline-story-title-host">${isDemo ? '<span class="demo-label">Demo</span> ' : ""}${titleMarkup}</span></div></strong>
        <div class="board-meta">
          <div class="board-meta-line">${structureLineHtml} • ${noteCount} notes</div>
          <div class="board-meta-line">Updated ${updatedAtText}</div>
        </div>
      </div>
      <div class="board-actions">
        <button type="button" class="action-button" data-role="board-actions" aria-label="Story actions">
          <span class="action-icon" aria-hidden="true">⋯</span>
        </button>
      </div>
    </article>
  `;
}

export function noteTemplate(note, archetypes, archetype, noteType, isEditing = false) {
  const collapsed = Boolean(note.collapsed);
  const textPreview = (note.text || "").trim();
  const characterLabel =
    note.kind === "character"
      ? [archetype?.label || "", note.characterName || ""]
          .map((part) => part.trim())
          .filter(Boolean)
          .join(" - ") || "Character"
      : "";
  const collapsedPreview =
    note.kind === "character"
      ? characterLabel || textPreview || "Character note"
      : textPreview || "Empty note";

  const characterUI =
    isEditing && !collapsed && note.kind === "character"
      ? `
      <div class="character-fields">
        <select data-role="archetype" aria-label="Character archetype">
          ${archetypes
            .map(
              (a) =>
                `<option value="${a.id}" ${
                  a.id === (note.archetype || "none") ? "selected" : ""
                }>${a.icon} ${a.label}</option>`,
            )
            .join("")}
        </select>
        <input
          type="text"
          data-role="character-name"
          value="${note.characterName || ""}"
          placeholder="Character name"
          aria-label="Character name"
        />
      </div>
    `
      : "";

  return `
    <article class="note ${collapsed ? "is-collapsed" : ""}${isEditing ? " is-note-editing" : ""}" data-id="${note.id}" data-kind="${note.kind}" draggable="true" style="--note-bg: ${
    noteType?.color || "#f3f4f6"
  };">
      <div class="note-head">
        <button class="phase-drag" data-role="note-drag-handle" title="Drag note">⋮⋮</button>
        ${collapsed ? `<div class="collapsed-preview" title="${collapsedPreview}">${collapsedPreview}</div>` : ""}
        ${
          !collapsed
            ? `<span class="badge">${
                note.kind === "character"
                  ? `${archetype.icon ? `${archetype.icon} ` : ""}${characterLabel}`
                  : noteType?.label || "Note"
              }</span>`
            : ""
        }
        <div class="note-head-actions">
          ${isEditing ? '<button class="delete" data-role="delete" title="Delete note">✕</button>' : ""}
        </div>
      </div>
      ${characterUI}
      ${
        collapsed
          ? ""
          : isEditing
            ? `<textarea
        data-role="text"
        data-note-id="${note.id}"
        style="${note.customHeight ? `height: ${note.customHeight}px;` : ""}"
        placeholder="Write your note..."
      >${note.text || ""}</textarea>`
            : `<div class="note-readonly-text">${(note.text || "").trim() || " "}</div>`
      }
    </article>
  `;
}

/** Body markup for the centered “add note” modal (not embedded in column — avoids overflow clipping). */
export function addNoteModalBodyTemplate(columnIndex, archetypes, noteTypes) {
  const nonCharacterTypes = noteTypes.filter((type) => type.id !== "character");
  const hasCharacter = noteTypes.some((type) => type.id === "character");
  const typeGrid =
    nonCharacterTypes.length === 0
      ? ""
      : `
      <div class="add-note-modal-type-grid" role="group" aria-label="Note type">
        ${nonCharacterTypes
          .map((type) => {
            const bg = normalizedNoteTypeHex(type.color) || "#f3f4f6";
            const fg = inkForNoteTypeBackground(type.color);
            const safeBg = escapeHtml(bg);
            const safeFg = escapeHtml(fg);
            return `<button
        type="button"
        class="add-note-modal-type-chip"
        data-role="quick-add"
        data-kind="${escapeHtml(type.id)}"
        data-column="${columnIndex}"
        style="background-color: ${safeBg}; color: ${safeFg};"
      >
        ${escapeHtml(type.label)}
      </button>`;
          })
          .join("")}
      </div>`;
  return `
    <div class="add-note-modal-body" data-role="add-note-modal-body">
      ${typeGrid}
      ${
        hasCharacter
          ? `
      <div class="add-note-modal-divider" role="presentation"></div>
      <p class="add-note-modal-section-title">Character</p>
      <div class="add-note-modal-archetype-grid" role="group" aria-label="Archetype">
        ${archetypes
          .map((archetype) => {
            const icon = archetype.icon ? String(archetype.icon).trim() : "";
            const iconHtml = icon
              ? `<span class="add-note-modal-archetype-icon" aria-hidden="true">${escapeHtml(icon)}</span>`
              : `<span class="add-note-modal-archetype-icon add-note-modal-archetype-icon--placeholder" aria-hidden="true"></span>`;
            return `<button
        type="button"
        class="add-note-modal-archetype-chip"
        data-role="quick-add-character"
        data-column="${columnIndex}"
        data-archetype="${escapeHtml(archetype.id)}"
      >
        ${iconHtml}<span class="add-note-modal-archetype-label">${escapeHtml(archetype.label)}</span>
      </button>`;
          })
          .join("")}
      </div>`
          : ""
      }
    </div>
  `;
}
