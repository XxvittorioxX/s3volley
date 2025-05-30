<script lang="ts">
	import { registeredTeams, type Team } from '$lib/stores/teams';
	import { derived } from 'svelte/store';

	const gironi = derived(registeredTeams, ($teams) => {
		const grouped: Record<string, Team[]> = {
			'Under 10': [],
			'Under 12': [],
			'Under 14': []
		};

		for (const team of $teams) {
			if (grouped[team.category]) {
				grouped[team.category].push(team);
			}
		}

		return grouped;
	});
</script>

<svelte:head>
	<title>Torneo Volley S3</title>
</svelte:head>

<section>
	<h1>Torneo Volley S3 - Gironi</h1>

	{#await gironi}
		<p>Caricamento gironi...</p>
	{:then grouped}
		{#each Object.entries(grouped) as [categoria, teams]}
			{#if teams.length > 0}
				<h2>{categoria}</h2>
				<div class="girone">
					{#each teams as team}
						<div class="squadra">
							<p class="nome">{team.teamName}</p>
							<p class="coach">Coach: {team.coachName}</p>
						</div>
					{/each}
				</div>
			{:else}
				<p>Nessuna squadra registrata per {categoria}.</p>
			{/if}
		{/each}
	{:catch error}
		<p>Errore durante il caricamento dei gironi.</p>
	{/await}
</section>

<style>
	section {
		max-width: 900px;
		margin: 2rem auto;
		padding: 2rem;
		background-color: #f9f9f9;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	h1 {
		text-align: center;
		margin-bottom: 2rem;
	}
	h2 {
		margin-top: 2rem;
		color: #006eff;
	}
	.girone {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
	.squadra {
		background-color: #e6f0ff;
		padding: 1rem;
		border-radius: 12px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
	}
	.nome {
		font-weight: bold;
		font-size: 1.2rem;
	}
	.coach {
		font-size: 0.9rem;
		color: #333;
	}
</style>
