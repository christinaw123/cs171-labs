<script>
	import * as d3 from 'd3';
	import { genreColor, GENRE_LEGEND, plural } from './data.js';

	// hoveredGenre links this view to GenreBars: it only changes opacity and never removes songs.
	let { data, hoveredGenre = null } = $props();

	// Songs with a blank Danceability or Energy cannot be placed, so they are skipped (and counted below).
	const hasAudio = (d) => d.danceability != null && d.energy != null;
	let plottedCount = $derived(d3.sum(data, (d) => (hasAudio(d) ? 1 : 0)));
	let missing = $derived(data.length - plottedCount);

	let width = $state(500);
	const height = 380;
	const margin = { top: 12, right: 20, bottom: 48, left: 60 };
	let innerWidth = $derived(Math.max(0, width - margin.left - margin.right));
	const innerHeight = height - margin.top - margin.bottom;

	let x = $derived(d3.scaleLinear().domain([0, 100]).range([0, innerWidth]));
	// SVG y grows downward, so the range is reversed to put high Energy at the top.
	let y = $derived(d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]));

	// Size: radius from Weeks at Number One with a square-root scale. Domain and range both start at 0,
	// so circle AREA is proportional to weeks. The domain follows the current (filtered) data.
	const maxRadius = 10;
	let maxWeeks = $derived(d3.max(data, (d) => d.weeksAtNumberOne) ?? 0);
	let radius = $derived(d3.scaleSqrt().domain([0, maxWeeks]).range([0, maxRadius]));
	// Size legend: 1, 5, 10 weeks plus the current maximum (19 for all years), never above the maximum.
	let sizeLegend = $derived([...new Set([1, 5, 10, maxWeeks])].filter((w) => w > 0 && w <= maxWeeks));

	// Draw long #1 runs first so smaller circles stay visible on top. Same songs, only reordered.
	let drawOrder = $derived(data.toSorted((a, b) => b.weeksAtNumberOne - a.weeksAtNumberOne));

	let xAxisG = $state();
	let yAxisG = $state();

	$effect(() => {
		d3.select(xAxisG).call(d3.axisBottom(x).ticks(Math.max(2, Math.min(10, Math.floor(innerWidth / 50)))));
	});
	$effect(() => {
		d3.select(yAxisG).call(d3.axisLeft(y).ticks(10));
	});
</script>

<figure class="card">
	<h2>Danceability vs. Energy</h2>
	<p class="subtitle">
		One circle per song: color shows primary genre (as in the bar chart), size shows weeks at #1.
		Both axes are audio features scored 0–100.
		{#if missing > 0}{d3.format(',')(plottedCount)} of {d3.format(',')(data.length)} songs shown; {missing}
			{missing === 1 ? 'has' : 'have'} no audio data.{/if}
	</p>
	<p class="link-status">
		{#if hoveredGenre === null}
			Hover or focus a genre in the bar chart to highlight its songs.
		{:else}
			Highlighting <strong>{hoveredGenre}</strong> songs; other songs are dimmed, not removed.
		{/if}
	</p>
	<ul class="legend" aria-label="Color: primary genre">
		{#each GENRE_LEGEND as item (item.label)}
			<li>
				<svg width="10" height="10" aria-hidden="true">
					<circle
						cx="5"
						cy="5"
						r={item.hollow ? 3.75 : 4.5}
						fill={item.hollow ? 'none' : item.color}
						stroke={item.hollow ? item.color : 'none'}
						stroke-width="1.5"
					/>
				</svg>
				{item.label}
			</li>
		{/each}
	</ul>
	<!-- Size legend: drawn with the same radius scale as the data circles. -->
	<div class="size-legend" aria-label="Size: weeks at number one">
		<span class="size-title">Weeks at Number One</span>
		{#each sizeLegend as w (w)}
			<span class="size-item">
				<svg width={maxRadius * 2 + 2} height={maxRadius * 2 + 2} aria-hidden="true">
					<circle cx={maxRadius + 1} cy={maxRadius + 1} r={radius(w)} />
				</svg>
				{plural(w, 'week')}
			</span>
		{/each}
		<span class="size-note">Larger circles = songs that stayed at #1 longer (circle area is proportional to weeks)</span>
	</div>
	<div class="chart" bind:clientWidth={width}>
		<svg {width} {height} role="img" aria-label="Scatterplot of Danceability against Energy, one circle per #1 song">
			<g transform="translate({margin.left},{margin.top})">
				<g class="axis" bind:this={xAxisG} transform="translate(0,{innerHeight})"></g>
				<g class="axis" bind:this={yAxisG}></g>

				{#each drawOrder as d (d)}
					{#if hasAudio(d)}
						{@const match = hoveredGenre !== null && d.genre === hoveredGenre}
						{@const hollow = d.genre === 'Unlabeled'}
						<!-- Linking: matching songs stay at full opacity (solid, with a dark ring so even gray genres
						     stand out); the rest are dimmed, never removed. Unlabeled songs are hollow rings. -->
						<circle
							cx={x(d.danceability)}
							cy={y(d.energy)}
							r={radius(d.weeksAtNumberOne)}
							fill={hollow ? 'none' : genreColor(d.genre)}
							fill-opacity={match ? 0.95 : 0.6}
							stroke={match && !hollow ? '#1f2328' : hollow ? genreColor(d.genre) : '#fff'}
							stroke-width={match ? 1 : hollow ? 1.25 : 0.5}
							opacity={hoveredGenre === null || match ? 1 : 0.3}
						>
							<title>{d.song} — {d.artist}
Genre: {d.genre}
Danceability: {d.danceability}, Energy: {d.energy}
Weeks at #1: {d.weeksAtNumberOne}</title>
						</circle>
					{/if}
				{/each}

				<text class="axis-label" x={innerWidth / 2} y={innerHeight + 40} text-anchor="middle">Danceability (0–100)</text>
				<text
					class="axis-label"
					transform="rotate(-90)"
					x={-innerHeight / 2}
					y={-44}
					text-anchor="middle">Energy (0–100)</text>
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
	.link-status {
		margin: 0 0 8px;
		min-height: 1.4em;
		font-size: 0.8125rem;
		color: #5d636b;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 14px;
		margin: 0 0 8px;
		padding: 0;
		list-style: none;
		font-size: 0.8125rem;
		color: #4b5159;
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.legend svg {
		display: inline;
		overflow: visible;
	}
	.size-legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 12px;
		margin: 0 0 8px;
		font-size: 0.8125rem;
		color: #4b5159;
	}
	.size-title {
		font-weight: 600;
		color: #1f2328;
	}
	.size-item {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.size-item circle {
		fill: none;
		stroke: #4b5159;
		stroke-width: 1.25;
	}
	.size-note {
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
	.axis-label {
		font-size: 13px;
		font-weight: 600;
		fill: #1f2328;
	}
</style>
