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

	onMount(() => {
		teams = get(registeredTeams);
		categories = [...new Set(teams.map(t => t.category))];
	});

	function createGroups() {
		if (teams.length < 4) {
			alert('Servono almeno 4 squadre per i gironi!');
			return;
		}

		// Raggruppa squadre per categoria
		const teamsByCategory: { [category: string]: Team[] } = {};
		teams.forEach(team => {
			if (!teamsByCategory[team.category]) {
				teamsByCategory[team.category] = [];
			}
			teamsByCategory[team.category].push(team);
		});

		// Verifica che ogni categoria abbia almeno 4 squadre
		for (const [category, categoryTeams] of Object.entries(teamsByCategory)) {
			if (categoryTeams.length < 4) {
				alert(`La categoria ${category} ha solo ${categoryTeams.length} squadra/e. Servono almeno 4 squadre per categoria!`);
				return;
			}
		}

		groups = {};
		groupMatches = [];
		groupStandings = {};
		groupsByCategory = {};

		// Crea MULTIPLI gironi per ogni categoria
		Object.entries(teamsByCategory).forEach(([category, categoryTeams]) => {
			// Mescola le squadre della categoria
			const shuffled = [...categoryTeams].sort(() => Math.random() - 0.5);
			
			// Determina il numero di gironi (4 squadre per girone idealmente)
			const teamsPerGroup = 4;
			const numGroups = Math.ceil(shuffled.length / teamsPerGroup);
			
			groupsByCategory[category] = [];

			// Crea i gironi per questa categoria
			for (let g = 0; g < numGroups; g++) {
				const groupName = `${category}_Girone_${String.fromCharCode(65 + g)}`; // A, B, C, etc.
				groupsByCategory[category].push(groupName);
				
				// Distribuisci le squadre nei gironi
				const startIndex = g * teamsPerGroup;
				const endIndex = Math.min(startIndex + teamsPerGroup, shuffled.length);
				const groupTeams = shuffled.slice(startIndex, endIndex);
				
				groups[groupName] = groupTeams;

				// Crea partite del girone (tutti contro tutti)
				for (let i = 0; i < groupTeams.length; i++) {
					for (let j = i + 1; j < groupTeams.length; j++) {
						groupMatches.push({
							id: `${groupName}-${i}-${j}`,
							t1: groupTeams[i],
							t2: groupTeams[j],
							w: null,
							score1: undefined,
							score2: undefined,
							group: groupName,
							phase: 'group',
							category: category
						});
					}
				}

				// Inizializza classifica girone
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
		});

		currentPhase = 'group';
	}

	function setGroupResult(matchId: string, score1: number, score2: number) {
		const match = groupMatches.find(m => m.id === matchId);
		if (!match || !match.t1 || !match.t2) return;

		// Se il risultato era già stato inserito, sottrai i vecchi valori
		const standing1 = groupStandings[match.group!].find(s => s.team === match.t1);
		const standing2 = groupStandings[match.group!].find(s => s.team === match.t2);

		if (standing1 && standing2 && match.score1 !== undefined && match.score2 !== undefined) {
			// Rimuovi vecchi risultati
			standing1.played--;
			standing2.played--;
			standing1.goalsFor -= match.score1;
			standing1.goalsAgainst -= match.score2;
			standing2.goalsFor -= match.score2;
			standing2.goalsAgainst -= match.score1;

			if (match.score1 > match.score2) {
				standing1.won--;
				standing1.points -= 3;
				standing2.lost--;
			} else if (match.score2 > match.score1) {
				standing2.won--;
				standing2.points -= 3;
				standing1.lost--;
			} else {
				standing1.drawn--;
				standing2.drawn--;
				standing1.points -= 1;
				standing2.points -= 1;
			}
		}

		match.score1 = score1;
		match.score2 = score2;
		match.w = score1 > score2 ? match.t1 : score1 < score2 ? match.t2 : null;

		// Aggiorna classifiche con i nuovi risultati
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
				standing1.points += 3;
				standing2.lost++;
			} else if (score2 > score1) {
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

		// Riordina classifiche
		Object.keys(groupStandings).forEach(groupName => {
			groupStandings[groupName].sort((a, b) => {
				if (a.points !== b.points) return b.points - a.points;
				if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
				return b.goalsFor - a.goalsFor;
			});
		});

		groupStandings = { ...groupStandings };
		groupMatches = [...groupMatches];
	}

	function updateMatchResult(matchId: string) {
		const match = groupMatches.find(m => m.id === matchId);
		if (match && match.score1 !== undefined && match.score2 !== undefined) {
			setGroupResult(matchId, match.score1, match.score2);
		}
	}

	function startKnockoutPhase() {
		// Prendi le prime 2 squadre di ogni girone
		qualifiedTeams = {};
		
		categories.forEach(category => {
			qualifiedTeams[category] = [];
			
			// Per ogni girone di questa categoria, prendi le prime 2
			groupsByCategory[category].forEach(groupName => {
				const standings = groupStandings[groupName];
				if (standings && standings.length >= 2) {
					// Qualifica le prime 2 squadre del girone
					const qualified = standings.slice(0, 2).map(s => s.team);
					qualifiedTeams[category] = [...qualifiedTeams[category], ...qualified];
				}
			});

			if (qualifiedTeams[category].length < 2) {
				alert(`Non ci sono abbastanza squadre qualificate per la categoria ${category}!`);
				return;
			}
		});

		// Crea eliminazione diretta per ogni categoria
		knockoutMatches = [];
		
		categories.forEach(category => {
			const categoryQualified = qualifiedTeams[category];
			if (categoryQualified.length < 2) return;

			// Separa le squadre prime e seconde classificate
			const firstPlaces: Team[] = [];
			const secondPlaces: Team[] = [];

			groupsByCategory[category].forEach(groupName => {
				const standings = groupStandings[groupName];
				if (standings && standings.length >= 2) {
					firstPlaces.push(standings[0].team);
					secondPlaces.push(standings[1].team);
				}
			});

			// Mescola le liste per evitare accoppiamenti prevedibili
			const shuffledFirsts = [...firstPlaces].sort(() => Math.random() - 0.5);
			const shuffledSeconds = [...secondPlaces].sort(() => Math.random() - 0.5);

			// Crea gli accoppiamenti: prima vs seconda di gironi diversi
			let round = 1;
			let current = [];

			for (let i = 0; i < Math.min(shuffledFirsts.length, shuffledSeconds.length); i++) {
				current.push({
					id: `ko-${category}-${round}-${i}`,
					t1: shuffledFirsts[i],
					t2: shuffledSeconds[i],
					w: null,
					round,
					phase: 'knockout' as const,
					category
				});
			}

			// Se ci sono più squadre qualificate, aggiungi gli altri accoppiamenti
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
						phase: 'knockout' as const,
						category
					});
				}
			}

			knockoutMatches = [...knockoutMatches, ...current];

			// Crea i turni successivi
			while (current.length > 1) {
				round++;
				const next = [];
				for (let i = 0; i < current.length; i += 2) {
					next.push({ 
						id: `ko-${category}-${round}-${i / 2}`, 
						t1: null, 
						t2: null, 
						w: null, 
						round, 
						phase: 'knockout' as const,
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
					return matchIndex % 2 === 0
						? { ...m, t1: w }
						: { ...m, t2: w };
				}
				return m;
			});
		}

		// Controlla se abbiamo un vincitore per questa categoria
		const categoryMatches = knockoutMatches.filter(m => m.category === match.category);
		const maxRound = Math.max(...categoryMatches.map(m => m.round!));
		const final = categoryMatches.find(m => m.round === maxRound);
		
		if (final?.w) {
			winner[match.category!] = final.w;
		}

		// Controlla se tutte le categorie hanno un vincitore
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
						<div class="card-header">
							<h4>{category} ({teams.filter(t => t.category === category).length} squadre)</h4>
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
					<h3 class="text-primary mb-4">Categoria {category}</h3>
					
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
										<!-- Partite del girone -->
										{#each groupMatches.filter(m => m.group === groupName) as match}
											<div class="card mb-2">
												<div class="card-body p-3">
													<div class="row align-items-center">
														<div class="col-3 text-end fw-semibold">{match.t1?.teamName}</div>
														<div class="col-6 text-center">
															{#if match.score1 !== undefined && match.score2 !== undefined}
																<span class="badge bg-primary fs-6">{match.score1} - {match.score2}</span>
																<button class="btn btn-sm btn-outline-secondary ms-2"
																	on:click={() => {match.score1 = undefined; match.score2 = undefined; groupMatches = [...groupMatches];}}>
																	Modifica
																</button>
															{:else}
																<div class="d-flex justify-content-center align-items-center gap-2">
																	<input type="number" class="form-control form-control-sm text-center" 
																		bind:value={match.score1} min="0" max="99" style="width: 60px;" placeholder="0"
																		on:input={() => updateMatchResult(match.id)}>
																	<span>-</span>
																	<input type="number" class="form-control form-control-sm text-center" 
																		bind:value={match.score2} min="0" max="99" style="width: 60px;" placeholder="0"
																		on:input={() => updateMatchResult(match.id)}>
																</div>
																<button class="btn btn-sm btn-success mt-2"
																	disabled={match.score1 === undefined || match.score2 === undefined}
																	on:click={() => setGroupResult(match.id, match.score1 || 0, match.score2 || 0)}>
																	Conferma Risultato
																</button>
															{/if}
														</div>
														<div class="col-3 fw-semibold">{match.t2?.teamName}</div>
													</div>
												</div>
											</div>
										{/each}

										<!-- Classifica del girone -->
										<div class="mt-4">
											<h6 class="text-success">Classifica {groupName.split('_').slice(1).join(' ')}</h6>
											<div class="table-responsive">
												<table class="table table-sm table-striped">
													<thead class="table-dark">
														<tr>
															<th>Pos</th>
															<th>Squadra</th>
															<th>P</th>
															<th>V</th>
															<th>N</th>
															<th>S</th>
															<th>GF</th>
															<th>GS</th>
															<th>DR</th>
															<th>Punti</th>
														</tr>
													</thead>
													<tbody>
														{#each groupStandings[groupName] || [] as standing, index}
															<tr class={index < 2 ? 'table-success' : ''}>
																<td><strong>{index + 1}</strong></td>
																<td>{standing.team.teamName}</td>
																<td>{standing.played}</td>
																<td>{standing.won}</td>
																<td>{standing.drawn}</td>
																<td>{standing.lost}</td>
																<td>{standing.goalsFor}</td>
																<td>{standing.goalsAgainst}</td>
																<td class={standing.goalDifference > 0 ? 'text-success' : standing.goalDifference < 0 ? 'text-danger' : ''}>
																	{standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
																</td>
																<td><strong class="text-primary">{standing.points}</strong></td>
															</tr>
														{/each}
													</tbody>
												</table>
											</div>
											<small class="text-muted">
												Le prime 2 squadre si qualificano per la fase eliminatoria
											</small>
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
					<button class="btn btn-success btn-lg" on:click={startKnockoutPhase}>
						🏆 Inizia Fase Eliminazione Diretta
					</button>
				</div>
			{/if}
		</div>

	{:else if currentPhase === 'knockout'}
		<div class="mb-4">
			<h2>Fase Eliminazione Diretta</h2>

			{#each categories as category}
				<div class="mb-5">
					<h3 class="text-primary mb-3">Categoria {category}</h3>
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
												<div class="p-2 rounded border
													{match.w === match.t1 ? 'bg-success text-white' : 'bg-light'}">
													<strong>{match.t1?.teamName || 'TBD'}</strong>
												</div>
												<div class="text-center text-muted small">VS</div>
												<div class="p-2 rounded border
													{match.w === match.t2 ? 'bg-success text-white' : 'bg-light'}">
													<strong>{match.t2?.teamName || 'TBD'}</strong>
												</div>
											</div>

											{#if match.t1 && match.t2 && !match.w}
												<div class="d-flex gap-2 mt-3">
													<button class="btn btn-outline-primary btn-sm flex-grow-1"
														on:click={() => setKnockoutWinner(match.id, match.t1)}>
														{match.t1.teamName}
													</button>
													<button class="btn btn-outline-primary btn-sm flex-grow-1"
														on:click={() => setKnockoutWinner(match.id, match.t2)}>
														{match.t2.teamName}
													</button>
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
				</div>
			{/each}
		</div>

	{:else if currentPhase === 'finished'}
		<div class="mb-4">
			<h2 class="text-center mb-4">🏆 VINCITORI DEL TORNEO 🏆</h2>
			<div class="row justify-content-center">
				{#each categories as category}
					{#if winner[category]}
						<div class="col-md-4 mb-3">
							<div class="card text-center border-warning">
								<div class="card-body bg-warning bg-opacity-10">
									<h3 class="card-title text-warning">🏆</h3>
									<h4 class="card-title">{category}</h4>
									<h5 class="card-text text-primary">{winner[category]?.teamName}</h5>
									<small class="text-muted">Allenatore: {winner[category]?.coachName}</small>
								</div>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<div class="text-center mt-5">
		<button class="btn btn-danger" on:click={reset}>🔄 Reset Torneo</button>
	</div>
</div>