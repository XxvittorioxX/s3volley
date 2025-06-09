import { mysqlTable, int, varchar, timestamp, } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Tabella utenti
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Tabella posts
export const posts = mysqlTable('posts', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  content: varchar('content', { length: 1000 }),
  userId: int('user_id').references(() => users.id),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`)
});

// Tabella teams 
export const teams = mysqlTable('teams', {
  id: int('id').primaryKey().autoincrement(),
  teamName: varchar('team_name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  coachName: varchar('coach_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`)
});