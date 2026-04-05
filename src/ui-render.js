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
export function boardCardTemplate(
  board,
  structureLineHtml,
  updatedAtText,
  isDemo = false,
  editingStoryTitleBoardId = null,
  isAiAnalysisImport = false,
) {
  const noteCount = board.notes.length;
  const safeTitle = escapeHtml(board.title);
  const titleMarkup =
    board.id === editingStoryTitleBoardId
      ? `<input class="inline-story-title-input board-card-title-input" type="text" maxlength="80" value="${escapeHtml(board.title)}" data-role="inline-story-title-input" data-board-id="${board.id}" aria-label="Story name" />`
      : `<span class="board-card-title-text" data-role="board-title-dblclick" data-board-id="${board.id}">${safeTitle}</span>`;
  const userCardClass = !isDemo && !isAiAnalysisImport ? " board-card-user" : "";
  return `
    <article class="board-card${userCardClass}" data-board-id="${board.id}" role="button" tabindex="0" aria-label="Open ${safeTitle}">
      <div>
        <strong><div class="inline-story-title-root" data-role="inline-story-title-root" data-board-id="${board.id}"><span class="inline-story-title-host" data-role="inline-story-title-host">${isDemo ? '<span class="demo-label">Demo</span> ' : ""}${isAiAnalysisImport ? '<span class="analysis-label">AI analysis</span> ' : ""}${titleMarkup}</span></div></strong>
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

/** Dashboard-only card after the story list: opens Build AI import prompt. */
export function dashboardAiPromptCtaCardTemplate() {
  return `
    <article class="board-card board-card-ai-prompt-cta" data-role="dashboard-ai-prompt-cta" role="button" tabindex="0" aria-label="Open Build AI import prompt">
      <div>
        <strong><span class="board-card-ai-prompt-cta-title">Want analyses that aren’t in the demos?</span></strong>
        <div class="board-meta">
          <div class="board-meta-line">
            Click here to build a prompt for an AI assistant, then import the JSON into Structurer.
          </div>
        </div>
      </div>
    </article>
  `;
}

/** Trash icon for delete-note — ✕ reads as “close” on mobile and caused mistaken deletions. */
const NOTE_DELETE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`;

/** Corner lines similar to the native textarea resize grip (adaptive note height). */
const NOTE_TEXT_RESIZE_HANDLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 13 L13 3" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/><path d="M6.5 13 L13 6.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/><path d="M10 13 L13 10" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg>`;

export function noteTemplate(
  note,
  archetypes,
  archetype,
  noteType,
  isEditing = false,
  legacyFullHeightNoteCards = false,
) {
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

  const adaptiveHeightStyle = note.customHeight
    ? `height: ${note.customHeight}px; max-height: none;`
    : "";
  const legacyTextareaStyle = note.customHeight ? `height: ${note.customHeight}px;` : "";

  const legacyNoteBody =
    isEditing
      ? `<textarea
        data-role="text"
        data-note-id="${note.id}"
        style="${legacyTextareaStyle}"
        placeholder="Write your note..."
      >${note.text || ""}</textarea>`
      : `<div class="note-readonly-text">${(note.text || "").trim() || " "}</div>`;

  const adaptiveNoteBody =
    isEditing
      ? `<textarea
        class="note-text-body note-text-body--adaptive"
        data-role="text"
        data-note-id="${note.id}"
        style="${adaptiveHeightStyle}"
        placeholder="Write your note..."
      >${note.text || ""}</textarea>`
      : `<div class="note-readonly-text note-text-body note-text-body--adaptive" data-note-id="${note.id}" style="${adaptiveHeightStyle}">${(note.text || "").trim() || " "}</div>`;

  const adaptiveWrap = legacyFullHeightNoteCards
    ? legacyNoteBody
    : `<div class="note-adaptive-wrap">${adaptiveNoteBody}<button type="button" class="note-text-resize-handle" data-role="note-text-resize-grip" data-note-id="${note.id}" title="Drag to resize height" aria-label="Resize note text height" draggable="false">${NOTE_TEXT_RESIZE_HANDLE_SVG}</button></div>`;

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
          ${isEditing ? `<button type="button" class="delete" data-role="delete" title="Delete note" aria-label="Delete note">${NOTE_DELETE_ICON_SVG}</button>` : ""}
        </div>
      </div>
      ${characterUI}
      ${collapsed ? "" : adaptiveWrap}
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
