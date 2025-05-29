// src/lib/stores/matches.ts
import { writable } from 'svelte/store';

export type SetResult = {
	team1Points: number;
	team2Points: number;
};

export type Match = {
	team1: string;
	team2: string;
	sets: SetResult[]; // fino a 3 set
	team1SetsWon: number;
	team2SetsWon: number;
	winner: string | null;
};

export const matches = writable<Match[]>([]);
