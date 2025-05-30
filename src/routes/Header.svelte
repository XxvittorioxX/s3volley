<script lang="ts">
	import { page } from '$app/state';
	import logo from '$lib/images/logo-s3.jpg';
	import logo1 from '$lib/images/volleys3.jpg';
</script>

<header>
	<div class="corner">
		<a href="https://www.federvolley.it/volley-s3-regole-di-gioco-e-documenti">
			<img src={logo1} alt="volleys3.jpg" />

		</a>
	</div>

	<nav>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
		</svg>
		<ul>
			<li aria-current={page.url.pathname === '/' ? 'page' : undefined}>
				<a href="/">Home</a>
			</li>
			<li aria-current={page.url.pathname === '/about' ? 'page' : undefined}>
				<a href="/about">Gironi</a>
			</li>
			<li aria-current={page.url.pathname.startsWith('/registrazioni') ? 'page' : undefined}>
				<a href="/registrazioni">Visualizza Squadre</a>
			</li>
		</ul>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
		</svg>
	</nav>

	<div class="corner">
		<a href="https://sistema3.it/">
			<img src={logo} alt="volleys3.jpg" />
		</a>
	</div>
</header>

<style>
	header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1rem 2rem;
	background-color: #ffffff;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	position: sticky;
	top: 0;
	z-index: 100;
	font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.corner {
	width: 3em;
	height: 3em;
	display: flex;
	align-items: center;
	justify-content: center;
}

.corner a {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
}

.corner img {
	width: 4em;
	height: 4em;
	object-fit: contain;
	filter: drop-shadow(0 0 2px rgba(0,0,0,0.15));
	transition: filter 0.3s ease;
}

.corner img:hover {
	filter: drop-shadow(0 0 6px #006eff);
}

nav {
	display: flex;
	justify-content: center;
	align-items: center;
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: saturate(180%) blur(8px);
	border-radius: 10px;
	padding: 0 1rem;
	box-shadow: 0 2px 6px rgba(0,0,0,0.1);
	gap: 0.75rem;
}

svg {
	width: 2em;
	height: 3em;
	display: block;
	fill: #006eff;
}

path {
	fill: #006eff;
}

ul {
	position: relative;
	padding: 0 0.5rem;
	margin: 0;
	height: 3em;
	display: flex;
	justify-content: center;
	align-items: center;
	list-style: none;
}

li {
	position: relative;
	height: 100%;
	margin: 0 0.75rem;
}

li[aria-current='page']::before {
	--size: 8px;
	content: '';
	width: 0;
	height: 0;
	position: absolute;
	top: 0;
	left: calc(50% - var(--size));
	border: var(--size) solid transparent;
	border-top: var(--size) solid #006eff;
	transition: border-top-color 0.3s ease;
}

nav a {
	display: flex;
	height: 100%;
	align-items: center;
	padding: 0 0.75rem;
	color: #333;
	font-weight: 600;
	font-size: 0.9rem;
	text-transform: uppercase;
	letter-spacing: 0.12em;
	text-decoration: none;
	transition: color 0.3s ease;
}

nav a:hover {
	color: #006eff;
}
</style>