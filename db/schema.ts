import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  location: text("location").notNull(),
  gender: text("gender").notNull(),
  publicDescription: text("public_description").notNull(),
  privateDescription: text("private_description").notNull(),
  socialIds: text("social_ids").notNull(),
  photoUrl: text("photo_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").references(() => users.id).notNull(),
  user2Id: integer("user2_id").references(() => users.id).notNull(),
  percentage: integer("percentage").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  matchesAsUser1: many(matches, { relationName: "user1_matches" }),
  matchesAsUser2: many(matches, { relationName: "user2_matches" }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  user1: one(users, {
    fields: [matches.user1Id],
    references: [users.id],
    relationName: "user1_matches",
  }),
  user2: one(users, {
    fields: [matches.user2Id],
    references: [users.id],
    relationName: "user2_matches",
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertMatchSchema = createInsertSchema(matches);
export const selectMatchSchema = createSelectSchema(matches);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
