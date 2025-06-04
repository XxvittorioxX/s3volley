<script lang="ts">
	import { registeredTeams } from '$lib/stores/teams';
</script>

<section>
	<h1>Squadre Registrate</h1>

	{#if $registeredTeams.length === 0}
		<p>Nessuna squadra registrata al momento.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Nome Squadra</th>
					<th>Categoria</th>
					<th>Responsabile</th>
					<th>Email</th>
					<th>Telefono</th>
				</tr>
			</thead>
			<tbody>
				{#each $registeredTeams as team}
					<tr>
						<td>{team.teamName}</td>
						<td>{team.category}</td>
						<td>{team.coachName}</td>
						<td>{team.email}</td>
						<td>{team.phone}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</section>

<style>
	section {
		max-width: 900px;
		margin: 2rem auto;
		padding: 2rem;
		background-color: #f5f5f5;
		border-radius: 12px;
		box-shadow: 0 0 12px rgba(0, 0, 0, 0.1);
		font-family: sans-serif;
	}

	h1 {
		text-align: center;
		color: #003366;
		margin-bottom: 1.5rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background-color: white;
		border-radius: 8px;
		overflow: hidden;
	}

	th,
	td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #ccc;
	}

	th {
		background-color: #006eff;
		color: white;
	}

	tr:hover {
		background-color: #f0f8ff;
	}
</style>
