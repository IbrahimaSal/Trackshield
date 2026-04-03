import type { PiiType } from '@trackshield/shared-types'

export interface KnownParamEntry {
  label: string
  description: string
  type: PiiType
}

/**
 * Parametres URL documentes publiquement dont la nature et la finalite
 * sont certaines - aucune heuristique necessaire.
 */
export const KNOWN_PARAMS: Record<string, KnownParamEntry> = {
  // --- Facebook / Meta ---
  fbclid: {
    label: 'Identifiant de clic Facebook',
    description:
      'Facebook sait que vous avez clique sur une publicite et peut lier cette visite a votre profil Meta.',
    type: 'ID_PUB',
  },
  _fbp: {
    label: 'Cookie de tracking Facebook Pixel',
    description:
      'Facebook Pixel suit votre navigation sur ce site et peut vous reconnaitre lors de vos prochaines visites.',
    type: 'ID_PUB',
  },
  _fbc: {
    label: 'Identifiant de clic Facebook (cookie)',
    description:
      'Permet a Facebook de relier votre clic publicitaire a votre session de navigation actuelle.',
    type: 'ID_PUB',
  },

  // --- Google ---
  gclid: {
    label: 'Identifiant de clic Google Ads',
    description:
      'Google Ads sait que vous avez clique sur une pub Google et peut lier cette visite a votre compte Google.',
    type: 'ID_PUB',
  },
  _ga: {
    label: 'Identifiant visiteur Google Analytics',
    description:
      'Google Analytics vous reconnait comme visiteur unique et suit votre parcours sur ce site.',
    type: 'COMPORTEMENT',
  },
  _gid: {
    label: 'Identifiant de session Google Analytics',
    description:
      'Google Analytics suit votre session de navigation actuelle sur ce site.',
    type: 'COMPORTEMENT',
  },

  // --- TikTok ---
  ttclid: {
    label: 'Identifiant de clic TikTok',
    description:
      'TikTok sait que vous avez clique sur une publicite et peut lier cette visite a votre compte TikTok.',
    type: 'ID_PUB',
  },
  _ttp: {
    label: 'Cookie de tracking TikTok Pixel',
    description:
      'TikTok Pixel suit votre navigation sur ce site pour mesurer les conversions publicitaires.',
    type: 'ID_PUB',
  },

  // --- Microsoft ---
  msclkid: {
    label: 'Identifiant de clic Microsoft Ads',
    description:
      'Microsoft Advertising (Bing Ads) sait que vous avez clique sur une pub et suit cette conversion.',
    type: 'ID_PUB',
  },

  // --- UTM (campagnes marketing) ---
  utm_source: {
    label: 'UTM - Source de campagne marketing',
    description:
      'Indique la provenance de votre visite (newsletter, reseau social, pub...) a des fins de mesure marketing.',
    type: 'COMPORTEMENT',
  },
  utm_medium: {
    label: 'UTM - Canal de campagne marketing',
    description:
      'Indique le canal marketing utilise pour vous amener sur ce site (email, cpc, social...).',
    type: 'COMPORTEMENT',
  },
  utm_campaign: {
    label: 'UTM - Nom de campagne marketing',
    description:
      'Identifie la campagne publicitaire precise qui a genere votre visite.',
    type: 'COMPORTEMENT',
  },
  utm_content: {
    label: 'UTM - Contenu de campagne marketing',
    description:
      'Identifie quelle variante de publicite ou quel lien vous avez clique.',
    type: 'COMPORTEMENT',
  },
  utm_term: {
    label: 'UTM - Mot-cle de campagne',
    description:
      'Indique le mot-cle de recherche payant qui vous a amene sur ce site.',
    type: 'COMPORTEMENT',
  },

  // --- Mailchimp ---
  mc_eid: {
    label: 'Identifiant email Mailchimp',
    description:
      'Mailchimp sait que vous avez ouvert cet email et suit votre comportement apres le clic.',
    type: 'ID_PUB',
  },
}
