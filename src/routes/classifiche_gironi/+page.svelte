<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	interface Team {
		id?: string;
		teamName: string;
		category: string;
		coachName: string;
		email: string;
		phone: string;
	}

	interface Match {
		id: string;
		t1: Team | null;
		t2: Team | null;
		w: Team | null;
		score1?: number;
		score2?: number;
		round?: number;
		group?: string;
		phase: 'group' | 'knockout';
		category?: string;
		field?: number;
	}

	interface GroupStanding {
		team: Team;
		played: number;
		won: number;
		drawn: number;
		lost: number;
		points: number;
		goalsFor: number;
		goalsAgainst: number;
		goalDifference: number;
	}

	// Store per condividere dati tra componenti
	const tournamentStore = writable({
		teams: [],
		groupMatches: [],
		groupStandings: {},
		groups: {},
		categories: [],
		groupsByCategory: {},
		currentPhase: 'setup'
	});

	// State locale
	let teams: Team[] = [];
	let groupMatches: Match[] = [];
	let groupStandings: { [key: string]: GroupStanding[] } = {};
	let groups: { [key: string]: Team[] } = {};
	let categories: string[] = [];
	let groupsByCategory: { [category: string]: string[] } = {};
	let isLoading = true;
	let error = '';
	let lastUpdateTime = '';

	onMount(() => {
		loadTournamentData();
		// Auto-refresh ogni 30 secondi
		const interval = setInterval(() => {
			loadTournamentData(true); // Passa true per indicare che è un refresh automatico
		}, 30000);
		return () => clearInterval(interval);
	});

	// Carica i dati del torneo dal localStorage o da un'API
	async function loadTournamentData(isAutoRefresh = false) {
		try {
			if (!isAutoRefresh) {
				isLoading = true;
			}
			error = '';

			// Prova a caricare dal localStorage
			const savedData = localStorage.getItem('volley-s3-tournament');
			if (savedData) {
				const tournamentData = JSON.parse(savedData);
				
				teams = tournamentData.teams || [];
				groupMatches = tournamentData.groupMatches || [];
				groups = tournamentData.groups || {};
				groupsByCategory = tournamentData.groupsByCategory || {};
				categories = tournamentData.categories || [];
				
				// Ricalcola le classifiche
				recalculateAllStandings();
				
				// Aggiorna timestamp
				lastUpdateTime = new Date().toLocaleTimeString('it-IT');
			} else {
				// Se non ci sono dati salvati, prova a caricare le squadre dall'API
				await loadTeamsFromAPI();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Errore nel caricamento dati';
			console.error('Errore caricamento dati torneo:', err);
		} finally {
			if (!isAutoRefresh) {
				isLoading = false;
			}
		}
	}

	// Carica le squadre dall'API (come nel primo codice)
	async function loadTeamsFromAPI() {
		try {
			const response = await fetch('/api/teams', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});

			if (!response.ok) {
				throw new Error(`Errore ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();
			
			if (result.success && result.teams) {
				teams = result.teams;
				categories = [...new Set(teams.map(t => t.category))];
			} else {
				throw new Error(result.message || 'Errore nel caricamento squadre');
			}
		} catch (err) {
			throw new Error('Impossibile caricare le squadre: ' + (err instanceof Error ? err.message : 'Errore sconosciuto'));
		}
	}

	// Scoring rules per le diverse categorie (come nel primo codice)
	function getAdvantageForCategory(category: string): number {
		const advantages: { [key: string]: number } = {
			'S1': 2, 'S2': 1, 'S3': 2, 'Under 12': 2, 'Seniores': 2
		};
		return advantages[category] || 2;
	}

	function getBaseScoreForCategory(category: string): number {
		const baseScores: { [key: string]: number } = {
			'S1': 10, 'S2': 11, 'S3': 10, 'Under 12': 10, 'Seniores': 10
		};
		return baseScores[category] || 10;
	}

	function getCategoryRules(category: string): string {
		const advantage = getAdvantageForCategory(category);
		const baseScore = getBaseScoreForCategory(category);
		return `Si vince a ${baseScore} punti. In parità da ${baseScore}-${baseScore}, serve vantaggio di ${advantage}`;
	}

	// Ricalcola le classifiche dei gironi
	function recalculateGroupStanding(groupName: string) {
		const groupTeams = groups[groupName];
		if (!groupTeams) return;

		// Inizializza le classifiche
		groupStandings[groupName] = groupTeams.map(team => ({
			team,
			played: 0,
			won: 0,
			drawn: 0,
			lost: 0,
			points: 0,
			goalsFor: 0,
			goalsAgainst: 0,
			goalDifference: 0
		}));

		// Calcola le statistiche dalle partite giocate
		const groupMatchesPlayed = groupMatches.filter(m => 
			m.group === groupName && m.score1 !== undefined && m.score2 !== undefined
		);

		groupMatchesPlayed.forEach(match => {
			const standing1 = groupStandings[groupName].find(s => s.team.id === match.t1?.id || s.team.teamName === match.t1?.teamName);
			const standing2 = groupStandings[groupName].find(s => s.team.id === match.t2?.id || s.team.teamName === match.t2?.teamName);

			if (standing1 && standing2 && match.score1 !== undefined && match.score2 !== undefined) {
				standing1.played++;
				standing2.played++;
				standing1.goalsFor += match.score1;
				standing1.goalsAgainst += match.score2;
				standing2.goalsFor += match.score2;
				standing2.goalsAgainst += match.score1;

				const category = match.category || '';
				const requiredAdvantage = getAdvantageForCategory(category);
				const baseScore = getBaseScoreForCategory(category);
				const scoreDiff = Math.abs(match.score1 - match.score2);

				if (match.score1 !== match.score2) {
					const minScore = Math.min(match.score1, match.score2);
					
					// Determina il vincitore basandosi sulle regole
					let winner1 = false;
					if (minScore < baseScore) {
						// Sotto il punteggio base, basta un punto di vantaggio
						winner1 = match.score1 > match.score2;
					} else {
						// Al punteggio base o sopra, serve il vantaggio richiesto
						if (scoreDiff >= requiredAdvantage) {
							winner1 = match.score1 > match.score2;
						} else {
							// Partita non conclusa correttamente, considerala pareggio
							standing1.drawn++;
							standing2.drawn++;
							standing1.points += 1;
							standing2.points += 1;
							standing1.goalDifference = standing1.goalsFor - standing1.goalsAgainst;
							standing2.goalDifference = standing2.goalsFor - standing2.goalsAgainst;
							return;
						}
					}
					
					if (winner1) {
						standing1.won++;
						standing1.points += 3;
						standing2.lost++;
					} else {
						standing2.won++;
						standing2.points += 3;
						standing1.lost++;
					}
				} else {
					// Pareggio
					standing1.drawn++;
					standing2.drawn++;
					standing1.points += 1;
					standing2.points += 1;
				}

				standing1.goalDifference = standing1.goalsFor - standing1.goalsAgainst;
				standing2.goalDifference = standing2.goalsFor - standing2.goalsAgainst;
			}
		});

		// Ordina la classifica
		groupStandings[groupName].sort((a, b) => {
			if (b.points !== a.points) return b.points - a.points;
			if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
			if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
			return a.team.teamName.localeCompare(b.team.teamName);
		});
	}

	// Ricalcola tutte le classifiche
	function recalculateAllStandings() {
		Object.keys(groups).forEach(groupName => {
			recalculateGroupStanding(groupName);
		});
		groupStandings = { ...groupStandings };
	}

	// Funzione per aggiornare manualmente
	function refreshStandings() {
		loadTournamentData();
	}

	// Funzione per esportare i dati
	function exportStandings() {
		const data = {
			groupStandings,
			timestamp: new Date().toISOString()
		};
		
		const dataStr = JSON.stringify(data, null, 2);
		const dataBlob = new Blob([dataStr], {type:'application/json'});
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `classifiche-gironi-${new Date().toISOString().split('T')[0]}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}

	// Funzione per la stampa
	function printStandings() {
		window.print();
	}
</script>

<svelte:head>
	<title>Classifiche Gironi - Torneo Volley S3</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
	<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet" />
</svelte:head>

<div class="container my-4">
	<!-- Header -->
	<div class="row mb-4">
		<div class="col-12">
			<div class="card border-0 shadow-lg bg-gradient">
				<div class="card-header bg-primary text-white border-0 py-4">
					<div class="d-flex flex-column flex-md-row justify-content-between align-items-center">
						<div class="mb-3 mb-md-0 text-center text-md-start">
							<h1 class="display-6 fw-bold mb-2">
								<i class="bi bi-trophy-fill me-2"></i>
								Classifiche Gironi - Torneo Volley S3
							</h1>
							<p class="mb-0 opacity-75">
								<i class="bi bi-clock me-1"></i>
								Aggiornamento automatico ogni 30s
								{#if lastUpdateTime}
									• Ultimo aggiornamento: <span class="fw-semibold">{lastUpdateTime}</span>
								{/if}
							</p>
						</div>
						<div class="d-flex flex-column flex-sm-row gap-2">
							<button class="btn btn-light btn-lg shadow-sm" on:click={refreshStandings}>
								<i class="bi bi-arrow-clockwise me-2"></i> Aggiorna
							</button>
							<div class="btn-group">
								<button class="btn btn-outline-light" on:click={exportStandings}>
									<i class="bi bi-download me-1"></i> Esporta
								</button>
								<button class="btn btn-outline-light" on:click={printStandings}>
									<i class="bi bi-printer me-1"></i> Stampa
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	{#if isLoading}
		<div class="row justify-content-center">
			<div class="col-md-6">
				<div class="card border-0 shadow-sm">
					<div class="card-body text-center py-5">
						<div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
							<span class="visually-hidden">Caricamento...</span>
						</div>
						<h4 class="text-muted">Caricamento classifiche...</h4>
						<p class="text-muted mb-0">Attendere prego</p>
					</div>
				</div>
			</div>
		</div>
	{:else if error}
		<div class="row justify-content-center">
			<div class="col-md-8">
				<div class="alert alert-danger alert-dismissible border-0 shadow-sm" role="alert">
					<div class="d-flex align-items-center">
						<i class="bi bi-exclamation-triangle-fill fs-3 me-3"></i>
						<div class="flex-grow-1">
							<h5 class="alert-heading mb-1">Errore nel caricamento</h5>
							<p class="mb-2">{error}</p>
							<button class="btn btn-outline-danger btn-sm" on:click={refreshStandings}>
								<i class="bi bi-arrow-clockwise me-1"></i> Riprova
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="row">
			<div class="col-12">
				{#if Object.keys(groupStandings).length === 0}
					<div class="row justify-content-center">
						<div class="col-md-8">
							<div class="card border-0 shadow-sm">
								<div class="card-body text-center py-5">
									<div class="mb-4">
										<i class="bi bi-info-circle text-info" style="font-size: 4rem;"></i>
									</div>
									<h4 class="card-title text-info mb-3">Nessuna classifica disponibile</h4>
									<p class="card-text text-muted mb-3">I gironi non sono ancora stati creati o non ci sono dati disponibili.</p>
									<p class="card-text">
										<small class="text-muted">Assicurati che il torneo principale sia in corso e che i gironi siano stati creati.</small>
									</p>
									<button class="btn btn-primary mt-3" on:click={refreshStandings}>
										<i class="bi bi-arrow-clockwise me-1"></i> Aggiorna
									</button>
								</div>
							</div>
						</div>
					</div>
				{:else}
					{#each categories as category}
						<div class="mb-5">
							<!-- Titolo Categoria -->
							<div class="card border-0 shadow-sm mb-4">
								<div class="card-header bg-gradient bg-secondary text-white border-0">
									<div class="d-flex align-items-center justify-content-between">
										<div>
											<h3 class="mb-1 fw-bold">
												<i class="bi bi-people-fill me-2"></i>{category}
											</h3>
											<p class="mb-0 opacity-75">
												<i class="bi bi-gear me-1"></i>{getCategoryRules(category)}
											</p>
										</div>
										<div class="text-end">
											<span class="badge bg-light text-dark fs-6">
												{(groupsByCategory[category] || []).length} gironi
											</span>
										</div>
									</div>
								</div>
							</div>

							<!-- Gironi per categoria -->
							<div class="row g-4">
								{#each groupsByCategory[category] || [] as groupName}
									{@const standings = groupStandings[groupName] || []}
									<div class="col-xl-6 col-lg-12">
										<div class="card h-100 border-0 shadow hover-lift">
											<div class="card-header bg-primary text-white border-0 position-relative">
												<div class="d-flex align-items-center justify-content-between">
													<h5 class="mb-0 fw-bold">
														<i class="bi bi-diagram-3 me-2"></i>
														{groupName.split('_').slice(1).join(' ')}
													</h5>
													<div class="badge bg-light text-primary fs-6">
														{standings.length} squadre
													</div>
												</div>
												<div class="position-absolute top-0 end-0 p-2">
													<div class="bg-white bg-opacity-25 rounded-circle p-1">
														<i class="bi bi-trophy text-white"></i>
													</div>
												</div>
											</div>
											<div class="card-body p-0">
												{#if standings.length > 0}
													<div class="table-responsive">
														<table class="table table-hover mb-0">
															<thead class="table-light border-bottom">
																<tr>
																	<th class="text-center fw-bold" style="width: 50px;">
																		<i class="bi bi-hash text-muted"></i>
																	</th>
																	<th class="fw-bold">
																		<i class="bi bi-people me-1 text-muted"></i>Squadra
																	</th>
																	<th class="text-center fw-bold" style="width: 50px;" title="Partite">
																		<i class="bi bi-calendar-event text-muted"></i>
																	</th>
																	<th class="text-center fw-bold" style="width: 50px;" title="Vittorie">
																		<i class="bi bi-check-circle text-success"></i>
																	</th>
																	<th class="text-center fw-bold" style="width: 50px;" title="Pareggi">
																		<i class="bi bi-dash-circle text-warning"></i>
																	</th>
																	<th class="text-center fw-bold" style="width: 50px;" title="Sconfitte">
																		<i class="bi bi-x-circle text-danger"></i>
																	</th>
																	<th class="text-center fw-bold" style="width: 60px;" title="Punti">
																		<i class="bi bi-star-fill text-primary"></i>
																	</th>
																</tr>
															</thead>
															<tbody>
																{#each standings as standing, i}
																	<tr class="position-relative {i < 2 ? 'bg-success bg-opacity-10 border-success border-opacity-25' : ''} {standing.played === 0 ? 'bg-light bg-opacity-50' : ''}">
																		{#if i < 2}
																			<div class="position-absolute top-0 start-0 h-100 bg-success" style="width: 4px;"></div>
																		{/if}
																		<td class="text-center">
																			<div class="d-flex align-items-center justify-content-center">
																				<span class="badge {i === 0 ? 'bg-warning text-dark' : i === 1 ? 'bg-secondary' : 'bg-light text-dark'} rounded-pill fs-6 fw-bold">
																					{i + 1}
																				</span>
																				{#if i < 2}
																					<i class="bi bi-arrow-up-circle-fill text-success ms-1"></i>
																				{/if}
																			</div>
																		</td>
																		<td class="py-3">
																			<div class="d-flex align-items-center">
																				<div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
																					<i class="bi bi-people text-white"></i>
																				</div>
																				<div>
																					<div class="fw-bold text-dark">{standing.team.teamName}</div>
																					<small class="text-muted">
																						<i class="bi bi-person me-1"></i>{standing.team.coachName}
																					</small>
																				</div>
																			</div>
																		</td>
																		<td class="text-center py-3">
																			<span class="badge bg-light text-dark rounded-pill">{standing.played}</span>
																		</td>
																		<td class="text-center py-3">
																			<span class="badge bg-success rounded-pill fw-bold">{standing.won}</span>
																		</td>
																		<td class="text-center py-3">
																			<span class="badge bg-warning text-dark rounded-pill fw-bold">{standing.drawn}</span>
																		</td>
																		<td class="text-center py-3">
																			<span class="badge bg-danger rounded-pill fw-bold">{standing.lost}</span>
																		</td>
																		<td class="text-center py-3">
																			<span class="badge bg-primary rounded-pill fs-6 fw-bold">{standing.points}</span>
																		</td>
																	</tr>
																{/each}
															</tbody>
														</table>
													</div>
												{:else}
													<div class="p-5 text-center">
														<i class="bi bi-hourglass-split text-muted mb-3" style="font-size: 3rem;"></i>
														<h6 class="text-muted">Nessun dato disponibile</h6>
														<p class="text-muted small mb-0">Le partite non sono ancora iniziate</p>
													</div>
												{/if}
											</div>
											<div class="card-footer bg-light border-0 text-center">
												<small class="text-muted d-flex align-items-center justify-content-center">
													<i class="bi bi-info-circle me-1"></i>
													<span class="fw-semibold">Le prime 2 squadre si qualificano</span>
													<i class="bi bi-arrow-up-circle text-success ms-1"></i>
												</small>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.bg-gradient {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	
	.hover-lift {
		transition: all 0.3s ease;
	}
	
	.hover-lift:hover {
		transform: translateY(-5px);
		box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175) !important;
	}
	
	.card {
		transition: all 0.15s ease-in-out;
		border-radius: 15px;
		overflow: hidden;
	}
	
	.card-header {
		border-radius: 15px 15px 0 0 !important;
	}
	
	.table th {
		font-weight: 600;
		border-bottom: 2px solid #dee2e6;
		background-color: rgba(248, 249, 250, 0.8);
		padding: 1rem 0.75rem;
	}
	
	.table td {
		vertical-align: middle;
		border-color: rgba(0, 0, 0, 0.05);
	}
	
	.table-hover tbody tr:hover {
		background-color: rgba(0, 123, 255, 0.05);
	}
	
	.badge {
		font-size: 0.75rem;
	}
	
	.spinner-border {
		animation: spinner-border 0.75s linear infinite;
	}
	
	@keyframes pulse {
		0% { opacity: 1; }
		50% { opacity: 0.5; }
		100% { opacity: 1; }
	}
	
	.bg-success.bg-opacity-10 {
		animation: pulse 2s infinite;
	}
	
	.btn {
		border-radius: 10px;
		transition: all 0.2s ease;
	}
	
	.btn:hover {
		transform: translateY(-2px);
	}
	
	@media (max-width: 768px) {
		.d-flex.gap-2 {
			flex-direction: column;
			gap: 0.5rem !important;
		}
		
		.table th, .table td {
			font-size: 0.85rem;
			padding: 0.75rem 0.5rem;
		}
		
		.container {
			padding: 0.5rem;
		}
		
		.card {
			border-radius: 10px;
		}
		
		.display-6 {
			font-size: 1.5rem;
		}
	}
	
	@media (max-width: 576px) {
		.table th, .table td {
			font-size: 0.8rem;
			padding: 0.5rem 0.25rem;
		}
		
		.badge {
			font-size: 0.7rem;
		}
	}
	
	@media print {
		.btn, .alert, .card-header .badge {
			display: none;
		}
		
		.card {
			break-inside: avoid;
			margin-bottom: 1rem;
			box-shadow: none !important;
			border: 1px solid #dee2e6 !important;
		}
		
		.bg-light, .bg-gradient {
			background-color: transparent !important;
		}
		
		.text-white {
			color: #000 !important;
		}
		
		.hover-lift:hover {
			transform: none;
		}
	}
</style>