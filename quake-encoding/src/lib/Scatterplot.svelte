<script>
	import * as d3 from 'd3';
	import { feature } from 'topojson-client';
	import landTopo from 'world-atlas/land-110m.json';

	// Rows with numeric longitude, latitude, depth, and mag, loaded by the parent page.
	let { data = [] } = $props();

	const land = feature(landTopo, landTopo.objects.land);

	// D3 margin convention. The map area is 2:1 (360° × 180°). Marks are confined to
	// that rectangle; see the seam wrapping below for circles near ±180°.
	const margin = { top: 35, right: 35, bottom: 30, left: 35 };
	const innerWidth = 900;
	const innerHeight = innerWidth / 2;
	const legendHeight = 120;
	const width = innerWidth + margin.left + margin.right;
	const height = margin.top + innerHeight + margin.bottom + legendHeight;

	// Position: the same pixels per degree on both axes (plate carrée).
	const x = d3.scaleLinear().domain([-180, 180]).range([0, innerWidth]);
	// Range is [height, 0] so north is at the top.
	const y = d3.scaleLinear().domain([-90, 90]).range([innerHeight, 0]);

	// Basemap: an equirectangular projection scaled to match x and y exactly
	// (x = scale · λ + innerWidth / 2, with λ in radians), so coastlines line up
	// with the circles. The projection also cuts land polygons at ±180°.
	const projection = d3
		.geoEquirectangular()
		.scale(innerWidth / (2 * Math.PI))
		.translate([innerWidth / 2, innerHeight / 2]);
	const path = d3.geoPath(projection);

	// Size: a zero-based sqrt scale, so circle area is proportional to the magnitude number.
	const r = d3.scaleSqrt().domain([0, 8.8]).range([0, 30]);
	const legendMags = [6, 7, 8];

	// Color: depth has a long right tail (most quakes < 70 km, a few 300–636 km), so a
	// log sequential scale spreads the shallow quakes apart. Clamped in case of outliers.
	// Light yellow (shallow) to dark red (deep). YlOrRd starts at 15% because its palest
	// yellow (#ffffcc) is nearly the same color as the ocean fill.
	const depthPalette = (t) => d3.interpolateYlOrRd(0.15 + 0.85 * t);
	const color = d3.scaleSequentialLog(depthPalette).domain([5, 700]).clamp(true);
	const colorBarWidth = 320;
	const colorX = d3.scaleLog().domain(color.domain()).range([0, colorBarWidth]);
	const depthTicks = [5, 10, 30, 100, 300, 600];
	const gradientStops = d3.range(0, 1.01, 0.1).map((t) => ({
		offset: t,
		color: color(colorX.invert(t * colorBarWidth))
	}));

	// Draw larger circles first so smaller ones stay visible on top.
	const quakes = $derived(data.toSorted((a, b) => b.mag - a.mag));

	// Circles must stay inside the map rectangle, and 68 of the 155 quakes sit beyond
	// ±150°, so many touch the ±180° seam. A quake within one radius of a side edge is
	// drawn twice — once in place, once shifted a full map width — so the part that would
	// hang past one edge reappears at the other, the way longitude wraps. The clip path
	// then trims both copies to the rectangle, and no circle loses area.
	// Latitude does not wrap, but the data stays within 62° of the equator, so no circle
	// comes within 46px of the top or bottom edge.
	const marks = $derived(
		quakes.flatMap((d) => {
			const cx = x(d.longitude);
			const cy = y(d.latitude);
			const radius = r(d.mag);
			const fill = color(d.depth);
			const copies = [{ key: d.id, cx, cy, radius, fill }];
			if (cx - radius < 0) {
				copies.push({ key: `${d.id}-east`, cx: cx + innerWidth, cy, radius, fill });
			} else if (cx + radius > innerWidth) {
				copies.push({ key: `${d.id}-west`, cx: cx - innerWidth, cy, radius, fill });
			}
			return copies;
		})
	);
</script>

<svg {width} {height} viewBox="0 0 {width} {height}">
	<defs>
		<clipPath id="map-clip">
			<rect width={innerWidth} height={innerHeight} />
		</clipPath>

		<linearGradient id="depth-gradient">
			{#each gradientStops as s}
				<stop offset={s.offset} stop-color={s.color} />
			{/each}
		</linearGradient>
	</defs>

	<g transform="translate({margin.left},{margin.top})">
		<!-- Basemap -->
		<rect class="sphere" width={innerWidth} height={innerHeight} />
		<path class="land" d={path(land)} />

		<!-- One circle per earthquake, plus a wrapped copy for the ones on the seam -->
		<g clip-path="url(#map-clip)">
			{#each marks as m (m.key)}
				<circle class="quake" cx={m.cx} cy={m.cy} r={m.radius} fill={m.fill} />
			{/each}
		</g>

		<!-- Redrawn on top so the circles do not cover the rectangle's edge -->
		<rect class="frame" width={innerWidth} height={innerHeight} />
	</g>

	<g class="legend" transform="translate({margin.left},{margin.top + innerHeight + margin.bottom})">
		<!-- Size legend: same r scale as the marks; circles share a bottom baseline. -->
		<text class="legend-title" y="0" dy="0.8em">Circle size: magnitude (M)</text>
		{#each legendMags as m, i}
			<circle class="size-key" cx={35 + i * 72} cy={88 - r(m)} r={r(m)} />
			<text x={35 + i * 72} y="106" text-anchor="middle">M{m}</text>
		{/each}
		<text class="legend-note" x="250" y="32">Area proportional to magnitude.</text>
		<text class="legend-note" x="250" y="50">Size shows magnitude, not energy.</text>
		<text class="legend-note" x="250" y="68">An M8 releases ~1,000× the energy</text>
		<text class="legend-note" x="250" y="86">of an M6 but has only ~1.33× the area.</text>

		<!-- Color legend: the bar is drawn over the ocean fill with the same fill-opacity
		     and stroke as the marks, so its colors match the circles on the map. -->
		<g transform="translate({innerWidth - colorBarWidth - 10},0)">
			<text class="legend-title" y="0" dy="0.8em">Circle color: depth (km, log scale)</text>
			<rect class="bar-backing" y="30" width={colorBarWidth} height="14" />
			<rect class="bar" y="30" width={colorBarWidth} height="14" fill="url(#depth-gradient)" />
			{#each depthTicks as t}
				<line x1={colorX(t)} x2={colorX(t)} y1="44" y2="50" />
				<text x={colorX(t)} y="64" text-anchor="middle"
					>{t}{t === depthTicks[0] ? ' km' : ''}</text
				>
			{/each}
			<text class="legend-note" x="0" y="88">← Shallow (light yellow)</text>
			<text class="legend-note" x={colorBarWidth} y="88" text-anchor="end">Deep (dark red) →</text>
		</g>
	</g>
</svg>

<style>
	svg {
		max-width: 100%;
		height: auto;
	}

	.sphere {
		fill: #f4f7fa;
		stroke: #ccc;
	}

	.frame {
		fill: none;
		stroke: #ccc;
	}

	.land {
		fill: #e2e2e2;
		stroke: #b5b5b5;
		stroke-width: 0.5;
	}

	.quake {
		fill-opacity: 0.7;
		stroke: #333;
		stroke-width: 0.6;
	}

	/* Same backdrop, fill-opacity, and stroke as a circle drawn over the ocean. */
	.bar-backing {
		fill: #f4f7fa;
	}

	.bar {
		fill-opacity: 0.7;
		stroke: #333;
		stroke-width: 0.6;
	}

	.size-key {
		fill: #bbb;
		fill-opacity: 0.7;
		stroke: #333;
		stroke-width: 0.6;
	}

	.legend text {
		font-size: 13px;
	}

	.legend .legend-title {
		font-weight: bold;
	}

	.legend line {
		stroke: #333;
	}
</style>
