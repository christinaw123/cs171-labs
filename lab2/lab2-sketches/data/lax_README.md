# LAX Passenger Traffic by Terminal (2006–2023)

## Source

City of Los Angeles open data — [Los Angeles International Airport — Passenger Traffic By Terminal](https://catalog.data.gov/dataset/los-angeles-international-airport-passenger-traffic-by-terminal), published via `data.lacity.org` and indexed on `catalog.data.gov`. Dataset last updated November 30, 2023; catalog last checked August 2, 2025. Public-domain city government data.

Monthly counts of passengers passing through each terminal at LAX, broken out by arrival vs. departure and by domestic vs. international.

**Coverage caveat:** the file stops at October 2023. Anything compared "year-over-year" against 2023 has to use a 10-month window (Jan–Oct), not a full year, or the result is meaningless.

**Terminal lifecycle quirks worth knowing before you draw anything:**
- **Imperial Terminal** stops reporting after 2016 (a small charter/general-aviation building).
- **TBIT West Gates** doesn't start reporting until 2021 — it's a *new* gate complex, not a renaming.
- **T3** is missing entirely for 2021. T3 was being rebuilt as Delta's new terminal during COVID; the published data simply has no rows for it that year.

## Size & format

1 CSV, ~600 KB, 7,883 rows × 6 columns.

```
Los_Angeles_International_Airport_-_Passenger_Traffic_By_Terminal.csv
```

## Schema

| Column | Type | Notes |
|---|---|---|
| `DataExtractDate` | str → datetime | When this row was pulled from the source system. Same `ReportPeriod` can appear with multiple extract dates, but the final published row per key is unique (see below) |
| `ReportPeriod` | str → date | The month being reported. Always the **first day of the month at midnight**, formatted `MM/DD/YYYY HH:MM:SS AM`. Parse it before doing anything |
| `Terminal` | enum (12) | T1–T8, TBIT, TBIT West Gates, Miscellaneous Terminal, Imperial Terminal |
| `Arrival_Departure` | enum | `Arrival` or `Departure` |
| `Domestic_International` | enum | `Domestic` or `International` |
| `Passenger_Count` | int | Passengers in that month / terminal / direction / flight class |

Each (`ReportPeriod`, `Terminal`, `Arrival_Departure`, `Domestic_International`) tuple is unique — no duplicates to deduplicate.

## What's actually in the file

Unlike most teaching CSVs, this one is clean and tells a real, dramatic story. Headline aggregates:

| Year | Passengers (M) | Notes |
|---|---|---|
| 2006 | 61.0 | start of data |
| 2019 | **88.1** | all-time peak |
| 2020 | 28.8 | COVID — down 67% YoY |
| 2021 | 48.0 | partial rebound |
| 2022 | 66.0 | |
| 2023 (10 mo) | 62.8 | annualized 75.3M → 85% of 2019 |

Inside those numbers:

- **Apr 2020 was 0.30M passengers** — a 96% collapse from a typical month. Recovery starts the next month and is roughly monotonic from there.
- **Domestic vs. international** runs ~73 / 27 across the full series. International share crept up from 26.7% (2009) → 29.8% (2018), then **collapsed to 16.6% in 2021** (domestic recovered first), then snapped back to 29.5% by 2023.
- **Arrivals ≈ departures** to within 0.3% across the full series (592.6M vs. 590.7M) — useful as a sanity check on any aggregation you do.
- **Seasonality is mild.** July (9.7% of annual) is the peak month, February (6.8%) the trough. Summer bump, December bump, nothing wild.
- **The recovery is wildly uneven by terminal.** Jan–Oct 2023 vs. Jan–Oct 2019:
  - T5: **106%** (already past pre-COVID — Delta's renovated home)
  - T2/T3/T7/T8: 84–89%
  - TBIT: 75% — but TBIT + the new TBIT West Gates together are at **112%** of 2019
  - **T4: 47%** (American Airlines' hub — operations shifted)
  - Miscellaneous: 42%

> **Note (Week 2 lab):** this file is the instructor-facing dataset dossier. In the lab itself, students build a Svelte component dashboard (KPI cards + a line chart + a terminal filter) from the wireframe in `lab02.md`. Fully-worked reference dashboards (a Tufte-styled small-multiples version and a dark "BI" version) exist in the source `ai-visualization` repo if you want comparison artifacts; they are deliberately *not* shipped in the lab folder so students build their own.

## Story angles

- **The COVID crater and what came after.** This is the obvious story but the dataset supports a *specific* version of it: not just "traffic fell," but that the *composition* changed. Domestic returned first; international stayed depressed through 2021; T4 (American) has still not recovered while T5 (Delta) has overshot. A good viz should let those facts coexist on one screen rather than averaging them into one "LAX recovery" curve.
- **TBIT West Gates is invisible if you only look at totals.** It came online in 2021 and immediately absorbed ~5.5M passengers (Jan–Oct 2023), comparable to what TBIT itself loses against 2019. If you only chart "TBIT" you'll conclude international hasn't recovered; if you sum TBIT + West Gates you'll conclude it has. Both stories are technically true and the viz design has to decide which.
- **Monotone growth, then a cliff.** From 2009 to 2019 LAX grew almost monotonically (56.5M → 88.1M, +56% in a decade). That's a 13-year uptrend interrupted in a single quarter. The shape itself is the story — it's hard to find in this file the kind of multi-year slumps a "noisier" airport dataset might show.
- **Seasonality is real but small.** A common trap: scale a y-axis tight enough and the summer bump looks dramatic; on the actual scale it's a 30% delta peak-to-trough, much less than the COVID drop. Any month-of-year viz should keep the COVID-era cells in the same color scale or it'll lie by omission.
- **The "miscellaneous" terminal is mostly noise.** It carries ~2–3% of passengers in normal years, and its numbers fluctuate more than the named terminals. Aggregations that bucket it with the small terminals (T8, Imperial) can give it disproportionate visual weight.

## Cleaning notes

- **Parse `ReportPeriod`.** It's a string formatted `MM/DD/YYYY HH:MM:SS AM`. The HH:MM:SS is always `12:00:00 AM` — it's a date in a timestamp slot.
- **Ignore `DataExtractDate` for analysis.** It's metadata about *when the row was published*, not when the passengers travelled. Different extracts of the same period do not appear with different counts in the published file.
- **Imperial Terminal and TBIT West Gates have non-overlapping coverage** (2006–2016 and 2021–2023 respectively). Any "terminal × year" matrix needs to handle the missing cells — they are absent, not zero. T3 is missing for 2021 in the same way.
- **No nulls, no duplicates, no malformed rows.** 7,883 rows in, 7,883 rows usable.
- **Aggregations split four ways.** Each (terminal, month) has up to 4 rows: arrival/departure × domestic/international. Always be explicit which slice your numbers represent.

## Verdict

**STRONG.** Small file, clean schema, real story. The CSV-to-dashboard path is short because there's no cleaning friction — the pedagogical reward is on the *design* side: what to highlight, what to aggregate, how to handle the lifecycle quirks (Imperial, TBIT West Gates, T3-2021) without lying or hiding them. The dataset has at least three independent angles (COVID recovery, international share dynamics, per-terminal divergence) that don't collapse into the same chart, which makes it a good vehicle for a multi-panel dashboard rather than a single hero chart.
