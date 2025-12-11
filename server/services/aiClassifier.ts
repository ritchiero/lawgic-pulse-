/**
 * AI Classification Service
 * Uses Claude API to classify DOF documents into legal practice areas
 */

import { invokeLLM } from '../_core/llm';
import { PRACTICE_AREAS, PRACTICE_AREA_CODES } from '../../shared/practiceAreas';

export interface ClassificationResult {
  areas: string[];
  summary: string;
}

/**
 * Classifies a DOF document using Claude Haiku
 */
export async function classifyDocument(
  title: string,
  excerpt: string
): Promise<ClassificationResult> {
  
  const prompt = `Eres un asistente especializado en derecho mexicano. Analiza el siguiente documento del Diario Oficial de la Federación (DOF).

TÍTULO: ${title}

EXTRACTO:
${excerpt}

---

Tu tarea:
1. Identificar las áreas del derecho mexicano que aplican a este documento.
2. Generar un resumen ejecutivo de 2-3 oraciones para abogados.

Áreas válidas (usa SOLO estos códigos exactos):
- fiscal (impuestos, SAT, contribuciones)
- laboral (trabajo, IMSS, INFONAVIT, sindicatos)
- mercantil (sociedades, comercio, corporativo)
- financiero (bancos, CNBV, valores, seguros)
- energia (hidrocarburos, electricidad, CRE, CNH)
- ambiental (SEMARNAT, ecología, agua)
- propiedad_intelectual (marcas, patentes, derechos de autor)
- competencia (COFECE, monopolios, concentraciones)
- administrativo (licitaciones, permisos, gobierno)
- constitucional (amparo, SCJN, derechos humanos)
- comercio_exterior (aduanas, aranceles, T-MEC)
- salud (COFEPRIS, medicamentos, sanitario)

Responde ÚNICAMENTE con JSON válido en este formato:
{"areas": ["area1", "area2"], "resumen": "Tu resumen aquí..."}

Si el documento no aplica claramente a ninguna área, usa: {"areas": [], "resumen": "..."}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const messageContent = response.choices[0]?.message?.content;
    const content = typeof messageContent === 'string' ? messageContent : '{}';
    
    // Parse JSON response
    let result: ClassificationResult;
    try {
      result = JSON.parse(content) as ClassificationResult;
    } catch {
      // If parsing fails, return fallback
      return fallbackClassification(title, excerpt);
    }
    
    // Validate areas
    const validAreas = result.areas.filter(area => PRACTICE_AREA_CODES.includes(area));
    
    return {
      areas: validAreas,
      summary: result.summary || 'Resumen no disponible'
    };
    
  } catch (error) {
    console.error('[AI Classifier] Error:', error);
    
    // Fallback: try keyword matching
    return fallbackClassification(title, excerpt);
  }
}

/**
 * Fallback classification using keyword matching
 */
function fallbackClassification(title: string, excerpt: string): ClassificationResult {
  const text = `${title} ${excerpt}`.toLowerCase();
  const detectedAreas: string[] = [];
  
  for (const [code, area] of Object.entries(PRACTICE_AREAS)) {
    const hasKeyword = area.keywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    if (hasKeyword) {
      detectedAreas.push(code);
    }
  }
  
  return {
    areas: detectedAreas,
    summary: 'Clasificación automática por palabras clave. Resumen no disponible.'
  };
}

/**
 * Batch classification for multiple documents
 */
export async function classifyDocuments(
  documents: Array<{ id: number; title: string; excerpt: string }>
): Promise<Map<number, ClassificationResult>> {
  const results = new Map<number, ClassificationResult>();
  
  for (const doc of documents) {
    try {
      const classification = await classifyDocument(doc.title, doc.excerpt);
      results.set(doc.id, classification);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`[AI Classifier] Error classifying document ${doc.id}:`, error);
      results.set(doc.id, {
        areas: [],
        summary: 'Error en clasificación'
      });
    }
  }
  
  return results;
}
