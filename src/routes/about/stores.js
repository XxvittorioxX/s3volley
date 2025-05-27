import { writable } from 'svelte/store';
import { shuffleTeams } from './utils.js';


const teams = [
		'Turtles',
		'Hummingbirds',
		'Dolphins',
		'Lambs',
		'Lions',
		'Giraffes',
		'Wolves',
		'Pellicans'
	];

function createNames() {
	const { subscribe, set, update } = writable(teams);
	
	return({
		subscribe,
		shuffle: () => update(n => n = shuffleTeams(n))
	});
}

export const names = createNames();