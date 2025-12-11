/**
 * Stripe Webhook Handler
 * Processes Stripe events for subscription lifecycle
 */

import { Request, Response } from 'express';
import * as db from '../db';
import {
  verifyWebhookSignature,
  extractCheckoutData,
  extractSubscriptionDeletedData,
  extractSubscriptionUpdatedData,
  mapSubscriptionStatus
} from '../services/stripeService';
import { sendWelcomeEmail } from '../services/emailService';
import { notifyOwner } from '../_core/notification';

/**
 * Handles Stripe webhook events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'];
  
  if (!signature || typeof signature !== 'string') {
    return res.status(400).send('Missing stripe-signature header');
  }
  
  try {
    // Verify webhook signature
    const event = verifyWebhookSignature(req.body, signature);
    
    // Check if we've already processed this event
    const existingEvent = await db.getWebhookEventByStripeId(event.id);
    if (existingEvent) {
      console.log(`[Stripe Webhook] Event ${event.id} already processed`);
      return res.json({ received: true, duplicate: true });
    }
    
    // Log the event
    await db.createWebhookEvent({
      stripeEventId: event.id,
      eventType: event.type,
      payload: JSON.stringify(event),
      processed: false
    });
    
    // Process based on event type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event);
        break;
        
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
    
    // Mark as processed
    const savedEvent = await db.getWebhookEventByStripeId(event.id);
    if (savedEvent) {
      await db.markWebhookProcessed(savedEvent.id);
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    res.status(400).send(`Webhook Error: ${error}`);
  }
}

/**
 * Handles checkout.session.completed event
 */
async function handleCheckoutCompleted(event: any) {
  const data = extractCheckoutData(event);
  if (!data) return;
  
  console.log(`[Stripe Webhook] Checkout completed for user ${data.userId}`);
  
  try {
    // Update subscription to active
    await db.updateSubscription(data.userId, {
      stripeCustomerId: data.customerId,
      stripeSubscriptionId: data.subscriptionId,
      status: 'active'
    });
    
    // Get user info
    const user = await db.getUserByOpenId(data.customerEmail);
    if (!user) {
      console.error(`[Stripe Webhook] User not found: ${data.customerEmail}`);
      return;
    }
    
    // Send welcome email
    await sendWelcomeEmail(data.customerEmail, user.name || '');
    
    // Notify owner
    const areas = await db.getUserAreas(data.userId);
    await notifyOwner({
      title: '🎉 Nueva suscripción en Lawgic Pulse',
      content: `Usuario: ${user.name || user.email}\nÁreas: ${areas.map(a => a.areaId).join(', ')}`
    });
    
  } catch (error) {
    console.error('[Stripe Webhook] Error processing checkout:', error);
  }
}

/**
 * Handles customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(event: any) {
  const data = extractSubscriptionDeletedData(event);
  if (!data) return;
  
  console.log(`[Stripe Webhook] Subscription deleted: ${data.subscriptionId}`);
  
  try {
    // Find subscription by Stripe ID
    const db_instance = await db.getDb();
    if (!db_instance) return;
    
    const { subscriptions } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    
    const results = await db_instance
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, data.subscriptionId))
      .limit(1);
    
    if (results.length === 0) {
      console.error(`[Stripe Webhook] Subscription not found: ${data.subscriptionId}`);
      return;
    }
    
    const subscription = results[0];
    
    // Update to cancelled
    await db.updateSubscription(subscription.userId, {
      status: 'cancelled'
    });
    
    // Notify owner
    await notifyOwner({
      title: '❌ Cancelación de suscripción en Lawgic Pulse',
      content: `Subscription ID: ${data.subscriptionId}`
    });
    
  } catch (error) {
    console.error('[Stripe Webhook] Error processing cancellation:', error);
  }
}

/**
 * Handles customer.subscription.updated event
 */
async function handleSubscriptionUpdated(event: any) {
  const data = extractSubscriptionUpdatedData(event);
  if (!data) return;
  
  console.log(`[Stripe Webhook] Subscription updated: ${data.subscriptionId} -> ${data.status}`);
  
  try {
    // Find subscription by Stripe ID
    const db_instance = await db.getDb();
    if (!db_instance) return;
    
    const { subscriptions } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    
    const results = await db_instance
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, data.subscriptionId))
      .limit(1);
    
    if (results.length === 0) {
      console.error(`[Stripe Webhook] Subscription not found: ${data.subscriptionId}`);
      return;
    }
    
    const subscription = results[0];
    const mappedStatus = mapSubscriptionStatus(data.status);
    
    // Update subscription
    await db.updateSubscription(subscription.userId, {
      status: mappedStatus,
      currentPeriodEnd: new Date(data.currentPeriodEnd * 1000)
    });
    
  } catch (error) {
    console.error('[Stripe Webhook] Error processing update:', error);
  }
}

/**
 * Handles invoice.payment_failed event
 */
async function handlePaymentFailed(event: any) {
  const invoice = event.data.object;
  const subscriptionId = invoice.subscription;
  
  console.log(`[Stripe Webhook] Payment failed for subscription: ${subscriptionId}`);
  
  try {
    // Find subscription by Stripe ID
    const db_instance = await db.getDb();
    if (!db_instance) return;
    
    const { subscriptions } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    
    const results = await db_instance
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
      .limit(1);
    
    if (results.length === 0) {
      console.error(`[Stripe Webhook] Subscription not found: ${subscriptionId}`);
      return;
    }
    
    const subscription = results[0];
    
    // Update to past_due
    await db.updateSubscription(subscription.userId, {
      status: 'past_due'
    });
    
    // Notify owner
    await notifyOwner({
      title: '⚠️ Pago fallido en Lawgic Pulse',
      content: `Subscription ID: ${subscriptionId}`
    });
    
  } catch (error) {
    console.error('[Stripe Webhook] Error processing payment failure:', error);
  }
}
