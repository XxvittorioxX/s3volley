// File: src/routes/gironi/page.svelte

<script lang="ts">
	import { onMount } from 'svelte';
	import { registeredTeams } from '$lib/stores/teams';
	import { get } from 'svelte/store';

	type Match = {
		round: number;
		team1: string;
		team2: string;
		winner: string | null;
	};

	let matches: Match[] = [];
	let currentRound = 1;
	let completed = false;

	function generateBracket(teams: string[]) {
		let roundTeams = [...teams];
		let round = 1;
		const allMatches: Match[] = [];

		while (roundTeams.length > 1) {
			if (roundTeams.length % 2 === 1) {
				roundTeams.push('BYE');
			}

			const nextRoundTeams: string[] = [];
			for (let i = 0; i < roundTeams.length; i += 2) {
				const t1 = roundTeams[i];
				const t2 = roundTeams[i + 1];
				const winner = t2 === 'BYE' ? t1 : null;
				allMatches.push({ round, team1: t1, team2: t2, winner });
				if (winner) nextRoundTeams.push(winner);
			}
			roundTeams = nextRoundTeams;
			round++;
		}

		matches = allMatches;
		currentRound = round - 1;
		completed = false;
	}

	function selectWinner(match: Match, team: string) {
		match.winner = team;

		const thisRound = match.round;
		const nextRound = thisRound + 1;
		const roundMatches = matches.filter(m => m.round === nextRound);

		let inserted = false;
		for (const m of roundMatches) {
			if (m.team1 === 'BYE') {
				m.team1 = team;
				inserted = true;
				break;
			} else if (m.team2 === 'BYE') {
				m.team2 = team;
				inserted = true;
				break;
			}
		}

		if (!inserted && roundMatches.length * 2 < matches.filter(m => m.round === thisRound).length) {
			matches.push({ round: nextRound, team1: team, team2: 'BYE', winner: team });
		}

		if (matches.filter(m => m.round === currentRound).every(m => m.winner)) {
			completed = matches.filter(m => m.round === currentRound).length === 1;
		}
	}

	onMount(() => {
		const teams = get(registeredTeams).map(t => t.teamName);
		if (teams.length >= 2) generateBracket(teams);
	});
</script>

<section>
	<h1>Eliminazione Diretta</h1>
	{#if matches.length === 0}
		<p>Registra almeno due squadre per iniziare il torneo.</p>
	{:else}
		{#each Array(currentRound) as _, r}
			<h2>Turno {r + 1}</h2>
			<ul>
				{#each matches.filter(m => m.round === r + 1) as match}
					<li>
						<strong>{match.team1}</strong> vs <strong>{match.team2}</strong>
						{#if match.winner === null && match.team2 !== 'BYE'}
							<button on:click={() => selectWinner(match, match.team1)}>{match.team1} vince</button>
							<button on:click={() => selectWinner(match, match.team2)}>{match.team2} vince</button>
						{:else if match.winner}
							<p><em>Vincitore: {match.winner}</em></p>
						{/if}
					</li>
				{/each}
			</ul>
		{/each}
		{#if completed}
			<h2>🏆 Vincitore del Torneo: {matches.find(m => m.round === currentRound)?.winner}</h2>
		{/if}
	{/if}
</section>

<style>
	section {
		max-width: 800px;
		margin: 2rem auto;
		padding: 2rem;
		background: #f4f4f4;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
	}
	h1, h2 {
		text-align: center;
	}
	ul {
		list-style: none;
		padding: 0;
	}
	li {
		padding: 1rem;
		margin-bottom: 1rem;
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 2px 6px rgba(0,0,0,0.1);
	}
	button {
		margin: 0.5rem;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 8px;
		background: #007bff;
		color: white;
		cursor: pointer;
		transition: background 0.3s;
	}
	button:hover {
		background: #0056b3;
	}
</style>
