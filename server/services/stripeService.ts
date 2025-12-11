/**
 * Stripe Service
 * Handles subscription payments and webhooks
 */

import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

export interface CreateCheckoutParams {
  email: string;
  userId: number;
  areas: string[];
  successUrl: string;
  cancelUrl: string;
}

/**
 * Creates a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(params: CreateCheckoutParams): Promise<string> {
  const stripe = getStripe();
  
  if (!process.env.STRIPE_PRICE_ID) {
    throw new Error('STRIPE_PRICE_ID not configured');
  }
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: process.env.STRIPE_PRICE_ID,
      quantity: 1
    }],
    customer_email: params.email,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId.toString(),
      areas: params.areas.join(',')
    },
    subscription_data: {
      metadata: {
        userId: params.userId.toString()
      }
    }
  });
  
  return session.url!;
}

/**
 * Creates a customer portal session for subscription management
 */
export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const stripe = getStripe();
  
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });
  
  return session.url;
}

/**
 * Verifies Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }
  
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

/**
 * Processes checkout.session.completed event
 */
export interface CheckoutCompletedData {
  customerId: string;
  subscriptionId: string;
  userId: number;
  customerEmail: string;
}

export function extractCheckoutData(event: Stripe.Event): CheckoutCompletedData | null {
  if (event.type !== 'checkout.session.completed') {
    return null;
  }
  
  const session = event.data.object as Stripe.Checkout.Session;
  
  return {
    customerId: session.customer as string,
    subscriptionId: session.subscription as string,
    userId: parseInt(session.metadata?.userId || '0'),
    customerEmail: session.customer_email || session.customer_details?.email || ''
  };
}

/**
 * Processes customer.subscription.deleted event
 */
export interface SubscriptionDeletedData {
  subscriptionId: string;
  customerId: string;
}

export function extractSubscriptionDeletedData(event: Stripe.Event): SubscriptionDeletedData | null {
  if (event.type !== 'customer.subscription.deleted') {
    return null;
  }
  
  const subscription = event.data.object as Stripe.Subscription;
  
  return {
    subscriptionId: subscription.id,
    customerId: subscription.customer as string
  };
}

/**
 * Processes customer.subscription.updated event
 */
export interface SubscriptionUpdatedData {
  subscriptionId: string;
  customerId: string;
  status: string;
  currentPeriodEnd: number;
}

export function extractSubscriptionUpdatedData(event: Stripe.Event): SubscriptionUpdatedData | null {
  if (event.type !== 'customer.subscription.updated') {
    return null;
  }
  
  const subscription = event.data.object as Stripe.Subscription;
  
  return {
    subscriptionId: subscription.id,
    customerId: subscription.customer as string,
    status: subscription.status,
    currentPeriodEnd: (subscription as any).current_period_end
  };
}

/**
 * Maps Stripe subscription status to our internal status
 */
export function mapSubscriptionStatus(stripeStatus: string): 'active' | 'cancelled' | 'past_due' | 'pending' {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'canceled':
    case 'cancelled':
      return 'cancelled';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    default:
      return 'pending';
  }
}
