<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<div class="app">
	<Header />

	<main>
		{@render children()}
	</main>

	<footer>
		<p>Web masters: Vittorio Serafini, Carlo Fioretti</p>
		<p>Email: 
			<a href="mailto:vittorio.serafini@divini.org">vittorio.serafini@divini.org</a>, 
			<a href="mailto:carlo.fioretti@divini.org">carlo.fioretti@divini.org</a>
		</p>
		<p>Telefono: 
			<a href="tel:+396987432105">+39 698 743 2105</a>, 
			<a href="tel:+395869342134">+39 586 934 2134</a>
		</p>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 10px;
		background-color: #f5f5f5;
		border-top: 1px solid #ddd;
	}

	footer p {
		margin: 4px 0;
		color: #666;
		font-size: 0.9rem;
	}

	footer a {
		font-weight: bold;
		color: #0066cc;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	footer a:hover {
		color: #004499;
		text-decoration: underline;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>