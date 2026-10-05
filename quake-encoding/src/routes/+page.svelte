<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import Scatterplot from '$lib/Scatterplot.svelte';

	let data = $state([]);

	onMount(async () => {
		data = await d3.csv('/earthquakes_M6.0_1year.csv', (d) => ({
			...d,
			longitude: +d.longitude,
			latitude: +d.latitude,
			depth: +d.depth,
			mag: +d.mag
		}));
	});
</script>

<figure>
	<h1>M6.0 and larger earthquakes only</h1>
	<Scatterplot {data} />
	<figcaption>
		The 155 earthquakes of magnitude 6.0 or greater recorded by the USGS from May 30, 2025 to May
		27, 2026. Thousands of smaller earthquakes are excluded by this filter, so the map is not a
		record of all earthquakes. Circle area is proportional to the magnitude number. Magnitude is
		logarithmic (each whole step is about 32× more energy), so area does not show energy. Color
		shows depth below the surface on a log scale; most quakes are shallower than 70 km.
	</figcaption>
</figure>

<style>
	figure {
		margin: 0;
	}

	figcaption {
		max-width: 75ch;
	}
</style>
