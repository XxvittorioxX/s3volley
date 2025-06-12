import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './schema.js',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: 'localhost',
    user: 'root',
    password: 'itis123',
    database: 'test_db',
  },
  verbose: true,
  strict: true,
  // Configurazioni aggiuntive per il torneo
  tablesFilter: ["users", "posts", "teams", "tournament_data", "tournament_results", "matches", "group_standings"],
  introspect: {
    casing: 'camel'
  }
});