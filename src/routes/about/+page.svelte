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
		sets?: {
			set1?: { team1: number; team2: number };
			set2?: { team1: number; team2: number };
			set3?: { team1: number; team2: number };
		};
		matchType: 'time' | 'sets';
		duration?: number; // in minuti per partite a tempo
	}

	interface GroupStanding {
		team: Team;
		played: number;
		won: number;
		drawn: number;
		lost: number;
		points: number;
		setsWon?: number;
		setsLost?: number;
		pointsFor?: number;
		pointsAgainst?: number;
	}

	// Configurazione categorie minivolley
	const MINIVOLLEY_CATEGORIES = {
		'S3_Under10': {
			name: 'S3 Under 10',
			ageRange: '9-10 anni',
			matchType: 'time' as const,
			duration: 10, // 10 minuti
			maxScore: null // nessun limite per partite a tempo
		},
		'S3_Under11': {
			name: 'S3 Under 11', 
			ageRange: '10-11 anni',
			matchType: 'sets' as const,
			setsToWin: 2, // meglio di 3 set
			pointsPerSet: 15,
			minAdvantage: 2,
			maxPoints: 25 // cap massimo per evitare set infiniti
		},
		'S3_Mixed': {
			name: 'S3 Misto',
			ageRange: '9-11 anni',
			matchType: 'sets' as const,
			setsToWin: 2,
			pointsPerSet: 15,
			minAdvantage: 2,
			maxPoints: 25
		}
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
	
	// Variabili temporanee per i punteggi
	let tempScores: { [key: string]: any } = {};

	onMount(() => {
		teams = get(registeredTeams);
		categories = [...new Set(teams.map(t => t.category))];
	});

	// Funzione helper per inizializzare i punteggi temporanei
	function initTempScore(matchId: string, category: string) {
		const categoryConfig = MINIVOLLEY_CATEGORIES[category as keyof typeof MINIVOLLEY_CATEGORIES];
		
		if (!tempScores[matchId]) {
			if (categoryConfig?.matchType === 'time') {
				tempScores[matchId] = { 
					score1: 0, 
					score2: 0,
					timeElapsed: 0
				};
			} else {
				tempScores[matchId] = {
					sets: {
						set1: { team1: 0, team2: 0 },
						set2: { team1: 0, team2: 0 },
						set3: { team1: 0, team2: 0 }
					},
					currentSet: 1,
					setsWon: { team1: 0, team2: 0 }
				};
			}
		}
	}

	function createGroups() {
		if (teams.length < 3) {
			alert('Servono almeno 3 squadre per i gironi!');
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

		// Verifica che ogni categoria abbia almeno 3 squadre
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

		// Crea MULTIPLI gironi per ogni categoria
		Object.entries(teamsByCategory).forEach(([category, categoryTeams]) => {
			const categoryConfig = MINIVOLLEY_CATEGORIES[category as keyof typeof MINIVOLLEY_CATEGORIES];
			
			// Mescola le squadre della categoria
			const shuffled = [...categoryTeams].sort(() => Math.random() - 0.5);
			
			// Determina il numero di gironi - cerca di fare gironi da 3-5 squadre
			let numGroups = 1;
			let teamsPerGroup = shuffled.length;
			
			// Se ci sono più di 5 squadre, crea più gironi
			if (shuffled.length > 5) {
				numGroups = Math.ceil(shuffled.length / 4); // Prova gironi da ~4 squadre
				teamsPerGroup = Math.ceil(shuffled.length / numGroups);
			}
			
			groupsByCategory[category] = [];

			// Crea i gironi per questa categoria
			for (let g = 0; g < numGroups; g++) {
				const groupName = `${category}_Girone_${String.fromCharCode(65 + g)}`; // A, B, C, etc.
				groupsByCategory[category].push(groupName);
				
				// Distribuisci le squadre nei gironi in modo più equilibrato
				const groupTeams = [];
				for (let i = g; i < shuffled.length; i += numGroups) {
					groupTeams.push(shuffled[i]);
				}
				
				groups[groupName] = groupTeams;

				// Crea partite del girone (tutti contro tutti)
				for (let i = 0; i < groupTeams.length; i++) {
					for (let j = i + 1; j < groupTeams.length; j++) {
						const matchId = `${groupName}-${i}-${j}`;
						const match: Match = {
							id: matchId,
							t1: groupTeams[i],
							t2: groupTeams[j],
							w: null,
							score1: undefined,
							score2: undefined,
							group: groupName,
							phase: 'group',
							category: category,
							matchType: categoryConfig?.matchType || 'sets',
							duration: categoryConfig?.duration
						};

						if (categoryConfig?.matchType === 'sets') {
							match.sets = {};
						}

						groupMatches.push(match);
						
						// Inizializza i punteggi temporanei
						initTempScore(matchId, category);
					}
				}

				// Inizializza SUBITO la classifica del girone
				groupStandings[groupName] = groupTeams.map(team => ({
					team,
					played: 0,
					won: 0,
					drawn: 0,
					lost: 0,
					points: 0,
					setsWon: 0,
					setsLost: 0,
					pointsFor: 0,
					pointsAgainst: 0
				}));
			}
		});

		// Forza l'aggiornamento reattivo
		groupStandings = { ...groupStandings };
		currentPhase = 'group';
	}

	// Funzione per ricalcolare completamente la classifica di un girone
	function recalculateGroupStanding(groupName: string) {
		const groupTeams = groups[groupName];
		if (!groupTeams) {
			console.error(`Group ${groupName} not found`);
			return;
		}

		console.log(`Recalculating standings for ${groupName}`);

		// Reset completo delle statistiche
		groupStandings[groupName] = groupTeams.map(team => ({
			team,
			played: 0,
			won: 0,
			drawn: 0,
			lost: 0,
			points: 0,
			setsWon: 0,
			setsLost: 0,
			pointsFor: 0,
			pointsAgainst: 0
		}));

		// Ricalcola da tutte le partite giocate
		const groupMatchesPlayed = groupMatches.filter(m => 
			m.group === groupName && 
			((m.matchType === 'time' && m.score1 !== undefined && m.score2 !== undefined) ||
			 (m.matchType === 'sets' && m.w !== null))
		);

		console.log(`Found ${groupMatchesPlayed.length} played matches for ${groupName}`);

		groupMatchesPlayed.forEach(match => {
			const standing1 = groupStandings[groupName].find(s => s.team === match.t1);
			const standing2 = groupStandings[groupName].find(s => s.team === match.t2);

			if (standing1 && standing2) {
				standing1.played++;
				standing2.played++;

				if (match.matchType === 'time') {
					// Partite a tempo
					standing1.pointsFor! += match.score1 || 0;
					standing1.pointsAgainst! += match.score2 || 0;
					standing2.pointsFor! += match.score2 || 0;
					standing2.pointsAgainst! += match.score1 || 0;

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
				} else {
					// Partite a set
					if (match.w === match.t1) {
						standing1.won++;
						standing1.points += 3;
						standing2.lost++;
					} else if (match.w === match.t2) {
						standing2.won++;
						standing2.points += 3;
						standing1.lost++;
					}

					// Calcola set vinti/persi se disponibili
					if (match.sets) {
						Object.values(match.sets).forEach(set => {
							if (set && set.team1 !== undefined && set.team2 !== undefined) {
								if (set.team1 > set.team2) {
									standing1.setsWon!++;
									standing2.setsLost!++;
								} else if (set.team2 > set.team1) {
									standing2.setsWon!++;
									standing1.setsLost!++;
								}
								standing1.pointsFor! += set.team1;
								standing1.pointsAgainst! += set.team2;
								standing2.pointsFor! += set.team2;
								standing2.pointsAgainst! += set.team1;
							}
						});
					}
				}
			}
		});

		// Ordina per punti, poi per differenza set (se disponibile), poi per differenza punti
		groupStandings[groupName].sort((a, b) => {
			if (b.points !== a.points) {
				return b.points - a.points;
			}
			
			const setDiffA = (a.setsWon || 0) - (a.setsLost || 0);
			const setDiffB = (b.setsWon || 0) - (b.setsLost || 0);
			if (setDiffB !== setDiffA) {
				return setDiffB - setDiffA;
			}
			
			const pointDiffA = (a.pointsFor || 0) - (a.pointsAgainst || 0);
			const pointDiffB = (b.pointsFor || 0) - (b.pointsAgainst || 0);
			if (pointDiffB !== pointDiffA) {
				return pointDiffB - pointDiffA;
			}
			
			return a.team.teamName.localeCompare(b.team.teamName);
		});
	}

	function setGroupResult(matchId: string, result: any) {
		const match = groupMatches.find(m => m.id === matchId);
		if (!match || !match.t1 || !match.t2 || !match.group) return;

		console.log(`Setting result for ${matchId}:`, result);

		if (match.matchType === 'time') {
			// Partite a tempo
			match.score1 = result.score1;
			match.score2 = result.score2;
			match.w = result.score1 > result.score2 ? match.t1 : 
					   result.score1 < result.score2 ? match.t2 : null;
		} else {
			// Partite a set
			match.sets = result.sets;
			match.w = result.winner;
			
			// Calcola il punteggio finale (set vinti)
			let setsTeam1 = 0, setsTeam2 = 0;
			Object.values(result.sets).forEach((set: any) => {
				if (set && set.team1 !== undefined && set.team2 !== undefined) {
					if (set.team1 > set.team2) setsTeam1++;
					else if (set.team2 > set.team1) setsTeam2++;
				}
			});
			match.score1 = setsTeam1;
			match.score2 = setsTeam2;
		}

		// Ricalcola completamente la classifica del girone
		recalculateGroupStanding(match.group);

		// Forza l'aggiornamento reattivo DOPO il ricalcolo
		groupStandings = { ...groupStandings };
		groupMatches = [...groupMatches];
		
		console.log(`Result set and standings updated for ${match.group}`);
	}

	function resetMatchResult(matchId: string) {
		const match = groupMatches.find(m => m.id === matchId);
		if (!match || !match.group || !match.category) return;

		console.log(`Resetting result for ${matchId}`);

		// Reset del risultato
		match.score1 = undefined;
		match.score2 = undefined;
		match.w = null;
		match.sets = {};

		// Reinizializza i valori temporanei
		initTempScore(matchId, match.category);

		// Ricalcola completamente la classifica del girone
		recalculateGroupStanding(match.group);

		// Forza l'aggiornamento reattivo DOPO il ricalcolo
		groupStandings = { ...groupStandings };
		groupMatches = [...groupMatches];
		
		console.log(`Result reset and standings updated for ${match.group}`);
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
			const categoryConfig = MINIVOLLEY_CATEGORIES[category as keyof typeof MINIVOLLEY_CATEGORIES];
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
				const match: Match = {
					id: `ko-${category}-${round}-${i}`,
					t1: shuffledFirsts[i],
					t2: shuffledSeconds[i],
					w: null,
					round,
					phase: 'knockout',
					category,
					matchType: categoryConfig?.matchType || 'sets',
					duration: categoryConfig?.duration
				};

				if (categoryConfig?.matchType === 'sets') {
					match.sets = {};
				}

				current.push(match);
			}

			// Se ci sono più squadre qualificate, aggiungi gli altri accoppiamenti
			const remaining = categoryQualified.filter(team => 
				!current.some(match => match.t1 === team || match.t2 === team)
			);

			for (let i = 0; i < remaining.length; i += 2) {
				if (remaining[i + 1]) {
					const match: Match = {
						id: `ko-${category}-${round}-${current.length}`,
						t1: remaining[i],
						t2: remaining[i + 1],
						w: null,
						round,
						phase: 'knockout',
						category,
						matchType: categoryConfig?.matchType || 'sets',
						duration: categoryConfig?.duration
					};

					if (categoryConfig?.matchType === 'sets') {
						match.sets = {};
					}

					current.push(match);
				}
			}

			knockoutMatches = [...knockoutMatches, ...current];

			// Crea i turni successivi
			while (current.length > 1) {
				round++;
				const next = [];
				for (let i = 0; i < current.length; i += 2) {
					const match: Match = {
						id: `ko-${category}-${round}-${i / 2}`, 
						t1: null, 
						t2: null, 
						w: null, 
						round, 
						phase: 'knockout',
						category,
						matchType: categoryConfig?.matchType || 'sets',
						duration: categoryConfig?.duration
					};

					if (categoryConfig?.matchType === 'sets') {
						match.sets = {};
					}

					next.push(match);
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
		tempScores = {};
		currentPhase = 'setup';
		winner = {};
		qualifiedTeams = {};
	}

	$: knockoutRoundsByCategory = categories.reduce((acc, category) => {
		acc[category] = [...new Set(knockoutMatches.filter(m => m.category === category).map(m => m.round))].sort();
		return acc;
	}, {} as { [key: string]: number[] });

	$: allGroupMatchesPlayed = groupMatches.length > 0 && groupMatches.every(m => 
		(m.matchType === 'time' && m.score1 !== undefined && m.score2 !== undefined) ||
		(m.matchType === 'sets' && m.w !== null)
	);

	// Helper function per verificare se un set è valido
	function isValidSet(score1: number, score2: number, category: string): boolean {
		const config = MINIVOLLEY_CATEGORIES[category as keyof typeof MINIVOLLEY_CATEGORIES];
		if (!config || config.matchType !== 'sets') return false;

		const maxScore = Math.max(score1, score2);
		const minScore = Math.min(score1, score2);
		
		// Deve raggiungere almeno il punteggio minimo
		if (maxScore < config.pointsPerSet) return false;
		
		// Non deve superare il cap massimo
		if (maxScore > config.maxPoints) return false;
		
		// Deve avere il vantaggio minimo O essere al cap massimo
		const advantage = maxScore - minScore;
		return advantage >= config.minAdvantage || maxScore === config.maxPoints;
	}

	// Helper function per calcolare il vincitore di una partita a set
	function calculateSetsWinner(sets: any, category: string): Team | null {
		const config = MINIVOLLEY_CATEGORIES[category as keyof typeof MINIVOLLEY_CATEGORIES];
		if (!config || config.matchType !== 'sets') return null;

		let setsTeam1 = 0, setsTeam2 = 0;
		
		Object.values(sets).forEach((set: any) => {
			if (set && set.team1 !== undefined && set.team2 !== undefined) {
				if (set.team1 > set.team2) setsTeam1++;
				else if (set.team2 > set.team1) setsTeam2++;
			}
		});

		return setsTeam1 > setsTeam2 ? null : null; // Will be set by the UI
	}
</script>

<svelte:head>
	<title>Torneo Minivolley S3 - Gironi e Eliminazione Diretta</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
</svelte:head>

<div class="container my-5 p-4 bg-white rounded shadow">
	<h1 class="text-center mb-5">🏐 Torneo Minivolley S3 - Gironi e Eliminazione Diretta</h1>

	{#if currentPhase === 'setup'}
		<div class="mb-4">
			<h2>Squadre Registrate per Categoria</h2>
			
			<!-- Info sulle categorie -->
			<div class="alert alert-info mb-4">
				<h5>📋 Categorie e Regolamenti</h5>
				<div class="row">
					{#each Object.entries(MINIVOLLEY_CATEGORIES) as [key, config]}
						<div class="col-md-4 mb-2">
							<strong>{config.name}</strong> ({config.ageRange})<br>
							<small class="text-muted">
								{#if config.matchType === 'time'}
									⏱️ Partite a tempo ({config.duration} min)
								{:else}
									🏆 Meglio di 3 set (a {config.pointsPerSet} punti)
								{/if}
							</small>
						</div>
					{/each}
				</div>
			</div>

			{#if teams.length === 0}
				<p class="text-muted">Nessuna squadra registrata</p>
			{:else}
				{#each categories as category}
					{@const categoryConfig = MINIVOLLEY_CATEGORIES[category]}
					<div class="card mb-3">
						<div class="card-header">
							<h4>
								{categoryConfig ? categoryConfig.name : category} 
								({teams.filter(t => t.category === category).length} squadre)
							</h4>
							{#if categoryConfig}
								<small class="text-muted">
									{categoryConfig.ageRange} - 
									{#if categoryConfig.matchType === 'time'}
										Partite a tempo di {categoryConfig.duration} minuti
									{:else}
										Meglio di 3 set a {categoryConfig.pointsPerSet} punti (vantaggio {categoryConfig.minAdvantage})
									{/if}
								</small>
							{/if}
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
				{@const categoryConfig = MINIVOLLEY_CATEGORIES[category]}
				<div class="mb-5">
					<h3 class="text-primary mb-4">
						🏐 {categoryConfig ? categoryConfig.name : category}
						{#if categoryConfig}
							<small class="text-muted">
								- {categoryConfig.ageRange}
								{#if categoryConfig.matchType === 'time'}
									(⏱️ {categoryConfig.duration} min)
								{:else}
									(🏆 Set a {categoryConfig.pointsPerSet})
								{/if}
							</small>
						{/if}
					</h3>
					
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
											<div class="card mb-3">
												<div class="card-body p-3">
													<div class="row align-items-center">
														<div class="col-3 text-end fw-semibold">{match.t1?.teamName}</div>
														<div class="col-6 text-center">
															{#if categoryConfig?.matchType === 'time'}
																<!-- Partite a tempo -->
																{#if match.score1 !== undefined && match.score2 !== undefined}
																	<span class="badge bg-primary fs-6">{match.score1} - {match.score2}</span>
																	<button class="btn btn-sm btn-outline-secondary ms-2"
																		on:click={() => resetMatchResult(match.id)}>
																		Modifica
																	</button>
																{:else}
																	<div class="d-flex justify-content-center align-items-center gap-2">
																		<input type="number" class="form-control form-control-sm text-center"