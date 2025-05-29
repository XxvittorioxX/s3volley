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
	let characters = ['🥳', '🎉', '✨'];

	let confetti = $state(new Array(100)
		.fill()
		.map((_, i) => {
			return {
				character:
					characters[i % characters.length],
				x: Math.random() * 100,
				y: -20 - Math.random() * 100,
				r: 0.1 + Math.random() * 1
			};
		})
		.sort((a, b) => a.r - b.r));

	$effect(() => {
		let frame = requestAnimationFrame(function loop() {
			frame = requestAnimationFrame(loop);

			for (const confetto of confetti) {
				confetto.y += 0.3 * confetto.r;
				if (confetto.y > 120) confetto.y = -20;
			}
		});

		return () => {
			cancelAnimationFrame(frame);
		}
	});
</script>

{#each confetti as c}
	<span
		style:left="{c.x}%"
		style:top="{c.y}%"
		style:scale={c.r}
	>
		{c.character}
	</span>
{/each}
</script>

<svelte:head>
	<title>Torneo Volley S3 - Registrazione</title>
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

<style>
		span {
		position: absolute;
		font-size: 5vw;
		user-select: none;
	}

	:global(body) {
		overflow: hidden;
	}
	section {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
		background-color: #f9f9f9;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	h1 {
		text-align: center;
		margin-bottom: 2rem;
		font-size: 2.5rem;
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
</style>
