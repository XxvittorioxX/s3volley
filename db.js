import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'itis123',
  database: 'test_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const db = drizzle(connection, { 
  schema, 
  mode: 'default' 
});