<script lang="ts">
	// Dati del form (uguale a prima)
	let teamName = '';
	let category = '';
	let coachName = '';
	let email = '';
	let phone = '';

	// AGGIUNGI QUESTA VARIABILE
	let isLoading = false;

	// Stato di validazione (uguale a prima)
	let errors = {
		teamName: '',
		category: '',
		coachName: '',
		email: '',
		phone: ''
	};

	// Tutte le funzioni di validazione restano UGUALI
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

	function validateAllFields() {
		validateField('teamName', teamName);
		validateField('category', category);
		validateField('coachName', coachName);
		validateField('email', email);
		validateField('phone', phone);
	}

	$: isFormValid = teamName.trim() !== '' && 
					 category.trim() !== '' && 
					 coachName.trim() !== '' && 
					 email.trim() !== '' && 
					 phone.trim() !== '' &&
					 Object.values(errors).every(error => error === '');

	// SOSTITUISCI QUESTA FUNZIONE
	async function handleSubmit() {
		validateAllFields();
		
		if (!isFormValid) {
			alert('Per favore, compila tutti i campi obbligatori correttamente.');
			return;
		}

		isLoading = true;

		try {
			const response = await fetch('/api/teams', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					teamName: teamName.trim(),
					category: category.trim(),
					coachName: coachName.trim(),
					email: email.trim(),
					phone: phone.trim()
				})
			});

			const result = await response.json();

			if (result.success) {
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

				alert('Squadra registrata con successo nel database!');
			} else {
				alert(`Errore: ${result.message}`);
			}
		} catch (error) {
			console.error('Errore di rete:', error);
			alert('Errore di connessione. Riprova più tardi.');
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="container mt-5">
	<div class="row justify-content-center">
		<div class="col-lg-8 col-md-10">
			<div class="card shadow-lg border-0">
				<div class="card-header bg-primary text-white text-center py-4">
					<h1 class="h3 mb-0">
						<i class="fas fa-users me-2"></i>
						Registrazione Squadra
					</h1>
				</div>
				<div class="card-body p-4">
					<form on:submit|preventDefault={handleSubmit} novalidate>
						<div class="row">
							<div class="col-md-6 mb-3">
								<label for="teamName" class="form-label fw-bold">
									<i class="fas fa-flag me-1"></i>
									Nome Squadra *
								</label>
								<input 
									type="text" 
									id="teamName" 
									class="form-control {errors.teamName ? 'is-invalid' : teamName ? 'is-valid' : ''}"
									bind:value={teamName}
									on:blur={() => validateField('teamName', teamName)}
									placeholder="Inserisci il nome della squadra"
								/>
								{#if errors.teamName}
									<div class="invalid-feedback">
										<i class="fas fa-exclamation-circle me-1"></i>
										{errors.teamName}
									</div>
								{/if}
							</div>

							<div class="col-md-6 mb-3">
								<label for="category" class="form-label fw-bold">
									<i class="fas fa-layer-group me-1"></i>
									Categoria *
								</label>
								<select 
									id="category" 
									class="form-select {errors.category ? 'is-invalid' : category ? 'is-valid' : ''}"
									bind:value={category}
									on:blur={() => validateField('category', category)}
								>
									<option value="">Seleziona una categoria</option>
									<option value="S1">S1</option>
									<option value="S2">S2</option>
									<option value="S3">S3</option>
									<option value="Under 12">Under 12</option>
									<option value="Seniores">Seniores</option>
								</select>
								{#if errors.category}
									<div class="invalid-feedback">
										<i class="fas fa-exclamation-circle me-1"></i>
										{errors.category}
									</div>
								{/if}
							</div>
						</div>

						<div class="mb-3">
							<label for="coachName" class="form-label fw-bold">
								<i class="fas fa-user-tie me-1"></i>
								Nome Responsabile *
							</label>
							<input 
								type="text" 
								id="coachName" 
								class="form-control {errors.coachName ? 'is-invalid' : coachName ? 'is-valid' : ''}"
								bind:value={coachName}
								on:blur={() => validateField('coachName', coachName)}
								placeholder="Inserisci il nome del responsabile"
							/>
							{#if errors.coachName}
								<div class="invalid-feedback">
									<i class="fas fa-exclamation-circle me-1"></i>
									{errors.coachName}
								</div>
							{/if}
						</div>

						<div class="row">
							<div class="col-md-6 mb-3">
								<label for="email" class="form-label fw-bold">
									<i class="fas fa-envelope me-1"></i>
									Email *
								</label>
								<input 
									type="email" 
									id="email" 
									class="form-control {errors.email ? 'is-invalid' : email && !errors.email ? 'is-valid' : ''}"
									bind:value={email}
									on:blur={() => validateField('email', email)}
									placeholder="inserisci@email.com"
								/>
								{#if errors.email}
									<div class="invalid-feedback">
										<i class="fas fa-exclamation-circle me-1"></i>
										{errors.email}
									</div>
								{/if}
							</div>

							<div class="col-md-6 mb-3">
								<label for="phone" class="form-label fw-bold">
									<i class="fas fa-phone me-1"></i>
									Telefono *
								</label>
								<input 
									type="tel" 
									id="phone" 
									class="form-control {errors.phone ? 'is-invalid' : phone && !errors.phone ? 'is-valid' : ''}"
									bind:value={phone}
									on:blur={() => validateField('phone', phone)}
									placeholder="+39 123 456 7890"
								/>
								{#if errors.phone}
									<div class="invalid-feedback">
										<i class="fas fa-exclamation-circle me-1"></i>
										{errors.phone}
									</div>
								{/if}
							</div>
						</div>

						<div class="d-grid gap-2 mt-4">
					<button 
						type="submit" 
						class="btn btn-lg {isFormValid && !isLoading ? 'btn-success' : 'btn-secondary'}"
						disabled={!isFormValid || isLoading}
						>
						{#if isLoading}
						<i class="fas fa-spinner fa-spin me-2"></i>
						Registrazione in corso...
						{:else if isFormValid}
						<i class="fas fa-check-circle me-2"></i>
							Registra Squadra
						{:else}
							<i class="fas fa-exclamation-triangle me-2"></i>
						Compila tutti i campi obbligatori
						{/if}
						</button>
						</div>

						{#if !isFormValid}
							<div class="alert alert-info mt-3 d-flex align-items-center">
								<i class="fas fa-info-circle me-2"></i>
								<small>Tutti i campi contrassegnati con * sono obbligatori</small>
							</div>
						{/if}
					</form>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Aggiungi questo nel tuo app.html o come import nel componente principale -->
<svelte:head>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
	<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
</svelte:head>

<style>
	:global(.card) {
		border-radius: 15px;
		overflow: hidden;
	}

	:global(.card-header) {
		background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
		border: none;
	}

	:global(.form-label) {
		color: #495057;
		font-size: 0.95rem;
	}

	:global(.form-control:focus),
	:global(.form-select:focus) {
		border-color: #007bff;
		box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
	}

	:global(.btn-success) {
		background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
		border: none;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	:global(.btn-success:hover) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
	}

	:global(.btn-secondary) {
		background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
		border: none;
		font-weight: 600;
	}

	:global(.alert-info) {
		background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
		border: 1px solid #b6d4da;
		border-radius: 10px;
	}

	:global(.is-valid) {
		border-color: #28a745;
	}

	:global(.is-invalid) {
		border-color: #dc3545;
	}

	:global(.invalid-feedback) {
		font-size: 0.875rem;
		font-weight: 500;
	}

	/* Animazioni personalizzate */
	:global(.card) {
		animation: slideInUp 0.6s ease-out;
	}

	@keyframes slideInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Responsive migliorata */
	@media (max-width: 768px) {
		:global(.container) {
			padding-left: 10px;
			padding-right: 10px;
		}
		
		:global(.card-body) {
			padding: 1.5rem !important;
		}
	}
</style>