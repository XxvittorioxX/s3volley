<script lang="ts">
	import { matches, type Match } from '$lib/stores/matches';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

	let localMatches: Match[] = [];

	onMount(() => {
		localMatches = structuredClone(get(matches));
	});

	function updateSet(matchIndex: number, setIndex: number, team: 'team1' | 'team2', value: string) {
		const num = parseInt(value);
		if (isNaN(num) || num < 0) return;

		const match = localMatches[matchIndex];
		if (!match.sets[setIndex]) {
			match.sets[setIndex] = { team1: 0, team2: 0 };
		}
		match.sets[setIndex][team] = num;
	}

	function validateAndSave(index: number) {
		const match = localMatches[index];
		let wins1 = 0;
		let wins2 = 0;

		for (const s of match.sets) {
			if (s.team1 >= 15 || s.team2 >= 15) {
				if (s.team1 === 15 && s.team2 < 14) wins1++;
				else if (s.team2 === 15 && s.team1 < 14) wins2++;
				else if (s.team1 === 16 && s.team2 === 15) wins1++;
				else if (s.team2 === 16 && s.team1 === 15) wins2++;
			}
		}

		match.winner = wins1 >= 2 ? match.team1 : wins2 >= 2 ? match.team2 : null;

		// aggiorna lo store globale
		matches.update(all => {
			all[index] = match;
			return all;
		});
		alert('Risultato salvato!');
	}
</script>

<svelte:head>
	<title>Calendario Partite - Torneo Volley S3</title>
</svelte:head>

<section>
	<h1>Calendario Partite</h1>

	{#if localMatches.length === 0}
		<p>Attendi che vengano generate le partite.</p>
	{:else}
		{#each localMatches as match, i}
			<div class="match">
				<h2>Partita {i + 1}: {match.team1} vs {match.team2}</h2>

				{#if match.winner}
					<p class="winner">Vincitore: {match.winner}</p>
				{:else}
					{#each Array(3) as _, s}
						<div class="set">
							<label>Set {s + 1}</label>
							<input
								type="number"
								min="0"
								max="16"
								placeholder={match.team1}
								on:input={(e) => updateSet(i, s, 'team1', e.target.value)}
							/>
							<input
								type="number"
								min="0"
								max="16"
								placeholder={match.team2}
								on:input={(e) => updateSet(i, s, 'team2', e.target.value)}
							/>
						</div>
					{/each}

					<button on:click={() => validateAndSave(i)}>Salva Risultato</button>
				{/if}
			</div>
		{/each}
	{/if}
</section>

<style>
	section {
		max-width: 700px;
		margin: 2rem auto;
		padding: 2rem;
		background-color: #f9f9f9;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	h1 {
		text-align: center;
		margin-bottom: 2rem;
		font-size: 2.5rem;
	}

	.match {
		margin-bottom: 2rem;
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 12px;
		background: #fff;
	}

	.set {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin: 0.5rem 0;
	}

	input {
		width: 70px;
		padding: 0.5rem;
		font-size: 1rem;
		text-align: center;
		border-radius: 8px;
		border: 1px solid #ccc;
	}

	button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #0077ff;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
	}

	button:hover {
		background: #005ddd;
	}

	.winner {
		font-weight: bold;
		color: green;
	}
</style>
