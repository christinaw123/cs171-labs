<script>
  import { scaleLinear, format } from 'd3';

  let { data } = $props();

  // Fixed terminal -> color map, identical to Sketch A so a terminal keeps its
  // colour across both sketches. Ten terminals is more than the eight
  // distinguishable hues, so TBIT and T4 reuse slots 1-2 with a hatched fill
  // instead of inventing two new hues.
  const SERIES = {
    'T8': { color: '#2a78d6', pattern: null },
    'T5': { color: '#eb6834', pattern: null },
    'T2': { color: '#1baf7a', pattern: null },
    'T3': { color: '#eda100', pattern: null },
    'T7': { color: '#e87ba4', pattern: null },
    'Miscellaneous Terminal': { color: '#008300', pattern: null },
    'T6': { color: '#4a3aa7', pattern: null },
    'T1': { color: '#e34948', pattern: null },
    'TBIT': { color: '#2a78d6', pattern: 'hatch-blue' },
    'T4': { color: '#eb6834', pattern: 'hatch-orange' }
  };

  const ANSWER = new Set(['T8', 'T5']);
  const short = (t) => (t === 'Miscellaneous Terminal' ? 'Misc' : t);
  const minus = (s) => s.replace('-', '−');
  const full = (v) => minus(format(',')(v));
  const signedM = (v) =>
    (v > 0 ? '+' : '−') + (Math.abs(v) / 1e6).toFixed(2) + 'M';

  const W = 600, H = 505;
  const M = { top: 46, right: 24, bottom: 104, left: 84 };
  const pw = W - M.left - M.right;
  const ph = H - M.top - M.bottom;

  const y = scaleLinear().domain([-5_100_000, 900_000]).range([ph, 0]);
  const zeroY = y(0);
  const ticks = [-5e6, -4e6, -3e6, -2e6, -1e6, 0];

  const step = pw / 10;
  const barW = 30;

  // Ordered least change to greatest change, by absolute passengers.
  const bars = $derived(
    data
      .map((d) => ({
        key: d.Terminal,
        label: short(d.Terminal),
        color: SERIES[d.Terminal].color,
        pattern: SERIES[d.Terminal].pattern,
        p19: d.Passengers_2019,
        p23: d.Passengers_2023,
        change: d.Change,
        pct: d.Change_percent,
        answer: ANSWER.has(d.Terminal)
      }))
      .sort((a, b) => Math.abs(a.change) - Math.abs(b.change))
      .map((d, i) => ({
        ...d,
        cx: i * step + step / 2,
        x: i * step + step / 2 - barW / 2,
        top: d.change > 0 ? y(d.change) : zeroY,
        h: Math.abs(y(d.change) - zeroY)
      }))
  );

  let hovered = $state(null);
  const tip = $derived(hovered ? bars.find((b) => b.key === hovered) : null);
  const tipX = $derived(tip ? Math.min(Math.max(tip.cx - 78, 0), pw - 156) : 0);
  const tipY = $derived(tip ? (Math.abs(tip.change) < 2.6e6 ? ph - 72 : 6) : 0);
</script>

<section aria-labelledby="heading-B">
  <p class="eyebrow">Sketch B &middot; Column chart</p>
  <h2 id="heading-B">T8 changed least &mdash; it lost 446,124 passengers</h2>
  <p class="question">
    <strong>Question:</strong> Which terminals had the least change in passenger count
    between 2019 and 2023?
  </p>
  <p class="answer">
    <strong>Answer:</strong> T8 changed least (&minus;446,124 passengers). T5 is next
    (+506,877) and is the only terminal that grew. Columns are sorted from the smallest
    change on the left to the largest on the right.
  </p>

  <svg viewBox="0 0 {W} {H}" role="img" aria-label="Column chart of the change in passengers at ten LAX terminals between 2019 and 2023, sorted from smallest to largest change">
    <defs>
      <pattern id="hatch-blue" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill="#2a78d6" />
        <line x1="0" y1="0" x2="0" y2="6" stroke="#184f95" stroke-width="2.5" />
      </pattern>
      <pattern id="hatch-orange" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill="#eb6834" />
        <line x1="0" y1="0" x2="0" y2="6" stroke="#a8401c" stroke-width="2.5" />
      </pattern>
    </defs>

    <g transform="translate({M.left},{M.top})">
      <!-- y axis -->
      <text class="axis-title" x={-M.left + 8} y={-30}>Change in passengers</text>
      <text class="axis-title" x={-M.left + 8} y={-17}>(2019 &rarr; 2023)</text>
      {#each ticks as t}
        <line class="grid" x1="0" x2={pw} y1={y(t)} y2={y(t)} />
        <text class="tick" x={-56} y={y(t) + 3.5}>
          {t === 0 ? '0' : '−' + Math.abs(t) / 1e6 + 'M'}
        </text>
      {/each}

      <!-- annotation over the answer -->
      <path class="bracket" d="M 4,-8 L 4,-12 L {2 * step - 4},-12 L {2 * step - 4},-8" />
      <text class="annot" x={step} y={-17}>smallest change</text>

      <!-- columns -->
      {#each bars as b (b.key)}
        {@const dim = hovered !== null && hovered !== b.key}
        <g opacity={dim ? 0.25 : 1}>
          <rect
            x={b.x} y={b.top} width={barW} height={b.h}
            fill={b.pattern ? 'url(#' + b.pattern + ')' : b.color}
          />
          <text
            class="value"
            class:is-answer={b.answer}
            x={b.cx}
            y={b.change > 0 ? b.top - 7 : b.top + b.h + 13}
          >{signedM(b.change)}</text>
          <text class="cat" class:is-answer={b.answer} x={b.cx} y={ph + 18}>{b.label}</text>
        </g>
        <rect
          class="hit" x={b.cx - step / 2} y="0" width={step} height={ph}
          onmouseenter={() => (hovered = b.key)}
          onmouseleave={() => (hovered = null)}
          role="presentation"
        />
      {/each}

      <!-- zero baseline sits above the columns so it stays readable -->
      <line class="zero" x1="0" x2={pw} y1={zeroY} y2={zeroY} />
      <text class="zero-label" x={pw} y={zeroY - 6}>no change</text>

      {#if tip}
        <g transform="translate({tipX},{tipY})" pointer-events="none">
          <rect class="tip-box" width="156" height="66" rx="4" />
          <text class="tip-name" x="10" y="17">{tip.key}</text>
          <text class="tip-row" x="10" y="32">2019: {full(tip.p19)}</text>
          <text class="tip-row" x="10" y="45">2023: {full(tip.p23)}</text>
          <text class="tip-row" x="10" y="58">
            Change: {full(tip.change)} ({minus(tip.pct.toFixed(2))}%)
          </text>
        </g>
      {/if}

      <text class="axis-cat" x={pw / 2} y={ph + 40}>
        Terminals, ordered from the least change (left) to the greatest change (right)
      </text>
      <text class="footnote-svg" x={pw / 2} y={ph + 58}>
        A column below the line means fewer passengers in 2023. Only T5 rises above it.
      </text>
    </g>
  </svg>

  <p class="note">
    Sorted by absolute change in passengers, not by percent. The two orderings disagree:
    by percent T5 changed least and T8 would sit fourth, so the ranking here is the one the
    question asks for. Colour identifies the terminal and matches Sketch A; every column is
    also labelled, so colour is never the only cue. TBIT and T4 are hatched because ten
    terminals is more than the eight distinguishable hues.
  </p>
  <details>
    <summary>Show the numbers</summary>
    <table>
      <thead>
        <tr><th scope="col">Terminal</th><th scope="col">2019</th><th scope="col">2023</th><th scope="col">Change</th><th scope="col">Percent</th></tr>
      </thead>
      <tbody>
        {#each bars as b (b.key)}
          <tr>
            <th scope="row">{b.key}</th>
            <td>{full(b.p19)}</td>
            <td>{full(b.p23)}</td>
            <td>{full(b.change)}</td>
            <td>{minus(b.pct.toFixed(2))}%</td>
          </tr>
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
  .zero { stroke: #52514e; stroke-width: 1.25; }
  .bracket { fill: none; stroke: #898781; stroke-width: 1; }
  .hit { fill: transparent; cursor: pointer; }

  .tick, .cat, .value, .axis-title, .axis-cat, .annot, .zero-label, .footnote-svg,
  .tip-row, .tip-name {
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  }
  .tick { font-size: 10px; fill: #898781; text-anchor: end; font-variant-numeric: tabular-nums; }
  .axis-title { font-size: 10px; fill: #52514e; text-anchor: start; }
  .axis-cat { font-size: 10px; fill: #52514e; text-anchor: middle; }
  .annot { font-size: 10px; fill: #52514e; text-anchor: middle; font-weight: 600; }
  .zero-label { font-size: 10px; fill: #52514e; text-anchor: end; }
  .cat { font-size: 11px; fill: #52514e; text-anchor: middle; }
  .cat.is-answer { fill: #0b0b0b; font-weight: 700; }
  .value { font-size: 10px; fill: #52514e; text-anchor: middle; font-variant-numeric: tabular-nums; }
  .value.is-answer { fill: #0b0b0b; font-weight: 700; }
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
