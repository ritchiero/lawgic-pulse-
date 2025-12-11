/**
 * Email Service
 * Sends personalized daily alerts via Resend
 */

import axios from 'axios';
import { PRACTICE_AREA_NAMES } from '../../shared/practiceAreas';

export interface EmailDocument {
  title: string;
  documentType: string;
  dofUrl: string;
  aiSummary: string;
  detectedAreas: string[];
}

export interface SendAlertParams {
  to: string;
  userName: string;
  documents: EmailDocument[];
  date: Date;
}

/**
 * Sends daily alert email
 */
export async function sendDailyAlert(params: SendAlertParams): Promise<string | null> {
  const { to, userName, documents, date } = params;
  
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email Service] RESEND_API_KEY not configured');
    return null;
  }
  
  const html = generateEmailHTML(userName, documents, date);
  const subject = `DOF: ${documents.length} novedades para ti – ${formatDate(date)}`;
  
  try {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'Lawgic Pulse <alertas@lawgic.io>',
        to,
        subject,
        html
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.id;
    
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
    return null;
  }
}

/**
 * Sends welcome email
 */
export async function sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email Service] RESEND_API_KEY not configured');
    return false;
  }
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="border-bottom: 3px solid #3B82F6; padding-bottom: 15px; margin-bottom: 25px;">
    <h1 style="color: #1a365d; margin: 0; font-size: 24px;">Lawgic Pulse</h1>
    <p style="color: #666; margin: 5px 0 0 0;">Alertas del DOF</p>
  </div>
  
  <p>Hola ${userName || 'Colega'},</p>
  
  <p>¡Bienvenido a Lawgic Pulse! Tu suscripción está activa.</p>
  
  <p>A partir de mañana recibirás cada mañana un resumen personalizado con las publicaciones del Diario Oficial de la Federación relevantes para tus áreas de práctica.</p>
  
  <p><strong>¿Qué esperar?</strong></p>
  <ul>
    <li>Resúmenes diarios antes de las 8:00 AM</li>
    <li>Solo documentos relevantes para tus áreas</li>
    <li>Resúmenes ejecutivos generados con IA</li>
    <li>Enlaces directos al DOF</li>
  </ul>
  
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #666;">
    <p><strong>Lawgic Pulse</strong> · Un servicio de <a href="https://lawgic.io" style="color: #3B82F6;">Lawgic</a></p>
  </div>
</body>
</html>
  `;
  
  try {
    await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'Lawgic Pulse <alertas@lawgic.io>',
        to,
        subject: '¡Bienvenido a Lawgic Pulse!',
        html
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return true;
    
  } catch (error) {
    console.error('[Email Service] Error sending welcome email:', error);
    return false;
  }
}

/**
 * Generates HTML for daily alert email
 */
function generateEmailHTML(userName: string, documents: EmailDocument[], date: Date): string {
  const dateStr = formatDateLong(date);
  
  const documentsHTML = documents.map(doc => {
    const areasHTML = doc.detectedAreas
      .map(code => {
        const name = PRACTICE_AREA_NAMES[code] || code;
        return `<span style="background: #ebf8ff; color: #2b6cb0; font-size: 12px; padding: 2px 8px; border-radius: 3px; margin-left: 5px;">${name}</span>`;
      })
      .join('');
    
    return `
    <div style="background: #f8fafc; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0;">
        <span style="background: #e2e8f0; color: #4a5568; font-size: 12px; padding: 2px 8px; border-radius: 3px;">${doc.documentType}</span>
        ${areasHTML}
      </p>
      <h3 style="margin: 10px 0; font-size: 16px;">
        <a href="${doc.dofUrl}" style="color: #1a365d; text-decoration: none;">${doc.title}</a>
      </h3>
      <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">${doc.aiSummary}</p>
    </div>
    `;
  }).join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lawgic Pulse - ${dateStr}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="border-bottom: 3px solid #3B82F6; padding-bottom: 15px; margin-bottom: 25px;">
    <h1 style="color: #1a365d; margin: 0; font-size: 24px;">Lawgic Pulse</h1>
    <p style="color: #666; margin: 5px 0 0 0;">${dateStr}</p>
  </div>
  
  <p>Hola ${userName || 'Colega'},</p>
  
  <p>Encontramos <strong>${documents.length}</strong> publicaciones relevantes para ti en el DOF de hoy:</p>
  
  ${documentsHTML}
  
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #666;">
    <p>Este correo es informativo y no constituye asesoría legal.</p>
    <p><strong>Lawgic Pulse</strong> · Un servicio de <a href="https://lawgic.io" style="color: #3B82F6;">Lawgic</a></p>
  </div>
  
</body>
</html>
  `;
}

/**
 * Format date as DD/MM/YYYY
 */
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date in long format (Spanish)
 */
function formatDateLong(date: Date): string {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} de ${month} de ${year}`;
}

/**
 * Weekly digest content item
 */
export interface WeeklyDigestItem {
  contentType: string;
  title: string;
  registrationNumber: string;
  tribunal: string;
  sourceUrl: string;
  aiSummary: string;
  detectedAreas: string[];
}

export interface SendWeeklyDigestParams {
  to: string;
  userName: string;
  content: WeeklyDigestItem[];
  weekNumber: number;
  year: number;
}

/**
 * Sends weekly digest of tesis, jurisprudencias y criterios
 */
export async function sendWeeklyDigest(params: SendWeeklyDigestParams): Promise<string | null> {
  const { to, userName, content, weekNumber, year } = params;
  
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email Service] RESEND_API_KEY not configured');
    return null;
  }
  
  const html = generateWeeklyDigestHTML(userName, content, weekNumber, year);
  const subject = `Tesis y Jurisprudencias - Semana ${weekNumber} de ${year}`;
  
  try {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'Lawgic Pulse <alertas@lawgic.io>',
        to,
        subject,
        html
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.id;
    
  } catch (error) {
    console.error('[Email Service] Error sending weekly digest:', error);
    return null;
  }
}

/**
 * Generates HTML for weekly digest email
 */
function generateWeeklyDigestHTML(
  userName: string,
  content: WeeklyDigestItem[],
  weekNumber: number,
  year: number
): string {
  const contentByType = {
    tesis: content.filter(c => c.contentType === 'tesis'),
    jurisprudencia: content.filter(c => c.contentType === 'jurisprudencia'),
    criterio: content.filter(c => c.contentType === 'criterio')
  };
  
  const renderSection = (title: string, items: WeeklyDigestItem[]) => {
    if (items.length === 0) return '';
    
    const itemsHTML = items.map(item => {
      const areasHTML = item.detectedAreas
        .map(code => {
          const name = PRACTICE_AREA_NAMES[code] || code;
          return `<span style="background: #ebf8ff; color: #2b6cb0; font-size: 11px; padding: 2px 6px; border-radius: 3px; margin-left: 4px;">${name}</span>`;
        })
        .join('');
      
      return `
      <div style="background: #f8fafc; border-left: 3px solid #3B82F6; padding: 12px; margin: 15px 0;">
        <div style="margin-bottom: 6px;">
          <span style="background: #e2e8f0; color: #4a5568; font-size: 11px; padding: 2px 6px; border-radius: 3px; text-transform: uppercase;">${item.contentType}</span>
          ${areasHTML}
        </div>
        <h4 style="margin: 8px 0; font-size: 14px;">
          <a href="${item.sourceUrl}" style="color: #1a365d; text-decoration: none;">${item.title}</a>
        </h4>
        ${item.registrationNumber ? `<p style="color: #718096; font-size: 12px; margin: 4px 0;">Registro: ${item.registrationNumber}</p>` : ''}
        ${item.tribunal ? `<p style="color: #718096; font-size: 12px; margin: 4px 0;">${item.tribunal}</p>` : ''}
        <p style="color: #4a5568; font-size: 13px; margin: 8px 0 0 0;">${item.aiSummary}</p>
      </div>
      `;
    }).join('');
    
    return `
    <h3 style="color: #1a365d; font-size: 16px; margin: 20px 0 10px 0; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
      ${title} (${items.length})
    </h3>
    ${itemsHTML}
    `;
  };
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lawgic Pulse - Resumen Semanal</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="border-bottom: 3px solid #3B82F6; padding-bottom: 15px; margin-bottom: 25px;">
    <h1 style="color: #1a365d; margin: 0; font-size: 24px;">Lawgic Pulse</h1>
    <p style="color: #666; margin: 5px 0 0 0;">Resumen Semanal · Semana ${weekNumber} de ${year}</p>
  </div>
  
  <p>Hola ${userName || 'Colega'},</p>
  
  <p>Esta semana encontramos <strong>${content.length}</strong> tesis, jurisprudencias y criterios relevantes para tus áreas de práctica:</p>
  
  ${renderSection('📚 Tesis', contentByType.tesis)}
  ${renderSection('⚖️ Jurisprudencias', contentByType.jurisprudencia)}
  ${renderSection('💡 Criterios Relevantes', contentByType.criterio)}
  
  <div style="margin-top: 40px; padding: 15px; background: #f8fafc; border-radius: 6px;">
    <p style="margin: 0; font-size: 13px; color: #4a5568;">
      <strong>💡 Tip:</strong> Guarda este email para consultar estos criterios cuando los necesites en tu práctica.
    </p>
  </div>
  
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #666;">
    <p>Este correo es informativo y no constituye asesoría legal.</p>
    <p><strong>Lawgic Pulse</strong> · Un servicio de <a href="https://lawgic.io" style="color: #3B82F6;">Lawgic</a></p>
  </div>
  
</body>
</html>
  `;
}
