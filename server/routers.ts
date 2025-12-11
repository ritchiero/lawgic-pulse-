import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { PRACTICE_AREA_CODES, PRACTICE_AREAS } from "../shared/practiceAreas";
import * as db from "./db";
import { createCheckoutSession } from "./services/stripeService";
import { sendWelcomeEmail } from "./services/emailService";
import { TRPCError } from "@trpc/server";
import { jobRouter } from "./routers/jobRouter";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  subscription: router({
    // Get practice areas catalog
    getPracticeAreas: publicProcedure.query(() => {
      return PRACTICE_AREA_CODES.map(code => ({
        code,
        name: PRACTICE_AREAS[code].name
      }));
    }),

    // Create subscription and get checkout URL
    create: publicProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        areas: z.array(z.string()).min(1, "Selecciona al menos un área")
      }))
      .mutation(async ({ input }) => {
        // Validate areas
        const validAreas = input.areas.filter(a => PRACTICE_AREA_CODES.includes(a));
        if (validAreas.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Áreas de práctica inválidas'
          });
        }

        // Create user (or get existing)
        let user = await db.getUserByOpenId(input.email);
        if (!user) {
          await db.upsertUser({
            openId: input.email,
            email: input.email,
            name: input.name || null,
            role: 'user'
          });
          user = await db.getUserByOpenId(input.email);
        }

        if (!user) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error creando usuario'
          });
        }

        // Create active subscription (no payment required for testing)
        await db.createSubscription({
          userId: user.id,
          status: 'active'
        });

        // Save selected areas
        await db.setUserAreas(user.id, validAreas);

        // Send welcome email
        try {
          const { sendWelcomeEmail } = await import('./services/emailService');
          await sendWelcomeEmail(input.email, input.name || '');
        } catch (error) {
          console.error('[Subscription] Error sending welcome email:', error);
        }

        // Notify owner
        try {
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: '🎉 Lawgic Pulse - Nueva suscripción',
            content: `Email: ${input.email}\nÁreas: ${validAreas.join(', ')}`
          });
        } catch (error) {
          console.error('[Subscription] Error notifying owner:', error);
        }

        // Return success (no Stripe redirect)
        return { 
          success: true,
          redirectUrl: '/gracias'
        };
      }),

    // Get user subscription status
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await db.getSubscriptionByUserId(ctx.user.id);
      const areas = await db.getUserAreas(ctx.user.id);

      return {
        subscription,
        areas: areas.map(a => a.areaCode)
      };
    })
  }),

  job: jobRouter,
});

export type AppRouter = typeof appRouter;
