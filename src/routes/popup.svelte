<script>
	import { onMount } from 'svelte';

	let popupShown = false;
	let showPopupModal = false;
	/**
	 * @type {number | undefined}
	 */
	let popupInterval;

	function showPopup() {
		showPopupModal = true;
		if (typeof document !== 'undefined') {
			document.body.style.overflow = 'hidden';
		}
	}

	function closePopup() {
		showPopupModal = false;
		if (typeof document !== 'undefined') {
			document.body.style.overflow = 'auto';
		}
	}

	function handleDiscoverClick() {
		console.log('Click su "Scopri di Più" - Sistema3');
		window.open('https://sistema3.it', '_blank');
		setTimeout(closePopup, 100);
	}

	/**
	 * @param {{ key: string; }} event
	 */
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			closePopup();
		}
	}

	/**
	 * @param {{ target: any; currentTarget: any; }} event
	 */
	function handleOverlayClick(event) {
		if (event.target === event.currentTarget) {
			closePopup();
		}
	}

	function showAutoPopup() {
		if (!popupShown) {
			showPopup();
			popupShown = true;
		}
	}

	onMount(() => {
		// Aggiungi event listener per ESC
		document.addEventListener('keydown', handleKeydown);

		// Mostra popup dopo 3 secondi
		setTimeout(showAutoPopup, 3000);
		
		// Imposta intervallo ogni 10 minuti
		popupInterval = setInterval(() => {
			showPopup();
		}, 600000);

		return () => {
			// Cleanup
			document.removeEventListener('keydown', handleKeydown);
			if (popupInterval) {
				clearInterval(popupInterval);
			}
		};
	});
</script>

{#if showPopupModal}
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="popup-overlay show" on:click={handleOverlayClick} role="dialog" aria-modal="true">
		<div class="popup-content">
			<div class="promo-badge">OFFERTA LIMITATA!</div>
			
			<div class="popup-header">
				<button class="close-btn" on:click={closePopup} aria-label="Chiudi popup">&times;</button>
				<div class="popup-logo">SISTEMA3</div>
				<div class="popup-subtitle">La Tua Soluzione Digitale Completa</div>
			</div>
			
			<div class="popup-body">
				<div class="popup-offer">
					<div class="offer-title">🚀 Sconto del 30% sui Nuovi Progetti!</div>
					<div class="offer-text">
						Approfitta della nostra offerta speciale per trasformare 
						la tua presenza digitale con soluzioni professionali.
					</div>
				</div>
				
				<ul class="popup-features">
					<li>Sviluppo Web Professionale</li>
					<li>Design Responsive & Moderno</li>
					<li>Ottimizzazione SEO Avanzata</li>
					<li>Supporto Tecnico Dedicato</li>
					<li>Hosting e Manutenzione Inclusi</li>
				</ul>
				
				<div class="popup-buttons">
					<button class="btn-primary" on:click={handleDiscoverClick}>
						Scopri di Più
					</button>
					<button class="btn-secondary" on:click={closePopup}>
						Forse Dopo
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Overlay del popup */
	.popup-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.6);
		z-index: 10000;
		backdrop-filter: blur(5px);
		animation: fadeIn 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* Contenuto del popup */
	.popup-content {
		background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
		border-radius: 20px;
		padding: 0;
		max-width: 450px;
		width: 90%;
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		position: relative;
		color: white;
		animation: slideIn 0.4s ease;
		transform-origin: center;
	}

	@keyframes slideIn {
		from { 
			opacity: 0;
			transform: scale(0.8) translateY(-50px);
		}
		to { 
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	/* Header del popup */
	.popup-header {
		text-align: center;
		padding: 30px 30px 20px;
		position: relative;
	}

	.close-btn {
		position: absolute;
		top: 15px;
		right: 20px;
		background: rgba(255, 255, 255, 0.2);
		border: none;
		color: white;
		font-size: 24px;
		width: 35px;
		height: 35px;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10001;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: rotate(90deg);
	}

	.popup-logo {
		font-size: 36px;
		font-weight: bold;
		margin-bottom: 10px;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
		letter-spacing: 2px;
	}

	.popup-subtitle {
		font-size: 16px;
		opacity: 0.9;
		margin-bottom: 20px;
		font-weight: 300;
	}

	/* Corpo del popup */
	.popup-body {
		padding: 0 30px 30px;
	}

	.popup-offer {
		background: rgba(255, 255, 255, 0.15);
		border-radius: 15px;
		padding: 20px;
		margin-bottom: 25px;
		text-align: center;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.offer-title {
		font-size: 20px;
		font-weight: bold;
		margin-bottom: 10px;
		color: #fbbf24;
	}

	.offer-text {
		font-size: 14px;
		line-height: 1.5;
		opacity: 0.95;
	}

	.popup-features {
		list-style: none;
		padding: 0;
		margin: 20px 0;
	}

	.popup-features li {
		padding: 8px 0;
		font-size: 14px;
		position: relative;
		padding-left: 25px;
		opacity: 0.95;
	}

	.popup-features li::before {
		content: '✓';
		position: absolute;
		left: 0;
		color: #10b981;
		font-weight: bold;
		font-size: 16px;
	}

	/* Bottoni del popup */
	.popup-buttons {
		display: flex;
		gap: 15px;
		margin-top: 25px;
	}

	.btn-primary {
		flex: 1;
		background: rgba(255, 255, 255, 0.9);
		color: #1e3a8a;
		border: none;
		padding: 15px 20px;
		border-radius: 25px;
		font-size: 16px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.3s ease;
		text-decoration: none;
		display: inline-block;
		text-align: center;
	}

	.btn-primary:hover {
		background: white;
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
	}

	.btn-secondary {
		flex: 1;
		background: transparent;
		color: white;
		border: 2px solid rgba(255, 255, 255, 0.5);
		padding: 15px 20px;
		border-radius: 25px;
		font-size: 16px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.8);
	}

	/* Badge promozionale */
	.promo-badge {
		position: absolute;
		top: -10px;
		right: 20px;
		background: #ef4444;
		color: white;
		padding: 8px 16px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: bold;
		transform: rotate(12deg);
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
		animation: bounce 2s infinite;
	}

	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% { transform: rotate(12deg) translateY(0); }
		40% { transform: rotate(12deg) translateY(-10px); }
		60% { transform: rotate(12deg) translateY(-5px); }
	}

	/* Responsive */
	@media (max-width: 768px) {
		.popup-content {
			max-width: 350px;
			margin: 20px;
		}
		
		.popup-header {
			padding: 25px 20px 15px;
		}
		
		.popup-body {
			padding: 0 20px 25px;
		}
		
		.popup-buttons {
			flex-direction: column;
		}
		
		.popup-logo {
			font-size: 28px;
		}
	}
</style>