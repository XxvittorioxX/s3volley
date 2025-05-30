<script lang="ts">
	import { registeredTeams, type Team } from '$lib/stores/teams';
	import { derived } from 'svelte/store';

	const categories = ['Under 10', 'Under 12', 'Under 14'];

	// Gironi: squadra per categoria
	const teamsByCategory = derived(registeredTeams, $teams => {
		const result: Record<string, Team[]> = {};
		for (const cat of categories) {
			result[cat] = $teams.filter(t => t.category === cat);
		}
		return result;
	});

	// Funzione per generare tutte le partite di un girone (tutte contro tutte)
	function generateMatches(teams: Team[]) {
		const matches: { team1: string; team2: string }[] = [];
		for (let i = 0; i < teams.length; i++) {
			for (let j = i + 1; j < teams.length; j++) {
				matches.push({ team1: teams[i].teamName, team2: teams[j].teamName });
			}
		}
		return matches;
	}
</script>

<section>
	<h1>Squadre Registrate e Gironi</h1>

	{#if $registeredTeams.length === 0}
		<p>Non ci sono squadre registrate.</p>
	{:else}
		{#each categories as category}
			<h2>{category}</h2>

			<!-- Lista squadre per categoria -->
			{#if $teamsByCategory[category].length === 0}
				<p>Nessuna squadra registrata in questa categoria.</p>
			{:else}
				<ul>
					{#each $teamsByCategory[category] as team}
						<li>
							<strong>{team.teamName}</strong> — Responsabile: {team.coachName} — Email: {team.email} — Tel: {team.phone}
						</li>
					{/each}
				</ul>

				<!-- Partite girone -->
				<h3>Partite girone {category}</h3>
				{#if $teamsByCategory[category].length < 2}
					<p>Non abbastanza squadre per formare un girone.</p>
				{:else}
					<ul>
						{#each generateMatches($teamsByCategory[category]) as match, i}
							<li>Partita {i + 1}: {match.team1} vs {match.team2}</li>
						{/each}
					</ul>
				{/if}
			{/if}

			<hr />
		{/each}
	{/if}
</section>

<style>
	section {
		max-width: 700px;
		margin: 2rem auto;
		padding: 1.5rem 2rem;
		background: #f9f9f9;
		border-radius: 12px;
		box-shadow: 0 0 10px rgba(0,0,0,0.1);
		font-family: Arial, sans-serif;
	}

	h1, h2, h3 {
		text-align: center;
		color: #004080;
	}

	ul {
		list-style: none;
		padding-left: 0;
		margin-bottom: 1rem;
	}

	li {
		background: #e6f0ff;
		margin: 0.4rem 0;
		padding: 0.6rem 1rem;
		border-radius: 6px;
	}
</style>
