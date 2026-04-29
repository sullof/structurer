# Structurer

Structurer is a lightweight web app to build stories using multiple narrative structures.

In March 2026, I started working on a new novel and looked for a tool to help me structure the story. I found many good products online, but most were too complex and came with a steep learning curve. Then I considered the traditional approach - Post-its on a board - but I am too messy to keep that organized. I also tried visual mapping tools like Miro, but they felt too complicated for what I needed. Unhappy with every solution I tried, I ended up building my own.

It gives you a visual story where phase columns depend on the selected structure, and where you can create, edit, and move color-coded notes (plot, character, theme).

## Use It Online (Private by Design)

If you prefer, you can use Structurer directly online at [structurer.sullo.co](https://structurer.sullo.co/).

The web version keeps your work private in your browser `localStorage`: no user accounts, no server-side database, and no cookies required for story data.

## Stories in Structurer (and Demos)

Structurer revolves around **stories**: each story is a board with phase columns and notes (`plot`, `character`, `theme`, and others).

- Create and open multiple stories from the dashboard
- Pick a structure template for each story (built-in or custom)
- Edit notes, drag/reorder notes, reorder phases, and open phase detail pages (`/#/<story-slug>/phase/<n>`)
- Rename stories inline and manage per-story editor options (column size, wrapped columns, note-height mode)
- Export/import story JSON with merge support (including phase comments and schema compatibility)

Built-in structures include:
- Hero's Journey
- Hero with a Thousand Faces
- Three-Act Structure
- Save the Cat
- Story Circle
- 7-Point Story Structure
- Romancing the Beat
- MICE Quotient

You can also create and save custom structures directly in the dashboard.

Built-in demos are included as ready-to-study examples:
- Hero's Journey -> The Matrix
- Hero with a Thousand Faces -> The Odyssey (plus Harry Potter as alternative mapping)
- Three-Act Structure -> The Matrix Reloaded
- Three-Act Structure -> Jurassic Park
- Save the Cat -> Blade Runner
- Save the Cat -> The Matrix Revolutions
- Story Circle -> Finding Nemo
- 7-Point Story Structure -> The Hunger Games
- Romancing the Beat -> Pride and Prejudice
- MICE Quotient -> Inception

## Series

Structurer also supports **series**: ordered collections of stories (for trilogies, sagas, seasons, etc.).

- Create series from the dashboard and pick member stories
- Reorder stories inside a series and rename the series
- Open a series page to see all member stories in a stacked read-only preview
- Jump from series to story editor with one click
- Included demo series: **The Matrix Trilogy** (The Matrix -> The Matrix Reloaded -> The Matrix Revolutions)

## Extensions

- Curated extensions catalog: [Structurer Extensions Catalog](https://github.com/sullof/structurer-extensions/blob/main/EXTENSIONS.md)
- How to contribute extension files: [Structurer Extensions Contribution Guide](https://github.com/sullof/structurer-extensions/blob/main/CONTRIBUTING_EXTENSIONS.md)
- Import workflow in app: Dashboard `... Actions → Structure` → `Import/merge custom structures`, then `Import from a file` or `Paste custom structures JSON`
- Custom structure imports are strict-validated (invalid files fail entirely, no partial import)
- Structure merge policy: UID-first, fingerprint fallback (`name + phases`), then Last-Write-Wins by `updatedAt`

## Share a Story via Remote JSON URL

Structurer is local-first: the default robust workflow remains **Export story JSON** and **Import/merge a story**.

For a simpler sharing flow (without attaching files), you can host a story JSON on a public URL (for example GitHub raw or S3) and use the Dashboard command to generate the correct Structurer link to share:

1. Export the story from Structurer as JSON.
2. Publish that JSON file at a public HTTPS URL.
3. In Structurer open **Dashboard → ... Actions → Story → View shared story from URL**.
4. Paste the JSON URL and click **View**.
5. Structurer generates and opens the correctly encoded route (`/#/shared?src=...`): copy that URL from the address bar and share it with other people.
6. Recipients see a **read-only** board preview and can use **Import into my workspace** to save a local copy.

Notes:
- The source URL must be publicly reachable and allow browser fetches (CORS must permit it).
- If fetch fails, URL is invalid, or payload is too large, Structurer shows a status error and does not import automatically.

Example tested link:
- [Open shared story from GitHub raw JSON](https://structurer.sullo.co/#/shared?src=https%3A%2F%2Fraw.githubusercontent.com%2Fsullof%2Fstructurer-extensions%2Frefs%2Fheads%2Fmain%2Fextensions%2Fstories%2Fanalysis_the_magic_mountain.json)

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
- `npm run monitor:urls` - monitor one or more URLs and play an alert sound when a target goes down

## URL Monitor Script (local watchdog)

Run a local watchdog from your laptop to check remote endpoints continuously:

```bash
npm run monitor:urls
```

Optional environment variables:

- `DEFAULT_URLS` - URLs to monitor (space-separated in `.env`; used as default list)
- `MONITOR_URLS` - runtime override for URLs (space- or comma-separated, useful for one-off runs)
- `MONITOR_CONNECTIVITY_URLS` - comma-separated URLs used for internet pre-check (default: Google 204 + Cloudflare trace)
- `MONITOR_POLL_MS` - check interval in milliseconds (default: `3600000`, 1 hour)
- `MONITOR_TIMEOUT_MS` - request timeout in milliseconds (default: `8000`)
- `MONITOR_FAILURE_THRESHOLD` - consecutive failures before alert (default: `2`)
- `MONITOR_RESUME_GAP_FACTOR` - resume detection multiplier for sleep/wake gaps (default: `1.5`)
- `MONITOR_ALERT_SOUND_FILE` - custom local audio file path (macOS uses `afplay`)
- `MONITOR_ALERT_SOUND_CMD` - custom command to play audio (for non-macOS setups)

Example `.env`:

```dotenv
DEFAULT_URLS="https://structurer.sullo.co/ https://sullo.co/"
MONITOR_POLL_MS=3600000
MONITOR_TIMEOUT_MS=8000
MONITOR_FAILURE_THRESHOLD=2
```

Example:

```bash
MONITOR_URLS="https://site-a.com/health,https://site-b.com/" MONITOR_POLL_MS=20000 npm run monitor:urls
```

Note: every cycle starts with an internet connectivity pre-check. If connectivity is down, the script alerts once, skips target URL checks, and resumes normal checks automatically when connectivity is restored.

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
I chose to do so because I didn't want to waste too much time on it, preferring to focus on writing. The side effect is that Cursor has generated a code that is far from being optimized or efficient, and, most likely, in the future I will have to rewrite it entirely :-(

Released under the [GNU General Public License v3.0](LICENSE.md).
