<script>
	import * as d3 from 'd3';
	import { countByGenre, plural, genreColor } from './data.js';

	// hoveredGenre is owned by the page; this view reports hovers through onHoverGenre.
	let { data, hoveredGenre = null, onHoverGenre = () => {} } = $props();

	// Song (row) counts per primary genre, sorted highest to lowest.
	let genres = $derived(countByGenre(data));

	let width = $state(500);
	const margin = { top: 8, right: 36, bottom: 48, left: 128 };
	// Rows are hover targets across the label, bar, and count; they stop short of the rotated axis title.
	const rowLeft = -(margin.left - 24);
	const bandHeight = 26;
	let innerWidth = $derived(Math.max(0, width - margin.left - margin.right));
	let innerHeight = $derived(genres.length * bandHeight);
	let height = $derived(innerHeight + margin.top + margin.bottom);

	let x = $derived(
		d3
			.scaleLinear()
			.domain([0, d3.max(genres, (d) => d.count) ?? 0])
			.nice()
			.range([0, innerWidth])
	);
	let y = $derived(
		d3
			.scaleBand()
			.domain(genres.map((d) => d.genre))
			.range([0, innerHeight])
			.padding(0.2)
	);

	let xAxisG = $state();
	let yAxisG = $state();

	$effect(() => {
		d3.select(xAxisG).call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(innerWidth / 70))));
	});
	$effect(() => {
		d3.select(yAxisG).call(d3.axisLeft(y).tickSizeOuter(0));
	});
</script>

<figure class="card">
	<h2>#1 songs by primary genre</h2>
	<p class="subtitle">
		Counts songs, not weeks at #1. Primary genre is the first genre listed; songs with no genre are
		shown as "Unlabeled" (outlined). The four largest genres have their own color; the rest share gray.
		Hover or focus a genre to highlight its songs in the scatterplot.
	</p>
	<div class="chart" bind:clientWidth={width}>
		<svg {width} {height} role="group" aria-label="Horizontal bar chart of the number of #1 songs in each primary genre">
			<g transform="translate({margin.left},{margin.top})">
				{#each genres as d (d.genre)}
					<!-- One row per genre: hovering or focusing anywhere on it (label, bar, count) highlights the genre,
					     so even 1-song bars are easy to target. Bar sizes never change. -->
					<g
						class="row"
						class:hovered={d.genre === hoveredGenre}
						role="button"
						tabindex="0"
						aria-pressed={d.genre === hoveredGenre}
						aria-label="{d.genre}: {plural(d.count, 'song')}. Highlights these songs in the scatterplot."
						onmouseenter={() => onHoverGenre(d.genre)}
						onmouseleave={() => onHoverGenre(null)}
						onfocus={() => onHoverGenre(d.genre)}
						onblur={() => onHoverGenre(null)}
					>
						<title>{d.genre}: {plural(d.count, 'song')}</title>
						<rect
							class="hit"
							x={rowLeft}
							y={y(d.genre) - (y.step() - y.bandwidth()) / 2}
							width={innerWidth + margin.right - rowLeft}
							height={y.step()}
						/>
						<rect
							class="bar"
							x="0"
							y={y(d.genre)}
							width={x(d.count)}
							height={y.bandwidth()}
							fill={d.genre === 'Unlabeled' ? '#fff' : genreColor(d.genre)}
							stroke={d.genre === 'Unlabeled' ? genreColor(d.genre) : 'none'}
							stroke-width="1.5"
						/>
						<text class="value" x={x(d.count) + 4} y={y(d.genre) + y.bandwidth() / 2} dy="0.35em">{d.count}</text>
					</g>
				{/each}

				<g class="axis" bind:this={xAxisG} transform="translate(0,{innerHeight})"></g>
				<g class="axis" bind:this={yAxisG}></g>

				<text class="axis-label" x={innerWidth / 2} y={innerHeight + 40} text-anchor="middle">Number of #1 Songs</text>
				<text
					class="axis-label"
					transform="rotate(-90)"
					x={-innerHeight / 2}
					y={-(margin.left - 14)}
					text-anchor="middle">Primary Genre</text>
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
	/* Axes sit on top of the rows; let pointer events through to the row under each genre label. */
	.axis {
		pointer-events: none;
	}
	.row {
		cursor: pointer;
		outline: none;
	}
	.hit {
		fill: transparent;
	}
	/* Hover/focus cue: tint the row and darken the bar, without changing the bar's size. */
	.row.hovered .hit {
		fill: #eaf1f8;
	}
	.row:focus-visible .hit {
		stroke: #1f2328;
		stroke-width: 1.5;
	}
	.row.hovered .bar {
		filter: brightness(0.75);
	}
	.value {
		font-size: 11px;
		fill: #4b5159;
		font-variant-numeric: tabular-nums;
	}
	.axis-label {
		font-size: 13px;
		font-weight: 600;
		fill: #1f2328;
	}
</style>
