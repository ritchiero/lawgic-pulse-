/**
 * DOF Scraper Service
 * Extracts documents from the Mexican Official Gazette (dof.gob.mx)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { createDofDocument } from '../db';
import { storagePut } from '../storage';
import https from 'https';

export interface ScrapedDocument {
  title: string;
  documentType: string;
  dofUrl: string;
  contentExcerpt: string;
  edition: string;
}

/**
 * Scrapes DOF for a specific date
 */
export async function scrapeDOF(date: Date): Promise<ScrapedDocument[]> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const url = `https://www.dof.gob.mx/index.php?year=${year}&month=${month}&day=${day}`;
  
  try {
    console.log(`[DOF Scraper] Fetching: ${url}`);
    
    // Solution 1: Disable SSL verification (for development/testing)
    // Solution 2: Robust headers and user-agent
    const httpsAgent = new https.Agent({  
      rejectUnauthorized: false // Disable SSL verification
    });
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000,
      httpsAgent, // Use custom HTTPS agent
      maxRedirects: 5
    });
    
    const $ = cheerio.load(response.data);
    const documents: ScrapedDocument[] = [];
    
    // DOF structure: look for document links
    // This is a simplified scraper - actual DOF structure may vary
    $('.document, .documento, a[href*="nota_detalle"]').each((_: number, element: any) => {
      const $el = $(element);
      const title = $el.text().trim();
      const href = $el.attr('href');
      
      if (title && href) {
        const fullUrl = href.startsWith('http') ? href : `https://www.dof.gob.mx${href}`;
        
        documents.push({
          title: title.substring(0, 500), // Limit title length
          documentType: extractDocumentType(title),
          dofUrl: fullUrl,
          contentExcerpt: '', // Will be filled when fetching full document
          edition: 'matutina' // Default, could be extracted from page
        });
      }
    });
    
    console.log(`[DOF Scraper] Found ${documents.length} documents`);
    return documents;
    
  } catch (error) {
    console.error('[DOF Scraper] Error:', error);
    throw new Error(`Failed to scrape DOF: ${error}`);
  }
}

/**
 * Fetches full content of a DOF document
 */
export async function fetchDocumentContent(url: string): Promise<string> {
  try {
    const httpsAgent = new https.Agent({  
      rejectUnauthorized: false
    });
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8'
      },
      timeout: 30000,
      httpsAgent,
      maxRedirects: 5
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract text content (adjust selectors based on actual DOF structure)
    const content = $('.nota-contenido, .document-content, article, .texto')
      .text()
      .trim()
      .substring(0, 2000); // First 2000 characters
    
    return content || 'Contenido no disponible';
    
  } catch (error) {
    console.error('[DOF Scraper] Error fetching content:', error);
    return 'Error al obtener contenido';
  }
}

/**
 * Saves scraped documents to database and S3
 */
export async function saveScrapedDocuments(
  documents: ScrapedDocument[],
  publishDate: Date
): Promise<number[]> {
  const savedIds: number[] = [];
  
  for (const doc of documents) {
    try {
      // Fetch full content
      const fullContent = await fetchDocumentContent(doc.dofUrl);
      doc.contentExcerpt = fullContent;
      
      // Save to S3
      const dateStr = publishDate.toISOString().split('T')[0];
      const s3Key = `dof/${dateStr}/${Date.now()}-${Math.random().toString(36).substring(7)}.txt`;
      
      await storagePut(s3Key, fullContent, 'text/plain');
      
      // Save to database
      const result = await createDofDocument({
        publishedDate: publishDate,
        title: doc.title,
        documentType: doc.documentType,
        url: doc.dofUrl,
        excerpt: doc.contentExcerpt,
        s3Key
      });
      
      // MySQL insert result doesn't have insertId in the type, but it exists at runtime
      const insertId = (result as any).insertId;
      if (insertId) savedIds.push(Number(insertId));
      
    } catch (error) {
      console.error(`[DOF Scraper] Error saving document: ${doc.title}`, error);
    }
  }
  
  return savedIds;
}

/**
 * Extracts document type from title
 */
function extractDocumentType(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('decreto')) return 'Decreto';
  if (lowerTitle.includes('acuerdo')) return 'Acuerdo';
  if (lowerTitle.includes('aviso')) return 'Aviso';
  if (lowerTitle.includes('resolución')) return 'Resolución';
  if (lowerTitle.includes('circular')) return 'Circular';
  if (lowerTitle.includes('convocatoria')) return 'Convocatoria';
  if (lowerTitle.includes('fe de erratas')) return 'Fe de Erratas';
  
  return 'Otro';
}
