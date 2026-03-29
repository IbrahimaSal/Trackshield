import type { PiiDetection } from '@trackshield/shared-types'

const PII_LABELS: Record<string, string> = {
  TEL: 'numéro de téléphone',
  EMAIL: 'adresse email',
  LOC: 'localisation',
  DEVICE: 'empreinte appareil',
  ID_PUB: 'identifiant publicitaire',
  COMPORTEMENT: 'données de navigation',
}

export class NotificationManager {
  notify(pii: PiiDetection): void {
    const label = PII_LABELS[pii.type] ?? pii.type
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/shield-48.png'),
      title: `Votre ${label} vient d'être partagé`,
      message: `Envoyé à ${pii.destination} — cliquez pour en savoir plus`,
      priority: 2,
    })
  }
}
