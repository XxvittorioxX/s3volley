<script lang="ts">
	import { registeredTeams } from '$lib/stores/teams';
	import { derived } from 'svelte/store';

	// Funzione per generare partite da array di squadre
	function generateMatches(teams: string[]) {
		const matches: { team1: string; team2: string }[] = [];

		for (let i = 0; i < teams.length; i++) {
			for (let j = i + 1; j < teams.length; j++) {
				matches.push({ team1: teams[i], team2: teams[j] });
			}
		}
		return matches;
	}

	// Store derivato: crea partite solo con i nomi delle squadre
	const matches = derived(registeredTeams, $teams => {
		const names = $teams.map(t => t.teamName);
		return names.length >= 2 ? generateMatches(names) : [];
	});
</script>

<section>
	<h1>Calendario Partite</h1>

	{#if $matches.length === 0}
		<p>Attendi che vengano registrate almeno due squadre.</p>
	{:else}
		<ul>
			{#each $matches as match, i}
				<li><strong>Partita {i + 1}:</strong> {match.team1} vs {match.team2}</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	section {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
		background-color: #fff;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	h1 {
		text-align: center;
		margin-bottom: 1.5rem;
	}
	ul {
		list-style: none;
		padding: 0;
	}
	li {
		margin: 0.75rem 0;
		padding: 0.5rem;
		background-color: #f0f8ff;
		border-radius: 8px;
	}
</style>