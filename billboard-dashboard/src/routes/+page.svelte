<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
	import { parseRow, FIRST_YEAR, LAST_YEAR } from '#lib/data.js';
	import KpiRow from '#lib/KpiRow.svelte';
	import Timeline from '#lib/Timeline.svelte';
	import GenreBars from '#lib/GenreBars.svelte';
	import Scatter from '#lib/Scatter.svelte';

	// main dataset and loading error state
	let songs = $state([]);
	let error = $state(null);

	// Linking state: the primary genre under the pointer in GenreBars, or null. Owned here.
	let hoveredGenre = $state(null);

	// Filtering state: the brushed [startYear, endYear] from Timeline, or null for all years. Owned here.
	let yearRange = $state(null);

	// The one filtered subset every result view reads. Timeline keeps the full songs array.
	let filtered = $derived(
		yearRange
			? songs.filter((d) => d.year >= yearRange[0] && d.year <= yearRange[1])
			: songs
	);
	// display label for selected year range
	let rangeLabel = $derived(
		!yearRange ? '' : yearRange[0] === yearRange[1] ? `${yearRange[0]}` : `${yearRange[0]}–${yearRange[1]}`
	);

	// load and parse CSV file
	onMount(async () => {
		try {
			songs = await d3.csv('/billboard_hot_100_no1.csv', parseRow);
		} catch (e) {
			error = e.message;
		}
	});
</script>

<svelte:head>
	<title>Billboard #1 Songs, {FIRST_YEAR}–{LAST_YEAR}</title>
</svelte:head>

<!-- Label above the filtered views (KPIs, genre bars, scatterplot): says which years they show. -->
{#snippet showing()}
	<p class="showing" class:active={yearRange} aria-live="polite">
		{#if yearRange}
			<strong>Showing songs from {rangeLabel}</strong>
			<span class="count">{d3.format(',')(filtered.length)} of {d3.format(',')(songs.length)} songs · click the timeline to clear</span>
		{:else}
			<strong>Showing all years</strong>
			<span class="count">{FIRST_YEAR}–{LAST_YEAR} · {d3.format(',')(songs.length)} songs</span>
		{/if}
	</p>
{/snippet}

<main>
	<header>
		<h1>Billboard Hot 100 #1 Songs, {FIRST_YEAR}–{LAST_YEAR}</h1>
		<p class="lede">
			Every song that reached #1 on the Billboard Hot 100, from the chart's debut in August
			{FIRST_YEAR} through January {LAST_YEAR}. Each song counts once, in the week it first reached
			#1. Only chart-toppers are included, so this shows what #1 hits were like, not all popular
			music.
		</p>
	</header>

	{#if error}
		<p class="status">Could not load the data: {error}</p>
	{:else if songs.length === 0}
		<p class="status">Loading songs…</p>
	{:else}
		{@render showing()}
		<KpiRow data={filtered} />
		<Timeline data={songs} onbrush={(range) => (yearRange = range)} />
		{@render showing()}
		<div class="pair">
			<GenreBars data={filtered} {hoveredGenre} onHoverGenre={(genre) => (hoveredGenre = genre)} />
			<Scatter data={filtered} {hoveredGenre} />
		</div>
	{/if}

	<footer>
		Data: "Uncharted Territory" by Chris Dalla Riva, via Data Is Plural. Genre is the dataset's hand-coded
		CDR Genre.
	</footer>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f7f7f5;
		color: #1f2328;
		font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
	}
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 24px 16px 40px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	h1 {
		margin: 0 0 6px;
		font-size: 1.75rem;
	}
	.lede {
		margin: 0;
		max-width: 75ch;
		line-height: 1.5;
		color: #4b5159;
	}
	.pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
		gap: 20px;
	}
	.showing {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 2px 10px;
		margin: -6px 0;
		padding: 8px 12px;
		border: 1px solid #e3e3df;
		border-radius: 8px;
		background: #fff;
		font-size: 0.9375rem;
	}
	.showing.active {
		border-color: #2f6fb0;
		background: #eaf1f8;
		color: #174a7c;
	}
	.showing .count {
		font-size: 0.8125rem;
		color: #5d636b;
	}
	/* Tighter cards on phones so the charts get more width. */
	@media (max-width: 480px) {
		main :global(.card) {
			padding: 12px 12px 6px;
		}
	}
	.status,
	footer {
		color: #5d636b;
		font-size: 0.875rem;
	}
</style>
