<script>
	import * as d3 from 'd3';
	import { FIRST_YEAR, LAST_YEAR } from './data.js';

	// Context view: always receives the full dataset. yearRange is owned by the page: null, or a list of
	// [startYear, endYear] ranges. The brush reports changes through onbrush and is redrawn from yearRange.
	// The last range is the "active" one, held by the d3 brush (movable and resizable);
	// earlier ranges are drawn as static regions.
	let { data, yearRange = null, onbrush = () => {} } = $props();

	let width = $state(800);
	const height = 300;
	const margin = { top: 16, right: 24, bottom: 48, left: 64 };
	let innerWidth = $derived(Math.max(0, width - margin.left - margin.right));
	const innerHeight = height - margin.top - margin.bottom;

	// Number of songs (rows) that reached #1 in each year, with every year present.
	let counts = $derived.by(() => {
		const byYear = d3.rollup(data, (v) => v.length, (d) => d.year);
		return d3.range(FIRST_YEAR, LAST_YEAR + 1).map((year) => ({ year, count: byYear.get(year) ?? 0 }));
	});

	let x = $derived(d3.scaleLinear().domain([FIRST_YEAR, LAST_YEAR]).range([0, innerWidth]));
	let y = $derived(
		d3
			.scaleLinear()
			.domain([0, d3.max(counts, (d) => d.count) ?? 0])
			.nice()
			.range([innerHeight, 0])
	);
	let linePath = $derived(
		d3
			.line()
			.x((d) => x(d.year))
			.y((d) => y(d.count))(counts)
	);

	let xAxisG = $state();
	let yAxisG = $state();

	$effect(() => {
		d3.select(xAxisG).call(
			d3
				.axisBottom(x)
				.ticks(Math.max(2, Math.floor(innerWidth / 70)))
				.tickFormat(d3.format('d'))
		);
	});
	$effect(() => {
		d3.select(yAxisG).call(d3.axisLeft(y).ticks(6));
	});

	let brushG = $state();
	let brush = $state.raw(null);
	// True while the user is dragging, so syncing from yearRange doesn't fight the gesture.
	let dragging = false;
	// Bookkeeping for the gesture in progress (set on 'start', cleared on 'end').
	let gesture = null;

	let staticRanges = $derived(yearRange ? yearRange.slice(0, -1) : []);

	// Clear cue: while the pointer is over a selected range the cursor becomes an ×, since a click there clears.
	// hoverPx is the pointer's x in the plot (null when away or pressing).
	let hoverPx = $state(null);
	let overRange = $derived(hoverPx != null && !!yearRange && !!rangeAt(yearRange, hoverPx));

	// Each year owns the band from year − 0.5 to year + 0.5, so a single-year range is still visible.
	// Pixel extent -> years with the x-scale's invert: the years whose dots are inside the selection or
	// within a quarter year of it. The slack keeps 1958/2025 selectable at the plot edges and absorbs
	// sub-pixel drift when a range drawn by toPixels (edges at ±0.5) is moved.
	function toYears([p0, p1]) {
		const start = Math.ceil(x.invert(p0) - 0.25);
		const end = Math.floor(x.invert(p1) + 0.25);
		return start <= end ? [start, end] : null;
	}
	function toPixels([start, end]) {
		return [Math.max(0, x(start - 0.5)), Math.min(innerWidth, x(end + 0.5))];
	}
	function rangeAt(ranges, px) {
		const year = x.invert(px);
		return ranges.find(([start, end]) => year >= start - 0.5 && year <= end + 0.5);
	}
	// Add a range, merging it with any ranges it overlaps or touches. The merged range becomes the active one.
	function addRange(ranges, [start, end]) {
		const rest = [];
		for (const r of ranges) {
			if (r[0] <= end + 1 && r[1] >= start - 1) {
				start = Math.min(start, r[0]);
				end = Math.max(end, r[1]);
			} else rest.push(r);
		}
		return [...rest, [start, end]];
	}
	function emit(ranges) {
		const next = ranges.length ? ranges : null;
		if (JSON.stringify(next) !== JSON.stringify(yearRange)) onbrush(next);
	}
	function drawActive(b, ranges) {
		const active = ranges?.at(-1);
		d3.select(brushG).call(b.move, active ? toPixels(active) : null);
	}

	// Create the brush; re-created only when the plot size changes.
	$effect(() => {
		const b = d3
			.brushX()
			.extent([
				[0, 0],
				[innerWidth, innerHeight]
			])
			.on('start', (event) => {
				// Programmatic moves (syncing, snapping) have no sourceEvent; only react to the user.
				if (!event.sourceEvent) return;
				dragging = true;
				const ranges = yearRange ?? [];
				const shift = event.sourceEvent.shiftKey;
				// d3 tags its elements: 'overlay' (empty area), 'selection' (inside the active range), 'w'/'e' (handles).
				const target = event.sourceEvent.target?.__data__?.type;
				const onActive = target !== 'overlay';
				gesture = {
					shift,
					target,
					x0: d3.pointer(event.sourceEvent, brushG)[0],
					// Ranges that stay put during this gesture: the others when editing the active range,
					// all of them when Shift+dragging a new one, none when a plain drag replaces the selection.
					base: onActive ? ranges.slice(0, -1) : shift ? ranges : []
				};
			})
			.on('brush', (event) => {
				if (!event.sourceEvent || !gesture) return;
				const range = toYears(event.selection);
				if (range) emit([...gesture.base, range]);
			})
			.on('end', (event) => {
				if (!event.sourceEvent || !gesture) return;
				dragging = false;
				const g = gesture;
				gesture = null;
				const ranges = yearRange ?? [];
				const px = d3.pointer(event.sourceEvent, brushG)[0];
				// A click is a press without a drag: on empty space d3 reports no selection;
				// inside the active range it reports a "move" that went nowhere.
				const isClick =
					!event.selection || (g.target === 'selection' && Math.abs(px - g.x0) < 3);
				if (isClick) {
					if (!g.shift) {
						emit([]); // Click anywhere: clear every range.
					} else {
						const hit = rangeAt(ranges, px); // Shift+click a range: remove just that range.
						emit(hit ? ranges.filter((r) => r !== hit) : ranges);
					}
				} else {
					const range = toYears(event.selection);
					emit(range ? addRange(g.base, range) : g.base);
				}
				// The brush may have changed visually even if yearRange did not, so always redraw it.
				drawActive(b, yearRange);
			});
		d3.select(brushG)
			.call(b)
			// Hover tracking for the clear cursor; off while a button is pressed (dragging or clicking).
			.on('pointermove.cue', (event) => {
				hoverPx = event.buttons ? null : d3.pointer(event, brushG)[0];
			})
			.on('pointerdown.cue pointerleave.cue', () => (hoverPx = null));
		brush = b;
	});

	// Draw the active range from yearRange: restores it after a resize and follows changes from the page.
	$effect(() => {
		const ranges = yearRange;
		if (brush && !dragging) drawActive(brush, ranges);
	});
</script>

<figure class="card">
	<h2>Number of #1 songs per year</h2>
	<p class="subtitle">
		Each point counts the songs that first reached #1 that year. This counts songs, not weeks spent
		at #1. {FIRST_YEAR} starts in August and {LAST_YEAR} covers only early January.
		<strong>Drag across the chart to filter the views below by year.</strong> Shift+drag adds another
		range; click to clear; Shift+click a range to remove just that one.
	</p>
	<div class="chart" bind:clientWidth={width}>
		<svg {width} {height} role="img" aria-label="Line chart of the number of #1 songs per year, {FIRST_YEAR} to {LAST_YEAR}">
			<g transform="translate({margin.left},{margin.top})">
				<g class="axis" bind:this={xAxisG} transform="translate(0,{innerHeight})"></g>
				<g class="axis" bind:this={yAxisG}></g>

				<path d={linePath} fill="none" stroke="#2f6fb0" stroke-width="1.75" />
				{#each counts as d (d.year)}
					<circle cx={x(d.year)} cy={y(d.count)} r="3" fill="#2f6fb0">
						<title>{d.year}: {d.count} #1 songs</title>
					</circle>
				{/each}

				{#each staticRanges as r (r.join('-'))}
					{@const [x0, x1] = toPixels(r)}
					<rect class="static-range" class:clearing={overRange} x={x0} y="0" width={x1 - x0} height={innerHeight} />
				{/each}
				<g class="brush" class:over-range={overRange} bind:this={brushG}></g>
				<text class="axis-label" x={innerWidth / 2} y={innerHeight + 40} text-anchor="middle">Year</text>
				<text
					class="axis-label"
					transform="rotate(-90)"
					x={-innerHeight / 2}
					y={-48}
					text-anchor="middle">Number of #1 Songs</text>
			</g>
		</svg>
	</div>
</figure>

<style>
	.card {
		margin: 0;
		background: #fff;
		border: 1px solid #e3e3df;
		border-radius: 8px;
		padding: 16px 18px 8px;
		min-width: 0;
	}
	h2 {
		margin: 0 0 4px;
		font-size: 1.125rem;
	}
	.subtitle {
		margin: 0 0 8px;
		font-size: 0.875rem;
		color: #5d636b;
	}
	.chart {
		width: 100%;
	}
	svg {
		display: block;
		overflow: visible;
	}
	.axis :global(text) {
		font-size: 12px;
		fill: #4b5159;
	}
	.static-range,
	.brush :global(.selection) {
		fill: #2f6fb0;
		fill-opacity: 0.12;
		stroke: #2f6fb0;
	}
	.static-range {
		pointer-events: none;
	}
	/* Clear cue while hovering a selected range: every range turns red (a click clears them all) and the
	   cursor becomes a white × on red. CSS overrides d3's cursor attributes; edge handles keep ew-resize. */
	.static-range.clearing,
	.brush.over-range :global(.selection) {
		fill: #d1242f;
		fill-opacity: 0.15;
		stroke: #d1242f;
	}
	.brush.over-range :global(.overlay),
	.brush.over-range :global(.selection) {
		cursor:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='9' fill='%23d1242f' stroke='white' stroke-width='1.5'/%3E%3Cpath d='M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")
				10 10,
			pointer;
	}
	.axis-label {
		font-size: 13px;
		font-weight: 600;
		fill: #1f2328;
	}
</style>
