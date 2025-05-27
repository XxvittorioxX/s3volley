import { writable } from 'svelte/store';

export type Team = {
	teamName: string;
	category: string;
	coachName: string;
	email: string;
	phone: string;
};

export const registeredTeams = writable<Team[]>([]);