import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './schema.js',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: 'localhost',
    user: 'root',           // Cambia con il tuo username
    password: 'password',   // Cambia con la tua password
    database: 'test_db',    // Cambia con il nome del tuo database
  },
});