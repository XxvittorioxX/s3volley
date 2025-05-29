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

function generateMatches(teams: Team[]): Match[] {
	const matches: Match[] = [];
	const grouped = new Map<string, Team[]>();

	// Raggruppa per categoria
	for (const team of teams) {
		if (!grouped.has(team.category)) {
			grouped.set(team.category, []);
		}
		grouped.get(team.category)?.push(team);
	}

	// Crea match per ogni categoria
	for (const [category, teamList] of grouped.entries()) {
		for (let i = 0; i < teamList.length; i++) {
			for (let j = i + 1; j < teamList.length; j++) {
				matches.push({
					team1: teamList[i].teamName,
					team2: teamList[j].teamName,
					category,
					sets: [
						{ team1: 0, team2: 0 },
						{ team1: 0, team2: 0 },
						{ team1: 0, team2: 0 }
					],
					winner: null
				});
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
