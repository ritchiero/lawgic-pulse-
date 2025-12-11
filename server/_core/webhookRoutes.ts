/**
 * Webhook routes configuration
 * Registers webhook endpoints before tRPC middleware
 */

import { Express, json, raw } from 'express';
import { handleStripeWebhook } from '../webhooks/stripe';

export function registerWebhookRoutes(app: Express) {
  // Stripe webhook needs raw body for signature verification
  app.post(
    '/api/webhooks/stripe',
    raw({ type: 'application/json' }),
    handleStripeWebhook
  );
  
  console.log('[Webhooks] Registered: POST /api/webhooks/stripe');
}
