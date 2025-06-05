<script lang="ts">
	// Definisci l'interfaccia Team direttamente qui per ora
	interface Team {
		id: string;
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
	}

	export const categoryConfigs: Record<string, CategoryConfig> = {
		S1: {
			name: 'Minivolley S1',
			maxScore: 10,
			playTime: 8,
			isTimeBased: true,
			description: 'Livello base - 8 minuti a tempo',
			ageRange: '6-8 anni'
		},
		S2: {
			name: 'Minivolley S2',
			maxScore: 12,
			playTime: 10,
			isTimeBased: true,
			description: 'Livello intermedio - 10 minuti a tempo',
			ageRange: '8-10 anni'
		},
		S3: {
			name: 'Minivolley S3',
			maxScore: 15,
			playTime: 12,
			isTimeBased: false,
			description: 'Livello avanzato - Set a 15 punti (vantaggio 2)',
			ageRange: '10-11 anni'
		},
		Under12: {
			name: 'Under 12',
			maxScore: 21,
			playTime: 15,
			isTimeBased: false,
			description: 'Volley giovanile - Set a 21 punti',
			ageRange: '11-12 anni'
		}
	};

	// Dati mock per testare la pagina
	let teams: Team[] = [
		{ id: '1', teamName: 'Lions S1', coachName: 'Mario Rossi', category: 'S1' },
		{ id: '2', teamName: 'Eagles S1', coachName: 'Luigi Verdi', category: 'S1' },
		{ id: '3', teamName: 'Tigers S1', coachName: 'Paolo Bianchi', category: 'S1' },
		{ id: '4', teamName: 'Sharks S2', coachName: 'Anna Neri', category: 'S2' },
		{ id: '5', teamName: 'Dragons S2', coachName: 'Sofia Blu', category: 'S2' }
	];

	// Ricava le categorie dai teams esistenti
	$: categories = [...new Set(teams.map(t => t.category))];

	export function getCategoryConfig(category: string): CategoryConfig {
		return categoryConfigs[category] || {
			name: category,
			maxScore: 15,
			playTime: 10,
			isTimeBased: false,
			description: 'Configurazione standard',
			ageRange: 'N/A'
		};
	}
</script>

<svelte:head>
	<title>Torneo Minivolley - Regole e Squadre</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
</svelte:head>

<div class="container my-4">
	<!-- Regole -->
	<div class="card mb-4 shadow-sm">
		<div class="card-header bg-primary text-white">
			<h3 class="mb-0">📋 Regole delle Categorie</h3>
		</div>
		<div class="table-responsive">
			<table class="table table-striped mb-0">
				<thead class="table-dark">
					<tr>
						<th>Categoria</th>
						<th>Età</th>
						<th>Tipo</th>
						<th>Punteggio/Tempo</th>
						<th>Descrizione</th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(categoryConfigs) as [key, config]}
						<tr>
							<td><strong class="text-primary">{key}</strong></td>
							<td><span class="badge bg-secondary">{config.ageRange}</span></td>
							<td>
								<span class="badge {config.isTimeBased ? 'bg-info' : 'bg-success'}">
									{config.isTimeBased ? '⏱️ A Tempo' : '🏆 A Punti'}
								</span>
							</td>
							<td>
								<strong>{config.isTimeBased ? `${config.playTime} minuti` : `Set a ${config.maxScore} punti`}</strong>
							</td>
							<td><small class="text-muted">{config.description}</small></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Squadre -->
	<div class="card shadow-sm">
		<div class="card-header bg-success text-white">
			<h3 class="mb-0">👥 Squadre Registrate</h3>
		</div>
		<div class="card-body">
			{#if teams.length === 0}
				<div class="alert alert-warning text-center">
					<h5>⚠️ Nessuna squadra registrata</h5>
					<p class="mb-0">Registra le squadre per iniziare il torneo</p>
				</div>
			{:else}
				{#each categories as category}
					{#let config = getCategoryConfig(category)}
					<div class="mb-4">
						<div class="card border-primary">
							<div class="card-header bg-light d-flex justify-content-between align-items-center">
								<div>
									<h5 class="mb-0 text-primary">{config.name}</h5>
									<small class="text-muted">{config.ageRange} • {config.description}</small>
								</div>
								<span class="badge bg-primary fs-6">
									{teams.filter(t => t.category === category).length} squadre
								</span>
							</div>
							<div class="card-body">
								{#if teams.filter(t => t.category === category).length > 0}
									<div class="row">
										{#each teams.filter(t => t.category === category) as team, i}
											<div class="col-md-6 col-lg-4 mb-3">
												<div class="card h-100 border-secondary">
													<div class="card-body p-3">
														<h6 class="card-title text-dark mb-1">🏐 {team.teamName}</h6>
														<small class="text-muted">👨‍🏫 {team.coachName}</small>
														<div class="mt-2">
															<span class="badge bg-outline-primary">#{i + 1}</span>
														</div>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-muted text-center mb-0">Nessuna squadra per questa categoria</p>
								{/if}
							</div>
						</div>
					</div>

					{#if teams.filter(t => t.category === category).length < 3}
						<div class="alert alert-warning">
							<strong>⚠️ {config.name}:</strong> Solo {teams.filter(t => t.category === category).length} squadra/e. Servono almeno 3 squadre.
						</div>
					{/if}
				{/each}

				<!-- Totali -->
				<div class="alert alert-info text-center mt-4">
					<div class="row">
						<div class="col">
							<h5>{teams.length}</h5><small>Totale Squadre</small>
						</div>
						<div class="col">
							<h5>{categories.length}</h5><small>Categorie Attive</small>
						</div>
						<div class="col">
							<h5>{categories.filter(cat => teams.filter(t => t.category === cat).length >= 3).length}</h5>
							<small>Categorie Pronte</small>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.bg-outline-primary {
		color: #0d6efd;
		border: 1px solid #0d6efd;
		background-color: transparent;
	}
</style>