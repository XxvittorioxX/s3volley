import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './schema.js',  // Questo dovrebbe essere corretto se schema.js è nella root
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'test_db',
  },
});