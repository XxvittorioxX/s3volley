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
	}

	// Tournament main state
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

	const fields = Array.from({ length: 20 }, (_, i) => i + 1);

	onMount(() => {
		teams = get(registeredTeams);
		categories = [...new Set(teams.map(t => t.category))];
	});

	// Scoring rules for different categories
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

	function isValidScore(score1: number, score2: number, category: string): boolean {
		const requiredAdvantage = getAdvantageForCategory(category);
		const baseScore = getBaseScoreForCategory(category);
		const minScore = Math.min(score1, score2);
		const maxScore = Math.max(score1, score2);
		const scoreDiff = Math.abs(score1 - score2);

		if (minScore < baseScore) {
			return maxScore >= baseScore && scoreDiff >= 1;
		}
		if (minScore >= baseScore) {
			return scoreDiff >= requiredAdvantage;
		}
		return true;
	}

	function getCategoryRules(category: string): string {
		const advantage = getAdvantageForCategory(category);
		const baseScore = getBaseScoreForCategory(category);
		return `Si vince a ${baseScore} punti. In parità da ${baseScore}-${baseScore}, serve vantaggio di ${advantage}`;
	}

	function initTempScore(matchId: string) {
		if (!tempScores[matchId]) {
			tempScores[matchId] = { score1: 0, score2: 0 };
		}
	}

	// Create groups based on number of teams per category
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

				// Generate all possible matches 
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

		groupStandings = { ...groupStandings };
		currentPhase = 'group';
	}

	// Recalculate group standings with 3-1-0 point system
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

				const category = match.category || '';
				const requiredAdvantage = getAdvantageForCategory(category);
				const scoreDiff = Math.abs(match.score1! - match.score2!);

				if (match.score1! !== match.score2!) {
					if (scoreDiff >= requiredAdvantage) {
						if (match.score1! > match.score2!) {
							standing1.won++; 
							standing1.points += 3; 
							standing2.lost++;
						} else {
							standing2.won++; 
							standing2.points += 3; 
							standing1.lost++;
						}
					} else {
						const minScore = Math.min(match.score1!, match.score2!);
						const baseScore = getBaseScoreForCategory(category);
						
						if (minScore < baseScore) {
							if (match.score1! > match.score2!) {
								standing1.won++; 
								standing1.points += 3; 
								standing2.lost++;
							} else {
								standing2.won++; 
								standing2.points += 3; 
								standing1.lost++;
							}
						} else {
							console.warn(`Risultato non valido: ${match.score1!}-${match.score2!}. Serve vantaggio di ${requiredAdvantage}`);
						}
					}
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
			const baseScore = getBaseScoreForCategory(match.category);
			const advantage = getAdvantageForCategory(match.category);
			
			alert(`Punteggio non valido per ${match.category}!\n${getCategoryRules(match.category)}\n\nEsempi validi:\n- ${baseScore}-${baseScore-2}\n- ${baseScore+advantage}-${baseScore}`);
			return;
		}

		match.score1 = score1; 
		match.score2 = score2;
		match.w = score1 > score2 ? match.t1 : score1 < score2 ? match.t2 : null;

		recalculateGroupStanding(match.group);
		groupStandings = { ...groupStandings };
		groupMatches = [...groupMatches];
	}

	function setFieldForMatch(matchId: string, field: number, isKnockout = false) {
		const matches = isKnockout ? knockoutMatches : groupMatches;
		const match = matches.find(m => m.id === matchId);
		if (match) {
			match.field = field;
			if (isKnockout) {
				knockoutMatches = [...knockoutMatches];
			} else {
				groupMatches = [...groupMatches];
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
	}

	// Create knockout bracket: top 2 teams from each group qualify
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

			groupsByCategory[category].forEach(groupName => {
				const standings = groupStandings[groupName];
				if (standings && standings.length >= 2) {
					firstPlaces.push(standings[0].team);
					secondPlaces.push(standings[1].team);
				}
			});

			// Shuffle to avoid predictable matchups
			const shuffledFirsts = [...firstPlaces].sort(() => Math.random() - 0.5);
			const shuffledSeconds = [...secondPlaces].sort(() => Math.random() - 0.5);

			let round = 1;
			let current: Match[] = [];

			// First round: firsts vs seconds
			for (let i = 0; i < Math.min(shuffledFirsts.length, shuffledSeconds.length); i++) {
				current.push({
					id: `ko-${category}-${round}-${i}`, 
					t1: shuffledFirsts[i], 
					t2: shuffledSeconds[i],
					w: null, 
					round, 
					phase: 'knockout', 
					category, 
					field: undefined
				});
			}

			// Remaining teams against each other
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
						category, 
						field: undefined
					});
				}
			}

			knockoutMatches = [...knockoutMatches, ...current];

			// Generate subsequent rounds up to final
			while (current.length > 1) {
				round++;
				const next: Match[] = [];
				for (let i = 0; i < current.length; i += 2) {
					next.push({ 
						id: `ko-${category}-${round}-${i/2}`, 
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
	}

	// Advance winner in bracket and check if tournament is finished
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
	
	// FIX: Filter out undefined rounds before processing
	$: knockoutRoundsByCategory = categories.reduce((acc, category) => {
		const rounds = knockoutMatches
			.filter(m => m.category === category)
			.map(m => m.round)
			.filter((round): round is number => round !== undefined); // TYPE GUARD: removes undefined values
		acc[category] = [...new Set(rounds)].sort();
		return acc;
	}, {} as { [key: string]: number[] });

	$: allGroupMatchesPlayed = groupMatches.length > 0 && groupMatches.every(m => m.score1 !== undefined && m.score2 !== undefined);
</script>

<svelte:head>
	<title> Torneo Volley S3 </title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
</svelte:head>

<div class="container my-5 p-4 bg-white rounded shadow">
	<h1 class="text-center mb-4"> Torneo Volley S3- Sistema Avanzato</h1>

	{#if currentPhase === 'setup'}
		<div class="mb-4">
			<h2>Squadre per Categoria</h2>
			{#if teams.length === 0}
				<p class="text-muted">Nessuna squadra registrata</p>
			{:else}
				{#each categories as category}
					<div class="card mb-3">
						<div class="card-header d-flex justify-content-between">
							<h4>{category} ({teams.filter(t => t.category === category).length})</h4>
							<small class="text-muted">{getCategoryRules(category)}</small>
						</div>
						<div class="card-body">
							{#each teams.filter(t => t.category === category) as team}
								<div class="d-flex justify-content-between mb-2 p-2 border rounded">
									<strong>{team.teamName}</strong>
									<small>{team.coachName}</small>
								</div>
							{/each}
						</div>
					</div>
				{/each}
				<button class="btn btn-primary btn-lg" on:click={createGroups}>🚀 Crea Gironi</button>
			{/if}
		</div>

	{:else if currentPhase === 'group'}
		<div class="mb-4">
			<h2>Fase Gironi</h2>
			
			{#each categories as category}
				<div class="mb-4">
					<h3 class="text-primary">{category}</h3>
					<div class="badge bg-info mb-3">{getCategoryRules(category)}</div>
					
					{#each groupsByCategory[category] || [] as groupName}
						<div class="card mb-3">
							<div class="card-header">
								<h5>{groupName.split('_').slice(1).join(' ')}</h5>
							</div>
							<div class="card-body">
								{#each groupMatches.filter(m => m.group === groupName) as match}
									<div class="card mb-2">
										<div class="card-body p-2">
											<div class="row align-items-center">
												<div class="col-2 text-end">{match.t1?.teamName}</div>
												<div class="col-6 text-center">
													{#if match.score1 !== undefined && match.score2 !== undefined}
														<span class="badge bg-primary fs-6">{match.score1}-{match.score2}</span>
														<button class="btn btn-sm btn-outline-secondary ms-2" on:click={() => resetMatchResult(match.id)}>Reset</button>
													{:else}
														<div class="d-flex justify-content-center gap-2 mb-2">
															<input type="number" class="form-control form-control-sm text-center" 
																bind:value={tempScores[match.id].score1} min="0" style="width: 60px;">
															<span>-</span>
															<input type="number" class="form-control form-control-sm text-center" 
																bind:value={tempScores[match.id].score2} min="0" style="width: 60px;">
														</div>
														<button class="btn btn-sm btn-success"
															on:click={() => setGroupResult(match.id, tempScores[match.id].score1 || 0, tempScores[match.id].score2 || 0)}>
															Conferma
														</button>
													{/if}
												</div>
												<div class="col-2">{match.t2?.teamName}</div>
												<div class="col-2">
													<select class="form-select form-select-sm" 
														bind:value={match.field}
														on:change={() => setFieldForMatch(match.id, match.field || 1)}>
														<option value={undefined}>Campo</option>
														{#each fields as field}
															<option value={field}>{field}</option>
														{/each}
													</select>
												</div>
											</div>
										</div>
									</div>
								{/each}
								
								<div class="mt-3">
									<h6>Classifica</h6>
									<table class="table table-sm">
										<thead><tr><th>Pos</th><th>Squadra</th><th>P</th><th>V</th><th>N</th><th>S</th><th>Punti</th></tr></thead>
										<tbody>
											{#each groupStandings[groupName] || [] as standing, i}
												<tr class="{i < 2 ? 'table-success' : ''}">
													<td>{i + 1}</td><td>{standing.team.teamName}</td>
													<td>{standing.played}</td><td>{standing.won}</td>
													<td>{standing.drawn}</td><td>{standing.lost}</td>
													<td><strong>{standing.points}</strong></td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/each}

			{#if allGroupMatchesPlayed}
				<div class="text-center">
					<button class="btn btn-success btn-lg" on:click={startKnockoutPhase}>🏆 Eliminazione Diretta</button>
				</div>
			{/if}
		</div>

	{:else if currentPhase === 'knockout'}
		<div class="mb-4">
			<h2>Eliminazione Diretta</h2>

			{#each categories as category}
				<div class="mb-4">
					<h3 class="text-primary">{category}</h3>
					<div class="d-flex gap-3 overflow-auto">
						{#each knockoutRoundsByCategory[category] || [] as round}
							<div class="border rounded p-3" style="min-width: 280px;">
								<h5 class="text-center">
									{round === Math.max(...(knockoutRoundsByCategory[category] || [])) ? '🏆 FINALE' : 
									 round === Math.max(...(knockoutRoundsByCategory[category] || [])) - 1 ? 'SEMIFINALE' : `TURNO ${round}`}
								</h5>
								{#each knockoutMatches.filter(m => m.round === round && m.category === category) as match}
									<div class="card mb-2">
										<div class="card-body p-2">
											<div class="d-flex flex-column gap-1 mb-2">
												<div class="p-1 rounded {match.w === match.t1 ? 'bg-success text-white' : 'bg-light'}">
													{match.t1?.teamName || 'TBD'}
												</div>
												<div class="p-1 rounded {match.w === match.t2 ? 'bg-success text-white' : 'bg-light'}">
													{match.t2?.teamName || 'TBD'}
												</div>
											</div>

											<select class="form-select form-select-sm mb-2" 
												bind:value={match.field}
												on:change={() => setFieldForMatch(match.id, match.field || 1, true)}>
												<option value={undefined}>Campo</option>
												{#each fields as field}<option value={field}>{field}</option>{/each}
											</select>

											{#if match.t1 && match.t2 && !match.w}
												<div class="d-flex gap-1">
													<button class="btn btn-sm btn-outline-primary flex-grow-1" 
														on:click={() => setKnockoutWinner(match.id, match.t1!)}>
														{match.t1.teamName}
													</button>
													<button class="btn btn-sm btn-outline-primary flex-grow-1" 
														on:click={() => setKnockoutWinner(match.id, match.t2!)}>
														{match.t2.teamName}
													</button>
												</div>
											{:else if match.w}
												<div class="text-center">
													<span class="badge bg-success">🎉 {match.w.teamName}</span>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/each}
					</div>

					{#if winner[category]}
						<div class="alert alert-success text-center mt-3">
							<h4>🏆 VINCITORE {category}: {winner[category]?.teamName}</h4>
						</div>
					{/if}
				</div>
			{/each}
		</div>

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
							<div class="alert alert-light border-success mb-2">
								<h4>🏆 {category}: {winner[category]?.teamName}</h4>
								<small>Coach: {winner[category]?.coachName}</small>
							</div>
						{/if}
					{/each}
				</div>
			</div>

			<button class="btn btn-outline-primary btn-lg mt-4" on:click={reset}>🔄 Nuovo Torneo</button>
		</div>
	{/if}

	{#if currentPhase !== 'setup'}
		<div class="text-center mt-4 pt-3 border-top">
			<button class="btn btn-outline-danger" on:click={reset}>🔄 Reset Completo</button>
		</div>
	{/if}
</div>

<style>
	.card { 
		box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
	}
	.card-header { 
		background-color: #f8f9fa; 
		font-weight: 600; 
	}
</style>