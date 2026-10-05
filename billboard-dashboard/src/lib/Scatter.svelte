<script>
	import * as d3 from 'd3';

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
		One circle per song. Both are audio features scored 0–100.
		{#if missing > 0}{d3.format(',')(plottedCount)} of {d3.format(',')(data.length)} songs shown; {missing}
			{missing === 1 ? 'has' : 'have'} no audio data.{/if}
	</p>
	<p class="link-status">
		{#if hoveredGenre === null}
			Hover a genre bar to highlight its songs.
		{:else}
			Highlighting <strong>{hoveredGenre}</strong> songs; other songs are dimmed, not removed.
		{/if}
	</p>
	<div class="chart" bind:clientWidth={width}>
		<svg {width} {height} role="img" aria-label="Scatterplot of Danceability against Energy, one circle per #1 song">
			<g transform="translate({margin.left},{margin.top})">
				<g class="axis" bind:this={xAxisG} transform="translate(0,{innerHeight})"></g>
				<g class="axis" bind:this={yAxisG}></g>

				{#each data as d (d)}
					{#if hasAudio(d)}
						<circle
							cx={x(d.danceability)}
							cy={y(d.energy)}
							r="3"
							fill="#2f6fb0"
							fill-opacity="0.45"
							opacity={hoveredGenre === null || d.genre === hoveredGenre ? 1 : 0.15}
						>
							<title>{d.song} — {d.artist}
Genre: {d.genre}
Danceability: {d.danceability}, Energy: {d.energy}</title>
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
