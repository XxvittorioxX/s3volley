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
	}

	interface CategoryRules {
		maxScore: number;
		minAdvantage: number;
		description: string;
	}

	const categoryRules: { [key: string]: CategoryRules } = {
		'S1': { maxScore: 8, minAdvantage: 1, description: 'Set a 15 punti' },
		'S2': { maxScore: 10, minAdvantage: 1, description: 'Set a 15 punti' },
		'S3': { maxScore: 15, minAdvantage: 2, description: 'Set a 15 punti (vantaggio 2)' },
		'Under12': { maxScore: 15, minAdvantage: 2, description: 'Set a 15 punti (vantaggio 2)' },
		'Seniores': { maxScore: 25, minAdvantage: 2, description: 'Set a 25 punti (vantaggio 2)' }
	};

	let teams: Team[] = [];
	let groupMatches: Match[] = [];
	let knockoutMatches: Match[] = [];
	let groupStandings: { [key: string]: GroupStanding[] } = {};
	let groups: { [key: string]: Team[] } = {};
	let currentPhase: 'setup' | 'group' | 'knockout' | 'finished' = 'setup';
	let winner: { [category: string]: Team | null } = {};
	let qualifiedTeams: { [category: string]: Team[] } = {};
	let categories: string[] = [];
	let groupsByCategory: { [category: string]: string[] } = {};
	let tempScores: { [key: string]: { score1: number, score2: number } } = {};

	onMount(() => {
		teams = get(registeredTeams);
		categories = [...new Set(teams.map(t => t.category))];
	});

	function initTempScore(matchId: string) {
		if (!tempScores[matchId]) {
			tempScores[matchId] = { score1: 0, score2: 0 };
		}
	}

	function getCategoryRules(category: string): CategoryRules {
		return categoryRules[category] || { maxScore: 25, minAdvantage: 2, description: 'Set a 25 punti (vantaggio 2)' };
	}

	function isValidScore(score1: number, score2: number, category: string): boolean {
		const rules = getCategoryRules(category);
		const maxScore = Math.max(score1, score2);
		const scoreDiff = Math.abs(score1 - score2);

		if (maxScore < rules.maxScore) return false;
		if (maxScore === rules.maxScore) return scoreDiff >= rules.minAdvantage;
		if (maxScore > rules.maxScore) return scoreDiff === rules.minAdvantage;
		return false;
	}

	function createGroups() {
		if (teams.length < 3) {
			alert('Servono almeno 3 squadre per i gironi!');
			return;
		}

		const teamsByCategory: { [category: string]: Team[] } = {};
		teams.forEach(team => {
			if (!teamsByCategory[team.category]) teamsByCategory[team.category] = [];
			teamsByCategory[team.category].push(team);
		});

		for (const [category, categoryTeams] of Object.entries(teamsByCategory)) {
			if (categoryTeams.length < 3) {
				alert(`La categoria ${category} ha solo ${categoryTeams.length} squadra/e. Servono almeno 3 squadre per categoria!`);
				return;
			}
		}

		groups = {};
		groupMatches = [];
		groupStandings = {};
		groupsByCategory = {};
		tempScores = {};

		Object.entries(teamsByCategory).forEach(([category, categoryTeams]) => {
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

				for (let i = 0; i < groupTeams.length; i++) {
					for (let j = i + 1; j < groupTeams.length; j++) {
						const matchId = `${groupName}-${i}-${j}`;
						groupMatches.push({
							id: matchId,
							t1: groupTeams[i],
							t2: groupTeams[j],
							w: null,
							score1: undefined,
							score2: undefined,
							group: groupName,
							phase: 'group',
							category: category
						});
						initTempScore(matchId);
					}
				}

				groupStandings[groupName] = groupTeams.map(team => ({
					team, played: 0, won: 0, drawn: 0, lost: 0, points: 0
				}));
			}
		});

		groupStandings = { ...groupStandings };
		currentPhase = 'group';
	}

	function recalculateGroupStanding(groupName: string) {
		const groupTeams = groups[groupName];
		if (!groupTeams) return;

		groupStandings[groupName] = groupTeams.map(team => ({
			team, played: 0, won: 0, drawn: 0, lost: 0, points: 0
		}));

		const groupMatchesPlayed = groupMatches.filter(m => 
			m.group === groupName && m.score1 !== undefined && m.score2 !== undefined
		);

		groupMatchesPlayed.forEach(match => {
			const standing1 = groupStandings[groupName].find(s => s.team === match.t1);
			const standing2 = groupStandings[groupName].find(s => s.team === match.t2);

			if (standing1 && standing2) {
				standing1.played++;
				standing2.played++;

				if (match.score1! > match.score2!) {
					standing1.won++;
					standing1.points += 3;
					standing2.lost++;
				} else if (match.score2! > match.score1!) {
					standing2.won++;
					standing2.points += 3;
					standing1.lost++;
				} else {
					standing1.drawn++;
					standing2.drawn++;
					standing1.points += 1;
					standing2.points += 1;
				}
			}
		});

		groupStandings[groupName].sort((a, b) => {
			if (b.points !== a.points) return b.points - a.points;
			return a.team.teamName.localeCompare(b.team.teamName);
		});
	}

	function setGroupResult(matchId: string, score1: number, score2: number) {
		const match = groupMatches.find(m => m.id === matchId);
		if (!match || !match.t1 || !match.t2 || !match.group || !match.category) return;

		if (!isValidScore(score1, score2, match.category)) {
			const rules = getCategoryRules(match.category);
			alert(`Punteggio non valido per la categoria ${match.category}!\n${rules.description}\nIl punteggio deve raggiungere almeno ${rules.maxScore} punti con un vantaggio minimo di ${rules.minAdvantage} punti.`);
			return;
		}

		match.score1 = score1;
		match.score2 = score2;
		match.w = score1 > score2 ? match.t1 : score1 < score2 ? match.t2 : null;

		recalculateGroupStanding(match.group);
		groupStandings = { ...groupStandings };
		groupMatches = [...groupMatches];
	}

	function resetMatchResult(matchId: string) {
		const match = groupMatches.find(m => m.id === matchId);
		if (!match || !match.group) return;

		match.score1 = undefined;
		match.score2 = undefined;
		match.w = null;
		tempScores[matchId] = { score1: 0, score2: 0 };

		recalculateGroupStanding(match.group);
		groupStandings = { ...groupStandings };
		groupMatches = [...groupMatches];
	}

	function startKnockoutPhase() {
		qualifiedTeams = {};
		
		categories.forEach(category => {
			qualifiedTeams[category] = [];
			groupsByCategory[category].forEach(groupName => {
				const standings = groupStandings[groupName];
				if (standings && standings.length >= 2) {
					const qualified = standings.slice(0, 2).map(s => s.team);
					qualifiedTeams[category] = [...qualifiedTeams[category], ...qualified];
				}
			});

			if (qualifiedTeams[category].length < 2) {
				alert(`Non ci sono abbastanza squadre qualificate per la categoria ${category}!`);
				return;
			}
		});

		knockoutMatches = [];
		
		categories.forEach(category => {
			const categoryQualified = qualifiedTeams[category];
			if (categoryQualified.length < 2) return;

			const firstPlaces: Team[] = [];
			const secondPlaces: Team[] = [];

			groupsByCategory[category].forEach(groupName => {
				const standings = groupStandings[groupName];
				if (standings && standings.length >= 2) {
					firstPlaces.push(standings[0].team);
					secondPlaces.push(standings[1].team);
				}
			});

			const shuffledFirsts = [...firstPlaces].sort(() => Math.random() - 0.5);
			const shuffledSeconds = [...secondPlaces].sort(() => Math.random() - 0.5);

			let round = 1;
			let current: Match[] = [];

			for (let i = 0; i < Math.min(shuffledFirsts.length, shuffledSeconds.length); i++) {
				current.push({
					id: `ko-${category}-${round}-${i}`,
					t1: shuffledFirsts[i],
					t2: shuffledSeconds[i],
					w: null,
					round,
					phase: 'knockout',
					category
				});
			}

			const remaining = categoryQualified.filter(team => 
				!current.some(match => match.t1 === team || match.t2 === team)
			);

			for (let i = 0; i < remaining.length; i += 2) {
				if (remaining[i + 1]) {
					current.push({
						id: `ko-${category}-${round}-${current.length}`,
						t1: remaining[i],
						t2: remaining[i + 1],
						w: null,
						round,
						phase: 'knockout',
						category
					});
				}
			}

			knockoutMatches = [...knockoutMatches, ...current];

			while (current.length > 1) {
				round++;
				const next: Match[] = [];
				for (let i = 0; i < current.length; i += 2) {
					next.push({ 
						id: `ko-${category}-${round}-${i / 2}`, 
						t1: null, 
						t2: null, 
						w: null, 
						round, 
						phase: 'knockout',
						category
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
					return matchIndex % 2 === 0 ? { ...m, t1: w } : { ...m, t2: w };
				}
				return m;
			});
		}

		const categoryMatches = knockoutMatches.filter(m => m.category === match.category);
		const maxRound = Math.max(...categoryMatches.map(m => m.round!));
		const final = categoryMatches.find(m => m.round === maxRound);
		
		if (final?.w) {
			winner[match.category!] = final.w;
		}

		const allCategoriesFinished = categories.every(cat => winner[cat]);
		if (allCategoriesFinished) {
			currentPhase = 'finished';
		}
	}

	function reset() {
		groupMatches = [];
		knockoutMatches = [];
		groupStandings = {};
		groups = {};
		groupsByCategory = {};
		tempScores = {};
		currentPhase = 'setup';
		winner = {};
		qualifiedTeams = {};
	}

	$: knockoutRoundsByCategory = categories.reduce((acc, category) => {
		acc[category] = [...new Set(knockoutMatches.filter(m => m.category === category).map(m => m.round))].sort();
		return acc;
	}, {} as { [key: string]: number[] });

	$: allGroupMatchesPlayed = groupMatches.length > 0 && groupMatches.every(m => m.score1 !== undefined && m.score2 !== undefined);
</script>

<svelte:head>
	<title>Torneo con Categorie - Gironi e Eliminazione Diretta</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
</svelte:head>

<div class="container my-5 p-4 bg-white rounded shadow">
	<h1 class="text-center mb-5">Torneo con Categorie - Gironi e Eliminazione Diretta</h1>

	{#if currentPhase === 'setup'}
		<div class="mb-4">
			<h2>Squadre Registrate per Categoria</h2>
			{#if teams.length === 0}
				<p class="text-muted">Nessuna squadra registrata</p>
			{:else}
				{#each categories as category}
					<div class="card mb-3">
						<div class="card-header d-flex justify-content-between align-items-center">
							<h4 class="mb-0">{category} ({teams.filter(t => t.category === category).length} squadre)</h4>
							<small class="text-muted">{getCategoryRules(category).description}</small>
						</div>
						<div class="card-body">
							<div class="list-group">
								{#each teams.filter(t => t.category === category) as team}
									<div class="list-group-item d-flex justify-content-between align-items-center">
										<div>
											<h6 class="mb-1">{team.teamName}</h6>
											<small class="text-secondary">{team.coachName}</small>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/each}
				<button class="btn btn-primary btn-lg" on:click={createGroups}>Crea Gironi e Inizia Torneo</button>
			{/if}
		</div>

	{:else if currentPhase === 'group'}
		<div class="mb-4">
			<h2>Fase a Gironi</h2>
			
			{#each categories as category}
				<div class="mb-5">
					<div class="d-flex justify-content-between align-items-center mb-4">
						<h3 class="text-primary mb-0">Categoria {category}</h3>
						<div class="badge bg-info fs-6">{getCategoryRules(category).description}</div>
					</div>
					
					{#each groupsByCategory[category] || [] as groupName}
						<div class="row justify-content-center mb-4">
							<div class="col-lg-10">
								<div class="card">
									<div class="card-header">
										<h5>{groupName.split('_').slice(1).join(' ')}</h5>
										<small class="text-muted">
											Squadre: {groups[groupName]?.map(t => t.teamName).join(', ') || ''}
										</small>
									</div>
									<div class="card-body">
										{#each groupMatches.filter(m => m.group === groupName) as match}
											<div class="card mb-2">
												<div class="card-body p-3">
													<div class="row align-items-center">
														<div class="col-3 text-end fw-semibold">{match.t1?.teamName}</div>
														<div class="col-6 text-center">
															{#if match.score1 !== undefined && match.score2 !== undefined}
																<span class="badge bg-primary fs-6">{match.score1} - {match.score2}</span>
																<button class="btn btn-sm btn-outline-secondary ms-2" on:click={() => resetMatchResult(match.id)}>Modifica</button>
															{:else}
																<div class="d-flex justify-content-center align-items-center gap-2">
																	<input type="number" class="form-control form-control-sm text-center" 
																		bind:value={tempScores[match.id].score1} min="0" max="99" style="width: 60px;" placeholder="0">
																	<span>-</span>
																	<input type="number" class="form-control form-control-sm text-center" 
																		bind:value={tempScores[match.id].score2} min="0" max="99" style="width: 60px;" placeholder="0">
																</div>
																<button class="btn btn-sm btn-success mt-2"
																	disabled={tempScores[match.id].score1 === undefined || tempScores[match.id].score2 === undefined}
																	on:click={() => setGroupResult(match.id, tempScores[match.id].score1 || 0, tempScores[match.id].score2 || 0)}>
																	Conferma Risultato
																</button>
																<div class="mt-1">
																	<small class="text-muted">{getCategoryRules(match.category || '').description}</small>
																</div>
															{/if}
														</div>
														<div class="col-3 fw-semibold">{match.t2?.teamName}</div>
													</div>
												</div>
											</div>
										{/each}
										
										<div class="mt-4">
											<h6 class="text-success">Classifica {groupName.split('_').slice(1).join(' ')}</h6>
											<div class="table-responsive">
												<table class="table table-sm table-striped">
													<thead class="table-dark">
														<tr>
															<th>Pos</th><th>Squadra</th><th>P</th><th>V</th><th>N</th><th>S</th><th>Punti</th>
														</tr>
													</thead>
													<tbody>
														{#each groupStandings[groupName] || [] as standing, index}
															<tr class="{index < 2 ? 'table-success' : ''}">
																<td>{index + 1}</td>
																<td>{standing.team.teamName}</td>
																<td>{standing.played}</td>
																<td>{standing.won}</td>
																<td>{standing.drawn}</td>
																<td>{standing.lost}</td>
																<td><strong>{standing.points}</strong></td>
															</tr>
														{/each}
													</tbody>
												</table>
											</div>
											<small class="text-muted">Le prime 2 squadre (evidenziate in verde) si qualificano per la fase eliminatoria</small>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/each}

			{#if allGroupMatchesPlayed}
				<div class="text-center mt-5">
					<button class="btn btn-success btn-lg" on:click={startKnockoutPhase}>🏆 Inizia Fase Eliminazione Diretta</button>
				</div>
			{/if}
		</div>

	{:else if currentPhase === 'knockout'}
		<div class="mb-4">
			<h2>Fase Eliminazione Diretta</h2>

			{#each categories as category}
				<div class="mb-5">
					<div class="d-flex justify-content-between align-items-center mb-3">
						<h3 class="text-primary mb-0">Categoria {category}</h3>
						<div class="badge bg-info fs-6">{getCategoryRules(category).description}</div>
					</div>
					<p class="text-muted mb-4">Squadre qualificate: {qualifiedTeams[category]?.map(t => t.teamName).join(', ') || 'Nessuna'}</p>

					<div class="d-flex flex-wrap gap-4 justify-content-center overflow-auto">
						{#each knockoutRoundsByCategory[category] || [] as round}
							<div class="border rounded p-3" style="min-width: 280px; max-width: 280px;">
								<h4 class="text-center mb-3">
									{round === Math.max(...(knockoutRoundsByCategory[category] || [])) ? '🏆 FINALE' : 
									 round === Math.max(...(knockoutRoundsByCategory[category] || [])) - 1 ? '🥇 SEMIFINALE' :
									 round === Math.max(...(knockoutRoundsByCategory[category] || [])) - 2 ? '🥈 QUARTI' : `TURNO ${round}`}
								</h4>
								{#each knockoutMatches.filter(m => m.round === round && m.category === category) as match}
									<div class="card mb-3">
										<div class="card-body p-2">
											<div class="d-flex flex-column gap-1">
												<div class="p-2 rounded border {match.w === match.t1 ? 'bg-success text-white' : 'bg-light'}">
													<strong>{match.t1?.teamName || 'TBD'}</strong>
												</div>
												<div class="text-center text-muted small">VS</div>
												<div class="p-2 rounded border {match.w === match.t2 ? 'bg-success text-white' : 'bg-light'}">
													<strong>{match.t2?.teamName || 'TBD'}</strong>
												</div>
											</div>

											{#if match.t1 && match.t2 && !match.w}
												<div class="d-flex gap-2 mt-3">
													<button class="btn btn-outline-primary btn-sm flex-grow-1" on:click={() => setKnockoutWinner(match.id, match.t1)}>{match.t1.teamName}</button>
													<button class="btn btn-outline-primary btn-sm flex-grow-1" on:click={() => setKnockoutWinner(match.id, match.t2)}>{match.t2.teamName}</button>
												</div>
											{:else if match.w}
												<div class="mt-3 text-center">
													<span class="badge bg-success fs-6">🎉 Vince: {match.w.teamName}</span>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/each}
					</div>

					{#if winner[category]}
						<div class="alert alert-success text-center mt-4">
							<h4>🏆 VINCITORE CATEGORIA {category.toUpperCase()}: {winner[category]?.teamName}</h4>
						</div>
					{/if}
				</div>
			{/each}
		</div>

	{:else if currentPhase === 'finished'}
		<div class="text-center">
			<h2 class="text-success mb-4">🏆 TORNEO COMPLETATO! 🏆</h2>
			
			<div class="row justify-content-center">
				<div class="col-md-8">
					<div class="card">
						<div class="card-header bg-success text-white">
							<h3 class="mb-0">VINCITORI PER CATEGORIA</h3>
						</div>
						<div class="card-body">
							{#each categories as category}
								{#if winner[category]}
									<div class="alert alert-light border-success mb-3">
										<div class="row align-items-center">
											<div class="col-4">
												<h5 class="text-primary mb-0">Categoria {category}</h5>
											</div>
											<div class="col-8">
												<h4 class="text-success mb-0">🏆 {winner[category]?.teamName}</h4>
												<small class="text-muted">Allenatore: {winner[category]?.coachName}</small>
											</div>
										</div>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div class="mt-4">
				<button class="btn btn-outline-primary btn-lg me-3" on:click={reset}>🔄 Nuovo Torneo</button>
			</div>
		</div>
	{/if}

	{#if currentPhase !== 'setup'}
		<div class="text-center mt-5 pt-4 border-top">
			<button class="btn btn-outline-danger" on:click={reset}>🔄 Reset Completo Torneo</button>
		</div>
	{/if}
</div>

<style>
	.card { box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid #e9ecef; }
	.card-header { background-color: #f8f9fa; border-bottom: 1px solid #dee2e6; font-weight: 600; }
	.badge { font-size: 0.9em; }
	.table-success { background-color: #d1edff !important; }
	.btn-sm { font-size: 0.8rem; padding: 0.25rem 0.5rem; }
	.overflow-auto { max-height: 80vh; }
	.text-primary { color: #0d6efd !important; }
	.text-success { color: #198754 !important; }
	.bg-success { background-color: #198754 !important; }
	.border-success { border-color: #198754 !important; }
	.alert-success { background-color: #d1edff; border-color: #0d6efd; color: #0a58ca; }
</style>