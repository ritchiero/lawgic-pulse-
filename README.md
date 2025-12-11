# Lawgic Pulse

**Alertas diarias del Diario Oficial de la Federación (DOF) personalizadas por IA**

Lawgic Pulse es un servicio de suscripción que extrae diariamente las publicaciones del DOF mexicano, las clasifica automáticamente usando inteligencia artificial, y envía resúmenes personalizados por email a abogados según sus áreas de práctica.

---

## 🎯 Características Principales

### Para Usuarios
- **Suscripción mensual** de $49 MXN
- **12 áreas de práctica** para personalizar alertas
- **Resúmenes diarios del DOF** antes de las 8:00 AM CDMX
- **Resumen semanal de tesis y jurisprudencias** cada viernes a las 9:00 AM
- **Clasificación automática** con Claude AI
- **Cancelación flexible** sin compromisos

### Áreas de Práctica
1. Fiscal y Tributario
2. Laboral y Seguridad Social
3. Mercantil y Corporativo
4. Financiero y Bancario
5. Energía e Hidrocarburos
6. Ambiental
7. Propiedad Intelectual
8. Competencia Económica
9. Administrativo
10. Constitucional y Amparo
11. Comercio Exterior y Aduanas
12. Salud y Farmacéutico

---

## 🏗️ Arquitectura Técnica

### Stack
- **Frontend**: React 19 + Tailwind CSS 4 + Wouter
- **Backend**: Express 4 + tRPC 11
- **Base de datos**: MySQL/TiDB (via Drizzle ORM)
- **Pagos**: Stripe (Checkout + Webhooks)
- **Emails**: Resend
- **IA**: Claude API (Haiku) via Manus built-in LLM
- **Storage**: S3 para documentos completos

### Servicios Backend

#### 1. DOF Scraper (`server/services/dofScraper.ts`)
- Extrae documentos diarios de dof.gob.mx
- Guarda título, tipo, URL y extracto
- Almacena contenido completo en S3

#### 2. AI Classifier (`server/services/aiClassifier.ts`)
- Clasifica documentos usando Claude Haiku
- Genera resúmenes ejecutivos de 2-3 líneas
- Fallback a clasificación por keywords

#### 3. Email Service (`server/services/emailService.ts`)
- Envía alertas diarias via Resend
- Templates HTML responsivos
- Emails de bienvenida

#### 4. Stripe Service (`server/services/stripeService.ts`)
- Checkout Sessions para suscripciones
- Webhooks para eventos de pago
- Customer Portal para gestión

### Pipeline Diario (DOF)

```
7:00 AM CDMX - Lunes a Domingo
    ↓
[1] Scraping DOF
    ↓
[2] Guardar en DB + S3
    ↓
[3] Clasificación con IA
    ↓
[4] Matching con usuarios
    ↓
[5] Envío de emails
    ↓
[6] Notificación al owner
```

### Pipeline Semanal (Tesis y Jurisprudencias)

```
9:00 AM CDMX - Viernes
    ↓
[1] Scraping Semanario Judicial
    ↓
[2] Guardar en DB + S3
    ↓
[3] Clasificación con IA
    ↓
[4] Matching con usuarios
    ↓
[5] Envío de digests semanales
    ↓
[6] Notificación al owner
```

---

## 📊 Base de Datos

### Tablas Principales

**users** - Usuarios del sistema
- Integración con Manus OAuth
- Roles: user, admin

**subscriptions** - Suscripciones de pago
- Estados: pending, active, cancelled, past_due
- IDs de Stripe (customer, subscription)

**userAreas** - Áreas de práctica por usuario
- Relación many-to-many con users

**dofDocuments** - Documentos del DOF
- Metadata + extracto
- Resumen y áreas detectadas por IA
- S3 key para documento completo

**weeklyContent** - Tesis, jurisprudencias y criterios
- Tipo de contenido (tesis/jurisprudencia/criterio)
- Número de registro, tribunal, época
- Resumen y áreas detectadas por IA
- Semana y año (ISO week number)

**sentAlerts** - Registro de emails diarios enviados
- Tracking de qué se envió a quién

**sentWeeklyAlerts** - Registro de digests semanales enviados
- Tracking de contenido semanal enviado

**webhookEvents** - Log de eventos de Stripe
- Idempotencia y debugging

---

## 🚀 Configuración e Instalación

### Variables de Entorno Requeridas

```bash
# Base de datos (auto-configurada por Manus)
DATABASE_URL=mysql://...

# Stripe (configurar manualmente)
STRIPE_SECRET_KEY=sk_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (configurar manualmente)
RESEND_API_KEY=re_...

# Aplicación
APP_URL=https://tu-dominio.com
ADMIN_API_KEY=clave-secreta-para-jobs
```

### Instalación Local

```bash
# Instalar dependencias
pnpm install

# Aplicar migraciones
pnpm db:push

# Modo desarrollo
pnpm dev

# Tests
pnpm test

# Build producción
pnpm build
pnpm start
```

---

## 🔄 Jobs Automatizados

Lawgic Pulse tiene dos jobs automatizados:

### Job Diario (DOF)

Se ejecuta automáticamente todos los días a las 7:00 AM CDMX (13:00 UTC).

### Job Semanal (Tesis y Jurisprudencias)

Se ejecuta automáticamente todos los viernes a las 9:00 AM CDMX (15:00 UTC).

### Configuración del Cron

Ver `CRON_SETUP.md` para instrucciones detalladas de configuración en:
- Servidor con cron
- Railway Cron Jobs
- Servicios externos (cron-job.org)

### Ejecución Manual

```bash
# Via terminal
node --loader tsx server/jobs/dailyJob.ts

# Via API (requiere ADMIN_API_KEY)
curl -X POST https://tu-dominio.com/api/trpc/job.runDaily \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "tu-admin-api-key"}'
```

---

## 🎨 Diseño Visual

El diseño está inspirado en **Observatorio IA México**:
- Paleta de colores: blancos y azules (#3B82F6)
- Tipografía: combinación serif + sans-serif
- Espaciado generoso y limpio
- Badges y estados visuales
- Animaciones sutiles

---

## 📝 Endpoints API

### Públicos (tRPC)

**subscription.getPracticeAreas**
- Obtiene catálogo de áreas de práctica

**subscription.create**
- Crea suscripción y retorna URL de Stripe Checkout
- Input: email, nombre (opcional), áreas[]

### Protegidos

**subscription.getStatus**
- Obtiene estado de suscripción del usuario autenticado

### Webhooks

**POST /api/webhooks/stripe**
- Recibe eventos de Stripe
- Eventos: checkout.session.completed, customer.subscription.*, invoice.payment_failed

---

## 🧪 Testing

```bash
# Todos los tests
pnpm test

# Tests específicos
pnpm test server/subscription.test.ts
pnpm test server/env.test.ts
```

---

## 📦 Estructura del Proyecto

```
lawgic-pulse/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Home, Gracias
│   │   ├── components/    # UI components (shadcn)
│   │   └── lib/           # tRPC client
├── server/                # Backend
│   ├── services/          # Scraper, AI, Email, Stripe
│   ├── jobs/              # Daily job
│   ├── webhooks/          # Stripe webhooks
│   ├── routers/           # tRPC routers
│   └── db.ts              # Database helpers
├── drizzle/               # Schema y migraciones
├── shared/                # Código compartido
│   └── practiceAreas.ts   # Catálogo de áreas
└── storage/               # S3 helpers
```

---

## 🔐 Seguridad

- **Webhooks**: Verificación de firma de Stripe
- **API Keys**: Protección de endpoints administrativos
- **CORS**: Configurado para dominio de producción
- **Rate Limiting**: Implementar en producción
- **Secrets**: Nunca commitear en git

---

## 📈 Próximos Pasos

### Configuración Pendiente
- [ ] Configurar cuenta de Stripe
- [ ] Crear producto y precio en Stripe
- [ ] Configurar webhook de Stripe
- [ ] Configurar cuenta de Resend
- [ ] Verificar dominio en Resend

### Mejoras Futuras
- [ ] Panel de administración
- [ ] Estadísticas de uso
- [ ] Histórico de documentos
- [ ] Búsqueda de documentos pasados
- [ ] Notificaciones push
- [ ] App móvil

---

## 📞 Soporte

Para preguntas o soporte:
- Email: hola@lawgic.io
- Web: https://lawgic.io

---

## 📄 Licencia

Propiedad de Lawgic. Todos los derechos reservados.
