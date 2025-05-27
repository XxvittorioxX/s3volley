<script lang="ts">
	let teamName = '';
	let category = '';
	let coachName = '';
	let email = '';
	let phone = '';

	function handleSubmit() {
		console.log('Registrazione inviata:', {
			teamName,
			category,
			coachName,
			email,
			phone
		});
		alert('Registrazione inviata con successo!');
	}
</script>

<svelte:head>
	<title> Torneo Volley S3</title>
	<meta name="description" content="Modulo di registrazione per il torneo Volley S3" />
</svelte:head>

<section>
	<h1>Registrazione</h1>

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
	section {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		background-color: #f9f9f9;
		border-radius: 16px; /* Angoli curvi */
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	h1 {
		text-align: center;
		margin-bottom: 2rem;
		font-size: 3rem;
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

	input, select {
		padding: 0.5rem;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 8px; /* Angoli curvi */
	}

	button {
		padding: 0.75rem;
		font-size: 1.1rem;
		background-color: #006eff;
		color: white;
		border: none;
		border-radius: 8px; /* Angoli curvi */
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	button:hover {
		background-color: #0099ff;
	}
</style>
