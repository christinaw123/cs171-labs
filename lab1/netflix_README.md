# Netflix Movies and TV Shows (catalog snapshot, late September 2021)

## Source

Kaggle — [anandshaw2001/netflix-movies-and-tv-shows](https://www.kaggle.com/datasets/anandshaw2001/netflix-movies-and-tv-shows)

**Caveat on currency:** the listing description references mid-2024 Netflix subscriber numbers, but the data itself is unchanged from the well-known September 2021 scrape (8,807 rows, max `date_added` 2021-09-25, identical schema to `shivamb/netflix-shows`). Treat as a 2021 snapshot regardless of how the listing reads.

## Size & format

1 CSV, ~3.3 MB, 8,807 rows × 12 columns.

## Schema

| Column | Type | Notes |
|---|---|---|
| `show_id` | str | Primary key |
| `type` | enum | `Movie` or `TV Show` |
| `title` | str | |
| `director` | str | ~30% null |
| `cast` | str | ~9% null |
| `country` | str | ~9% null; comma-separated, multi-valued |
| `date_added` | str → date | 10 nulls; some trailing whitespace |
| `release_year` | int | |
| `rating` | str | MPAA/TV |
| `duration` | str | `N min` for Movies, `N Season(s)` for TV Shows |
| `listed_in` | str | comma-separated genres; 42 distinct |
| `description` | str | ~140 chars |

## Candidate viz (D3 gallery)

- **Default:** bar chart (top countries, top genres); horizontal bar chart
- **Better:** world choropleth on title count; calendar heatmap on `date_added` (gallery's Calendar example); slope chart of Movie vs TV share by year
- **Stretch:** bar chart race of titles-per-country over `date_added` years; streamgraph of genre composition by release year; sankey of country → genre; ridgeline of `release_year` per genre; treemap of genre hierarchy

## Story angles

- **Catalog tilted hard toward the present:** 67.3% of titles released in the 2010s, plus 17.5% in 2020–21, leaving only ~15% for everything before 2010. The "Netflix archive" basically isn't one.
- **The acquisition wave ended:** titles added per year went 24 → 82 → 429 → 1,188 → 1,649 → 2,016 (peak 2019) → 1,879 → 1,498. The peak is past, and 2021 is partial-year so the real drop is sharper.
- **Mix shift toward TV:** across the whole catalog it's 70% Movies / 30% TV Shows, but in 2020-released titles it's nearly 50/50 (794 / 751). The shape of "Netflix" is changing under our feet.
- **International tilt:** "International Movies" (2,752) is the #1 genre tag — bigger than "Dramas". India is #2 by country (1,046), almost a third of the US count, and Korea, Japan, Spain, Turkey, Egypt, Nigeria are all in the top 15. The catalog is not America-with-imports; it's global-with-an-American-anchor.
- **Movies are added years after release; TV Shows are added the same year.** Median lag: 2 years for movies, 0 for TV. Suggests different licensing/production models — TV is increasingly Netflix-originated, movies skew acquired.

## Cleaning notes

- `country` needs splitting on `, ` and exploding — 826 of 8,807 titles list 2+ countries (max 12). Note: this triple-counts co-productions if you sum.
- 3 rows have a duration string in the `rating` column (e.g. `74 min`) — known data-entry artefact, easy fix by detecting the `min` suffix.
- 10 `date_added` values are null and a few have trailing whitespace; parse with `errors='coerce'`.
- `duration` mixes units across types — split by `type` before any numeric work.
- For a world choropleth, remap `United States` → `United States of America` and `Czech Republic` → `Czechia` to match `world-atlas-110m`. Hong Kong is not a separate feature in the 110m file (it folds into China) — flag this caveat.

## Sample prompts (escalating)

1. "Make a horizontal bar chart of the top 15 countries by number of titles, with the bar segmented into Movies and TV Shows."
2. "Build a calendar heatmap of titles added by day from 2016 to 2021. Annotate the largest single-day spikes with the country or genre that drove them."
3. "Compute, for each release year from 2000 to 2021, the share of newly released titles that were TV Shows rather than Movies. Show it as a slope chart with the endpoints labeled and a short annotation explaining what changed."
4. "Cluster genres by co-occurrence in the `listed_in` field and draw a force-directed graph or chord diagram. Justify your viz choice given that genres are multi-valued and overlapping."

## Verdict

**STRONG candidate.** Hits map, time-series, hierarchy, network, and calendar — broad gallery coverage. Clean enough for warm-up prompts; the rating/duration anomaly and the multi-country comma-split give a real but bounded data-quality lesson. The `date_added` vs `release_year` distinction creates a teachable "which time is the right time?" decision the students have to make explicitly. The listing-vs-data temporal mismatch is itself a small teaching moment about vetting Kaggle re-uploads.
