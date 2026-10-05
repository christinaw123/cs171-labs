# Billboard Hot 100 — Every #1 Hit, 1958–2025

Source: **"Uncharted Territory"** dataset by music journalist & data analyst
**Chris Dalla Riva**, one row per song that reached **#1 on the Billboard Hot 100**
from the chart's debut (Aug 4, 1958) through early 2025. Found via *Data Is Plural*
(2025-08-27 edition). Compiled from the author's public Google Sheet.

- File: `billboard_hot_100_no1.csv`
- **1,177 rows, one per song** (the week it *reached* #1), **105 columns**, ~2.3 MB.
- Author's newsletter: *Can't Get Much Higher* (cantgetmuchhigher.com).

> **This file has 105 columns.** Most are esoteric (instrumentation flags: `Cowbell`,
> `Kazoo`, `Sitar`…). This lab uses **about nine of them** — listed below. Part of the
> work is *narrowing* the dataset to the columns your dashboard actually needs.

## Columns that matter for this lab

| Column | Type | Range / values (this file) | Notes |
| --- | --- | --- | --- |
| `Song` | string | 1,177 titles | For labels / tooltips. |
| `Artist` | string | 763 distinct lead artists | For labels / tooltips. |
| `Date` | date | `4-Aug-58` … `11-Jan-25` | Week the song **reached** #1. **Two-digit year** — see quirks. |
| `Weeks at Number One` | int | 1 … 19 (mean 2.9) | **Dominance**, not "reached #1". Most songs: 1–2 weeks. |
| `CDR Genre` | string | Pop 355, Rock 281, Funk/Soul 228, Electronic/Dance 91, Hip Hop 88, … | Hand-coded genre. **Multi-valued & has blanks** — see quirks. |
| `BPM` | int | 16 … 206 (mean 116) | Tempo (beats per minute). |
| `Energy` | int | 3 … 98 | Spotify-style audio feature, **0–100 scale**. |
| `Danceability` | int | 14 … 98 | Audio feature, 0–100. |
| `Happiness` | int | 4 … 99 | Valence (musical positivity), 0–100. |
| `Acousticness` | int | 0 … 99 | Audio feature, 0–100. |
| `Loudness (dB)` | int | −23 … −1 | Integrated loudness. Rises over the decades (the "loudness war"). |
| `Length (Sec)` | int | 96 … 613 (mean 221) | Song length in seconds. |
| `Front Person Age` | int | 11 … 78 (mean 28) | Age of the lead performer at #1. 22 blanks. |

Every value loads as a **string**; convert every numeric column (`Weeks at Number One`,
`BPM`, `Energy`, `Danceability`, `Happiness`, `Acousticness`, `Loudness (dB)`,
`Length (Sec)`, `Front Person Age`) to a number, and parse `Date`.

## Quirks that matter for *judging* a dashboard

- **The date is a two-digit-year trap.** `Date` looks like `4-Aug-58`. The naive parse
  `d3.timeParse("%d-%b-%y")` pivots the century at 1969: `"58"` becomes **2058**, not 1958,
  so your entire 20th century lands in the *future*. **Judge the time axis:** it must run
  1958 → 2025. Fix by parsing to a 4-digit year (e.g. build `Date` as `19xx`/`20xx` by hand,
  or post-process: any year > 2025 → subtract 100).
- **One row per song, not per chart-week.** A row records the week a song *reached* #1.
  "Number of #1 songs per year" (count of rows) is a *different* measure from "weeks spent at
  #1" (`Weeks at Number One`). A song with 19 weeks at #1 is **one** row. Don't let a "songs
  per year" timeline get described as "time spent at #1."
- **Genre is multi-valued and sometimes blank.** `CDR Genre` can be `Pop;Rock`
  (41 rows carry a `;`) and is **blank for 88 songs**. Pick a rule and state it — e.g.
  *primary genre = the text before the first `;`* — and treat blank as **"unlabeled,"** a real
  category, not zero. A genre bar chart that silently drops the blanks under-counts.
- **The audio features are 0–100, on their own scales.** `Energy`, `Danceability`,
  `Happiness`, `Acousticness` share a 0–100 range; `BPM`, `Loudness (dB)`, `Length (Sec)`,
  `Front Person Age` do **not**. Don't put two different-unit fields on one shared scale.
- **This is only #1 songs.** Every song here was, by construction, a chart-topper. The data
  says nothing about songs that peaked at #2, or about the Hot 100 as a whole — it's the
  extreme tip. Don't let a chart imply "this is what music sounded like"; it's what *#1s*
  sounded like.

## The stories in here

- **Genre eras.** Rock's rise and long decline; Funk/Soul's peak; Hip Hop and
  Electronic/Dance arriving after ~1990. Brush a decade and watch the genre mix change.
- **The audio drift.** Over 60+ years #1 songs get **louder** (`Loudness (dB)` climbs toward
  0), and shift in `Danceability`/`Energy` — the sound of "the top" is not stationary.
- **Dynasties vs. one-week wonders.** `Weeks at Number One` is wildly skewed: most songs sit
  a week or two; a handful (Mariah Carey, Lil Nas X, Whitney Houston) camp for 14–19 weeks.
