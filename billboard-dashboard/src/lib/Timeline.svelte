<script>
	import * as d3 from 'd3';
	import { FIRST_YEAR, LAST_YEAR } from './data.js';

	let { data } = $props();

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
</script>

<figure class="card">
	<h2>Number of #1 songs per year</h2>
	<p class="subtitle">
		Each point counts the songs that first reached #1 that year. This counts songs, not weeks spent
		at #1. {FIRST_YEAR} starts in August and {LAST_YEAR} covers only early January.
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
	.axis-label {
		font-size: 13px;
		font-weight: 600;
		fill: #1f2328;
	}
</style>
