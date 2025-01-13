import { db } from "./index";
import { users, matches } from "./schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { sql } from "drizzle-orm";

async function runMigration() {
  console.log("Running migration...");
  
  // Drop and recreate vector extension
  await db.execute(sql`DROP EXTENSION IF EXISTS vector;`);
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
  
  // Drop and recreate tables to ensure clean state
  await db.execute(sql`DROP TABLE IF EXISTS matches;`);
  await db.execute(sql`DROP TABLE IF EXISTS users;`);
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      location TEXT NOT NULL,
      latitude DECIMAL(10,6),
      longitude DECIMAL(10,6),
      gender TEXT NOT NULL,
      public_description TEXT NOT NULL,
      private_description TEXT NOT NULL,
      social_ids TEXT NOT NULL,
      photo_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      newsletter_enabled BOOLEAN DEFAULT TRUE NOT NULL,
      embedding vector(1536)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      user1_id INTEGER REFERENCES users(id) NOT NULL,
      user2_id INTEGER REFERENCES users(id) NOT NULL,
      percentage INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);
  console.log("Migration complete!");
}

runMigration().catch(console.error);