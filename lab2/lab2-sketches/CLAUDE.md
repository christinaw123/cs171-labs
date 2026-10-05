# LAX Sketches: project context

## My question
- Question: Which terminals had the least change in passenger count between 2019 and 2023?
- Audience: Someone unfamiliar with the LAX terminal data.
- Measure: Absolute change in passenger counts — the `Change` column of `lax_comparison_2019_2023`. Terminals are distinguished by the `Terminal` column. Do not rank by `Change_percent`; it orders the terminals differently (T8 is smallest by `Change` but fourth-smallest by `Change_percent`).
- Two judging criteria:
  1. A reader can understand the chart without prior context or knowledge of LAX terminal data.
  2. The question is clearly stated, and a correct answer to it is also clearly stated near the title.

## Stack and conventions
- This is the supplied SvelteKit starter. Use JavaScript, Svelte 5 runes, and D3 for calculations where useful.
- The student does not use a code editor. After every change, summarize which files you changed and what each change does, in plain language.
- Keep SketchA.svelte and SketchB.svelte as separate alternatives in src/lib/.
- +page.svelte passes the same rows from src/lib/data.js to each component as a `data` prop.
- Do not load any CSV at runtime. Use only the rows in data.js.
- Keep both sketches visible side by side. Do not add controls, filters, or a dashboard unless asked.
- When revising one sketch, do not change the other.
- Do not run `npm audit fix`, change dependency versions, or run git commands.

## Data constraints
- Preserve the supplied ten-terminal comparison table and all its values.
- Both years cover January through October, summing reported arrivals and departures and domestic and international traffic.
- TBIT West Gates has no 2019 baseline and is excluded. Imperial Terminal has no records in either period. Absence is not zero.
- The included terminals are not all-airport totals for 2023.
- Counts describe passenger movements, not unique people or causes of change.

## Definition of done
- `npm run dev` shows both sketches with no errors in the browser console or the terminal.
- Labels, units, periods, and legends are readable and accurate.
- T1 shows 8,004,170 (2019) and 5,995,807 (2023); change is -2,008,363 or -25.09%.
