import { z } from 'zod'

export const SessionStorageSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  domain: z.string(),
  startedAt: z.number(),
  status: z.enum(['active', 'completed']),
  grade: z.enum(['A', 'B', 'C', 'D', 'F']).nullable(),
  score: z.number().min(0).max(100).nullable(),
  trackers: z.array(z.object({
    domain: z.string(),
    category: z.enum(['advertising', 'analytics', 'social', 'fingerprinting']),
    company: z.string(),
    requestCount: z.number(),
  })),
  piis: z.array(z.object({
    type: z.enum(['TEL', 'EMAIL', 'COMPORTEMENT', 'ID_PUB', 'DEVICE', 'LOC']),
    maskedValue: z.string(),
    destination: z.string(),
    timestamp: z.number(),
  })),
})
