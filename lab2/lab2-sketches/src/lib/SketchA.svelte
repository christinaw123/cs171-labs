<script>
  import { scaleLinear, format } from 'd3';

  let { data } = $props();

  // Fixed terminal -> color map. The palette is the validated 8-hue categorical
  // order; ten terminals is more than eight, so the last two reuse slots 1-2
  // with a dashed stroke rather than inventing two new hues. The map is keyed by
  // terminal, never by rank, so a terminal keeps its colour in both sketches.
  const SERIES = {
    'T8': { color: '#2a78d6', dash: null },
    'T5': { color: '#eb6834', dash: null },
    'T2': { color: '#1baf7a', dash: null },
    'T3': { color: '#eda100', dash: null },
    'T7': { color: '#e87ba4', dash: null },
    'Miscellaneous Terminal': { color: '#008300', dash: null },
    'T6': { color: '#4a3aa7', dash: null },
    'T1': { color: '#e34948', dash: null },
    'TBIT': { color: '#2a78d6', dash: '5 3' },
    'T4': { color: '#eb6834', dash: '5 3' }
  };

  const ANSWER = new Set(['T8', 'T5']);
  const short = (t) => (t === 'Miscellaneous Terminal' ? 'Misc' : t);
  const minus = (s) => s.replace('-', '−');
  const full = (v) => minus(format(',')(v));
  const mills = (v) => minus((v / 1e6).toFixed(2)) + 'M';

  const W = 600, H = 545;
  const M = { top: 48, right: 128, bottom: 54, left: 118 };
  const pw = W - M.left - M.right;
  const ph = H - M.top - M.bottom;

  const y = scaleLinear().domain([0, 15_500_000]).range([ph, 0]);
  const ticks = [0, 3e6, 6e6, 9e6, 12e6, 15e6];

  // Push labels apart so no two overlap, then draw a leader to the moved ones.
  function declutter(items, minGap, lo, hi) {
    const s = items.map((d) => ({ ...d, ly: d.y })).sort((a, b) => a.ly - b.ly);
    for (let i = 1; i < s.length; i++)
      if (s[i].ly - s[i - 1].ly < minGap) s[i].ly = s[i - 1].ly + minGap;
    const last = s.length - 1;
    if (last >= 0 && s[last].ly > hi) {
      s[last].ly = hi;
      for (let i = last - 1; i >= 0; i--)
        if (s[i + 1].ly - s[i].ly < minGap) s[i].ly = s[i + 1].ly - minGap;
    }
    if (s.length && s[0].ly < lo) {
      s[0].ly = lo;
      for (let i = 1; i < s.length; i++)
        if (s[i].ly - s[i - 1].ly < minGap) s[i].ly = s[i - 1].ly + minGap;
    }
    return new Map(s.map((d) => [d.key, d.ly]));
  }

  const series = $derived(
    data.map((d) => ({
      key: d.Terminal,
      label: short(d.Terminal),
      color: SERIES[d.Terminal].color,
      dash: SERIES[d.Terminal].dash,
      p19: d.Passengers_2019,
      p23: d.Passengers_2023,
      change: d.Change,
      pct: d.Change_percent,
      y19: y(d.Passengers_2019),
      y23: y(d.Passengers_2023),
      answer: ANSWER.has(d.Terminal)
    }))
  );

  const leftY = $derived(
    declutter(series.map((s) => ({ key: s.key, y: s.y19 })), 13, -6, ph + 6)
  );
  const rightY = $derived(
    declutter(series.map((s) => ({ key: s.key, y: s.y23 })), 13, -6, ph + 6)
  );

  let hovered = $state(null);
  const tip = $derived(hovered ? series.find((s) => s.key === hovered) : null);
  const tipY = $derived(
    tip ? Math.min(Math.max((tip.y19 + tip.y23) / 2 - 34, 4), ph - 72) : 0
  );
</script>

<section aria-labelledby="heading-A">
  <p class="eyebrow">Sketch A &middot; Slope chart</p>
  <h2 id="heading-A">T8 changed least &mdash; it lost 446,124 passengers</h2>
  <p class="question">
    <strong>Question:</strong> Which terminals had the least change in passenger count
    between 2019 and 2023?
  </p>
  <p class="answer">
    <strong>Answer:</strong> T8 changed least (&minus;446,124 passengers). T5 is next
    (+506,877) and is the only terminal that grew. Change is measured as the absolute
    difference in passengers, January&ndash;October 2019 vs January&ndash;October 2023.
  </p>

  <svg viewBox="0 0 {W} {H}" role="img" aria-label="Slope chart of passengers at ten LAX terminals in 2019 and 2023">
    <g transform="translate({M.left},{M.top})">
      <!-- y axis -->
      <text class="axis-title" x={-M.left + 10} y={-30}>Passengers</text>
      <text class="axis-title" x={-M.left + 10} y={-17}>(Jan&ndash;Oct)</text>
      {#each ticks as t}
        <line class="grid" x1="0" x2={pw} y1={y(t)} y2={y(t)} />
        <text class="tick" x={-84} y={y(t) + 3.5}>{t === 0 ? '0' : t / 1e6 + 'M'}</text>
      {/each}

      <!-- the two year columns -->
      <line class="column-rule" x1="0" x2="0" y1="0" y2={ph} />
      <line class="column-rule" x1={pw} x2={pw} y1="0" y2={ph} />
      <text class="year" x="0" y={-17}>Jan&ndash;Oct 2019</text>
      <text class="year" x={pw} y={-17}>Jan&ndash;Oct 2023</text>

      <!-- one line per terminal -->
      {#each series as s (s.key)}
        {@const dim = hovered !== null && hovered !== s.key}
        <g opacity={dim ? 0.18 : 1}>
          <line
            class="slope"
            x1="0" y1={s.y19} x2={pw} y2={s.y23}
            stroke={s.color}
            stroke-dasharray={s.dash}
            stroke-width={s.answer || hovered === s.key ? 2.75 : 1.75}
          />
          <circle cx="0" cy={s.y19} r="3.5" fill={s.color} />
          <circle cx={pw} cy={s.y23} r="3.5" fill={s.color} />

          {#if Math.abs(leftY.get(s.key) - s.y19) > 2}
            <polyline
              class="leader"
              stroke={s.color}
              points="-5,{s.y19} -10,{leftY.get(s.key)} -13,{leftY.get(s.key)}"
            />
          {/if}
          <text
            class="endpoint"
            class:is-answer={s.answer}
            x={-15} y={leftY.get(s.key) + 3.5}
            text-anchor="end"
          >{s.label} &nbsp;{mills(s.p19)}</text>

          {#if Math.abs(rightY.get(s.key) - s.y23) > 2}
            <polyline
              class="leader"
              stroke={s.color}
              points="{pw + 5},{s.y23} {pw + 10},{rightY.get(s.key)} {pw + 13},{rightY.get(s.key)}"
            />
          {/if}
          <text
            class="endpoint"
            class:is-answer={s.answer}
            x={pw + 15} y={rightY.get(s.key) + 3.5}
          >{s.label} &nbsp;{mills(s.p23)}</text>
        </g>

        <!-- wide invisible target for hover -->
        <line
          class="hit"
          x1="0" y1={s.y19} x2={pw} y2={s.y23}
          onmouseenter={() => (hovered = s.key)}
          onmouseleave={() => (hovered = null)}
          role="presentation"
        />
      {/each}

      {#if tip}
        <g transform="translate({pw / 2 - 78},{tipY})" pointer-events="none">
          <rect class="tip-box" width="156" height="66" rx="4" />
          <text class="tip-name" x="10" y="17">{tip.key}</text>
          <text class="tip-row" x="10" y="32">2019: {full(tip.p19)}</text>
          <text class="tip-row" x="10" y="45">2023: {full(tip.p23)}</text>
          <text class="tip-row" x="10" y="58">
            Change: {full(tip.change)} ({minus(tip.pct.toFixed(2))}%)
          </text>
        </g>
      {/if}

      <text class="footnote-svg" x={pw / 2} y={ph + 34}>
        Each line joins one terminal's two totals. A flatter line means a smaller change.
      </text>
    </g>
  </svg>

  <p class="note">
    Colour identifies the terminal and is the same in both sketches; every line is also
    labelled at both ends, so colour is never the only cue. TBIT and T4 are dashed because
    ten terminals is more than the eight distinguishable hues.
  </p>
  <details>
    <summary>Show the numbers</summary>
    <table>
      <thead>
        <tr><th scope="col">Terminal</th><th scope="col">2019</th><th scope="col">2023</th><th scope="col">Change</th></tr>
      </thead>
      <tbody>
        {#each series as s (s.key)}
          <tr><th scope="row">{s.key}</th><td>{full(s.p19)}</td><td>{full(s.p23)}</td><td>{full(s.change)}</td></tr>
        {/each}
      </tbody>
    </table>
  </details>
  <p class="footnote">
    Passenger movements (arrivals + departures, domestic + international), January through
    October of each year &mdash; not full years, and not unique travellers. Ten terminals
    with data in both periods. TBIT West Gates is excluded because it has no 2019 baseline,
    and Imperial Terminal has no records in either period, so these are not all-airport
    totals for 2023. &ldquo;Misc&rdquo; is the Miscellaneous Terminal. Counts describe
    movements, not causes.
  </p>
</section>

<style>
  section { padding: 1.5rem; background: #fcfcfb; border: 1px solid #bbb; border-radius: 6px; }
  .eyebrow { margin: 0 0 0.25rem; font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase; color: #898781; }
  h2 { margin: 0 0 0.5rem; font-size: 1.15rem; line-height: 1.3; color: #0b0b0b; }
  .question, .answer { margin: 0 0 0.4rem; font-size: 0.82rem; line-height: 1.45; color: #52514e; }
  .answer { margin-bottom: 0.9rem; }
  svg { width: 100%; height: auto; display: block; overflow: visible; }

  .grid { stroke: #e1e0d9; stroke-width: 1; }
  .column-rule { stroke: #c3c2b7; stroke-width: 1; }
  .slope { stroke-linecap: round; }
  .leader { fill: none; stroke-width: 1; opacity: 0.55; }
  .hit { stroke: transparent; stroke-width: 16; cursor: pointer; }

  .tick, .year, .axis-title, .endpoint, .footnote-svg, .tip-row, .tip-name {
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  }
  .tick { font-size: 10px; fill: #898781; text-anchor: end; font-variant-numeric: tabular-nums; }
  .axis-title { font-size: 10px; fill: #52514e; text-anchor: start; }
  .year { font-size: 11px; fill: #0b0b0b; font-weight: 600; text-anchor: middle; }
  .endpoint { font-size: 10px; fill: #52514e; font-variant-numeric: tabular-nums; }
  .endpoint.is-answer { fill: #0b0b0b; font-weight: 700; }
  .footnote-svg { font-size: 10px; fill: #898781; text-anchor: middle; }

  .tip-box { fill: #fcfcfb; stroke: rgba(11, 11, 11, 0.18); }
  .tip-name { font-size: 11px; font-weight: 700; fill: #0b0b0b; }
  .tip-row { font-size: 10px; fill: #52514e; font-variant-numeric: tabular-nums; }

  .note { margin: 0.7rem 0 0; font-size: 0.72rem; line-height: 1.45; color: #52514e; }
  .footnote { margin: 0.5rem 0 0; font-size: 0.7rem; line-height: 1.45; color: #898781; }
  details { margin-top: 0.7rem; font-size: 0.72rem; color: #52514e; }
  summary { cursor: pointer; color: #52514e; }
  table { border-collapse: collapse; margin-top: 0.5rem; font-variant-numeric: tabular-nums; }
  th, td { padding: 2px 8px 2px 0; text-align: right; font-weight: 400; }
  thead th, tbody th { text-align: left; }
  thead th { color: #898781; font-weight: 600; }
</style>
