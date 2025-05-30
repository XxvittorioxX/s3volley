<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { registeredTeams, type Team } from '$lib/stores/teams';

	type Match = {
		round: number;
		team1: string;
		team2: string;
		winner: string | null;
	};

	let matchesByCategory: Record<string, Match[][]> = {
		"Under 10": [],
		"Under 12": [],
		"Under 14": []
	};

	function generateEliminationMatches(teams: string[]): Match[][] {
		const rounds: Match[][] = [];
		let currentTeams = [...teams];

		// Shuffle for randomness
		for (let i = currentTeams.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[currentTeams[i], currentTeams[j]] = [currentTeams[j], currentTeams[i]];
		}

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
					// Automatic win if odd number
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
		const categories = ["Under 10", "Under 12", "Under 14"];
		for (const category of categories) {
			const teamsInCategory = allTeams.filter(t => t.category === category).map(t => t.teamName);
			if (teamsInCategory.length >= 2) {
				matchesByCategory[category] = generateEliminationMatches(teamsInCategory);
			}
		}
	});

	function setWinner(category: string, roundIdx: number, matchIdx: number, winner: string) {
		const match = matchesByCategory[category][roundIdx][matchIdx];
		match.winner = winner;

		// Recalculate next rounds
		const teams: string[] = [];
		for (const round of matchesByCategory[category]) {
			for (const m of round) {
				if (m.winner && m.winner !== 'BYE') teams.push(m.winner);
			}
		}
		matchesByCategory[category] = generateEliminationMatches(teams);
	}
</script>

<section>
	<h1>Partite a Eliminazione Diretta</h1>

	{#each Object.entries(matchesByCategory) as [category, rounds]}
		{#if rounds.length > 0}
			<h2>{category}</h2>
			{#each rounds as round, i}
				<h3>Round {i + 1}</h3>
				<ul>
					{#each round as match, j}
						<li>
							{match.team1} vs {match.team2} <br />
							{#if !match.winner || match.winner === 'BYE'}
								<button on:click={() => setWinner(category, i, j, match.team1)}>{match.team1} vince</button>
								{#if match.team2 !== 'BYE'}
									<button on:click={() => setWinner(category, i, j, match.team2)}>{match.team2} vince</button>
								{/if}
							{:else}
								<p><strong>Vincitore: {match.winner}</strong></p>
							{/if}
						</li>
					{/each}
				</ul>
			{/each}

			{#if rounds[rounds.length - 1]?.length === 1 && rounds[rounds.length - 1][0].winner}
				<h3>🏆 Vincitore Finale {category}: {rounds[rounds.length - 1][0].winner}</h3>
			{/if}
		{/if}
	{/each}
</section>

<style>
	section {
		max-width: 900px;
		margin: auto;
		padding: 2rem;
		background: #f0f8ff;
		border-radius: 12px;
	}
	h1 {
		text-align: center;
		margin-bottom: 2rem;
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