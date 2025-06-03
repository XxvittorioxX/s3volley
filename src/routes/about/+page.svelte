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
	let winner: Team | null = null;
	let qualifiedTeams: Team[] = [];

	onMount(() => teams = get(registeredTeams));

	function createGroups() {
		if (teams.length < 4) {
			alert('Servono almeno 4 squadre per i gironi!');
			return;
		}

		// Calcola numero di gironi (4 squadre per girone, minimo 2 gironi)
		const numGroups = Math.max(2, Math.ceil(teams.length / 4));
		const shuffled = [...teams].sort(() => Math.random() - 0.5);
		
		groups = {};
		const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
		
		// Distribuisci squadre nei gironi
		for (let i = 0; i < numGroups; i++) {
			const groupName = groupNames[i];
			groups[groupName] = [];
		}

		shuffled.forEach((team, index) => {
			const groupIndex = index % numGroups;
			const groupName = groupNames[groupIndex];
			groups[groupName].push(team);
		});

		// Crea partite dei gironi
		groupMatches = [];
		Object.entries(groups).forEach(([groupName, groupTeams]) => {
			for (let i = 0; i < groupTeams.length; i++) {
				for (let j = i + 1; j < groupTeams.length; j++) {
					groupMatches.push({
						id: `${groupName}-${i}-${j}`,
						t1: groupTeams[i],
						t2: groupTeams[j],
						w: null,
						score1: 0,
						score2: 0,
						group: groupName,
						phase: 'group'
					});
				}
			}
		});

		// Inizializza classifiche gironi
		groupStandings = {};
		Object.entries(groups).forEach(([groupName, groupTeams]) => {
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
		});

		currentPhase = 'group';
	}

	function setGroupResult(matchId: string, score1: number, score2: number) {
		const match = groupMatches.find(m => m.id === matchId);
		if (!match || !match.t1 || !match.t2) return;

		match.score1 = score1;
		match.score2 = score2;
		match.w = score1 > score2 ? match.t1 : score1 < score2 ? match.t2 : null;

		// Aggiorna classifiche
		const standing1 = groupStandings[match.group!].find(s => s.team === match.t1);
		const standing2 = groupStandings[match.group!].find(s => s.team === match.t2);

		if (standing1 && standing2) {
			// Reset previous result if any
			if (match.score1 !== undefined && match.score2 !== undefined) {
				// Remove old stats (simplified approach - in real app you'd track this better)
			}

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
	}

	function startKnockoutPhase() {
		// Prendi le prime 2 di ogni girone
		qualifiedTeams = [];
		Object.values(groupStandings).forEach(standings => {
			qualifiedTeams.push(...standings.slice(0, 2).map(s => s.team));
		});

		if (qualifiedTeams.length < 2) {
			alert('Non ci sono abbastanza squadre qualificate!');
			return;
		}

		// Crea eliminazione diretta
		const shuffled = [...qualifiedTeams].sort(() => Math.random() - 0.5);
		knockoutMatches = [];
		let round = 1;
		let current = [];

		for (let i = 0; i < shuffled.length; i += 2) {
			current.push({
				id: `ko-${round}-${i / 2}`,
				t1: shuffled[i],
				t2: shuffled[i + 1] || null,
				w: shuffled[i + 1] ? null : shuffled[i],
				round,
				phase: 'knockout' as const
			});
		}
		knockoutMatches = [...current];

		while (current.length > 1) {
			round++;
			const next = [];
			for (let i = 0; i < current.length; i += 2) {
				next.push({ id: `ko-${round}-${i / 2}`, t1: null, t2: null, w: null, round, phase: 'knockout' as const });
			}
			knockoutMatches = [...knockoutMatches, ...next];
			current = next;
		}

		currentPhase = 'knockout';
	}

	function setKnockoutWinner(id: string, w: Team) {
		knockoutMatches = knockoutMatches.map(m => m.id === id ? { ...m, w } : m);

		const match = knockoutMatches.find(m => m.id === id);
		if (!match) return;

		const nextRound = knockoutMatches.filter(m => m.round === match.round! + 1);
		const nextMatch = nextRound[Math.floor(parseInt(match.id.split('-')[2]) / 2)];

		if (nextMatch) {
			knockoutMatches = knockoutMatches.map(m => {
				if (m.id === nextMatch.id) {
					return parseInt(match.id.split('-')[2]) % 2 === 0
						? { ...m, t1: w }
						: { ...m, t2: w };
				}
				return m;
			});
		}

		const final = knockoutMatches.find(m => m.round === Math.max(...knockoutMatches.map(m => m.round!)));
		if (final?.w) {
			winner = final.w;
			currentPhase = 'finished';
		}
	}

	function reset() {
		groupMatches = [];
		knockoutMatches = [];
		groupStandings = {};
		groups = {};
		currentPhase = 'setup';
		winner = null;
		qualifiedTeams = [];
	}

	$: knockoutRounds = [...new Set(knockoutMatches.map(m => m.round))].sort();
	$: allGroupMatchesPlayed = groupMatches.length > 0 && groupMatches.every(m => m.w !== null || (m.score1 === m.score2 && m.score1 !== undefined));
</script>

<svelte:head>
	<title>Torneo con Gironi e Eliminazione Diretta</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
</svelte:head>

<div class="container my-5 p-4 bg-white rounded shadow">
	<h1 class="text-center mb-5">Torneo con Gironi e Eliminazione Diretta</h1>

	{#if currentPhase === 'setup'}
		<div class="mb-4">
			<h2>Squadre Registrate ({teams.length})</h2>
			{#if teams.length === 0}
				<p class="text-muted">Nessuna squadra registrata</p>
			{:else}
				<div class="list-group mb-3">
					{#each teams as team}
						<div class="list-group-item d-flex justify-content-between align-items-center">
							<div>
								<h5 class="mb-1">{team.teamName}</h5>
								<small class="text-secondary">{team.category} - {team.coachName}</small>
							</div>
						</div>
					{/each}
				</div>
				<button class="btn btn-primary" on:click={createGroups}>Crea Gironi e Inizia Torneo</button>
			{/if}
		</div>

	{:else if currentPhase === 'group'}
		<div class="mb-4">
			<h2>Fase a Gironi</h2>
			
			<!-- Partite dei Gironi -->
			<div class="row">
				{#each Object.entries(groups) as [groupName, groupTeams]}
					<div class="col-md-6 mb-4">
						<div class="card">
							<div class="card-header">
								<h4>Girone {groupName}</h4>
							</div>
							<div class="card-body">
								<!-- Partite del girone -->
								{#each groupMatches.filter(m => m.group === groupName) as match}
									<div class="card mb-2">
										<div class="card-body p-2">
											<div class="row align-items-center">
												<div class="col-4 text-end">{match.t1?.teamName}</div>
												<div class="col-4 text-center">
													{#if match.score1 !== undefined && match.score2 !== undefined}
														<span class="badge bg-primary">{match.score1} - {match.score2}</span>
													{:else}
														<div class="d-flex">
															<input type="number" class="form-control form-control-sm me-1" 
																bind:value={match.score1} min="0" style="width: 50px;">
															<input type="number" class="form-control form-control-sm ms-1" 
																bind:value={match.score2} min="0" style="width: 50px;">
														</div>
														<button class="btn btn-sm btn-outline-primary mt-1"
															on:click={() => setGroupResult(match.id, match.score1 || 0, match.score2 || 0)}>
															Conferma
														</button>
													{/if}
												</div>
												<div class="col-4">{match.t2?.teamName}</div>
											</div>
										</div>
									</div>
								{/each}

								<!-- Classifica del girone -->
								<div class="mt-3">
									<h6>Classifica</h6>
									<div class="table-responsive">
										<table class="table table-sm">
											<thead>
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
														<td>{index + 1}</td>
														<td>{standing.team.teamName}</td>
														<td>{standing.played}</td>
														<td>{standing.won}</td>
														<td>{standing.drawn}</td>
														<td>{standing.lost}</td>
														<td>{standing.goalsFor}</td>
														<td>{standing.goalsAgainst}</td>
														<td>{standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}</td>
														<td><strong>{standing.points}</strong></td>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>

			{#if allGroupMatchesPlayed}
				<div class="text-center mt-4">
					<button class="btn btn-success btn-lg" on:click={startKnockoutPhase}>
						Inizia Fase Eliminazione Diretta
					</button>
				</div>
			{/if}
		</div>

	{:else if currentPhase === 'knockout'}
		<div class="mb-4">
			<h2>Fase Eliminazione Diretta</h2>
			<p class="text-muted mb-4">Squadre qualificate: {qualifiedTeams.map(t => t.teamName).join(', ')}</p>

			<div class="d-flex flex-wrap gap-4 justify-content-center overflow-auto">
				{#each knockoutRounds as round}
					<div class="border rounded p-3" style="min-width: 250px; max-width: 250px;">
						<h3 class="text-center mb-3">
							{round === Math.max(...knockoutRounds) ? 'FINALE' : 
							 round === Math.max(...knockoutRounds) - 1 ? 'SEMIFINALE' :
							 round === Math.max(...knockoutRounds) - 2 ? 'QUARTI' : `TURNO ${round}`}
						</h3>
						{#each knockoutMatches.filter(m => m.round === round) as match}
							<div class="card mb-3">
								<div class="card-body p-2">
									<div class="d-flex flex-column gap-1">
										<div class="p-2 rounded 
											{match.w === match.t1 ? 'bg-success text-white' : 'bg-light'}">
											{match.t1?.teamName || 'TBD'}
										</div>
										<div class="p-2 rounded 
											{match.w === match.t2 ? 'bg-success text-white' : 'bg-light'}">
											{match.t2?.teamName || 'TBD'}
										</div>
									</div>

									{#if match.t1 && match.t2 && !match.w}
										<div class="d-flex justify-content-between mt-3">
											<button class="btn btn-outline-primary btn-sm flex-grow-1 me-2"
												on:click={() => setKnockoutWinner(match.id, match.t1)}>
												{match.t1.teamName}
											</button>
											<button class="btn btn-outline-primary btn-sm flex-grow-1"
												on:click={() => setKnockoutWinner(match.id, match.t2)}>
												{match.t2.teamName}
											</button>
										</div>
									{:else if match.w}
										<p class="mt-3 mb-0 text-center fw-semibold">Vince: {match.w.teamName}</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>

	{:else if currentPhase === 'finished'}
		<div class="alert alert-warning text-center fs-4 fw-bold py-3">
			🏆 VINCITORE DEL TORNEO: {winner?.teamName} 🏆
		</div>
	{/if}

	<div class="text-center mt-4">
		<button class="btn btn-danger" on:click={reset}>Reset Torneo</button>
	</div>
</div>