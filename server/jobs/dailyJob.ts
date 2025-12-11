/**
 * Daily Job - Lawgic Pulse
 * Runs every day at 7:00 AM Mexico City time
 * 
 * Pipeline:
 * 1. Scrape DOF for today's documents
 * 2. Classify documents with AI
 * 3. Match documents to users and send emails
 */

import { scrapeDOF, saveScrapedDocuments } from '../services/dofScraper';
import { classifyDocument } from '../services/aiClassifier';
import { sendDailyAlert } from '../services/emailService';
import { notifyOwner } from '../_core/notification';
import * as db from '../db';

export async function runDailyJob() {
  const startTime = Date.now();
  console.log('[Daily Job] Starting...');

  try {
    // Step 1: Scrape DOF
    console.log('[Daily Job] Step 1: Scraping DOF...');
    const today = new Date();
    const documents = await scrapeDOF(today);
    
    if (documents.length === 0) {
      console.log('[Daily Job] No documents found for today');
      await notifyOwner({
        title: '⚠️ Lawgic Pulse - Sin documentos',
        content: `No se encontraron documentos en el DOF para ${today.toLocaleDateString('es-MX')}`
      });
      return;
    }

    console.log(`[Daily Job] Found ${documents.length} documents`);

    // Step 2: Save documents to database and S3
    console.log('[Daily Job] Step 2: Saving documents...');
    const savedIds = await saveScrapedDocuments(documents, today);
    console.log(`[Daily Job] Saved ${savedIds.length} documents`);

    // Step 3: Classify documents with AI
    console.log('[Daily Job] Step 3: Classifying documents with AI...');
    const unprocessedDocs = await db.getUnprocessedDocuments();
    
    let classifiedCount = 0;
    for (const doc of unprocessedDocs) {
      try {
        const classification = await classifyDocument(
          doc.title,
          doc.contentExcerpt || ''
        );

        await db.updateDocumentProcessed(
          doc.id,
          classification.summary,
          classification.areas
        );

        classifiedCount++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`[Daily Job] Error classifying document ${doc.id}:`, error);
      }
    }

    console.log(`[Daily Job] Classified ${classifiedCount} documents`);

    // Step 4: Match and send emails
    console.log('[Daily Job] Step 4: Matching and sending emails...');
    const activeSubscriptions = await db.getActiveSubscriptions();
    console.log(`[Daily Job] Found ${activeSubscriptions.length} active subscriptions`);

    const processedDocs = await db.getDocumentsByDate(today);
    let emailsSent = 0;

    for (const subscription of activeSubscriptions) {
      try {
        // Get user and their areas
        const userAreas = await db.getUserAreas(subscription.userId);
        const userAreaCodes = userAreas.map(a => a.areaId);

        if (userAreaCodes.length === 0) {
          console.log(`[Daily Job] User ${subscription.userId} has no areas configured`);
          continue;
        }

        // Find matching documents
        const matchingDocs = processedDocs.filter(doc => {
          if (!doc.detectedAreas) return false;
          
          try {
            const docAreas = JSON.parse(doc.detectedAreas);
            return docAreas.some((area: string) => userAreaCodes.includes(area));
          } catch {
            return false;
          }
        });

        if (matchingDocs.length === 0) {
          console.log(`[Daily Job] No matching documents for user ${subscription.userId}`);
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

        // Send email
        const emailDocuments = matchingDocs.map(doc => ({
          title: doc.title,
          documentType: doc.documentType || 'Documento',
          dofUrl: doc.dofUrl,
          aiSummary: doc.aiSummary || 'Resumen no disponible',
          detectedAreas: JSON.parse(doc.detectedAreas || '[]')
        }));

        const emailId = await sendDailyAlert({
          to: user.email || '',
          userName: user.name || '',
          documents: emailDocuments,
          date: today
        });

        if (emailId) {
          // Record sent alerts
          for (const doc of matchingDocs) {
            await db.createSentAlert({
              userId: subscription.userId,
              documentId: doc.id,
              emailId
            });
          }

          emailsSent++;
          console.log(`[Daily Job] Sent email to user ${subscription.userId} with ${matchingDocs.length} documents`);
        }

      } catch (error) {
        console.error(`[Daily Job] Error processing user ${subscription.userId}:`, error);
      }
    }

    // Step 5: Report results
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`[Daily Job] Completed in ${duration}s`);

    await notifyOwner({
      title: '✅ Lawgic Pulse - Job diario completado',
      content: `Documentos: ${documents.length}\nClasificados: ${classifiedCount}\nEmails enviados: ${emailsSent}\nDuración: ${duration}s`
    });

  } catch (error) {
    console.error('[Daily Job] Fatal error:', error);

    await notifyOwner({
      title: '❌ Lawgic Pulse - Error en job diario',
      content: `Error: ${error}`
    });
  }
}

// Allow running directly with: node --loader tsx server/jobs/dailyJob.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  runDailyJob()
    .then(() => {
      console.log('[Daily Job] Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Daily Job] Failed:', error);
      process.exit(1);
    });
}
