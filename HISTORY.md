# History

**1.19.1** - 2026-04-08
- **Reusable title-line component baseline:** extracted a shared `titleLineTemplate` (badge + title) and wired it into editor/group/shared title rendering to reduce duplicated markup and prepare the next refactor steps (`ui-render.js`, `main.js`).
- **Actions/modals refactor baseline:** moved shared-story actions/options menu behavior into a dedicated controller and extracted story export/slug dialogs into a modal module, reducing UI/event complexity in `main.js` while preserving behavior (`shared-view-actions.js`, `modals/story-action-modals.js`, `main.js`).
- **Dashboard actions modal extraction:** moved dashboard actions modal open/close logic and exclusive accordion behavior into a dedicated controller module, keeping interactions unchanged while shrinking `main.js` responsibilities (`modals/dashboard-actions-modal.js`, `main.js`).
- **Custom archetype management:** added **Edit archetypes** in story actions with a dedicated modal to rename custom archetypes and delete them only when unused by character notes (built-ins remain read-only) (`index.html`, `main.js`, `styles.css`).
- **Edit archetypes modal controller extraction:** moved edit-archetype modal rendering/events into a dedicated module to reduce orchestration code in `main.js` while preserving current UX and data rules (`modals/edit-archetypes-modal.js`, `main.js`).
- **Edit note types modal controller extraction:** moved note-type modal rendering/events (swatches, add custom type, save/reset flows) into a dedicated module to further reduce UI complexity in `main.js` without changing behavior (`modals/edit-note-types-modal.js`, `main.js`).
- **Dashboard create/import flow controller extraction:** centralized open/close orchestration for dashboard create/import/paste/series modals into a dedicated module, keeping current behavior while reducing modal-flow logic in `main.js` (`modals/dashboard-flow-modals.js`, `main.js`).
- **Foldered import surface:** introduced organized entry folders (`core`, `controllers`, `ui`, `features`) and switched main wiring imports to these paths for readability, while keeping behavior unchanged (`src/*`, `main.js`).
- **Folder migration in progress:** physically migrated selected modules (`core/storage`, `features/ai-story-analysis-prompt`, `features/structure-metadata`, `controllers/shared-view-actions`, `ui/modal-scroll-lock`) with compatibility re-exports from legacy root paths to keep imports stable while completing the reorganization (`src/*`).
- **Folder migration continued (controllers):** physically migrated `board-interactions` and `board-note-actions` into `src/controllers` and converted legacy root files into compatibility re-exports to keep current imports stable while reducing root-level source clutter (`src/controllers/*`, `src/board-*.js`).
- **Escape handling for actions modals:** fixed global `Esc` behavior so story/group/dashboard actions-related overlays close reliably (matching outside-click behavior) and consume handled `Escape` events to avoid focus-only side effects (`main.js`).
- **Shared URL actions made explicit again:** replaced the shared-view `... Actions` dropdown with always-visible topbar buttons (**Save bookmark** and **View source**) to improve discoverability for first-time users arriving from external links, while keeping existing bookmark/open-source behavior unchanged (`index.html`, `styles.css`, `controllers/shared-view-actions.js`).
- **Shared bookmarks card width parity on dashboard:** fixed `#shared-bookmarks-list` grid columns to match stories/series card sizing, so a single shared bookmark card no longer expands full-width (`styles.css`).

**1.18.8** - 2026-04-08
- **Shared view actions/menu refinement:** on shared-story pages, actions now live in a unified **… Actions** menu on desktop and **…** on mobile, with **Open original JSON** and **Save bookmark** as menu items. After saving, **Save bookmark** hides immediately (no refresh needed) (`index.html`, `main.js`).
- **Shared preview layout parity with regular stories:** shared read-only boards now use the same contiguous phase-grid treatment as regular/group stories, including full-width horizontal span (no extra side inset and no legacy rounded-column look) (`styles.css`).
- **Mobile topbar consistency pass:** on small screens the text **Back** button is hidden globally (only contextual arrow remains). Story/group/shared topbars now use compact left-side controls with right-aligned title/subtitle blocks; shared title is split into three readable lines (badge, title, structure) (`styles.css`, `main.js`).
- **Shared bookmark card affordance fix:** shared bookmark titles no longer show inline-rename hover/cursor styling, avoiding false “editable” affordance (`styles.css`).
- **Help copy update for shared links:** FAQ/landing copy now describes the shared-link + dashboard bookmark flow and removes outdated direct-import implications from shared preview (`index.html`).
- **Shared view options parity:** shared pages now expose an **Options** menu with **Resize columns** and **Wrap columns** (same behavior as regular stories), while still omitting story-specific note-height controls (`index.html`, `main.js`, `styles.css`).

**1.18.7** - 2026-04-08
- **Shared story comments in read-only preview:** `/#/shared?src=...` now renders phase comments under each phase (simple readonly block), including comments keyed by modern `phaseUids` and legacy numeric keys. The comment section label is now **COMMENTS (N)** and comment text is slightly smaller than note text for visual hierarchy (`main.js`, `styles.css`).
- **Shared URL bookmarks instead of direct import from preview:** removed **Import into my workspace** from the shared-story page and added **Save in bookmarks**. Saved shared URLs now appear on the dashboard under **Shared bookmarks** (labelled **Shared**), where they can be reopened anytime to check updates; bookmarks can also be removed from that list (`index.html`, `main.js`).

**1.18.6** - 2026-04-08
- **Stable story links after rename:** story title inline rename no longer updates `slug`, so the hash route stays stable and shared URLs keep working after title edits (`inline-title-edit.js`, `main.js`).
- **Story actions URL management:** in story actions, section **Story & export** is now **Story** and includes **Change story URL** to update slug explicitly; when changed on the open story, the route updates immediately and export filename follows the story slug (`index.html`, `main.js`).
- **Export flow polish:** export now skips the extra options dialog when there are no phase comments, improving reliability of direct JSON download for stories without comments (`main.js`).
- **Change URL dialog clarity:** added allowed-characters help (`a-z`, `0-9`, `_`), live URL preview above the input with stronger emphasis, and preserved free typing in the input (no cursor jump while typing) (`main.js`).

**1.18.5** - 2026-04-07
- **Shared JSON validation errors:** shared-story preview now distinguishes clearer failures for empty/non-JSON files, malformed/corrupted JSON, and JSON payloads that are valid but not Structurer story exports (`main.js`).
- **Dashboard-first validation for shared URLs:** **View shared story from URL** now validates fetch + JSON shape before navigation. If invalid, Structurer stays on the dashboard and shows an alert; it opens the shared read-only page only when the story JSON is valid (`main.js`).

**1.18.4** - 2026-04-07
- **First phase-comment privacy notice:** when focusing the phase-comment textarea for the first time on a device/browser, Structurer now shows a one-time notice that comments are local-only unless the story JSON is explicitly exported and shared (`main.js`).

**1.18.3** - 2026-04-07
- **Share preview metadata + favicon:** added app favicon plus Open Graph/Twitter metadata in `index.html` (including homepage screenshot) so shared links have richer unfurl/preview cards across platforms.
- **Stable preview asset URLs:** moved favicon and social preview screenshot to `public/` and updated meta/icon paths to fixed URLs (`/favicon.png`, `/home-screenshot.png`) so Vite builds no longer produce rotating hashed paths for these share-critical assets.

**1.18.2** - 2026-04-06
- **Optional comments in story export:** exporting a story now opens a small options dialog with **Export phase comments too** enabled by default. If unchecked, Structurer exports the story JSON without `phaseComments`/`phaseCommentsVersion`, making it easier to share cleaner files when comments are private (`main.js`).
- **Shared preview UX refinement:** when `/#/shared?src=...` loads successfully, the temporary status line is hidden (the page title already communicates read-only mode). If the same story was already imported, Structurer now shows an inline **Open it** link in the note so you can jump directly to the local story (`index.html`, `main.js`).
- **Story export comments reliability:** fixed the export options fallback so, when **Export phase comments too** is selected (default), comments are reliably included in the generated story JSON (`main.js`).
- **Shared-link privacy canonicalization:** on app load, legacy shared URLs that pass `src` via `location.search` are automatically rewritten to hash form (`/#/shared?src=...`) for compatibility, and non-hash tracking query params (e.g. `fbclid`) are removed when a hash route is present (`main.js`, `navigation.js`).

**1.18.1** - 2026-04-06
- **Shared import navigation:** after importing from `/#/shared?src=...` via **Import into my workspace**, Structurer now opens the imported/merged story directly (fallback: dashboard) instead of leaving users on the shared preview page (`main.js`).

**1.18.0** - 2026-04-06
- **Create story without a predefined structure:** in **Create a new story**, the structure select now includes **No structure (start from scratch)**. Choosing it opens a follow-up dialog to define a private altered structure for that story (`main.js`).
- **Unstructured flow starts with 1+ phase:** the start-from-scratch dialog allows creating a story with a single initial phase (and optional phase descriptions), then extending phases later while editing the story (`main.js`).
- **Built-in note types expanded for generic documents:** added **Time**, **Topic**, **Question**, and **Reference** to the default note kinds so Structurer works better beyond narrative-only use cases (`app-config.js`).
- **Minor UX polish:** added spacing between the phase list and **Add row** actions in structure-style forms/modals (`styles.css`).
- **Edit note types reset action:** added **Reset built-in colors** in the note-type editor modal to restore factory colors for built-in kinds without affecting custom note types (`index.html`, `main.js`).

**1.17.1** - 2026-04-06
- **Shared story navigation polish:** breadcrumb now includes **Dashboard** (`Home > Dashboard > Shared story`) for consistency with other app views.
- **Shared story actions cleanup:** removed the extra **Back to home** button from shared preview commands; the view now focuses on **Open source JSON** and **Import into my workspace**.
- **Landing cards visual tweaks:** removed forced minimum height so cards size to content, and gave **AI-assisted analysis flow** a dedicated post-it color not reused by other landing cards.
- **Built-in note types (generic docs + stories):** added four default kinds — **Time**, **Topic**, **Question**, and **Reference** — to better support non-narrative workflows (timelines, research notes, source tracking) while keeping the built-in set concise (`app-config.js`).

**1.17.0** - 2026-04-06
- **Privacy-first routing:** switched app navigation from pathname routes to hash routes (`#/...`), so story/group slugs are kept in the URL fragment instead of request paths (`navigation.js`, `main.js`).
- **Client navigation events:** route sync now follows `hashchange` (instead of `popstate`) and internal navigation writes `window.location.hash`, preserving existing view logic for landing/dashboard/help/editor/series/phase/404 screens (`main.js`, `navigation.js`).
- **Nginx legacy path redirect:** direct requests like `/group/...`, `/<story-slug>`, and `/<story-slug>/phase/N` are redirected to `/#/...` via `nginx/default.conf`, while `/` still serves `index.html` normally (`nginx/default.conf`, `server.sh` mount unchanged).
- **Shared remote story preview (read-only):** added `/#/shared?src=<https-url>` route that fetches a public Structurer story JSON (e.g. raw GitHub/S3), validates/parses it client-side, and renders a non-editable board preview with **Import into my workspace** and **Open source JSON** actions. Invalid URLs, fetch failures, and oversized payloads show clear status messages (`index.html`, `main.js`, `navigation.js`).
- **Dashboard action for shared-story links:** under **⋯ Actions → Story**, new **View shared story from URL** command opens a small input dialog; after pasting a public JSON URL and confirming, Structurer navigates to the correctly encoded `/#/shared?src=...` route automatically (no manual URL formatting required) (`index.html`, `main.js`).
- **Edit note types safety:** built-in note type labels are now fixed (read-only in the modal) and only their colors can be changed. Save logic now persists color-only overrides for built-ins, and legacy label overrides are ignored, preventing confusing cases like id `plot` shown with a different built-in label (`main.js`).
- **Landing page refresh:** expanded home/landing copy so recent capabilities are visible at first glance: hash-route privacy note (`/#/...`), dashboard flow for shared JSON URL previews, and a short AI-assisted analysis prompt callout (`index.html`).

**1.16.1** - 2026-04-04
- Editor: scroll to new note and focus its textarea; viewport auto-scroll while dragging notes or phases.
- Editor: default **full height** (classic): note text grows with content, no capped scroll. **Capped** height (scroll inside, ~32vh / 260px cap) and the resize grip **also when the note is not in edit mode** are **per story** via **Options → Note height mode** (open story only). Built-in demos use capped mode. Story JSON may include optional `adaptiveNoteHeights: true`; full app backup no longer stores a global note-height flag (`legacyFullHeightNoteCards` is ignored if still present in old settings).
- Editor: short notes stay content-sized in capped mode; resize can reset to auto; character archetype chips in add-note modal work when clicking icon/label.
- Editor: opening edit on a collapsed note expands it; collapsing a note exits edit mode.

**1.16.0** - 2026-04-05
- Story export/import: **schemaVersion 3** with **`structureId`**; older imports unchanged; v3 resolves by id; AI import prompt updated accordingly.
- Structure template packs: **`structurer.structure`** export/import (plus legacy **`structurer.custom-structures`**); skip built-in ids on import; download as **`{structureId}.json`**.
- Dashboard: **Available structures** refreshes right after **Add a structure not listed**.

**1.15.8** - 2026-04-05
- **Build AI import prompt:** new **Language of the analysis text** control (preset languages plus **Other…** with a custom name). The generated instructions stay in English; the prompt tells the model to write each note’s `text` (and similar prose) in the chosen language while keeping JSON keys, `kind` / `archetype` ids, and the exact `structure` string unchanged (`index.html`, `main.js`, `ai-story-analysis-prompt.js`). Help FAQ on mapping a work to a structure mentions this option.
- **Build AI import prompt:** the list of note **kind** ids and character **archetype** ids in the generated prompt uses only **built-in** app defaults (`BUILTIN_NOTE_TYPES`, `BUILTIN_ARCHETYPES` from `app-config.js`), not custom note types, custom archetypes, or per-user label overrides—so local customization does not leak into the LLM instructions (`main.js`).

**1.15.7** - 2026-04-05
- **Dashboard — import story:** a single entry under **⋯ Actions → Story**: **Import/merge a story** (removed the separate **Import/merge pasting JSON** action). The follow-up dialog title is **Import/merge a story**; buttons are **Import from a file** and **Paste story JSON**. Help FAQ and **Build AI import prompt** steps updated to match.
- **Dashboard — import custom structures:** same pattern as stories — one **⋯ Actions → Structure** command **Import/merge custom structures**, then a chooser (**Import from a file** / **Paste custom structures JSON**). Removed the direct **Import/merge pasting JSON** action; paste modal title is **Paste custom structures JSON**. **`#import-custom-structures-input`** lives in the chooser modal (`main.js`, `index.html`).
- **Import hygiene (story + custom structures):** pasted or file text is trimmed to the substring from the **first `{`** through the **last `}`** before `JSON.parse`, so common LLM wrappers (e.g. `json` + fenced blocks, intro/outro) do not break import (`stripLeadingTrailingOutsideJsonObject` in `main.js`).
- **Help FAQ:** *I created a story or a custom structure. Can I share it just by sending a link?* — explains local-only storage, that URLs do not transfer data, and points to **story export/import** and **Export / Import custom structures** for templates (`index.html`).
- **404:** Unknown routes no longer redirect silently to the landing page or dashboard. The app shows a **Page not found** screen and keeps the URL in the address bar. Paths that look like a story, phase, or series link (e.g. `/my_story`, `/group/…`, `/slug/phase/1`) get a second message explaining that data lives only in the sender’s browser and that recipients need **JSON export/import**; other bad URLs get a short generic message. **Go to dashboard**, **Back to home**, and (sharing variant) **Open Help**; no top Back/breadcrumb bar on that screen (`index.html`, `navigation.js`, `main.js`, `styles.css`).

**1.15.6** - 2026-04-04
- **Series demo:** **The Matrix Trilogy** is created again on load when the three Matrix demo boards exist; `ensureMatrixTrilogySeriesDemo` now matches the third film title **The Matrix Revolutions** (plural), same as `matrix-revolution-save-the-cat-demo.json`. Landing **Demo map** and **README** use the same spelling.
- **Dashboard — order:** **Stories** and **Series** list in three blocks: **your** stories first, **AI analysis** imports second, **demos** last; within each block, **updated** date descending (`main.js`).
- **Dashboard — borders:** **Darker gray border** (`board-card-user`) on story cards that are **your** work only (not demo, not AI import) and on **Series** that include **at least one** such story, for consistency next to **[Demo]** / **AI analysis** cards (`ui-render.js`, `main.js`, `styles.css`).

**1.15.5** - 2026-04-04
- **Delete note:** trash control now uses `closest('[data-role="delete"]')` so clicks on the SVG paths inside the button reliably delete the note (`board-note-actions.js`).
- **Dashboard — Stories & Series:** boards and groups that include **any** non-demo, non–AI-analysis story list **first**; curated-only demo/AI rows follow. Within each block, order is still by **updated** date descending.

**1.15.4** - 2026-04-04
- **Demos:** replaced **Back to the Future (Save the Cat)** with **Blade Runner (Save the Cat)** (`blade-runner-save-the-cat-demo.json`). Detailed beat-by-beat analysis covering all 15 columns with plot, character, theme, location, subplot, and detail notes. Landing **Demo map** and **README** updated. On load, the new demo is **appended** automatically; existing installs can **Reset demos** to remove Back to the Future.
- **Demos (content):** expanded all remaining built-in demo story JSON to the same kind of depth as **Blade Runner** (many more notes per phase, mix of **plot**, **character**, **theme**, **location**, **subplot**, and **detail** where it fits the work). Updated: **Finding Nemo** (Story Circle), **The Hunger Games** (7-Point), **Jurassic Park** and **The Matrix Reloaded** (Three-Act), **Inception** (MICE Quotient), **The Matrix Revolutions** (Save the Cat), **The Matrix** and **The Godfather** (Hero’s Journey), **Pride and Prejudice** (Romancing the Beat), **The Odyssey** and **Harry Potter** (Hero with a Thousand Faces). Demo JSON no longer uses the removed **`other`** note kind. **Reset demo story** / **Reset demos** pick up the new text from `src/data/*-demo.json`.
- **Note types:** removed the built-in **Other** type (phase descriptions cover general commentary; **Todo** remains for actionable items). Notes with legacy `kind: "other"` still display via the existing unknown-type fallback.

**1.15.3** - 2026-04-04
- **AI analysis imports:** story JSON from the **Build AI import prompt** flow should include root **`"aiAnalysisImport": true`**. Import stores it on the board; **export** preserves it. **Merge** updates or clears the flag when the import payload includes `aiAnalysisImport`.
- **Visibility:** boards with that flag are hidden together with demos when the dashboard control reads **Hide demos and AI analyses** / **Show demos and AI analyses** (label falls back to **Hide demos** / **Show demos** when you have no AI-tagged boards). **Series** that contain only demo and/or AI-analysis stories are hidden when that toggle hides curated content.
- **UI:** **AI analysis** badge (indigo pill) on dashboard cards, editor header, and series previews (alongside **Demo** when applicable). **Reset demo story** clears `aiAnalysisImport` on that board.
- **Docs:** Help and **After the AI returns JSON** explain the flag and the toggle.

**1.15.2** - 2026-04-04
- **Navigation:** **Back** uses browser **history** (`history.back()`). **Breadcrumb** to the right of Back on dashboard, help, legal pages, **Build AI import prompt**, series, story editor, and phase detail: **Home** / **Dashboard** (clickable) plus current page; dashboard shows **Home > Dashboard** only. Breadcrumb **hidden below 641px**; **←** stays for mobile, **hidden on desktop** where the breadcrumb appears.
- **Dashboard — Stories:** trailing **CTA card** (same `board-card` layout as stories) invites users who want analyses beyond the demos to open **Build AI import prompt**; **Stories** heading stays visible so the card always has a place.
- **Build AI import prompt:** shorter intro; **After the AI returns JSON** block with import steps; path **⋯ Actions → Story → Import/merge pasting JSON**. Help FAQ and extension copy updated for **⋯ Actions → Structure** where relevant.
- **Actions labels (Story / Structure):** **Import/merge pasting JSON** (story paste modal and direct dashboard action; `aria-label` distinguishes story vs structure). **Import/merge a custom structure** (file). Structure paste modal title matches; **README** / **HISTORY** cross-references refreshed.

**1.15.1** - 2026-04-04
- **Demos:** added **The Godfather** on **Hero's Journey** (`the-godfather-hero-journey-demo.json`). Landing **Demo map** updated. On load, any **new** demo definition in `DEMO_BOARD_DATA` that is not already present (same title + structure name) is **appended** automatically so existing installs pick it up without a full **Reset demos**.

**1.15.0** - 2026-04-04
- **Build AI import prompt** (`/build-analysis-prompt`): pick a **catalog structure** (built-in + custom, not per-story altered), enter the **work title** and optional **medium**, then copy a ready-made **LLM prompt** that asks for **only JSON** matching Structurer’s minimal story import shape (`title`, `structure` name, `notes` with `kind` / `column` / `order` / `text`, plus character fields when needed). Includes current **note type** and **archetype** ids. **Copy prompt** uses the clipboard when available.
- **Help**: new FAQ *The work I want to analyze is not in the demos…* with a button to open **Build AI import prompt**; short note on verifying AI output and copyright. Import/merge FAQ mentions **file** vs **paste JSON**.
- **Import story (paste JSON)**: dashboard **Actions → Story → Import story (paste JSON)** and **Import/merge** dialog (**Paste story JSON** next to file import). Same validation and merge behavior as file import (including phase-order conflict modal). Escape and overlay dismiss clear the textarea.

**1.14.5** - 2026-04-04
- **Built-in note types:** added **Location** and **Milestone** (`BUILTIN_NOTE_TYPES` in `app-config.js`).

**1.14.4** - 2026-04-04
- **Delete note control**: while editing a note, the header control is a **trash-can icon** (SVG) instead of **✕**, which many users read as “close” and tapped by mistake on mobile. **`aria-label="Delete note"`**, **`title`**, and a slightly larger **tap target** with subtle danger hover styling.
- **Phase description indicator (ⓘ)**: in the column header, the icon is again **to the left of the phase title** (before the label in the toggle button DOM order). It had ended up visually **next to the magnifier / +** because the title span grew with **`flex: 1`** and pushed the indicator to the trailing edge.

**1.14.3** - 2026-04-04
- **Modals (mobile)**: with a dialog open, touch-scrolling on the dimmed backdrop no longer scrolls the page behind it. A **`MutationObserver`** toggles document scroll lock (`position: fixed` on **`body`** + saved **`scrollY`**) whenever any **`.modal-overlay`** loses or gains **`.hidden`**. Overlays also use **`overscroll-behavior: contain`** where the overlay itself scrolls.

**1.14.2** - 2026-04-04
- **Mobile story editor header**: on narrow viewports, the **Demo** badge, **story title**, and **structure name** line are **center-aligned** between the back and actions buttons. Series and phase views keep the previous **right-aligned** header treatment.
- **Dashboard — structure preview** (Available structures): on **narrow viewports**, long descriptions no longer clip on the right. The preview dialog is a flex child, so default **`min-width: auto`** could keep it wider than the screen; added **`min-width: 0`**, **`max-width: 100%`**, and **`overflow-wrap: break-word`** on the modal and copy blocks so text wraps inside the viewport.
- **Dashboard — add / edit structure** (wide modals): on **`max-width: 640px`**, the sheet is **edge-to-edge** with **safe-area padding**; the **whole overlay scrolls** as one page. The inner **phase list** no longer uses its own scroll region (avoids cramped layout and action buttons overlapping fields). Desktop behavior is unchanged (viewport-height cap; only the phase list scrolls).

**1.14.1** - 2026-04-04
- **Story editor layout**: the phase grid again uses the **full content width** (edge-to-edge with the app chrome), matching the series view. Negative horizontal margins moved from **`#board`** to **`.editor-board-scroller`**, because **`overflow-x: auto`** on the scroller was clipping the board’s bleed and kept columns narrow with cramped note text.

**1.14.0** - 2026-04-04
- **Altered structures** (per-story): from **Story actions**, **Use altered structure for this story** copies the current template into a structure **used only by that story** (new `id`/`uid`, auto-named e.g. `Hero's Journey 2`). Altered structures **do not appear** in **Available structures** or the **new story** structure picker; **Export custom structures** omits them. **Double-click** the structure line under the story title to **rename** when it is altered (built-in templates stay read-only there).
- **Lifecycle**: deleting the story or **resetting a demo** removes its altered structure; **orphan** altered rows are pruned on load if no board references their `ownerBoardUid`.
- **Story export/import**: exports include an **`alteredStructure`** block (name, phases, optional description/author, `updatedAt`) when applicable; **merge** can refresh an altered definition when the import carries `alteredStructure` and phase counts match. Stories that already use an altered template still merge when the file has no `alteredStructure` block (local template is kept).
- **Story editor layout**: avoided `overflow-x` on `#editor-view` (it became a scroll container and broke flex height, so the footer could overlap content). Wide boards scroll inside **`.editor-board-scroller`** around `#board`; the board stays **`overflow: visible`** so UI is not clipped. Footer keeps **`margin-top: auto`** on short pages.
- **Add note** (column **+**): opens a **centered modal** instead of a column dropdown (no overflow clipping). **Note types** are a **compact color grid** (label only, type colors + readable text). **Character** archetypes use the character color; **archetype rows** are **short** with the **emoji left of the label** (invisible width placeholder when there is no icon so names align). Title is **Add note to {phase name}**; the extra “note type” heading was removed.
- **Custom note type & archetype**: creation uses **`appDialog`** (no `window.prompt`). Custom note type is **one** dialog with **name + color** swatches; the old **Choose a color** modal was removed. Swatch **selection** uses an **inset** ring and grid padding so the stroke is not cut off by the alert scroll area.
- **Story actions** (⋯): reorganized like **dashboard Actions** — **accordion sections** (only one open), intro line, same section styling; **Add custom note type** and **Add custom archetype** live under **Note types & archetypes** (they only create definitions; they no longer add a note from the column). **Story & export** is **penultimate**, before **Danger zone**; **Demo** stays its own section when the story is a demo. Story-actions overlay uses the same **scroll / safe-area** behavior as the dashboard actions overlay.
- **Help**: FAQ *How do I create custom note types and custom archetypes?* points to **Actions → Note types & archetypes**.
- **Phase column order**: dragging phases to reorder is allowed only when the story uses an **altered structure** (the **⋮⋮** handle next to the phase title is hidden otherwise). **Reset phase order** in Story actions still restores the template order whenever the stored order differs (including legacy non-altered stories).

**1.13.3** - 2026-04-03
- **Story editor**: notes in **read-only** mode use a **pointer** cursor so it is clear you can **click a note to edit**; **editing** mode keeps the normal default/text cursors on fields. **Series** board preview notes keep the default cursor (double-click header still toggles collapse).
- **First-time editor tip**: the first time you open a story, a **high-contrast bar** at the **top** of the editor explains clicking a note to edit and using **+** in a column header to add a note; **Got it** dismisses it permanently (`structurer.editorQuickHelpDismissed.v1` in `localStorage`). The flag is cleared on **full backup restore** and **factory reset** so the tip can appear again after a clean reinstall-style reset.

**1.13.2** - 2026-04-03
- **Custom structures** (`structurer.custom-structures`): **export** now sets **`schemaVersion`: `2`** (was `1`) so the file format matches optional structure-level **`description`** and **`author`** introduced in 1.13.1; the `structures` array contract is unchanged.
- **Import** now **validates `schemaVersion`**: **`1`**, **`2`**, or **omitted** (legacy files) are accepted; any other value fails with a clear error. Older exports without the field or with `1` continue to import as before.

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
- Added a second import path for custom structures: paste JSON directly in dashboard actions (`Import/merge pasting JSON` under Structure), reusing the same strict validation and merge logic.
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
