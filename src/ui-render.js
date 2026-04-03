function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
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

export function boardCardTemplate(board, structureName, updatedAtText, isDemo = false, editingStoryTitleBoardId = null) {
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
          <div class="board-meta-line">${structureName} • ${noteCount} notes</div>
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

export function columnMenuTemplate(columnIndex, archetypes, noteTypes) {
  const nonCharacterTypes = noteTypes.filter((type) => type.id !== "character");
  const hasCharacter = noteTypes.some((type) => type.id === "character");
  return `
    <div class="column-menu hidden" data-role="column-menu">
      ${nonCharacterTypes
        .map(
          (type) => `<button class="menu-item" data-role="quick-add" data-kind="${type.id}" data-column="${columnIndex}">
        Add ${type.label.toLowerCase()} note
      </button>`,
        )
        .join("")}
      ${
        hasCharacter
          ? `<button class="menu-item" data-role="toggle-character-submenu">
        Add character note ▸
      </button>`
          : ""
      }
      <div class="submenu hidden" data-role="character-submenu">
        <div class="submenu-title">Choose archetype</div>
        ${archetypes
          .map(
            (archetype) => `
          <button
            class="menu-item"
            data-role="quick-add-character"
            data-column="${columnIndex}"
            data-archetype="${archetype.id}"
          >
            ${archetype.icon} ${archetype.label}
          </button>
        `,
          )
          .join("")}
        <button class="menu-item" data-role="define-custom-archetype" data-column="${columnIndex}">
          ✨ Define custom archetype...
        </button>
      </div>
      <button class="menu-item" data-role="define-custom-note-type" data-column="${columnIndex}">
        🏷️ Define custom note type...
      </button>
    </div>
  `;
}
