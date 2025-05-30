<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { registeredTeams } from '$lib/stores/teams';
	type Match = {
		round: number;
		team1: string;
		team2: string;
		winner: string | null;
	};

	let finalMatches: Match[][] = [];

	function shuffleArray<T>(array: T[]): T[] {
		let shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	function generateKnockoutMatches(teams: string[]): Match[][] {
		const rounds: Match[][] = [];
		let currentTeams = shuffleArray(teams);
		let round = 1;

		while (currentTeams.length > 1) {
			const roundMatches: Match[] = [];
			for (let i = 0; i < currentTeams.length; i += 2) {
				if (i + 1 < currentTeams.length) {
					roundMatches.push({
						round,
						team1: currentTeams[i],
						team2: currentTeams[i + 1],
						winner: null
					});
				} else {
					roundMatches.push({
						round,
						team1: currentTeams[i],
						team2: 'BYE',
						winner: currentTeams[i]
					});
				}
			}
			rounds.push(roundMatches);
			currentTeams = roundMatches.map(m => m.winner).filter(w => w && w !== 'BYE') as string[];
			round++;
		}

		return rounds;
	}

	onMount(() => {
		const allTeams = get(registeredTeams);
		const winnersByCategory: string[] = [];
		const categories = ['Under 10', 'Under 12', 'Under 14'];
		for (const cat of categories) {
			const teams = allTeams.filter(t => t.category === cat).map(t => t.teamName);
			if (teams.length >= 2) {
				const match = generateKnockoutMatches(teams);
				const lastRound = match[match.length - 1];
				if (lastRound?.[0]?.winner) winnersByCategory.push(lastRound[0].winner);
			}
		}
		if (winnersByCategory.length >= 2) {
			finalMatches = generateKnockoutMatches(winnersByCategory);
		}
	});

	function setFinalWinner(roundIdx: number, matchIdx: number, winner: string) {
		const match = finalMatches[roundIdx][matchIdx];
		match.winner = winner;
		const nextTeams: string[] = [];
		for (const round of finalMatches) {
			for (const m of round) {
				if (m.winner && m.winner !== 'BYE') nextTeams.push(m.winner);
			}
		}
		finalMatches = generateKnockoutMatches(nextTeams);
	}
</script>

<section>
	<h1>Finale del Torneo tra i Vincitori dei Gironi</h1>
	{#each finalMatches as round, i}
		<h2>Round {i + 1}</h2>
		<ul>
			{#each round as match, j}
				<li>
					{match.team1} vs {match.team2}<br />
					{#if !match.winner || match.winner === 'BYE'}
						<button on:click={() => setFinalWinner(i, j, match.team1)}>{match.team1} vince</button>
						{#if match.team2 !== 'BYE'}
							<button on:click={() => setFinalWinner(i, j, match.team2)}>{match.team2} vince</button>
						{/if}
					{:else}
						<p><strong>Vincitore: {match.winner}</strong></p>
					{/if}
				</li>
			{/each}
		</ul>
	{/each}
	{#if finalMatches[finalMatches.length - 1]?.[0]?.winner}
		<h2>🏆 Vincitore Finale Assoluto: {finalMatches[finalMatches.length - 1][0].winner}</h2>
	{/if}
</section>

<style>
	section {
		max-width: 800px;
		margin: auto;
		padding: 2rem;
		background: #f0f8ff;
		border-radius: 12px;
	}
	h1 {
		text-align: center;
		margin-bottom: 1rem;
	}
	ul {
		list-style: none;
		padding: 0;
	}
	li {
		margin-bottom: 1rem;
		padding: 0.5rem;
		background: #e6f0ff;
		border-radius: 8px;
	}
	button {
		margin: 0.5rem;
		padding: 0.4rem 1rem;
		background: #006eff;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
	button:hover {
		background: #0051c3;
	}
</style>
