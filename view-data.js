import { db } from './db.js';
import { users, posts } from './schema.js';
import { eq } from 'drizzle-orm';

async function viewAllData() {
  try {
    console.log('📊 VISUALIZZAZIONE DATI\n');

    // 1. Tutti gli utenti
    console.log('👥 UTENTI:');
    const allUsers = await db.select().from(users);
    console.table(allUsers);

    // 2. Tutti i post
    console.log('\n📝 POST:');
    const allPosts = await db.select().from(posts);
    console.table(allPosts);

    // 3. Join: utenti con i loro post
    console.log('\n🔗 UTENTI CON I LORO POST:');
    const usersWithPosts = await db
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        postTitle: posts.title,
        postContent: posts.content,
        postCreated: posts.createdAt
      })
      .from(users)
      .leftJoin(posts, eq(users.id, posts.userId));

    console.table(usersWithPosts);

    // 4. Conteggi
    console.log('\n📈 STATISTICHE:');
    console.log(`Totale utenti: ${allUsers.length}`);
    console.log(`Totale post: ${allPosts.length}`);

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    process.exit(0);
  }
}

viewAllData();