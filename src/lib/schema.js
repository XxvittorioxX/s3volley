import { mysqlTable, int, varchar, timestamp, text, json, boolean } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Tabella utenti (mantenuta per compatibilità)
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Tabella posts (mantenuta per compatibilità)
export const posts = mysqlTable('posts', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  content: varchar('content', { length: 1000 }),
  userId: int('user_id').references(() => users.id),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Tabella teams - squadre del torneo
export const teams = mysqlTable('teams', {
  id: int('id').primaryKey().autoincrement(),
  teamName: varchar('team_name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  coachName: varchar('coach_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Tabella per salvare lo stato completo del torneo
export const tournamentData = mysqlTable('tournament_data', {
  id: int('id').primaryKey().autoincrement(),
  data: json('data').notNull(), // Contiene tutto lo stato del torneo serializzato
  timestamp: timestamp('timestamp').default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
});

// Tabella per i risultati finali del torneo
export const tournamentResults = mysqlTable('tournament_results', {
  id: int('id').primaryKey().autoincrement(),
  winners: json('winners').notNull(), // Vincitori per categoria
  groupStandings: json('group_standings').notNull(), // Classifiche gironi
  allMatches: json('all_matches').notNull(), // Tutte le partite
  tournamentComplete: boolean('tournament_complete').default(false),
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Tabella per le partite (opzionale, per query più dettagliate)
export const matches = mysqlTable('matches', {
  id: varchar('id', { length: 100 }).primaryKey(),
  team1Id: int('team1_id').references(() => teams.id),
  team2Id: int('team2_id').references(() => teams.id),
  winnerId: int('winner_id').references(() => teams.id),
  score1: int('score1'),
  score2: int('score2'),
  round: int('round'),
  groupName: varchar('group_name', { length: 100 }),
  phase: varchar('phase', { length: 20 }).notNull(), // 'group' o 'knockout'
  category: varchar('category', { length: 50 }).notNull(),
  field: int('field'),
  matchDate: timestamp('match_date'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
});

// Tabella per le classifiche dei gironi (opzionale, per query più efficienti)
export const groupStandings = mysqlTable('group_standings', {
  id: int('id').primaryKey().autoincrement(),
  groupName: varchar('group_name', { length: 100 }).notNull(),
  teamId: int('team_id').references(() => teams.id).notNull(),
  position: int('position').notNull(),
  played: int('played').default(0),
  won: int('won').default(0),
  drawn: int('drawn').default(0),
  lost: int('lost').default(0),
  points: int('points').default(0),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
});