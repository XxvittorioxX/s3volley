<script lang="ts">
	import { ... } from '$lib/stores/teams';

	function formatCategory(category: string): string {
		if (category === 'under10') return 'Under 10';
		if (category === 'under12') return 'Under 12';
		if (category === 'under14') return 'Under 14';
		return category;
	}
</script>


<svelte:head>
	<title>Gironi - Torneo Volley S3</title>
</svelte:head>

<section>
	<h1>Gironi del Torneo</h1>

	{#await groupedTeams}
		<p>Caricamento gironi...</p>
	{:then groups}
		{#each Object.entries(groups) as [category, teams]}
			{#if teams.length > 0}
				<div class="group">
					<h2>{formatCategory(category)}</h2>
					<div class="team-grid">
						{#each teams as team}
							<div class="team-card">
								<h3>{team.teamName}</h3>
								<p><strong>Coach:</strong> {team.coachName}</p>
								<p><strong>Email:</strong> {team.email}</p>
								<p><strong>Tel:</strong> {team.phone}</p>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<p class="empty">{formatCategory(category)}: Nessuna squadra registrata.</p>
			{/if}
		{/each}
	{/await}
</section>

<script lang="ts">
	function formatCategory(category: string): string {
		if (category === 'under10') return 'Under 10';
		if (category === 'under12') return 'Under 12';
		if (category === 'under14') return 'Under 14';
		return category;
	}
</script>

<style>
	section {
		max-width: 1000px;
		margin: 2rem auto;
		padding: 2rem;
	}

	h1 {
		text-align: center;
		font-size: 2.5rem;
		margin-bottom: 2rem;
	}

	.group {
		margin-bottom: 3rem;
	}

	h2 {
		font-size: 2rem;
		color: #006eff;
		margin-bottom: 1rem;
		border-bottom: 2px solid #006eff;
		padding-bottom: 0.5rem;
	}

	.team-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.team-card {
		background-color: #e6f0ff;
		border-radius: 12px;
		padding: 1rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s ease;
	}

	.team-card:hover {
		transform: translateY(-4px);
	}

	h3 {
		margin: 0 0 0.5rem;
		font-size: 1.3rem;
		color: #003d99;
	}

	p {
		margin: 0.25rem 0;
		font-size: 0.95rem;
	}

	.empty {
		font-style: italic;
		color: #999;
		margin: 1rem 0 2rem;
	}
</style>
