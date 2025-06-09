import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

const connection = mysql.createPool({
  host: 'localhost',
  user: 'tuo_utente',      // ← Cambia qui
  password: 'tua_password', // ← Cambia qui
  database: 'tuo_database', // ← Cambia qui
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
