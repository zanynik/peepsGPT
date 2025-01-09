
import { db } from "./index";
import { users, matches } from "./schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { sql } from "drizzle-orm";

async function runMigration() {
  console.log("Running migration...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      location TEXT NOT NULL,
      gender TEXT NOT NULL,
      public_description TEXT NOT NULL,
      private_description TEXT NOT NULL,
      social_ids TEXT NOT NULL,
      photo_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      newsletter_enabled BOOLEAN DEFAULT TRUE NOT NULL
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
