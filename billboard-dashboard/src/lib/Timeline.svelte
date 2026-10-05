<script>
	import * as d3 from 'd3';
	import { untrack } from 'svelte';
	import { FIRST_YEAR, LAST_YEAR, plural } from './data.js';

	// Context view: always receives the full dataset. The brushed [startYear, endYear] (or null when
	// cleared) goes back to the page through onbrush; the page owns yearRange.
	let { data, onbrush = () => {} } = $props();

	let width = $state(800);
	const height = 300;
	const margin = { top: 24, right: 24, bottom: 48, left: 64 };
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
	// The range last sent through onbrush. Brush memory only (the page owns yearRange): used to redraw the
	// brush after a resize and to hit-test hovers and clicks.
	// Reactive so the timeline can grey out unselected years and label the selection.
	let selectedYears = $state.raw(null);
	let selectionPx = $derived(selectedYears ? toPixels(selectedYears) : null);
	const uid = $props.id();
	const clipId = `${uid}-selection`;
	// Gesture in progress: which brush element it started on and where (set on 'start', cleared on 'end').
	let gesture = null;

	// Pointer x in the plot (null when away or pressing), and whether it is over the selection.
	let hoverPx = $state(null);
	let overSelection = $state(false);
	// Readout for the year under the pointer. It replaces point tooltips, which the brush overlay covers.
	let hoverYear = $derived(
		hoverPx == null ? null : (counts.find((d) => d.year === Math.round(x.invert(hoverPx))) ?? null)
	);

	// Each year owns the band from year − 0.5 to year + 0.5, so a single-year selection is still visible.
	// Pixel extent -> years with the x-scale's invert: the years whose dots are inside the selection or
	// within a quarter year of it. The slack keeps 1958/2025 selectable at the plot edges and absorbs
	// sub-pixel drift when a snapped selection (edges at ±0.5) is moved.
	function toYears([p0, p1]) {
		const start = Math.ceil(x.invert(p0) - 0.25);
		const end = Math.floor(x.invert(p1) + 0.25);
		return start <= end ? [start, end] : null;
	}
	function toPixels([start, end]) {
		return [Math.max(0, x(start - 0.5)), Math.min(innerWidth, x(end + 0.5))];
	}
	function inSelection(px) {
		if (!selectedYears) return false;
		const year = x.invert(px);
		return year >= selectedYears[0] - 0.5 && year <= selectedYears[1] + 0.5;
	}
	function select(range) {
		if (JSON.stringify(range) === JSON.stringify(selectedYears)) return;
		selectedYears = range;
		onbrush(range);
	}
	function clearHover() {
		hoverPx = null;
		overSelection = false;
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
				// Programmatic moves (snapping, resizing) have no sourceEvent; only react to the user.
				if (!event.sourceEvent) return;
				// d3 tags its elements: 'overlay' (empty area), 'selection' (inside it), 'w'/'e' (edge handles).
				gesture = {
					target: event.sourceEvent.target?.__data__?.type,
					x0: d3.pointer(event.sourceEvent, brushG)[0]
				};
			})
			.on('brush', (event) => {
				if (!event.sourceEvent) return;
				const range = toYears(event.selection);
				if (range) select(range);
			})
			.on('end', (event) => {
				if (!event.sourceEvent || !gesture) return;
				const g = gesture;
				gesture = null;
				const px = d3.pointer(event.sourceEvent, brushG)[0];
				// A click is a press without a drag: on empty space d3 reports no selection; inside the
				// selection it reports a "move" that went nowhere. Either way, a click clears.
				const isClick = !event.selection || (g.target === 'selection' && Math.abs(px - g.x0) < 3);
				select(isClick ? null : toYears(event.selection));
				// Snap the brush to the selected years (or hide it when cleared).
				d3.select(brushG).call(b.move, selectedYears ? toPixels(selectedYears) : null);
			});
		// untrack: the brush is rebuilt only on resize, never while selectedYears changes mid-drag.
		const current = untrack(() => selectedYears);
		d3.select(brushG)
			.call(b)
			.call(b.move, current ? toPixels(current) : null)
			// Hover tracking for the readout and the clear cursor; off while a button is pressed.
			.on('pointermove.hover', (event) => {
				if (event.buttons) return clearHover();
				hoverPx = d3.pointer(event, brushG)[0];
				overSelection = inSelection(hoverPx);
			})
			.on('pointerdown.hover pointerleave.hover', clearHover);
	});
</script>

<figure class="card">
	<h2>Number of #1 songs per year</h2>
	<p class="subtitle">
		Each point counts the songs that first reached #1 that year (songs, not weeks at #1).
		{FIRST_YEAR} starts in August; {LAST_YEAR} covers only early January.
	</p>
	<p class="hint">Drag to filter by year · Drag the selection to move it · Click to clear</p>
	<div class="chart" bind:clientWidth={width}>
		<svg {width} {height} role="group" aria-label="Line chart of the number of #1 songs per year, {FIRST_YEAR} to {LAST_YEAR}. Drag to filter the other views by year.">
			<g transform="translate({margin.left},{margin.top})">
				<g class="axis" bind:this={xAxisG} transform="translate(0,{innerHeight})"></g>
				<g class="axis" bind:this={yAxisG}></g>

				<!-- Full data always drawn. With a selection, years outside it turn gray and the selected
				     years stay blue (the blue layer is clipped to the selection). -->
				{#if selectionPx}
					<clipPath id={clipId}>
						<rect x={selectionPx[0]} y={-margin.top} width={selectionPx[1] - selectionPx[0]} height={innerHeight + margin.top} />
					</clipPath>
					<g class="unselected">
						<path d={linePath} />
						{#each counts as d (d.year)}
							<circle cx={x(d.year)} cy={y(d.count)} r="3" />
						{/each}
					</g>
				{/if}
				<g clip-path={selectionPx ? `url(#${clipId})` : null}>
					<path d={linePath} fill="none" stroke="#2f6fb0" stroke-width="1.75" />
					{#each counts as d (d.year)}
						<circle cx={x(d.year)} cy={y(d.count)} r="3" fill="#2f6fb0" />
					{/each}
				</g>

				<g class="brush" class:over-selection={overSelection} bind:this={brushG}></g>

				<!-- Selected years, labeled above the brush (in the top margin). -->
				{#if selectionPx}
					{@const mid = (selectionPx[0] + selectionPx[1]) / 2}
					<text
						class="selection-label"
						class:clearing={overSelection}
						x={Math.min(Math.max(mid, 40), innerWidth - 40)}
						y="-8"
						text-anchor="middle"
						>{selectedYears[0] === selectedYears[1] ? selectedYears[0] : `${selectedYears[0]}–${selectedYears[1]}`}</text
					>
				{/if}

				<!-- Readout for the hovered year; ignores the pointer so the brush still gets every event. -->
				{#if hoverYear}
					{@const cx = x(hoverYear.year)}
					{@const cy = y(hoverYear.count)}
					<g class="readout">
						<line x1={cx} x2={cx} y1="0" y2={innerHeight} />
						<circle {cx} {cy} r="5" />
						<text
							x={cx}
							y={cy - 10}
							text-anchor={cx < 60 ? 'start' : cx > innerWidth - 60 ? 'end' : 'middle'}
							>{hoverYear.year}: {plural(hoverYear.count, '#1 song')}</text
						>
					</g>
				{/if}
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
	.hint {
		margin: 0 0 4px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #2f6fb0;
	}
	.brush :global(.selection) {
		fill: #2f6fb0;
		fill-opacity: 0.12;
		stroke: #2f6fb0;
		stroke-width: 1.5;
	}
	.unselected path {
		fill: none;
		stroke: #c4c9cf;
		stroke-width: 1.75;
	}
	.unselected circle {
		fill: #c4c9cf;
	}
	.selection-label {
		font-size: 12px;
		font-weight: 700;
		fill: #2f6fb0;
		pointer-events: none;
	}
	.selection-label.clearing {
		fill: #d1242f;
	}
	/* Clear cue while hovering the selection: it turns red and the cursor becomes a white × on red.
	   CSS overrides d3's cursor attributes; edge handles keep ew-resize. */
	.brush.over-selection :global(.selection) {
		fill: #d1242f;
		fill-opacity: 0.15;
		stroke: #d1242f;
	}
	.brush.over-selection :global(.overlay),
	.brush.over-selection :global(.selection) {
		cursor:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='9' fill='%23d1242f' stroke='white' stroke-width='1.5'/%3E%3Cpath d='M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")
				10 10,
			pointer;
	}
	.readout {
		pointer-events: none;
	}
	.readout line {
		stroke: #8c959f;
		stroke-dasharray: 3 3;
	}
	.readout circle {
		fill: #fff;
		stroke: #2f6fb0;
		stroke-width: 2;
	}
	.readout text {
		font-size: 12px;
		font-weight: 600;
		fill: #1f2328;
		paint-order: stroke;
		stroke: #fff;
		stroke-width: 3px;
	}
	.axis-label {
		font-size: 13px;
		font-weight: 600;
		fill: #1f2328;
	}
</style>
