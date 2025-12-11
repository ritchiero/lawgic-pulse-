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
      const customKeywords = await db.getCustomKeywords(ctx.user.id);

      return {
        subscription,
        areas: areas.map(a => a.areaCode),
        customKeywords: customKeywords || ''
      };
    }),

    // Update user areas
    updateAreas: protectedProcedure
      .input(z.object({
        areas: z.array(z.string()).min(1, 'Selecciona al menos un área')
      }))
      .mutation(async ({ ctx, input }) => {
        const validAreas = input.areas.filter(a => PRACTICE_AREA_CODES.includes(a));
        if (validAreas.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Áreas de práctica inválidas'
          });
        }

        await db.setUserAreas(ctx.user.id, validAreas);
        return { success: true };
      }),

    // Update custom keywords
    updateKeywords: protectedProcedure
      .input(z.object({
        keywords: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateCustomKeywords(ctx.user.id, input.keywords);
        return { success: true };
      }),

    // Cancel subscription
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getSubscriptionByUserId(ctx.user.id);
      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No se encontró suscripción activa'
        });
      }

      await db.updateSubscription(ctx.user.id, { status: 'cancelled' });

      // Notify owner
      try {
        const { notifyOwner } = await import('./_core/notification');
        await notifyOwner({
          title: '❌ Lawgic Pulse - Cancelación de suscripción',
          content: `Usuario: ${ctx.user.email}\nID: ${ctx.user.id}`
        });
      } catch (error) {
        console.error('[Subscription] Error notifying owner:', error);
      }

      return { success: true };
    })
  }),

  job: jobRouter,

  // Public preview of daily report
  preview: router({
    getDaily: publicProcedure
      .input(z.object({
        areas: z.array(z.string()).optional()
      }))
      .query(async ({ input }) => {
        try {
          const { scrapeDOF } = await import('./services/dofScraper');
          const { classifyDocument } = await import('./services/aiClassifier');
          
          // Scrape today's DOF
          const today = new Date();
          const documents = await scrapeDOF(today);
          
          // If no documents, return sample data
          if (documents.length === 0) {
            return {
              date: new Date().toISOString(),
              documents: [
                {
                  title: "ACUERDO por el que se modifica el diverso que establece el horario de verano",
                  documentType: "ACUERDO",
                  areas: ["administrativo"],
                  summary: "Se establecen las fechas de inicio y término del horario de verano para el ejercicio fiscal 2025.",
                  url: "https://www.dof.gob.mx/nota_detalle.php?codigo=5000000&fecha=10/12/2024"
                },
                {
                  title: "DECRETO por el que se reforman diversas disposiciones de la Ley del ISR",
                  documentType: "DECRETO",
                  areas: ["fiscal"],
                  summary: "Se modifican los artículos 25 y 28 de la LISR para actualizar las deducciones autorizadas y el tratamiento de inversiones.",
                  url: "https://www.dof.gob.mx/nota_detalle.php?codigo=5000001&fecha=10/12/2024"
                },
                {
                  title: "RESOLUCIÓN que modifica la Resolución Miscelánea Fiscal para 2024",
                  documentType: "RESOLUCIÓN",
                  areas: ["fiscal", "comercio_exterior"],
                  summary: "Se actualizan las reglas para la presentación de declaraciones complementarias y se establecen facilidades para contribuyentes del sector exportador.",
                  url: "https://www.dof.gob.mx/nota_detalle.php?codigo=5000002&fecha=10/12/2024"
                }
              ],
              isSample: true
            };
          }
          
          // Classify documents with AI
          const classified = await Promise.all(
            documents.slice(0, 10).map(async (doc) => {
              const classification = await classifyDocument(doc.title, doc.contentExcerpt || '');
              return {
                title: doc.title,
                documentType: doc.documentType,
                areas: classification.areas,
                summary: classification.summary,
                url: doc.dofUrl
              };
            })
          );
          
          // Filter by areas if provided
          let filtered = classified;
          if (input.areas && input.areas.length > 0) {
            filtered = classified.filter(doc => 
              doc.areas.some(area => input.areas!.includes(area))
            );
          }
          
          return {
            date: new Date().toISOString(),
            documents: filtered,
            isSample: false
          };
        } catch (error) {
          console.error('[Preview] Error generating preview:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error al generar vista previa'
          });
        }
      })
  }),
});

export type AppRouter = typeof appRouter;
