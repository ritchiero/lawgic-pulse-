# Análisis: Estructura del Servicio de Automatización Diaria del DOF

**Fecha:** 2025-01-27

---

## 📊 Resumen Ejecutivo

El servicio está diseñado para ejecutarse diariamente a las 7:00 AM CDMX, pero actualmente **está desactivado** y tiene un **problema crítico**: la clasificación con IA nunca se ejecuta, lo que impide que los documentos se matcheen con los usuarios.

---

## 🔄 Flujo del Pipeline Diario

### Estado Actual: **DESACTIVADO** ⚠️

El job tiene un `return` temprano en la línea 18-20 que impide su ejecución:

```typescript
export async function runDailyJob() {
  // ⚠️ JOB DESACTIVADO TEMPORALMENTE
  console.log('[Daily Job] DESACTIVADO - No se ejecutará');
  return; // ❌ Job nunca se ejecuta
  // ...
}
```

### Flujo Teórico (cuando esté activo):

```
┌─────────────────────────────────────────────────────────────┐
│ 1. TRIGGER: Cron Job / API Call                             │
│    - 7:00 AM CDMX (13:00 UTC)                               │
│    - O manualmente via: /api/trpc/job.runDaily              │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SCRAPING: scrapeDOF(today)                               │
│    Archivo: server/services/dofScraper.ts                   │
│                                                              │
│    Proceso:                                                  │
│    - Construye URL: dof.gob.mx/index.php?year=X&month=Y&day=Z│
│    - Hace GET request con headers de navegador               │
│    - Parsea HTML con Cheerio                                │
│    - Busca selectores: '.document, .documento, a[href*="nota_detalle"]'│
│    - Extrae: título, URL, tipo de documento                 │
│                                                              │
│    Retorna: ScrapedDocument[]                                │
│    - title, documentType, dofUrl, contentExcerpt, edition   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. GUARDADO: saveScrapedDocuments(documents, today)         │
│    Archivo: server/services/dofScraper.ts                   │
│                                                              │
│    Para cada documento:                                      │
│    a) fetchDocumentContent(dofUrl)                          │
│       - Descarga contenido completo del DOF                 │
│       - Extrae texto con Cheerio                            │
│       - Limita a 2000 caracteres                            │
│                                                              │
│    b) Guarda en S3                                           │
│       - Key: dof/YYYY-MM-DD/timestamp-random.txt            │
│       - Contenido completo del documento                    │
│                                                              │
│    c) Guarda en PostgreSQL                                   │
│       - Tabla: dofDocuments                                  │
│       - Campos: title, documentType, url, excerpt, s3Key    │
│       - publishedDate: fecha del día                         │
│                                                              │
│    Retorna: number[] (IDs de documentos guardados)          │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CLASIFICACIÓN CON IA: ❌ NO SE EJECUTA                    │
│    Archivo: server/jobs/dailyJob.ts:48-52                   │
│                                                              │
│    PROBLEMA CRÍTICO:                                         │
│    - El código dice "Skipping AI classification for now"    │
│    - classifyDocument() nunca se llama                      │
│    - Los documentos se guardan SIN areasDetectadas          │
│    - Los documentos se guardan SIN resumenIA                │
│                                                              │
│    Código esperado (NO IMPLEMENTADO):                        │
│    ```typescript                                             │
│    for (const doc of savedDocs) {                           │
│      const classification = await classifyDocument(          │
│        doc.title,                                            │
│        doc.excerpt                                           │
│      );                                                      │
│      await db.updateDofDocument(doc.id, {                  │
│        areasDetectadas: JSON.stringify(classification.areas),│
│        resumenIA: classification.summary                    │
│      });                                                     │
│    }                                                         │
│    ```                                                       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. MATCHING Y ENVÍO: getDocumentsByDate(today)              │
│    Archivo: server/jobs/dailyJob.ts:59-138                  │
│                                                              │
│    Proceso:                                                  │
│    a) Obtiene suscripciones activas                         │
│    b) Para cada suscripción:                                 │
│       - Obtiene áreas de práctica del usuario               │
│       - Busca documentos del día                            │
│       - Filtra documentos por áreas (areasDetectadas)      │
│                                                              │
│    PROBLEMA: Como no hay clasificación, areasDetectadas     │
│    está NULL/vacío, entonces NO hay documentos que matcheen │
│                                                              │
│    c) Para cada usuario con documentos matcheados:          │
│       - Prepara email con documentos                        │
│       - Envía email via Resend                             │
│       - Registra en sentAlerts                             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. NOTIFICACIÓN AL OWNER                                    │
│    - Estadísticas del job                                   │
│    - Documentos encontrados, clasificados, emails enviados │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Análisis Detallado por Componente

### 1. Scraper del DOF (`dofScraper.ts`)

**Funcionalidad:**
- ✅ Extrae documentos del DOF correctamente
- ✅ Maneja errores de red
- ✅ Guarda contenido completo en S3
- ✅ Guarda metadata en PostgreSQL

**Problemas:**
- ⚠️ **SSL verification deshabilitada** (`rejectUnauthorized: false`)
- ⚠️ Selectores CSS pueden ser frágiles si el DOF cambia su estructura
- ⚠️ No hay retry logic si falla el scraping
- ⚠️ Timeout fijo de 30 segundos puede no ser suficiente

**Mejoras sugeridas:**
- Implementar retry con exponential backoff
- Validar estructura HTML antes de parsear
- Agregar logging más detallado

---

### 2. Clasificación con IA (`aiClassifier.ts`)

**Funcionalidad:**
- ✅ Usa Claude/Gemini via Manus LLM
- ✅ Prompt bien estructurado para clasificación legal
- ✅ Fallback a keyword matching si falla IA
- ✅ Valida áreas contra catálogo predefinido

**Problema CRÍTICO:**
- ❌ **NUNCA SE LLAMA** desde el job diario
- El código está comentado/saltado en `dailyJob.ts:48-52`

**Código que debería ejecutarse:**

```typescript
// Step 3: Classify documents with AI
console.log('[Daily Job] Step 3: Classifying documents with AI...');
const savedDocs = await db.getDocumentsByDate(today);

for (const doc of savedDocs) {
  try {
    const classification = await classifyDocument(
      doc.title,
      doc.excerpt || ''
    );
    
    // Update document with classification
    await db.updateDofDocument(doc.id, {
      areasDetectadas: JSON.stringify(classification.areas),
      resumenIA: classification.summary
    });
    
    classifiedCount++;
  } catch (error) {
    console.error(`[Daily Job] Error classifying doc ${doc.id}:`, error);
  }
}
```

---

### 3. Matching de Documentos (`dailyJob.ts:74-83`)

**Problema:**
Como los documentos no tienen `areasDetectadas`, el filtro siempre retorna vacío:

```typescript
const matchingDocs = processedDocs.filter(doc => {
  if (!doc.areasDetectadas) return false; // ❌ Siempre false
  
  try {
    const docAreas = JSON.parse(doc.areasDetectadas);
    return docAreas.some((area: string) => userAreaCodes.includes(area));
  } catch {
    return false;
  }
});
```

**Resultado:** Ningún usuario recibe emails porque no hay documentos que matcheen.

---

### 4. Envío de Emails (`emailService.ts`)

**Funcionalidad:**
- ✅ Genera HTML responsivo
- ✅ Usa Resend API
- ✅ Templates bien diseñados
- ✅ Maneja errores correctamente

**Problemas menores:**
- No valida email antes de enviar
- No hay rate limiting
- No hay retry si falla el envío

---

## 🚨 Problemas Críticos Identificados

### 1. Job Desactivado
**Ubicación:** `dailyJob.ts:18-20`
**Impacto:** El servicio completo no funciona
**Solución:** Remover el `return` temprano o crear flag de configuración

### 2. Clasificación IA No Implementada
**Ubicación:** `dailyJob.ts:48-52`
**Impacto:** Documentos no se clasifican, usuarios no reciben emails
**Solución:** Implementar el loop de clasificación como se muestra arriba

### 3. Bug en getDocumentsByDate (YA CORREGIDO)
**Ubicación:** `db.ts:161-170`
**Impacto:** Retornaba todos los documentos sin filtrar por fecha
**Estado:** ✅ Corregido en esta revisión

### 4. Formato de areasDetectadas Inconsistente
**Problema:** Se espera JSON pero puede estar en otros formatos
**Solución:** Estandarizar a JSON y validar al guardar

---

## 📋 Checklist para Reactivar el Servicio

- [ ] **Remover return temprano** en `dailyJob.ts:18-20`
- [ ] **Implementar clasificación IA** en el Step 3 del job
- [ ] **Agregar función `updateDofDocument`** en `db.ts` si no existe
- [ ] **Verificar que `classifyDocument` funcione** con la API de Manus
- [ ] **Probar flujo completo** con un día de prueba
- [ ] **Configurar cron job** o servicio externo
- [ ] **Monitorear logs** después de activar

---

## 🔧 Configuración de Automatización

### Opciones Disponibles:

1. **Cron en servidor** (si tienes acceso SSH)
   ```bash
   0 13 * * * cd /ruta/proyecto && node --loader tsx server/jobs/dailyJob.ts
   ```

2. **Railway Cron Jobs**
   - Crear servicio tipo "Cron Job"
   - Schedule: `0 13 * * *` (13:00 UTC = 7:00 AM CDMX)

3. **Servicio externo** (cron-job.org)
   - URL: `https://tu-dominio.com/api/trpc/job.runDaily`
   - Método: POST
   - Body: `{"apiKey": "tu-admin-api-key"}`

4. **Manual via API**
   ```bash
   curl -X POST https://tu-dominio.com/api/trpc/job.runDaily \
     -H "Content-Type: application/json" \
     -d '{"apiKey": "tu-admin-api-key"}'
   ```

---

## 📊 Flujo de Datos

```
DOF Website
    ↓
scrapeDOF() → ScrapedDocument[]
    ↓
saveScrapedDocuments()
    ├─→ S3: Contenido completo
    └─→ PostgreSQL: Metadata (sin áreas ni resumen)
    ↓
classifyDocument() → ❌ NO SE EJECUTA
    ↓
getDocumentsByDate() → DofDocument[] (sin áreas)
    ↓
Matching → [] (vacío porque no hay áreas)
    ↓
sendDailyAlert() → ❌ Nunca se llama
```

**Flujo Correcto (cuando esté implementado):**

```
DOF Website
    ↓
scrapeDOF() → ScrapedDocument[]
    ↓
saveScrapedDocuments()
    ├─→ S3: Contenido completo
    └─→ PostgreSQL: Metadata
    ↓
classifyDocument() → ClassificationResult
    ↓
updateDofDocument() → areasDetectadas + resumenIA
    ↓
getDocumentsByDate() → DofDocument[] (con áreas)
    ↓
Matching → DofDocument[] filtrados
    ↓
sendDailyAlert() → Email enviado ✅
```

---

## 💡 Recomendaciones

1. **Prioridad ALTA:**
   - Implementar clasificación IA antes de reactivar el job
   - Agregar función `updateDofDocument` en `db.ts`
   - Probar con un día de prueba antes de producción

2. **Prioridad MEDIA:**
   - Agregar retry logic en scraper
   - Mejorar manejo de errores
   - Agregar métricas/monitoring

3. **Prioridad BAJA:**
   - Optimizar queries de base de datos
   - Agregar índices si es necesario
   - Implementar rate limiting en emails

---

**Fin del Análisis**
