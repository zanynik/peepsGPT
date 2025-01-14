import { InferModel } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  vector,
} from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  age: integer("age"),
  gender: genderEnum("gender"),
  location: text("location"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  photoUrl: text("photo_url"),
  publicDescription: text("public_description"),
  privateDescription: text("private_description"),
  socialIds: text("social_ids"),
  newsletterEnabled: boolean("newsletter_enabled").default(true),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").references(() => users.id),
  user2Id: integer("user2_id").references(() => users.id),
  percentage: integer("percentage"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = InferModel<typeof users>;
export type Match = InferModel<typeof matches>;
export type Message = InferModel<typeof messages>;
export type Notification = InferModel<typeof notifications>;
export type Note = InferModel<typeof notes>;