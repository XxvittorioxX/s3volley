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
		maxScore?: number; // Punteggio massimo per questa categoria
		playTime?: number; // Tempo di gioco per questa categoria (in minuti)
		isTimeBased?: boolean; // Se true, usa il tempo; se false, usa i punti
	}

	interface GroupStanding {
		team: Team;
		played: number;
		won: number;
		drawn: number;
		lost: number;
		points: number;
	}

	// Configurazioni specifiche per categoria
	interface CategoryConfig {
		name: string;
		maxScore: number;
		playTime: number;
		isTimeBased: boolean;
		description: string;
		ageRange: string;
	}

	const categoryConfigs: { [key: string]: CategoryConfig } = {
		'S1': {
			name: 'Minivolley S1',
			maxScore: 10,
			playTime: 8,
			isTimeBased: true,
			description: 'Livello base - 8 minuti a tempo',
			ageRange: '6-8 anni'
		},
		'S2': {
			name: 'Minivolley S2', 
			maxScore: 12,
			playTime: 10,
			isTimeBased: true,
			description: 'Livello intermedio - 10 minuti a tempo',
			ageRange: '8-10 anni'
		},
		'S3': {
			name: 'Minivolley S3',
			maxScore: 15,
			playTime: 12,
			isTimeBased: false,
			description: 'Livello avanzato - Set a 15 punti (vantaggio 2)',
			ageRange: '10-11 anni'
		},
		'Under12': {
			name: 'Under 12',
			maxScore: 21,
			playTime: 15,
			isTimeBased: false,
			description: 'Volley giovanile - Set a 21 punti',
			ageRange: '11-12 anni'
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

	// Funzione per ottenere la configurazione di una categoria
	function getCategoryConfig(category: string): CategoryConfig {
		return categoryConfigs[category] || {
			name: category,
			maxScore: 15,
			playTime: 10,
			isTimeBased: false,
			description: 'Configurazione standard',
			ageRange: 'N/A'
		};
	}

	// Funzione per validare il punteggio secondo le regole della categoria
	function isValidScore(category: string, score1: number, score2: number): boolean {
		const config = getCategoryConfig(category);
		
		if (config.isTimeBased) {
			// Per partite a tempo, qualsiasi punteggio è valido
			return true;
		} else {
			// Per partite a punti, controlla le regole del set
			const maxScore = config.maxScore;
			const diff = Math.abs(score1 - score2);
			
			// Almeno una squadra deve raggiungere il punteggio minimo
			const maxPoints = Math.max(score1, score2);
			
			if (maxPoints < maxScore) {
				// Se nessuna squadra ha raggiunto il massimo, non è finita
				return false;
			}
			
			// Se una squadra ha raggiunto il massimo
			if (maxPoints === maxScore) {
				// Deve avere almeno 2 punti di vantaggio
				return diff >= 2;
			}
			
			// Se il punteggio supera il massimo, deve essere dovuto al vantaggio di 2
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

		// Crea MULTIPLI gironi per ogni categoria
		Object.entries(teamsByCategory).forEach(([category, categoryTeams]) => {
			const config = getCategoryConfig(category);
			
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
						// Inizializza i punteggi temporanei
						initTempScore(matchId);
					}
				}

				// Inizializza SUBITO la classifica del girone
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

		// Reset completo delle statistiche - mantieni i riferimenti alle squadre originali
		groupStandings[groupName] = groupTeams.map(team => ({
			team,
			played: 0,
			won: 0,
			drawn: 0,
			lost: 0,
			points: 0
		}));

		// Ricalcola da tutte le partite giocate
		const groupMatchesPlayed = groupMatches.filter(m => 
			m.group === groupName && 
			m.score1 !== undefined && 
			m.score2 !== undefined &&
			m.score1 !== null &&
			m.score2 !== null
		);

		console.log(`Found ${groupMatchesPlayed.length} played matches for ${groupName}`);

		groupMatchesPlayed.forEach(match => {
			// Usa il riferimento diretto alla squadra invece del nome
			const standing1 = groupStandings[groupName].find(s => s.team === match.t1);
			const standing2 = groupStandings[groupName].find(s => s.team === match.t2);

			if (standing1 && standing2) {
				console.log(`Processing match: ${match.t1?.teamName} ${match.score1} - ${match.score2} ${match.t2?.teamName}`);
				
				standing1.played++;
				standing2.played++;

				if (match.score1! > match.score2!) {
					// Squadra 1 vince
					standing1.won++;
					standing1.points += 3;
					standing2.lost++;
				} else if (match.score2! > match.score1!) {
					// Squadra 2 vince
					standing2.won++;
					standing2.points += 3;
					standing1.lost++;
				} else {
					// Pareggio
					standing1.drawn++;
					standing2.drawn++;
					standing1.points += 1;
					standing2.points += 1;
				}
			} else {
				console.error(`Teams not found for match:`, match.t1?.teamName, match.t2?.teamName);
			}
		});

		// Ordina per punti (decrescente), poi per nome in caso di parità
		groupStandings[groupName].sort((a, b) => {
			if (b.points !== a.points) {
				return b.points - a.points;
			}
			return a.team.teamName.localeCompare(b.team.teamName);
		});

		console.log(`Final standings for ${groupName}:`, 
			groupStandings[groupName].map(s => 
				`${s.team.teamName}: ${s.points}pts (${s.played}P ${s.won}W ${s.drawn}D ${s.lost}L)`
			)
		);
	}

	function setGroupResult(matchId: string, score1: number, score2: number) {
		const match = groupMatches.find(m => m.id === matchId);
		if (!match || !match.t1 || !match.t2 || !match.group || !match.category) return;

		// Valida il punteggio secondo le regole della categoria
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

		console.log(`Setting result for ${matchId}: ${score1}-${score2}`);

		// Aggiorna il risultato della partita
		match.score1 = score1;
		match.score2 = score2;
		match.w = score1 > score2 ? match.t1 : score1 < score2 ? match.t2 : null;

		// Ricalcola completamente la classifica del girone
		recalculateGroupStanding(match.group);

		// Forza l'aggiornamento reattivo DOPO il ricalcolo
		groupStandings = { ...groupStandings };
		groupMatches = [...groupMatches];
		
		console.log(`Result set and standings updated for ${match.group}`);
	}

	function resetMatchResult(matchId: string) {
		const match = groupMatches.find(m => m.id === matchId);
		if (!match || !match.group) return;

		console.log(`Resetting result for ${matchId}`);

		// Reset del risultato
		match.score1 = undefined;
		match.score2 = undefined;
		match.w = null;

		// Reinizializza i valori temporanei
		tempScores[matchId] = { score1: 0, score2: 0 };

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
			const categoryQualified = qualifiedTeams[category];
			if (categoryQualified.length < 2) return;

			const config = getCategoryConfig(category);

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
					category,
					maxScore: config.maxScore,
					playTime: config.playTime,
					isTimeBased: config.isTimeBased
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
						category,
						maxScore: config.maxScore,
						playTime: config.playTime,
						isTimeBased: config.isTimeBased
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

	$: allGroupMatchesPlayed = groupMatches.length > 0 && groupMatches.every(m => m.score1 !== undefined && m.score2 !== undefined);
</script>

<svelte:head>
	<title>Torneo Minivolley - Gestione Categorie S1, S2, S3</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
</svelte:head>

<div class="container my-5 p-4 bg-white rounded shadow">
	<h1 class="text-center mb-5">🏐 Torneo Minivolley - Gestione Categorie S1, S2, S3 🏐</h1>

	{#if currentPhase === 'setup'}
		<div class="mb-4">
			<!-- Tabella delle regole delle categorie -->
			<div class="card mb-4">
				<div class="card-header">
					<h3>📋 Regole delle Categorie</h3>
				</div>
				<div class="card-body">
					<div class="table-responsive">
						<table class="table table-striped">
							<thead class="table-dark">
								<tr>
									<th>Categoria</th>
									<th>Età</th>
									<th>Tipo Partita</th>
									<th>Punteggio/Tempo</th>
									<th>Descrizione</th>
								</tr>
							</thead>
							<tbody>
								{#each Object.entries(categoryConfigs) as [key, config]}
									<tr>
										<td><strong>{key}</strong></td>
										<td>{config.ageRange}</td>
										<td>
											{#if config.isTimeBased}
												<span class="badge bg-info">⏱️ A Tempo</span>
											{:else}
												<span class="badge bg-success">🏆 A Punti</span>
											{/if}
										</td>
										<td>
											{#if config.isTimeBased}
												{config.playTime} minuti
											{:else}
												Set a {config.maxScore} punti
											{/if}
										</td>
										<td>{config.description}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<h2>Squadre Registrate per Categoria</h2>
			{#if teams.length === 0}
				<p class="text-muted">Nessuna squadra registrata</p>
			{:else}
				{#each categories as category}
					<div class="card mb-3">
						<div class="card-header">
							<h4>
								{getCategoryConfig(category).name} 
								<span class="badge bg-primary">{teams.filter(t => t.category === category).length} squadre</span>
								<small class="text-muted">({getCategoryConfig(category).ageRange})</small>
							</h4>
							<small class="text-muted">{getCategoryConfig(category).description}</small>
						</div>
						<div class="card-body">
							<div class="list-group">
								{#each teams.filter(t => t.category === category) as team}
									<div class="list-group-item d-flex justify-content-between align-items-center">
										<div>
											<h6 class="mb-1">{team.teamName}</h6>
											<small class="text-secondary">Allenatore: {team.coachName}</small>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/each}
				<button class="btn btn-primary btn-lg" on:click={createGroups}>🚀 Crea Gironi e Inizia Torneo</button>
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
					
					<!-- Info regole categoria -->
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
																<button class="btn btn-sm btn-success mt-2"
																	disabled={tempScores[match.id].score1 === undefined || tempScores[match.id].score2 === undefined}
																	on:click={() => {
																		setGroupResult(match.id, tempScores[match.id].score1 || 0, tempScores[match.id].score2 || 0);
																	}}>
																	✅ Conferma Risultato
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
											<h6 class="text-success">📊 Classifica {groupName.split('_').slice(1).join(' ')}</h6>
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
															<th>Pti</th>
														</tr>
													</thead>
													<tbody>
														{#each groupStandings[groupName] || [] as standing, i}
															<tr class={i < 2 ? 'table-success' : ''}>
																<td><strong>{i + 1}</strong></td>
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
											{#if groupStandings[groupName] && groupStandings[groupName].length > 0}
												<small class="text-muted">
													Le prime 2 squadre si qualificano per la fase eliminatoria
												</small>
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
				<div class="text-center mt-5">
					<button class="btn btn-success btn-lg" on:click={startKnockoutPhase}>
						🏆 Inizia Fase Eliminatoria
					</button>
				</div>
			{:else}
				<div class="alert alert-warning text-center">
					<strong>⚠️ Non tutte le partite dei gironi sono state completate</strong>
				</div>
			{/if}
		</div>

	{:else if currentPhase === 'knockout'}
		<div class="mb-4">
			<h2>🏆 Fase Eliminatoria</h2>
			
			{#each categories as category}
				<div class="mb-5">
					<h3 class="text-primary">{getCategoryConfig(category).name}</h3>
					
					{#each knockoutRoundsByCategory[category] || [] as round}
						<div class="card mb-3">
							<div class="card-header">
								<h5>
									{#if round === Math.max(...knockoutRoundsByCategory[category])}
										🏆 FINALE
									{:else if round === Math.max(...knockoutRoundsByCategory[category]) - 1}
										🥉 SEMIFINALE
									{:else}
										Round {round}
									{/if}
								</h5>
							</div>
							<div class="card-body">
								{#each knockoutMatches.filter(m => m.round === round && m.category === category) as match}
									<div class="card mb-2">
										<div class="card-body p-3">
											<div class="row align-items-center">
												<div class="col-4 text-end">
													{match.t1?.teamName || 'TBD'}
												</div>
												<div class="col-4 text-center">
													{#if match.w}
														<span class="badge bg-success">
															Vincitore: {match.w.teamName}
														</span>
													{:else if match.t1 && match.t2}
														<div class="btn-group">
															<button class="btn btn-outline-primary btn-sm"
																on:click={() => setKnockoutWinner(match.id, match.t1)}>
																{match.t1.teamName}
															</button>
															<button class="btn btn-outline-primary btn-sm"
																on:click={() => setKnockoutWinner(match.id, match.t2)}>
																{match.t2.teamName}
															</button>
														</div>
													{:else}
														<span class="text-muted">In attesa...</span>
													{/if}
												</div>
												<div class="col-4">
													{match.t2?.teamName || 'TBD'}
												</div>
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
			<h2 class="text-success">🎉 TORNEO CONCLUSO! 🎉</h2>
			
			{#each categories as category}
				<div class="card mb-4">
					<div class="card-header bg-warning">
						<h3>{getCategoryConfig(category).name}</h3>
					</div>
					<div class="card-body">
						<h1 class="display-4 text-success">
							🏆 {winner[category]?.teamName || 'N/A'}
						</h1>
						<p class="lead">CAMPIONI {getCategoryConfig(category).name.toUpperCase()}!</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<div class="text-center mt-5">
		<button class="btn btn-outline-secondary" on:click={reset}>🔄 Reset Torneo</button>
	</div>
</div>

<style>
	.table th, .table td {
		vertical-align: middle;
	}
	
	.card {
		border: 1px solid #dee2e6;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}
	
	.btn-group .btn {
		margin: 0 2px;
	}
	
	.badge {
		font-size: 0.9em;
	}
	
	.alert {
		border-radius: 8px;
	}
	
	.table-success {
		background-color: #d1edff !important;
	}
</style>