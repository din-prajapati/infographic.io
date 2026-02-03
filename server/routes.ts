import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { paymentProviderFactory } from "./payments/providers/payment-provider.factory";
import { 
  type PaymentProvider 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // ==========================================
  // WEBHOOK ROUTES (Multi-Provider)
  // Payment API routes have been moved to NestJS (/api/v1/payments/*)
  // Webhook routes remain in Express due to raw body requirement for signature verification
  // ==========================================

  /**
   * POST /api/webhooks/:provider
   * Unified webhook handler for all payment providers
   * Examples:
   *   - POST /api/webhooks/razorpay
   *   - POST /api/webhooks/stripe
   *   - POST /api/webhooks/paddle
   * 
   * IMPORTANT: Webhook signature verification requires raw body.
   * The rawBody is attached by express.json() middleware with verify callback.
   * See server/index.ts for the middleware configuration.
   */
  app.post('/api/webhooks/:provider', async (req: Request, res: Response) => {
    try {
      const providerParam = req.params.provider.toUpperCase() as PaymentProvider;
      
      // Validate provider is supported
      if (!paymentProviderFactory.isProviderAvailable(providerParam)) {
        return res.status(400).json({ error: `Unsupported provider: ${providerParam}` });
      }

      const provider = paymentProviderFactory.getProvider(null, providerParam);
      
      // Use raw body for signature verification if available, otherwise use JSON stringify
      // Note: For production, configure express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })
      const webhookBody = (req as any).rawBody?.toString() || JSON.stringify(req.body);

      // Get provider-specific signature and secret
      let signature: string | undefined;
      let secret: string | undefined;

      switch (providerParam) {
        case 'RAZORPAY':
          signature = req.headers['x-razorpay-signature'] as string;
          secret = process.env.RAZORPAY_WEBHOOK_SECRET;
          break;
        case 'STRIPE':
          signature = req.headers['stripe-signature'] as string;
          secret = process.env.STRIPE_WEBHOOK_SECRET;
          break;
        case 'PADDLE':
          signature = req.headers['paddle-signature'] as string;
          secret = process.env.PADDLE_WEBHOOK_SECRET;
          break;
        default:
          return res.status(400).json({ error: 'Provider signature not found' });
      }

      if (!signature || !secret) {
        return res.status(401).json({ error: 'Missing webhook signature or secret' });
      }

      // Verify webhook signature
      const isValid = provider.verifyWebhookSignature(webhookBody, signature, secret);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      const event = req.body;
      
      // Map provider-specific event names to internal event format
      let internalEvent = event.event || event.type;
      if (providerParam === 'STRIPE') {
        const stripeEventMap: Record<string, string> = {
          'customer.subscription.created': 'subscription.activated',
          'customer.subscription.updated': 'subscription.activated',
          'invoice.payment_succeeded': 'subscription.charged',
          'invoice.paid': 'subscription.charged',
          'customer.subscription.deleted': 'subscription.cancelled',
          'invoice.payment_failed': 'payment.failed',
        };
        internalEvent = stripeEventMap[event.type] || event.type;
      }
      
      console.log(`Webhook received from ${providerParam}:`, event.type || event.event, `-> ${internalEvent}`);

      // Forward to NestJS internal webhook endpoint
      const apiPort = process.env.API_PORT || '3001';
      const nestjsUrl = `http://localhost:${apiPort}/api/v1/payments/webhooks/internal`;
      
      try {
        const response = await fetch(nestjsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Request': 'true',
          },
          body: JSON.stringify({
            provider: providerParam.toLowerCase(),
            event: event,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`NestJS webhook endpoint error: ${response.status} - ${errorText}`);
          return res.status(500).json({ error: 'Failed to process webhook' });
        }

        const result = await response.json();
        return res.json(result);
      } catch (error: any) {
        console.error('Error forwarding webhook to NestJS:', error);
        return res.status(500).json({ error: error.message || 'Failed to forward webhook' });
      }
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // EXISTING APPLICATION ROUTES
  // ==========================================

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
