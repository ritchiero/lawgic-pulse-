import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { 
  InsertUser, users, 
  subscriptions, InsertSubscription,
  userAreas, InsertUserArea,
  dofDocuments, InsertDofDocument,
  sentAlerts, InsertSentAlert,
  webhookEvents, InsertWebhookEvent
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({ connectionString: process.env.DATABASE_URL });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    // PostgreSQL upsert using ON CONFLICT
    await db.insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: {
          name: values.name,
          email: values.email,
          loginMethod: values.loginMethod,
          role: values.role,
          lastSignedIn: values.lastSignedIn,
          updatedAt: new Date(),
        }
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Subscription helpers
export async function createSubscription(data: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(subscriptions).values(data).returning();
  return result[0];
}

export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result[0];
}

export async function updateSubscription(userId: number, data: Partial<InsertSubscription>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subscriptions).set({ ...data, updatedAt: new Date() }).where(eq(subscriptions.userId, userId));
}

export async function getActiveSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptions).where(eq(subscriptions.status, "active"));
}

// User areas helpers
export async function setUserAreas(userId: number, areaIds: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete existing areas
  await db.delete(userAreas).where(eq(userAreas.userId, userId));
  
  // Insert new areas
  if (areaIds.length > 0) {
    await db.insert(userAreas).values(
      areaIds.map(areaId => ({ userId, areaId }))
    );
  }
}

export async function getUserAreas(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userAreas).where(eq(userAreas.userId, userId));
}

// DOF documents helpers
export async function createDofDocument(data: InsertDofDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dofDocuments).values(data).returning();
  return result[0];
}

export async function getDocumentsByDate(date: Date) {
  const db = await getDb();
  if (!db) return [];
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return db.select().from(dofDocuments);
}

// Sent alerts helpers
export async function createSentAlert(data: InsertSentAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(sentAlerts).values(data);
}

export async function hasAlertBeenSent(userId: number, documentId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(sentAlerts)
    .where(and(
      eq(sentAlerts.userId, userId),
      eq(sentAlerts.documentId, documentId)
    ))
    .limit(1);
  return result.length > 0;
}

// Webhook events helpers
export async function createWebhookEvent(data: InsertWebhookEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(webhookEvents).values(data).returning();
  return result[0];
}

export async function getWebhookEventByStripeId(stripeEventId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(webhookEvents)
    .where(eq(webhookEvents.stripeEventId, stripeEventId))
    .limit(1);
  return result[0];
}

export async function markWebhookProcessed(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(webhookEvents).set({ processed: true }).where(eq(webhookEvents.id, id));
}

// ============================================
// Weekly Content Helpers
// ============================================

export async function getWeeklyContentByWeek(weekNumber: number, year: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { weeklyContent } = await import('../drizzle/schema');
  
  return db.select().from(weeklyContent)
    .where(
      and(
        eq(weeklyContent.weekNumber, weekNumber),
        eq(weeklyContent.year, year)
      )
    );
}

export async function createSentWeeklyAlert(alert: {
  userId: number;
  contentId: number;
}) {
  const db = await getDb();
  if (!db) return;
  
  const { sentWeeklyAlerts } = await import('../drizzle/schema');
  
  await db.insert(sentWeeklyAlerts).values(alert);
}

// Custom keywords management
export async function updateCustomKeywords(userId: number, keywords: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update custom keywords: database not available");
    return;
  }

  await db.update(subscriptions)
    .set({ customKeywords: keywords, updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId));
}

export async function getCustomKeywords(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get custom keywords: database not available");
    return null;
  }

  const result = await db.select({ customKeywords: subscriptions.customKeywords })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0].customKeywords : null;
}
