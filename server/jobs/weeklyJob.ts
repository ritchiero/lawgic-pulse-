/**
 * Weekly Job - Lawgic Pulse
 * Runs every Friday to scrape and send tesis, jurisprudencias y criterios
 * 
 * Pipeline:
 * 1. Scrape judicial content from SCJN
 * 2. Classify content with AI
 * 3. Match content to users and send weekly digest
 */

import { scrapeJudicialContent, saveJudicialContent } from '../services/judicialScraper';
import { classifyDocument } from '../services/aiClassifier';
import { sendWeeklyDigest } from '../services/emailService';
import { notifyOwner } from '../_core/notification';
import * as db from '../db';

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week: weekNo, year: d.getUTCFullYear() };
}

export async function runWeeklyJob() {
  const startTime = Date.now();
  console.log('[Weekly Job] Starting...');

  try {
    const today = new Date();
    const { week, year } = getWeekNumber(today);
    
    // Step 1: Scrape judicial content
    console.log('[Weekly Job] Step 1: Scraping judicial content...');
    const content = await scrapeJudicialContent(week, year);
    
    if (content.length === 0) {
      console.log('[Weekly Job] No content found for this week');
      await notifyOwner({
        title: '⚠️ Lawgic Pulse - Sin contenido semanal',
        content: `No se encontró contenido judicial para la semana ${week} de ${year}`
      });
      return;
    }

    console.log(`[Weekly Job] Found ${content.length} items`);

    // Step 2: Save content to database and S3
    console.log('[Weekly Job] Step 2: Saving content...');
    const savedIds = await saveJudicialContent(content, week, year);
    console.log(`[Weekly Job] Saved ${savedIds.length} items`);

    // Step 3: Classify content with AI
    console.log('[Weekly Job] Step 3: Classifying content with AI...');
    // Note: Classification would happen here in production
    // For now, we'll work with scraped content directly
    console.log('[Weekly Job] Skipping AI classification for now');
    let classifiedCount = 0;

    // Step 4: Match and send weekly digests
    console.log('[Weekly Job] Step 4: Matching and sending digests...');
    const activeSubscriptions = await db.getActiveSubscriptions();
    console.log(`[Weekly Job] Found ${activeSubscriptions.length} active subscriptions`);

    const processedContent = await db.getWeeklyContentByWeek(week, year);
    let emailsSent = 0;

    for (const subscription of activeSubscriptions) {
      try {
        // Get user and their areas
        const userAreas = await db.getUserAreas(subscription.userId);
        const userAreaCodes = userAreas.map(a => a.areaId);

        if (userAreaCodes.length === 0) {
          console.log(`[Weekly Job] User ${subscription.userId} has no areas configured`);
          continue;
        }

        // Find matching content
        const matchingContent = processedContent.filter(item => {
          if (!item.areasDetectadas) return false;
          
          try {
            const itemAreas = JSON.parse(item.areasDetectadas);
            return itemAreas.some((area: string) => userAreaCodes.includes(area));
          } catch {
            return false;
          }
        });

        if (matchingContent.length === 0) {
          console.log(`[Weekly Job] No matching content for user ${subscription.userId}`);
          continue;
        }

        // Get user info
        const db_instance = await db.getDb();
        if (!db_instance) continue;

        const { users } = await import('../../drizzle/schema');
        const { eq } = await import('drizzle-orm');

        const userResults = await db_instance
          .select()
          .from(users)
          .where(eq(users.id, subscription.userId))
          .limit(1);

        if (userResults.length === 0) continue;
        const user = userResults[0];

        // Send weekly digest
        const digestItems = matchingContent.map(item => ({
          contentType: item.contentType,
          title: item.title,
          tesis: item.tesis || '',
          tribunal: item.tribunal || '',
          sourceUrl: item.url || '',
          aiSummary: item.resumenIA || 'Resumen no disponible',
          detectedAreas: JSON.parse(item.areasDetectadas || '[]')
        }));

        const emailId = await sendWeeklyDigest({
          to: user.email || '',
          userName: user.name || '',
          content: digestItems,
          weekNumber: week,
          year
        });

        if (emailId) {
          // Record sent alerts
          for (const item of matchingContent) {
            await db.createSentWeeklyAlert({
              userId: subscription.userId,
              contentId: item.id
            });
          }

          emailsSent++;
          console.log(`[Weekly Job] Sent digest to user ${subscription.userId} with ${matchingContent.length} items`);
        }

      } catch (error) {
        console.error(`[Weekly Job] Error processing user ${subscription.userId}:`, error);
      }
    }

    // Step 5: Report results
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`[Weekly Job] Completed in ${duration}s`);

    await notifyOwner({
      title: '✅ Lawgic Pulse - Job semanal completado',
      content: `Semana ${week}/${year}\nContenido: ${content.length}\nClasificados: ${classifiedCount}\nDigests enviados: ${emailsSent}\nDuración: ${duration}s`
    });

  } catch (error) {
    console.error('[Weekly Job] Fatal error:', error);

    await notifyOwner({
      title: '❌ Lawgic Pulse - Error en job semanal',
      content: `Error: ${error}`
    });
  }
}

// Allow running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runWeeklyJob()
    .then(() => {
      console.log('[Weekly Job] Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Weekly Job] Failed:', error);
      process.exit(1);
    });
}
