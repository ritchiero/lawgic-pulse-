/**
 * Judicial Scraper
 * Scrapes tesis, jurisprudencias y criterios from Semanario Judicial de la Federación
 * Source: https://sjf.scjn.gob.mx/
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { storagePut } from '../storage';

export interface JudicialContent {
  contentType: 'tesis' | 'jurisprudencia' | 'criterio';
  title: string;
  registrationNumber?: string;
  tribunal?: string;
  epoch?: string;
  contentText: string;
  excerpt: string;
  sourceUrl: string;
  publicationDate: Date;
}

/**
 * Scrapes recent tesis and jurisprudencias from SCJN
 * Note: This is a simplified implementation. The actual SCJN website may require
 * more complex scraping or API integration.
 */
export async function scrapeJudicialContent(weekNumber: number, year: number): Promise<JudicialContent[]> {
  console.log(`[Judicial Scraper] Scraping week ${weekNumber} of ${year}...`);
  
  const results: JudicialContent[] = [];
  
  try {
    // SCJN's search page for recent content
    // Note: This URL is illustrative - actual implementation may need adjustment
    const baseUrl = 'https://sjf.scjn.gob.mx/sjfsist/paginas/tesis.aspx';
    
    const response = await axios.get(baseUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Parse tesis (this selector is illustrative and may need adjustment)
    $('.resultado-tesis').each((_, element) => {
      try {
        const $el = $(element);
        
        const title = $el.find('.titulo-tesis').text().trim();
        const registrationNumber = $el.find('.numero-registro').text().trim();
        const tribunal = $el.find('.tribunal').text().trim();
        const epoch = $el.find('.epoca').text().trim();
        const contentText = $el.find('.texto-tesis').text().trim();
        const sourceUrl = $el.find('a').attr('href') || baseUrl;
        
        if (title && contentText) {
          results.push({
            contentType: determineContentType(title, contentText),
            title,
            registrationNumber: registrationNumber || undefined,
            tribunal: tribunal || undefined,
            epoch: epoch || undefined,
            contentText,
            excerpt: contentText.substring(0, 500),
            sourceUrl: sourceUrl.startsWith('http') ? sourceUrl : `https://sjf.scjn.gob.mx${sourceUrl}`,
            publicationDate: new Date()
          });
        }
      } catch (error) {
        console.error('[Judicial Scraper] Error parsing element:', error);
      }
    });
    
  } catch (error) {
    console.error('[Judicial Scraper] Error scraping:', error);
    
    // Fallback: Return mock data for development/testing
    if (process.env.NODE_ENV === 'development') {
      return getMockJudicialContent();
    }
  }
  
  console.log(`[Judicial Scraper] Found ${results.length} items`);
  return results;
}

/**
 * Determines content type based on title and content
 */
function determineContentType(title: string, content: string): 'tesis' | 'jurisprudencia' | 'criterio' {
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  
  if (titleLower.includes('jurisprudencia') || contentLower.includes('jurisprudencia')) {
    return 'jurisprudencia';
  }
  
  if (titleLower.includes('criterio') || contentLower.includes('criterio relevante')) {
    return 'criterio';
  }
  
  return 'tesis';
}

/**
 * Saves scraped judicial content to database and S3
 */
export async function saveJudicialContent(
  content: JudicialContent[],
  weekNumber: number,
  year: number
): Promise<number[]> {
  const db = await import('../db').then(m => m.getDb());
  if (!db) {
    console.error('[Judicial Scraper] Database not available');
    return [];
  }
  
  const { weeklyContent } = await import('../../drizzle/schema');
  const savedIds: number[] = [];
  
  for (const item of content) {
    try {
      // Save full content to S3
      let s3Key: string | undefined;
      try {
        const fileName = `judicial/${year}/week-${weekNumber}/${item.registrationNumber || Date.now()}.txt`;
        const { key } = await storagePut(
          fileName,
          item.contentText,
          'text/plain'
        );
        s3Key = key;
      } catch (error) {
        console.error('[Judicial Scraper] Error saving to S3:', error);
      }
      
      // Insert into database
      const result = await db.insert(weeklyContent).values({
        contentType: item.contentType,
        title: item.title,
        tesis: item.registrationNumber,
        tribunal: item.tribunal,
        materia: item.epoch,
        fullText: item.contentText,
        excerpt: item.excerpt,
        url: item.sourceUrl,
        publishedDate: item.publicationDate,
        s3Key,
        weekNumber,
        year
      });
      
      // Get inserted ID
      const insertedId = (result as any).insertId || 0;
      if (insertedId) savedIds.push(insertedId);
      
    } catch (error) {
      console.error('[Judicial Scraper] Error saving item:', error);
    }
  }
  
  return savedIds;
}

/**
 * Mock data for development/testing
 */
function getMockJudicialContent(): JudicialContent[] {
  return [
    {
      contentType: 'tesis',
      title: 'RESPONSABILIDAD PATRIMONIAL DEL ESTADO. ELEMENTOS QUE LA CONFIGURAN',
      registrationNumber: '2025001',
      tribunal: 'Primera Sala',
      epoch: 'Décima Época',
      contentText: 'La responsabilidad patrimonial del Estado se configura cuando se reúnen los siguientes elementos: a) la existencia de una actividad administrativa irregular; b) un daño evaluable económicamente; y c) una relación de causalidad entre ambos. La actividad administrativa irregular puede consistir en una acción u omisión que contravenga el marco normativo aplicable o que, sin violarlo, cause un daño antijurídico que el particular no esté obligado a soportar.',
      excerpt: 'La responsabilidad patrimonial del Estado se configura cuando se reúnen los siguientes elementos: a) la existencia de una actividad administrativa irregular...',
      sourceUrl: 'https://sjf.scjn.gob.mx/sjfsist/paginas/DetalleGeneralV2.aspx?id=2025001',
      publicationDate: new Date()
    },
    {
      contentType: 'jurisprudencia',
      title: 'AMPARO INDIRECTO. PROCEDE CONTRA ACTOS DE AUTORIDADES FISCALES',
      registrationNumber: '2025002',
      tribunal: 'Segunda Sala',
      epoch: 'Décima Época',
      contentText: 'El amparo indirecto procede contra actos de autoridades fiscales que afecten derechos sustantivos del contribuyente, tales como la determinación de créditos fiscales, el embargo de bienes, o la clausura de establecimientos, siempre que se cumplan los requisitos de procedencia previstos en la Ley de Amparo.',
      excerpt: 'El amparo indirecto procede contra actos de autoridades fiscales que afecten derechos sustantivos del contribuyente...',
      sourceUrl: 'https://sjf.scjn.gob.mx/sjfsist/paginas/DetalleGeneralV2.aspx?id=2025002',
      publicationDate: new Date()
    },
    {
      contentType: 'criterio',
      title: 'DERECHO A LA CONSULTA PREVIA DE PUEBLOS INDÍGENAS. ALCANCES',
      registrationNumber: '2025003',
      tribunal: 'Pleno',
      epoch: 'Décima Época',
      contentText: 'El derecho a la consulta previa de pueblos y comunidades indígenas debe realizarse de manera previa a la adopción de medidas legislativas o administrativas que puedan afectarles directamente, debe ser culturalmente adecuada, de buena fe, informada y con la finalidad de llegar a un acuerdo.',
      excerpt: 'El derecho a la consulta previa de pueblos y comunidades indígenas debe realizarse de manera previa a la adopción de medidas...',
      sourceUrl: 'https://sjf.scjn.gob.mx/sjfsist/paginas/DetalleGeneralV2.aspx?id=2025003',
      publicationDate: new Date()
    }
  ];
}
