<script>
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
	import { parseRow, FIRST_YEAR, LAST_YEAR } from '#lib/data.js';
	import KpiRow from '#lib/KpiRow.svelte';
	import Timeline from '#lib/Timeline.svelte';
	import GenreBars from '#lib/GenreBars.svelte';
	import Scatter from '#lib/Scatter.svelte';

	let songs = $state([]);
	let error = $state(null);

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
		<KpiRow data={songs} />
		<Timeline data={songs} />
		<div class="pair">
			<GenreBars data={songs} />
			<Scatter data={songs} />
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
	.status,
	footer {
		color: #5d636b;
		font-size: 0.875rem;
	}
</style>
