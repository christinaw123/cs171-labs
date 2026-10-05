<script>
	import * as d3 from 'd3';
	import { countByGenre } from './data.js';

	let { data } = $props();

	// Song (row) counts per primary genre, sorted highest to lowest.
	let genres = $derived(countByGenre(data));

	let width = $state(500);
	const margin = { top: 8, right: 48, bottom: 48, left: 150 };
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
		shown as "Unlabeled".
	</p>
	<div class="chart" bind:clientWidth={width}>
		<svg {width} {height} role="img" aria-label="Horizontal bar chart of the number of #1 songs in each primary genre">
			<g transform="translate({margin.left},{margin.top})">
				{#each genres as d (d.genre)}
					<rect
						x="0"
						y={y(d.genre)}
						width={x(d.count)}
						height={y.bandwidth()}
						fill={d.genre === 'Unlabeled' ? '#a3a9b0' : '#2f6fb0'}
					>
						<title>{d.genre}: {d.count} songs</title>
					</rect>
					<text class="value" x={x(d.count) + 4} y={y(d.genre) + y.bandwidth() / 2} dy="0.35em">{d.count}</text>
				{/each}

				<g class="axis" bind:this={xAxisG} transform="translate(0,{innerHeight})"></g>
				<g class="axis" bind:this={yAxisG}></g>

				<text class="axis-label" x={innerWidth / 2} y={innerHeight + 40} text-anchor="middle">Number of #1 Songs</text>
				<text
					class="axis-label"
					transform="rotate(-90)"
					x={-innerHeight / 2}
					y={-134}
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
