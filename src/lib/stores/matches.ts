import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { registeredTeams, type Team } from './teams';

export type Match = {
	team1: string;
	team2: string;
	category: string;
	sets: { team1: number; team2: number }[];
	winner: string | null;
};

function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

function generateMatches(teams: Team[]): Match[] {
	const matches: Match[] = [];
	const grouped = new Map<string, Team[]>();

	// Raggruppa le squadre per categoria
	for (const team of teams) {
		if (!grouped.has(team.category)) {
			grouped.set(team.category, []);
		}
		grouped.get(team.category)?.push(team);
	}

	// Per ogni categoria, genera una sola partita casuale per squadra (senza ripetizioni)
	for (const [category, teamList] of grouped.entries()) {
		const shuffledTeams = shuffleArray(teamList);
		const used = new Set<string>();

		for (let i = 0; i < shuffledTeams.length - 1; i++) {
			const team1 = shuffledTeams[i];
			if (used.has(team1.teamName)) continue;

			for (let j = i + 1; j < shuffledTeams.length; j++) {
				const team2 = shuffledTeams[j];
				if (used.has(team2.teamName)) continue;

				matches.push({
					team1: team1.teamName,
					team2: team2.teamName,
					category,
					sets: [
						{ team1: 0, team2: 0 },
						{ team1: 0, team2: 0 },
						{ team1: 0, team2: 0 }
					],
					winner: null
				});
				used.add(team1.teamName);
				used.add(team2.teamName);
				break;
			}
		}
	}

	return matches;
}

export const matches = writable<Match[]>([]);

registeredTeams.subscribe(($teams) => {
	if ($teams.length >= 2) {
		matches.set(generateMatches($teams));
	} else {
		matches.set([]);
	}
});
