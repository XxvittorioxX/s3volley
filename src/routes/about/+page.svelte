<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { registeredTeams } from '$lib/stores/teams';

	type Match = {
		team1: string;
		team2: string;
		winner: string | null;
	};

	type Group = {
		name: string;
		category: string;
		teams: string[];
		matches: Match[];
	};

	let groups: Group[] = [];
	let finalMatch: { team1: string; team2: string; winner: string | null } | null = null;

	function shuffleArray<T>(array: T[]): T[] {
		const arr = [...array];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	function generateGroupMatches(teams: string[]): Match[] {
		const matches: Match[] = [];
		for (let i = 0; i < teams.length; i++) {
			for (let j = i + 1; j < teams.length; j++) {
				matches.push({ team1: teams[i], team2: teams[j], winner: null });
			}
		}
		return matches;
	}

	onMount(() => {
		const allTeams = get(registeredTeams);
		const categories = ['Under 10', 'Under 12', 'Under 14'];
		groups = [];

		for (const category of categories) {
			const teamsInCat = shuffleArray(allTeams.filter(t => t.category === category).map(t => t.teamName));
			if (teamsInCat.length >= 2) {
				const group: Group = {
					name: `Girone ${category}`,
					category,
					teams: teamsInCat,
					matches: generateGroupMatches(teamsInCat)
				};
				groups.push(group);
			}
		}
	});

	function setWinner(groupIndex: number, matchIndex: number, winner: string) {
		groups[groupIndex].matches[matchIndex].winner = winner;
	}

	function calculateGroupWinner(group: Group): string | null {
		const scoreMap: Record<string, number> = {};
		for (const team of group.teams) {
			scoreMap[team] = 0;
		}
		for (const match of group.matches) {
			if (match.winner) scoreMap[match.winner]++;
		}
		const sorted = Object.entries(scoreMap).sort((a, b) => b[1] - a[1]);
		return sorted[0][1] > 0 ? sorted[0][0] : null;
	}

	function generateFinalMatch() {
		const winners: string[] = [];
		for (const group of groups) {
			const winner = calculateGroupWinner(group);
			if (winner) winners.push(winner);
		}
		if (winners.length === 2) {
			finalMatch = {
				team1: winners[0],
				team2: winners[1],
				winner: null
			};
		} else {
			finalMatch = null;
		}
	}

	function setFinalWinner(winner: string) {
		if (finalMatch) finalMatch.winner = winner;
	}
</script>

<main>
	<h1 style="margin: 2rem 0;">Fase a Gironi per Categoria</h1>

	{#each groups as group, i}
		<div class="group">
			<h2>{group.name}</h2>
			{#each group.matches as match, j}
				<div class="match">
					{match.team1} vs {match.team2}
					{#if !match.winner}
						<div>
							<button on:click={() => setWinner(i, j, match.team1)}>{match.team1} vince</button>
							<button on:click={() => setWinner(i, j, match.team2)}>{match.team2} vince</button>
						</div>
					{:else}
						<p><strong>Vincitore: {match.winner}</strong></p>
					{/if}
				</div>
			{/each}
		</div>
	{/each}

	<button on:click={generateFinalMatch} style="margin: 2rem; font-size: 1rem;">Genera Finale tra i Vincitori</button>

	{#if finalMatch}
		<section class="final">
			<h2>Finale tra Vincitori di Categoria</h2>
			<p>{finalMatch.team1} vs {finalMatch.team2}</p>
			{#if !finalMatch.winner}
				<button on:click={() => setFinalWinner(finalMatch.team1)}>{finalMatch.team1} vince</button>
				<button on:click={() => setFinalWinner(finalMatch.team2)}>{finalMatch.team2} vince</button>
			{:else}
				<h3>🏆 Vincitore Finale: {finalMatch.winner}</h3>
			{/if}
		</section>
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
	.group {
		margin-bottom: 2rem;
		padding: 1rem;
		background: #e6f0ff;
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
	}
	.match {
		background: #fff;
		padding: 0.5rem;
		border-radius: 8px;
		margin-bottom: 0.5rem;
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
	}
</style>
