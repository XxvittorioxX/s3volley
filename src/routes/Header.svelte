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
			<ul class="navbar-nav gap-5 mx-auto text-uppercase fw-semibold">
				<li class="nav-item">
					<a
						class="nav-link position-relative"
						href="/"
						aria-current={page.url.pathname === '/' ? 'page' : undefined}
						>
						Home
						{#if page.url.pathname === '/'}
							<span class="active-circle"></span>
						{/if}
					</a>
				</li>
				<li class="nav-item">
					<a
						class="nav-link position-relative"
						href="/about"
						aria-current={page.url.pathname === '/about' ? 'page' : undefined}
						>
						Gironi
						{#if page.url.pathname === '/about'}
							<span class="active-circle"></span>
						{/if}
					</a>
				</li>
				<li class="nav-item">
					<a
						class="nav-link position-relative"
						href="/registrazioni"
						aria-current={page.url.pathname.startsWith('/registrazioni') ? 'page' : undefined}
						>
						Visualizza Squadre
						{#if page.url.pathname.startsWith('/registrazioni')}
							<span class="active-circle"></span>
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
		padding-bottom: 0.5rem;
	}

	.nav-link:hover {
		color: #006eff;
	}

	/* Cerchio colorato animato sotto il link attivo */
	.active-circle {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%) scale(0);
		width: 12px;
		height: 12px;
		background-color: #006eff;
		border-radius: 50%;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		animation: scaleIn 0.3s forwards;
	}

	@keyframes scaleIn {
		from {
			transform: translateX(-50%) scale(0);
		}
		to {
			transform: translateX(-50%) scale(1);
		}
	}
</style>
