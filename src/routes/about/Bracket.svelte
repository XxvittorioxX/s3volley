<script>
	import { selectWinners } from './utils.js';
	
	export let bracket;
	$: winner = bracket.length === 1 && bracket[0];
</script>

<style>
	ul {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		list-style: none;
	}
	ul li, h2 {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 1rem 0.5rem;
		text-align: center;
	}
	ul li {
		position: relative;
		font-size: 0.95rem;
	}
	
	ul li:before,
	ul li:after {
		position: absolute;
		content: '';
		top: 50%;
		left: 100%;
		background: currentColor;
	}
	ul li:before {
		width: 1rem;
		height: 2px;
		transform: translate(-100%, -50%);
	}
	ul li:after {
		width: 2px;
		height: 100%;
	}
	ul:nth-of-type(n) li:nth-of-type(odd):after {
		transform: translate(0%, 0%);
	}
	ul:nth-of-type(n) li:nth-of-type(even):after {
		transform: translate(0%, -100%);
	}
	h2 {
		text-transform: uppercase;
		font-size: 1.25rem;
	}
</style>

{#if winner}
	<h2>{winner.name}</h2>
{:else}
	<ul>
		{#each bracket as team (team.id)}
		<li>{team.name}</li>
		{/each}
	</ul>

	
	<svelte:self bracket={selectWinners(bracket)} />
{/if}

