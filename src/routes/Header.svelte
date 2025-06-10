<script lang="ts">
	import { page } from '$app/state';
	import logo from '$lib/images/logo-s3.jpg';
	import logo1 from '$lib/images/volleys3.jpg';
</script>

<header class="bg-white shadow-sm sticky-top">
	<div class="container d-flex align-items-center justify-content-between py-3">
		<!-- Logo sinistro -->
		<a href="https://www.federvolley.it/volley-s3-regole-di-gioco-e-documenti" class="d-flex align-items-center logo-link">
			<img src={logo1} alt="VolleyS3" class="logo-img" />
		</a>

		<!-- Navbar centrale -->
		<nav class="navbar navbar-expand-md justify-content-center flex-grow-1">
			<ul class="navbar-nav gap-4 mx-auto text-uppercase fw-semibold">
				<li class="nav-item" aria-current={page.url.pathname === '/' ? 'page' : undefined}>
					<a class="nav-link position-relative" href="/">Home
						{#if page.url.pathname === '/'}
							<span class="active-indicator"></span>
						{/if}
					</a>
				</li>
				<li class="nav-item" aria-current={page.url.pathname === '/about' ? 'page' : undefined}>
					<a class="nav-link position-relative" href="/about">Gironi
						{#if page.url.pathname === '/about'}
							<span class="active-indicator"></span>
						{/if}
					</a>
				</li>
				<li class="nav-item" aria-current={page.url.pathname.startsWith('/registrazioni') ? 'page' : undefined}>
					<a class="nav-link position-relative" href="/registrazioni">Classifiche Gironi
						{#if page.url.pathname.startsWith('/registrazioni')}
							<span class="active-indicator"></span>
						{/if}
					</a>
				</li>
					<li class="nav-item" aria-current={page.url.pathname.startsWith('/regole') ? 'page' : undefined}>
					<a class="nav-link position-relative" href="/regole">Regolamento
						{#if page.url.pathname.startsWith('/regole')}
							<span class="active-indicator"></span>
						{/if}
					</a>
				</li>
			</ul>
		</nav>

		<!-- Logo destro -->
		<a href="https://sistema3.it/" class="d-flex align-items-center logo-link">
			<img src={logo} alt="Sistema3" class="logo-img" />
		</a>
	</div>
</header>

<style>
	.logo-link {
		transition: transform 0.3s ease;
	}
	.logo-link:hover {
		transform: scale(1.1);
	}
	.logo-img {
		width: 48px;
		height: 48px;
		object-fit: contain;
		filter: drop-shadow(0 0 3px rgba(0, 110, 255, 0.5));
		transition: filter 0.3s ease;
	}
	.logo-img:hover {
		filter: drop-shadow(0 0 10px #006eff);
	}

	.navbar-nav {
		letter-spacing: 0.15em;
	}

	.nav-link {
		color: #444444;
		font-size: 1rem;
		transition: color 0.25s ease;
		position: relative;
		padding-bottom: 0.25rem;
	}

	.nav-link:hover {
		color: #006eff;
	}

	/* Indicatore sottolineato animato per il link attivo */
	.active-indicator {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 40%;
		height: 3px;
		background: #006eff;
		border-radius: 3px;
		animation: slideIn 0.4s ease forwards;
	}

	@keyframes slideIn {
		from {
			width: 0;
			opacity: 0;
		}
		to {
			width: 40%;
			opacity: 1;
		}
	}
</style>
