# Structurer

Structurer is a lightweight web app to build stories using narrative structures, starting with **Hero's Journey**.

It gives you a visual board with 12 phases (columns) where you can create, edit, and move color-coded notes (plot, character, theme).

## Current Features

- Dashboard with board list and empty state
- Create and open multiple boards
- Board routes by slug (example: `/gatti_come_spine`)
- Dashboard route at `/dashboard`
- 12-phase Hero's Journey board
- Quick-add note menu on each phase
- Character notes with archetype selection
- Drag-and-drop notes across columns and within the same column
- Options menu:
  - Resize all columns with a slider
  - Toggle wrapped columns (multi-row) vs horizontal scroll
- Persistence via `localStorage`

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

No backend is currently used.

## Notes

- This is an early MVP and intentionally simple.
- The architecture is ready to support additional story structures beyond Hero's Journey.
- For suggestions or feature requests, drop me a line.

## Copyright

2026 Francesco Sullo <francesco@sullo.co> — Built with the phenomenal help by Cursor AI in less than an hour

