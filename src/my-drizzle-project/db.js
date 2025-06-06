import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",           // Cambia con il tuo username
  password: "password",   // Cambia con la tua password
  database: "test_db"     // Cambia con il nome del tuo database
});

export const db = drizzle(connection);