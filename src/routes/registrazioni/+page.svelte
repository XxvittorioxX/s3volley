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

	// State per le classifiche
	let teams: Team[] = [];
	let groupMatches: Match[] = [];
	let groupStandings: { [key: string]: GroupStanding[] } = {};
	let groups: { [key: string]: Team[] } = {};
	let categories: string[] = [];
	let groupsByCategory: { [category: string]: string[] } = {};

	onMount(() => {
		teams = get(registeredTeams);
		categories = [...new Set(teams.map(t => t.category))];
		// Qui dovresti caricare i dati salvati dei gironi e delle partite
		// Per ora simulo alcuni dati di esempio
		loadSavedTournamentData();
	});

	// Funzione per caricare i dati del torneo salvati
	function loadSavedTournamentData() {
		// Questa funzione dovrebbe caricare i dati reali dal tuo sistema di storage
		// Per ora creo dati di esempio per dimostrare come funziona
		
		// Esempio di struttura dati che dovresti avere dal torneo principale
		if (teams.length > 0) {
			createExampleGroupData();
		}
	}

	// Funzione di esempio - sostituisci con il caricamento dei dati reali
	function createExampleGroupData() {
		const teamsByCategory: { [category: string]: Team[] } = {};
		teams.forEach(team => {
			if (!teamsByCategory[team.category]) teamsByCategory[team.category] = [];
			teamsByCategory[team.category].push(team);
		});

		groups = {};
		groupsByCategory = {};
		groupStandings = {};

		Object.entries(teamsByCategory).forEach(([category, categoryTeams]) => {
			if (categoryTeams.length >= 3) {
				const shuffled = [...categoryTeams].sort(() => Math.random() - 0.5);
				let numGroups = shuffled.length > 5 ? Math.ceil(shuffled.length / 4) : 1;
				groupsByCategory[category] = [];

				for (let g = 0; g < numGroups; g++) {
					const groupName = `${category}_Girone_${String.fromCharCode(65 + g)}`;
					groupsByCategory[category].push(groupName);
					
					const groupTeams = [];
					for (let i = g; i < shuffled.length; i += numGroups) {
						groupTeams.push(shuffled[i]);
					}
					
					groups[groupName] = groupTeams;

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
				}
			}
		});

		groupStandings = { ...groupStandings };
	}

	// Scoring rules per le diverse categorie
	function getAdvantageForCategory(category: string): number {
		const advantages: { [key: string]: number } = {
			'S1': 2, 'S2': 1, 'S3': 2, 'Under12': 2, 'Seniores': 2
		};
		return advantages[category] || 2;
	}

	function getBaseScoreForCategory(category: string): number {
		const baseScores: { [key: string]: number } = {
			'S1': 10, 'S2': 11, 'S3': 10, 'Under12': 10, 'Seniores': 10
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

		const groupMatchesPlayed = groupMatches.filter(m => 
			m.group === groupName && m.score1 !== undefined && m.score2 !== undefined
		);

		groupMatchesPlayed.forEach(match => {
			const standing1 = groupStandings[groupName].find(s => s.team === match.t1);
			const standing2 = groupStandings[groupName].find(s => s.team === match.t2);

			if (standing1 && standing2 && match.score1 !== undefined && match.score2 !== undefined) {
				standing1.played++;
				standing2.played++;
				standing1.goalsFor += match.score1;
				standing1.goalsAgainst += match.score2;
				standing2.goalsFor += match.score2;
				standing2.goalsAgainst += match.score1;

				const category = match.category || '';
				const requiredAdvantage = getAdvantageForCategory(category);
				const scoreDiff = Math.abs(match.score1 - match.score2);

				if (match.score1 !== match.score2) {
					if (scoreDiff >= requiredAdvantage) {
						if (match.score1 > match.score2) {
							standing1.won++;
							standing1.points += 3;
							standing2.lost++;
						} else {
							standing2.won++;
							standing2.points += 3;
							standing1.lost++;
						}
					} else {
						const minScore = Math.min(match.score1, match.score2);
						const baseScore = getBaseScoreForCategory(category);
						
						if (minScore < baseScore) {
							if (match.score1 > match.score2) {
								standing1.won++;
								standing1.points += 3;
								standing2.lost++;
							} else {
								standing2.won++;
								standing2.points += 3;
								standing1.lost++;
							}
						}
					}
				} else {
					standing1.drawn++;
					standing2.drawn++;
					standing1.points += 1;
					standing2.points += 1;
				}

				standing1.goalDifference = standing1.goalsFor - standing1.goalsAgainst;
				standing2.goalDifference = standing2.goalsFor - standing2.goalsAgainst;
			}
		});

		groupStandings[groupName].sort((a, b) => {
			if (b.points !== a.points) return b.points - a.points;
			if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
			if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
			return a.team.teamName.localeCompare(b.team.teamName);
		});
	}

	// Funzione per refreshare i dati
	function refreshStandings() {
		Object.keys(groups).forEach(groupName => {
			recalculateGroupStanding(groupName);
		});
		groupStandings = { ...groupStandings };
	}

	// Auto-refresh ogni 30 secondi
	onMount(() => {
		const interval = setInterval(refreshStandings, 30000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Classifiche Gironi - Torneo Volley S3</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
	<meta http-equiv="refresh" content="60" />
</svelte:head>

<div class="container-fluid my-4">
	<div class="row">
		<div class="col-12">
			<div class="d-flex justify-content-between align-items-center mb-4">
				<h1 class="text-center text-primary">🏐 Classifiche Gironi - Torneo Volley S3</h1>
				<div>
					<button class="btn btn-outline-primary btn-sm" on:click={refreshStandings}>
						🔄 Aggiorna
					</button>
					<small class="text-muted ms-2">Aggiornamento automatico ogni 30s</small>
				</div>
			</div>

			{#if Object.keys(groupStandings).length === 0}
				<div class="alert alert-info text-center">
					<h4>📋 Nessuna classifica disponibile</h4>
					<p>I gironi non sono ancora stati creati o non ci sono dati disponibili.</p>
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
												📊 {groupName.split('_').slice(1).join(' ')}
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
																<th style="width: 40px;">P</th>
																<th style="width: 40px;">V</th>
																<th style="width: 40px;">N</th>
																<th style="width: 40px;">S</th>
																<th style="width: 60px;">Pt+</th>
																<th style="width: 60px;">Pt-</th>
																<th style="width: 60px;">Dif</th>
																<th style="width: 50px;" class="fw-bold">Pti</th>
															</tr>
														</thead>
														<tbody>
															{#each standings as standing, i}
																<tr class="text-center {i < 2 ? 'table-success' : ''} {standing.played === 0 ? 'table-light' : ''}">
																	<td class="fw-bold">
																		{i + 1}
																		{#if i < 2}
																			<span class="text-success">✓</span>
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
													<i>Nessun dato disponibile</i>
												</div>
											{/if}
										</div>
										<div class="card-footer bg-light text-center">
											<small class="text-muted">
												✅ Le prime 2 si qualificano
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
	}
</style>