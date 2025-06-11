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

	const tournamentStore = writable({
		teams: [],
		groupMatches: [],
		groupStandings: {},
		groups: {},
		categories: [],
		groupsByCategory: {},
		currentPhase: 'setup'
	});

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
		const interval = setInterval(() => {
			loadTournamentData(true);
		}, 30000);
		return () => clearInterval(interval);
	});

	async function loadTournamentData(isAutoRefresh = false) {
		try {
			if (!isAutoRefresh) {
				isLoading = true;
			}
			error = '';

			const savedData = localStorage.getItem('volley-s3-tournament');
			if (savedData) {
				const tournamentData = JSON.parse(savedData);
				
				teams = tournamentData.teams || [];
				groupMatches = tournamentData.groupMatches || [];
				groups = tournamentData.groups || {};
				groupsByCategory = tournamentData.groupsByCategory || {};
				categories = tournamentData.categories || [];
				
				recalculateAllStandings();
				lastUpdateTime = new Date().toLocaleTimeString('it-IT');
			} else {
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
		return `Vittoria a ${baseScore} punti • Vantaggio minimo: ${advantage} punti oltre il ${baseScore}°`;
	}

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
					
					let winner1 = false;
					if (minScore < baseScore) {
						winner1 = match.score1 > match.score2;
					} else {
						if (scoreDiff >= requiredAdvantage) {
							winner1 = match.score1 > match.score2;
						} else {
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

	function recalculateAllStandings() {
		Object.keys(groups).forEach(groupName => {
			recalculateGroupStanding(groupName);
		});
		groupStandings = { ...groupStandings };
	}

	function refreshStandings() {
		loadTournamentData();
	}

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

	function printStandings() {
		window.print();
	}
</script>

<svelte:head>
	<title>Tournament Standings | Volley S3 Championship</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
	<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="tournament-container">
	<header class="bg-dark text-white py-4 shadow-lg">
		<div class="container">
			<div class="row align-items-center">
				<div class="col-lg-8">
					<h1 class="display-5 fw-bold mb-2">
						<span class="me-3">🏆</span>
						Tournament Standings
					</h1>
					<p class="lead mb-2">Volley S3 Championship • Group Phase</p>
					{#if lastUpdateTime}
						<small class="text-white-50">
							<span class="badge bg-success me-2">Live</span>
							Last updated: {lastUpdateTime} • Auto-refresh every 30s
						</small>
					{/if}
				</div>
				<div class="col-lg-4 text-lg-end mt-3 mt-lg-0">
					<div class="btn-group" role="group">
						<button class="btn btn-light" on:click={refreshStandings}>
							<i class="bi bi-arrow-clockwise me-1"></i>
							Refresh
						</button>
						<button class="btn btn-outline-light" on:click={exportStandings}>
							<i class="bi bi-download me-1"></i>
							Export
						</button>
						<button class="btn btn-outline-light" on:click={printStandings}>
							<i class="bi bi-printer me-1"></i>
							Print
						</button>
					</div>
				</div>
			</div>
		</div>
	</header>

	<main class="py-5">
		<div class="container">
			{#if isLoading}
				<div class="row justify-content-center">
					<div class="col-md-6">
						<div class="card text-center py-5">
							<div class="card-body">
								<div class="spinner-border text-primary mb-3" role="status">
									<span class="visually-hidden">Loading...</span>
								</div>
								<h3 class="card-title">Loading Tournament Data</h3>
								<p class="card-text text-muted">Please wait while we fetch the latest standings...</p>
							</div>
						</div>
					</div>
				</div>
			{:else if error}
				<div class="row justify-content-center">
					<div class="col-md-6">
						<div class="card text-center py-5">
							<div class="card-body">
								<div class="text-warning mb-3">
									<i class="bi bi-exclamation-triangle" style="font-size: 3rem;"></i>
								</div>
								<h3 class="card-title">Unable to Load Data</h3>
								<p class="card-text text-muted">{error}</p>
								<button class="btn btn-primary" on:click={refreshStandings}>
									<i class="bi bi-arrow-clockwise me-1"></i>
									Retry
								</button>
							</div>
						</div>
					</div>
				</div>
			{:else if Object.keys(groupStandings).length === 0}
				<div class="row justify-content-center">
					<div class="col-md-6">
						<div class="card text-center py-5">
							<div class="card-body">
								<div class="text-info mb-3">
									<i class="bi bi-bar-chart" style="font-size: 3rem;"></i>
								</div>
								<h3 class="card-title">No Standings Available</h3>
								<p class="card-text text-muted">Tournament groups have not been created yet or no match data is available.</p>
								<button class="btn btn-primary" on:click={refreshStandings}>
									<i class="bi bi-arrow-clockwise me-1"></i>
									Check Again
								</button>
							</div>
						</div>
					</div>
				</div>
			{:else}
				{#each categories as category}
					<div class="mb-5">
						<div class="card mb-4">
							<div class="card-header bg-primary text-white">
								<div class="row align-items-center">
									<div class="col">
										<h2 class="card-title mb-1">{category}</h2>
										<p class="card-text mb-0 opacity-75">{getCategoryRules(category)}</p>
									</div>
									<div class="col-auto">
										<span class="badge bg-light text-dark">{(groupsByCategory[category] || []).length} Groups</span>
									</div>
								</div>
							</div>
						</div>

						<div class="row">
							{#each groupsByCategory[category] || [] as groupName}
								{@const standings = groupStandings[groupName] || []}
								<div class="col-lg-6 col-xl-4 mb-4">
									<div class="card h-100 shadow-sm">
										<div class="card-header bg-info text-white">
											<div class="d-flex justify-content-between align-items-center">
												<h5 class="card-title mb-0">{groupName.split('_').slice(1).join(' ')}</h5>
												<span class="badge bg-light text-dark">{standings.length} Teams</span>
											</div>
										</div>
										
										<div class="card-body p-0">
											{#if standings.length > 0}
												<div class="table-responsive">
													<table class="table table-hover mb-0">
														<thead class="table-light">
															<tr>
																<th style="width: 60px;">Pos</th>
																<th>Team</th>
																<th class="text-center" style="width: 50px;">MP</th>
																<th class="text-center" style="width: 50px;">W</th>
																<th class="text-center" style="width: 50px;">D</th>
																<th class="text-center" style="width: 50px;">L</th>
																<th class="text-center" style="width: 60px;">Pts</th>
															</tr>
														</thead>
														<tbody>
															{#each standings as standing, i}
																<tr class="{i < 2 ? 'table-success' : ''} {standing.played === 0 ? 'opacity-50' : ''}">
																	<td>
																		<div class="d-flex align-items-center">
																			<span class="badge {i === 0 ? 'bg-warning' : i === 1 ? 'bg-secondary' : 'bg-light text-dark'} me-2">
																				{i + 1}
																			</span>
																			{#if i < 2}
																				<span class="text-success">
																					<i class="bi bi-arrow-up-right"></i>
																				</span>
																			{/if}
																		</div>
																	</td>
																	<td>
																		<div>
																			<div class="fw-semibold">{standing.team.teamName}</div>
																			<small class="text-muted">{standing.team.coachName}</small>
																		</div>
																	</td>
																	<td class="text-center">{standing.played}</td>
																	<td class="text-center text-success fw-bold">{standing.won}</td>
																	<td class="text-center text-warning fw-bold">{standing.drawn}</td>
																	<td class="text-center text-danger fw-bold">{standing.lost}</td>
																	<td class="text-center">
																		<span class="badge bg-primary fs-6">{standing.points}</span>
																	</td>
																</tr>
															{/each}
														</tbody>
													</table>
												</div>
											{:else}
												<div class="text-center py-5">
													<div class="text-muted mb-3">
														<i class="bi bi-hourglass-split" style="font-size: 2rem;"></i>
													</div>
													<p class="text-muted mb-0">No match data available</p>
												</div>
											{/if}
										</div>
										
										<div class="card-footer bg-light">
											<small class="text-muted">
												<span class="badge bg-success me-2"></span>
												Top 2 teams qualify for knockout phase
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
	</main>
</div>

<style>
	:global(body) {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		min-height: 100vh;
	}

	.tournament-container {
		min-height: 100vh;
	}

	.card {
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
	}

	.table-responsive {
		border-radius: 0;
	}

	.table th {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-bottom: 2px solid #dee2e6;
	}

	.table td {
		vertical-align: middle;
		font-size: 0.875rem;
	}

	.badge {
		font-size: 0.75rem;
	}

	.spinner-border {
		width: 3rem;
		height: 3rem;
	}

	@media (max-width: 768px) {
		.display-5 {
			font-size: 1.75rem;
		}
		
		.btn-group {
			width: 100%;
		}
		
		.btn-group .btn {
			font-size: 0.875rem;
		}
		
		.table {
			font-size: 0.8rem;
		}
		
		.table th, .table td {
			padding: 0.5rem 0.25rem;
		}
	}

	@media print {
		.btn, .card-footer {
			display: none !important;
		}
		
		.card {
			break-inside: avoid;
			box-shadow: none !important;
			border: 1px solid #dee2e6 !important;
		}
	}
</style>