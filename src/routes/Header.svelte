<script lang="ts">
	import { page } from '$app/state';
	import logo from '$lib/images/logo-s3.jpg';
	import logo1 from '$lib/images/volleys3.jpg';
</script>

<header class="bg-white shadow sticky-top">
	<div class="container d-flex align-items-center justify-content-between py-2">
		<!-- Logo sinistro -->
		<a href="https://www.federvolley.it/volley-s3-regole-di-gioco-e-documenti" class="d-flex align-items-center">
			<img src={logo1} alt="volleys3.jpg" style="width: 48px; height: 48px; object-fit: contain; filter: drop-shadow(0 0 2px rgba(0,0,0,0.15)); transition: filter 0.3s ease;" on:mouseover={() => (event.currentTarget.style.filter = 'drop-shadow(0 0 6px #006eff)')} on:mouseout={() => (event.currentTarget.style.filter = 'drop-shadow(0 0 2px rgba(0,0,0,0.15))')} />
		</a>

		<!-- Navbar centrale -->
		<nav class="navbar navbar-expand-md justify-content-center flex-grow-1">
			<ul class="navbar-nav gap-3">
				<li class="nav-item" aria-current={page.url.pathname === '/' ? 'page' : undefined}>
					<a class="nav-link text-uppercase fw-semibold" href="/">Home</a>
				</li>
				<li class="nav-item" aria-current={page.url.pathname === '/about' ? 'page' : undefined}>
					<a class="nav-link text-uppercase fw-semibold" href="/about">Gironi</a>
				</li>
				<li class="nav-item" aria-current={page.url.pathname.startsWith('/registrazioni') ? 'page' : undefined}>
					<a class="nav-link text-uppercase fw-semibold" href="/registrazioni">Visualizza Squadre</a>
				</li>
			</ul>
		</nav>

		<!-- Logo destro -->
		<a href="https://sistema3.it/" class="d-flex align-items-center">
			<img src={logo} alt="logo sistema3" style="width: 48px; height: 48px; object-fit: contain; filter: drop-shadow(0 0 2px rgba(0,0,0,0.15)); transition: filter 0.3s ease;" on:mouseover={() => (event.currentTarget.style.filter = 'drop-shadow(0 0 6px #006eff)')} on:mouseout={() => (event.currentTarget.style.filter = 'drop-shadow(0 0 2px rgba(0,0,0,0.15))')} />
		</a>
	</div>
</header>

<style>
	.nav-link[aria-current="page"] {
		color: #006eff !important;
		position: relative;
	}

	.nav-link[aria-current="page"]::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-bottom: 8px solid #006eff;
		width: 0;
		height: 0;
	}

	.nav-link:hover {
		color: #006eff !important;
	}
</style>
