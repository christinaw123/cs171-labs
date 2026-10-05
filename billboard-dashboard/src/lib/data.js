import * as d3 from 'd3';

export const FIRST_YEAR = 1958;
export const LAST_YEAR = 2025;

const parseDate = d3.timeParse('%d-%b-%y');

// "4-Aug-58" has a two-digit year. %y maps 00–68 to 2000–2068, so any
// parsed year after the last year in the data belongs to the 1900s.
export function parseYear(dateString) {
	const date = parseDate(dateString);
	if (!date) return null;
	const year = date.getFullYear();
	return year > LAST_YEAR ? year - 100 : year;
}

// Blank cells become null instead of 0, so missing values are not plotted as real zeros.
function toNumber(value) {
	return value == null || value.trim() === '' ? null : +value;
}

// "Pop;Rock" -> "Pop"; blank -> "Unlabeled" (kept as a real category).
export function primaryGenre(cdrGenre) {
	return (cdrGenre ?? '').split(';')[0].trim() || 'Unlabeled';
}

// d3.csv row function: keeps only the fields the dashboard uses. One row = one #1 song.
export function parseRow(row) {
	return {
		song: row['Song'],
		artist: row['Artist'],
		year: parseYear(row['Date']),
		weeksAtNumberOne: toNumber(row['Weeks at Number One']),
		genre: primaryGenre(row['CDR Genre']),
		bpm: toNumber(row['BPM']),
		danceability: toNumber(row['Danceability']),
		energy: toNumber(row['Energy'])
	};
}

// "1 song", "2 songs", "1,177 songs" (also for phrases: plural(1, '#1 song') -> "1 #1 song").
export function plural(n, word) {
	return `${d3.format(',')(n)} ${n === 1 ? word : word + 's'}`;
}

// Genre colors, shared by GenreBars, Scatter, and KpiRow. Keyed by genre name (never by rank), so
// filtering never repaints a genre. Only the four largest genres get hues: past four, categorical
// colors can't be told apart in a dense scatterplot (validated colorblind-safe, all pairs).
// The other eight genres share one gray; Unlabeled is drawn as an outline (hollow) in a darker gray.
export const GENRE_COLORS = {
	Pop: '#2a78d6',
	Rock: '#eb6834',
	'Funk/Soul': '#1baf7a',
	'Electronic/Dance': '#4a3aa7'
};
export const OTHER_COLOR = '#a8aeb5';
export const UNLABELED_COLOR = '#6e7781';

export function genreColor(genre) {
	return GENRE_COLORS[genre] ?? (genre === 'Unlabeled' ? UNLABELED_COLOR : OTHER_COLOR);
}

// Legend entries, in the same order everywhere.
export const GENRE_LEGEND = [
	...Object.entries(GENRE_COLORS).map(([label, color]) => ({ label, color, hollow: false })),
	{ label: 'Other genres', color: OTHER_COLOR, hollow: false },
	{ label: 'Unlabeled', color: UNLABELED_COLOR, hollow: true }
];

// Song counts per primary genre, highest first (ties broken alphabetically).
export function countByGenre(songs) {
	return d3
		.rollups(songs, (v) => v.length, (d) => d.genre)
		.map(([genre, count]) => ({ genre, count }))
		.sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre));
}
