# Configuración de Jobs Automatizados

Lawgic Pulse tiene dos jobs automatizados:

1. **Job Diario**: Scraping del DOF - todos los días a las 7:00 AM CDMX (13:00 UTC)
2. **Job Semanal**: Tesis y Jurisprudencias - todos los viernes a las 9:00 AM CDMX (15:00 UTC)

---

## Job Diario (DOF)

Se ejecuta todos los días a las 7:00 AM hora de México (CDMX).

### Opción 1: Cron Job en el Servidor

Si estás desplegando en un servidor con acceso a cron:

```bash
# Editar crontab
crontab -e

# Job diario - 7:00 AM CDMX (13:00 UTC)
0 13 * * * cd /ruta/al/proyecto && node --loader tsx server/jobs/dailyJob.ts >> /var/log/lawgic-pulse-daily.log 2>&1

# Job semanal - Viernes 9:00 AM CDMX (15:00 UTC)
0 15 * * 5 cd /ruta/al/proyecto && node --loader tsx server/jobs/weeklyJob.ts >> /var/log/lawgic-pulse-weekly.log 2>&1
```

### Opción 2: Railway Cron Jobs

Si estás desplegando en Railway:

**Job Diario:**
1. Ve a tu proyecto en Railway
2. Crea un nuevo servicio de tipo "Cron Job"
3. Configura el comando: `node --loader tsx server/jobs/dailyJob.ts`
4. Configura el schedule: `0 13 * * *` (13:00 UTC = 7:00 AM CDMX)

**Job Semanal:**
1. Crea otro servicio de tipo "Cron Job"
2. Configura el comando: `node --loader tsx server/jobs/weeklyJob.ts`
3. Configura el schedule: `0 15 * * 5` (Viernes 15:00 UTC = 9:00 AM CDMX)

### Opción 3: Servicio Externo (cron-job.org)

**Job Diario:**
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

**Job Semanal:**
1. Crea otro cron job
2. URL: `https://tu-dominio.com/api/trpc/job.runWeekly`
3. Método: POST
4. Body (JSON):
```json
{
  "apiKey": "tu-admin-api-key-aqui"
}
```
5. Schedule: Viernes a las 15:00 UTC

### Opción 4: Trigger Manual

Para probar o ejecutar manualmente:

```bash
# Job diario
cd /ruta/al/proyecto
node --loader tsx server/jobs/dailyJob.ts

# Job semanal
node --loader tsx server/jobs/weeklyJob.ts

# O via API
# Job diario
curl -X POST https://tu-dominio.com/api/trpc/job.runDaily \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "tu-admin-api-key"}'

# Job semanal
curl -X POST https://tu-dominio.com/api/trpc/job.runWeekly \
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

---

## Monitoreo

Ambos jobs envían notificaciones al owner en estos casos:

- ✅ Completado exitosamente (con estadísticas)
- ⚠️ Sin contenido encontrado
- ❌ Error fatal

**Estadísticas del Job Diario:**
- Documentos encontrados
- Documentos clasificados
- Emails enviados
- Duración

**Estadísticas del Job Semanal:**
- Tesis, jurisprudencias y criterios encontrados
- Contenido clasificado
- Digests enviados
- Duración

Revisa los logs regularmente para asegurar que los jobs se ejecutan correctamente.
