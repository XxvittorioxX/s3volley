<script lang="ts">
	import { registeredTeams } from '$lib/stores/teams';

	// Dati del form
	let teamName = '';
	let category = '';
	let coachName = '';
	let email = '';
	let phone = '';

	// Stato di validazione
	let errors = {
		teamName: '',
		category: '',
		coachName: '',
		email: '',
		phone: ''
	};

	// Funzione per validare un singolo campo
	function validateField(field: string, value: string) {
		switch (field) {
			case 'teamName':
				errors.teamName = value.trim() === '' ? 'Il nome della squadra è obbligatorio' : '';
				break;
			case 'category':
				errors.category = value.trim() === '' ? 'La categoria è obbligatoria' : '';
				break;
			case 'coachName':
				errors.coachName = value.trim() === '' ? 'Il nome del responsabile è obbligatorio' : '';
				break;
			case 'email':
				if (value.trim() === '') {
					errors.email = 'L\'email è obbligatoria';
				} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
					errors.email = 'Inserisci un\'email valida';
				} else {
					errors.email = '';
				}
				break;
			case 'phone':
				if (value.trim() === '') {
					errors.phone = 'Il telefono è obbligatorio';
				} else if (!/^[\d\s\+\-\(\)]{8,}$/.test(value.replace(/\s/g, ''))) {
					errors.phone = 'Inserisci un numero di telefono valido';
				} else {
					errors.phone = '';
				}
				break;
		}
	}

	// Funzione per validare tutti i campi
	function validateAllFields() {
		validateField('teamName', teamName);
		validateField('category', category);
		validateField('coachName', coachName);
		validateField('email', email);
		validateField('phone', phone);
	}

	// Controlla se il form è valido
	$: isFormValid = teamName.trim() !== '' && 
					 category.trim() !== '' && 
					 coachName.trim() !== '' && 
					 email.trim() !== '' && 
					 phone.trim() !== '' &&
					 Object.values(errors).every(error => error === '');

	// Funzione per gestire l'invio del form
	function handleSubmit() {
		validateAllFields();
		
		if (!isFormValid) {
			alert('Per favore, compila tutti i campi obbligatori correttamente.');
			return;
		}

		// Controlla se la squadra esiste già
		if ($registeredTeams.some(team => team.teamName.toLowerCase() === teamName.toLowerCase())) {
			alert('Una squadra con questo nome è già registrata.');
			return;
		}

		// Aggiungi la squadra al store
		const newTeam = {
			id: Date.now().toString(),
			teamName: teamName.trim(),
			category: category.trim(),
			coachName: coachName.trim(),
			email: email.trim(),
			phone: phone.trim()
		};

		registeredTeams.update(teams => [...teams, newTeam]);

		// Reset del form
		teamName = '';
		category = '';
		coachName = '';
		email = '';
		phone = '';
		errors = {
			teamName: '',
			category: '',
			coachName: '',
			email: '',
			phone: ''
		};

		alert('Squadra registrata con successo!');
	}
</script>

<section>
	<h1>Registrazione Squadra</h1>
	
	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-group">
			<label for="teamName">Nome Squadra *</label>
			<input 
				type="text" 
				id="teamName" 
				bind:value={teamName}
				on:blur={() => validateField('teamName', teamName)}
				class:error={errors.teamName !== ''}
				placeholder="Inserisci il nome della squadra"
			/>
			{#if errors.teamName}
				<span class="error-message">{errors.teamName}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="category">Categoria *</label>
			<select 
				id="category" 
				bind:value={category}
				on:blur={() => validateField('category', category)}
				class:error={errors.category !== ''}
			>
				<option value="">Seleziona una categoria</option>
				<option value="Under 10">Under 10</option>
				<option value="Under 12">Under 12</option>
				<option value="Under 14">Under 14</option>
				<option value="Under 16">Under 16</option>
				<option value="Under 18">Under 18</option>
				<option value="Seniores">Seniores</option>
			</select>
			{#if errors.category}
				<span class="error-message">{errors.category}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="coachName">Nome Responsabile *</label>
			<input 
				type="text" 
				id="coachName" 
				bind:value={coachName}
				on:blur={() => validateField('coachName', coachName)}
				class:error={errors.coachName !== ''}
				placeholder="Inserisci il nome del responsabile"
			/>
			{#if errors.coachName}
				<span class="error-message">{errors.coachName}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="email">Email *</label>
			<input 
				type="email" 
				id="email" 
				bind:value={email}
				on:blur={() => validateField('email', email)}
				class:error={errors.email !== ''}
				placeholder="inserisci@email.com"
			/>
			{#if errors.email}
				<span class="error-message">{errors.email}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="phone">Telefono *</label>
			<input 
				type="tel" 
				id="phone" 
				bind:value={phone}
				on:blur={() => validateField('phone', phone)}
				class:error={errors.phone !== ''}
				placeholder="+39 123 456 7890"
			/>
			{#if errors.phone}
				<span class="error-message">{errors.phone}</span>
			{/if}
		</div>

		<button 
			type="submit" 
			class="submit-btn"
			class:disabled={!isFormValid}
			disabled={!isFormValid}
		>
			{isFormValid ? 'Registra Squadra' : 'Compila tutti i campi obbligatori'}
		</button>
	</form>
</section>

<style>
	section {
		max-width: 600px;
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
		margin-bottom: 2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: bold;
		color: #003366;
	}

	input, select {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.3s ease;
		box-sizing: border-box;
	}

	input:focus, select:focus {
		outline: none;
		border-color: #006eff;
	}

	input.error, select.error {
		border-color: #e74c3c;
		background-color: #fdf2f2;
	}

	.error-message {
		display: block;
		color: #e74c3c;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	.submit-btn {
		width: 100%;
		padding: 1rem;
		background-color: #006eff;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1.1rem;
		font-weight: bold;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.submit-btn:hover:not(.disabled) {
		background-color: #0056cc;
	}

	.submit-btn.disabled {
		background-color: #ccc;
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Stili responsivi */
	@media (max-width: 768px) {
		section {
			margin: 1rem;
			padding: 1rem;
		}
	}
</style>
