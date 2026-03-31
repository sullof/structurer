export function renderStructureOptionsHtml(structures, selectedId) {
  return structures
    .map((structure) => {
      const selectedAttr = structure.id === selectedId ? "selected" : "";
      return `<option value="${structure.id}" ${selectedAttr}>${structure.name}</option>`;
    })
    .join("");
}

export function structurePhaseRowTemplate(index, value = "") {
  return `
    <div class="structure-phase-row">
      <span class="phase-row-index">${index + 1}.</span>
      <input
        type="text"
        data-role="phase-input"
        maxlength="80"
        placeholder="Phase name"
        value="${value}"
        required
      />
      <button type="button" class="ghost-button" data-role="remove-phase-row" aria-label="Remove row">✕</button>
    </div>
  `;
}

export function kindLabel(kind) {
  if (kind === "plot") return "Plot";
  if (kind === "character") return "Character";
  return "Theme";
}

export function boardCardTemplate(board, structureName, updatedAtText) {
  const noteCount = board.notes.length;
  return `
    <article class="board-card" data-board-id="${board.id}" role="button" tabindex="0" aria-label="Open ${board.title}">
      <div>
        <strong>${board.title}</strong>
        <div class="board-meta">
          <div class="board-meta-line">${structureName} • ${noteCount} notes</div>
          <div class="board-meta-line">Updated ${updatedAtText}</div>
        </div>
      </div>
      <div class="board-actions">
        <button type="button" class="action-button" data-role="board-actions" aria-label="Board actions">
          <span class="action-icon" aria-hidden="true">⋯</span>
          <span class="action-label">Actions</span>
        </button>
      </div>
    </article>
  `;
}

export function noteTemplate(note, archetypes, archetype) {
  const characterUI =
    note.kind === "character"
      ? `
      <div class="character-fields">
        <input
          type="text"
          data-role="character-name"
          value="${note.characterName || ""}"
          placeholder="Character name"
          aria-label="Character name"
        />
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
      </div>
    `
      : "";

  return `
    <article class="note" data-id="${note.id}" data-kind="${note.kind}" draggable="true">
      <div class="note-head">
        <span class="badge">${kindLabel(note.kind)} ${
          note.kind === "character" && archetype.icon ? archetype.icon : ""
        }</span>
        <button class="delete" data-role="delete" title="Delete note">✕</button>
      </div>
      ${characterUI}
      <textarea
        data-role="text"
        data-note-id="${note.id}"
        style="${note.customHeight ? `height: ${note.customHeight}px;` : ""}"
        placeholder="Write your note..."
      >${note.text || ""}</textarea>
    </article>
  `;
}

export function columnMenuTemplate(columnIndex, archetypes) {
  return `
    <div class="column-menu hidden" data-role="column-menu">
      <button class="menu-item" data-role="quick-add" data-kind="plot" data-column="${columnIndex}">
        Add plot note
      </button>
      <button class="menu-item" data-role="quick-add" data-kind="theme" data-column="${columnIndex}">
        Add theme note
      </button>
      <button class="menu-item" data-role="toggle-character-submenu">
        Add character note ▸
      </button>
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
    </div>
  `;
}
