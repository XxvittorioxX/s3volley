import { writable } from 'svelte/store';

export type Match = {
	team1: string;
	team2: string;
	sets: [number, number][]; // ogni set è [puntiTeam1, puntiTeam2]
	winner: string | null;
};

export const matches = writable<Match[]>([]);
