<script lang="ts">
	import { registeredTeams, type Team } from '$lib/stores/teams';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import CategoryRules, { categoryConfigs, getCategoryConfig } from './CategoryRules.svelte';

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
		maxScore?: number;
		playTime?: number;
		isTimeBased?: boolean;
	}

	interface GroupStanding {
		team: Team;
		played: number;
		won: number;
		drawn: number;
		lost: number;
		points: number;
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
	
	// Variabili temporanee per i punteggi
	let tempScores: { [key: string]: { score1: number, score2: number } } = {};

	onMount(() => {
		teams = get(registeredTeams);
		categories = [...new Set(teams.map(t => t.category))];
	});

	// Funzione helper per inizializzare i punteggi temporanei
	function initTempScore(matchId: string) {
		if (!tempScores[matchId]) {
			tempScores[matchId] = { score1: 0, score2: 0 };
		}
	}

	// Funzione per validare il punteggio secondo le regole della categoria
	function isValidScore(category: string, score1: number, score2: number): boolean {
		const config = getCategoryConfig(category);
		
		if (config.isTimeBased) {
			return true;
		} else {
			const maxScore = config.maxScore;
			const diff = Math.abs(score1 - score2);
			const maxPoints = Math.max(score1, score2);
			
			if (maxPoints < maxScore) {
				return false;
			}
			
			if (maxPoints === maxScore) {
				return diff >= 2;
			}
			
			if (maxPoints > maxScore) {
				return diff === 2;
			}
		}
		
		return true;
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

		// Crea gironi per ogni categoria
		Object.entries(teamsByCategory).forEach(([category, categoryTeams]) => {
			const config = getCategoryConfig(category);
			
			const shuffled = [...categoryTeams].sort(() => Math.random() - 0.5);
			
			let numGroups = 1;
			if (shuffled.length > 5) {
				numGroups = Math.ceil(shuffled.length / 4);
			}
			
			groupsByCategory[category] = [];

			for (let g = 0; g < numGroups; g++) {
				const groupName = `${category}_Girone_${String.fromCharCode(65 + g)}`;
				groupsByCategory[category].push(groupName);
				
				const groupTeams = [];
				for (let i = g; i < shuffled.length; i += numGroups) {
					groupTeams.push(shuffled[i]);
				}
				
				groups[groupName] = groupTeams;

				// Crea partite del girone
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
							category: category,
							maxScore: config.maxScore,
							playTime: config.playTime,
							isTimeBased: config.isTimeBased
						});
						initTempScore(matchId);
					}
				}

				// Inizializza classifica del girone
				groupStandings[groupName] = groupTeams.map(team => ({
					team,
					played: 0,
					won: 0,
					drawn: 0,
					lost: 0,
					points: 0
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
			team,
			played: 0,
			won: 0,
			drawn: 0,
			lost: 0,
			points: 0
		}));

		const groupMatchesPlayed = groupMatches.filter(m => 
			m.group === groupName && 
			m.score1 !== undefined && 
			m.score2 !== undefined &&
			m.score1 !== null &&
			m.score2 !== null
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
			if (b.points !== a.points) {
				return b.points - a.points;
			}
			return a.team.teamName.localeCompare(b.team.teamName);
		});
	}

	function setGroupResult(matchId: string, score1: number, score2: number) {
		const match = groupMatches.find(m => m.id === matchId);
		if (!match || !match.t1 || !match.t2 || !match.group || !match.category) return;

		if (!isValidScore(match.category, score1, score2)) {
			const config = getCategoryConfig(match.category);
			if (config.isTimeBased) {
				alert(`Punteggio non valido per ${config.name}!`);
			} else {
				alert(`Punteggio non valido per ${config.name}! 
				       Regole: Set a ${config.maxScore} punti con vantaggio di 2 punti.`);
			}
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

			const config = getCategoryConfig(category);

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
			let current = [];

			for (let i = 0; i < Math.min(shuffledFirsts.length, shuffledSeconds.length); i++) {
				current.push({
					id: `ko-${category}-${round}-${i}`,
					t1: shuffledFirsts[i],
					t2: shuffledSeconds[i],
					w: null,
					round,
					phase: 'knockout' as const,
					category,
					maxScore: config.maxScore,
					playTime: config.playTime,
					isTimeBased: config.isTimeBased
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
						phase: 'knockout' as const,
						category,
						maxScore: config.maxScore,
						playTime: config.playTime,
						isTimeBased: config.isTimeBased
					});
				}
			}

			knockoutMatches = [...knockoutMatches, ...current];

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
						category,
						maxScore: config.maxScore,
						playTime: config.playTime,
						isTimeBased: config.isTimeBased
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
	}, {} as { [category: string]: number[] });

	$: allGroupMatchesPlayed = groupMatches.length > 0 && groupMatches.every(m => m.score1 !== undefined && m.score2 !== undefined);
</script>

<svelte:head>
	<title>Torneo Minivolley - Gestione Torneo</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
</svelte:head>

<div class="container my-5 p-4 bg-white rounded shadow">
	<h1 class="text-center mb-5">🏐 Torneo Minivolley - Gestione Torneo 🏐</h1>

	{#if currentPhase === 'setup'}
		<div class="mb-4">
			<!-- Componente regole separate -->
			<CategoryRules {teams} {categories} />
			
			{#if teams.length > 0}
				<div class="text-center mt-4">
					<button class="btn btn-primary btn-lg" on:click={createGroups}>
						🚀 Crea Gironi e Inizia Torneo
					</button>
				</div>
			{/if}
		</div>

	{:else if currentPhase === 'group'}
		<div class="mb-4">
			<h2>🔄 Fase a Gironi</h2>
			
			{#each categories as category}
				<div class="mb-5">
					<h3 class="text-primary mb-4">
						🏐 {getCategoryConfig(category).name}
						<small class="text-muted">({getCategoryConfig(category).ageRange})</small>
					</h3>
					
					<div class="alert alert-info mb-3">
						<small>
							<strong>Regole:</strong> {getCategoryConfig(category).description}
							{#if getCategoryConfig(category).isTimeBased}
								- Partite di {getCategoryConfig(category).playTime} minuti a tempo
							{:else}
								- Set a {getCategoryConfig(category).maxScore} punti (vantaggio di 2)
							{/if}
						</small>
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
																<button class="btn btn-sm btn-outline-secondary ms-2"
																	on:click={() => resetMatchResult(match.id)}>
																	✏️ Modifica
																</button>
															{:else}
																<div class="mb-2">
																	<small class="text-muted">
																		{#if match.isTimeBased}
																			⏱️ Partita di {match.playTime} min
																		{:else}
																			🏆 Set a {match.maxScore} punti (vantaggio 2)
																		{/if}
																	</small>
																</div>
																<div class="d-flex justify-content-center align-items-center gap-2">
																	<input type="number" class="form-control form-control-sm text-center" 
																		bind:value={tempScores[match.id].score1} 
																		min="0" 
																		max={match.isTimeBased ? 99 : match.maxScore + 10}
																		style="width: 60px;" 
																		placeholder="0">
																	<span>-</span>
																	<input type="number" class="form-control form-control-sm text-center" 
																		bind:value={tempScores[match.id].score2} 
																		min="0" 
																		max={match.isTimeBased ? 99 : match.maxScore + 10}
																		style="width: 60px;" 
																		placeholder="0">
																</div>
	<!-- Questa è la continuazione del codice che dovrebbe seguire dopo il bottone corretto -->

<button class="btn btn-sm btn-success mt-2"
    disabled={tempScores[match.id].score1 === undefined || tempScores[match.id].score2 === undefined}
    on:click={() => {
        setGroupResult(match.id, tempScores[match.id].score1 || 0, tempScores[match.id].score2 || 0);
    }}>
    ✅ Salva Risultato
</button>
                                                            {/if}
                                                        </div>
                                                    </div>
                                                </div>
                                            {/each}

                                            <!-- Classifica del girone -->
                                            <div class="mt-3">
                                                <h6>📊 Classifica</h6>
                                                <div class="table-responsive">
                                                    <table class="table table-sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Pos</th>
                                                                <th>Squadra</th>
                                                                <th>G</th>
                                                                <th>V</th>
                                                                <th>N</th>
                                                                <th>P</th>
                                                                <th>Pt</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {#each groupStandings[groupName] || [] as standing, index}
                                                                <tr class={index < 2 ? 'table-success' : ''}>
                                                                    <td>{index + 1}</td>
                                                                    <td class="fw-semibold">{standing.team.teamName}</td>
                                                                    <td>{standing.played}</td>
                                                                    <td>{standing.won}</td>
                                                                    <td>{standing.drawn}</td>
                                                                    <td>{standing.lost}</td>
                                                                    <td class="fw-bold">{standing.points}</td>
                                                                </tr>
                                                            {/each}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                {#if groupStandings[groupName] && groupStandings[groupName].length > 0}
                                                    <small class="text-success">✅ Prime 2 squadre si qualificano</small>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/each}

                {#if allGroupMatchesPlayed}
                    <div class="text-center mt-4">
                        <button class="btn btn-success btn-lg" on:click={startKnockoutPhase}>
                            🏆 Inizia Fase Eliminatoria
                        </button>
                    </div>
                {/if}
            </div>

        {:else if currentPhase === 'knockout'}
            <div class="mb-4">
                <h2>🏆 Fase Eliminatoria</h2>
                
                {#each categories as category}
                    <div class="mb-5">
                        <h3 class="text-primary mb-4">
                            🏐 {getCategoryConfig(category).name}
                            <small class="text-muted">({getCategoryConfig(category).ageRange})</small>
                        </h3>
                        
                        <div class="alert alert-info mb-3">
                            <small>
                                <strong>Regole:</strong> {getCategoryConfig(category).description}
                                {#if getCategoryConfig(category).isTimeBased}
                                    - Partite di {getCategoryConfig(category).playTime} minuti a tempo
                                {:else}
                                    - Set a {getCategoryConfig(category).maxScore} punti (vantaggio di 2)
                                {/if}
                            </small>
                        </div>

                        {#each knockoutRoundsByCategory[category] || [] as round}
                            <div class="mb-4">
                                <h5>
                                    {#if round === Math.max(...knockoutRoundsByCategory[category])}
                                        🏆 Finale
                                    {:else if round === Math.max(...knockoutRoundsByCategory[category]) - 1}
                                        🥉 Semifinale
                                    {:else}
                                        Round {round}
                                    {/if}
                                </h5>
                                
                                <div class="row">
                                    {#each knockoutMatches.filter(m => m.round === round && m.category === category) as match}
                                        <div class="col-md-6 mb-3">
                                            <div class="card">
                                                <div class="card-body text-center">
                                                    <div class="mb-2">
                                                        <strong>{match.t1?.teamName || 'TBD'}</strong>
                                                        <br>
                                                        <small>vs</small>
                                                        <br>
                                                        <strong>{match.t2?.teamName || 'TBD'}</strong>
                                                    </div>
                                                    
                                                    {#if match.w}
                                                        <div class="alert alert-success p-2">
                                                            🏆 <strong>{match.w.teamName}</strong>
                                                        </div>
                                                    {:else if match.t1 && match.t2}
                                                        <div class="btn-group-vertical w-100">
                                                            <button class="btn btn-outline-primary" 
                                                                on:click={() => setKnockoutWinner(match.id, match.t1)}>
                                                                Vince {match.t1.teamName}
                                                            </button>
                                                            <button class="btn btn-outline-primary" 
                                                                on:click={() => setKnockoutWinner(match.id, match.t2)}>
                                                                Vince {match.t2.teamName}
                                                            </button>
                                                        </div>
                                                    {:else}
                                                        <small class="text-muted">In attesa degli accoppiamenti</small>
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                {/each}
            </div>

        {:else if currentPhase === 'finished'}
            <div class="text-center">
                <h2>🎉 Torneo Completato! 🎉</h2>
                
                <div class="row justify-content-center mt-4">
                    {#each categories as category}
                        <div class="col-md-4 mb-4">
                            <div class="card border-warning">
                                <div class="card-header bg-warning text-dark text-center">
                                    <h5>{getCategoryConfig(category).name}</h5>
                                    <small>({getCategoryConfig(category).ageRange})</small>
                                </div>
                                <div class="card-body text-center">
                                    {#if winner[category]}
                                        <h3 class="text-warning">🏆</h3>
                                        <h4 class="text-primary">{winner[category].teamName}</h4>
                                        <p class="text-muted">Campioni {getCategoryConfig(category).name}!</p>
                                    {:else}
                                        <p class="text-muted">Nessun vincitore</p>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <div class="text-center mt-5">
            <button class="btn btn-outline-danger" on:click={reset}>
                🔄 Reset Torneo
            </button>
        </div>
    </div>

<style>
    .container {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .bg-white {
        background-color: rgba(255, 255, 255, 0.95) !important;
        backdrop-filter: blur(10px);
    }
    
    .card {
        border: none;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
    }
    
    .card:hover {
        transform: translateY(-2px);
    }
    
    .table-success {
        background-color: rgba(25, 135, 84, 0.1) !important;
    }
    
    .btn {
        border-radius: 25px;
        font-weight: 500;
        transition: all 0.3s;
    }
    
    .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    .badge {
        border-radius: 15px;
        padding: 8px 12px;
    }
    
    .alert {
        border-radius: 15px;
        border: none;
    }
    
    h1, h2, h3 {
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    .form-control:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    }
    
    .text-primary {
        color: #667eea !important;
    }
    
    .btn-primary {
        background: linear-gradient(45deg, #667eea, #764ba2);
        border: none;
    }
    
    .btn-success {
        background: linear-gradient(45deg, #28a745, #20c997);
        border: none;
    }
    
    @media (max-width: 768px) {
        .container {
            padding: 15px;
        }
        
        .card-body {
            padding: 15px;
        }
        
        .btn-group-vertical .btn {
            margin-bottom: 5px;
        }
    }
</style>