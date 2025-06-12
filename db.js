import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

// Configurazione pool di connessioni MySQL - solo proprietà supportate
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'itis123',
  database: 'test_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
  // Rimosso 'timeout' e 'reconnect' perché non sono supportati in PoolOptions
});

// Istanza Drizzle ORM
export const db = drizzle(connection, { 
  schema, 
  mode: 'default' 
});

// Funzione per testare la connessione
export async function testConnection() {
  try {
    const testConn = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: 'itis123',
      database: 'test_db'
    });
    await testConn.end();
    console.log('✅ Connessione database OK');
    return true;
  } catch (error) {
    console.log('❌ Errore connessione database:', error);
    return false;
  }
}

// Funzione per chiudere le connessioni (utile per graceful shutdown)
export async function closeConnection() {
  try {
    await connection.end();
    console.log('🔌 Connessioni database chiuse');
  } catch (error) {
    console.error('Errore nella chiusura delle connessioni:', error instanceof Error ? error.message : String(error));
  }
}

// Export del pool per uso diretto se necessario
export { connection };