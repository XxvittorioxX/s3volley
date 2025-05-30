<script lang="ts">
	import { page } from '$app/stores';
	import logo from '$lib/images/logo-azienda.svg'; // Sostituisci con il tuo logo
</script>

<header>
	<div class="logo">
		<a href="/">
			<img src={logo} alt="Logo Azienda" />
			<span>Torneo Volley</span>
		</a>
	</div>

	<nav>
		<ul>
			<li class:selected={page.url.pathname === '/'}>
				<a href="/">Home</a>
			</li>
			<li class:selected={page.url.pathname.startsWith('/calendario')}>
				<a href="/calendario">Calendario</a>
			</li>
			<li class:selected={page.url.pathname.startsWith('/classifica')}>
				<a href="/classifica">Classifica</a>
			</li>
			<li class:selected={page.url.pathname.startsWith('/registrazioni')}>
				<a href="/registrazioni">Registrazioni</a>
			</li>
		</ul>
	</nav>
</header>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Segoe UI', sans-serif;
		background-color: #f4f6f8;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 2rem;
		background-color: #ffffff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.logo a {
		display: flex;
		align-items: center;
		text-decoration: none;
		color: #003366;
		font-weight: bold;
		font-size: 1.3rem;
	}

	.logo img {
		height: 40px;
		margin-right: 0.5rem;
	}

	nav ul {
		display: flex;
		gap: 1.5rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	nav a {
		text-decoration: none;
		color: #333;
		font-weight: 600;
		position: relative;
		transition: color 0.2s;
	}

	nav a:hover {
		color: #006eff;
	}

	li.selected a::after {
		content: '';
		position: absolute;
		left: 0;
		bottom: -6px;
		width: 100%;
		height: 3px;
		background-color: #006eff;
		border-radius: 2px;
	}
</style>
