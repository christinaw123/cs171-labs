# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Quake Encoding: project context

CS171 lab: a minimal SvelteKit starter (created with `sv create --template minimal --no-types`) for building a D3 visualization of earthquake data. `src/routes/+page.svelte` loads the CSV and passes the rows as a `data` prop to `src/lib/Scatterplot.svelte`, which draws a world bubble map.

## Commands

- `npm run dev` starts the Vite dev server at http://localhost:5173 (`npm run dev -- --open` opens a browser)
- `npm run build` creates a production build; `npm run preview` serves it
- `npm run prepare` runs `svelte-kit sync`, which regenerates `.svelte-kit/` (types and tsconfig that `jsconfig.json` extends)

No test, lint, or format tooling is configured.

## Stack

- SvelteKit on Vite, JavaScript only, no TypeScript (`checkJs: false`). Deployment uses `@sveltejs/adapter-auto`.
- Svelte 5 with **runes mode forced** for all project files (`vite.config.js`). Use `$props()`, `$state()`, `$derived()`, `$effect()`, and `{@render children()}`. Legacy syntax like `export let` and `$:` will not compile.
- The basemap comes from `world-atlas/land-110m.json` (imported as JSON) and is decoded with `topojson-client`. It's drawn with a `d3.geoEquirectangular` projection whose scale and translate match the linear x/y scales exactly, so coastlines line up with the circles. The projection also cuts land polygons cleanly at ±180°.
- D3 v7 handles scales, axes, and CSV loading. Svelte creates the earthquake marks with `{#each}`. Do not create them with `d3.select`/`append`. D3 axis generators may use selections to draw inside dedicated axis `<g>` elements.

## Conventions

- One component per `.svelte` file in `src/lib/`; import with the `$lib` alias (resolves to `src/lib/`).
- `src/routes/+layout.svelte` sets the favicon and renders child pages.
- Use the D3 margin convention; label axes with units.

## Data

`static/earthquakes_M6.0_1year.csv` is a USGS earthquake catalog export. Files in `static/` are served from the site root, so load it client-side with `d3.csv('/earthquakes_M6.0_1year.csv')` inside `onMount`.

- 155 events from 2025-05-30 to 2026-05-27, magnitude 6.0 to 8.8.
- Every value loads as a string. Convert `longitude`, `latitude`, `depth`, and `mag` to numbers on load. None of them has nulls (the file has no empty fields).
- Key columns: `time` (ISO 8601 UTC), `latitude` (−61 to 62), `longitude` (−179.5 to 179.6), `depth` (km), `mag`, `magType` (mww/mwb/mb/ml), `place` (quoted string that may contain commas), `id`.
- The remaining columns (`nst`, `gap`, `dmin`, `rms`, error fields, `status`, etc.) are USGS quality metadata.
- **M6.0+ filter:** the catalog is filtered to M6.0+, so thousands of smaller quakes are excluded. State the filter on the chart so readers don't read it as a record of all earthquakes, and don't imply quakes are rare.
- **Magnitude is logarithmic:** each whole step (6→7→8) is about 32× more energy, so an 8.8 releases roughly 16,000× the energy of a 6.0 (see the USGS explanation of magnitude and energy).
- **Depth has a long right tail:** 132 of 155 quakes are shallow (<70 km, median about 23 km), but 7 are 300 to 636 km deep. A sequential color scale spanning the full range makes the shallow quakes look alike.
- **Longitude wraps at ±180°:** 68 of 155 quakes lie beyond ±150°, mostly around the Pacific Ring of Fire. With x running from −180° to 180°, the Pacific is split across the left and right edges. Mapping longitude and latitude linearly at the same pixels-per-degree gives a plate carrée (equirectangular) map.

## Encoding rules

- Position (x/y) uses `scaleLinear`. In SVG y grows downward, so the y range is `[height, 0]`: high latitude or high magnitude goes to the TOP.
- For an undistorted map, give x and y the same pixels per degree (e.g. width = 2 × height for the full −180 to 180, −90 to 90 range).

### Size (`scaleSqrt`)

Keep these three decisions separate:

1. **Square-root radius.** Area is proportional to radius², so for circle area to be proportional to a nonnegative value, radius must be proportional to that value's square root. `d3.scaleSqrt` does this mapping. `scaleLinear` on radius would make areas grow with the square of the value.
2. **Zero baseline.** Area is proportional to the value only when both the domain AND the range start at 0, e.g. `d3.scaleSqrt().domain([0, 8.8]).range([0, rMax])`. An M8 circle then has 8/6 ≈ 1.33× the area of an M6 circle. A domain of `[6, 8.8]` with range `[3, 30]` adds more contrast but breaks proportionality. If you use it, state that size preserves order, not value ratios.
3. **Magnitude, not energy.** Even a proportional area encodes the magnitude number, which is logarithmic. An M8 releases about 1,000× the energy of an M6 but gets only 1.33× the area. Area proportional to magnitude does not represent energy ratios.

- The size legend shows M6, M7, and M8 circles drawn with the same scale as the marks, and states that size represents magnitude, not energy.

### Color

- Use a sequential scale for the chosen quantitative column (e.g. `d3.scaleSequential` + `interpolateViridis`).
- If the column is depth, handle the long tail. Either limit the domain (e.g. `[0, 300]`) and call `.clamp(true)` so deeper quakes take the end color, or use a transformation such as `d3.scaleSequentialSqrt` or `scaleSequentialLog`. The legend must explain the change, e.g. "300+ km" at the cutoff, or note the transformed scale.

### Other

- `magType` is categorical, so use an ordinal scale if it is ever encoded.

## Definition of done

- `npm run dev` runs with no console errors.
- Four channels: longitude→x, latitude→y, mag→size (`scaleSqrt`), and the chosen quantitative column→color. The legend names the color column.
- Size and color have legends with units, and latitude points north-up.
- The chart states the M6.0+ filter, and the size legend says size represents magnitude, not energy.
