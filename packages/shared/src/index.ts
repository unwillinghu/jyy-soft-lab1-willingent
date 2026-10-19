import { z } from 'zod'

/** 应用元信息 */
export const APP_NAME = 'personal-assistant'
export const APP_VERSION = '0.0.0'

/** 服务健康检查响应，供各端复用并强制校验 */
export const HealthSchema = z.object({
  status: z.literal('ok'),
  name: z.string(),
  version: z.string(),
  uptimeSeconds: z.number().nonnegative(),
})

export type Health = z.infer<typeof HealthSchema>
