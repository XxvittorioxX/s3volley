import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { teams, tournamentData, matches, tournamentResults, groupStandings } from '$lib/schema.js';
import { eq, desc, and } from 'drizzle-orm';

// GET - Ottieni tutte le squadre o per categoria
/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const category = url.searchParams.get('category');
    
    let allTeams;
    if (category) {
      // Filtra per categoria se specificata
      allTeams = await db.select().from(teams).where(eq(teams.category, category));
    } else {
      // Altrimenti prendi tutte le squadre
      allTeams = await db.select().from(teams);
    }
    
    return json({ success: true, teams: allTeams });
  } catch (error) {
    console.error('Errore nel recupero squadre:', error);
    return json({ success: false, message: 'Errore nel recupero squadre' }, { status: 500 });
  }
}

// POST - Registra nuova squadra o salva dati torneo
/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const data = await request.json();
    const { action } = data;

    // Registrazione squadra
    if (!action || action === 'register_team') {
      const { teamName, category, coachName, email, phone } = data;

      // Validazione
      if (!teamName || !category || !coachName || !email || !phone) {
        return json({ 
          success: false, 
          message: 'Tutti i campi sono obbligatori'
        }, { status: 400 });
      }

      // Verifica duplicati
      const existingTeam = await db
        .select()
        .from(teams)
        .where(eq(teams.teamName, teamName))
        .limit(1);

      if (existingTeam.length > 0) {
        return json({ 
          success: false, 
          message: 'Una squadra con questo nome è già registrata'
        }, { status: 400 });
      }

      // Inserisci nel database
      await db.insert(teams).values({
        teamName,
        category,
        coachName,
        email,
        phone
      });

      return json({
        success: true,
        message: 'Squadra registrata con successo!'
      });
    }

    // Salva stato torneo
    if (action === 'save_tournament') {
      const { tournamentState } = data;
      
      if (!tournamentState) {
        return json({ 
          success: false, 
          message: 'Dati torneo mancanti'
        }, { status: 400 });
      }

      await db.insert(tournamentData).values({
        data: tournamentState
      });

      return json({
        success: true,
        message: 'Stato torneo salvato con successo!'
      });
    }

    // Salva partita
    if (action === 'save_match') {
      const { matchData } = data;
      
      if (!matchData) {
        return json({ 
          success: false, 
          message: 'Dati partita mancanti'
        }, { status: 400 });
      }

      await db.insert(matches).values(matchData);

      return json({
        success: true,
        message: 'Partita salvata con successo!'
      });
    }

    // Aggiorna risultato partita
    if (action === 'update_match_result') {
      const { matchId, score1, score2, winnerId } = data;
      
      if (!matchId || score1 === undefined || score2 === undefined) {
        return json({ 
          success: false, 
          message: 'Dati risultato partita mancanti'
        }, { status: 400 });
      }

      await db.update(matches)
        .set({
          score1,
          score2,
          winnerId
        })
        .where(eq(matches.id, matchId));

      return json({
        success: true,
        message: 'Risultato partita aggiornato con successo!'
      });
    }

    // Salva risultati finali torneo
    if (action === 'save_tournament_results') {
      const { winners, groupStandings: standings, allMatches, tournamentComplete } = data;
      
      if (!winners || !standings || !allMatches) {
        return json({ 
          success: false, 
          message: 'Dati risultati torneo mancanti'
        }, { status: 400 });
      }

      await db.insert(tournamentResults).values({
        winners,
        groupStandings: standings,
        allMatches,
        tournamentComplete: tournamentComplete || false,
        timestamp: new Date()
      });

      return json({
        success: true,
        message: 'Risultati torneo salvati con successo!'
      });
    }

    return json({ 
      success: false, 
      message: 'Azione non riconosciuta'
    }, { status: 400 });

  } catch (error) {
    console.error('Errore nella richiesta POST:', error);
    return json({ 
      success: false, 
      message: 'Errore interno del server'
    }, { status: 500 });
  }
}

// PUT - Aggiorna dati esistenti
/** @type {import('./$types').RequestHandler} */
export async function PUT({ request }) {
  try {
    const data = await request.json();
    const { action } = data;

    // Aggiorna squadra
    if (action === 'update_team') {
      const { teamId, teamName, category, coachName, email, phone } = data;
      
      if (!teamId) {
        return json({ 
          success: false, 
          message: 'ID squadra mancante'
        }, { status: 400 });
      }

      await db.update(teams)
        .set({
          teamName,
          category,
          coachName,
          email,
          phone
        })
        .where(eq(teams.id, teamId));

      return json({
        success: true,
        message: 'Squadra aggiornata con successo!'
      });
    }

    return json({ 
      success: false, 
      message: 'Azione non riconosciuta'
    }, { status: 400 });

  } catch (error) {
    console.error('Errore nella richiesta PUT:', error);
    return json({ 
      success: false, 
      message: 'Errore interno del server'
    }, { status: 500 });
  }
}

// DELETE - Elimina dati
/** @type {import('./$types').RequestHandler} */
export async function DELETE({ request }) {
  try {
    const data = await request.json();
    const { action, teamId } = data;

    if (action === 'delete_team') {
      if (!teamId) {
        return json({ 
          success: false, 
          message: 'ID squadra mancante'
        }, { status: 400 });
      }

      await db.delete(teams).where(eq(teams.id, teamId));

      return json({
        success: true,
        message: 'Squadra eliminata con successo!'
      });
    }

    return json({ 
      success: false, 
      message: 'Azione non riconosciuta'
    }, { status: 400 });

  } catch (error) {
    console.error('Errore nella richiesta DELETE:', error);
    return json({ 
      success: false, 
      message: 'Errore interno del server'
    }, { status: 500 });
  }
}