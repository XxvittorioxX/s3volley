<script lang="ts">
	import { registeredTeams } from '/Users/itis/Desktop/s3volley/src/lib/stores/teams';
	import eliminazionediretta from './eliminazionediretta.svelte';

	// Ottieni solo i nomi delle squadre
	$: teamNames = $registeredTeams.map(t => t.teamName);
</script>

<section>
	<h1>Gironi a Eliminazione Diretta</h1>

	{#if teamNames.length < 2}
		<p>Devi registrare almeno due squadre per creare un girone a eliminazione diretta.</p>
	{:else}
	
		<eliminazionediretta {teams}={teamNames} />
	{/if}
</section>

<style>
	section {
		max-width: 900px;
		margin: 2rem auto;
		padding: 1rem 2rem;
		background-color: #f9f9f9;
		border-radius: 12px;
		box-shadow: 0 0 12px rgba(0,0,0,0.1);
		font-family: Arial, sans-serif;
		text-align: center;
	}

	h1 {
		color: #003366;
	}
</style>
