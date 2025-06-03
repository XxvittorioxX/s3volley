<script lang="ts">
	import { registeredTeams, type Team } from '$lib/stores/teams';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

	let teams: Team[] = [];
	let matches: any[] = [];
	let started = false;
	let winner: { teamName: any } | null = null;

	onMount(() => teams = get(registeredTeams));

	function startTournament() {
		if (teams.length < 2) return alert('Servono almeno 2 squadre!');

		const shuffled = [...teams].sort(() => Math.random() - 0.5);
		matches = [];
		let round = 1;
		let current = [];

		for (let i = 0; i < shuffled.length; i += 2) {
			current.push({
				id: `${round}-${i / 2}`,
				t1: shuffled[i],
				t2: shuffled[i + 1] || null,
				w: shuffled[i + 1] ? null : shuffled[i],
				round
			});
		}
		matches = [...current];

		while (current.length > 1) {
			round++;
			const next = [];
			for (let i = 0; i < current.length; i += 2) {
				next.push({ id: `${round}-${i / 2}`, t1: null, t2: null, w: null, round });
			}
			matches = [...matches, ...next];
			current = next;
		}

		started = true;
		winner = null;
	}

	function setWinner(id: any, w: any) {
		matches = matches.map(m => m.id === id ? { ...m, w } : m);

		const match = matches.find(m => m.id === id);
		const nextRound = matches.filter(m => m.round === match.round + 1);
		const nextMatch = nextRound[Math.floor(parseInt(match.id.split('-')[1]) / 2)];

		if (nextMatch) {
			matches = matches.map(m => {
				if (m.id === nextMatch.id) {
					return parseInt(match.id.split('-')[1]) % 2 === 0
						? { ...m, t1: w }
						: { ...m, t2: w };
				}
				return m;
			});
		}

		const final = matches.find(m => m.round === Math.max(...matches.map(m => m.round)));
		if (final?.w) winner = final.w;
	}

	function reset() {
		matches = [];
		started = false;
		winner = null;
	}

	$: rounds = [...new Set(matches.map(m => m.round))].sort();
</script>

<svelte:head>
	<title>Torneo Eliminazione Diretta</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
</svelte:head>

<div class="container my-5 p-4 bg-white rounded shadow">
	<h1 class="text-center mb-5">Torneo Eliminazione Diretta</h1>

	{#if !started}
		<div class="mb-4">
			<h2>Squadre ({teams.length})</h2>
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
				<button class="btn btn-primary" on:click={startTournament}>Inizia Torneo</button>
			{/if}
		</div>
	{:else}
		{#if winner}
			<div class="alert alert-warning text-center fs-4 fw-bold py-3">
				🏆 VINCITORE: {winner.teamName} 🏆
			</div>
		{/if}

		<div class="d-flex flex-wrap gap-4 justify-content-center mb-4 overflow-auto">
			{#each rounds as round}
				<div class="border rounded p-3" style="min-width: 250px; max-width: 250px;">
					<h3 class="text-center mb-3">{round === Math.max(...rounds) ? 'FINALE' : `TURNO ${round}`}</h3>
					{#each matches.filter(m => m.round === round) as match}
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
											on:click={() => setWinner(match.id, match.t1)}>
											{match.t1.teamName}
										</button>
										<button class="btn btn-outline-primary btn-sm flex-grow-1"
											on:click={() => setWinner(match.id, match.t2)}>
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

		<div class="text-center">
			<button class="btn btn-danger" on:click={reset}>Reset</button>
		</div>
	{/if}
</div>
