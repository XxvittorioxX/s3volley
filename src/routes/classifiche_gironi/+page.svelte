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

	onMount(() => {
		loadTournamentData();
		// Auto-refresh ogni 30 secondi
		const interval = setInterval(loadTournamentData, 30000);
		return () => clearInterval(interval);
	});

	// Carica i dati del torneo dal localStorage o da un'API
	async function loadTournamentData() {
		try {
			isLoading = true;
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
			} else {
				// Se non ci sono dati salvati, prova a caricare le squadre dall'API
				await loadTeamsFromAPI();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Errore nel caricamento dati';
			console.error('Errore caricamento dati torneo:', err);
		} finally {
			isLoading = false;
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
	<meta http-equiv="refresh" content="60" />
</svelte:head>

<div class="container-fluid my-4">
	{#if isLoading}
		<div class="text-center py-5">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Caricamento...</span>
			</div>
			<p class="mt-2">Caricamento classifiche...</p>
		</div>
	{:else if error}
		<div class="alert alert-danger">
			<i class="bi bi-exclamation-triangle"></i> {error}
			<button class="btn btn-outline-danger btn-sm ms-2" on:click={refreshStandings}>
				<i class="bi bi-arrow-clockwise"></i> Riprova
			</button>
		</div>
	{:else}
		<div class="row">
			<div class="col-12">
				<div class="d-flex justify-content-between align-items-center mb-4">
					<h1 class="text-primary">🏐 Classifiche Gironi - Torneo Volley S3</h1>
					<div class="btn-group">
						<button class="btn btn-outline-primary btn-sm" on:click={refreshStandings}>
							<i class="bi bi-arrow-clockwise"></i> Aggiorna
						</button>
						<button class="btn btn-outline-secondary btn-sm" on:click={exportStandings}>
							<i class="bi bi-download"></i> Esporta
						</button>
						<button class="btn btn-outline-secondary btn-sm" on:click={printStandings}>
							<i class="bi bi-printer"></i> Stampa
						</button>
					</div>
				</div>
				<div class="text-center mb-3">
					<small class="text-muted">
						<i class="bi bi-clock"></i> Aggiornamento automatico ogni 30s
					</small>
				</div>

				{#if Object.keys(groupStandings).length === 0}
					<div class="alert alert-info text-center">
						<h4><i class="bi bi-info-circle"></i> Nessuna classifica disponibile</h4>
						<p>I gironi non sono ancora stati creati o non ci sono dati disponibili.</p>
						<p class="text-muted">Assicurati che il torneo principale sia in corso e che i gironi siano stati creati.</p>
					</div>
				{:else}
					{#each categories as category}
						<div class="mb-5">
							<div class="row mb-3">
								<div class="col-12">
									<h2 class="text-primary border-bottom pb-2">
										🏆 {category}
										<small class="text-muted fs-6 ms-3">{getCategoryRules(category)}</small>
									</h2>
								</div>
							</div>

							<div class="row">
								{#each groupsByCategory[category] || [] as groupName}
									{@const standings = groupStandings[groupName] || []}
									<div class="col-lg-6 col-xl-4 mb-4">
										<div class="card h-100 shadow-sm">
											<div class="card-header bg-primary text-white">
												<h5 class="mb-0 text-center">
													<i class="bi bi-trophy"></i> {groupName.split('_').slice(1).join(' ')}
												</h5>
											</div>
											<div class="card-body p-0">
												{#if standings.length > 0}
													<div class="table-responsive">
														<table class="table table-hover mb-0">
															<thead class="table-light">
																<tr class="text-center">
																	<th style="width: 40px;">#</th>
																	<th class="text-start">Squadra</th>
																	<th style="width: 40px;" title="Partite">P</th>
																	<th style="width: 40px;" title="Vittorie">V</th>
																	<th style="width: 40px;" title="Pareggi">N</th>
																	<th style="width: 40px;" title="Sconfitte">S</th>
																	<th style="width: 60px;" title="Punti Fatti">Pt+</th>
																	<th style="width: 60px;" title="Punti Subiti">Pt-</th>
																	<th style="width: 60px;" title="Differenza">Dif</th>
																	<th style="width: 50px;" class="fw-bold" title="Punti Classifica">Pti</th>
																</tr>
															</thead>
															<tbody>
																{#each standings as standing, i}
																	<tr class="text-center {i < 2 ? 'table-success' : ''} {standing.played === 0 ? 'table-light' : ''}">
																		<td class="fw-bold">
																			{i + 1}
																			{#if i < 2}
																				<span class="text-success"><i class="bi bi-check-circle"></i></span>
																			{/if}
																		</td>
																		<td class="text-start">
																			<div class="fw-bold">{standing.team.teamName}</div>
																			<small class="text-muted">{standing.team.coachName}</small>
																		</td>
																		<td>{standing.played}</td>
																		<td class="text-success fw-bold">{standing.won}</td>
																		<td class="text-warning fw-bold">{standing.drawn}</td>
																		<td class="text-danger fw-bold">{standing.lost}</td>
																		<td class="text-primary">{standing.goalsFor}</td>
																		<td class="text-danger">{standing.goalsAgainst}</td>
																		<td class="fw-bold {standing.goalDifference > 0 ? 'text-success' : standing.goalDifference < 0 ? 'text-danger' : ''}">
																			{standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
																		</td>
																		<td class="fw-bold text-primary fs-5">{standing.points}</td>
																	</tr>
																{/each}
															</tbody>
														</table>
													</div>
												{:else}
													<div class="p-3 text-center text-muted">
														<i class="bi bi-hourglass-split"></i>
														<i>Nessun dato disponibile</i>
													</div>
												{/if}
											</div>
											<div class="card-footer bg-light text-center">
												<small class="text-muted">
													<i class="bi bi-check-circle text-success"></i> Le prime 2 si qualificano
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
	.card {
		transition: transform 0.2s ease-in-out;
	}
	
	.card:hover {
		transform: translateY(-2px);
	}
	
	.table th {
		font-size: 0.85rem;
		font-weight: 600;
		border-bottom: 2px solid #dee2e6;
	}
	
	.table td {
		font-size: 0.9rem;
		vertical-align: middle;
	}
	
	.table-success {
		background-color: rgba(25, 135, 84, 0.1) !important;
	}
	
	.card-header {
		background: linear-gradient(135deg, #0d6efd 0%, #0056b3 100%) !important;
	}
	
	@media (max-width: 768px) {
		.table th, .table td {
			font-size: 0.8rem;
			padding: 0.3rem;
		}
		
		.container-fluid {
			padding: 0.5rem;
		}
		
		.btn-group {
			flex-direction: column;
		}
		
		.btn-group .btn {
			margin-bottom: 0.25rem;
		}
	}
	
	@media print {
		.btn-group {
			display: none;
		}
		
		.card {
			break-inside: avoid;
			margin-bottom: 1rem;
		}
	}
</style>