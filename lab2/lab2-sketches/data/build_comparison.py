"""Rebuild Lab 2's teaching summary from the retained monthly source CSV.

Staff utility, standard-library Python only. Run from any working directory.
"""
from collections import defaultdict
from datetime import datetime
from pathlib import Path
import csv

DATA = Path(__file__).resolve().parent
YEARS = (2019, 2023)
MONTHS = set(range(1, 11))


def build():
    totals = defaultdict(int)
    months = defaultdict(set)
    with (DATA / 'lax_passenger_traffic.csv').open(newline='') as stream:
        source = list(csv.DictReader(stream))
    for row in source:
        date = datetime.strptime(row['ReportPeriod'], '%m/%d/%Y %I:%M:%S %p')
        if date.year in YEARS and date.month in MONTHS:
            key = (row['Terminal'], date.year)
            totals[key] += int(row['Passenger_Count'])
            months[key].add(date.month)
    terminals = sorted({row['Terminal'] for row in source})
    included = [t for t in terminals if all(months[t, y] == MONTHS for y in YEARS)]
    rows = []
    for terminal in included:
        before, after = (totals[terminal, y] for y in YEARS)
        if before <= 0:
            raise ValueError(f'No positive baseline for {terminal}')
        change = after - before
        rows.append(dict(Terminal=terminal, Passengers_2019=before,
                         Passengers_2023=after, Change=change,
                         Change_percent=f'{100 * change / before:.2f}'))
    # Fixed reference checks catch a changed source or accidental scope change.
    assert len(source) == 7883 and len(rows) == 10
    assert sum(r['Passengers_2019'] for r in rows) == 73858056
    assert sum(r['Passengers_2023'] for r in rows) == 57237197
    t1 = next(r for r in rows if r['Terminal'] == 'T1')
    assert (t1['Passengers_2019'], t1['Passengers_2023'], t1['Change'],
            t1['Change_percent']) == (8004170, 5995807, -2008363, '-25.09')
    target = DATA / 'lax_comparison_2019_2023.csv'
    with target.open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f'Built {target.name}: {len(rows)} terminals, complete Jan-Oct windows')


if __name__ == '__main__':
    build()
