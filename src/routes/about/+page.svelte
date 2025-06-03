<script lang="ts">
	import { registeredTeams, type Team } from '$lib/stores/teams';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

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

	interface PointsSettings {
		victory: number;
		draw: number;
		defeat: number;
	}

	let teams: Team[] = [];
	let groupMatches: Match[] = [];
	let knockoutMatches: Match[] = [];
	let groupStandings: { [key: string]: GroupStanding[] } = {};
	let groups: { [key: string]: Team[] } = {};
	let currentPhase: 'setup' | 'points-config' | 'group' | 'knockout' | 'finished' = 'setup';
	let winner: { [category: string]: Team | null } = {};
	let qualifiedTeams: { [category: string]: Team[] } = {};
	let categories: string[] = [];
	
	// Configurazione punti
	let pointsSettings: PointsSettings = {
		victory: 3,
		draw: 1,
		defeat: 0
	};

	onMount(() => {
		teams = get(registeredTeams);
		categories = [...new Set(teams.map(t => t.category))];
	});

	function goToPointsConfig() {
		if (teams.length < 4) {
			alert('Servono almeno 4 squadre per i gironi!');
			return;
		}
		currentPhase = 'points-config';
	}

	function createGroups() {
		// Raggruppa squadre per categoria
		const teamsByCategory: { [key: string]: Team[] } = {};
		teams.forEach(team => {
			if (!teamsByCategory[team.category]) {
				teamsByCategory[team.category] = [];
			}
			teamsByCategory[team.category].push(team);
		});

		// Verifica che ogni categoria abbia almeno 4 squadre
		const validCategories = Object.entries(teamsByCategory).filter(([_, teams]) => teams.length >= 4);
		if (validCategories.length === 0) {
			alert('Ogni categoria deve avere almeno 4 squadre per creare i gironi!');
			return;
		}

		groups = {};
		groupMatches = [];
		groupStandings = {};
		qualifiedTeams = {};
		winner = {};

		const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

		// Crea gironi per ogni categoria
		validCategories.forEach(([category, categoryTeams]) => {
			const numGroups = Math.max(2, Math.ceil(categoryTeams.length / 4));
			const shuffled = [...categoryTeams].sort(() => Math.random() - 0.5);
			
			// Inizializza gironi per questa categoria
			for (let i = 0; i < numGroups; i++) {
				const groupKey = `${category}-${groupNames[i]}`;
				groups[groupKey] = [];
			}

			// Distribuisci squadre nei gironi
			shuffled.forEach((team, index) => {
				const groupIndex = index % numGroups;
				const groupKey = `${category}-${groupNames[groupIndex]}`;
				groups[groupKey].push(team);
			});

			// Crea partite dei gironi per questa categoria
			Object.entries(groups).forEach(([groupKey, groupTeams]) => {
				if (groupKey.startsWith(category)) {
					for (let i = 0; i < groupTeams.length; i++) {
						for (let j = i + 1; j < groupTeams.length; j++) {
							groupMatches.push({
								id: `${groupKey}-${i}-${j}`,
								t1: groupTeams[i],
								t2: groupTeams[j],
								w: null,
								score1: undefined,
								score2: undefined,
								group: groupKey,
								phase: 'group',
								category: category
							});
						}
					}
				}
			});

			// Inizializza classifiche gironi per questa categoria
			Object.entries(groups).forEach(([groupKey, groupTeams]) => {
				if (groupKey.startsWith(category)) {
					groupStandings[groupKey] = groupTeams.map(team => ({
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
				}
			});

			// Inizializza array per squadre qualificate e vincitori
			qualifiedTeams[category] = [];
			winner[category] = null;
		});

		currentPhase = 'group';
	}

	function setGroupResult(matchId: string, score1: number, score2: number) {
		const matchIndex = groupMatches.findIndex(m => m.id === matchId);
		if (matchIndex === -1) return;
		
		const match = groupMatches[matchIndex];
		if (!match.t1 || !match.t2) return;

		// Rimuovi risultato precedente se esisteva
		if (match.score1 !== undefined && match.score2 !== undefined) {
			removeOldResult(match);
		}

		match.score1 = score1;
		match.score2 = score2;
		match.w = score1 > score2 ? match.t1 : score1 < score2 ? match.t2 : null;

		// Aggiorna classifiche
		const standing1 = groupStandings[match.group!].find(s => s.team === match.t1);
		const standing2 = groupStandings[match.group!].find(s => s.team === match.t2);

		if (standing1 && standing2) {
			standing1.played++;
			standing2.played++;
			standing1.goalsFor += score1;
			standing1.goalsAgainst += score2;
			standing2.goalsFor += score2;
			standing2.goalsAgainst += score1;
			standing1.goalDifference = standing1.goalsFor - standing1.goalsAgainst;
			standing2.goalDifference = standing2.goalsFor - standing2.goalsAgainst;

			if (score1 > score2) {
				standing1.won++;
				standing1.points += pointsSettings.victory;
				standing2.lost++;
				standing2.points += pointsSettings.defeat;
			} else if (score2 > score1) {
				standing2.won++;
				standing2.points += pointsSettings.victory;
				standing1.lost++;
				standing1.points += pointsSettings.defeat;
			} else {
				standing1.drawn++;
				standing2.drawn++;
				standing1.points += pointsSettings.draw;
				standing2.points += pointsSettings.draw;
			}
		}

		// Riordina classifiche
		Object.keys(groupStandings).forEach(groupKey => {
			groupStandings[groupKey].sort((a, b) => {
				if (a.points !== b.points) return b.points - a.points;
				if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
				return b.goalsFor - a.goalsFor;
			});
		});

		groupStandings = { ...groupStandings };
		groupMatches = [...groupMatches];
	}

	function removeOldResult(match: Match) {
		const standing1 = groupStandings[match.group!].find(s => s.team === match.t1);
		const standing2 = groupStandings[match.group!].find(s => s.team === match.t2);

		if (standing1 && standing2 && match.score1 !== undefined && match.score2 !== undefined) {
			standing1.played--;
			standing2.played--;
			standing1.goalsFor -= match.score1;
			standing1.goalsAgainst -= match.score2;
			standing2.goalsFor -= match.score2;
			standing2.goalsAgainst -= match.score1;
			standing1.goalDifference = standing1.goalsFor - standing1.goalsAgainst;
			standing2.goalDifference = standing2.goalsFor - standing2.goalsAgainst;

			if (match.score1 > match.score2) {
				standing1.won--;
				standing1.points -= pointsSettings.victory;
				standing2.lost--;
				standing2.points -= pointsSettings.defeat;
			} else if (match.score2 > match.score1) {
				standing2.won--;
				standing2.points -= pointsSettings.victory;
				standing1.lost--;
				standing1.points -= pointsSettings.defeat;
			} else {
				standing1.drawn--;
				standing2.drawn--;
				standing1.points -= pointsSettings.draw;
				standing2.points -= pointsSettings.draw;
			}
		}
	}

	function startKnockoutPhase() {
		knockoutMatches = [];
		
		// Per ogni categoria, crea fase eliminazione diretta
		categories.forEach(category => {
			const categoryGroups = Object.entries(groupStandings).filter(([groupKey, _]) => groupKey.startsWith(category));
			
			// Prendi le prime 2 di ogni girone per questa categoria
			qualifiedTeams[category] = [];
			categoryGroups.forEach(([_, standings]) => {
				qualifiedTeams[category].push(...standings.slice(0, 2).map(s => s.team));
			});

			if (qualifiedTeams[category].length < 2) return;

			// Crea eliminazione diretta per questa categoria
			const shuffled = [...qualifiedTeams[category]].sort(() => Math.random() - 0.5);
			let round = 1;
			let current = [];

			for (let i = 0; i < shuffled.length; i += 2) {
				current.push({
					id: `${category}-ko-${round}-${i / 2}`,
					t1: shuffled[i],
					t2: shuffled[i + 1] || null,
					w: shuffled[i + 1] ? null : shuffled[i],
					round,
					phase: 'knockout' as const,
					category: category
				});
			}
			knockoutMatches = [...knockoutMatches, ...current];

			while (current.length > 1) {
				round++;
				const next = [];
				for (let i = 0; i < current.length; i += 2) {
					next.push({ 
						id: `${category}-ko-${round}-${i / 2}`, 
						t1: null, 
						t2: null, 
						w: null, 
						round, 
						phase: 'knockout' as const,
						category: category
					});
				}
				knockoutMatches = [...knockoutMatches, ...next];
				current = next;
			}
		});

		currentPhase = 'knockout';
	}

	function setKnockoutWinner(id: string, w: Team) {
		knockoutMatches = knockoutMatches.map(m => m.id === id ? { ...m, w } : m);

		const match = knockoutMatches.find(m => m.id === id);
		if (!match) return;

		const nextRound = knockoutMatches.filter(m => m.round === match.round! + 1 && m.category === match.category);
		const matchIndex = parseInt(match.id.split('-')[3]);
		const nextMatch = nextRound[Math.floor(matchIndex / 2)];

		if (nextMatch) {
			knockoutMatches = knockoutMatches.map(m => {
				if (m.id === nextMatch.id) {
					return matchIndex % 2 === 0
						? { ...m, t1: w }
						: { ...m, t2: w };
				}
				return m;
			});
		}

		// Controlla se è la finale di questa categoria
		const categoryMatches = knockoutMatches.filter(m => m.category === match.category);
		const final = categoryMatches.find(m => m.round === Math.max(...categoryMatches.map(m => m.round!)));
		if (final?.w) {
			winner[match.category!] = final.w;
		}

		// Controlla se tutti i tornei sono finiti
		const allFinished = categories.every(cat => winner[cat] !== null);
		if (allFinished && categories.length > 0) {
			currentPhase = 'finished';
		}
	}

	function reset() {
		groupMatches = [];
		knockoutMatches = [];
		groupStandings = {};
		groups = {};
		currentPhase = 'setup';
		winner = {};
		qualifiedTeams = {};
		pointsSettings = { victory: 3, draw: 1, defeat: 0 };
	}

	$: knockoutRounds = [...new Set(knockoutMatches.map(m => m.round))].sort();
	$: allGroupMatchesPlayed = groupMatches.length > 0 && groupMatches.every(m => m.score1 !== undefined && m.score2 !== undefined);
	$: teamsByCategory = teams.reduce((acc, team) => {
		if (!acc[team.category]) acc[team.category] = [];
		acc[team.category].push(team);
		return acc;
	}, {} as { [key: string]: Team[] });
</script>

<svelte:head>
	<title>Torneo con Gironi per Categoria</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
	<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet" />
</svelte:head>

<div class="container-fluid py-4">
	<div class="row justify-content-center">
		<div class="col-12 col-xl-10">
			<!-- Header -->
			<div class="text-center mb-5">
				<h1 class="display-4 fw-bold text-primary mb-3">
					<i class="bi bi-trophy-fill"></i> Torneo Multi-Categoria
				</h1>
				<p class="lead text-muted">Sistema completo con gironi e eliminazione diretta</p>
			</div>

			{#if currentPhase === 'setup'}
				<!-- FASE SETUP -->
				<div class="row">
					<div class="col-12">
						<div class="card shadow-sm">
							<div class="card-header bg-primary text-white">
								<h3 class="card-title mb-0">
									<i class="bi bi-people-fill"></i> Squadre Registrate per Categoria
								</h3>
							</div>
							<div class="card-body">
								{#if teams.length === 0}
									<div class="text-center py-5">
										<i class="bi bi-exclamation-triangle display-1 text-warning"></i>
										<h4 class="mt-3">Nessuna squadra registrata</h4>
										<p class="text-muted">Registra almeno 4 squadre per iniziare il torneo</p>
									</div>
								{:else}
									<div class="row">
										{#each Object.entries(teamsByCategory) as [category, categoryTeams]}
											<div class="col-lg-6 mb-4">
												<div class="card h-100 border-start border-4 {categoryTeams.length >= 4 ? 'border-success' : 'border-warning'}">
													<div class="card-header d-flex justify-content-between align-items-center">
														<h5 class="mb-0">
															<i class="bi bi-award-fill"></i> {category}
														</h5>
														<span class="badge {categoryTeams.length >= 4 ? 'bg-success' : 'bg-warning'} fs-6">
															{categoryTeams.length} squadre
														</span>
													</div>
													<div class="card-body">
														{#if categoryTeams.length < 4}
															<div class="alert alert-warning" role="alert">
																<i class="bi bi-info-circle-fill"></i>
																Servono almeno 4 squadre per questa categoria
															</div>
														{:else}
															<div class="alert alert-success" role="alert">
																<i class="bi bi-check-circle-fill"></i>
																Categoria pronta per i gironi
															</div>
														{/if}
														
														<div class="row g-2">
															{#each categoryTeams as team}
																<div class="col-md-6">
																	<div class="card border-0 bg-light">
																		<div class="card-body p-2">
																			<h6 class="card-title mb-1 text-truncate">{team.teamName}</h6>
																			<small class="text-muted">
																				<i class="bi bi-person-fill"></i> {team.coachName}
																			</small>
																		</div>
																	</div>
																</div>
															{/each}
														</div>
													</div>
												</div>
											</div>
										{/each}
									</div>
									
									<div class="text-center mt-4">
										<button class="btn btn-primary btn-lg px-5" on:click={goToPointsConfig}>
											<i class="bi bi-gear-fill"></i> Configura Torneo
										</button>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>

			{:else if currentPhase === 'points-config'}
				<!-- FASE CONFIGURAZIONE PUNTI -->
				<div class="row justify-content-center">
					<div class="col-lg-8">
						<div class="card shadow-sm">
							<div class="card-header bg-success text-white">
								<h3 class="card-title mb-0">
									<i class="bi bi-calculator-fill"></i> Configurazione Sistema Punti
								</h3>
							</div>
							<div class="card-body">
								<div class="alert alert-info" role="alert">
									<i class="bi bi-lightbulb-fill"></i>
									<strong>Personalizza il sistema di punteggio</strong><br>
									Esempi: Calcio (3-1-0), Hockey (2-1-0), o crea il tuo sistema!
								</div>
								
								<div class="row g-4">
									<div class="col-md-4">
										<div class="card border-success">
											<div class="card-body text-center">
												<i class="bi bi-trophy-fill display-6 text-success"></i>
												<h5 class="card-title mt-2">Vittoria</h5>
												<div class="input-group input-group-lg">
													<input type="number" class="form-control text-center fw-bold" 
														   bind:value={pointsSettings.victory} min="0">
													<span class="input-group-text">punti</span>
												</div>
											</div>
										</div>
									</div>
									<div class="col-md-4">
										<div class="card border-warning">
											<div class="card-body text-center">
												<i class="bi bi-dash-circle-fill display-6 text-warning"></i>
												<h5 class="card-title mt-2">Pareggio</h5>
												<div class="input-group input-group-lg">
													<input type="number" class="form-control text-center fw-bold" 
														   bind:value={pointsSettings.draw} min="0">
													<span class="input-group-text">punti</span>
												</div>
											</div>
										</div>
									</div>
									<div class="col-md-4">
										<div class="card border-danger">
											<div class="card-body text-center">
												<i class="bi bi-x-circle-fill display-6 text-danger"></i>
												<h5 class="card-title mt-2">Sconfitta</h5>
												<div class="input-group input-group-lg">
													<input type="number" class="form-control text-center fw-bold" 
														   bind:value={pointsSettings.defeat} min="0">
													<span class="input-group-text">punti</span>
												</div>
											</div>
										</div>
									</div>
								</div>
								
								<div class="d-flex justify-content-center gap-3 mt-4">
									<button class="btn btn-secondary btn-lg" on:click={() => currentPhase = 'setup'}>
										<i class="bi bi-arrow-left"></i> Indietro
									</button>
									<button class="btn btn-primary btn-lg px-5" on:click={createGroups}>
										<i class="bi bi-play-fill"></i> Crea Gironi e Inizia
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

			{:else if currentPhase === 'group'}
				<!-- FASE GIRONI -->
				<div class="mb-4">
					<div class="alert alert-primary" role="alert">
						<div class="d-flex align-items-center">
							<i class="bi bi-info-circle-fill fs-4 me-3"></i>
							<div>
								<strong>Sistema Punti Attivo:</strong>
								<span class="badge bg-success ms-2">Vittoria: {pointsSettings.victory}</span>
								<span class="badge bg-warning ms-2">Pareggio: {pointsSettings.draw}</span>
								<span class="badge bg-danger ms-2">Sconfitta: {pointsSettings.defeat}</span>
							</div>
						</div>
					</div>
					
					{#each categories as category}
						{#if Object.keys(groups).some(key => key.startsWith(category))}
							<div class="mb-5">
								<div class="card shadow-sm">
									<div class="card-header bg-gradient" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
										<h3 class="text-white mb-0">
											<i class="bi bi-award-fill"></i> Categoria: {category}
										</h3>
									</div>
									<div class="card-body">
										<div class="row">
											{#each Object.entries(groups).filter(([key, _]) => key.startsWith(category)) as [groupKey, groupTeams]}
												<div class="col-xl-6 mb-4">
													<div class="card border-primary">
														<div class="card-header bg-primary text-white">
															<h5 class="card-title mb-0">
																<i class="bi bi-diagram-3-fill"></i> Girone {groupKey.split('-')[1]}
															</h5>
														</div>
														<div class="card-body">
															<!-- Partite -->
															<div class="mb-4">
																<h6 class="text-primary">
																	<i class="bi bi-calendar-event"></i> Partite
																</h6>
																{#each groupMatches.filter(m => m.group === groupKey) as match}
																	<div class="card mb-2 border-light">
																		<div class="card-body p-3">
																			<div class="row align-items-center">
																				<div class="col-4">
																					<div class="text-end fw-semibold">
																						{match.t1?.teamName}
																					</div>
																				</div>
																				<div class="col-4 text-center">
																					{#if match.score1 !== undefined && match.score2 !== undefined}
																						<div class="badge bg-primary fs-6 mb-2">
																							{match.score1} - {match.score2}
																						</div>
																						<div>
																							<button class="btn btn-outline-warning btn-sm" 
																								on:click={() => {match.score1 = undefined; match.score2 = undefined; removeOldResult(match); groupMatches = [...groupMatches];}}>
																								<i class="bi bi-pencil"></i> Modifica
																							</button>
																						</div>
																					{:else}
																						<div class="input-group input-group-sm mb-2">
																							<input type="number" class="form-control text-center" 
																								bind:value={match.score1} min="0" placeholder="0">
																							<span class="input-group-text">-</span>
																							<input type="number" class="form-control text-center" 
																								bind:value={match.score2} min="0" placeholder="0">
																						</div>
																						<button class="btn btn-primary btn-sm"
																							on:click={() => setGroupResult(match.id, match.score1 || 0, match.score2 || 0)}>
																							<i class="bi bi-check-lg"></i> Conferma
																						</button>
																					{/if}
																				</div>
																				<div class="col-4">
																					<div class="fw-semibold">
																						{match.t2?.teamName}
																					</div>
																				</div>
																			</div>
																		</div>
																	</div>
																{/each}
															</div>

															<!-- Classifica -->
															<div>
																<h6 class="text-success">
																	<i class="bi bi-list-ol"></i> Classifica
																</h6>
																<div class="table-responsive">
																	<table class="table table-sm table-hover">
																		<thead class="table-dark">
																			<tr>
																				<th width="5%">Pos</th>
																				<th>Squadra</th>
																				<th width="8%">P</th>
																				<th width="8%">V</th>
																				<th width="8%">N</th>
																				<th width="8%">S</th>
																				<th width="8%">GF</th>
																				<th width="8%">GS</th>
																				<th width="8%">DR</th>
																				<th width="10%">Punti</th>
																			</tr>
																		</thead>
																		<tbody>
																			{#each groupStandings[groupKey] || [] as standing, index}
																				<tr class="{index < 2 ? 'table-success' : ''}">
																					<td class="fw-bold">
																						{#if index < 2}
																							<i class="bi bi-arrow-up-circle-fill text-success"></i>
																						{/if}
																						{index + 1}
																					</td>
																					<td class="fw-semibold">{standing.team.teamName}</td>
																					<td>{standing.played}</td>
																					<td>{standing.won}</td>
																					<td>{standing.drawn}</td>
																					<td>{standing.lost}</td>
																					<td>{standing.goalsFor}</td>
																					<td>{standing.goalsAgainst}</td>
																					<td>
																						<span class="badge {standing.goalDifference > 0 ? 'bg-success' : standing.goalDifference < 0 ? 'bg-danger' : 'bg-secondary'}">
																							{standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
																						</span>
																					</td>
																					<td>
																						<span class="badge bg-primary fs-6">{standing.points}</span>
																					</td>
																				</tr>
																			{/each}
																		</tbody>
																	</table>
																</div>
																<small class="text-muted">
																	<i class="bi bi-info-circle"></i> Le prime 2 squadre si qualificano per la fase eliminatoria
																</small>
															</div>
														</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								</div>
							</div>
						{/if}
					{/each}

					{#if allGroupMatchesPlayed}
						<div class="text-center">
							<div class="card bg-success text-white shadow-lg">
								<div class="card-body">
									<h4 class="card-title">
										<i class="bi bi-check-circle-fill"></i> Fase a Gironi Completata!
									</h4>
									<p class="card-text">Tutte le partite sono state giocate. Procedi alla fase eliminatoria.</p>
									<button class="btn btn-light btn-lg px-5" on:click={startKnockoutPhase}>
										<i class="bi bi-lightning-fill"></i> Inizia Eliminazione Diretta
									</button>
								</div>
							</div>
						</div>
					{/if}
				</div>

			{:else if currentPhase === 'knockout'}
				<!-- FASE KNOCKOUT -->
				<div class="mb-4">
					{#each categories as category}
						{#if qualifiedTeams[category] && qualifiedTeams[category].length > 0}
							<div class="mb-5">
								<div class="card shadow-sm">
									<div class="card-header bg-gradient" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
										<h3 class="text-white mb-0">
											<i class="bi bi-lightning-fill"></i> Eliminazione Diretta - {category}
										</h3>
									</div>
									<div class="card-body">
										<div class="alert alert-info mb-4" role="alert">
											<i class="bi bi-people-fill"></i>
											<strong>Squadre Qualificate:</strong> 
											{qualifiedTeams[category].map(t => t.teamName).join(', ')}
										</div>

										{#if winner[category]}
											<div class="alert alert-warning text-center mb-4" role="alert">