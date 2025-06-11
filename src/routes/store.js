(function () {
	let popupShown = false;
	let showPopupModal = false;
	let popupInterval;
	/**
	 * @type {HTMLDivElement | null}
	 */
	let popupElement;

	function showPopup() {
		if (showPopupModal) return;

		showPopupModal = true;
		document.body.style.overflow = 'hidden';

		popupElement = document.createElement('div');
		popupElement.className = 'popup-overlay show';
		popupElement.innerHTML = getPopupHTML();
		document.body.appendChild(popupElement);

		// Eventi
		popupElement.addEventListener('click', handleOverlayClick);
		document.querySelector('.close-btn')?.addEventListener('click', closePopup);
		document.querySelector('.btn-primary')?.addEventListener('click', handleDiscoverClick);
		document.querySelector('.btn-secondary')?.addEventListener('click', closePopup);
		document.addEventListener('keydown', handleKeydown);
	}

	function closePopup() {
		showPopupModal = false;
		document.body.style.overflow = 'auto';
		if (popupElement) {
			popupElement.remove();
			popupElement = null;
		}
		document.removeEventListener('keydown', handleKeydown);
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

	function getPopupHTML() {
		return `
			<div class="popup-content">
				<div class="promo-badge">OFFERTA LIMITATA!</div>
				<div class="popup-header">
					<button class="close-btn" aria-label="Chiudi popup">&times;</button>
					<div class="popup-logo">SISTEMA3</div>
					<div class="popup-subtitle">La Tua Soluzione Digitale Completa</div>
				</div>
				<div class="popup-body">
					<div class="popup-offer">
						<div class="offer-title">🚀 Sconto del 30% sui Nuovi Progetti!</div>
						<div class="offer-text">Approfitta della nostra offerta speciale per trasformare la tua presenza digitale con soluzioni professionali.</div>
					</div>
					<ul class="popup-features">
						<li>Sviluppo Web Professionale</li>
						<li>Design Responsive & Moderno</li>
						<li>Ottimizzazione SEO Avanzata</li>
						<li>Supporto Tecnico Dedicato</li>
						<li>Hosting e Manutenzione Inclusi</li>
					</ul>
					<div class="popup-buttons">
						<button class="btn-primary">Scopri di Più</button>
						<button class="btn-secondary">Forse Dopo</button>
					</div>
				</div>
			</div>
		`;
	}

	// Inserisci stile
	const style = document.createElement('style');
	style.textContent = `/* Inserisci qui tutto il CSS già scritto */`;
	document.head.appendChild(style);

	// Auto avvio
	setTimeout(showAutoPopup, 3000);

	popupInterval = setInterval(() => {
		showPopup();
	}, 600000);
})();
