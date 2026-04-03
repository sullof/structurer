# History

**1.13.1** - 2026-04-03
- **Structure-level metadata** (separate from per-phase text): each structure can have an optional **`description`** (short “about this template”) and optional **`author`** / credit. Built-in presets in `app-config` now include curated descriptions and attribution lines.
- **Custom structures**: **Add a structure not listed** adds optional **About this structure** and **Credit / author** fields after the name; values are validated client-side (max lengths, no `http`/`https`/`//` URLs or risky schemes/HTML patterns). **Author** accepts plain text or a single `Name <email@domain>` pair; the same rules apply on **import**.
- **Import / export** (`structurer.custom-structures`): exported JSON includes `description` and `author` when set; import validates them with the same rules. On merge, if a key is present in the file, it updates or clears the stored field; omitted keys leave existing metadata unchanged.
- **Structure preview** modal (dashboard **Available structures**): shows the structure description and credit under the title when present; removed the extra subtitle line (*Read-only reference. Each phase becomes…*).

**1.13.0** - 2026-04-03
- **Series rename** in **Edit series** via the **Series name** field; **story rename** by double-clicking the title (dashboard, editor header, or series view); the title becomes an inline field (Enter to save, Escape to cancel, blur to save). **Rename story** removed from Story actions. Help FAQ *How do I rename a story or a series?* added.
- Added optional per-phase guidance in structures: each phase can now be either a string (title only) or an object with `title` and optional `description`; phase descriptions are shown only when provided, so existing structures keep working unchanged.
- In the board editor, phase descriptions can be toggled by clicking the phase title; the description appears directly under the header row and uses full column width, with top-aligned header actions preserved.
- Added persistence for open phase-help panels in local storage (`structurer.phaseHelpOpen.v1`), restored per board when returning to a story; state is cleared by full backup restore/factory reset flows.
- Deleting a story now opens a confirmation modal with a required acknowledgement checkbox before **Delete story** is enabled; series deletion is unchanged (still a simple confirm).
- Replaced native `window.alert` / `window.confirm` with in-app dialogs: `appAlert(message)` for notices and `appAlert(message, { confirm: true })` for **Cancel / Confirm** (returns a boolean), including queues and Escape coordinated with other modals.
- Added **`appDialog({ title, message, render, confirmLabel, cancelLabel })`** for reusable custom modal bodies: `render(root, api)` builds DOM under `#app-alert-custom-root` and returns a getter run on **Confirm**; `api.setConfirmEnabled` toggles the confirm button (e.g. after picking an option).
- **Series actions**: **Reorder stories** is now **Edit series** — one dialog to reorder (drag by the handle), remove a story (✕), or add a story from a bottom select; the separate **Remove story** action is removed.
- **Remove custom structures** (dashboard **Actions → Structure**): **Remove a structure** is enabled only when at least one custom structure is unused by any story; pick structures with checkboxes, **Proceed**, then confirm the list before deletion. Activity timestamps for removed structures are cleared from `structurer.customStructureActivity.v1`.
- **Dashboard Actions** modal reorganized into accordion sections — **Story**, **Series**, **Structure**, **Backup & data** — with a short intro line; only one section stays open at a time; expanded bodies use a gray panel with white command buttons; the modal grows with content and the overlay scrolls on small viewports (no inner list scroll). Fixed a CSS specificity bug where the overlay stayed visible after **Close** because `display: flex` overrode `.hidden`; closing the dialog also collapses all sections.
- **Add a structure not listed**: the structure name field appears first, then the phase hint; each phase row is stacked again (phase name on the first row, optional description on the second).

**1.12.5** - 2026-04-03
- Updated repository links from `StructurerHQ` to `sullof` across app docs and in-app links.
- Reordered dashboard sections for clearer flow: **Stories** first, then **Series**; moved `Hide demos` below series.
- Improved dashboard structure section: renamed it to **Available structures**, added a link to the extensions catalog, and introduced a subtle visual divider for readability.
- Added a **Demo** label for demo stories (dashboard cards and story page title) and demo-only series cards.
- Refined dashboard card typography: slightly increased separation between title and metadata and tuned the demo badge size for better readability.

**1.12.4** - 2026-04-03
- Refreshed the landing hero styling: the **Open dashboard** button now uses a soft green pill design instead of dark black, and home cards use flat pastels derived from note colors instead of cool gradients.
- Renamed landing card CSS classes to semantic content-based names (`card-privacy`, `card-portable`, `card-about-demos`, `card-demo-map`) for clearer styling intent and easier maintenance.

**1.12.3** - 2026-04-03
- Upgraded demo content to better showcase rich use of structures:
  - Back to the Future (Save the Cat) now includes more granular beats, character notes with archetypes, and explicit theme/subplot notes around family and destiny.
  - Finding Nemo (Story Circle) emphasizes Marlin/Dory/Nemo character arcs per ring, plus tank-gang subplot and thematic notes on control vs trust.
  - Harry Potter and the Sorcerer's Stone now appears as a Hero with a Thousand Faces demo (alongside The Odyssey) with expanded notes across Campbell phases.
  - Pride and Prejudice (Romancing the Beat) maps key romance beats with character/theme/subplot notes for Elizabeth/Darcy and ensemble.
  - Inception (MICE Quotient) separates Milieu/Idea/Character/Event threads with clearer notes per strand.
  - The Odyssey (Hero with a Thousand Faces) gains additional notes for crew, Nausicaa, Sirens/Scylla/Charybdis, and the Argos/Telemachus/home-restoration cluster.
- Changed the 7-Point Story Structure demo from Harry Potter to The Hunger Games, which follows a clearer seven-point arc; Harry Potter remains as an alternative mapping under Hero with a Thousand Faces.
- Added a per-story **Reset this demo story** action in Story actions (⋯) that restores only that demo from its JSON template when applicable.
- Improved dashboard hover feedback: story/series cards now warm-highlight on hover and their titles adopt the link color, making them feel more obviously clickable without changing layout.

**1.12.2** - 2026-04-02
- Removed the previous 1000-character limit on phase comments (add form and inline edit); character count is still shown as a live length without a cap.

**1.12.1** - 2026-04-02
- Help: added FAQ *I don't speak English. Where can I find structures in my language?* (built-in presets are in English; non-English structures come from imported extensions, with a pointer to the following FAQ on extensions and import).

**1.12.0** - 2026-04-02
- Added dashboard actions to export and import custom structures as a dedicated JSON package (`structurer.custom-structures`).
- Added strict import validation for custom structures (required fields, id/uid format, non-empty phase arrays, duplicate checks, and built-in id conflict checks): if any entry is invalid, the full import fails.
- Added custom-structure merge behavior with deterministic outcomes: merge by structure UID first, fallback by normalized fingerprint (name + phases), and last-write-wins by `updatedAt`.
- Added a second import path for custom structures: paste JSON directly in dashboard actions (`Import custom structure (paste JSON)`), reusing the same strict validation and merge logic.
- Moved the extensions catalog and JSON packs to a dedicated repository ([structurer-extensions](https://github.com/sullof/structurer-extensions) under **sullof**); the main app repo no longer ships extension JSON files. Help/FAQ/README link to the external catalog and the main app under `sullof/structurer`.
- Added dashboard **Active structures**: a compact multi-column list of all available structure names (built-in + custom), with a **NEW** badge for recently added or imported custom structures (based on local activity timestamps within the last hour, without overwriting merge `updatedAt` semantics). Stored activity in `localStorage` under `structurer.customStructureActivity.v1`, included in full app backup/restore.
- Refreshed the dashboard after custom-structure import so **Active structures** updates immediately; user-facing import alerts use plain-language success/skip/error messages instead of raw Created/Updated/Skipped counts.
- Improved dashboard readability: more padding inside story/series cards and the Active structures panel; empty-state copy now refers to **... Actions** and stays visible until the user has at least one non-demo story.
- Help FAQ: extensions section mentions both file import and paste-JSON import.

**1.11.0** - 2026-04-02
- Added a dedicated phase details route (`/<story-slug>/phase/<n>`) opened from each phase magnifier, with contextual back navigation to the story.
- Replaced the initial phase comments modal with a full page split layout: read-only notes for the selected phase (context pane) and a separate comments workspace.
- Added phase comments CRUD (add/edit/delete) with max length validation and compact icon-based edit/delete actions.
- Added board-level phase comment counters so each phase surfaces how many comments are attached.
- Introduced stable per-phase UIDs (`phaseUids`) and migrated phase comments to phase-identity storage so comments remain attached to the correct phase after phase reordering.
- Extended story export/import payloads to include phase UIDs and phase comments.
- Extended merge logic to include phase comments with last-write-wins by comment UID and `updatedAt`, including safe migration from legacy column-index keyed comments.

**1.10.1** - 2026-04-02
- Added full app backup export from dashboard actions (`Export full app backup`), producing a single JSON file with stories, series, settings, custom structures/archetypes/note types, note type overrides, and demo tracking ids.
- Added full app restore from dashboard actions (`Restore from full backup`) for device migration scenarios: restore clears local app data on the current device and replaces it with backup data, then reloads the app.

**1.10.0** - 2026-04-02
- Renamed Boards to Stories in the user-facing UI (FAQ, dashboard, modals, and commands).
- Renamed Groups to Series in the user-facing UI (dashboard, modals, and FAQ).
- Added footer utility links (`Privacy Policy — Terms and conditions — Help`) and new SPA routes/pages for `/privacy` and `/terms`.
- Added a dedicated, irreversible Factory Reset confirmation modal with explicit warning text and required acknowledgement checkbox before enabling reset.
- Expanded and reordered Help FAQ content (including demo-edit guidance and local data reset guidance) for a clearer learning path.
- Added dashboard-level `... Actions` control and migrated dashboard creation/import/series/reset workflows into modal-driven flows (command list + detail modals).
- Improved dashboard command consistency by removing legacy bottom expandable panels for import/create series/reset.
- Improved dashboard demo filtering: `Hide demos` now hides both demo stories and demo-only series.
- Polished interaction feedback and visual consistency: broader hover states across app buttons and updated link color strategy (crimson links with footer github link exception).
- Updated landing/demo communication to include the Series demo entry (`The Matrix Trilogy`) in the demo map.

**1.9.4** - 2026-04-01
- **Empty phases:** columns with no notes use the same white background as filled columns (instead of a grey fill), and phase titles are no longer muted—so new boards and sparse grids read brighter in the editor and in group preview.
- **Demo boards:** sample notes using **Subplot**, **Detail**, and **Other** (plus existing plot/character/theme) were added to the Matrix, Odyssey, Finding Nemo, and Jurassic Park demos so new installs and “reset demos” show the expanded palette; **Todo** is omitted there since it models the writer’s own tasks, not in-world story beats.

**1.9.2** - 2026-04-01
- **Group view clarity:** in the sequential group view, per-board **Actions** (⋯) are removed so they are not stacked next to group **Actions** in the header. Each board row keeps **Edit board**, which opens the editor where **Board actions** are available; dashboard board cards still open board actions as before.
- **Built-in note types:** added **Subplot**, **Detail**, **Todo**, and **Other** alongside Plot, Character, and Theme (default colors in `BUILTIN_NOTE_TYPES`; labels and colors remain overridable like other built-ins).

**1.9.1** - 2026-04-01
- **Page chrome:** subtle vertical pinstripes on the body background for a light “paper” feel; dashboard **Groups** and **Boards** lists no longer sit inside the same bordered card shell as create/import panels—board and group cards read directly on the page background.
- **Board editor & group preview:** phase area is a contiguous grid (hairline outer borders, square cells) with white note columns; empty phases use the `column-empty` style (`--column-empty-bg`, muted phase title) in both views. Group sequential view drops the old framed “card around each board” in favor of full-bleed grids, per-board header row (**Edit board** + **Actions**), and **Actions** in the group top bar for group-level modals.
- **Removed note insights:** the per-note writing-metrics strip and the `@chenglou/pretext` dependency are gone; the README tech stack list is updated accordingly.
- **Actions & modals:** shared overlays (board actions, add-to-group, group actions, reorder, phase-order conflict) live outside individual views so modals work from the dashboard, editor, and group routes. The editor top bar adds **Board actions** (⋯); **Edit note types** and **Reset phase order** moved here from the options menu (resize/wrap stay under **Options** on desktop). **Reset phase order** is enabled only when the board’s phase order differs from the structure default (same condition as the “(modified)” structure label); when disabled, a short tooltip explains why.
- **Add board to group:** the picker lists only groups that do not already include the board; the control is disabled with a clear tooltip when there are no eligible groups, and the modal can show an empty state if the board is already in every group.
- **Delete board:** removing a board also removes its id from every group’s membership. **Rename board** updates open editor and group titles when they refer to that board.

**1.9.0** - 2026-04-01
- Added **Edit note types** under board options: a modal lists every note type (built-in and custom) with editable label, the same color palette as custom type creation, plus direct hex input (`#RGB` / `#RRGGBB`).
- Built-in type display overrides (`label` / `color`) are stored in `localStorage` under `structurer.noteTypeOverrides.v1` without changing note `kind` ids; custom types are updated in the existing custom note types store.
- **Delete this type** appears only for custom types that are not referenced by any note on any board; built-in types cannot be removed. Full app reset clears overrides too.
- Modal layout polish: primary actions use `ghost-button` styling, spacing between Cancel/Save, and a dedicated row style for destructive delete.
- **Mobile board options:** the options menu is visible again on small viewports; **Resize columns** and **Wrap columns** are hidden there (less relevant on narrow screens), while **Edit note types** and **Reset phase order** stay available.
- On narrow viewports the board **Options** control shows the gear icon only (label hidden); the button keeps `aria-label="Options"` for accessibility.
- When opening a board (from the dashboard, a link, or group navigation), the window scrolls to the top so the editor is not left at the previous page’s scroll position.

**1.8.2** - 2026-04-01
- Fixed note collapse in group sequential view: the group board preview used `pointer-events: none`, so double-click never reached notes; preview notes now receive events, collapsed state renders like the board editor, and double-click on the note header toggles collapse (persisted on the board).
- Added a Help FAQ entry about collapsing long notes; wording describes double-click on the note header without implying read-only mode.

**1.8.1** - 2026-04-01
- Fixed note collapse on double-click of the note header: entering edit mode on the first click had replaced the header area before the second click, so double-click no longer toggled collapse. Single-click to edit is now deferred briefly so a double-click can cancel it and collapse/expand the note as before.

**1.8.0** - 2026-04-01
- Phase column titles now keep the casing from the structure configuration (built-in, custom, or imported) instead of being forced to uppercase in CSS.
- Dashboard section headings (`Groups` / `Boards`) are shown only when that section has at least one item, so empty collections do not show a redundant label.

**1.7.0** - 2026-04-01
- Improved group creation UX with a dedicated dashboard panel (`Create group`) that collects group name and board selection via checkboxes.
- Added immediate navigation to the newly created group after submit, so users get instant feedback and avoid accidental duplicate creation.
- Updated board-to-group flow: `Add board to group` is enabled only when at least one group exists, and now uses a modal picker listing existing groups.
- Added explicit feedback when trying to add a board to a group that already contains it.
- Added `Delete group` action in group actions, with explicit confirmation before removal.
- Improved dashboard clarity by separating the two collections with explicit section titles (`Groups` and `Boards`).
- Improved group card readability by listing included boards one-per-line in bold.
- Refined dashboard consistency for new controls (button alignment and panel behavior aligned with existing dashboard patterns).

**1.6.0** - 2026-04-01
- Added an in-app Help route (`/help`) with an expandable FAQ covering core concepts, workflows, import/merge strategy, and external references for story structures.
- Improved dashboard information architecture with accordion behavior for collapsible panels (opening one closes the others).
- Refined desktop dashboard density/readability by widening board/group cards and reducing unnecessary wrapping in metadata rows.
- Added a dashboard control to hide/show demo boards, persisted in settings so writers can focus on personal projects.
- Improved grouping UX with a dedicated "Create group" panel (group name + board checkboxes) directly in dashboard.
- Updated "Add board to group" flow: action is enabled only when groups exist and now opens a list-based picker modal of existing groups.
- Polished dashboard UI consistency for new controls/actions (inline hide demos link, aligned action buttons, and panel heading/button style parity).

**1.5.0** - 2026-04-01
- Added stable short `uid` identifiers with automatic migration for boards, notes, groups, custom structures, custom archetypes, and custom note types.
- Added `updatedAt` migration and tracking for notes and custom entities, laying the foundation for deterministic merge behavior.
- Upgraded import behavior from "always create new board" to merge-by-board-uid when possible.
- Implemented note-level merge by `uid` with last-write-wins based on `updatedAt`.
- Added merge safety checks that block import when structure or phase order is incompatible.
- Replaced the phase-order conflict alert with a centered comparison modal (two columns: current vs imported).
- Improved conflict readability with `01, 02, ...` indexing, first-mismatch highlighting, and a guided message to realign and retry.
- Improved dev tooling with split reset actions: full reset and "reset demos only".
- Made the dev reset flag backward compatible (`activate.reset` and legacy `activate-reset`).

**1.4.0** - 2026-04-01
- Added a new pre-built structure: Hero with a Thousand Faces (Campbell monomyth phases).
- Added a new demo board: The Odyssey (Hero with a Thousand Faces).
- Simplified demo board titles by removing redundant structure names in parentheses (structure is already shown in board metadata).

**1.3.0** - 2026-04-01
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

**1.2.0** - 2026-03-31
- Reorganized project structure by introducing `src/` entrypoints (`/src/main.js`, `/src/styles.css`).
- Moved app modules and demo datasets under `src/` for a cleaner, more scalable layout.

**1.1.0** - 2026-03-31
- Refactored core code into focused modules (`app-config`, `storage`, `ui-render`, `demo-boards`).
- Improved maintainability while preserving existing behavior and data compatibility.

**1.0.0** - 2026-03-31
- Initial MVP release with dashboard, board editor, local persistence, and narrative structure support.
