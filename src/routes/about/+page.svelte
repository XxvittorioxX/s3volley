<script lang="ts">
	import { writable } from 'svelte/store';

	type Match = {
		team1: string;
		team2: string;
		winner: string | null;
	};

	// Store reattivo per le finali
	const finals = writable<Match[]>([]);

	// Dati di esempio per i gruppi
	let groups: { matches: Match[] }[] = [
		{
			matches: [
				{ team1: 'Team A', team2: 'Team B', winner: 'Team A' }
			]
		},
		{
			matches: [
				{ team1: 'Team C', team2: 'Team D', winner: 'Team C' }
			]
		},
		{
			matches: [
				{ team1: 'Team E', team2: 'Team F', winner: 'Team F' }
			]
		}
	];

	function shuffleArray<T>(array: T[]): T[] {
		const arr = [...array];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	function generateFinals() {
		const winners: string[] = [];

		for (const group of groups) {
			const decidedMatch = group.matches.find(m => m.winner && m.winner !== 'BYE');
			if (decidedMatch?.winner) {
				winners.push(decidedMatch.winner);
			}
		}

		const newFinals: Match[] = [];
		const shuffled = shuffleArray(winners);

		for (let i = 0; i < shuffled.length - 1; i += 2) {
			newFinals.push({
				team1: shuffled[i],
				team2: shuffled[i + 1],
				winner: null
			});
		}

		if (shuffled.length % 2 === 1) {
			newFinals.push({
				team1: shuffled[shuffled.length - 1],
				team2: 'BYE',
				winner: shuffled[shuffled.length - 1]
			});
		}

		finals.set(newFinals);
	}

	function setFinalWinner(matchIndex: number, winner: string) {
		finals.update(current => {
			current[matchIndex].winner = winner;

			if (current.every(m => m.winner)) {
				const nextRoundTeams = current.map(m => m.winner!).filter(w => w !== 'BYE');
				if (nextRoundTeams.length > 1) {
					const shuffled = shuffleArray(nextRoundTeams);
					const nextRound: Match[] = [];

					for (let i = 0; i < shuffled.length - 1; i += 2) {
						nextRound.push({
							team1: shuffled[i],
							team2: shuffled[i + 1],
							winner: null
						});
					}

					if (shuffled.length % 2 === 1) {
						nextRound.push({
							team1: shuffled[shuffled.length - 1],
							team2: 'BYE',
							winner: shuffled[shuffled.length - 1]
						});
					}

					return nextRound;
				}
			}

			return [...current];
		});
	}
</script>

<main>
	<button on:click={generateFinals}>Genera finali tra vincitori</button>

	{#if $finals.length > 0}
		<h2>Fase Finale</h2>
		<ul>
			{#each $finals as match, i}
				<li class="final">
					{match.team1} vs {match.team2}
					{#if !match.winner}
						<button on:click={() => setFinalWinner(i, match.team1)}>{match.team1} vince</button>
						{#if match.team2 !== 'BYE'}
							<button on:click={() => setFinalWinner(i, match.team2)}>{match.team2} vince</button>
						{/if}
					{:else}
						<strong>Vincitore: {match.winner}</strong>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	main {
		max-width: 1000px;
		margin: auto;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	button {
		margin: 0.2rem;
		padding: 0.4rem 1rem;
		background: #006eff;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
	button:hover {
		background: #004fc1;
	}
	.final {
		background: #dfffe0;
		padding: 1rem;
		border-radius: 12px;
		margin: 0.5rem 0;
		width: 100%;
		max-width: 500px;
	}
</style>
