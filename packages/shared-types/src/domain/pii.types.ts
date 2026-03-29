export type PiiType =
  | 'TEL'
  | 'EMAIL'
  | 'COMPORTEMENT'
  | 'ID_PUB'
  | 'DEVICE'
  | 'LOC'

export interface PiiDetection {
  type: PiiType
  maskedValue: string
  destination: string
  timestamp: number
}
