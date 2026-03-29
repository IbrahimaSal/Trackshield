import type { PiiType } from '@trackshield/shared-types'
import type { Severity } from './severity.js'

export const PII_SEVERITY: Record<PiiType, Severity> = {
  TEL: 'danger',
  EMAIL: 'warn',
  COMPORTEMENT: 'info',
  ID_PUB: 'info',
  DEVICE: 'fingerprint',
  LOC: 'warn',
}

export const PII_LABELS: Record<PiiType, string> = {
  TEL: 'TEL',
  EMAIL: 'EMAIL',
  COMPORTEMENT: 'COMPORT.',
  ID_PUB: 'ID_PUB',
  DEVICE: 'DEVICE',
  LOC: 'LOC',
}
