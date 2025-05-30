<script lang="ts">
	import { registeredTeams, type Team } from '$lib/stores/teams';
	import { get } from 'svelte/store';

	let teamName = '';
	let category = '';
	let coachName = '';
	let email = '';
	let phone = '';

	function handleSubmit() {
		const current = get(registeredTeams);

		if (current.length >= 4) {
			alert('Il numero massimo di 4 squadre è stato raggiunto.');
			return;
		}

		const newTeam: Team = { teamName, category, coachName, email, phone };
		registeredTeams.update(teams => [...teams, newTeam]);

		alert('Registrazione inviata con successo!');

		// reset campi
		teamName = '';
		category = '';
		coachName = '';
		email = '';
		phone = '';
	}

	$: teams = get(registeredTeams);

	const categories = ['Under 10', 'Under 12', 'Under 14'];

	function teamsByCategory(cat: string): Team[] {
		return teams.filter(t => t.category === cat);
	}
</script>

<svelte:head>
	<title>Torneo Volley S3 - Registrazione & Gironi</title>
</svelte:head>

<section>
	<h1>Registrazione Squadra</h1>

	<form on:submit|preventDefault={handleSubmit}>
		<label>
			Nome squadra:
			<input type="text" bind:value={teamName} required />
		</label>

		<label>
			Categoria:
			<select bind:value={category} required>
				<option value="" disabled selected>Scegli una categoria</option>
				<option value="Under 10">Under 10</option>
				<option value="Under 12">Under 12</option>
				<option value="Under 14">Under 14</option>
			</select>
		</label>

		<label>
			Nome responsabile:
			<input type="text" bind:value={coachName} required />
		</label>

		<label>
			Email:
			<input type="email" bind:value={email} required />
		</label>

		<label>
			Telefono:
			<input type="tel" bind:value={phone} required />
		</label>

		<button type="submit">Invia registrazione</button>
	</form>
</section>

<section>
	<h2>Gironi Torneo</h2>

	{#each categories as cat}
		{#if teamsByCategory(cat).length >= 2}
			<h3>{cat}</h3>
			<table>
				<thead>
					<tr>
						<th>#</th>
						<th>Nome Squadra</th>
						<th>Responsabile</th>
						<th>Email</th>
						<th>Telefono</th>
					</tr>
				</thead>
				<tbody>
					{#each teamsByCategory(cat) as team, i}
						<tr>
							<td>{i + 1}</td>
							<td>{team.teamName}</td>
							<td>{team.coachName}</td>
							<td>{team.email}</td>
							<td>{team.phone}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<h3>{cat}</h3>
			<p>Non ci sono ancora abbastanza squadre registrate per questa categoria.</p>
		{/if}
	{/each}
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

	h1, h2, h3 {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		font-weight: bold;
	}

	input,
	select {
		padding: 0.5rem;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 8px;
	}

	button {
		padding: 0.75rem;
		font-size: 1.1rem;
		background-color: #006eff;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	button:hover {
		background-color: #0099ff;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
		margin-bottom: 2rem;
	}

	th, td {
		border: 1px solid #ccc;
		padding: 0.75rem;
		text-align: center;
	}

	th {
		background-color: #e0ecff;
	}
</style>
