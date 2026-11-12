import type { PiiType } from '@trackshield/shared-types'
import type { TrackerCategory } from '@trackshield/shared-types'

export interface KnownCookieEntry {
  type: PiiType
  label: string
  description: string
  owner: string
  category: TrackerCategory
}

export const KNOWN_COOKIES: Record<string, KnownCookieEntry> = {
  _fbp: {
    type: 'ID_PUB',
    label: 'Identifiant Facebook Pixel',
    description: 'Facebook relie votre navigation sur ce site à votre profil. Vous reverrez ce contenu en publicité sur Instagram et Facebook.',
    owner: 'Facebook / Meta',
    category: 'advertising',
  },
  _fbc: {
    type: 'ID_PUB',
    label: 'Identifiant de clic Facebook',
    description: 'Facebook sait que vous avez cliqué une publicité et suit votre parcours jusqu\'à l\'achat.',
    owner: 'Facebook / Meta',
    category: 'advertising',
  },
  _ga: {
    type: 'ID_PUB',
    label: 'Identifiant Google Analytics',
    description: 'Google mesure votre comportement sur ce site et peut le croiser avec votre compte Google.',
    owner: 'Google',
    category: 'analytics',
  },
  _gid: {
    type: 'ID_PUB',
    label: 'Identifiant de session Google Analytics',
    description: 'Google suit votre session de navigation sur ce site pour en mesurer l\'audience.',
    owner: 'Google',
    category: 'analytics',
  },
  IDE: {
    type: 'ID_PUB',
    label: 'Identifiant publicitaire Google DoubleClick',
    description: 'Google DoubleClick vous suit sur l\'ensemble des sites partenaires pour vous afficher des publicités ciblées.',
    owner: 'Google / DoubleClick',
    category: 'advertising',
  },
  DSID: {
    type: 'ID_PUB',
    label: 'Identifiant signé Google DoubleClick',
    description: 'Utilisé par Google pour associer votre profil publicitaire à travers plusieurs sessions et appareils.',
    owner: 'Google / DoubleClick',
    category: 'advertising',
  },
  NID: {
    type: 'ID_PUB',
    label: 'Cookie de préférences Google',
    description: 'Google mémorise vos préférences et peut l\'utiliser pour personnaliser les résultats de recherche et les publicités.',
    owner: 'Google',
    category: 'analytics',
  },
  uuid2: {
    type: 'ID_PUB',
    label: 'Identifiant publicitaire Xandr (AppNexus)',
    description: 'Xandr (Microsoft Advertising) vous reconnaît sur les sites partenaires pour diffuser des publicités ciblées.',
    owner: 'Xandr / AppNexus',
    category: 'advertising',
  },
  tt_webid: {
    type: 'ID_PUB',
    label: 'Identifiant TikTok Pixel',
    description: 'TikTok relie votre visite sur ce site à votre profil TikTok pour vous cibler avec des publicités.',
    owner: 'TikTok',
    category: 'advertising',
  },
  _ttp: {
    type: 'ID_PUB',
    label: 'Identifiant de clic TikTok',
    description: 'TikTok suit si vous avez cliqué une publicité et mesuré votre comportement jusqu\'à l\'achat.',
    owner: 'TikTok',
    category: 'advertising',
  },
}
