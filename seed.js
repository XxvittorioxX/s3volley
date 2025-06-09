import { db } from './db.js';
import { users, posts } from './schema.js';

async function seedData() {
  try {
    console.log('🌱 Inserimento dati di prova...');
    
    // Inserisci utenti
    const newUsers = await db.insert(users).values([
      { name: 'Mario Rossi', email: 'mario@email.com' },
      { name: 'Luigi Verdi', email: 'luigi@email.com' },
      { name: 'Anna Bianchi', email: 'anna@email.com' }
    ]);

    console.log('✅ Utenti inseriti!');

    // Inserisci post
    const newPosts = await db.insert(posts).values([
      { 
        title: 'Il mio primo post', 
        content: 'Questo è il contenuto del primo post',
        userId: 1 
      },
      { 
        title: 'Secondo post interessante', 
        content: 'Contenuto del secondo post molto interessante',
        userId: 2 
      },
      { 
        title: 'Terzo post di Anna', 
        content: 'Anna scrive il suo primo post',
        userId: 3 
      }
    ]);

    console.log('✅ Post inseriti!');
    console.log('🎉 Seeding completato con successo!');
    
  } catch (error) {
    console.error('❌ Errore durante il seeding:', error);
  } finally {
    process.exit(0);
  }
}

seedData();