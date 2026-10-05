<script>
	import * as d3 from 'd3';
	import { countByGenre, plural, genreColor } from './data.js';

	let { data } = $props();

	// One row per song, so the row count is the number of #1 songs.
	let totalSongs = $derived(data.length);
	let topGenre = $derived(countByGenre(data)[0]);
	let avgWeeks = $derived(d3.mean(data, (d) => d.weeksAtNumberOne));
</script>

<section class="kpis" aria-label="Summary">
	<div class="kpi">
		<div class="label">Total #1 songs</div>
		<div class="value">{d3.format(',')(totalSongs)}</div>
		<div class="note">songs that reached #1</div>
	</div>
	<div class="kpi">
		<div class="label">Most common primary genre</div>
		<div class="value">
			{#if topGenre}
				<span
					class="swatch"
					class:hollow={topGenre.genre === 'Unlabeled'}
					style="--swatch: {genreColor(topGenre.genre)}"
					aria-hidden="true"
				></span>
			{/if}
			{topGenre?.genre ?? '—'}
		</div>
		<div class="note">{topGenre ? plural(topGenre.count, 'song') : ''}</div>
	</div>
	<div class="kpi">
		<div class="label">Average weeks at #1</div>
		<div class="value">{avgWeeks == null ? '—' : d3.format('.1f')(avgWeeks)}</div>
		<div class="note">weeks per song</div>
	</div>
</section>

<style>
	.kpis {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
	}
	.kpi {
		background: #fff;
		border: 1px solid #e3e3df;
		border-radius: 8px;
		padding: 14px 18px;
	}
	.label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #4b5159;
	}
	.value {
		font-size: 2rem;
		font-weight: 700;
		margin: 4px 0 2px;
		font-variant-numeric: tabular-nums;
	}
	.swatch {
		display: inline-block;
		width: 0.55em;
		height: 0.55em;
		margin-right: 0.15em;
		border-radius: 50%;
		background: var(--swatch);
		vertical-align: 0.12em;
	}
	.swatch.hollow {
		background: none;
		box-shadow: inset 0 0 0 2px var(--swatch);
	}
	.note {
		font-size: 0.8125rem;
		color: #5d636b;
	}
</style>
