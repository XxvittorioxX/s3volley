import { derived } from 'svelte/store';
import { registeredTeams, type Team } from './teams';

export type Girone = {
	name: string;
	teams: Team[];
};

// Funzione per dividere le squadre in gironi da 2 o più
function generaGironi(teams: Team[]): Girone[] {
	const gironi: Girone[] = [];
	const maxPerGirone = 2; // oppure 3 se ne hai di più

	const shuffled = [...teams].sort(() => Math.random() - 0.5);

	for (let i = 0; i < shuffled.length; i += maxPerGirone) {
		const gruppo = shuffled.slice(i, i + maxPerGirone);
		const lettera = String.fromCharCode(65 + gironi.length); // A, B, C...
		gironi.push({ name: `Girone ${lettera}`, teams: gruppo });
	}

	return gironi;
}

// Store derivato per avere i gironi aggiornati
export const gironi = derived(registeredTeams, ($teams) => {
	return $teams.length >= 2 ? generaGironi($teams) : [];
});
