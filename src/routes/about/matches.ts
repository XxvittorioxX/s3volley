import { writable } from 'svelte/store';

export interface SetScore {
	team1: number;
	team2: number;
}

export interface Match {
	team1: string;
	team2: string;
	category: string;
	sets: SetScore[];
	winner: string | null;
}

// Lista delle partite con risultati
export const matches = writable<Match[]>([]);
