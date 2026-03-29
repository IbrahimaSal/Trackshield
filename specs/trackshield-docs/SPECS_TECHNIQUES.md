# Trackshield — Spécifications Techniques

**Version** : 1.0  
**Date** : Juin 2025  
**Statut** : Draft  
**Auteur** : Ibrahima SALL  

---

## Table des matières

1. [Vue d'ensemble de l'architecture](#1-vue-densemble-de-larchitecture)
2. [Choix d'architecture](#2-choix-darchitecture) · [2.3 Typage strict](#23-typage-strict--règle-transversale)
3. [Plugin Chrome](#3-plugin-chrome)
4. [Service API — NestJS](#4-service-api--nestjs) · [4.5 Bus d'événements domaine](#45-bus-dévénements-domaine--eventemitter2)
5. [Service Analyse — FastAPI](#5-service-analyse--fastapi) · [5.4 Source de vérité score](#54-endpoints-fastapi)
6. [Base de données PostgreSQL](#6-base-de-données-postgresql) · [6.4 PgBouncer](#64-connection-pooling--pgbouncer)
7. [Cache Redis](#7-cache-redis)
8. [Communication inter-services](#8-communication-inter-services) · [8.1 Idempotence](#81-plugin--nestjs) · [8.2 Circuit breaker](#82-nestjs--fastapi) · [8.3 Logging structuré](#83-logging-structuré-et-correlation-id)
9. [Authentification & sécurité](#9-authentification--sécurité) · [9.4 HMAC inter-services](#94-authentification-inter-services--hmac)
10. [Déploiement cloud](#10-déploiement-cloud)
11. [Pipeline CI/CD](#11-pipeline-cicd)
12. [Environnements & variables](#12-environnements--variables)
13. [Roadmap technique V2](#13-roadmap-technique-v2)

---

## 1. Vue d'ensemble de l'architecture

### 1.1 Schéma global

```
┌─────────────────────────────────────────────────────────┐
│                    Plugin Chrome                         │
│  Background SW · Content Script · Popup React · Vite    │
│                  Manifest V3 · TypeScript                │
└──────────────┬──────────────────────────────────────────┘
               │ POST /api/events (si sync opt-in)
               │ chrome.storage.local (défaut)
               ▼
┌─────────────────────────────────┐
│      NestJS — API métier        │   Vercel (serverless)
│  Auth · Users · Events · Sync  │
│  Clean Arch · Hexagonale · DDD  │
└──────────┬──────────────────────┘
           │ HTTP interne
           ▼
┌──────────────────────────────────┐
│    FastAPI — Moteur d'analyse    │   Railway / Fly.io
│  Détection PII · Score RGPD      │
│  Classification trackers · PDF   │
│  Clean Arch simplifiée · ABC     │
└──────────┬───────────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐  ┌──────────┐
│ Supa-  │  │ Upstash  │
│ base   │  │ Redis    │
│ PSQL   │  │          │
└────────┘  └──────────┘
```

### 1.2 Principes fondamentaux

| Principe | Description |
|---|---|
| **Privacy by design** | Stockage local par défaut. Sync cloud opt-in avec consentement explicite. PII masquées en DB |
| **Séparation des responsabilités** | NestJS = contrat métier. FastAPI = compute analytique. Jamais exposé directement au plugin |
| **Migration progressive** | Go extractible chirurgicalement en V2 sans refonte. Kafka ajouté sans toucher NestJS |
| **Solo-friendly** | Budget infra V1 ~5€/mois. Tout sur tiers gratuits sauf Railway |
| **Type-safe bout en bout** | Types partagés TypeScript entre plugin et NestJS via `packages/shared-types`. Typage strict activé sur l'ensemble du codebase (TS + Python) |
| **Résilience by design** | Circuit breaker sur chaque appel inter-service. Mode dégradé défini pour chaque point de défaillance possible |
| **Idempotence des opérations** | Toute opération déclenchée par le réseau (batch d'events, MAJ listes) est rejouable sans effet de bord |
| **Source de vérité unique** | FastAPI est le seul calculateur du score RGPD. NestJS ne recalcule jamais de son côté |
| **Observabilité distribuée** | Chaque requête porte un `x-request-id` propagé de bout en bout. Logs structurés JSON sur tous les services |

---

## 2. Choix d'architecture

### 2.1 Architecture distribuée — Option B (Modulaire distribué)

**Décision** : Architecture modulaire distribuée avec 2 services en V1.

**Justification** :
- La frontière NestJS/FastAPI imposée par les points forts de chaque techno est déjà une architecture distribuée
- Différence de setup vs monolithe : 2–3 jours, pas des semaines
- Migration V2 chirurgicale (ajout Go uniquement sur l'ingestion) sans refonte
- Budget V1 quasi nul (~5€/mois pour Railway)

**Rejeté** :
- Monolithe NestJS seul : Python/ML impossible nativement, migration vers microservices coûteuse
- Microservices complets : sur-engineering pour dev solo, Kafka prématuré, ~30€+/mois infra

### 2.2 Architecture interne NestJS — Clean Architecture + Hexagonale + DDD tactique

**Clean Architecture** : couches domain → application → infrastructure → présentation. Les dépendances ne pointent que vers l'intérieur. Le domaine ne connaît pas NestJS, pas Prisma, pas Express.

**Architecture Hexagonale (Ports & Adapters)** :
- Ports = interfaces dans `domain/` (ex: `ITrackerRepository`)
- Adapters = implémentations dans `infrastructure/` (ex: `PrismaTrackerRepository`)
- Permet de swapper Prisma contre n'importe quoi sans toucher aux use cases
- FastAPI est un adapter (`FastApiAnalyzerAdapter`) derrière un port `IAnalyzer`

**DDD tactique** (pas stratégique — trop lourd pour un dev solo) :
- Entités : `Tracker`, `Session`, `PiiDetection`, `User`
- Value Objects : `RgpdScore`, `TrackerCategory`, `PiiType`
- Domain Events : `TrackerDetected`, `PiiExposed`, `SessionScored`
- Pas de Bounded Contexts formels en V1

**FastAPI — Clean Architecture simplifiée + ABC Python** :
- Domain : règles PII + scoring (pur Python, pas de framework)
- Adapters : `RegexPiiDetector`, `RulesTrackerClassifier` implémentent des ABCs
- Swappable vers ML (sklearn) sans changer l'API FastAPI

### 2.3 Typage strict — règle transversale

Le typage strict est une contrainte non négociable sur l'ensemble du codebase, TypeScript et Python confondus. `any`, `unknown` non gardé, et les types implicites sont interdits.

#### TypeScript — configuration `tsconfig.json` (tous les packages)

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Règles associées :**
- `any` interdit — utiliser `unknown` avec type guard explicite si le type est réellement inconnu
- Toute fonction exportée doit avoir un type de retour annoté explicitement
- Les DTOs et réponses API sont typés via `class-validator` + `class-transformer` (NestJS) ou `Pydantic v2` (FastAPI) — jamais des `object` ou `Record<string, any>` nus
- Les types partagés plugin ↔ NestJS passent exclusivement par `packages/shared-types`

#### Python — configuration `pyproject.toml`

```toml
[tool.mypy]
python_version = "3.12"
strict = true
disallow_untyped_defs = true
disallow_any_generics = true
warn_return_any = true
warn_unused_ignores = true
no_implicit_optional = true
```

**Règles associées :**
- Toutes les fonctions et méthodes sont annotées (paramètres + retour)
- Les dataclasses et Pydantic models sont les seules structures de données — pas de `dict` nu traversant les couches
- `# type: ignore` est interdit sauf cas documenté avec justification en commentaire

#### Vérification en CI

```yaml
# Dans ci.yml — les deux checks bloquants avant merge
- run: pnpm turbo typecheck   # tsc --noEmit sur tous les packages TS
- run: mypy apps/analyzer/src  # mypy strict sur le code Python
```

---

## 3. Plugin Chrome

### 3.1 Stack technique

| Composant | Technologie | Rôle |
|---|---|---|
| Format | Manifest V3 | Obligatoire Chrome Web Store depuis 2023 |
| Langage | TypeScript 5+ | Type safety, cohérence avec NestJS |
| Build | Vite + vite-plugin-web-extension | Compilation rapide, hot reload dev |
| UI Popup | React 18 + Tailwind CSS | Composants réutilisables |
| Tests | Vitest | Tests unitaires regex PII + matcher |
| Lint | ESLint + Prettier | Qualité du code |

### 3.2 Composants du plugin

#### Background Service Worker (`src/background/`)

Point d'entrée MV3. Tourne en arrière-plan, intercepte le trafic réseau.

```typescript
// Interception des requêtes — webRequest API
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const pii = piiDetector.scan(details.url, details.requestBody);
    const tracker = trackerMatcher.match(details.url);
    if (pii.length || tracker) {
      badgeManager.update(tabId, { pii, tracker });
      if (syncEnabled) syncClient.send({ pii, tracker, url: details.url });
    }
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);
```

**Responsabilités** :
- Intercepter requêtes via `chrome.webRequest.onBeforeRequest`
- Détecter PII via regex locales (`pii-detector.ts`)
- Matcher trackers via `packages/tracker-lists`
- Mettre à jour le badge via `chrome.action.setBadgeText` / `setBadgeBackgroundColor`
- Envoyer les events vers NestJS si sync opt-in (`sync-client.ts`)

#### Content Script (`src/content/`)

Injecté dans chaque page. Observe les formulaires pour détecter la saisie PII avant envoi.

```typescript
// Observation des formulaires
const observer = new MutationObserver(() => {
  document.querySelectorAll('input[type="tel"], input[type="email"]')
    .forEach(input => input.addEventListener('change', onFieldChange));
});
observer.observe(document.body, { childList: true, subtree: true });
```

#### Popup React (`src/popup/`)

Interface utilisateur 340px de large. Communique avec le background via `chrome.runtime.sendMessage`.

**Composants** :
- `ScoreRing` — anneau SVG animé avec note A–F
- `TrackerList` — liste des trackers détectés avec catégories
- `PiiAlert` — encart rouge listant les PII transmises
- `FluxMap` — carte source → destinations avec tags colorés

#### Storage (`src/storage/`)

```typescript
// Abstraction chrome.storage.local
export class LocalStore {
  async saveSession(session: Session): Promise<void> {
    const sessions = await this.getSessions();
    await chrome.storage.local.set({ sessions: [...sessions, session] });
  }

  async getSessions(days = 30): Promise<Session[]> {
    const cutoff = Date.now() - days * 86400000;
    const { sessions } = await chrome.storage.local.get('sessions');
    return (sessions ?? []).filter((s: Session) => s.timestamp > cutoff);
  }
}
```

### 3.3 Algorithme de détection PII

```typescript
// src/background/pii-detector.ts
const PII_PATTERNS = {
  EMAIL:  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE:  /(?:\+33|0033|0)[1-9](?:[0-9]{8}|\s[0-9]{2}(?:\s[0-9]{2}){3})/g,
  PHONE_INTL: /\+[1-9]\d{6,14}/g,
  IP:     /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
};

export function scanRequest(url: string, body?: string): PiiDetection[] {
  const target = url + (body ?? '');
  return Object.entries(PII_PATTERNS).flatMap(([type, regex]) =>
    [...target.matchAll(regex)].map(match => ({
      type: type as PiiType,
      maskedValue: mask(match[0], type as PiiType),
      destination: extractDomain(url),
    }))
  );
}

function mask(value: string, type: PiiType): string {
  if (type === 'EMAIL') return value.replace(/(?<=.{2}).(?=.*@)/, '•');
  if (type === 'PHONE') return value.slice(0, 4) + '••••' + value.slice(-4);
  return '••••••';
}
```

### 3.4 Bases de trackers embarquées

Les listes EasyList/Disconnect/EasyPrivacy sont compilées en JSON au build et embarquées dans le plugin. L'algorithme de matching utilise un **trie** pour une complexité O(log n) :

```typescript
// packages/tracker-lists/matcher.ts
export class TrackerMatcher {
  private trie: TrieNode;

  constructor(lists: TrackerList[]) {
    this.trie = buildTrie(lists.flatMap(l => l.domains));
  }

  match(url: string): TrackerMatch | null {
    const domain = extractDomain(url);
    return this.trie.find(domain);
  }
}
```

Mise à jour : endpoint `GET /api/tracker-lists/latest` sur NestJS, appelé toutes les 24h par le SW.

### 3.5 Permissions Manifest V3

```json
{
  "manifest_version": 3,
  "permissions": [
    "webRequest",
    "storage",
    "tabs",
    "notifications",
    "alarms"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "action": {
    "default_popup": "src/popup/popup.html",
    "default_icon": "icons/shield.png"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["src/content/form-observer.ts"],
    "run_at": "document_start"
  }]
}
```

---

## 4. Service API — NestJS

### 4.1 Stack technique

| Composant | Technologie | Version |
|---|---|---|
| Framework | NestJS | 10+ |
| Langage | TypeScript | 5+ |
| ORM | Prisma (couplage strict) | 5+ |
| Migrations | Flyway | Latest |
| Validation | class-validator + class-transformer | Latest |
| Auth | Passport.js + JWT (jsonwebtoken) | Latest |
| Tests unitaires | Vitest | Latest |
| Tests e2e | Supertest + Vitest | Latest |
| Linter | ESLint + Prettier | Latest |

> **Couplage Prisma** : Prisma est l'unique point d'accès à la base de données dans NestJS. Aucune requête SQL brute, aucun autre ORM ne doit coexister. `PrismaService` est injecté exclusivement dans les adapters `infrastructure/` — jamais dans le domaine ni les use cases.

### 4.2 Structure des modules

Chaque module suit la même structure **domain / application / infrastructure** :

```
modules/
  trackers/
    domain/
      tracker.entity.ts           # Entité pure
      tracker-category.vo.ts      # Value Object
      tracker.repository.ts       # Port (interface)
      events/
        tracker-detected.event.ts
    application/
      use-cases/
        detect-trackers.usecase.ts
        get-session-trackers.usecase.ts
    infrastructure/
      persistence/
        prisma-tracker.repository.ts   # Adapter Prisma
      http/
        trackers.controller.ts
        dtos/
          create-tracker.dto.ts
          tracker-response.dto.ts
      fastapi/
        fastapi-analyzer.adapter.ts    # Adapter HTTP vers FastAPI
    trackers.module.ts
```

### 4.3 Entités domaine

```typescript
// modules/trackers/domain/tracker.entity.ts
export class Tracker extends BaseEntity {
  private constructor(
    private readonly _name: string,
    private readonly _domain: string,
    private readonly _category: TrackerCategory,
    private readonly _sessionId: string,
  ) { super(); }

  static create(props: TrackerProps): Result<Tracker, DomainError> {
    if (!props.domain) return Result.fail(new DomainError('Domain required'));
    return Result.ok(new Tracker(props.name, props.domain, props.category, props.sessionId));
  }

  get name() { return this._name; }
  get domain() { return this._domain; }
  get category() { return this._category; }
  isMalicious(): boolean { return this._category === TrackerCategory.FINGERPRINTING; }
}
```

```typescript
// shared/rgpd-score.value-object.ts
export class RgpdScore {
  private constructor(private readonly _value: number) {}

  static calculate(data: ScoreInput): RgpdScore {
    const score =
      (1 - Math.min(data.trackerCount / 20, 1)) * 30 +
      (data.piiCount === 0 ? 35 : Math.max(0, 35 - data.piiCount * 10)) +
      (1 - Math.min(data.cookieScore / 10, 1)) * 20 +
      (data.euPercentage / 100) * 15;
    return new RgpdScore(Math.round(score));
  }

  get value() { return this._value; }
  get grade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (this._value >= 90) return 'A';
    if (this._value >= 75) return 'B';
    if (this._value >= 55) return 'C';
    if (this._value >= 35) return 'D';
    return 'F';
  }
  isCritical(): boolean { return this._value < 35; }
}
```

### 4.4 Use cases

```typescript
// modules/sessions/application/use-cases/score-session.usecase.ts
@Injectable()
export class ScoreSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private sessionRepo: ISessionRepository,
    @Inject(ANALYZER_PORT) private analyzer: IAnalyzer,
  ) {}

  async execute(sessionId: string): Promise<Result<RgpdScore, UseCaseError>> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) return Result.fail(new NotFoundError('Session'));

    const analysis = await this.analyzer.analyze(session);
    const score = RgpdScore.calculate({
      trackerCount: session.trackers.length,
      piiCount: session.piiDetections.length,
      cookieScore: analysis.cookieScore,
      euPercentage: analysis.euPercentage,
    });

    await this.sessionRepo.updateScore(sessionId, score);
    return Result.ok(score);
  }
}
```

### 4.5 Bus d'événements domaine — EventEmitter2

> **Pourquoi un bus d'événements ?**
>
> Les domain events (`TrackerDetected`, `PiiExposed`, `SessionScored`) sont déclarés comme classes TypeScript, mais sans dispatcher ils ne servent à rien : les use cases seraient obligés de s'appeler mutuellement directement, créant un couplage fort entre modules.
>
> Exemple sans bus : `RecordPiiDetectionUseCase` devrait injecter `AlertService` ET `ScoreService` pour déclencher l'alerte et recalculer le score — le module `pii` dépendrait alors des modules `alerts` et `sessions`. Dans une architecture hexagonale, c'est une violation : un module ne doit pas connaître ses consommateurs.
>
> Avec un bus d'événements, `RecordPiiDetectionUseCase` publie `PiiExposedEvent` et s'arrête là. Les autres modules s'abonnent de façon indépendante. Le couplage disparaît.

> **Pourquoi EventEmitter2 et non Kafka, RabbitMQ ou BullMQ ?**
>
> Ce choix se justifie par la nature du problème à résoudre : un problème de **couplage intra-NestJS**, pas de communication inter-services.
>
> `PiiExposedEvent` est émis par le module `pii` et consommé par `sessions` et `alerts` — les trois vivent dans le **même processus NestJS**. EventEmitter2 résout exactement ça, sans aucune infrastructure externe.
>
> Kafka, RabbitMQ et BullMQ introduisent chacun un **broker externe** — un nouveau service à déployer, monitorer, et dont il faut gérer la disponibilité et les pannes. Utiliser l'un d'eux pour de la communication intra-processus revient à brancher un camion de déménagement pour transporter un stylo d'une pièce à l'autre.
>
> Voici la règle de décision utilisée :
>
> | Besoin | Outil adapté | Pourquoi pas les autres |
> |---|---|---|
> | Découplage entre modules du même processus | **EventEmitter2** | Les autres ajoutent un broker réseau inutile |
> | Jobs longs, retry configurable, scheduling | **BullMQ** | EventEmitter n'a pas de persistance ni de retry |
> | Communication fiable entre deux services distincts | **RabbitMQ** | EventEmitter ne traverse pas les frontières de processus |
> | Ingestion haute fréquence, replay, audit trail | **Kafka** | Kafka a un coût ops élevé injustifié avant 10k users actifs |
>
> **BullMQ** deviendrait pertinent dans Trackshield si des handlers devaient effectuer des opérations longues sans bloquer la réponse HTTP — par exemple : envoyer un email de notification, générer un PDF de rapport en arrière-plan, ou appeler un webhook externe. Ces cas n'existent pas en V1.
>
> **RabbitMQ** deviendrait pertinent si un second service autonome (ex: un futur service de notification dédié, séparé de NestJS) devait réagir aux mêmes événements. En V1, tout est dans NestJS.
>
> **Kafka** est prévu en V2 via le service Go d'ingestion haute fréquence (cf. §13.1). Le seuil de bascule est ~10 000 utilisateurs actifs simultanés, ou dès que le besoin de **replay** d'événements apparaît (audit RGPD complet, reconstruction d'état). La bonne nouvelle : EventEmitter2 peut être remplacé par Kafka chirurgicalement — les use cases et les handlers `@OnEvent` ne changent pas, seule l'infrastructure d'émission est swappée.

```typescript
// Installation
// pnpm --filter api add @nestjs/event-emitter eventemitter2

// app.module.ts
EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' })

// modules/pii/application/use-cases/record-pii-detection.usecase.ts
@Injectable()
export class RecordPiiDetectionUseCase {
  constructor(
    @Inject(PII_REPOSITORY) private piiRepo: IPiiRepository,
    private eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: RecordPiiDto): Promise<Result<PiiDetection, DomainError>> {
    const detection = PiiDetection.create(dto);
    if (detection.isFail()) return detection;

    await this.piiRepo.save(detection.value);

    // Publication de l'event — ce use case ne sait pas qui l'écoute
    this.eventEmitter.emit('pii.exposed', new PiiExposedEvent(detection.value));

    return Result.ok(detection.value);
  }
}

// modules/sessions/application/handlers/pii-exposed.handler.ts
@Injectable()
export class PiiExposedHandler {
  constructor(private scoreService: ScoreSessionUseCase) {}

  // Recalcule le score dès qu'une PII est détectée — sans couplage avec le module pii
  @OnEvent('pii.exposed')
  async handle(event: PiiExposedEvent): Promise<void> {
    await this.scoreService.execute(event.sessionId);
  }
}

// modules/alerts/application/handlers/pii-exposed.handler.ts
@Injectable()
export class AlertOnPiiHandler {
  constructor(private notifier: NotificationService) {}

  @OnEvent('pii.exposed')
  async handle(event: PiiExposedEvent): Promise<void> {
    await this.notifier.sendCriticalAlert({
      type: 'PII_EXPOSED',
      piiType: event.piiType,
      destination: event.destination,
    });
  }
}
```

**Événements domaine déclarés :**

| Event | Émis par | Consommé par |
|---|---|---|
| `tracker.detected` | `DetectTrackersUseCase` | `ScoreSessionUseCase`, `AlertOnTrackerHandler` |
| `pii.exposed` | `RecordPiiDetectionUseCase` | `ScoreSessionUseCase`, `AlertOnPiiHandler` |
| `session.scored` | `ScoreSessionUseCase` | `SyncSessionHandler` (si opt-in cloud) |

---

### 4.6 Endpoints API

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh

POST   /api/events              # Plugin → NestJS (batch d'events, idempotent)
GET    /api/sessions            # Historique des sessions
GET    /api/sessions/:id        # Détail d'une session
GET    /api/sessions/:id/report # Génère le rapport (délègue à FastAPI)

GET    /api/tracker-lists/latest  # Plugin récupère les listes MAJ

GET    /api/users/me
PATCH  /api/users/me/preferences
PATCH  /api/users/me/consent      # Activation sync cloud
DELETE /api/users/me/data         # Suppression RGPD
```

### 4.7 Pattern Result<T, E>

Utilisé dans tout le domaine pour éviter les exceptions non typées :

```typescript
export class Result<T, E extends Error = Error> {
  private constructor(
    private readonly _ok: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  static ok<T>(value: T): Result<T, never> { return new Result(true, value); }
  static fail<E extends Error>(error: E): Result<never, E> { return new Result(false, undefined, error); }

  isOk(): this is { value: T } { return this._ok; }
  isFail(): this is { error: E } { return !this._ok; }
  get value(): T { if (!this._ok) throw new Error('Cannot get value of failed result'); return this._value!; }
  get error(): E { if (this._ok) throw new Error('Cannot get error of ok result'); return this._error!; }
}
```

---

## 5. Service Analyse — FastAPI

### 5.1 Stack technique

| Composant | Technologie | Version |
|---|---|---|
| Framework | FastAPI | 0.110+ |
| Langage | Python | 3.12+ |
| Package manager | uv | Latest |
| Validation | Pydantic v2 | Latest |
| ORM | SQLAlchemy 2.0 (async) | Latest |
| PDF | WeasyPrint | Latest |
| Tests | pytest + pytest-asyncio | Latest |
| Container | Docker (python:3.12-slim) | Latest |

### 5.2 Architecture interne

```
src/
  domain/
    pii_detector.abc.py        # ABC port
    tracker_classifier.abc.py  # ABC port
    rgpd_scorer.py             # Logique de scoring pure
    models.py                  # Dataclasses domaine
  adapters/
    regex_pii_detector.py      # Implémentation V1
    rules_tracker_classifier.py
    ml_pii_detector.py         # Implémentation V2 (sklearn)
  api/
    routes/
      analyze.py               # POST /analyze
      score.py                 # POST /score
      report.py                # POST /report
    schemas.py                 # Pydantic models (I/O)
    dependencies.py            # Injection de dépendances
  main.py
```

### 5.3 Interfaces ABC

```python
# domain/pii_detector.abc.py
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class PiiDetection:
    pii_type: str       # EMAIL, PHONE, IP, ID_PUB...
    masked_value: str   # j••••@gmail.com
    destination: str    # pixel.facebook.com
    confidence: float   # 0.0 → 1.0

class PiiDetectorABC(ABC):
    @abstractmethod
    def detect(self, url: str, payload: str | None) -> list[PiiDetection]:
        """Détecte les PII dans une URL ou un corps de requête."""
        ...
```

```python
# adapters/regex_pii_detector.py
import re
from ..domain.pii_detector.abc import PiiDetectorABC, PiiDetection

class RegexPiiDetector(PiiDetectorABC):
    PATTERNS = {
        'EMAIL': re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'),
        'PHONE': re.compile(r'(?:\+33|0033|0)[1-9](?:[0-9]{8})'),
        'PHONE_INTL': re.compile(r'\+[1-9]\d{6,14}'),
    }

    def detect(self, url: str, payload: str | None = None) -> list[PiiDetection]:
        target = url + (payload or '')
        detections = []
        for pii_type, pattern in self.PATTERNS.items():
            for match in pattern.finditer(target):
                detections.append(PiiDetection(
                    pii_type=pii_type,
                    masked_value=self._mask(match.group(), pii_type),
                    destination=self._extract_domain(url),
                    confidence=0.95,
                ))
        return detections

    def _mask(self, value: str, pii_type: str) -> str:
        if pii_type == 'EMAIL':
            parts = value.split('@')
            return parts[0][:2] + '••••' + '@' + parts[1]
        return value[:4] + '••••' + value[-4:]
```

### 5.4 Endpoints FastAPI

```
POST /analyze        # Analyse une requête → retourne trackers + PII
POST /score          # Calcule le score RGPD d'une session
POST /report         # Génère un rapport PDF (WeasyPrint)
GET  /health         # Health check
POST /lists/refresh  # Déclenche la MAJ des bases EasyList (effet de bord → POST)
```

> **Pourquoi `POST /lists/refresh` et non `GET /lists/update` ?**
>
> Le verbe HTTP `GET` est défini comme **idempotent et sans effet de bord** par la spécification HTTP (RFC 9110). Les navigateurs, proxies et CDN peuvent rejouer un GET librement : prefetch, cache warming, health check automatique. Un `GET /lists/update` pourrait donc déclencher une MAJ des bases de trackers à chaque passage d'un proxy — comportement non désiré et difficile à déboguer.
>
> La règle est simple : si une requête modifie un état, c'est un `POST` (ou `PUT`/`PATCH`/`DELETE` selon la sémantique). Un `POST /lists/refresh` ne sera jamais rejoué automatiquement par l'infrastructure.

> **Pourquoi FastAPI est la seule source de vérité pour le score RGPD ?**
>
> Les specs initiales définissaient `RgpdScore.calculate()` dans NestJS ET `rgpd_scorer.py` dans FastAPI — deux implémentations du même algorithme dans deux langages différents. C'est une bombe à retardement : la moindre évolution des coefficients (ex: passer les PII de 35% à 40%) doit être répercutée dans les deux endroits. L'oubli d'une mise à jour crée une incohérence silencieuse où deux utilisateurs ayant le même profil de navigation obtiennent des scores différents selon le chemin de code emprunté.
>
> **Règle** : NestJS appelle toujours `POST /score` sur FastAPI. La classe `RgpdScore` dans NestJS est conservée uniquement comme type de valeur de retour (Value Object de présentation) — elle ne contient plus la logique `calculate()`.



### 5.5 Schéma Pydantic I/O

```python
# api/schemas.py
from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    url: str
    method: str
    payload: str | None = None
    headers: dict[str, str] = {}

class AnalyzeResponse(BaseModel):
    pii_detections: list[PiiDetectionSchema]
    tracker_match: TrackerMatchSchema | None
    analyzed_at: datetime

class ScoreRequest(BaseModel):
    session_id: str
    tracker_count: int
    pii_count: int
    cookie_score: float
    eu_percentage: float

class ScoreResponse(BaseModel):
    score: int
    grade: Literal['A', 'B', 'C', 'D', 'F']
    is_critical: bool
    breakdown: dict[str, float]
```

---

## 6. Base de données PostgreSQL

### 6.1 Hébergement

**V1** : Supabase (gratuit jusqu'à 500 MB, PostgreSQL 15, EU région)  
**V2** : Supabase Pro (~25€/mois) si > 500 MB

### 6.2 Schéma Prisma complet

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String
  syncEnabled     Boolean   @default(false)
  consentGivenAt  DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  sessions        Session[]
  preferences     UserPreference?
}

model UserPreference {
  id                  String  @id @default(uuid())
  userId              String  @unique
  user                User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  alertsEnabled       Boolean @default(true)
  alertPii            Boolean @default(true)
  alertGeo            Boolean @default(true)
  alertFingerprint    Boolean @default(true)
  alertTrackers       Boolean @default(false)
  retentionDays       Int     @default(30)
  discreteMode        Boolean @default(false)
  whitelistedDomains  String[] @default([])
}

model Session {
  id          String    @id @default(uuid())
  userId      String?
  user        User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  domain      String
  url         String
  rgpdScore   Int?
  rgpdGrade   String?   // A, B, C, D, F
  startedAt   DateTime  @default(now())
  endedAt     DateTime?
  trackers    Tracker[]
  piiDetections PiiDetection[]
  requests    Request[]

  @@index([userId, startedAt])
  @@index([domain])
}

model Tracker {
  id          String   @id @default(uuid())
  sessionId   String
  session     Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  name        String
  domain      String
  category    String   // ADVERTISING, ANALYTICS, SOCIAL, FINGERPRINTING
  requestCount Int     @default(1)
  detectedAt  DateTime @default(now())

  @@index([sessionId])
  @@index([domain])
}

model PiiDetection {
  id           String   @id @default(uuid())
  sessionId    String
  session      Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  requestId    String?
  request      Request? @relation(fields: [requestId], references: [id])
  piiType      String   // EMAIL, PHONE, IP, ID_PUB, GEO, DEVICE
  maskedValue  String   // j••••@gmail.com — JAMAIS la valeur brute
  destination  String   // pixel.facebook.com
  country      String?  // USA, FR, DE...
  detectedAt   DateTime @default(now())

  @@index([sessionId])
}

model Request {
  id            String         @id @default(uuid())
  sessionId     String
  session       Session        @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  url           String
  method        String
  containsPii   Boolean        @default(false)
  timestamp     DateTime       @default(now())
  piiDetections PiiDetection[]

  @@index([sessionId, timestamp])
}
```

### 6.3 Migrations

Gestion via **Flyway** — outil de migration SQL versionné, indépendant du framework.

**Pourquoi Flyway plutôt que Prisma Migrate :**
- Migrations en SQL pur versionné (`V1__init.sql`, `V2__add_index.sql`) — lisibles, auditables, rejouables
- Contrôle total sur le DDL en production (pas de génération automatique hasardeuse)
- Intégration CI/CD native sans dépendance Node.js dans le pipeline DB
- Support du rollback explicite via scripts `U` (Undo)

**Convention de nommage des scripts :**

```
apps/api/flyway/
  sql/
    V1__init_schema.sql          # Création initiale des tables
    V2__add_session_indexes.sql  # Ajout d'index
    V3__add_user_preferences.sql
    ...
  flyway.conf                    # Config Flyway (url, user, locations)
```

**Commandes :**

```bash
# Appliquer les migrations en attente
flyway migrate

# Vérifier l'état des migrations
flyway info

# Dev local (via Docker)
docker run --rm flyway/flyway \
  -url=jdbc:postgresql://localhost:5432/trackshield \
  -user=trackshield -password=trackshield \
  -locations=filesystem:apps/api/flyway/sql \
  migrate
```

**Prisma reste utilisé pour :**
- Générer le client TypeScript (`prisma generate`) à partir du `schema.prisma`
- L'introspection locale (`prisma db pull`) pour synchroniser le schéma Prisma avec les migrations Flyway
- Le seeding de données de test (`prisma db seed`)

> **Règle** : `schema.prisma` décrit la structure attendue mais **ne pilote jamais les migrations**. C'est Flyway qui est la source de vérité pour l'état de la base.

### 6.4 Connection pooling — PgBouncer

> **Pourquoi c'est critique avec Vercel serverless ?**
>
> PostgreSQL maintient une connexion par client connecté. Chaque connexion consomme ~5–10 MB de RAM côté serveur. Supabase gratuit plafonne à **60 connexions simultanées**.
>
> NestJS déployé sur Vercel fonctionne en mode **serverless** : à chaque requête entrante, Vercel peut instancier une nouvelle fonction isolée. Si 50 requêtes arrivent en parallèle, 50 instances de NestJS tentent d'ouvrir 50 connexions PostgreSQL simultanément — le plafond Supabase est immédiatement atteint. Les requêtes suivantes échouent avec `too many connections`, rendent l'API inutilisable, alors même que le serveur n'est pas sous charge.
>
> **PgBouncer** est un proxy de connexion qui s'intercale entre l'application et PostgreSQL. Il maintient un pool réduit de vraies connexions PostgreSQL (ex: 10) et les partage entre toutes les instances applicatives. En mode `transaction`, une connexion est empruntée uniquement le temps d'une transaction, puis rendue au pool immédiatement.
>
> Supabase intègre PgBouncer nativement — il suffit d'utiliser le bon port dans la `DATABASE_URL`.

```bash
# ❌ Connexion directe PostgreSQL — dangereux en serverless
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres

# ✅ Via PgBouncer intégré Supabase (port 6543)
DATABASE_URL=postgresql://user:pass@db.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
```

> Le paramètre `connection_limit=1` indique à Prisma de n'ouvrir qu'une seule connexion par instance — c'est PgBouncer qui gère le pooling global, pas Prisma.

**Configuration à ajouter dans `.env.example` :**

```bash
# ── Database ──────────────────────────────────
DATABASE_URL=postgresql://user:pass@db.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
DATABASE_URL_DIRECT=postgresql://user:pass@db.supabase.co:5432/postgres
# DATABASE_URL_DIRECT est utilisé uniquement par Flyway (migrations) — PgBouncer ne supporte pas les DDL en mode transaction
```

---

### 6.5 Règles de rétention

- Sessions et détections : supprimées selon `UserPreference.retentionDays` (défaut 30 jours)
- Job de nettoyage : cron NestJS toutes les nuits à 02:00 UTC
- Suppression RGPD : `DELETE /api/users/me/data` → cascade sur toutes les tables

---

---

## 7. Cache Redis

### 7.1 Hébergement

**V1** : Upstash Redis (gratuit jusqu'à 10 000 req/jour, EU)

### 7.2 Usages

| Clé | TTL | Usage |
|---|---|---|
| `rate:${ip}:${endpoint}` | 60s | Rate limiting endpoints publics |
| `session:${token}` | 1h | Cache JWT blacklist (logout) |
| `tracker-lists:version` | 24h | Version courante des bases |
| `tracker-lists:data` | 24h | Cache JSON des listes compilées |
| `score:${sessionId}` | 10min | Cache calcul score RGPD |
| `idem:${idempotencyKey}` | 5min | Déduplication des batches d'events |

```typescript
// infrastructure/cache/redis.service.ts
@Injectable()
export class RedisService {
  private client: Redis;

  async get<T>(key: string): Promise<T | null> {
    const val = await this.client.get(key);
    return val ? JSON.parse(val) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.client.setex(key, ttlSeconds, JSON.stringify(value));
  }
}
```

---

## 8. Communication inter-services

### 8.1 Plugin → NestJS

**Protocole** : HTTPS REST
**Authentification** : JWT Bearer token (si sync opt-in) ou anonyme
**Batch** : le plugin regroupe les events et envoie toutes les 5 secondes pour limiter les requêtes
**Idempotence** : chaque batch porte une clé UUID stable pour éviter les doublons en cas de retry

> **Pourquoi l'idempotence est indispensable ici ?**
>
> Le plugin est un service worker qui s'exécute dans un environnement réseau instable (connexion mobile, timeout, Vercel cold start). En cas d'échec réseau, la logique naturelle est de retenter l'envoi. Sans idempotence, chaque retry crée des doublons en base : le même tracker apparaît deux fois, le score est faussé, les alertes se déclenchent deux fois.
>
> Le principe est simple : le plugin génère un UUID unique pour chaque batch avant de l'envoyer. Si NestJS a déjà traité ce batch (clé présente dans Redis), il répond `200 OK` immédiatement sans réinsérer quoi que ce soit. La clé est conservée 5 minutes — largement suffisant pour couvrir les fenêtres de retry.

```typescript
// Plugin: src/background/sync-client.ts
export class SyncClient {
  private queue: Event[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  enqueue(event: Event): void {
    this.queue.push(event);
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 5000);
    }
  }

  private async flush(): Promise<void> {
    if (!this.queue.length) return;
    const batch = this.queue.splice(0);
    this.timer = null;

    // Clé d'idempotence stable pour ce batch — générée avant le premier envoi
    const idempotencyKey = crypto.randomUUID();

    await fetch(`${API_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getToken()}`,
        'x-idempotency-key': idempotencyKey,
      },
      body: JSON.stringify({ events: batch }),
    });
  }
}
```

```typescript
// NestJS: modules/events/application/use-cases/process-event-batch.usecase.ts
@Injectable()
export class ProcessEventBatchUseCase {
  constructor(
    private redis: RedisService,
    private eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: EventBatchDto, idempotencyKey: string): Promise<void> {
    // Si déjà traité → sortie immédiate, sans erreur ni double insertion
    const alreadyProcessed = await this.redis.get(`idem:${idempotencyKey}`);
    if (alreadyProcessed) return;

    // Traitement des events
    for (const event of dto.events) {
      this.eventEmitter.emit(`event.${event.type}`, event);
    }

    // Marquer comme traité — TTL 5 min couvre toutes les fenêtres de retry raisonnables
    await this.redis.set(`idem:${idempotencyKey}`, '1', 300);
  }
}
```

### 8.2 NestJS → FastAPI

**Protocole** : HTTP interne (non exposé sur internet)
**Timeout** : 3 secondes (fail fast)
**Résilience** : Circuit breaker + fallback dégradé

> **Pourquoi un circuit breaker plutôt qu'un simple retry ?**
>
> Un retry avec backoff exponentiel est utile pour les erreurs transitoires (pic de charge ponctuel, redémarrage). Mais si FastAPI est vraiment indisponible (crash, déploiement en cours, Railway hors ligne), chaque requête entrante va attendre `timeout × nb_retries` avant d'échouer. Avec les specs initiales : 10s × 3 tentatives = **30 secondes de blocage par requête**, pendant lesquelles NestJS accumule des requêtes en attente, sature sa boucle d'événements Node.js et finit par tomber lui-même.
>
> Le **circuit breaker** est un interrupteur automatique. Il observe le taux d'erreur sur un intervalle glissant. Si ce taux dépasse un seuil (ex: 50%), il "ouvre le circuit" : les appels vers FastAPI sont court-circuités immédiatement sans attendre le timeout, et le fallback est retourné instantanément. Après un délai de récupération (30s), il laisse passer une requête test pour vérifier si FastAPI est revenu.
>
> Résultat : FastAPI peut tomber sans impacter la disponibilité de NestJS.

```typescript
// pnpm --filter api add opossum @types/opossum

// infrastructure/fastapi/fastapi-analyzer.adapter.ts
import CircuitBreaker from 'opossum';

@Injectable()
export class FastApiAnalyzerAdapter implements IAnalyzer {
  private readonly breaker: CircuitBreaker;

  constructor(
    private readonly http: HttpService,
    private readonly logger: LoggerService,
  ) {
    this.breaker = new CircuitBreaker(this.callFastApi.bind(this), {
      timeout: 3000,                  // Fail fast à 3s (pas 10s)
      errorThresholdPercentage: 50,   // Ouvre si 50% des requêtes échouent
      resetTimeout: 30000,            // Tente de refermer après 30s
      volumeThreshold: 5,             // Minimum 5 requêtes avant d'évaluer
    });

    this.breaker.on('open',    () => this.logger.warn('Circuit FastAPI OUVERT — mode dégradé activé'));
    this.breaker.on('close',   () => this.logger.log('Circuit FastAPI FERMÉ — service restauré'));
    this.breaker.on('halfOpen',() => this.logger.log('Circuit FastAPI — test de récupération...'));
  }

  async analyze(session: Session): Promise<AnalysisResult> {
    return this.breaker.fire(session) as Promise<AnalysisResult>;
  }

  private async callFastApi(session: Session): Promise<AnalysisResult> {
    const { data } = await firstValueFrom(
      this.http.post<AnalysisResult>(`${FASTAPI_URL}/analyze`, {
        sessionId: session.id,
        requests: session.requests.map(r => ({ url: r.url, method: r.method })),
      }).pipe(timeout(3000))
    );
    return data;
  }

  // Fallback : score dégradé calculé localement sans FastAPI
  async analyzeFallback(session: Session): Promise<AnalysisResult> {
    this.logger.warn(`Fallback activé pour session ${session.id}`);
    return {
      cookieScore: 5,         // Valeur neutre par défaut
      euPercentage: 50,
      degraded: true,         // Flag indiquant que le score est approximatif
    };
  }
}
```

> **Note** : le fallback est configuré dans le module avec `this.breaker.fallback(this.analyzeFallback.bind(this))`. Le champ `degraded: true` dans la réponse permet au frontend d'afficher un avertissement "Score estimé — analyse complète indisponible".

### 8.3 Logging structuré et Correlation ID

> **Pourquoi les logs structurés sont indispensables en architecture distribuée ?**
>
> En monolithe, un log texte suffit : tout est dans le même processus, la stack trace pointe vers la ligne de code. En distribué (plugin → NestJS → FastAPI), une erreur peut se produire à n'importe quel niveau. Sans identifiant commun traversant tous les services, il est impossible de relier les logs d'une même requête. On voit une erreur FastAPI mais on ne sait pas quelle requête plugin l'a déclenchée, ni dans quel contexte.
>
> La solution est le **Correlation ID** (`x-request-id`) : un UUID généré à l'entrée de NestJS, propagé dans tous les appels sortants (vers FastAPI), et inclus dans chaque ligne de log. Avec un outil comme Datadog ou même un simple `grep`, on peut reconstituer le fil complet d'une requête à travers tous les services.
>
> Les logs sont en **JSON structuré** (pas du texte libre) pour être indexables et filtrables par n'importe quel outil d'observabilité.

```typescript
// pnpm --filter api add nestjs-pino pino-http

// main.ts
import { Logger } from 'nestjs-pino';
app.useLogger(app.get(Logger));

// app.module.ts
LoggerModule.forRoot({
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }   // Lisible en dev
      : undefined,                   // JSON pur en prod
    genReqId: (req) => req.headers['x-request-id'] ?? randomUUID(),
    customProps: () => ({ service: 'nestjs-api' }),
  },
})

// Middleware : injecte et propage le requestId
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}

// Dans FastApiAnalyzerAdapter — propagation vers FastAPI
this.http.post(url, body, {
  headers: { 'x-request-id': requestId, 'x-internal-secret': secret },
})
```

```python
# FastAPI — structlog
# uv add structlog

# main.py
import structlog

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        structlog.processors.JSONRenderer(),   # JSON pur en prod
    ]
)

# api/middleware/correlation.py
from starlette.middleware.base import BaseHTTPMiddleware

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id", str(uuid4()))
        # Injecte dans le contexte de log pour toutes les lignes du handler
        with structlog.contextvars.bound_contextvars(request_id=request_id, service="fastapi-analyzer"):
            response = await call_next(request)
            response.headers["x-request-id"] = request_id
            return response
```

**Exemple de log JSON produit :**
```json
{
  "timestamp": "2025-06-15T14:32:07.123Z",
  "level": "warn",
  "service": "nestjs-api",
  "request_id": "a1b2c3d4-...",
  "message": "PII detected",
  "pii_type": "PHONE",
  "destination": "pixel.facebook.com",
  "session_id": "sess_xyz"
}
```

---

## 9. Authentification & sécurité

### 9.1 JWT Strategy

```typescript
// modules/auth/infrastructure/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    return { id: payload.sub, email: payload.email };
  }
}
```

**Access token** : 15 minutes  
**Refresh token** : 7 jours, rotation à chaque usage  
**Stockage côté plugin** : `chrome.storage.local` (chiffré par Chrome)

### 9.2 Rate limiting

```typescript
// Throttler NestJS
ThrottlerModule.forRoot([
  { name: 'short',  ttl: 1000,  limit: 10  },  // 10 req/s
  { name: 'medium', ttl: 60000, limit: 100 },  // 100 req/min
  { name: 'long',   ttl: 86400000, limit: 1000 }, // 1000 req/jour
])
```

### 9.3 Sécurité des données PII

- Les valeurs PII ne sont **jamais** stockées en clair en base
- Seules les valeurs masquées (`j••••@gmail.com`) sont persistées
- Les valeurs brutes ne quittent jamais le plugin
- Headers de sécurité NestJS : Helmet.js (CSP, HSTS, X-Frame-Options)
- CORS : whitelist des origines du plugin Chrome uniquement

### 9.4 Authentification inter-services — HMAC

> **Pourquoi le shared secret seul est insuffisant ?**
>
> La spec initiale prévoyait `FASTAPI_INTERNAL_SECRET` : NestJS envoie ce secret dans un header, FastAPI vérifie qu'il correspond. Ce mécanisme a deux faiblesses :
>
> 1. **Rejeu** — si un attaquant intercepte une requête interne (réseau compromis, log qui fuite), il dispose d'un secret valide indéfiniment. Il peut rejouer n'importe quelle requête vers FastAPI sans limitation.
> 2. **Rotation difficile** — changer le secret exige un redéploiement synchronisé des deux services.
>
> La solution est le **HMAC signé sur le timestamp** : NestJS signe `timestamp + body_hash` avec le secret partagé. FastAPI vérifie la signature ET que le timestamp est récent (< 30 secondes). Même si la signature est interceptée, elle ne peut pas être rejouée au-delà de la fenêtre de 30s.
>
> C'est le même mécanisme utilisé par AWS Signature V4, Stripe webhooks, et GitHub webhooks.

```typescript
// NestJS — infrastructure/fastapi/fastapi-hmac.interceptor.ts
import { createHmac } from 'crypto';

@Injectable()
export class FastApiHmacInterceptor implements HttpInterceptor {
  constructor(private config: ConfigService) {}

  intercept(req: HttpRequest<unknown>): HttpRequest<unknown> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify(req.body ?? '');
    const signature = createHmac('sha256', this.config.get('FASTAPI_INTERNAL_SECRET'))
      .update(`${timestamp}.${body}`)
      .digest('hex');

    return req.clone({
      headers: req.headers
        .set('x-timestamp', timestamp)
        .set('x-signature', signature),
    });
  }
}
```

```python
# FastAPI — api/middleware/hmac_auth.py
import hmac, hashlib, time, json
from fastapi import Request, HTTPException

async def verify_hmac(request: Request) -> None:
    """Dépendance injectée sur toutes les routes internes."""
    timestamp = request.headers.get("x-timestamp")
    signature = request.headers.get("x-signature")
    secret = settings.FASTAPI_INTERNAL_SECRET.encode()

    if not timestamp or not signature:
        raise HTTPException(status_code=401, detail="Missing auth headers")

    # Fenêtre de validité : 30 secondes (couvre la latence réseau normale)
    if abs(time.time() - int(timestamp)) > 30:
        raise HTTPException(status_code=401, detail="Request expired — replay attack prevented")

    body = await request.body()
    expected = hmac.new(secret, f"{timestamp}.{body.decode()}".encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="Invalid signature")

# Utilisation dans les routes internes
@router.post("/analyze", dependencies=[Depends(verify_hmac)])
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    ...
```

---

### 9.5 Conformité RGPD côté backend

- Consentement enregistré avec timestamp (`consentGivenAt`)
- Endpoint de suppression complète : `DELETE /api/users/me/data`
- Export des données : `GET /api/users/me/export` (format JSON)
- Logs d'accès purgés après 90 jours

---

## 10. Déploiement cloud

### 10.1 NestJS — Vercel (serverless)

```json
// vercel.json
{
  "version": 2,
  "builds": [{ "src": "apps/api/dist/main.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "apps/api/dist/main.js" }],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret",
    "FASTAPI_URL": "@fastapi-url",
    "REDIS_URL": "@redis-url"
  }
}
```

**Limites Vercel Free** : 100 GB bandwidth, 6000 build minutes/mois — largement suffisant V1.

### 10.2 FastAPI — Railway

```dockerfile
# apps/analyzer/Dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install uv && uv sync --frozen

COPY src/ ./src/
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# railway.toml
[build]
builder = "dockerfile"
dockerfilePath = "apps/analyzer/Dockerfile"

[deploy]
healthcheckPath = "/health"
restartPolicyType = "on-failure"
```

**Coût Railway** : ~5€/mois pour 512 MB RAM, 1 vCPU.

### 10.3 Résumé infrastructure V1

| Service | Provider | Coût mensuel |
|---|---|---|
| NestJS API | Vercel (free) | 0€ |
| FastAPI Analyzer | Railway Starter | ~5€ |
| PostgreSQL | Supabase (free, 500 MB) | 0€ |
| Redis | Upstash (free, 10k req/j) | 0€ |
| Chrome Web Store | Google (one-time) | 5$ (une fois) |
| **Total V1** | | **~5€/mois** |

---

## 11. Pipeline CI/CD

### 11.1 GitHub Actions — CI

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint typecheck

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_PASSWORD: test }
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo test

  build:
    needs: [lint-typecheck, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build
      - uses: actions/upload-artifact@v4
        with:
          name: plugin-dist
          path: apps/plugin/dist/
```

### 11.2 GitHub Actions — Deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/api

  deploy-analyzer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: railwayapp/railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: trackshield-analyzer

  publish-plugin:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm turbo build --filter=plugin
      - uses: trmcnvn/chrome-addon@v2
        with:
          extension: ${{ secrets.EXTENSION_ID }}
          zip: apps/plugin/dist.zip
          client-id: ${{ secrets.CHROME_CLIENT_ID }}
          client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
```

### 11.3 Turborepo pipeline

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": { "outputs": [] },
    "typecheck": { "outputs": [] },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## 12. Environnements & variables

### 12.1 Variables d'environnement

```bash
# .env.example

# ── Database ──────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/trackshield

# ── Auth ──────────────────────────────────────
JWT_SECRET=changeme_in_production_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Services ──────────────────────────────────
FASTAPI_URL=http://localhost:8000
FASTAPI_INTERNAL_SECRET=shared_secret_between_services

# ── Redis ─────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Plugin ────────────────────────────────────
VITE_API_URL=https://api.trackshield.app

# ── Misc ──────────────────────────────────────
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGINS=chrome-extension://your_extension_id
```

### 12.2 Environnements

| Env | API URL | DB | Notes |
|---|---|---|---|
| `development` | `localhost:3000` | Docker Compose local | Hot reload |
| `staging` | `staging.api.trackshield.app` | Supabase staging | Branche `develop` |
| `production` | `api.trackshield.app` | Supabase prod | Tag `v*.*.*` |

---

## 13. Roadmap technique V2

### 13.1 Go — Event ingestion haute fréquence

Extractible chirurgicalement depuis NestJS si > 10k utilisateurs actifs :

```
Plugin Chrome
  └── POST /ingest  →  Service Go (Fly.io)
                           └── Redis Queue
                                 └── NestJS (consommateur)
```

### 13.2 Modèle ML — Classification trackers

Remplacement de `RulesTrackerClassifier` par `MlTrackerClassifier` dans FastAPI sans changer l'API :

```python
# Même ABC, implémentation sklearn
class MlTrackerClassifier(TrackerClassifierABC):
    def __init__(self):
        self.model = joblib.load('models/tracker_classifier_v1.pkl')

    def classify(self, domain: str) -> TrackerCategory:
        features = self._extract_features(domain)
        return TrackerCategory(self.model.predict([features])[0])
```

### 13.3 Dashboard web

Application Next.js séparée consommant l'API NestJS existante. Aucune modification backend nécessaire.

### 13.4 Support multi-navigateurs

Firefox et Edge utilisent WebExtensions API compatible MV3. Migration : changement de `manifest.json` uniquement pour les permissions.

### 13.5 Application desktop compagnon (proxy local)

Service Python embarquant mitmproxy pour intercepter les corps de réponses HTTPS et les flux WebSocket — fonctionnalités impossibles avec le plugin seul.
