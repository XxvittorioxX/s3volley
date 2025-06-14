<script lang="ts">
	import { onMount } from 'svelte';

	interface Team {
		teamName: string;
		coachName: string;
		category: string;
	}

	interface CategoryConfig {
		name: string;
		maxScore: number;
		playTime: number;
		isTimeBased: boolean;
		description: string;
		ageRange: string;
		advantage: number;
	}

	const categoryConfigs: Record<string, CategoryConfig> = {
		S1: {
			name: 'Minivolley S1',
			maxScore: 8,
			playTime: 8,
			isTimeBased: false,
			description: 'Livello base - Set a 8 punti (vantaggio 2)',
			ageRange: '6-8 anni',
			advantage: 2
		},
		S2: {
			name: 'Minivolley S2',
			maxScore: 10,
			playTime: 10,
			isTimeBased: false,
			description: 'Livello intermedio - Set a 10 punti (vantaggio 1)',
			ageRange: '8-10 anni',
			advantage: 1
		},
		S3: {
			name: 'Minivolley S3',
			maxScore: 15,
			playTime: 12,
			isTimeBased: false,
			description: 'Livello avanzato - Set a 15 punti (vantaggio 2)',
			ageRange: '10-11 anni',
			advantage: 2
		},
		Under12: {
			name: 'Under 12',
			maxScore: 21,
			playTime: 15,
			isTimeBased: false,
			description: 'Volley giovanile - Set a 21 punti',
			ageRange: '11-12 anni',
			advantage: 2
		},
		Seniores: {
			name: 'Seniores',
			maxScore: 25,
			playTime: 15,
			isTimeBased: false,
			description: 'Volley esperto - Set a 25 punti',
			ageRange: '60-65 anni',
			advantage: 0
		}
	};

	let teams: Team[] = [];
	let categories: string[] = Object.keys(categoryConfigs);

	function getCategoryConfig(category: string): CategoryConfig {
		return categoryConfigs[category] || {							
			name: category,
			maxScore: 15,
			playTime: 10,
			isTimeBased: false,
			description: 'Configurazione standard',
			ageRange: 'N/A',
			advantage: 2
		};
	}

	function getTeamsByCategory(category: string): Team[] {
		return teams.filter(t => t.category === category);
	}
</script>

<svelte:head>
	<title>Regole del Torneo</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
	<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
</svelte:head>

<div class="container my-5">

	<div class="card shadow-lg border-0">
		<div class="card-header bg-primary text-white d-flex align-items-center">
			<i class="bi bi-clipboard-check-fill me-2 fs-4"></i>
			<h3 class="mb-0">Regole delle Categorie</h3>
		</div>
		<div class="table-responsive">
			<table class="table table-hover align-middle mb-0">
				<thead class="table-light text-center">
					<tr>
						<th>Categoria</th>
						<th>Fascia Età</th>
						<th>Modalità</th>
						<th>Punteggio</th>
						<th>Descrizione</th>
					</tr>
				</thead>
				<tbody class="text-center">
					{#each Object.entries(categoryConfigs) as [key, config]}
						<tr>
							<td>
								<span class="fw-semibold text-primary">{key}</span><br>
								<small class="text-muted">{config.name}</small>
							</td>
							<td>
								<span class="badge rounded-pill bg-secondary">
									<i class="bi bi-people-fill me-1"></i>{config.ageRange}
								</span>
							</td>
							<td>
								<span class="badge rounded-pill {config.isTimeBased ? 'bg-info' : 'bg-success'}">
									{config.isTimeBased
										? '⏱️ A Tempo'
										: '🏐 A Punti'}      
								</span>
							</td>
							<td>
								<span class="fw-bold text-dark">
									{config.maxScore} pt <small class="text-muted">(adv. {config.advantage})</small>
								</span>
							</td>
							<td class="text-start">
								<small class="text-muted">{config.description}</small>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
