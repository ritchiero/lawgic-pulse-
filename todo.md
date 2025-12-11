# Lawgic Pulse - TODO

## Base de Datos
- [x] Extender schema con tablas: suscripciones, areas_usuario, documentos_dof, alertas_enviadas, webhook_events
- [x] Crear helpers de base de datos en server/db.ts

## Servicios Backend
- [x] Implementar scraper del DOF (dof.gob.mx)
- [x] Integrar Claude API para clasificación de documentos
- [x] Configurar servicio de emails con Resend
- [x] Implementar integración con Stripe (checkout, webhooks, customer portal)
- [x] Crear servicio de almacenamiento S3 para documentos

## API y Endpoints
- [x] Endpoint POST /subscribe para iniciar suscripción
- [x] Webhook POST /webhooks/stripe para eventos de Stripe
- [x] Procedimientos tRPC para gestión de suscripciones
- [x] Procedimientos tRPC para consulta de áreas de práctica

## Landing Page
- [x] Diseño hero section con estilo Observatorio IA
- [x] Formulario de registro con email, nombre y áreas
- [x] Grid de 12 áreas de práctica con checkboxes
- [x] Integración con Stripe Checkout
- [x] Página de confirmación post-pago
- [x] Templates de email HTML

## Automatización
- [x] Job diario para scraping a las 7:00 AM CDMX
- [x] Pipeline de clasificación con IA
- [x] Sistema de matching y envío de emails
- [x] Notificaciones al owner por eventos críticos

## Configuración
- [ ] Solicitar credenciales de Stripe (pendiente para más tarde)
- [x] Configurar variables de entorno básicas (APP_URL, ADMIN_API_KEY)
- [ ] Solicitar API key de Resend (pendiente para más tarde)

## Testing
- [x] Tests para variables de entorno
- [x] Tests para router de suscripciones
- [x] Tests para validación de datos

## Resumen Semanal (Viernes)
- [x] Scraper para tesis y jurisprudencias del Semanario Judicial
- [x] Scraper para criterios relevantes
- [x] Job semanal para ejecutar cada viernes
- [x] Template de email para resumen semanal
- [x] Actualizar landing page con promesa de valor semanal
- [x] Integrar clasificación de tesis por áreas de práctica
- [x] Agregar tablas a la base de datos (weeklyContent, sentWeeklyAlerts)
- [x] Endpoint manual para ejecutar job semanal

## Mejoras de Copywriting
- [x] Actualizar headline principal para reflejar DOF + jurisprudencia

## Modo de Prueba
- [x] Modificar backend para permitir registro sin Stripe
- [x] Actualizar frontend para registro directo
- [x] Crear suscripciones con estado "active" sin pago

## Bugs
- [x] Error 404 "Unknown hostname" al redirigir después del registro (corregido: usando ruta relativa)

## Dashboard de Usuario
- [x] Crear página de dashboard protegida
- [x] Mostrar áreas de práctica actuales
- [x] Permitir agregar/quitar áreas predefinidas
- [x] Campo para keywords personalizados
- [x] Botón de cancelar suscripción
- [ ] Ver historial de alertas recibidas (pendiente)

## Expansión de Áreas de Práctica
- [x] Expandir de 12 a 25 áreas predefinidas
- [x] Agregar campo de keywords personalizados en schema
- [x] Actualizar formulario de registro con nuevas áreas
- [x] Actualizar landing page con contador de 25 áreas
- [ ] Actualizar clasificador de IA para usar keywords personalizados (pendiente)

## Vista Previa del Reporte
- [x] Crear endpoint público para generar preview del reporte diario
- [x] Agregar sección de ejemplo estático en la landing
- [x] Botón "Ver reporte de hoy" que ejecuta scraping en tiempo real
- [x] Diseño del preview consistente con emails reales
