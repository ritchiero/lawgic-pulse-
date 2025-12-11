import { pgTable, serial, varchar, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Subscription table - tracks user subscriptions with Stripe integration
 */
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  customKeywords: text("customKeywords"), // User-defined keywords for personalized alerts (comma-separated)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * User practice areas - tracks which legal areas each user is interested in
 */
export const userAreas = pgTable("userAreas", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  areaId: varchar("areaId", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserArea = typeof userAreas.$inferSelect;
export type InsertUserArea = typeof userAreas.$inferInsert;

/**
 * DOF Documents - stores scraped documents from the Diario Oficial
 */
export const dofDocuments = pgTable("dofDocuments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  documentType: varchar("documentType", { length: 100 }).notNull(),
  url: text("url").notNull(),
  excerpt: text("excerpt"),
  fullText: text("fullText"),
  publishedDate: timestamp("publishedDate").notNull(),
  resumenIA: text("resumenIA"), // AI-generated summary
  areasDetectadas: text("areasDetectadas"), // Comma-separated list of detected practice areas
  s3Key: varchar("s3Key", { length: 500 }), // S3 storage key for full document
  scrapedAt: timestamp("scrapedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DofDocument = typeof dofDocuments.$inferSelect;
export type InsertDofDocument = typeof dofDocuments.$inferInsert;

/**
 * Sent Alerts - tracks which alerts have been sent to which users
 */
export const sentAlerts = pgTable("sentAlerts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentId: integer("documentId").notNull().references(() => dofDocuments.id, { onDelete: "cascade" }),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  emailStatus: varchar("emailStatus", { length: 50 }).default("sent").notNull(),
});

export type SentAlert = typeof sentAlerts.$inferSelect;
export type InsertSentAlert = typeof sentAlerts.$inferInsert;

/**
 * Webhook Events - logs all webhook events from Stripe
 */
export const webhookEvents = pgTable("webhookEvents", {
  id: serial("id").primaryKey(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  stripeEventId: varchar("stripeEventId", { length: 255 }).notNull().unique(),
  payload: text("payload").notNull(), // JSON string
  processed: boolean("processed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;

/**
 * Weekly Content - stores tesis, jurisprudencias y criterios for weekly digest
 */
export const weeklyContent = pgTable("weeklyContent", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  contentType: varchar("contentType", { length: 50 }).notNull(), // "tesis", "jurisprudencia", "criterio"
  tribunal: varchar("tribunal", { length: 200 }),
  materia: varchar("materia", { length: 200 }),
  tesis: varchar("tesis", { length: 100 }),
  excerpt: text("excerpt"),
  fullText: text("fullText"),
  url: text("url"),
  publishedDate: timestamp("publishedDate"),
  weekNumber: integer("weekNumber").notNull(),
  year: integer("year").notNull(),
  resumenIA: text("resumenIA"), // AI-generated summary
  areasDetectadas: text("areasDetectadas"), // Comma-separated list of detected practice areas
  relevancia: varchar("relevancia", { length: 20 }), // "alta", "media", "baja"
  s3Key: varchar("s3Key", { length: 500 }), // S3 storage key for full document
  scrapedAt: timestamp("scrapedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeeklyContent = typeof weeklyContent.$inferSelect;
export type InsertWeeklyContent = typeof weeklyContent.$inferInsert;

/**
 * Sent Weekly Alerts - tracks which weekly digests have been sent to which users
 */
export const sentWeeklyAlerts = pgTable("sentWeeklyAlerts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentId: integer("contentId").notNull().references(() => weeklyContent.id, { onDelete: "cascade" }),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  emailStatus: varchar("emailStatus", { length: 50 }).default("sent").notNull(),
});

export type SentWeeklyAlert = typeof sentWeeklyAlerts.$inferSelect;
export type InsertSentWeeklyAlert = typeof sentWeeklyAlerts.$inferInsert;
