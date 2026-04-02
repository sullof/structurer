# Structurer

Structurer is a lightweight web app to build stories using multiple narrative structures.

It gives you a visual story where phase columns depend on the selected structure, and where you can create, edit, and move color-coded notes (plot, character, theme).

## Use It Online (Private by Design)

If you prefer, you can use Structurer directly online at [structurer.sullo.co](https://structurer.sullo.co/).

The web version keeps your work private in your browser `localStorage`: no user accounts, no server-side database, and no cookies required for story data.

## Current Features

- Landing page with product overview, privacy note, and demo map (including series demo)
- Dashboard with story list and empty state
- Dashboard top-level `... Actions` modal for creation/import/reset workflows
- Create and open multiple stories
- Choose structure per story at creation time
- Create custom structures (saved locally) with user-defined phase rows
- Story routes by slug (example: `/gatti_come_spine`)
- Home route at `/` (landing)
- Dashboard route at `/dashboard`
- Help route at `/help`
- Privacy route at `/privacy`
- Terms route at `/terms`
- Structure-driven stories with variable phase count
- Quick-add note menu on each phase
- Character notes with archetype selection
- Drag-and-drop notes across columns and within the same column (via drag handle)
- Drag-and-drop phase reordering per story (via drag handle)
- Live drag preview with visible drop placeholders for both notes and phases
- Reset phase order to the original structure order
- Open a story by clicking its tile (desktop and mobile)
- Rename story from dashboard story actions
- Export a story to JSON and import saved stories from JSON
- Dedicated phase details page (`/<story-slug>/phase/<n>`) opened from phase magnifier
- Phase details layout with read-only phase notes (context) and comment workspace
- Phase comments CRUD (add/edit/delete) with 1000-char limit per comment
- Story phase comment counters in board view
- Phase comments are phase-UID based (stable under phase reordering)
- Story import/export merge includes phase comments with LWW per comment UID (`updatedAt`)
- Export/restore full app backup (cross-device migration of complete local app state)
- Create series and manage membership/order from series actions
- Reset demos only or factory reset app data from dashboard actions
- Note collapse/expand with one-line preview (double click header), including persisted collapsed state
- Options menu:
  - Resize all columns with a slider
  - Toggle wrapped columns (multi-row) vs horizontal scroll
  - Reset phase order
- Hide demos control (hides demo stories and demo-only series)
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
- Three-Act Structure -> The Matrix Reloaded
- Three-Act Structure -> Jurassic Park
- Save the Cat -> Back to the Future
- Save the Cat -> The Matrix Revolution
- Story Circle -> Finding Nemo
- 7-Point Story Structure -> Harry Potter and the Sorcerer's Stone
- Romancing the Beat -> Pride and Prejudice
- MICE Quotient -> Inception
- Series demo -> The Matrix Trilogy (The Matrix -> The Matrix Reloaded -> The Matrix Revolution)

## Tech Stack

- Vanilla JavaScript
- Vite

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

- stories (technical key: `structurer.boards.v1`)
- UI settings (column width, wrap mode): `structurer.settings.v1`
- custom structures: `structurer.customStructures.v1`

No backend is currently used.

## Notes

- This is an early MVP and intentionally simple.
- For suggestions or feature requests, drop me a line.

## History

Version history is maintained in [HISTORY.md](HISTORY.md).

## Copyright

2026 Francesco Sullo <francesco@sullo.co> — Built with Cursor AI.

