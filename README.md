# Structurer

Structurer is a lightweight web app to build stories using multiple narrative structures.

It gives you a visual board where phase columns depend on the selected structure, and where you can create, edit, and move color-coded notes (plot, character, theme).

## Use It Online (Private by Design)

If you prefer, you can use Structurer directly online at [structurer.sullo.co](https://structurer.sullo.co/).

The web version keeps your work private in your browser `localStorage`: no user accounts, no server-side database, and no cookies required for board data.

## Current Features

- Landing page with product overview, privacy note, and demo map by structure
- Dashboard with board list and empty state
- Create and open multiple boards
- Choose structure per board at creation time
- Create custom structures (saved locally) with user-defined phase rows
- Board routes by slug (example: `/gatti_come_spine`)
- Home route at `/` (landing)
- Dashboard route at `/dashboard`
- Structure-driven boards with variable phase count
- Quick-add note menu on each phase
- Character notes with archetype selection
- Drag-and-drop notes across columns and within the same column (via drag handle)
- Drag-and-drop phase reordering per board (via drag handle)
- Live drag preview with visible drop placeholders for both notes and phases
- Reset phase order to the original structure order
- Open a board by clicking its tile (desktop and mobile)
- Rename board from dashboard board actions
- Export a board to JSON and import saved boards from JSON
- Note collapse/expand with one-line preview (double click header), including persisted collapsed state
- Options menu:
  - Resize all columns with a slider
  - Toggle wrapped columns (multi-row) vs horizontal scroll
  - Reset phase order
- Persistence via `localStorage`

## Pre-Built Structures

- Hero's Journey
- Hero with a Thousand Faces
- Three-Act Structure
- Save the Cat
- Story Circle
- 7-Point Story Structure
- Romancing the Beat
- MICE Quotient

You can also create and save your own custom structures directly in the dashboard.

## Included Demos

- Hero's Journey -> The Matrix
- Hero with a Thousand Faces -> The Odyssey
- Three-Act Structure -> Jurassic Park
- Save the Cat -> Back to the Future
- Story Circle -> Finding Nemo
- 7-Point Story Structure -> Harry Potter and the Sorcerer's Stone
- Romancing the Beat -> Pride and Prejudice
- MICE Quotient -> Inception

## Tech Stack

- Vanilla JavaScript
- Vite
- [`@chenglou/pretext`](https://www.npmjs.com/package/@chenglou/pretext) for text measurement insights

## Run Locally

### 1) Install dependencies

```bash
npm install
```

### 2) Start development server

```bash
npm run dev
```

Then open the local URL shown in terminal (usually `http://localhost:5173`).

### 3) Build for production

```bash
npm run build
```

### 4) Preview production build

```bash
npm run preview
```

## Project Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - create production build in `dist/`
- `npm run preview` - preview production build locally

## Data Storage

All data is stored in browser `localStorage`:

- boards: `structurer.boards.v1`
- UI settings (column width, wrap mode): `structurer.settings.v1`
- custom structures: `structurer.customStructures.v1`
- optional dev reset flag: `activate.reset`

No backend is currently used.

## Notes

- This is an early MVP and intentionally simple.
- For suggestions or feature requests, drop me a line.

## History

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

## Copyright

2026 Francesco Sullo <francesco@sullo.co> — Built with Cursor AI.

