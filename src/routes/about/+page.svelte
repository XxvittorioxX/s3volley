<script lang="ts">
	import { onMount } from 'svelte';
	import { registeredTeams } from '$lib/stores/teams';
	import { matches, type Match } from '$lib/stores/matches';
	import { get } from 'svelte/store';

	function generateMatches(teams: string[]): Match[] {
		const res: Match[] = [];
		for (let i = 0; i < teams.length; i++) {
			for (let j = i + 1; j < teams.length; j++) {
				res.push({
					teamA: teams[i],
					teamB: teams[j],
					sets: [],
					winner: null
				});
			}
		}
		return res;
	}

	onMount(() => {
		const teams = get(registeredTeams).map(t => t.teamName);
		if (teams.length >= 2 && get(matches).length === 0) {
			matches.set(generateMatches(teams));
		}
	});

	function updateSet(matchIndex: number, setIndex: number, team: 'A' | 'B', value: number) {
		matches.update(all => {
			const match = all[matchIndex];
			if (!match.sets[setIndex]) match.sets[setIndex] = [0, 0];
			match.sets[setIndex][team === 'A' ? 0 : 1] = value;

			// Calcolo vincitore
			let setWonA = 0;
			let setWonB = 0;
			for (const [a, b] of match.sets) {
				if (a >= 15 && a - b >= 2) setWonA++;
				else if (b >= 15 && b - a >= 2) setWonB++;
			}

			match.winner =
				setWonA === 2 ? match.teamA :
				setWonB === 2 ? match.teamB :
				null;

			return [...all];
		});
	}
</script>

<svelte:head>
	<title>Calendario Partite - Torneo Volley S3</title>
</svelte:head>

<section>
	<h1>Calendario Partite</h1>

	{#if $matches.length === 0}
		<p>Attendi che vengano registrate almeno due squadre.</p>
	{:else}
		{#each $matches as match, i}
			<div class="match-card">
				<h2>Partita {i + 1}: {match.teamA} vs {match.teamB}</h2>
				
				{#each [0, 1, 2] as setIdx}
					<div class="set">
						Set {setIdx + 1}:
						<input type="number" min="0" max="30" value={match.sets[setIdx]?.[0] ?? ''} on:input={(e) => updateSet(i, setIdx, 'A', +e.target.value)} />
						vs
						<input type="number" min="0" max="30" value={match.sets[setIdx]?.[1] ?? ''} on:input={(e) => updateSet(i, setIdx, 'B', +e.target.value)} />
					</div>
				{/each}

				{#if match.winner}
					<p class="winner">🏆 Vincitore: {match.winner}</p>
				{/if}
			</div>
		{/each}
	{/if}
</section>

<style>
	section {
		max-width: 800px;
		margin: 2rem auto;
		padding: 2rem;
		background-color: #f9f9f9;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	h1 {
		text-align: center;
		margin-bottom: 2rem;
		font-size: 2.5rem;
	}

	.match-card {
		margin-bottom: 2rem;
		padding: 1rem;
		border: 1px solid #ccc;
		border-radius: 12px;
		background-color: #fff;
	}

	.set {
		margin-top: 0.5rem;
		font-weight: bold;
	}

	input {
		width: 60px;
		margin: 0 0.5rem;
		padding: 0.25rem;
		text-align: center;
		border-radius: 6px;
		border: 1px solid #ccc;
	}

	.winner {
		margin-top: 1rem;
		font-weight: bold;
		color: green;
	}
</style>
