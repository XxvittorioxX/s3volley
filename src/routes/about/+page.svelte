// File: src/routes/gironi/page.svelte

<script lang="ts">
  import EliminazioneDiretta from '$lib/components/EliminazioneDiretta.svelte';
  import { registeredTeams } from '$lib/stores/teams';
  import { derived } from 'svelte/store';

  // Deriva i nomi delle squadre dallo store
  const teamNames = derived(registeredTeams, ($teams) => $teams.map(t => t.teamName));
</script>

<section>
  <h1>Gironi a Eliminazione Diretta</h1>

  {#if $teamNames.length < 2}
    <p>Devi registrare almeno due squadre per creare un girone a eliminazione diretta.</p>
  {:else}
    <EliminazioneDiretta teams={$teamNames} />
  {/if}
</section>

<style>
  section {
    max-width: 900px;
    margin: 2rem auto;
    padding: 1rem 2rem;
    background-color: #f9f9f9;
    border-radius: 12px;
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.1);
    font-family: Arial, sans-serif;
    text-align: center;
  }

  h1 {
    color: #003366;
  }
</style>


<!-- File: src/lib/components/EliminazioneDiretta.svelte -->

<script lang="ts">
  export let teams: string[];

  // Crea le partite in base al numero di squadre (eliminazione diretta semplificata)
  let rounds: string[][][] = [];

  $: if (teams && teams.length >= 2) {
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    let currentRound = shuffled.map((team, i, arr) => i % 2 === 0 ? [team, arr[i + 1] || 'BYE'] : null).filter(Boolean) as string[][];

    rounds = [currentRound];
    while (currentRound.length > 1) {
      currentRound = currentRound.map((_, i, arr) => i % 2 === 0 ? [
        'Vincitore partita ' + (i + 1),
        arr[i + 1] ? 'Vincitore partita ' + (i + 2) : 'BYE'
      ] : null).filter(Boolean) as string[][];
      rounds.push(currentRound);
    }
  }
</script>

<div class="bracket">
  {#each rounds as round, roundIndex}
    <div class="round">
      <h3>Turno {roundIndex + 1}</h3>
      {#each round as match}
        <div class="match">
          <p>{match[0]}</p>
          <p>vs</p>
          <p>{match[1]}</p>
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .bracket {
    display: flex;
    justify-content: center;
    gap: 2rem;
    overflow-x: auto;
    padding: 1rem;
  }

  .round {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .match {
    background-color: #e6f0ff;
    border-radius: 8px;
    padding: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    min-width: 150px;
    text-align: center;
  }
</style>