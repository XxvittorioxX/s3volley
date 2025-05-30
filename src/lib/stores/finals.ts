// src/lib/stores/finals.ts
import { writable, get } from 'svelte/store';
import { matches, type Match } from './matches';

export type FinalMatch = {
	team1: string;
	team2: string;
	winner: string | null;
};

export const finals = writable<FinalMatch[]>([]);

function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

export function generateFinals() {
	const allMatches = get(matches);

	// Trova un vincitore per ogni categoria
	const winnersMap = new Map<string, string>();
	for (const match of allMatches) {
		if (match.winner && !winnersMap.has(match.category)) {
			winnersMap.set(match.category, match.winner);
		}
	}

	const winners = Array.from(winnersMap.values());
	const shuffled = shuffleArray(winners);

	const finalMatches: FinalMatch[] = [];
	for (let i = 0; i < shuffled.length - 1; i += 2) {
		finalMatches.push({
			team1: shuffled[i],
			team2: shuffled[i + 1],
			winner: null
		});
	}

	if (shuffled.length % 2 === 1) {
		finalMatches.push({
			team1: shuffled[shuffled.length - 1],
			team2: 'BYE',
			winner: shuffled[shuffled.length - 1]
		});
	}

	finals.set(finalMatches);
}

export function setFinalWinner(index: number, winner: string) {
	const current = get(finals);
	current[index].winner = winner;

	// Controlla se tutte le partite sono decise
	if (current.every(m => m.winner !== null)) {
		const nextRoundTeams = current.map(m => m.winner!).filter(w => w !== 'BYE');
		if (nextRoundTeams.length > 1) {
			const shuffled = shuffleArray(nextRoundTeams);
			const newRound: FinalMatch[] = [];
			for (let i = 0; i < shuffled.length - 1; i += 2) {
				newRound.push({
					team1: shuffled[i],
					team2: shuffled[i + 1],
					winner: null
				});
			}
			if (shuffled.length % 2 === 1) {
				newRound.push({
					team1: shuffled[shuffled.length - 1],
					team2: 'BYE',
					winner: shuffled[shuffled.length - 1]
				});
			}
			finals.set(newRound);
		}
	}
}
