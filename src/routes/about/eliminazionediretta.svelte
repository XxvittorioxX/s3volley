<script lang="ts">
	export let teams: string[] = [];

	// Funzione per calcolare il prossimo numero di squadre (potenza di 2) con eventuali bye
	function nextPowerOfTwo(n: number): number {
		return Math.pow(2, Math.ceil(Math.log2(n)));
	}

	// Genera rounds (array di rounds, ciascuno con array di match)
	// Ogni match è { team1: string | null, team2: string | null }
	function generateRounds(teams: string[]) {
		const n = teams.length;
		const totalSlots = nextPowerOfTwo(n);
		const byes = totalSlots - n;

		// Primo round con byes: aggiungo null (bye) alle squadre
		const firstRoundTeams = [...teams];
		for(let i=0; i<byes; i++) {
			firstRoundTeams.push(null);
		}

		const rounds = [];
		rounds.push(pairTeams(firstRoundTeams));

		// Genero rounds successivi vuoti (da riempire con vincitori)
		let roundSize = rounds[0].length;
		while(roundSize > 1) {
			roundSize = Math.floor(roundSize / 2);
			const emptyRound = Array(roundSize).fill({ team1: null, team2: null });
			rounds.push(emptyRound);
		}
		return rounds;
	}

	function pairTeams(list: (string | null)[]) {
		const pairs = [];
		for(let i=0; i<list.length; i+=2) {
			pairs.push({ team1: list[i], team2: list[i+1] });
		}
		return pairs;
	}

	let rounds = [];

	$: rounds = generateRounds(teams);
</script>

<style>
	.bracket {
		display: flex;
		justify-content: center;
		align-items: flex-start;
		gap: 3rem;
		margin-top: 2rem;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		user-select: none;
	}

	.round {
		display: flex;
		flex-direction: column;
		gap: 1.8rem;
		min-width: 140px;
	}

	.match {
		background: #f0f4ff;
		border-radius: 10px;
		padding: 10px;
		box-shadow: 0 3px 8px rgb(0 0 0 / 0.1);
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-height: 60px;
	}

	.team {
		padding: 3px 8px;
		border-radius: 6px;
		margin: 3px 0;
		background-color: white;
		border: 1px solid #ccc;
		font-size: 0.9rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.team.null {
		color: #bbb;
		font-style: italic;
	}

	.round-title {
		text-align: center;
		font-weight: 600;
		font-size: 1.2rem;
		margin-bottom: 1rem;
		color: #004080;
	}

	/* Linee di collegamento (semplice) */
	.match:not(:last-child) {
		position: relative;
	}

	.match:not(:last-child)::after {
		content: '';
		position: absolute;
		bottom: -14px;
		left: 100%;
		width: 24px;
		height: 2px;
		background: #004080;
	}

	.round:not(:last-child) .match {
		position: relative;
	}

	.round:not(:last-child) .match::before {
		content: '';
		position: absolute;
		top: 50%;
		right: 0;
		width: 24px;
		height: 2px;
		background: #004080;
		transform: translateY(-50%);
	}
</style>

<div class="bracket">
	{#each rounds as round, index}
		<div class="round">
			<div class="round-title">
				{#if index === 0}Primo turno
				{:else if index === rounds.length - 1}Finale
				{:else}Turno {index + 1}
				{/if}
			</div>
			{#each round as match}
				<div class="match">
					<div class="team {match.team1 === null ? 'null' : ''}">{match.team1 ?? 'Bye'}</div>
					<div class="team {match.team2 === null ? 'null' : ''}">{match.team2 ?? 'Bye'}</div>
				</div>
			{/each}
		</div>
	{/each}
</div>
