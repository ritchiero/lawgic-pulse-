# Configuración del Job Diario

El job diario de Lawgic Pulse debe ejecutarse todos los días a las 7:00 AM hora de México (CDMX).

## Opción 1: Cron Job en el Servidor

Si estás desplegando en un servidor con acceso a cron:

```bash
# Editar crontab
crontab -e

# Agregar esta línea (7:00 AM CDMX = 13:00 UTC)
0 13 * * * cd /ruta/al/proyecto && node --loader tsx server/jobs/dailyJob.ts >> /var/log/lawgic-pulse-cron.log 2>&1
```

## Opción 2: Railway Cron Jobs

Si estás desplegando en Railway:

1. Ve a tu proyecto en Railway
2. Crea un nuevo servicio de tipo "Cron Job"
3. Configura el comando: `node --loader tsx server/jobs/dailyJob.ts`
4. Configura el schedule: `0 13 * * *` (13:00 UTC = 7:00 AM CDMX)

## Opción 3: Servicio Externo (cron-job.org)

1. Registra una cuenta en https://cron-job.org
2. Crea un nuevo cron job
3. URL: `https://tu-dominio.com/api/trpc/job.runDaily`
4. Método: POST
5. Body (JSON):
```json
{
  "apiKey": "tu-admin-api-key-aqui"
}
```
6. Schedule: Todos los días a las 13:00 UTC

## Opción 4: Trigger Manual

Para probar o ejecutar manualmente:

```bash
# Desde la terminal
cd /ruta/al/proyecto
node --loader tsx server/jobs/dailyJob.ts

# O via API
curl -X POST https://tu-dominio.com/api/trpc/job.runDaily \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "tu-admin-api-key"}'
```

## Variables de Entorno Necesarias

Asegúrate de tener configuradas estas variables:

- `RESEND_API_KEY` - Para envío de emails
- `ANTHROPIC_API_KEY` - Para clasificación con Claude (o usa la built-in)
- `ADMIN_API_KEY` - Para proteger el endpoint manual
- `DATABASE_URL` - Conexión a la base de datos
- `APP_URL` - URL base de la aplicación

## Monitoreo

El job envía notificaciones al owner en estos casos:

- ✅ Completado exitosamente (con estadísticas)
- ⚠️ Sin documentos encontrados
- ❌ Error fatal

Revisa los logs regularmente para asegurar que el job se ejecuta correctamente.
