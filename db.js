import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { teams, users, posts } from './schema.js';

const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "itis123",
  database: "test_db"
});

export const db = drizzle(connection);

// Esporta le tabelle per poterle usare
export { teams, users, posts };