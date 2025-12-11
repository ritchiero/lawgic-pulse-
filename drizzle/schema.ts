import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Subscription table - tracks user subscriptions with Stripe integration
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "active", "cancelled", "past_due"]).default("pending").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * User practice areas - tracks which legal areas each user is interested in
 */
export const userAreas = mysqlTable("userAreas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  areaCode: varchar("areaCode", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserArea = typeof userAreas.$inferSelect;
export type InsertUserArea = typeof userAreas.$inferInsert;

/**
 * DOF documents - stores scraped documents from the Mexican Official Gazette
 */
export const dofDocuments = mysqlTable("dofDocuments", {
  id: int("id").autoincrement().primaryKey(),
  publishDate: timestamp("publishDate").notNull(),
  title: text("title").notNull(),
  documentType: varchar("documentType", { length: 100 }),
  dofUrl: text("dofUrl").notNull(),
  contentExcerpt: text("contentExcerpt"),
  aiSummary: text("aiSummary"),
  detectedAreas: text("detectedAreas"), // JSON array stored as text
  edition: varchar("edition", { length: 50 }),
  s3Key: text("s3Key"), // S3 storage key for full document
  processed: int("processed").default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DofDocument = typeof dofDocuments.$inferSelect;
export type InsertDofDocument = typeof dofDocuments.$inferInsert;

/**
 * Sent alerts - tracks which documents were sent to which users
 */
export const sentAlerts = mysqlTable("sentAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentId: int("documentId").notNull().references(() => dofDocuments.id, { onDelete: "cascade" }),
  emailId: varchar("emailId", { length: 255 }),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type SentAlert = typeof sentAlerts.$inferSelect;
export type InsertSentAlert = typeof sentAlerts.$inferInsert;

/**
 * Webhook events - logs Stripe webhook events for debugging and idempotency
 */
export const webhookEvents = mysqlTable("webhookEvents", {
  id: int("id").autoincrement().primaryKey(),
  stripeEventId: varchar("stripeEventId", { length: 255 }).unique(),
  eventType: varchar("eventType", { length: 100 }),
  payload: text("payload"), // JSON stored as text
  processed: int("processed").default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;