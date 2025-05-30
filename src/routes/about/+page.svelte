<script lang="ts">
	import { registeredTeams, type Team } from '$lib/stores/teams';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

	let teams: Team[] = [];
	let matches = [];
	let started = false;
	let winner = null;

	onMount(() => teams = get(registeredTeams));

	function startTournament() {
		if (teams.length < 2) return alert('Servono almeno 2 squadre!');
		
		const shuffled = [...teams].sort(() => Math.random() - 0.5);
		matches = [];
		let round = 1;
		let current = [];
		
		for (let i = 0; i < shuffled.length; i += 2) {
			current.push({
				id: `${round}-${i/2}`,
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
				next.push({ id: `${round}-${i/2}`, t1: null, t2: null, w: null, round });
			}
			matches = [...matches, ...next];
			current = next;
		}
		
		started = true;
		winner = null;
	}

	function setWinner(id, w) {
		matches = matches.map(m => m.id === id ? {...m, w} : m);
		
		const match = matches.find(m => m.id === id);
		const nextRound = matches.filter(m => m.round === match.round + 1);
		const nextMatch = nextRound[Math.floor(parseInt(match.id.split('-')[1]) / 2)];
		
		if (nextMatch) {
			matches = matches.map(m => {
				if (m.id === nextMatch.id) {
					return parseInt(match.id.split('-')[1]) % 2 === 0 
						? {...m, t1: w} 
						: {...m, t2: w};
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
</svelte:head>

<div class="container">
	<h1>Torneo Eliminazione Diretta</h1>

	{#if !started}
		<div class="teams">
			<h2>Squadre ({teams.length})</h2>
			{#if teams.length === 0}
				<p>Nessuna squadra registrata</p>
			{:else}
				{#each teams as team}
					<div class="team">
						<h3>{team.teamName}</h3>
						<p>{team.category} - {team.coachName}</p>
					</div>
				{/each}
				<button on:click={startTournament}>Inizia Torneo</button>
			{/if}
		</div>
	{:else}
		{#if winner}
			<div class="champion">
				<h2>🏆 VINCITORE: {winner.teamName} 🏆</h2>
			</div>
		{/if}

		<div class="bracket">
			{#each rounds as round}
				<div class="round">
					<h3>{round === Math.max(...rounds) ? 'FINALE' : `TURNO ${round}`}</h3>
					{#each matches.filter(m => m.round === round) as match}
						<div class="match">
							<div class="vs">
								<div class:winner={match.w === match.t1}>{match.t1?.teamName || 'TBD'}</div>
								<div class:winner={match.w === match.t2}>{match.t2?.teamName || 'TBD'}</div>
							</div>
							{#if match.t1 && match.t2 && !match.w}
								<button on:click={() => setWinner(match.id, match.t1)}>
									{match.t1.teamName}
								</button>
								<button on:click={() => setWinner(match.id, match.t2)}>
									{match.t2.teamName}
								</button>
							{:else if match.w}
								<p>Vince: {match.w.teamName}</p>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>

		<button on:click={reset}>Reset</button>
	{/if}
</div>

<style>
	.container {
	max-width: 1200px;
	margin: 2rem auto;
	padding: 2rem;
	background: white;
	border-radius: 20px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	font-family: 'Segoe UI', sans-serif;
}

h1 {
	text-align: center;
	font-size: 3rem;
	margin-bottom: 2rem;
	color: #2c3e50;
}

.teams {
	background: #f0f4f8;
	padding: 2rem;
	border-radius: 20px;
	margin-bottom: 2rem;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.team {
	background: white;
	padding: 1rem;
	margin: 1rem 0;
	border-radius: 16px;
	border: 1px solid #ddd;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
	transition: transform 0.2s ease;
}
.team:hover {
	transform: scale(1.01);
}

.team h3 {
	margin: 0;
	color: #34495e;
	font-size: 1.2rem;
}

.team p {
	margin: 0.5rem 0 0 0;
	color: #7f8c8d;
}

.champion {
	text-align: center;
	background: linear-gradient(to right, #fbc531, #f5a623);
	padding: 2rem;
	border-radius: 20px;
	margin-bottom: 2rem;
	color: #2d3436;
	font-size: 1.5rem;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bracket {
	display: flex;
	gap: 2rem;
	overflow-x: auto;
	padding: 1rem 0;
}

.round {
	min-width: 220px;
}

.round h3 {
	text-align: center;
	padding: 0.5rem;
	background: #dff0ff;
	border-radius: 16px;
	color: #34495e;
	font-weight: bold;
}

.match {
	background: white;
	border: 1px solid #ddd;
	border-radius: 16px;
	padding: 1rem;
	margin: 1rem 0;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.vs div {
	padding: 0.5rem;
	margin: 0.2rem 0;
	background: #ecf0f1;
	border-radius: 10px;
	text-align: center;
	transition: background 0.2s ease;
}

.vs .winner {
	background: #27ae60;
	color: white;
	font-weight: bold;
}

button {
	padding: 0.5rem 1.2rem;
	background: #2980b9;
	color: white;
	border: none;
	border-radius: 12px;
	margin: 0.3rem;
	cursor: pointer;
	transition: background 0.3s ease;
	font-weight: bold;
}

button:hover {
	background: #1c5980;
}
