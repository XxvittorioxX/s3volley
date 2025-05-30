<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { registeredTeams } from '$lib/stores/teams';

	type Match = {
		team1: string;
		team2: string;
		winner: string | null;
	};

	let groupMatchesByCategory: Record<string, Match[]> = {};
	let finalEliminationRounds: Match[][] = [];
	let categoryWinners: string[] = [];

	function generateGroupMatches(teams: string[]): Match[] {
		const matches: Match[] = [];
		for (let i = 0; i < teams.length; i++) {
			for (let j = i + 1; j < teams.length; j++) {
				matches.push({ team1: teams[i], team2: teams[j], winner: null });
			}
		}
		return matches;
	}

	function generateEliminationRounds(teams: string[]): Match[][] {
		const rounds: Match[][] = [];
		let currentTeams = [...teams];

		for (let i = currentTeams.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[currentTeams[i], currentTeams[j]] = [currentTeams[j], currentTeams[i]];
		}

		while (currentTeams.length > 1) {
			const roundMatches: Match[] = [];
			for (let i = 0; i < currentTeams.length; i += 2) {
				if (i + 1 < currentTeams.length) {
					roundMatches.push({ team1: currentTeams[i], team2: currentTeams[i + 1], winner: null });
				} else {
					roundMatches.push({ team1: currentTeams[i], team2: 'BYE', winner: currentTeams[i] });
				}
			}
			rounds.push(roundMatches);
			currentTeams = roundMatches.map(m => m.winner).filter(w => w && w !== 'BYE') as string[];
		}
		return rounds;
	}

	onMount(() => {
		const allTeams = get(registeredTeams);
		const categories = [...new Set(allTeams.map(t => t.category))];

		for (const category of categories) {
			const teams = allTeams.filter(t => t.category === category).map(t => t.teamName);
			if (teams.length >= 2) {
				groupMatchesByCategory[category] = generateGroupMatches(teams);
			}
		}
	});

	function setGroupWinner(category: string, matchIdx: number, winner: string) {
		groupMatchesByCategory[category][matchIdx].winner = winner;

		const allMatches = groupMatchesByCategory[category];
		const winnersCount: Record<string, number> = {};
		for (const match of allMatches) {
			if (match.winner) {
				winnersCount[match.winner] = (winnersCount[match.winner] || 0) + 1;
			}
		}

		let topTeam = Object.entries(winnersCount).sort((a, b) => b[1] - a[1])[0]?.[0];
		if (topTeam && !categoryWinners.includes(topTeam)) {
			categoryWinners.push(topTeam);
			finalEliminationRounds = generateEliminationRounds(categoryWinners);
		}
	}

	function setFinalWinner(roundIdx: number, matchIdx: number, winner: string) {
		finalEliminationRounds[roundIdx][matchIdx].winner = winner;
		const nextRoundTeams = finalEliminationRounds[roundIdx]
			.map(m => m.winner)
			.filter(w => w && w !== 'BYE') as string[];

		finalEliminationRounds = finalEliminationRounds.slice(0, roundIdx + 1);
		if (nextRoundTeams.length > 0) {
			finalEliminationRounds.push(generateEliminationRounds(nextRoundTeams)[0]);
		}
	}
</script>

<section>
	<h1>Gironi per Categoria</h1>
	{#each Object.entries(groupMatchesByCategory) as [category, matches]}
		<h2>{category}</h2>
		<ul>
			{#each matches as match, i}
				<li>
					{match.team1} vs {match.team2} <br />
					{#if !match.winner}
						<button on:click={() => setGroupWinner(category, i, match.team1)}>{match.team1} vince</button>
						<button on:click={() => setGroupWinner(category, i, match.team2)}>{match.team2} vince</button>
					{:else}
						<p><strong>Vincitore: {match.winner}</strong></p>
					{/if}
				</li>
			{/each}
		</ul>
	{/each}

	{#if finalEliminationRounds.length > 0}
		<h2>Fase Finale tra i Vincitori dei Gironi</h2>
		{#each finalEliminationRounds as round, i}
			<h3>Round {i + 1}</h3>
			<ul>
				{#each round as match, j}
					<li>
						{match.team1} vs {match.team2} <br />
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
		{#if finalEliminationRounds[finalEliminationRounds.length - 1]?.length === 1 && finalEliminationRounds[finalEliminationRounds.length - 1][0].winner}
			<h2>🏆 Vincitore Assoluto: {finalEliminationRounds[finalEliminationRounds.length - 1][0].winner}</h2>
		{/if}
	{/if}
</section>

<style>
	section {
		max-width: 900px;
		margin: auto;
		padding: 2rem;
		background: #f0f8ff;
		border-radius: 12px;
	}
	h1, h2, h3 {
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