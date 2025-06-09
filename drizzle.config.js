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
});