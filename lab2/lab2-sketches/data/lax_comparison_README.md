# LAX Comparison for Lab 2

This teaching summary is derived from the retained `lax_passenger_traffic.csv` in this folder, the 7,883-row City of Los Angeles LAX passenger-traffic snapshot covering January 2006 through October 2023. See `lax_README.md` for the original source information. The summary introduces no new observations.

## Scope

For each terminal, sum `Passenger_Count` over January through October in 2019 and separately in 2023, including all reported arrival/departure and domestic/international rows. Retain terminals only if they have at least one record in each of the ten months in both years. Month coverage does not imply that all four direction/class combinations exist; sum only recorded rows.

Ten categories qualify: T1 through T8, TBIT, and Miscellaneous Terminal. Imperial Terminal has no records in either comparison period. TBIT West Gates has no 2019 baseline and is excluded. Missing records have not been filled with zero.

The result compares the same terminal labels across years. It is not a constant-capacity or constant-airline comparison: terminal operations changed, and TBIT West Gates appears separately in 2023. Do not infer causes or treat the included terminals' subtotal as all-airport 2023 traffic. Passenger counts measure reported movements, not unique people.

## Columns

| Column | Definition |
| --- | --- |
| `Terminal` | Original source label |
| `Passengers_2019` | Sum of recorded passenger movements, January–October 2019 |
| `Passengers_2023` | Sum of recorded passenger movements, January–October 2023 |
| `Change` | `Passengers_2023 - Passengers_2019` |
| `Change_percent` | `100 * Change / Passengers_2019`, rounded to two decimals |

Counts and absolute changes are integers. Percentage changes can be negative. A percentage change is distinct from the percent of the baseline recovered: −25.09% change corresponds to approximately 74.91% of the baseline. Preserve underlying values when rounding display labels.

## Verification Values

| Check | Expected value |
| --- | --- |
| Summary rows | 10 |
| Included-terminal 2019 subtotal | 73,858,056 |
| Included-terminal 2023 subtotal | 57,237,197 |
| T1, 2019 / 2023 | 8,004,170 / 5,995,807 |
| T1, change / percentage change | −2,008,363 / −25.09% |
| T5, 2019 / 2023 | 8,222,531 / 8,729,408 |
| T5, change / percentage change | 506,877 / 6.16% |

The full source has 62,755,226 passengers across all terminals in January–October 2023. The difference, 5,518,029, is TBIT West Gates, which is excluded from the comparison. Both totals are valid for their stated scopes.

## Rebuilding the Summary

Staff can run `python3 build_comparison.py` from this directory. The script uses only Python's standard library and reads the retained monthly CSV. It checks the source row count, complete month coverage for included terminals, comparison totals, and the T1 reference values before writing the summary. Students do not need to run this script for Lab 2.
