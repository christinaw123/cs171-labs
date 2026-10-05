# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Billboard Dashboard: project context

CS171 lab: a minimal SvelteKit starter (`sv create --template minimal --no-types`) for building a linked D3 dashboard of every Billboard Hot 100 #1 song, 1958–2025. The dashboard has four views (Timeline, GenreBars, Scatter, KpiRow) coordinated by one brush filter and one hover link. `src/routes/+page.svelte` is still the default welcome page; the views have not been built yet.

## Commands

- `npm run dev` starts the Vite dev server at http://localhost:5173 (`npm run dev -- --open` opens a browser)
- `npm run build` creates a production build; `npm run preview` serves it
- `npm run prepare` runs `svelte-kit sync`, which regenerates `.svelte-kit/`

No test, lint, or format tooling is configured. `.npmrc` sets `engine-strict=true`.

## Stack

- **SvelteKit 3** (`@sveltejs/kit ^3`) on Vite 8, JavaScript only. Deployment uses `@sveltejs/adapter-auto`. There is no `svelte.config.js`; SvelteKit is configured inside `vite.config.js`.
- `jsconfig.json` extends `$app/tsconfig` (served from `node_modules/$app`) with `strict: true`.
- Svelte 5 with **runes mode forced** for all project files (`vite.config.js`). Use `$props()`, `$state()`, `$derived()`, `$effect()`, and `{@render children()}`. Legacy syntax like `export let` and `$:` will not compile.
- **Import alias is `#lib`, not `$lib`.** It is defined as Node subpath imports in `package.json` (`"#lib"` → `src/lib/index.js`, `"#lib/*"` → `src/lib/*`), e.g. `import favicon from '#lib/assets/favicon.svg'`.
- D3 v7 (the only runtime dependency) handles scales, axes, CSV loading, and brush behavior. Svelte renders data marks with `{#each}`. D3 may manage axis and brush elements only inside dedicated `<g>` elements.

## Coordination rules

- `yearRange` and `hoveredGenre` live as shared state in the page (`+page.svelte`). Each has exactly one owner.
- Filtering: `let yearRange = $state(null)` holds one inclusive `[startYear, endYear]` (single range only; no multi-range). `let filtered = $derived(yearRange ? songs.filter((d) => d.year >= yearRange[0] && d.year <= yearRange[1]) : songs)`. KpiRow, GenreBars, and Scatter receive `filtered` through `data` props. All filtered views must read this same derived subset.
- Timeline receives exactly `data={songs}` and `onbrush={(range) => (yearRange = range)}`, keeps its full year domain, and remembers its own brush position locally (for resizes). It sends `null` when cleared.
- Brush gestures: drag selects; drag the selection to move it, or its edges to resize; click anywhere without dragging clears, including inside the selection (a full 1958–2025 selection has no outside area). No clear button.
- Clear cue: while hovering the selection, it turns red (`#d1242f`) and the cursor becomes a white × on a red circle. No extra badges or text. Edge handles keep d3's `ew-resize` cursor.
- Year edges: each year owns the band year ± 0.5. A brushed year must be within 0.25 of its dot, so 1958 and 2025 stay selectable at the plot edges.
- The brush overlay covers the timeline points, so hovering shows a readout (guide line + "1975: 35 #1 songs") instead of `<title>` tooltips.
- GenreBars: each genre's whole row (label, bar, count) is the hover/focus target, so 1-song bars (~1px wide) can be hovered. Rows are keyboard-focusable; focus acts like hover.
- Use `plural()` from `data.js` for counts in text ("1 song", "2 songs").
- Genre colors: use `genreColor()` from `data.js` everywhere (GenreBars, Scatter, KpiRow). Keyed by genre name, never by rank, so filtering never repaints a genre. Only the four largest genres get hues (Pop, Rock, Funk/Soul, Electronic/Dance); more than four categorical hues fail colorblind checks in the dense scatterplot. All other genres share gray `#a8aeb5`; Unlabeled is drawn as an outline in `#6e7781`. Scatter has a legend; hovered songs get a dark ring so gray genres still stand out.
- Scatter size: radius = `d3.scaleSqrt().domain([0, max weeksAtNumberOne of the current data]).range([0, 10])`, so circle area is proportional to weeks at #1. Domain and range must start at 0. The size legend (1, 5, 10 weeks + the current max) uses the same `radius` scale. Circles are drawn largest-first so small ones stay visible (reordered, never filtered).
- Above the KPIs and above the genre/scatter pair, a label says "Showing songs from 1990–1999" (or "Showing all years") and is highlighted while a range is active. While a range is selected, the Timeline grays out unselected years (full data still drawn) and labels the selection above the brush.
- **Linking = highlight:** dim non-matches, remove nothing. **Filtering = remove** non-matches and recompute aggregates. When describing or building a feature, say which one it is.

## Git workflow

- After each feature is checked and working, remind the user to run `git add -A && git commit`.
- Prefer small, single-purpose commits with clear messages.
- If a change breaks an interaction, inspect `git diff` first. Before restoring an earlier version, explain what will be discarded and let the user save any work they want to keep.

## Data

`static/billboard_hot_100_no1.csv` is served from the site root; load it client-side with `d3.csv('/billboard_hot_100_no1.csv')` inside `onMount`. `billboard_README.md` is the full data dictionary.

- 1,177 rows, **one per song** (the week it *reached* #1), 105 columns, ~2.3 MB. Use only: `Date`, `Song`, `Artist`, `Weeks at Number One`, `CDR Genre`, `BPM`, `Energy`, `Danceability`, `Happiness`, `Acousticness`, `Loudness (dB)`, `Length (Sec)`.
- Every value loads as a string; convert numeric columns and parse `Date`.

### Quirks a correct dashboard must handle

- **Two-digit years:** `Date` looks like `4-Aug-58`. `d3.timeParse("%d-%b-%y")` maps `00`–`68` to 2000–2068, so `58` becomes 2058. Parse so 1958 stays 1958 (e.g. any year > 2025 → subtract 100). The time axis must run 1958 → 2025.
- **Songs vs. weeks:** a row count per year is "#1 songs per year", not "weeks at #1" (`Weeks at Number One`, 1–19, heavily skewed). Every view must state which measure it shows.
- **Genre:** `CDR Genre` is multi-valued (41 values contain `;`, e.g. `Pop;Rock`) and blank for 88 rows. Primary genre = text before the first `;`; blank → `"Unlabeled"`, included in counts. State this rule on the dashboard.
- **Different units:** `Energy`, `Danceability`, `Happiness`, `Acousticness` share a 0–100 scale; `BPM`, `Loudness (dB)`, and `Length (Sec)` each have their own units. Never put different-unit fields on one shared scale.
- **Only #1 songs:** the data describes chart-toppers, not the Hot 100 or music in general. Don't word charts as "what music sounded like."

## Definition of done

- `npm run dev` runs with no console errors, including during interaction.
- Four views: Timeline, GenreBars, Scatter, KpiRow; one brush filter and one hover link.
- Filtered views recompute over the subset; clearing the brush restores all songs.
