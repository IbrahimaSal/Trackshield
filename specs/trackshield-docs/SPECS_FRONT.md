# Trackshield — Spécifications Techniques Frontend

**Version** : 1.0
**Date** : Mars 2026
**Statut** : Draft
**Périmètre** : Extension Chrome — `apps/plugin`
**Auteur** : Ibrahima SALL

---

## Table des matières

1. [Stack & outillage](#1-stack--outillage)
2. [Contraintes Manifest V3](#2-contraintes-manifest-v3)
3. [Design system — Tokens](#3-design-system--tokens)
4. [Architecture des composants](#4-architecture-des-composants)
5. [State management — Zustand](#5-state-management--zustand)
6. [Communication SW ↔ Popup](#6-communication-sw--popup)
7. [Vues & navigation](#7-vues--navigation)
8. [Accessibilité](#8-accessibilité)
9. [Performance](#9-performance)
10. [Tests](#10-tests)
11. [Conventions de code](#11-conventions-de-code)

---

## 1. Stack & outillage

| Composant | Technologie | Version | Rôle |
|---|---|---|---|
| Langage | TypeScript | 5+ | Type safety strict |
| UI | React | 18+ | Composants fonctionnels uniquement |
| Build | Vite + vite-plugin-web-extension | 5+ | Compilation MV3, hot reload dev |
| Styles | Tailwind CSS | 3+ | Utility-first, tokens CSS |
| Composants headless | Radix UI | Latest | Accessibilité ARIA out-of-the-box |
| State | Zustand | 4+ | State local léger, sans boilerplate |
| Validation storage | Zod | 3+ | Typage des données chrome.storage |
| Tests | Vitest | 1+ | Tests unitaires regex, logique domaine |
| Lint | ESLint + Prettier | Latest | Qualité et formatage |

### Justification des choix

**Radix UI plutôt que MUI**
- MUI impose Material Design → incompatible avec le design system blaugrana dark mode custom
- Bundle MUI ~300 kb gzippé → critique pour une extension (limite 10 MB totale)
- Radix = headless (logique + ARIA, zéro style imposé) → 100% de contrôle visuel
- ARIA + navigation clavier out-of-the-box → répond aux critères WCAG 2.1

**Zustand plutôt que Redux**
- Le state de l'extension est simple et localisé (3–4 stores max)
- Les données viennent du Service Worker via `chrome.storage` — pas d'actions asynchrones complexes à orchestrer
- Setup : 1 fichier, 1 `create()` vs actions + reducers + selectors + middleware RTK
- Bundle Zustand ~3 kb vs Redux ~47 kb
- Support natif Redux DevTools

---

## 2. Contraintes Manifest V3

L'extension tourne dans un contexte Chrome strict qui impose des contraintes techniques non négociables.

### 2.1 Architecture multi-contextes

```
┌─────────────────────────────────────────────┐
│           Background Service Worker         │
│  Intercepte réseau · Détecte PII/trackers   │
│  Met à jour badge · Enqueue sync NestJS     │
└──────────────┬──────────────────────────────┘
               │ chrome.runtime.sendMessage
               │ chrome.storage.local (partagé)
               ▼
┌─────────────────────────────────────────────┐
│           Popup React (340px)               │
│  Lit chrome.storage · Reçoit messages SW    │
│  Affiche score, PII, trackers, alertes      │
└──────────────────────────────────────────────┘
               ▲
               │ chrome.runtime.sendMessage
┌─────────────────────────────────────────────┐
│           Content Script                    │
│  Observe formulaires · Détecte saisie PII   │
└──────────────────────────────────────────────┘
```

### 2.2 Règles MV3

- **Popup** : largeur fixe **340px**, pas de resize. S'ouvre en moins de **200ms**.
- **Service Worker** : pas de DOM, pas de `window`. Durée de vie limitée — le SW peut être suspendu par Chrome à tout moment.
- **Content Script** : isolé du JS de la page, pas d'accès à `chrome.storage` direct → passe par `chrome.runtime.sendMessage`.
- **Pas d'éval** : aucun `eval()`, `new Function()`, ni injection dynamique de scripts inline.
- **CSP stricte** : pas de ressources externes dans le popup — toutes les polices, icônes et assets sont bundlés.

### 2.3 Communication inter-contextes

```typescript
// Pattern messages typés — évite les any
type SwMessage =
  | { kind: 'session-update'; data: SessionData }
  | { kind: 'pii-detected'; data: PiiDetection }
  | { kind: 'tracker-detected'; data: TrackerMatch }
  | { kind: 'score-updated'; data: RgpdScore }

// SW → Popup
chrome.runtime.sendMessage<SwMessage>({ kind: 'pii-detected', data: pii })

// Popup écoute
chrome.runtime.onMessage.addListener((msg: SwMessage) => {
  if (msg.kind === 'pii-detected') useSessionStore.getState().addPii(msg.data)
})
```

---

## 3. Design system — Tokens

### 3.1 Palette complète

```css
/* Fonds */
--bg:        #090B11;   /* fond page (dev tools) */
--surface:   #0E1118;   /* popup background */
--surface-2: #141720;   /* cartes, sections */
--surface-3: #1A1E2A;   /* éléments interactifs, inputs */

/* Bordures */
--border:    rgba(255,255,255,0.06);
--border-2:  rgba(255,255,255,0.11);

/* Texte */
--text:      #EEF0F8;   /* texte principal */
--text-2:    #8B90A8;   /* texte secondaire */
--text-3:    #4E5368;   /* labels, placeholders */

/* Brand — blaugrana */
--brand-blue:    #004D98;
--brand-red:     #A50044;
--brand-blue-bg: rgba(0,77,152,0.12);
--brand-red-bg:  rgba(165,0,68,0.12);

/* Sémantique — sévérité */
--ok:              #1FCC7A;
--ok-bg:           rgba(31,204,122,0.10);
--warn:            #FFB020;
--warn-bg:         rgba(255,176,32,0.10);
--danger:          #FF3B5C;
--danger-bg:       rgba(255,59,92,0.10);
--info:            #3B9EFF;
--info-bg:         rgba(59,158,255,0.10);
--fingerprint:     #FF5FA8;
--fingerprint-bg:  rgba(255,95,168,0.10);
```

> **Règle absolue** : les couleurs sémantiques (`--danger`, `--warn`, `--ok`, `--info`, `--fingerprint`) sont réservées à leur usage respectif. Ne jamais les utiliser comme couleurs décoratives.

### 3.2 Typographie

| Usage | Font | Poids | Taille |
|---|---|---|---|
| Corps, labels, UI | DM Sans | 400 / 500 / 600 | 10–15px |
| Données techniques, URLs, valeurs masquées, timestamps | DM Mono | 400 / 500 | 9–12px |
| Score grade (A–F) | DM Sans | 700 | 24px |

```typescript
// tailwind.config.ts
fontFamily: {
  sans: ['DM Sans', 'system-ui', 'sans-serif'],
  mono: ['DM Mono', 'ui-monospace', 'monospace'],
}
```

Les polices sont **bundlées** dans le plugin (pas de fetch Google Fonts en prod) pour respecter la CSP et le offline.

### 3.3 Espacement & rayons

```css
--radius-sm:  8px;   /* boutons, tags, inputs */
--radius:     12px;  /* cartes secondaires */
--radius-lg:  16px;  /* popup frame, cartes principales */
```

### 3.4 Système de sévérité

La sévérité est la **source de vérité unique** pour toutes les couleurs dynamiques. Tout composant qui doit être coloré selon un état reçoit une prop `severity` — jamais une couleur directe.

```typescript
// src/popup/types/severity.ts
export type Severity = 'ok' | 'warn' | 'danger' | 'info' | 'fingerprint'

export const SEVERITY_COLORS: Record<Severity, string> = {
  ok:          '#1FCC7A',
  warn:        '#FFB020',
  danger:      '#FF3B5C',
  info:        '#3B9EFF',
  fingerprint: '#FF5FA8',
}

export const SEVERITY_BG: Record<Severity, string> = {
  ok:          'rgba(31,204,122,0.10)',
  warn:        'rgba(255,176,32,0.10)',
  danger:      'rgba(255,59,92,0.10)',
  info:        'rgba(59,158,255,0.10)',
  fingerprint: 'rgba(255,95,168,0.10)',
}
```

### 3.5 Mapping PiiType → Severity

```typescript
// src/popup/types/pii.ts
export const PII_SEVERITY: Record<PiiType, Severity> = {
  TEL:          'danger',
  EMAIL:        'warn',
  COMPORTEMENT: 'info',
  ID_PUB:       'info',
  DEVICE:       'fingerprint',
  LOC:          'warn',
}

export const PII_LABELS: Record<PiiType, string> = {
  TEL:          'TEL',
  EMAIL:        'EMAIL',
  COMPORTEMENT: 'COMPORT.',
  ID_PUB:       'ID_PUB',
  DEVICE:       'DEVICE',
  LOC:          'LOC',
}
```

Conséquence : `PiiTag` n'a pas de prop `color`. Il reçoit un `type: PiiType` et dérive tout. Aucune couleur hardcodée dans les composants.

### 3.6 Badge du navigateur Chrome

| Trackers | Couleur badge | Signification |
|---|---|---|
| 0 | — (vide) | Aucun tracker |
| 1–2 | `#1FCC7A` (ok) | Sûr |
| 3–9 | `#FFB020` (warn) | Attention |
| 10+ ou PII | `#FF3B5C` (danger) | Critique |

---

## 4. Architecture des composants

### 4.1 Règle fondamentale

**Composants fonctionnels uniquement.** Aucun `class extends Component` ni `class extends PureComponent`. Toute la logique de cycle de vie passe par des hooks React (`useEffect`, `useState`, `useCallback`, etc.).

```tsx
// ✅ Correct
function ScoreRing({ grade, score }: ScoreRingProps): JSX.Element { ... }
const Badge = ({ severity, children }: BadgeProps): JSX.Element => { ... }

// ❌ Interdit
class ScoreRing extends React.Component<ScoreRingProps> { ... }
```

### 4.2 Structure en 4 couches

```
src/popup/
├── types/               ← Types transversaux (severity, pii)
│   ├── severity.ts
│   └── pii.ts
│
├── components/
│   ├── primitives/      ← Couche 1 : génériques, sans logique Trackshield
│   ├── domain/          ← Couche 2 : composants métier (connaissent PiiType, RgpdGrade...)
│   ├── blocks/          ← Couche 3 : assemblages autonomes avec leur affichage
│   └── layout/          ← Couche 4 : structure popup (shell, header, nav)
│
├── views/               ← Vues : assemblent uniquement des blocks et du layout
├── stores/              ← Zustand stores
└── hooks/               ← Hooks personnalisés
```

**Règle de dépendance** (sens unique, vers le bas) :

```
views → blocks → domain → primitives → types/
```

Un composant `primitives/` ne connaît que `Severity`. Il n'importe jamais `PiiType` ni `TrackerCategory`. Un composant `domain/` connaît les types métier mais ne compose jamais un `block/`. Les `views/` ne contiennent aucune logique de rendu propre.

### 4.3 Couche `primitives/`

Composants génériques sans connaissance du domaine Trackshield.

#### `Badge`
```tsx
interface BadgeProps {
  severity: Severity
  children: React.ReactNode
  className?: string
}
// Usage : <Badge severity="danger">14 trackers</Badge>
// Usage : <Badge severity="ok">1 tracker</Badge>
```

#### `CompanyAvatar`
```tsx
interface CompanyAvatarProps {
  initials: string   // "G", "f", "DC"
  color: string      // couleur brand de l'entreprise (#1877F2 pour Meta)
  size?: 'sm' | 'md' // sm=24px, md=30px
}
// Usage : <CompanyAvatar initials="f" color="#1877F2" />
```

#### `LiveDot`
Point vert animé (pulsation CSS `@keyframes pulse`). Aucune prop. Indique une activité temps réel.

#### `MaskedValue`
```tsx
interface MaskedValueProps {
  value: string      // "+336••••5678", "j••••@gmail.com"
  severity: Severity // pilote la couleur
}
// Rendu en DM Mono
```

### 4.4 Couche `domain/`

Composants qui connaissent les types métier Trackshield.

#### `PiiTag`
```tsx
interface PiiTagProps {
  type: PiiType   // dérive severity + label depuis PII_SEVERITY et PII_LABELS
}
// Rendu : [TEL] en DM Mono, fond severity, coins arrondis 4px
// Usage : <PiiTag type="TEL" />
```

#### `ScoreRing`
Anneau SVG animé avec grade A–F au centre.
```tsx
interface ScoreRingProps {
  grade: RgpdGrade   // 'A' | 'B' | 'C' | 'D' | 'F'
  score: number      // 0–100, pilote la longueur de l'arc
  size?: number      // défaut 76px
}
```
Calcul de l'arc SVG :
```
r = size × 0.42
circumference = 2π × r
filled = (score / 100) × circumference
strokeDasharray = `${filled} ${circumference - filled}`
```

#### `TrackerRow`
```tsx
interface TrackerRowProps {
  tracker: TrackerMatch
}
// Composition : CompanyAvatar + nom + domaine + Badge(category)
```

Mapping `TrackerCategory → Severity` :
```typescript
const CATEGORY_SEVERITY: Record<TrackerCategory, Severity> = {
  advertising:   'warn',
  analytics:     'info',
  social:        'info',
  fingerprinting:'fingerprint',
}
```

#### `PiiLine`
Une ligne dans PiiBox : valeur masquée + flèche + domaine destinataire.
```tsx
interface PiiLineProps {
  detection: PiiDetection
}
// Rendu : <MaskedValue> → pixel.facebook.com
```

#### `FeedRow`
Entrée dans le feed temps réel. Le composant le plus riche du domaine.
```tsx
interface FeedRowProps {
  timestamp: number      // timestamp Unix → affiché HH:MM:SS
  type: PiiType          // pilote couleur du dot, de la vline, du tag
  domain: string         // "pixel.facebook.com"
  company: string        // "Meta"
  description: string    // "Numéro de téléphone transmis dans le payload POST"
  maskedValue?: string   // "+336••••5678" (optionnel, absent si COMPORTEMENT)
  country?: string       // "USA", "UE"
}
```

Structure visuelle :
```
[HH:MM:SS]  •  [PiiTag]  domaine  [country badge]
│ vline         description
│               maskedValue (DM Mono)             [company badge]
```

#### `DestinationRow`
Ligne dans le panneau destinataires.
```tsx
interface DestinationRowProps {
  company: string
  initials: string
  brandColor: string
  severity: Severity   // PII → danger, Tracker → info
}
```

### 4.5 Couche `blocks/`

Assemblages autonomes portant leur propre logique d'affichage.

#### `ScoreBlock`
```tsx
interface ScoreBlockProps {
  grade: RgpdGrade
  score: number
  trackerCount: number
  piiCount: number
}
```
Composition : `ScoreRing` + texte description + badges résumé.

Descriptions par grade :
| Grade | Texte |
|---|---|
| A | Aucune collecte problématique. |
| B | Collectes mineures et conformes. |
| C | Quelques points à surveiller. |
| D | Collectes importantes détectées. |
| F | Collectes massives ou non conformes. |

#### `PiiBox`
Encart alerte rouge affiché uniquement si `detections.length > 0`.
```tsx
interface PiiBoxProps {
  detections: PiiDetection[]
}
```
Fond `rgba(255,59,92,0.06)` + border `rgba(255,59,92,0.18)`.

#### `FeedCard`
```tsx
interface FeedCardProps {
  events: FeedEvent[]
  totalRequests: number
  trackerCount: number
  piiCount: number
  onLoadMore?: () => void
}
```
Header avec `LiveDot` + stats + liste de `FeedRow`. Bouton "Voir les N requêtes précédentes" si pagination.

#### `AlertCard`
Carte d'alerte individuelle (vue Alertes).
```tsx
interface AlertCardProps {
  severity: Severity     // détermine icône + border color
  title: string          // "Téléphone partagé avec Facebook"
  description: string
  timestamp: number
  onDetail: () => void
  onDismiss: () => void
}
```
Disparition automatique après **6 secondes** si aucune action (via `setTimeout` + CSS transition).

#### `DataSummaryPanel`
Panneau latéral récap : compteurs par PiiType + liste destinataires.

### 4.6 Couche `layout/`

#### `PopupShell`
Conteneur racine 340px × min 400px. Fond `--surface`. Pas de props de style.

#### `PopupHeader`
```tsx
interface PopupHeaderProps {
  url: string   // domaine courant affiché en DM Mono
}
```
Logo Trackshield (dégradé blaugrana) + chip URL en DM Mono.

#### `SideNav`
Navigation latérale du popup étendu (6 items + statut protection).
```tsx
type NavItem = {
  id: View
  label: string
  icon: JSX.Element
  badge?: 'live' | number   // live = pill danger, number = compteur
}
```
Item actif : fond `--brand-blue-bg`, couleur `#5BA8FF`, border `rgba(0,77,152,.25)`.

---

## 5. State management — Zustand

### 5.1 Principes

- **1 store = 1 domaine** — jamais de store fourre-tout
- **Pas de sélecteurs complexes** — le state est plat, les transformations se font dans les composants ou dans des hooks dédiés
- **Hydratation depuis `chrome.storage.local`** au montage du popup
- **Mise à jour par messages** depuis le SW via `chrome.runtime.onMessage`

### 5.2 `session.store.ts`

```typescript
interface SessionState {
  currentDomain: string | null
  trackers: TrackerMatch[]
  piis: PiiDetection[]
  score: RgpdScore | null
  // Actions
  setDomain: (domain: string) => void
  addTracker: (tracker: TrackerMatch) => void
  addPii: (pii: PiiDetection) => void
  setScore: (score: RgpdScore) => void
  reset: () => void
}
```

### 5.3 `alerts.store.ts`

```typescript
interface AlertsState {
  alerts: Alert[]
  unreadCount: number
  // Actions
  addAlert: (pii: PiiDetection) => void
  markRead: (id: string) => void
  markAllRead: () => void
}
```

### 5.4 `sync.store.ts`

```typescript
interface SyncState {
  enabled: boolean
  consentGiven: boolean
  lastSyncAt: number | null
  // Actions
  setEnabled: (enabled: boolean) => void
  setConsent: (given: boolean) => void
  setLastSync: (ts: number) => void
}
```

### 5.5 `settings.store.ts`

```typescript
interface SettingsState {
  alertsEnabled: boolean
  alertPii: boolean
  alertNonEu: boolean
  alertFingerprint: boolean
  alertNewTrackers: boolean
  retentionDays: 7 | 30 | 90 | null
  whitelist: string[]
  stealthMode: boolean
  autoExportPdf: boolean
  // Actions
  update: (patch: Partial<Omit<SettingsState, 'update'>>) => void
  addToWhitelist: (domain: string) => void
  removeFromWhitelist: (domain: string) => void
}
```

### 5.6 Hooks personnalisés

Les hooks sont des wrappers fins sur les stores — ils ne contiennent pas de logique métier.

```typescript
// hooks/useSession.ts
export function useSession() {
  return useSessionStore(s => ({
    domain: s.currentDomain,
    trackers: s.trackers,
    piis: s.piis,
    score: s.score,
  }))
}

// hooks/useAlerts.ts
export function useAlerts() {
  return useAlertsStore(s => ({
    alerts: s.alerts,
    unreadCount: s.unreadCount,
    markRead: s.markRead,
  }))
}

// hooks/useSync.ts
export function useSync() {
  return useSyncStore(s => ({
    enabled: s.enabled,
    consentGiven: s.consentGiven,
    setEnabled: s.setEnabled,
  }))
}
```

---

## 6. Communication SW ↔ Popup

### 6.1 Pattern messages typés

```typescript
// types/messages.ts — partagé entre SW et popup
export type SwToPopupMessage =
  | { kind: 'session-update'; domain: string }
  | { kind: 'tracker-detected'; data: TrackerMatch }
  | { kind: 'pii-detected'; data: PiiDetection }
  | { kind: 'score-updated'; data: RgpdScore }
  | { kind: 'session-reset' }

export type PopupToSwMessage =
  | { kind: 'get-session' }
  | { kind: 'request-report' }
```

### 6.2 Hydratation initiale du popup

À l'ouverture du popup, les données de la session courante sont lues depuis `chrome.storage.local` — pas depuis le SW (qui peut être suspendu).

```typescript
// hooks/usePopupInit.ts
export function usePopupInit(): void {
  useEffect(() => {
    // 1. Lire session depuis storage
    chrome.storage.local.get(['currentSession']).then(({ currentSession }) => {
      if (currentSession) {
        useSessionStore.getState().setDomain(currentSession.domain)
        // hydrate trackers, piis, score...
      }
    })

    // 2. S'abonner aux messages temps réel
    const handler = (msg: SwToPopupMessage) => {
      if (msg.kind === 'tracker-detected') useSessionStore.getState().addTracker(msg.data)
      if (msg.kind === 'pii-detected') {
        useSessionStore.getState().addPii(msg.data)
        useAlertsStore.getState().addAlert(msg.data)
      }
      if (msg.kind === 'score-updated') useSessionStore.getState().setScore(msg.data)
      if (msg.kind === 'session-reset') useSessionStore.getState().reset()
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])
}
```

---

## 7. Vues & navigation

### 7.1 Écrans

| # | Vue | Composant | Accès |
|---|---|---|---|
| 01 | Badge + Popup principal | `PopupMain` | Clic icône Chrome |
| 02 | Trackers live | `LiveFeed` | Nav latérale |
| 03 | Carte des flux | `FluxView` | Nav latérale |
| 04 | Alertes | `AlertsView` | Nav latérale |
| 05 | Rapport d'audit | `ReportView` | Nav latérale |
| 06 | Paramètres | `SettingsView` | Nav latérale |

### 7.2 Navigation

La navigation est gérée par un `useState<View>` dans `App.tsx` — pas de router externe. Le popup est une SPA de 340px, la navigation est immédiate (pas de route, pas de hash).

```typescript
export type View = 'main' | 'live' | 'flux' | 'alerts' | 'report' | 'settings'
```

### 7.3 Contenu de chaque vue

#### Vue 01 — Popup Principal (`PopupMain`)

- `PopupHeader` : logo + URL courante
- `ScoreBlock` : anneau RGPD + badges résumé
- `PiiBox` : encart rouge si PII détectées (conditionnel)
- Liste des 3 premiers trackers : `TrackerRow` × 3 + "Voir tous"
- Boutons d'action : "Voir les flux" → FluxView · "Rapport" → ReportView
- Si score A + 0 PII : encart vert "Ce site respecte votre vie privée"

#### Vue 02 — Trackers Live (`LiveFeed`)

- Header statut : `LiveDot` + "En direct" + domaine + compteurs
- `FeedCard` : feed chronologique des événements
  - Chaque entrée : `FeedRow` (timestamp, type, destination, valeur masquée)
  - Fond teinté selon sévérité : `rgba(255,59,92,0.04)` pour critical, `rgba(255,176,32,0.03)` pour warn
  - Animation slide-in à l'apparition des nouvelles entrées
- Panneau latéral droit :
  - `DataSummaryPanel` : compteurs par PiiType
  - Liste destinataires : `DestinationRow` × N
  - Bouton "Générer rapport"

#### Vue 03 — Carte des Flux (`FluxView`)

Représentation arborescente : source (vous + site) → destinataires.

- Nœud source : chip blaugrana "Vous · domain.com"
- Pour chaque destinataire : branche avec dot coloré + PiiTags + card destinataire
- Card destinataire : `CompanyAvatar` + nom + domaine + pays + fréquence req/min
- Panneau latéral : légende PiiTypes + répartition géographique (barre de progression USA/EU/Autre)
- KPIs session : Requêtes · Trackers · PII · Entreprises

#### Vue 04 — Alertes (`AlertsView`)

- Section "Alertes actives" : `AlertCard` × N (non lues)
  - 4 types : danger (PII), warn (hors UE), info (trackers), fingerprint (device)
  - Actions : "Voir le détail" + "Ignorer"
  - Disparition automatique après 6 secondes
- Section "Historique" : tableau `<table>` avec colonnes Heure · Type · Description · Site · Action

#### Vue 05 — Rapport (`ReportView`)

- KPIs en-tête : score RGPD · nb trackers · nb PII · nb entreprises · % hors UE
- Tableau PII exposées : type · valeur masquée · destinataire · pays
- Tableau trackers : nom · catégorie · nb requêtes
- Résumé langage naturel (généré par FastAPI)
- Boutons export : PDF · HTML

#### Vue 06 — Paramètres (`SettingsView`)

Grille 2 colonnes.

**Colonne gauche :**
- Alertes & notifications : toggles par catégorie (Radix `Switch`)
- Sync cloud : toggle + encart consentement blaugrana + lien politique
- Confidentialité : mode discret · export auto PDF · effacer historique (bouton danger)

**Colonne droite :**
- Conservation : sélecteur durée (7j · 30j · 90j · Jamais)
- Liste blanche : ajout/suppression de domaines (input DM Mono)
- Bases trackers : état MAJ EasyList · Disconnect · EasyPrivacy + bouton màj

---

## 8. Accessibilité

Critères **WCAG 2.1 niveau AA**.

### 8.1 Radix UI

Tous les composants interactifs (`Switch`, `Dialog`, `Tooltip`) viennent de Radix UI et incluent :
- Rôles ARIA corrects
- Navigation clavier complète (Tab, Enter, Escape, Arrow keys)
- Focus management automatique dans les modales

### 8.2 Composants custom

- `ScoreRing` : `aria-label="Score RGPD : D — Collectes importantes détectées"`
- `Badge` : rôle `status` si mise à jour dynamique
- `PiiTag` : `aria-label="Type de donnée : Téléphone"`
- `LiveDot` : `aria-label="Surveillance active"` + `aria-live="polite"`
- Tous les boutons iconiques : `aria-label` explicite

### 8.3 Contraste

| Paire | Ratio | Niveau |
|---|---|---|
| `--text` (#EEF0F8) sur `--surface` (#0E1118) | 14.5:1 | AAA |
| `--danger` (#FF3B5C) sur `--danger-bg` | 4.6:1 | AA |
| `--warn` (#FFB020) sur `--warn-bg` | 3.8:1 | AA (grand texte) |
| `--info` (#3B9EFF) sur `--info-bg` | 4.1:1 | AA |
| `--ok` (#1FCC7A) sur `--ok-bg` | 4.8:1 | AA |

### 8.4 Focus visible

```css
/* Override focus par défaut — visible sur fond sombre */
:focus-visible {
  outline: 2px solid #5BA8FF;
  outline-offset: 2px;
  border-radius: 4px;
}
```

---

## 9. Performance

### 9.1 Contraintes critiques

| Métrique | Seuil | Source |
|---|---|---|
| Ouverture popup | P95 < **200ms** | Specs fonctionnelles §8.1 |
| Mise à jour badge après chargement | P95 < **500ms** | Specs fonctionnelles §8.1 |
| Overhead CPU en navigation normale | < **2%** | Specs fonctionnelles §8.2 |
| Taille totale plugin compilé | < **10 MB** | Specs fonctionnelles §8.2 |

### 9.2 Stratégies

**Rendu popup < 200ms**
- Pas de fetch réseau au montage — toutes les données sont lues depuis `chrome.storage.local` (synchrone sur le thread popup)
- Pas de lazy loading de routes (SPA 340px, pas besoin)
- Zustand : état disponible immédiatement sans Provider

**Taille bundle**
- Tailwind purge CSS — seules les classes utilisées sont incluses
- Radix UI : tree-shaking par composant importé individuellement
- Pas d'icône library — SVG inline uniquement (contrôle total de la taille)

**CPU SW < 2%**
- Le SW ne tourne que sur `onBeforeRequest` — pas de polling
- Détection PII : regex compilées une fois (`new RegExp(pattern.source, pattern.flags)` hors handler)
- Tracker matching : algorithme Trie O(log n)
- Batching sync NestJS toutes les 5 secondes (pas de requête par événement)

**Animations**
- CSS uniquement (`@keyframes`) — pas de JS animation
- `slideIn` sur les FeedRow entrants : `opacity + translateX`, 200ms
- `pulse` sur LiveDot : `opacity + scale`, 1.8s ease-in-out infinite

---

## 10. Tests

### 10.1 Stratégie

Tests **unitaires uniquement** en V1. Pas de tests de composants (pas de jsdom dans l'environnement MV3). Les composants React sont testés manuellement via le dev build.

### 10.2 Ce qui est testé avec Vitest

```
tests/
├── pii-detector.test.ts        # Regex, masquage, edge cases
├── tracker-matcher.test.ts     # Trie matching, faux positifs
└── badge-manager.test.ts       # Logique de couleur et compteur
```

#### Couverture minimale attendue

| Module | Cas testés |
|---|---|
| `PiiDetector.scan()` | Email FR, email international, tél FR (+33/0), tél E.164, URL clean, body POST, faux positif |
| `PiiDetector.mask()` | Email tronqué au bon endroit, tél masqué milieu, valeur courte |
| `TrackerMatcher.match()` | Domaine connu, sous-domaine connu, domaine inconnu, URL malformée |
| `BadgeManager` | Seuil vert/orange/rouge, reset sur nouvelle page, PII → rouge immédiat |

### 10.3 Exemple de test

```typescript
describe('PiiDetector', () => {
  it('masque correctement un email', () => {
    const results = detector.scan('https://pixel.facebook.com?email=john.doe@gmail.com')
    expect(results[0]?.maskedValue).toBe('jo••••@gmail.com')
    expect(results[0]?.maskedValue).not.toContain('john.doe')
  })

  it('ne détecte pas de faux positif sur une URL propre', () => {
    const results = detector.scan('https://wikipedia.org/wiki/Privacy_by_design')
    expect(results).toHaveLength(0)
  })
})
```

---

## 11. Conventions de code

### 11.1 React — règle absolue

**Composants fonctionnels uniquement.** Jamais de `class extends Component`.

```tsx
// ✅
function Badge({ severity, children }: BadgeProps): JSX.Element { ... }
const LiveDot = (): JSX.Element => { ... }

// ❌ Interdit
class Badge extends React.Component<BadgeProps> { ... }
```

### 11.2 TypeScript

- `any` interdit — utiliser `unknown` avec type guard si nécessaire
- Toute fonction exportée a un type de retour annoté
- Props d'un composant : interface dédiée, jamais `React.FC<{...}>` inline
- Préférer `JSX.Element` à `React.ReactNode` pour les composants qui retournent toujours du JSX
- Pas de `as` casting sauf cas documenté

### 11.3 Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Composants React | `PascalCase` | `ScoreRing`, `PiiTag` |
| Fichiers composants | `PascalCase.tsx` | `ScoreRing.tsx` |
| Hooks | `camelCase` préfixé `use` | `useSession`, `useAlerts` |
| Fichiers hooks | `camelCase.ts` | `useSession.ts` |
| Stores Zustand | `camelCase.store.ts` | `session.store.ts` |
| Types / interfaces | `PascalCase` | `Severity`, `BadgeProps` |
| Constantes | `SCREAMING_SNAKE_CASE` | `SEVERITY_COLORS`, `PII_LABELS` |

### 11.4 Structure d'un composant

```tsx
// 1. Imports — types en premier, puis composants, puis hooks
import type { Severity } from '../../types/severity.js'
import { SEVERITY_COLORS, SEVERITY_BG } from '../../types/severity.js'

// 2. Interface props (jamais inline)
interface BadgeProps {
  severity: Severity
  children: React.ReactNode
  className?: string
}

// 3. Composant — function declaration (pas arrow pour les exports nommés)
export function Badge({ severity, children, className = '' }: BadgeProps): JSX.Element {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${className}`}
      style={{
        color: SEVERITY_COLORS[severity],
        backgroundColor: SEVERITY_BG[severity],
      }}
    >
      {children}
    </span>
  )
}
```

### 11.5 SVG

Tous les SVG sont **inline** — pas d'import de fichiers `.svg`. Cela évite les problèmes de bundle MV3 et permet de passer `currentColor` facilement.

### 11.6 Tailwind vs style inline

- **Tailwind** : layout, espacement, typographie, radius — tout ce qui est statique
- **Style inline** : couleurs dynamiques dérivées des tokens `SEVERITY_COLORS` — ce qui dépend d'une prop à runtime

```tsx
// ✅ Bonne répartition
<div
  className="flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
  style={{ color: SEVERITY_COLORS[severity], backgroundColor: SEVERITY_BG[severity] }}
/>

// ❌ Mauvais — couleur statique en style inline
<div style={{ display: 'flex', padding: '4px 6px', color: '#FF3B5C' }} />
```
