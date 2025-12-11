/**
 * Job Router
 * Provides endpoints to trigger jobs manually (for testing and admin)
 */

import { router, publicProcedure } from "../_core/trpc";
import { runDailyJob } from "../jobs/dailyJob";
import { z } from "zod";

export const jobRouter = router({
  // Trigger daily job manually
  runDaily: publicProcedure
    .input(z.object({
      apiKey: z.string()
    }))
    .mutation(async ({ input }) => {
      // Simple API key protection
      const expectedKey = process.env.ADMIN_API_KEY || 'change-me-in-production';
      
      if (input.apiKey !== expectedKey) {
        throw new Error('Invalid API key');
      }

      // Run job in background
      runDailyJob().catch(error => {
        console.error('[Job Router] Daily job failed:', error);
      });

      return { success: true, message: 'Daily job started' };
    })
});
