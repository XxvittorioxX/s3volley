import { writable } from 'svelte/store';

export interface Team {
	teamName: string;
	category: 'Under 10' | 'Under 12' | 'Under 14' | string;
	coachName: string;
	email: string;
	phone: string;
}

// Lista delle squadre registrate
export const registeredTeams = writable<Team[]>([]);
