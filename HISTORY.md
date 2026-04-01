# History

**1.9.2**
- **Group view clarity:** in the sequential group view, per-board **Actions** (⋯) are removed so they are not stacked next to group **Actions** in the header. Each board row keeps **Edit board**, which opens the editor where **Board actions** are available; dashboard board cards still open board actions as before.
- **Built-in note types:** added **Subplot**, **Detail**, **Todo**, and **Other** alongside Plot, Character, and Theme (default colors in `BUILTIN_NOTE_TYPES`; labels and colors remain overridable like other built-ins).

**1.9.1**
- **Page chrome:** subtle vertical pinstripes on the body background for a light “paper” feel; dashboard **Groups** and **Boards** lists no longer sit inside the same bordered card shell as create/import panels—board and group cards read directly on the page background.
- **Board editor & group preview:** phase area is a contiguous grid (hairline outer borders, square cells) with white note columns; empty phases use the `column-empty` style (`--column-empty-bg`, muted phase title) in both views. Group sequential view drops the old framed “card around each board” in favor of full-bleed grids, per-board header row (**Edit board** + **Actions**), and **Actions** in the group top bar for group-level modals.
- **Removed note insights:** the per-note writing-metrics strip and the `@chenglou/pretext` dependency are gone; the README tech stack list is updated accordingly.
- **Actions & modals:** shared overlays (board actions, add-to-group, group actions, reorder, phase-order conflict) live outside individual views so modals work from the dashboard, editor, and group routes. The editor top bar adds **Board actions** (⋯); **Edit note types** and **Reset phase order** moved here from the options menu (resize/wrap stay under **Options** on desktop). **Reset phase order** is enabled only when the board’s phase order differs from the structure default (same condition as the “(modified)” structure label); when disabled, a short tooltip explains why.
- **Add board to group:** the picker lists only groups that do not already include the board; the control is disabled with a clear tooltip when there are no eligible groups, and the modal can show an empty state if the board is already in every group.
- **Delete board:** removing a board also removes its id from every group’s membership. **Rename board** updates open editor and group titles when they refer to that board.

**1.9.0**
- Added **Edit note types** under board options: a modal lists every note type (built-in and custom) with editable label, the same color palette as custom type creation, plus direct hex input (`#RGB` / `#RRGGBB`).
- Built-in type display overrides (`label` / `color`) are stored in `localStorage` under `structurer.noteTypeOverrides.v1` without changing note `kind` ids; custom types are updated in the existing custom note types store.
- **Delete this type** appears only for custom types that are not referenced by any note on any board; built-in types cannot be removed. Full app reset clears overrides too.
- Modal layout polish: primary actions use `ghost-button` styling, spacing between Cancel/Save, and a dedicated row style for destructive delete.
- **Mobile board options:** the options menu is visible again on small viewports; **Resize columns** and **Wrap columns** are hidden there (less relevant on narrow screens), while **Edit note types** and **Reset phase order** stay available.
- On narrow viewports the board **Options** control shows the gear icon only (label hidden); the button keeps `aria-label="Options"` for accessibility.
- When opening a board (from the dashboard, a link, or group navigation), the window scrolls to the top so the editor is not left at the previous page’s scroll position.

**1.8.2**
- Fixed note collapse in group sequential view: the group board preview used `pointer-events: none`, so double-click never reached notes; preview notes now receive events, collapsed state renders like the board editor, and double-click on the note header toggles collapse (persisted on the board).
- Added a Help FAQ entry about collapsing long notes; wording describes double-click on the note header without implying read-only mode.

**1.8.1**
- Fixed note collapse on double-click of the note header: entering edit mode on the first click had replaced the header area before the second click, so double-click no longer toggled collapse. Single-click to edit is now deferred briefly so a double-click can cancel it and collapse/expand the note as before.

**1.8.0**
- Phase column titles now keep the casing from the structure configuration (built-in, custom, or imported) instead of being forced to uppercase in CSS.
- Dashboard section headings (`Groups` / `Boards`) are shown only when that section has at least one item, so empty collections do not show a redundant label.

**1.7.0**
- Improved group creation UX with a dedicated dashboard panel (`Create group`) that collects group name and board selection via checkboxes.
- Added immediate navigation to the newly created group after submit, so users get instant feedback and avoid accidental duplicate creation.
- Updated board-to-group flow: `Add board to group` is enabled only when at least one group exists, and now uses a modal picker listing existing groups.
- Added explicit feedback when trying to add a board to a group that already contains it.
- Added `Delete group` action in group actions, with explicit confirmation before removal.
- Improved dashboard clarity by separating the two collections with explicit section titles (`Groups` and `Boards`).
- Improved group card readability by listing included boards one-per-line in bold.
- Refined dashboard consistency for new controls (button alignment and panel behavior aligned with existing dashboard patterns).

**1.6.0**
- Added an in-app Help route (`/help`) with an expandable FAQ covering core concepts, workflows, import/merge strategy, and external references for story structures.
- Improved dashboard information architecture with accordion behavior for collapsible panels (opening one closes the others).
- Refined desktop dashboard density/readability by widening board/group cards and reducing unnecessary wrapping in metadata rows.
- Added a dashboard control to hide/show demo boards, persisted in settings so writers can focus on personal projects.
- Improved grouping UX with a dedicated "Create group" panel (group name + board checkboxes) directly in dashboard.
- Updated "Add board to group" flow: action is enabled only when groups exist and now opens a list-based picker modal of existing groups.
- Polished dashboard UI consistency for new controls/actions (inline hide demos link, aligned action buttons, and panel heading/button style parity).

**1.5.0**
- Added stable short `uid` identifiers with automatic migration for boards, notes, groups, custom structures, custom archetypes, and custom note types.
- Added `updatedAt` migration and tracking for notes and custom entities, laying the foundation for deterministic merge behavior.
- Upgraded import behavior from "always create new board" to merge-by-board-uid when possible.
- Implemented note-level merge by `uid` with last-write-wins based on `updatedAt`.
- Added merge safety checks that block import when structure or phase order is incompatible.
- Replaced the phase-order conflict alert with a centered comparison modal (two columns: current vs imported).
- Improved conflict readability with `01, 02, ...` indexing, first-mismatch highlighting, and a guided message to realign and retry.
- Improved dev tooling with split reset actions: full reset and "reset demos only".
- Made the dev reset flag backward compatible (`activate.reset` and legacy `activate-reset`).

**1.4.0**
- Added a new pre-built structure: Hero with a Thousand Faces (Campbell monomyth phases).
- Added a new demo board: The Odyssey (Hero with a Thousand Faces).
- Simplified demo board titles by removing redundant structure names in parentheses (structure is already shown in board metadata).

**1.3.0**
- Added board rename action from dashboard board actions modal.
- Added note collapse/expand with single-line preview and persisted collapsed state.
- Included collapsed state in board import/export payloads.
- Added phase drag-and-drop reordering per board with reset-to-default action.
- Added drag handles for notes/phases and clearer live drop placeholders during dragging.
- Added board grouping (create group from boards, group route, sequential group view, contextual back navigation).
- Added custom note types with color selection via visual color grid (non-technical UX).
- Added readable note-first UX: notes render in read mode by default and switch to full edit mode on click.
- Improved group board reorder reliability with a robust drop/dragend commit fallback.
- Added subtle reorder animations and a short "Order saved" feedback in the group reorder modal.
- Refactored the app into additional focused modules (`group-modals`, `navigation`, `board-interactions`, `board-note-actions`) to keep `main.js` maintainable.
- Improved character note readability by compacting archetype and character name into a single header label in board view.

**1.2.0**
- Reorganized project structure by introducing `src/` entrypoints (`/src/main.js`, `/src/styles.css`).
- Moved app modules and demo datasets under `src/` for a cleaner, more scalable layout.

**1.1.0**
- Refactored core code into focused modules (`app-config`, `storage`, `ui-render`, `demo-boards`).
- Improved maintainability while preserving existing behavior and data compatibility.

**1.0.0**
- Initial MVP release with dashboard, board editor, local persistence, and narrative structure support.
