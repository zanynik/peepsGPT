import { pgTable, text, serial, integer, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const genderEnum = z.enum(["Male", "Female", "Other"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
  gender: text("gender", { enum: ["Male", "Female", "Other"] }).notNull(),
  publicDescription: text("public_description").notNull(),
  privateDescription: text("private_description").notNull(),
  socialIds: text("social_ids").notNull(),
  photoUrl: text("photo_url").notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  newsletterEnabled: boolean("newsletter_enabled").default(true).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  messageId: integer("message_id").references(() => messages.id),
  type: text("type", { enum: ["message", "match", "system"] }).notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").references(() => users.id).notNull(),
  user2Id: integer("user2_id").references(() => users.id).notNull(),
  percentage: integer("percentage").notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // "public" or "private"
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  notifications: many(notifications),
  matchesAsUser1: many(matches, { relationName: "user1_matches" }),
  matchesAsUser2: many(matches, { relationName: "user2_matches" }),
  notes: many(notes)
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender"
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver"
  }),
  notifications: one(notifications, {
    fields: [messages.id],
    references: [notifications.messageId]
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  }),
  message: one(messages, {
    fields: [notifications.messageId],
    references: [messages.id]
  })
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

// Schemas
export const insertUserSchema = createInsertSchema(users, {
  gender: genderEnum
});
export const selectUserSchema = createSelectSchema(users);

export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);

export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);

export const insertMatchSchema = createInsertSchema(matches);
export const selectMatchSchema = createSelectSchema(matches);

export const insertNoteSchema = createInsertSchema(notes);
export const selectNoteSchema = createSelectSchema(notes);

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type Gender = z.infer<typeof genderEnum>;