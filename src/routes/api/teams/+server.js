import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { teams } from '$lib/schema.js';
import { eq } from 'drizzle-orm';

// GET - Ottieni tutte le squadre
/** @type {import('./$types').RequestHandler} */
export async function GET() {
  try {
    const allTeams = await db.select().from(teams);
    return json({ success: true, teams: allTeams });
  } catch (error) {
    console.error('Errore nel recupero squadre:', error);
    return json({ success: false, message: 'Errore nel recupero squadre' }, { status: 500 });
  }
}

// POST - Registra nuova squadra
/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const data = await request.json();
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
      .where(eq(teams.teamName, teamName)) // Usa teamName (camelCase)
      .limit(1);

    if (existingTeam.length > 0) {
      return json({ 
        success: false, 
        message: 'Una squadra con questo nome è già registrata'
      }, { status: 400 });
    }

    // Inserisci nel database
    await db.insert(teams).values({
      teamName: teamName,    // Usa teamName (camelCase)
      category,
      coachName: coachName,  // Usa coachName (camelCase)
      email,
      phone
    });

    return json({
      success: true,
      message: 'Squadra registrata con successo!'
    });

  } catch (error) {
    console.error('Errore nella registrazione:', error);
    return json({ 
      success: false, 
      message: 'Errore interno del server'
    }, { status: 500 });
  }
}