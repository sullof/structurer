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

Version history is maintained in [HISTORY.md](HISTORY.md).

## Copyright

2026 Francesco Sullo <francesco@sullo.co> — Built with Cursor AI.

