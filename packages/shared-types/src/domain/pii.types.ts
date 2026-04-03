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
  /** Niveau de certitude : 'high' = paramètre connu documenté, 'low' = regex heuristique (défaut) */
  certainty?: 'high' | 'low'
  /** Source de la détection : 'form' = valeur saisie par l'user, 'url' = paramètre connu, absent = regex */
  source?: 'form' | 'url'
  /** Label humain lisible (ex: "Identifiant de clic Google Ads") */
  label?: string
  /** Description de l'impact pour l'utilisateur */
  description?: string
}
