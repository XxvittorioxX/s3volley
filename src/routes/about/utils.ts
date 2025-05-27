// Sceglie a caso un vincitore da ogni coppia
export function selectWinners(teams: string[]): string[] {
	const halfLength = Math.floor(teams.length / 2);
	const winners: string[] = [];

	for (let i = 0; i < halfLength; i++) {
		const idx = i * 2;
		const winner = Math.random() < 0.5 ? teams[idx] : teams[idx + 1];
		winners.push(winner);
	}

	return winners;
}

// Genera array di interi unici da 0 a max - 1, mescolati
function uniqueIntegers(max: number): number[] {
	const numbers = Array.from({ length: max }, (_, i) => i);

	for (let i = numbers.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[numbers[i], numbers[j]] = [numbers[j], numbers[i]];
	}

	return numbers;
}

// Mescola le squadre
export function shuffleTeams(teams: string[]): string[] {
	const indexes = uniqueIntegers(teams.length);
	return indexes.map(i => teams[i]);
}
