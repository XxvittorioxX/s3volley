<script lang="ts">
	import { onMount } from 'svelte';

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
	let tempScores: { [key: string]: { score1: number, score2: number } } = {};
	let isLoadingTeams = false;
	let loadError = '';

	const fields = Array.from({ length: 20 }, (_, i) => i + 1);

	function saveState() {
		const state = {
			teams, groupMatches, knockoutMatches, groupStandings, groups, 
			currentPhase, winner, qualifiedTeams, categories, groupsByCategory, 
			tempScores, timestamp: Date.now()
		};
		localStorage.setItem('volley-s3-tournament', JSON.stringify(state));
	}

	function loadState() {
		const saved = localStorage.getItem('volley-s3-tournament');
		if (saved) {
			try {
				const state = JSON.parse(saved);
				teams = state.teams || [];
				groupMatches = state.groupMatches || [];
				knockoutMatches = state.knockoutMatches || [];
				groupStandings = state.groupStandings || {};
				groups = state.groups || {};
				currentPhase = state.currentPhase || 'setup';
				winner = state.winner || {};
				qualifiedTeams = state.qualifiedTeams || {};
				categories = state.categories || [];
				groupsByCategory = state.groupsByCategory || {};
				tempScores = state.tempScores || {};
			} catch (e) {
				console.error('Errore nel caricamento stato:', e);
			}
		}
	}

	async function loadTeamsFromDatabase() {
		isLoadingTeams = true;
		loadError = '';
		
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
				saveState();
			} else {
				throw new Error(result.message || 'Errore nel caricamento squadre');
			}
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Errore sconosciuto';
			teams = [];
			categories = [];
		} finally {
			isLoadingTeams = false;
		}
	}

	onMount(() => {
		loadState();
		if (teams.length === 0) {
			loadTeamsFromDatabase();
		}
	});

	function getScoreRules(category: string) {
		const rules: Record<string, { maxScore: number }> = {
			'S1': { maxScore: 8 },
			'S2': { maxScore: 10 },
			'S3': { maxScore: 15 },
			'Under 12': { maxScore: 15 },
			'Seniores': { maxScore: 25 }
		};
		return rules[category] || { maxScore: 15 };
	}
	function getAvailableFields(currentMatchId: string, isKnockout = false): number[] {
	const allMatches = isKnockout ? knockoutMatches : groupMatches;
	const usedFields = allMatches
		.filter(m => m.id !== currentMatchId && m.field !== undefined)
		.map(m => m.field!);
	
	return fields.filter(field => !usedFields.includes(field));
}		

	function isValidScore(score1: number, score2: number, category: string): boolean {
		const { maxScore } = getScoreRules(category);
		const maxScore_match = Math.max(score1, score2);
		const scoreDiff = Math.abs(score1 - score2);

		return maxScore_match >= maxScore && scoreDiff >= 1;
	}

	function getCategoryRules(category: string): string {
		const { maxScore } = getScoreRules(category);
		return `Si vince a ${maxScore} punti con almeno 1 punto di vantaggio`;
	}

	function initTempScore(matchId: string) {
		if (!tempScores[matchId]) {
			tempScores[matchId] = { score1: 0, score2: 0 };
		}
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
				alert(`La categoria ${category} ha solo ${categoryTeams.length} squadra/e. Servono almeno 3!`);
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
							category: category, 
							field: undefined
						});
						initTempScore(matchId);
					}
				}

				groupStandings[groupName] = groupTeams.map(team => ({
					team, played: 0, won: 0, drawn: 0, lost: 0, points: 0
				}));
			}
		});

		currentPhase = 'group';
		saveState();
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
			const { maxScore } = getScoreRules(match.category);
			alert(`Punteggio non valido per ${match.category}!\n${getCategoryRules(match.category)}\n\nEsempio valido: ${maxScore}-${maxScore-1}`);
			return;
		}

		match.score1 = score1; 
		match.score2 = score2;
		match.w = score1 > score2 ? match.t1 : score1 < score2 ? match.t2 : null;

		recalculateGroupStanding(match.group);
		groupStandings = { ...groupStandings };
		groupMatches = [...groupMatches];
		saveState();
	}

function setFieldForMatch(matchId: string, field: number, isKnockout = false) {
	const matches = isKnockout ? knockoutMatches : groupMatches;
	const match = matches.find(m => m.id === matchId);
	if (match) {
		// Verifica che il campo sia ancora disponibile
		const availableFields = getAvailableFields(matchId, isKnockout);
		if (availableFields.includes(field)) {
			match.field = field;
			if (isKnockout) {
				knockoutMatches = [...knockoutMatches];
			} else {
				groupMatches = [...groupMatches];
			}
			saveState();
		} else {
			alert(`Il campo ${field} è già occupato da un'altra partita!`);
		}
	}
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
		saveState();
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
			alert(`Non ci sono abbastanza squadre qualificate per ${category}!`);
			return;
		}
	});

	knockoutMatches = [];
	
	categories.forEach(category => {
		const categoryQualified = qualifiedTeams[category];
		if (categoryQualified.length < 2) return;
		const firstPlaces: Team[] = [];
		const secondPlaces: Team[] = [];
		const groupNames = groupsByCategory[category];

		groupNames.forEach(groupName => {
			const standings = groupStandings[groupName];
			if (standings && standings.length >= 2) {
				firstPlaces.push(standings[0].team); 
				secondPlaces.push(standings[1].team); 
			}
		});

		let round = 1;
		let current: Match[] = [];

		for (let i = 0; i < firstPlaces.length; i++) {

			let opponentIndex = (i + 1) % secondPlaces.length;
			
			if (secondPlaces.length > 2) {
				opponentIndex = (i + Math.floor(secondPlaces.length / 2)) % secondPlaces.length;
			}

			if (firstPlaces[i] && secondPlaces[opponentIndex]) {
				current.push({
					id: `ko-${category}-${round}-${current.length}`, 
					t1: firstPlaces[i], 
					t2: secondPlaces[opponentIndex],
					w: null, 
					round, 
					phase: 'knockout', 
					category, 
					field: undefined
				});

				secondPlaces.splice(opponentIndex, 1);
			}
		}

		const remainingSeconds = secondPlaces;
		for (let i = 0; i < remainingSeconds.length; i += 2) {
			if (remainingSeconds[i + 1]) {
				current.push({
					id: `ko-${category}-${round}-${current.length}`, 
					t1: remainingSeconds[i], 
					t2: remainingSeconds[i + 1],
					w: null, 
					round, 
					phase: 'knockout', 
					category, 
					field: undefined
				});
			}
		}

		knockoutMatches = [...knockoutMatches, ...current];

		while (current.length > 1) {
			round++;
			const next: Match[] = [];
			for (let i = 0; i < current.length; i += 2) {
				next.push({ 
					id: `ko-${category}-${round}-${Math.floor(i/2)}`, 
					t1: null, 
					t2: null, 
					w: null, 
					round, 
					phase: 'knockout', 
					category, 
					field: undefined
				});
			}
			knockoutMatches = [...knockoutMatches, ...next];
			current = next;
		}
	});

	currentPhase = 'knockout';
	saveState();
}

	function setKnockoutWinner(id: string, winnerTeam: Team) {
		knockoutMatches = knockoutMatches.map(m => m.id === id ? { ...m, w: winnerTeam } : m);

		const match = knockoutMatches.find(m => m.id === id);
		if (!match || match.round === undefined || !match.category) return;

		const currentRound = match.round;
		const nextRound = knockoutMatches.filter(m => m.round === currentRound + 1 && m.category === match.category);
		const matchIndex = parseInt(match.id.split('-')[3]);
		const nextMatch = nextRound[Math.floor(matchIndex / 2)];

		if (nextMatch) {
			knockoutMatches = knockoutMatches.map(m => {
				if (m.id === nextMatch.id) {
					return matchIndex % 2 === 0 ? { ...m, t1: winnerTeam } : { ...m, t2: winnerTeam };
				}
				return m;
			});
		}

		const categoryMatches = knockoutMatches.filter(m => m.category === match.category);
		const maxRound = Math.max(...categoryMatches.map(m => m.round || 0));
		const final = categoryMatches.find(m => m.round === maxRound);
		
		if (final?.w) {
			winner[match.category] = final.w;
		}

		const allCategoriesFinished = categories.every(cat => winner[cat]);
		if (allCategoriesFinished) {
			currentPhase = 'finished';
		}
		
		saveState();
	}

	function reset() {
		if (confirm('Sei sicuro di voler resettare tutto il torneo?')) {
			groupMatches = []; 
			knockoutMatches = []; 
			groupStandings = {}; 
			groups = {};
			groupsByCategory = {}; 
			tempScores = {}; 
			currentPhase = 'setup'; 
			winner = {}; 
			qualifiedTeams = {};
			localStorage.removeItem('volley-s3-tournament');
		}
	}

	function exportResults() {
		const results = {
			winners: winner,
			groupStandings: groupStandings,
			allMatches: [...groupMatches, ...knockoutMatches],
			timestamp: new Date().toISOString()
		};
		
		const dataStr = JSON.stringify(results, null, 2);
		const dataBlob = new Blob([dataStr], {type:'application/json'});
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `torneo-results-${new Date().toISOString().split('T')[0]}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}

	function printResults() {
		window.print();
	}
	
	$: knockoutRoundsByCategory = categories.reduce((acc, category) => {
		const rounds = knockoutMatches
			.filter(m => m.category === category)
			.map(m => m.round)
			.filter((round): round is number => round !== undefined);
		acc[category] = [...new Set(rounds)].sort();
		return acc;
	}, {} as { [key: string]: number[] });

	$: allGroupMatchesPlayed = groupMatches.length > 0 && groupMatches.every(m => m.score1 !== undefined && m.score2 !== undefined);
</script>

<svelte:head>
	<title>Torneo Volley S3</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
	<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet" />
</svelte:head>

<div class="container-fluid py-3">
	<div class="d-flex justify-content-between align-items-center mb-4">
		<h1 class="h3 mb-0">🏐 Torneo Volley S3</h1>
		{#if currentPhase !== 'setup'}
			<button class="btn btn-outline-danger btn-sm" on:click={reset}>
				<i class="bi bi-arrow-clockwise"></i> Reset
			</button>
		{/if}
	</div>

	{#if isLoadingTeams}
		<div class="text-center py-5">
			<div class="spinner-border text-primary" role="status">
				<span class="visually-hidden">Caricamento...</span>
			</div>
			<p class="mt-2">Caricamento squadre...</p>
		</div>
	{:else if loadError}
		<div class="alert alert-danger">
			<i class="bi bi-exclamation-triangle"></i> {loadError}
		</div>
	{:else if currentPhase === 'setup'}
		<div class="card">
			<div class="card-body">
				<h5 class="card-title">Setup Torneo</h5>
				<p class="card-text">Squadre caricate: <strong>{teams.length}</strong></p>
				<p class="text-muted">Categorie: {categories.join(', ')}</p>
				<button class="btn btn-primary" on:click={createGroups} disabled={teams.length < 3}>
					<i class="bi bi-play-circle"></i> Crea Gironi
				</button>
			</div>
		</div>
	{:else if currentPhase === 'group'}
		<div class="d-flex justify-content-between align-items-center mb-3">
			<h4 class="mb-0">Fase a Gironi</h4>
			{#if allGroupMatchesPlayed}
				<button class="btn btn-success" on:click={startKnockoutPhase}>
					<i class="bi bi-trophy"></i> Inizia Eliminazione Diretta
				</button>
			{/if}
		</div>

		{#each categories as category}
			<div class="card mb-4">
				<div class="card-header bg-primary text-white">
					<h5 class="mb-0">{category}</h5>
					<small>{getCategoryRules(category)}</small>
				</div>
				<div class="card-body">
					{#each groupsByCategory[category] || [] as groupName}
						<h6 class="fw-bold">{groupName.split('_').slice(-1)[0]}</h6>
						<div class="row g-2 mb-3">
							{#each groupMatches.filter(m => m.group === groupName) as match}
								<div class="col-md-6 col-lg-4">
									<div class="card card-body p-2 {match.w ? 'border-success' : ''}">
										<div class="d-flex justify-content-between align-items-center mb-2">
											<small class="text-muted">
												{match.t1?.teamName} vs {match.t2?.teamName}
											</small>
											{#if match.field}
												<span class="badge bg-secondary">Campo {match.field}</span>
											{/if}
										</div>
										
										{#if match.score1 !== undefined && match.score2 !== undefined}
											<div class="text-center">
												<strong class={match.w === match.t1 ? 'text-success' : match.w === match.t2 ? 'text-danger' : ''}>
													{match.score1} - {match.score2}
												</strong>
											</div>
											<div class="d-flex gap-1 mt-2">
												<!-- svelte-ignore a11y_consider_explicit_label -->
												<button class="btn btn-outline-warning btn-sm flex-fill" on:click={() => resetMatchResult(match.id)}>
													<i class="bi bi-arrow-clockwise"></i>
												</button>
												<select class="form-select form-select-sm" bind:value={match.field} on:change={() => setFieldForMatch(match.id, match.field!)}>
												<option value={undefined}>Campo</option>
												{#each getAvailableFields(match.id) as field}
													<option value={field}>{field}</option>
													{/each}
														{#if match.field && !getAvailableFields(match.id).includes(match.field)}
														<option value={match.field}>{match.field}</option>
														{/if}
													</select>
											</div>
										{:else}
											<div class="d-flex gap-1">
												<input type="number" class="form-control form-control-sm" placeholder="0" bind:value={tempScores[match.id].score1} min="0" max={getScoreRules(match.category || '').maxScore + 10}>
												<input type="number" class="form-control form-control-sm" placeholder="0" bind:value={tempScores[match.id].score2} min="0" max={getScoreRules(match.category || '').maxScore + 10}>
												<!-- svelte-ignore a11y_consider_explicit_label -->
												<button class="btn btn-success btn-sm" on:click={() => setGroupResult(match.id, tempScores[match.id].score1, tempScores[match.id].score2)}>
													<i class="bi bi-check"></i>
												</button>
											</div>
											<select class="form-select form-select-sm mt-1" bind:value={match.field} on:change={() => setFieldForMatch(match.id, match.field!)}>
												<option value={undefined}>Campo</option>
												{#each getAvailableFields(match.id) as field}
											<option value={field}>{field}</option>
													{/each}
													{#if match.field && !getAvailableFields(match.id).includes(match.field)}
													<option value={match.field}>{match.field}</option>
												{/if}
													</select>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{:else if currentPhase === 'knockout'}
		<div class="d-flex justify-content-between align-items-center mb-3">
			<h4 class="mb-0">Eliminazione Diretta</h4>
		</div>

		{#each categories as category}
			<div class="card mb-4">
				<div class="card-header bg-warning text-dark">
					<h5 class="mb-0">{category}</h5>
				</div>
				<div class="card-body">
					{#each knockoutRoundsByCategory[category] || [] as round}
						<h6 class="fw-bold">
							{round === Math.max(...(knockoutRoundsByCategory[category] || [])) ? 'FINALE' : `Turno ${round}`}
						</h6>
						<div class="row g-2 mb-3">
							{#each knockoutMatches.filter(m => m.category === category && m.round === round) as match}
								<div class="col-md-6 col-lg-4">
									<div class="card card-body p-2 {match.w ? 'border-warning' : ''}">
										<div class="d-flex justify-content-between align-items-center mb-2">
											<small class="text-muted">
												{match.t1?.teamName || 'TBD'} vs {match.t2?.teamName || 'TBD'}
											</small>
											{#if match.field}
												<span class="badge bg-secondary">Campo {match.field}</span>
											{/if}
										</div>
										
										{#if match.t1 && match.t2}
											{#if match.w}
												<div class="text-center">
													<strong class="text-warning">Vincitore: {match.w.teamName}</strong>
												</div>
											{:else}
												<div class="d-flex gap-1">
													<button class="btn btn-outline-primary btn-sm flex-fill" on:click={() => setKnockoutWinner(match.id, match.t1!)}>
														{match.t1.teamName}
													</button>
													<button class="btn btn-outline-primary btn-sm flex-fill" on:click={() => setKnockoutWinner(match.id, match.t2!)}>
														{match.t2.teamName}
													</button>
												</div>
											{/if}
											<select class="form-select form-select-sm mt-1" bind:value={match.field} on:change={() => setFieldForMatch(match.id, match.field!, true)}>
												<option value={undefined}>Campo</option>
												{#each fields as field}
													<option value={field}>{field}</option>
												{/each}
											</select>
										{:else}
											<div class="text-center text-muted">
												<small>In attesa dei risultati precedenti</small>
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
	{:else if currentPhase === 'finished'}
		<div class="text-center">
			<h2 class="text-success mb-4">🏆 TORNEO COMPLETATO!</h2>
			 
			<div class="card">
				<div class="card-header bg-success text-white">
					<h3>VINCITORI</h3>
				</div>
				<div class="card-body">
					{#each categories as category}
						{#if winner[category]}
							<div class="row mb-3">
								<div class="col-md-6 offset-md-3">
									<div class="alert alert-success">
										<h4 class="mb-2">🏆 {category}</h4>
										<h5 class="text-primary">{winner[category].teamName}</h5>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>

			<div class="card mt-4">
				<div class="card-header bg-primary text-white">
					<h4>STATISTICHE TORNEO</h4>
				</div>
				<div class="card-body">
					<div class="row text-center">
						<div class="col-3">
							<h5>{teams.length}</h5>
							<p class="text-muted mb-0">Squadre</p>
						</div>
						<div class="col-3">
							<h5>{categories.length}</h5>
							<p class="text-muted mb-0">Categorie</p>
						</div>
						<div class="col-3">
							<h5>{groupMatches.length + knockoutMatches.length}</h5>
							<p class="text-muted mb-0">Partite</p>
						</div>
						<div class="col-3">
							<h5>{fields.length}</h5>
							<p class="text-muted mb-0">Campi</p>
						</div>
					</div>
				</div>
			</div>

			<div class="mt-4">
				<button class="btn btn-primary me-2" on:click={exportResults}>
					<i class="bi bi-download"></i> Esporta
				</button>
				<button class="btn btn-outline-secondary me-2" on:click={printResults}>
					<i class="bi bi-printer"></i> Stampa
				</button>
				<button class="btn btn-success" on:click={reset}>
					<i class="bi bi-arrow-clockwise"></i> Nuovo Torneo
				</button>
			</div>
		</div>
	{/if}
</div>