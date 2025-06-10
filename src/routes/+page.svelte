<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

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

	interface TournamentState {
		data: TournamentData | null;
		listeners: Set<() => void>;
		notifyAll: () => void;
	}

	// Stato globale persistente
	const STORAGE_KEY = 'tournament_data_persistent';
	
	// Stato reattivo
	let teams: Team[] = [];
	let groupMatches: Match[] = [];
	let groupStandings: Record<string, any> = {};
	let groups: Record<string, any> = {};
	let categories: string[] = [];
	let groupsByCategory: Record<string, any> = {};
	let currentPhase: string = 'registration';

	// Form state
	let teamName: string = '';
	let category: string = '';
	let coachName: string = '';
	let email: string = '';
	let phone: string = '';
	let isLoading: boolean = false;
	let errors: Errors = {
		teamName: '',
		category: '',
		coachName: '',
		email: '',
		phone: ''
	};

	// Gestione stato globale migliorata
	function initializeGlobalState(): void {
		if (typeof window !== 'undefined') {
			// Crea un oggetto globale per la persistenza
			if (!(window as any).tournamentState) {
				(window as any).tournamentState = {
					data: null,
					listeners: new Set<() => void>(),
					// Metodo per aggiornare tutti i componenti
					notifyAll: function() {
						this.listeners.forEach((listener: () => void) => listener());
					}
				} as TournamentState;
			}
		}
	}

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
			// Salva nello stato globale
			if (typeof window !== 'undefined') {
				(window as any).tournamentState.data = tournamentData;
				(window as any).tournamentState.notifyAll();
			}
			
			// Backup in sessionStorage per maggiore persistenza
			if (typeof sessionStorage !== 'undefined') {
				sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tournamentData));
			}
			
			console.log('Tournament data saved successfully');
		} catch (error) {
			console.error('Errore nel salvataggio dati:', error);
		}
	}

	function loadTournamentData(): void {
		try {
			let loadedData: TournamentData | null = null;
			
			// Prova prima dallo stato globale
			if (typeof window !== 'undefined' && (window as any).tournamentState?.data) {
				loadedData = (window as any).tournamentState.data;
			}
			// Fallback a sessionStorage
			else if (typeof sessionStorage !== 'undefined') {
				const stored = sessionStorage.getItem(STORAGE_KEY);
				if (stored) {
					loadedData = JSON.parse(stored);
				}
			}
			
			if (loadedData) {
				teams = loadedData.teams || [];
				groupMatches = loadedData.groupMatches || [];
				groupStandings = loadedData.groupStandings || {};
				groups = loadedData.groups || {};
				categories = loadedData.categories || [];
				groupsByCategory = loadedData.groupsByCategory || {};
				currentPhase = loadedData.currentPhase || 'registration';
				console.log('Tournament data loaded successfully');
			}
		} catch (error) {
			console.error('Errore nel caricamento dati:', error);
		}
	}

	// Listener per aggiornamenti da altre istanze
	function setupStateListener(): (() => void) | undefined {
		if (typeof window !== 'undefined' && (window as any).tournamentState) {
			const updateListener = (): void => {
				loadTournamentData();
			};
			(window as any).tournamentState.listeners.add(updateListener);
			
			// Cleanup function
			return (): void => {
				if ((window as any).tournamentState) {
					(window as any).tournamentState.listeners.delete(updateListener);
				}
			};
		}
		return undefined;
	}

	// Regole di punteggio
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
		return 2;
	}

	function getMaxScoreForCategory(category: string): number {
		const baseScore = getBaseScoreForCategory(category);
		return baseScore + 20;
	}

	function isValidScore(score1: string | number, score2: string | number, category: string): boolean {
		const s1: number = parseInt(score1.toString());
		const s2: number = parseInt(score2.toString());
		
		if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) return false;
		
		const baseScore: number = getBaseScoreForCategory(category);
		const advantage: number = getAdvantageForCategory(category);
		const maxScore: number = getMaxScoreForCategory(category);
		
		if (s1 > maxScore || s2 > maxScore) return false;
		
		const higherScore: number = Math.max(s1, s2);
		const lowerScore: number = Math.min(s1, s2);
		
		if (higherScore === baseScore) {
			return lowerScore <= baseScore - advantage;
		}
		
		if (higherScore > baseScore) {
			return higherScore - lowerScore === advantage;
		}
		
		return s1 !== s2;
	}

	function getCategoryRules(category: string): string {
		const baseScore: number = getBaseScoreForCategory(category);
		const advantage: number = getAdvantageForCategory(category);
		const maxScore: number = getMaxScoreForCategory(category);
		return `Regole ${category}: Primo a ${baseScore} punti (max ${maxScore}), con almeno ${advantage} punti di vantaggio`;
	}

	// Gestione risultati
	function setGroupResult(matchId: number, score1: string | number, score2: string | number): void {
		const match: Match | undefined = groupMatches.find(m => m.id === matchId);
		if (!match || !match.t1 || !match.t2 || !match.group || !match.category) return;
		
		if (!isValidScore(score1, score2, match.category)) {
			alert(`Punteggio non valido per ${match.category}!\n\n${getCategoryRules(match.category)}`);
			return;
		}
		
		match.score1 = parseInt(score1.toString());
		match.score2 = parseInt(score2.toString());
		match.w = match.score1 > match.score2 ? match.t1 : match.t2;
		
		recalculateGroupStanding(match.group);
		groupStandings = { ...groupStandings };
		groupMatches = [...groupMatches];
		
		saveTournamentData();
	}

	function recalculateGroupStanding(groupName: string): void {
		const groupTeams = teams.filter(team => groups[groupName]?.includes(team.name));
		const groupMatchesData = groupMatches.filter(match => match.group === groupName);
		
		const standings = groupTeams.map(team => {
			const teamMatches = groupMatchesData.filter(match => 
				match.t1 === team.name || match.t2 === team.name
			);
			
			let wins = 0;
			let losses = 0;
			let setsWon = 0;
			let setsLost = 0;
			let pointsWon = 0;
			let pointsLost = 0;
			
			teamMatches.forEach(match => {
				if (match.score1 !== null && match.score2 !== null) {
					if (team.name === match.t1) {
						pointsWon += match.score1;
						pointsLost += match.score2;
						if (match.score1 > match.score2) {
							wins++;
							setsWon++;
						} else {
							losses++;
							setsLost++;
						}
					} else {
						pointsWon += match.score2;
						pointsLost += match.score1;
						if (match.score2 > match.score1) {
							wins++;
							setsWon++;
						} else {
							losses++;
							setsLost++;
						}
					}
				}
			});
			
			return {
				team: team.name,
				wins,
				losses,
				setsWon,
				setsLost,
				pointsWon,
				pointsLost,
				setRatio: setsLost > 0 ? (setsWon / setsLost).toFixed(2) : setsWon.toString(),
				pointRatio: pointsLost > 0 ? (pointsWon / pointsLost).toFixed(2) : pointsWon.toString()
			};
		});
		
		standings.sort((a, b) => {
			if (b.wins !== a.wins) return b.wins - a.wins;
			if (parseFloat(b.setRatio) !== parseFloat(a.setRatio)) return parseFloat(b.setRatio) - parseFloat(a.setRatio);
			return parseFloat(b.pointRatio) - parseFloat(a.pointRatio);
		});
		
		groupStandings[groupName] = standings;
	}

	// Creazione gironi
	function createGroups(): void {
		const categoriesTeams: Record<string, Team[]> = {};
		
		teams.forEach(team => {
			if (!categoriesTeams[team.category]) {
				categoriesTeams[team.category] = [];
			}
			categoriesTeams[team.category].push(team);
		});
		
		Object.keys(categoriesTeams).forEach(cat => {
			const teamsInCategory = categoriesTeams[cat];
			const numGroups = Math.ceil(teamsInCategory.length / 4);
			
			for (let i = 0; i < numGroups; i++) {
				const groupName = `${cat}_Gruppo_${String.fromCharCode(65 + i)}`;
				groups[groupName] = [];
				
				for (let j = i; j < teamsInCategory.length; j += numGroups) {
					groups[groupName].push(teamsInCategory[j].name);
				}
				
				const groupTeams = groups[groupName];
				for (let k = 0; k < groupTeams.length; k++) {
					for (let l = k + 1; l < groupTeams.length; l++) {
						groupMatches.push({
							id: Date.now() + Math.random(),
							t1: groupTeams[k],
							t2: groupTeams[l],
							score1: null,
							score2: null,
							w: null,
							group: groupName,
							category: cat
						});
					}
				}
			}
		});
		
		groupsByCategory = categoriesTeams;
		currentPhase = 'groups';
		saveTournamentData();
	}

	function resetGroups(): void {
		if (confirm('Sei sicuro di voler resettare i gironi? Tutti i risultati delle partite andranno persi.')) {
			groups = {};
			groupMatches = [];
			groupStandings = {};
			groupsByCategory = {};
			currentPhase = 'registration';
			
			saveTournamentData();
			alert('Gironi resettati con successo!');
		}
	}

	function startKnockoutPhase(): void {
		currentPhase = 'knockout';
		saveTournamentData();
	}

	// Validazione form
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

	async function handleSubmit(): Promise<void> {
		validateAllFields();
		
		if (!isFormValid) {
			alert('Per favore, compila tutti i campi obbligatori correttamente.');
			return;
		}

		isLoading = true;

		try {
			// Simula chiamata API
			await new Promise(resolve => setTimeout(resolve, 1000));

			const newTeam: Team = {
				id: Date.now(),
				name: teamName.trim(),
				category: category.trim(),
				coach: coachName.trim(),
				email: email.trim(),
				phone: phone.trim(),
				registrationDate: new Date().toISOString()
			};
			
			teams = [...teams, newTeam];
			
			if (!categories.includes(category.trim())) {
				categories = [...categories, category.trim()];
			}

			// Reset form
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

			saveTournamentData();
			alert('Squadra registrata con successo!');
		} catch (error: unknown) {
			console.error('Errore:', error);
			alert('Errore durante la registrazione. Riprova più tardi.');
		} finally {
			isLoading = false;
		}
	}

	// Lifecycle
	let cleanupListener: (() => void) | undefined;

	onMount(() => {
		initializeGlobalState();
		loadTournamentData();
		cleanupListener = setupStateListener();
	});

	onDestroy(() => {
		if (cleanupListener) {
			cleanupListener();
		}
	});
</script>

<div class="container mt-4">
	<div class="row justify-content-center">
		<div class="col-lg-8">
			<div class="card shadow border-0">
				<div class="card-header bg-primary text-white text-center py-3">
					<h1 class="h4 mb-0">
						<i class="fas fa-users me-2"></i>
						Gestione Torneo Pallavolo
					</h1>
				</div>
				<div class="card-body p-4">
					<!-- Status del torneo -->
					{#if teams.length > 0}
						<div class="alert alert-info mb-4">
							<div class="d-flex justify-content-between align-items-center">
								<div>
									<i class="fas fa-info-circle me-2"></i>
									<strong>Squadre: {teams.length}</strong>
								</div>
								<div>
									<span class="badge bg-secondary">
										{currentPhase === 'registration' ? 'Registrazione' : 
										 currentPhase === 'groups' ? 'Gironi' : 'Eliminazione diretta'}
									</span>
								</div>
							</div>
						</div>
					{/if}

					<!-- Form registrazione -->
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
									<option value="S1">S1 (21 punti)</option>
									<option value="S2">S2 (21 punti)</option>
									<option value="S3">S3 (21 punti)</option>
									<option value="Under 12">Under 12 (15 punti)</option>
									<option value="Seniores">Seniores (25 punti)</option>
								</select>
								{#if errors.category}
									<div class="invalid-feedback">
										{errors.category}
									</div>
								{/if}
								{#if category}
									<div class="form-text">
										<i class="fas fa-info-circle me-1"></i>
										{getCategoryRules(category)}
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
									Compila tutti i campi
								{/if}
							</button>
						</div>
					</form>

					<!-- Controlli torneo -->
					{#if teams.length >= 4}
						<div class="mt-4 border-top pt-4">
							<h5 class="mb-3">
								<i class="fas fa-cogs me-2"></i>
								Controlli Torneo
							</h5>
							
							{#if currentPhase === 'registration'}
								<button 
									class="btn btn-primary"
									on:click={createGroups}
								>
									<i class="fas fa-layer-group me-2"></i>
									Crea Gironi
								</button>
							{:else if currentPhase === 'groups'}
								<div class="d-flex gap-2 flex-wrap">
									<button 
										class="btn btn-warning"
										on:click={resetGroups}
									>
										<i class="fas fa-undo me-2"></i>
										Resetta Gironi
									</button>
									<button 
										class="btn btn-success"
										on:click={startKnockoutPhase}
									>
										<i class="fas fa-trophy me-2"></i>
										Avvia Eliminatorie
									</button>
								</div>
							{/if}
						</div>
					{/if}

					<!-- Visualizzazione gironi -->
					{#if currentPhase === 'groups' && Object.keys(groups).length > 0}
						<div class="mt-4 border-top pt-4">
							<h5 class="mb-3">
								<i class="fas fa-list me-2"></i>
								Gironi Creati
							</h5>
							
							<div class="row">
								{#each Object.entries(groups) as [groupName, teamsList]}
									<div class="col-md-6 mb-3">
										<div class="card bg-light">
											<div class="card-header">
												<h6 class="mb-0">{groupName}</h6>
											</div>
											<div class="card-body">
												<ul class="list-unstyled mb-0">
													{#each teamsList as teamName}
														<li class="mb-1">
															<i class="fas fa-team-circle me-2"></i>
															{teamName}
														</li>
													{/each}
												</ul>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<svelte:head>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
	<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
</svelte:head>

<style>
	:global(.card) {
		border-radius: 12px;
		overflow: hidden;
	}

	:global(.card-header) {
		background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
		border: none;
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

	@media (max-width: 768px) {
		:global(.container) {
			padding-left: 10px;
			padding-right: 10px;
		}
	}
</style>