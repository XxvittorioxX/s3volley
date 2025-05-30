<script lang="ts">
	import { gironi } from '$lib/stores/torneo';
</script>

<section>
	<h1>Gironi del Torneo</h1>

	{#if $gironi.length === 0}
		<p>Nessuna squadra registrata o numero insufficiente per formare i gironi.</p>
	{:else}
		{#each $gironi as girone}
			<div class="girone">
				<h2>{girone.name}</h2>
				<ul>
					{#each girone.teams as team}
						<li>{team.teamName} ({team.category})</li>
					{/each}
				</ul>
			</div>
		{/each}
	{/if}
</section>

<style>
	.girone {
		background: #eef5ff;
		padding: 1rem;
		margin-bottom: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
	}

	h2 {
		margin-bottom: 0.5rem;
		color: #0056b3;
	}
</style>
