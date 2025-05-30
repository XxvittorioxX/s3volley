<script lang="ts">
	import { registeredTeams, type Team } from '$lib/stores/teams';
	import { matches, type Match } from '$lib/stores/matches';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

	let localMatches: Match[] = [];
	const categories = ['Under 10', 'Under 12', 'Under 14'];

	// Genera tutti i match round robin a partire dalle squadre registrate
	function generateMatchesFromTeams(teams: Team[]): Match[] {
		const newMatches: Match[] = [];

		// per ogni categoria filtra le squadre
		for (const category of categories) {
			const teamsInCat = teams.filter(t => t.category === category);
			for (let i = 0; i < teamsInCat.length; i++) {
				for (let j = i + 1; j < teamsInCat.length; j++) {
					newMatches.push({
						team1: teamsInCat[i].teamName,
						team2: teamsInCat[j].teamName,
						category,
						sets: [
							{ team1: 0, team2: 0 },
							{ team1: 0, team2: 0 },
							{ team1: 0, team2: 0 }
						],
						winner: null
					});
				}
			}
		}
		return newMatches;
	}

	// Aggiorna i match appena caricate o quando cambiano le squadre registrate
	onMount(() => {
		const teams = get(registeredTeams);
		const newMatches = generateMatchesFromTeams(teams);
		matches.set(newMatches);
		localMatches = newMatches;
	});

	// Aggiorna i set e verifica vincitore
	function updateSet(matchIndex: number, setIndex: number, field: 'team1' | 'team2', value: number) {
		localMatches[matchIndex].sets[setIndex][field] = value;
		checkWinner(localMatches[matchIndex]);
		matches.set([...localMatches]);
	}

	function checkWinner(match: Match) {
		let team1Sets = 0;
		let team2Sets = 0;

		for (const set of match.sets) {
			const set1 = set.team1;
			const set2 = set.team2;

			// Regola: serve almeno 15 punti e 2 punti di vantaggio
			if (set1 >= 15 && set1 >= set2 + 2) team1Sets++;
			else if (set2 >= 15 && set2 >= set1 + 2) team2Sets++;
		}

		if (team1Sets === 2) match.winner = match.team1;
		else if (team2Sets === 2) match.winner = match.team2;
		else match.winner = null;
	}

	// Per mostrare i vincitori di categoria
	function getWinnersByCategory(category: string): string[] {
		const matchResults = localMatches.filter(m => m.category === category && m.winner);
		const count: Record<string, number> = {};

		for (const m of matchResults) {
			if (m.winner) {
				count[m.winner] = (count[m.winner] || 0) + 1;
			}
		}

		const max = Math.max(0, ...Object.values(count));
		return Object.entries(count)
			.filter(([_, val]) => val === max)
			.map(([team]) => team);
	}
</script>

<section>
	<h1>Calendario Partite</h1>

	{#if localMatches.length === 0}
		<p>Attendi che vengano registrate almeno due squadre per categoria.</p>
	{:else}
		{#each categories as category}
			<h2>{category}</h2>
			{#if localMatches.filter(m => m.category === category).length === 0}
				<p>Nessuna partita per questa categoria.</p>
			{:else}
				<ul>
					{#each localMatches.filter(m => m.category === category) as match, i}
						<li style="margin-bottom: 1.5rem;">
							<p><strong>Partita:</strong> {match.team1} vs {match.team2}</p>

							{#each [0, 1, 2] as setIndex}
								<label>Set {setIndex + 1}:</label>
								<input
									type="number"
									min="0"
									bind:value={match.sets[setIndex].team1}
									on:change={(e) => updateSet(i, setIndex, 'team1', +e.target.value)}
								/> -
								<input
									type="number"
									min="0"
									bind:value={match.sets[setIndex].team2}
									on:change={(e) => updateSet(i, setIndex, 'team2', +e.target.value)}
								/>
								<br />
							{/each}
							<p><strong>Vincitore:</strong> {match.winner ?? 'Partita in corso'}</p>
						</li>
					{/each}
				</ul>
				<h3>🏆 Vincitore categoria {category}:</h3>
				{#each getWinnersByCategory(category) as team}
					<p>{team}</p>
				{/each}
			{/if}
			<hr />
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

	input {
		width: 3rem;
		text-align: center;
		margin: 0 0.25rem;
	}

	ul {
		list-style: none;
		padding: 0;
	}

	li {
		padding: 1rem;
		background-color: #e6f0ff;
		border-radius: 8px;
		margin-bottom: 1rem;
	}
</style>
