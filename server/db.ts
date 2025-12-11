import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
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
  const result = await db.insert(subscriptions).values(data);
  return result;
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
  await db.update(subscriptions).set(data).where(eq(subscriptions.userId, userId));
}

export async function getActiveSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptions).where(eq(subscriptions.status, "active"));
}

// User areas helpers
export async function setUserAreas(userId: number, areaCodes: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete existing areas
  await db.delete(userAreas).where(eq(userAreas.userId, userId));
  
  // Insert new areas
  if (areaCodes.length > 0) {
    await db.insert(userAreas).values(
      areaCodes.map(code => ({ userId, areaCode: code }))
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
  const result = await db.insert(dofDocuments).values(data);
  return result;
}

export async function getUnprocessedDocuments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dofDocuments).where(eq(dofDocuments.processed, 0));
}

export async function updateDocumentProcessed(id: number, aiSummary: string, detectedAreas: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dofDocuments).set({
    aiSummary,
    detectedAreas: JSON.stringify(detectedAreas),
    processed: 1
  }).where(eq(dofDocuments.id, id));
}

export async function getDocumentsByDate(date: Date) {
  const db = await getDb();
  if (!db) return [];
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return db.select().from(dofDocuments)
    .where(and(
      eq(dofDocuments.processed, 1)
    ));
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
  const result = await db.insert(webhookEvents).values(data);
  return result;
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
  await db.update(webhookEvents).set({ processed: 1 }).where(eq(webhookEvents.id, id));
}

// ============================================
// Weekly Content Helpers
// ============================================

export async function getUnprocessedWeeklyContent() {
  const db = await getDb();
  if (!db) return [];
  
  const { weeklyContent } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  return db.select().from(weeklyContent).where(eq(weeklyContent.processed, 0));
}

export async function updateWeeklyContentProcessed(
  id: number,
  aiSummary: string,
  detectedAreas: string[]
) {
  const db = await getDb();
  if (!db) return;
  
  const { weeklyContent } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  await db.update(weeklyContent)
    .set({
      aiSummary,
      detectedAreas: JSON.stringify(detectedAreas),
      processed: 1
    })
    .where(eq(weeklyContent.id, id));
}

export async function getWeeklyContentByWeek(weekNumber: number, year: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { weeklyContent } = await import('../drizzle/schema');
  const { eq, and } = await import('drizzle-orm');
  
  return db.select().from(weeklyContent)
    .where(
      and(
        eq(weeklyContent.weekNumber, weekNumber),
        eq(weeklyContent.year, year),
        eq(weeklyContent.processed, 1)
      )
    );
}

export async function createSentWeeklyAlert(alert: {
  userId: number;
  contentId: number;
  emailId: string;
}) {
  const db = await getDb();
  if (!db) return;
  
  const { sentWeeklyAlerts } = await import('../drizzle/schema');
  
  await db.insert(sentWeeklyAlerts).values(alert);
}
