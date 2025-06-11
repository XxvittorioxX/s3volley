<script lang="ts">
	import { onMount } from 'svelte';

	// Definizione dei tipi
	interface Team {
		id: number;
		name: string;
		category: string;
		coach: string;
		email: string;
		phone: string;
		registrationDate: string;
	}

	interface Match {
		id: number;
		t1: string;
		t2: string;
		score1: number | null;
		score2: number | null;
		w: string | null;
		group: string;
		category: string;
	}

	interface Errors {
		teamName: string;
		category: string;
		coachName: string;
		email: string;
		phone: string;
	}

	interface TournamentData {
		teams: Team[];
		groupMatches: Match[];
		groupStandings: Record<string, any>;
		groups: Record<string, any>;
		categories: string[];
		groupsByCategory: Record<string, any>;
		currentPhase: string;
		timestamp: string;
	}

	interface ApiResponse {
		success: boolean;
		message?: string;
	}

	// Dati del form
	let teamName: string = '';
	let category: string = '';
	let coachName: string = '';
	let email: string = '';
	let phone: string = '';
	let isLoading: boolean = false;

	// Stato di validazione
	let errors: Errors = {
		teamName: '',
		category: '',
		coachName: '',
		email: '',
		phone: ''
	};

	// Variables for tournament data
	let teams: Team[] = [];
	let groupMatches: Match[] = [];
	let groupStandings: Record<string, any> = {};
	let groups: Record<string, any> = {};
	let categories: string[] = [];
	let groupsByCategory: Record<string, any> = {};
	let currentPhase: string = 'registration';

	// Tournament data saving function
	function saveTournamentData(): void {
		const tournamentData: TournamentData = {
			teams,
			groupMatches,
			groupStandings,
			groups,
			categories,
			groupsByCategory,
			currentPhase,
			timestamp: new Date().toISOString()
		};
		
		try {
			localStorage.setItem('tournament-data', JSON.stringify(tournamentData));
			console.log('Tournament data saved successfully');
		} catch (error) {
			console.error('Errore nel salvataggio dati:', error);
		}
	}

	// Function to load tournament data on component initialization
	function loadTournamentData(): void {
		try {
			const savedData: string | null = localStorage.getItem('tournament-data');
			if (savedData) {
				const parsedData: TournamentData = JSON.parse(savedData);
				teams = parsedData.teams || [];
				groupMatches = parsedData.groupMatches || [];
				groupStandings = parsedData.groupStandings || {};
				groups = parsedData.groups || {};
				categories = parsedData.categories || [];
				groupsByCategory = parsedData.groupsByCategory || {};
				currentPhase = parsedData.currentPhase || 'registration';
				console.log('Tournament data loaded successfully');
			}
		} catch (error) {
			console.error('Errore nel caricamento dati:', error);
		}
	}

	// Tournament utility functions
	function isValidScore(score1: string | number, score2: string | number, category: string): boolean {
		const s1: number = parseInt(score1.toString());
		const s2: number = parseInt(score2.toString());
		
		if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) return false;
		
		const baseScore: number = getBaseScoreForCategory(category);
		const advantage: number = getAdvantageForCategory(category);
		
		// Check if it's a valid score based on category rules
		const maxScore: number = Math.max(s1, s2);
		const minScore: number = Math.min(s1, s2);
		
		if (maxScore === baseScore) {
			return minScore <= baseScore - 2;
		} else if (maxScore > baseScore) {
			return maxScore - minScore === advantage;
		}
		
		return false;
	}

	function getBaseScoreForCategory(category: string): number {
		switch (category) {
			case 'S1':
			case 'S2':
			case 'S3':
				return 21;
			case 'Under 12':
				return 15;
			case 'Seniores':
				return 25;
			default:
				return 21;
		}
	}

	function getAdvantageForCategory(category: string): number {
		switch (category) {
			case 'S1':
			case 'S2':
			case 'S3':
			case 'Seniores':
				return 2;
			case 'Under 12':
				return 2;
			default:
				return 2;
		}
	}

	function getCategoryRules(category: string): string {
		const baseScore: number = getBaseScoreForCategory(category);
		const advantage: number = getAdvantageForCategory(category);
		return `Regole ${category}: Primo a ${baseScore} punti, con almeno ${advantage} punti di vantaggio`;
	}

	function setGroupResult(matchId: number, score1: string | number, score2: string | number): void {
		const match: Match | undefined = groupMatches.find(m => m.id === matchId);
		if (!match || !match.t1 || !match.t2 || !match.group || !match.category) return;
		
		if (!isValidScore(score1, score2, match.category)) {
			const baseScore: number = getBaseScoreForCategory(match.category);
			const advantage: number = getAdvantageForCategory(match.category);
			
			alert(`Punteggio non valido per ${match.category}!\n${getCategoryRules(match.category)}\n\nEsempi validi:\n- ${baseScore}-${baseScore-2}\n- ${baseScore+advantage}-${baseScore}`);
			return;
		}
		
		match.score1 = parseInt(score1.toString());
		match.score2 = parseInt(score2.toString());
		match.w = match.score1 > match.score2 ? match.t1 : match.score1 < match.score2 ? match.t2 : null;
		recalculateGroupStanding(match.group);
		groupStandings = { ...groupStandings };
		groupMatches = [...groupMatches];
		
		// Save tournament data after updating match result
		saveTournamentData();
	}

	function recalculateGroupStanding(groupName: string): void {
		// Implementation would depend on your specific tournament logic
		// This is a placeholder function
		console.log(`Recalculating standings for group: ${groupName}`);
	}

	function createGroups(): void {
		// Your group creation logic here
		console.log('Creating groups...');
		
		// Save tournament data after creating groups
		saveTournamentData();
	}

	function resetMatchResult(matchId: number): void {
		const match: Match | undefined = groupMatches.find(m => m.id === matchId);
		if (match) {
			match.score1 = null;
			match.score2 = null;
			match.w = null;
			recalculateGroupStanding(match.group);
			groupMatches = [...groupMatches];
			
			// Save tournament data after resetting match
			saveTournamentData();
		}
	}

	function startKnockoutPhase(): void {
		currentPhase = 'knockout';
		console.log('Starting knockout phase...');
		
		// Save tournament data after starting knockout phase
		saveTournamentData();
	}

	function setKnockoutWinner(matchId: number, winnerId: string): void {
		// Your knockout winner logic here
		console.log(`Setting knockout winner: ${winnerId} for match: ${matchId}`);
		
		// Save tournament data after setting knockout winner
		saveTournamentData();
	}

	// Load tournament data when component initializes
	onMount(() => {
		loadTournamentData();
	});

	// Funzioni di validazione
	function validateField(field: keyof Errors, value: string): void {
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

	function validateAllFields(): void {
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

	// Enhanced handleSubmit function
	async function handleSubmit(): Promise<void> {
		validateAllFields();
		
		if (!isFormValid) {
			alert('Per favore, compila tutti i campi obbligatori correttamente.');
			return;
		}

		isLoading = true;

		try {
			const response: Response = await fetch('/api/teams', {
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

			const result: ApiResponse = await response.json();

			if (result.success) {
				// Add team to local tournament data
				const newTeam: Team = {
					id: Date.now(), // Simple ID generation
					name: teamName.trim(),
					category: category.trim(),
					coach: coachName.trim(),
					email: email.trim(),
					phone: phone.trim(),
					registrationDate: new Date().toISOString()
				};
				
				teams = [...teams, newTeam];
				
				// Update categories if new
				if (!categories.includes(category.trim())) {
					categories = [...categories, category.trim()];
				}

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

				// Save tournament data after successful registration
				saveTournamentData();

				alert('Squadra registrata con successo nel database!');
			} else {
				alert(`Errore: ${result.message}`);
			}
		} catch (error: unknown) {
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
					{#if teams.length > 0}
						<div class="alert alert-success mb-4">
							<i class="fas fa-info-circle me-2"></i>
							<strong>Squadre registrate: {teams.length}</strong>
							<br>
							<small>Ultima sincronizzazione: {new Date().toLocaleString()}</small>
						</div>
					{/if}

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
