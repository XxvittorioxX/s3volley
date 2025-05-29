import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { registeredTeams } from './teams';

export type Match = {
	team1: string;
	team2: string;
	sets: { team1: number; team2: number }[]; // massimo 3 set
	winner: string | null;
};

function generateMatches(teams: string[]): Match[] {
	const matches: Match[] = [];

	for (let i = 0; i < teams.length; i++) {
		for (let j = i + 1; j < teams.length; j++) {
			matches.push({
				team1: teams[i],
				team2: teams[j],
				sets: [{ team1: 0, team2: 0 }, { team1: 0, team2: 0 }, { team1: 0, team2: 0 }],
				winner: null
			});
		}
	}

	return matches;
}

// inizializza lo store
export const matches = writable<Match[]>([]);

// aggiorna automaticamente quando le squadre sono registrate
registeredTeams.subscribe(($teams) => {
	if ($teams.length >= 2 && $teams.length <= 4) {
		const teamNames = $teams.map(t => t.teamName);
		matches.set(generateMatches(teamNames));
	} else {
		matches.set([]); // svuota se non ci sono squadre valide
	}
});
