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