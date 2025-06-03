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
</script>

<svelte:head>
	<title>Torneo Volley S3 - Registrazione</title>
</svelte:head>

<h1 class="text-center mb-4 fw-semibold display-6 border-bottom pb-2 text-primary-emphasis">
  <i class="bi bi-pencil-square me-2"></i>Registrazione Squadra
</h1>

	<form on:submit|preventDefault={handleSubmit} class="needs-validation" novalidate>
		<div class="mb-3">
			<label for="teamName" class="form-label">Nome squadra:</label>
			<input
				id="teamName"
				type="text"
				bind:value={teamName}
				class="form-control"
				required
			/>
		</div>

		<div class="mb-3">
			<label for="category" class="form-label">Categoria:</label>
			<select
				id="category"
				bind:value={category}
				class="form-select"
				required
			>
				<option value="" disabled selected>Scegli una categoria</option>
				<option value="Under 10">Under 10</option>
				<option value="Under 12">Under 12</option>
				<option value="Under 14">Under 14</option>
			</select>
		</div>

		<div class="mb-3">
			<label for="coachName" class="form-label">Nome responsabile:</label>
			<input
				id="coachName"
				type="text"
				bind:value={coachName}
				class="form-control"
				required
			/>
		</div>

		<div class="mb-3">
			<label for="email" class="form-label">Email:</label>
			<input
				id="email"
				type="email"
				bind:value={email}
				class="form-control"
				required
			/>
		</div>

		<div class="mb-3">
			<label for="phone" class="form-label">Telefono:</label>
			<input
				id="phone"
				type="tel"
				bind:value={phone}
				class="form-control"
				required
			/>
		</div>

		<button type="submit" class="btn btn-primary w-100">Invia registrazione</button>
	</form>
</section>
