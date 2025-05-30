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
		teams: string[];
		matches: Match[];
	};

	let groups: Group[] = [];

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
		const allTeams = shuffleArray(get(registeredTeams).map(t => t.teamName));
		const groupSize = 4;
		const groupCount = Math.floor(allTeams.length / groupSize);

		groups = [];

		for (let i = 0; i < groupCount; i++) {
			const groupTeams = allTeams.slice(i * groupSize, (i + 1) * groupSize);
			const group: Group = {
				name: `Gruppo ${String.fromCharCode(65 + i)}`,
				teams: groupTeams,
				matches: generateGroupMatches(groupTeams)
			};
			groups.push(group);
		}
	});

	function setWinner(groupIndex: number, matchIndex: number, winner: string) {
		groups[groupIndex].matches[matchIndex].winner = winner;
	}
</script>

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}
	:global(body) {
		font-family: sans-serif;
		background: #f9f9f9;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	main {
		max-width: 1000px;
		width: 100%;
		padding: 2rem;
		display: flex;
		flex-wrap: wrap;
		gap: 2rem;
		justify-content: center;
	}
	.group {
		background: #e6f0ff;
		padding: 1rem;
		border-radius: 12px;
		width: 300px;
	}
	h2 {
		margin-bottom: 1rem;
		text-align: center;
	}
	.match {
		margin-bottom: 0.8rem;
		padding: 0.5rem;
		background: #fff;
		border-radius: 8px;
	}
	button {
		margin: 0.2rem;
		padding: 0.3rem 0.6rem;
		background: #006eff;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.8rem;
	}
	button:hover {
		background: #004fc1;
	}
</style>

<h1 style="margin-top: 2rem;">Fase a Gironi</h1>

<main>
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
</main>
