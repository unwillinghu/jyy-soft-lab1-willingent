import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { APP_NAME, APP_VERSION, HealthSchema } from '@pa/shared'

const startedAt = Date.now()

const app = new Hono()

app.get('/health', (c) => {
  const health = HealthSchema.parse({
    status: 'ok',
    name: APP_NAME,
    version: APP_VERSION,
    uptimeSeconds: (Date.now() - startedAt) / 1000,
  })
  return c.json(health)
})

app.get('/api/info', (c) => {
  return c.json({
    name: APP_NAME,
    version: APP_VERSION,
    capabilities: ['memory', 'mail', 'ehall', 'channels', 'tasks'],
  })
})

const port = Number(process.env.PA_PORT ?? 4310)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[core] ${APP_NAME} listening on http://127.0.0.1:${info.port}`)
})

export { app }
