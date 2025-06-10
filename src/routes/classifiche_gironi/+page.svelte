<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	interface Team {
		id?: string;
		teamName: string;
		category: string;
		coachName: string;
		email: string;
		phone: string;
	}

	interface Match {
		id: string;
		t1: Team | null;
		t2: Team | null;
		w: Team | null;
		score1?: number;
		score2?: number;
		round?: number;
		group?: string;
		phase: 'group' | 'knockout';
		category?: string;
		field?: number;
	}

	interface GroupStanding {
		team: Team;
		played: number;
		won: number;
		drawn: number;
		lost: number;
		points: number;
		goalsFor: number;
		goalsAgainst: number;
		goalDifference: number;
	}

	// Store per condividere dati tra componenti
	const tournamentStore = writable({
		teams: [] as Team[],
		groupMatches: [] as Match[],
		groupStandings: {} as { [key: string]: GroupStanding[] },
		groups: {} as { [key: string]: Team[] },
		categories: [] as string[],
		groupsByCategory: {} as { [category: string]: string[] },
		currentPhase: 'setup'
	});

	// State locale
	let teams: Team[] = [];
	let groupMatches: Match[] = [];
	let groupStandings: { [key: string]: GroupStanding[] } = {};
	let groups: { [key: string]: Team[] } = {};
	let categories: string[] = [];
	let groupsByCategory: { [category: string]: string[] } = {};
	let isLoading = true;
	let error = '';

	onMount(() => {
		loadTournamentData();
		// Auto-refresh ogni 30 secondi
		const interval = setInterval(loadTournamentData, 30000);
		return () => clearInterval(interval);
	});

	// Carica i dati del torneo dal localStorage o da un'API
	async function loadTournamentData() {
		try {
			isLoading = true;
			error = '';

			// Prova a caricare dal localStorage
			const savedData = localStorage.getItem('volley-s3-tournament');
			if (savedData) {
				const tournamentData = JSON.parse(savedData);
				
				teams = tournamentData.teams || [];
				groupMatches = tournamentData.groupMatches || [];
				groups = tournamentData.groups || {};
				groupsByCategory = tournamentData.groupsByCategory || {};
				categories = tournamentData.categories || [];
				
				// Ricalcola le classifiche
				recalculateAllStandings();
			} else {
				// Se non ci sono dati salvati, prova a caricare le squadre dall'API
				await loadTeamsFromAPI();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Errore nel caricamento dati';
			console.error('Errore caricamento dati torneo:', err);
		} finally {
			isLoading = false;
		}
	}

	// Carica le squadre dall'API
	async function loadTeamsFromAPI() {
		try {
			const response = await fetch('/api/teams', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});

			if (!response.ok) {
				throw new Error(`Errore ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();
			
			if (result.success && result.teams) {
				teams = result.teams;
				categories = [...new Set(teams.map(t => t.category))];
			} else {
				throw new Error(result.message || 'Errore nel caricamento squadre');
			}
		} catch (err) {
			throw new Error('Impossibile caricare le squadre: ' + (err instanceof Error ? err.message : 'Errore sconosciuto'));
		}
	}

	// Scoring rules per le diverse categorie
	function getAdvantageForCategory(category: string): number {
		const advantages: { [key: string]: number } = {
			'S1': 2, 'S2': 1, 'S3': 2, 'Under 12': 2, 'Seniores': 2
		};
		return advantages[category] || 2;
	}

	function getBaseScoreForCategory(category: string): number {
		const baseScores: { [key: string]: number } = {
			'S1': 10, 'S2': 11, 'S3': 10, 'Under 12': 10, 'Seniores': 10
		};
		return baseScores[category] || 10;
	}

	function getCategoryRules(category: string): string {
		const advantage = getAdvantageForCategory(category);
		const baseScore = getBaseScoreForCategory(category);
		return `Si vince a ${baseScore} punti. In parità da ${baseScore}-${baseScore}, serve vantaggio di ${advantage}`;
	}

	// Ricalcola le classifiche dei gironi
	function recalculateGroupStanding(groupName: string) {
		const groupTeams = groups[groupName];
		if (!groupTeams) return;

		// Inizializza le classifiche
		groupStandings[groupName] = groupTeams.map(team => ({
			team,
			played: 0,
			won: 0,
			drawn: 0,
			lost: 0,
			points: 0,
			goalsFor: 0,
			goalsAgainst: 0,
			goalDifference: 0
		}));

		// Calcola le statistiche dalle partite giocate
		const groupMatchesPlayed = groupMatches.filter(m => 
			m.group === groupName && m.score1 !== undefined && m.score2 !== undefined
		);

		groupMatchesPlayed.forEach(match => {
			const standing1 = groupStandings[groupName].find(s => s.team.id === match.t1?.id || s.team.teamName === match.t1?.teamName);
			const standing2 = groupStandings[groupName].find(s => s.team.id === match.t2?.id || s.team.teamName === match.t2?.teamName);

			if (standing1 && standing2 && match.score1 !== undefined && match.score2 !== undefined) {
				standing1.played++;
				standing2.played++;
				standing1.goalsFor += match.score1;
				standing1.goalsAgainst += match.score2;
				standing2.goalsFor += match.score2;
				standing2.goalsAgainst += match.score1;

				const category = match.category || '';
				const requiredAdvantage = getAdvantageForCategory(category);
				const baseScore = getBaseScoreForCategory(category);
				const scoreDiff = Math.abs(match.score1 - match.score2);

				if (match.score1 !== match.score2) {
					const minScore = Math.min(match.score1, match.score2);
					
					// Determina il vincitore basandosi sulle regole
					let winner1 = false;
					if (minScore < baseScore) {
						// Sotto il punteggio base, basta un punto di vantaggio
						winner1 = match.score1 > match.score2;
					} else {
						// Al punteggio base o sopra, serve il vantaggio richiesto
						if (scoreDiff >= requiredAdvantage) {
							winner1 = match.score1 > match.score2;
						} else {
							// Partita non conclusa correttamente, considerala pareggio
							standing1.drawn++;
							standing2.drawn++;
							standing1.points += 1;
							standing2.points += 1;
							standing1.goalDifference = standing1.goalsFor - standing1.goalsAgainst;
							standing2.goalDifference = standing2.goalsFor - standing2.goalsAgainst;
							return;
						}
					}
					
					if (winner1) {
						standing1.won++;
						standing1.points += 3;
						standing2.lost++;
					} else {
						standing2.won++;
						standing2.points += 3;
						standing1.lost++;
					}
				} else {
					// Pareggio
					standing1.drawn++;
					standing2.drawn++;
					standing1.points += 1;
					standing2.points += 1;
				}

				standing1.goalDifference = standing1.goalsFor - standing1.goalsAgainst;
				standing2.goalDifference = standing2.goalsFor - standing2.goalsAgainst;
			}
		});

		// Ordina la classifica
		groupStandings[groupName].sort((a, b) => {
			if (b.points !== a.points) return b.points - a.points;
			if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
			if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
			return a.team.teamName.localeCompare(b.team.teamName);
		
		}
		)