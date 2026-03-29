# Trackshield — Arborescence du monorepo

**Version** : 1.0  
**Stack** : pnpm workspaces · Turborepo · TypeScript · Python  
**Architecture** : Modulaire distribuée · Clean Architecture · Hexagonale · DDD tactique  

---

## Vue d'ensemble

```
trackshield/                          # Monorepo racine
├── apps/
│   ├── plugin/                       # Extension Chrome (TypeScript · React · Vite · MV3)
│   ├── api/                          # NestJS — API métier (Clean Arch · Hexagonale · DDD)
│   └── analyzer/                     # FastAPI — Moteur d'analyse (Python · ABC)
├── packages/
│   ├── shared-types/                 # Types TypeScript partagés plugin ↔ NestJS
│   └── tracker-lists/                # Bases EasyList / Disconnect compilées + matcher
└── [config files]                    # Turborepo · pnpm · Docker · CI/CD
```

---

## Arborescence complète

```
trackshield/
│
├── package.json                          # Root package — pnpm workspaces
├── pnpm-workspace.yaml                   # Déclaration des workspaces
├── pnpm-lock.yaml
├── turbo.json                            # Pipeline Turborepo (build/test/lint)
├── .env.example                          # Variables d'environnement template
├── .env.local                            # Variables locales (gitignored)
├── .gitignore
├── .nvmrc                                # Node version (LTS)
├── docker-compose.yml                    # Dev local : PostgreSQL 15 + Redis 7
├── README.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml                        # Lint + typecheck + test sur chaque PR
│       └── deploy.yml                    # Deploy Vercel + Railway + Chrome Store
│
│
├── packages/                             # Code partagé entre apps
│   │
│   ├── shared-types/                     # Types TypeScript partagés
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Barrel export
│   │       ├── domain/
│   │       │   ├── tracker.types.ts      # TrackerCategory, TrackerMatch
│   │       │   ├── pii.types.ts          # PiiType, PiiDetection
│   │       │   ├── session.types.ts      # Session, SessionStatus
│   │       │   └── rgpd-score.types.ts   # RgpdGrade (A|B|C|D|F)
│   │       └── api/
│   │           ├── events.dto.ts         # Plugin → NestJS: EventBatchDto
│   │           └── responses.dto.ts      # NestJS → Plugin: réponses typées
│   │
│   └── tracker-lists/                    # Bases de trackers compilées
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── matcher.ts               # Algorithme matching (Trie)
│       │   └── types.ts
│       ├── data/
│       │   ├── easylist.json            # Generé par scripts/compile-lists.ts
│       │   ├── disconnect.json
│       │   └── easyprivacy.json
│       └── scripts/
│           └── compile-lists.ts         # Compile les listes brutes → JSON optimisé
│
│
├── apps/
│   │
│   │
│   ├── plugin/                          # Extension Chrome — Manifest V3
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts               # vite-plugin-web-extension
│   │   ├── vitest.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── manifest.json                # MV3 : permissions, SW, popup, content script
│   │   │
│   │   ├── public/
│   │   │   └── icons/
│   │   │       ├── shield-16.png
│   │   │       ├── shield-48.png
│   │   │       └── shield-128.png
│   │   │
│   │   └── src/
│   │       │
│   │       ├── background/              # Service Worker MV3
│   │       │   ├── index.ts             # Point d'entrée SW — listeners Chrome
│   │       │   ├── request-interceptor.ts  # webRequest.onBeforeRequest
│   │       │   ├── pii-detector.ts      # Regex locales (email, tél, IP...)
│   │       │   ├── tracker-matcher.ts   # Utilise packages/tracker-lists
│   │       │   ├── badge-manager.ts     # chrome.action.setBadgeText/Color
│   │       │   ├── notification-manager.ts  # chrome.notifications API
│   │       │   ├── sync-client.ts       # POST vers NestJS si opt-in (batch 5s)
│   │       │   └── lists-updater.ts     # MAJ bases toutes les 24h
│   │       │
│   │       ├── content/                 # Content Script
│   │       │   └── form-observer.ts     # MutationObserver sur inputs PII
│   │       │
│   │       ├── popup/                   # Interface React (340px)
│   │       │   ├── popup.html
│   │       │   ├── main.tsx             # ReactDOM.render
│   │       │   ├── App.tsx              # Router entre vues popup
│   │       │   │
│   │       │   ├── components/
│   │       │   │   ├── ScoreRing.tsx    # Anneau SVG animé + grade A–F
│   │       │   │   ├── TrackerList.tsx  # Liste trackers avec catégorie + badge
│   │       │   │   ├── PiiAlert.tsx     # Encart rouge données transmises
│   │       │   │   ├── FluxMap.tsx      # Carte source → destinations
│   │       │   │   ├── BadgeStates.tsx  # 3 états (vert/orange/rouge)
│   │       │   │   └── SyncToggle.tsx   # Activation sync cloud
│   │       │   │
│   │       │   ├── views/
│   │       │   │   ├── PopupMain.tsx    # Vue principale (score + PII + trackers)
│   │       │   │   ├── LiveFeed.tsx     # Feed chronologique temps réel
│   │       │   │   ├── FluxView.tsx     # Carte des flux détaillée
│   │       │   │   ├── AlertsView.tsx   # Historique alertes
│   │       │   │   ├── ReportView.tsx   # Résumé rapport
│   │       │   │   └── SettingsView.tsx # Paramètres + consentement
│   │       │   │
│   │       │   └── hooks/
│   │       │       ├── useSession.ts    # Données session courante depuis SW
│   │       │       ├── useAlerts.ts     # Alertes non lues
│   │       │       └── useSync.ts       # État sync cloud
│   │       │
│   │       └── storage/
│   │           ├── local-store.ts       # Abstraction chrome.storage.local
│   │           └── schemas.ts           # Zod schemas pour storage
│   │
│   │   tests/
│   │       ├── pii-detector.test.ts
│   │       ├── tracker-matcher.test.ts
│   │       └── badge-manager.test.ts
│   │
│   │
│   ├── api/                             # NestJS — API métier
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   ├── vitest.config.ts
│   │   ├── nest-cli.json
│   │   ├── vercel.json                  # Config déploiement Vercel
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma            # Schéma DB (source client TS — ne pilote pas les migrations)
│   │   │   └── seed.ts                  # Données de test / dev
│   │   │
│   │   ├── flyway/                      # Migrations SQL versionnées (source de vérité DB)
│   │   │   ├── flyway.conf              # Config Flyway (url, locations, schemas)
│   │   │   └── sql/
│   │   │       ├── V1__init_schema.sql  # Création initiale
│   │   │       └── V2__...sql           # Migrations suivantes
│   │   │
│   │   └── src/
│   │       ├── main.ts                  # Bootstrap NestJS
│   │       ├── app.module.ts            # Module racine
│   │       │
│   │       ├── modules/
│   │       │   │
│   │       │   ├── auth/
│   │       │   │   ├── domain/
│   │       │   │   │   ├── auth.entity.ts
│   │       │   │   │   └── auth.repository.ts      # Port
│   │       │   │   ├── application/
│   │       │   │   │   └── use-cases/
│   │       │   │   │       ├── login.usecase.ts
│   │       │   │   │       ├── register.usecase.ts
│   │       │   │   │       └── refresh-token.usecase.ts
│   │       │   │   ├── infrastructure/
│   │       │   │   │   ├── jwt.strategy.ts
│   │       │   │   │   ├── jwt-refresh.strategy.ts
│   │       │   │   │   ├── jwt-auth.guard.ts
│   │       │   │   │   ├── prisma-auth.repository.ts  # Adapter
│   │       │   │   │   └── auth.controller.ts
│   │       │   │   └── auth.module.ts
│   │       │   │
│   │       │   ├── users/
│   │       │   │   ├── domain/
│   │       │   │   │   ├── user.entity.ts
│   │       │   │   │   ├── user-preference.value-object.ts
│   │       │   │   │   └── user.repository.ts       # Port
│   │       │   │   ├── application/
│   │       │   │   │   └── use-cases/
│   │       │   │   │       ├── update-preferences.usecase.ts
│   │       │   │   │       ├── give-sync-consent.usecase.ts
│   │       │   │   │       └── delete-user-data.usecase.ts  # RGPD
│   │       │   │   ├── infrastructure/
│   │       │   │   │   ├── prisma-user.repository.ts
│   │       │   │   │   └── users.controller.ts
│   │       │   │   └── users.module.ts
│   │       │   │
│   │       │   ├── sessions/
│   │       │   │   ├── domain/
│   │       │   │   │   ├── session.entity.ts
│   │       │   │   │   ├── session.repository.ts    # Port
│   │       │   │   │   └── events/
│   │       │   │   │       └── session-scored.event.ts
│   │       │   │   ├── application/
│   │       │   │   │   └── use-cases/
│   │       │   │   │       ├── create-session.usecase.ts
│   │       │   │   │       ├── score-session.usecase.ts
│   │       │   │   │       └── get-session-history.usecase.ts
│   │       │   │   ├── infrastructure/
│   │       │   │   │   ├── prisma-session.repository.ts
│   │       │   │   │   └── sessions.controller.ts
│   │       │   │   └── sessions.module.ts
│   │       │   │
│   │       │   ├── trackers/
│   │       │   │   ├── domain/
│   │       │   │   │   ├── tracker.entity.ts
│   │       │   │   │   ├── tracker-category.value-object.ts
│   │       │   │   │   ├── tracker.repository.ts    # Port
│   │       │   │   │   └── events/
│   │       │   │   │       └── tracker-detected.event.ts
│   │       │   │   ├── application/
│   │       │   │   │   └── use-cases/
│   │       │   │   │       ├── detect-trackers.usecase.ts
│   │       │   │   │       └── get-session-trackers.usecase.ts
│   │       │   │   ├── infrastructure/
│   │       │   │   │   ├── prisma-tracker.repository.ts  # Adapter Prisma
│   │       │   │   │   ├── fastapi-analyzer.adapter.ts   # Adapter FastAPI
│   │       │   │   │   └── trackers.controller.ts
│   │       │   │   └── trackers.module.ts
│   │       │   │
│   │       │   ├── pii/
│   │       │   │   ├── domain/
│   │       │   │   │   ├── pii-detection.entity.ts
│   │       │   │   │   ├── pii-type.value-object.ts
│   │       │   │   │   ├── masked-value.value-object.ts
│   │       │   │   │   ├── pii.repository.ts        # Port
│   │       │   │   │   └── events/
│   │       │   │   │       └── pii-exposed.event.ts
│   │       │   │   ├── application/
│   │       │   │   │   └── use-cases/
│   │       │   │   │       └── record-pii-detection.usecase.ts
│   │       │   │   ├── infrastructure/
│   │       │   │   │   ├── prisma-pii.repository.ts
│   │       │   │   │   └── pii.controller.ts
│   │       │   │   └── pii.module.ts
│   │       │   │
│   │       │   └── events/                          # Réception batch events plugin
│   │       │       ├── application/
│   │       │       │   └── use-cases/
│   │       │       │       └── process-event-batch.usecase.ts
│   │       │       ├── infrastructure/
│   │       │       │   └── events.controller.ts     # POST /api/events
│   │       │       └── events.module.ts
│   │       │
│   │       └── shared/                              # Code partagé intra-NestJS
│   │           ├── domain/
│   │           │   ├── base.entity.ts               # id, createdAt, updatedAt
│   │           │   └── rgpd-score.value-object.ts   # Calcul A–F
│   │           ├── result.type.ts                   # Result<T, E> pattern
│   │           ├── errors/
│   │           │   ├── domain.error.ts
│   │           │   ├── not-found.error.ts
│   │           │   └── validation.error.ts
│   │           └── infrastructure/
│   │               ├── prisma/
│   │               │   └── prisma.service.ts
│   │               ├── redis/
│   │               │   └── redis.service.ts
│   │               └── http-exception.filter.ts
│   │
│   │   tests/
│   │       ├── unit/                                # Tests use cases + domain
│   │       │   ├── score-session.usecase.spec.ts
│   │       │   ├── rgpd-score.value-object.spec.ts
│   │       │   └── tracker.entity.spec.ts
│   │       └── e2e/                                 # Tests API complète
│   │           ├── auth.e2e-spec.ts
│   │           ├── events.e2e-spec.ts
│   │           └── sessions.e2e-spec.ts
│   │
│   │
│   └── analyzer/                                    # FastAPI — Moteur d'analyse
│       ├── pyproject.toml                           # uv + dépendances Python
│       ├── uv.lock
│       ├── Dockerfile                               # python:3.12-slim
│       ├── railway.toml                             # Config Railway
│       ├── .python-version                          # 3.12
│       │
│       └── src/
│           ├── main.py                              # FastAPI app + routes
│           │
│           ├── domain/                              # Logique pure — aucun framework
│           │   ├── pii_detector.abc.py              # ABC port PII
│           │   ├── tracker_classifier.abc.py        # ABC port trackers
│           │   ├── rgpd_scorer.py                   # Calcul score pur Python
│           │   └── models.py                        # Dataclasses domaine
│           │
│           ├── adapters/                            # Implémentations concrètes
│           │   ├── regex_pii_detector.py            # V1 — regex
│           │   ├── rules_tracker_classifier.py      # V1 — règles
│           │   └── ml_pii_detector.py               # V2 — sklearn (placeholder)
│           │
│           ├── api/
│           │   ├── routes/
│           │   │   ├── analyze.py                   # POST /analyze
│           │   │   ├── score.py                     # POST /score
│           │   │   ├── report.py                    # POST /report (PDF WeasyPrint)
│           │   │   └── health.py                    # GET /health
│           │   ├── schemas.py                       # Pydantic v2 models (I/O)
│           │   └── dependencies.py                  # Injection PiiDetector, Classifier
│           │
│           └── tests/
│               ├── test_regex_pii_detector.py
│               ├── test_rgpd_scorer.py
│               └── test_tracker_classifier.py
```

---

## Fichiers de configuration clés

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build":     { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test":      { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "lint":      { "outputs": [] },
    "typecheck": { "outputs": [] },
    "dev":       { "cache": false, "persistent": true }
  }
}
```

### `docker-compose.yml` (dev local)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: trackshield
      POSTGRES_USER: trackshield
      POSTGRES_PASSWORD: trackshield
    ports:
      - '5432:5432'
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  postgres-data:
```

### `package.json` (racine)

```json
{
  "name": "trackshield",
  "private": true,
  "scripts": {
    "dev":       "turbo dev",
    "build":     "turbo build",
    "test":      "turbo test",
    "lint":      "turbo lint",
    "typecheck": "turbo typecheck",
    "db:migrate": "flyway migrate",
    "db:info":   "flyway info",
    "db:seed":   "pnpm --filter api prisma db seed",
    "db:studio": "pnpm --filter api prisma studio",
    "db:generate": "pnpm --filter api prisma generate",
    "lists:compile": "pnpm --filter tracker-lists compile"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

---

## Convention de nommage

| Type | Convention | Exemple |
|---|---|---|
| Fichiers TypeScript | `kebab-case.ts` | `rgpd-score.value-object.ts` |
| Fichiers Python | `snake_case.py` | `regex_pii_detector.py` |
| Classes TypeScript | `PascalCase` | `RgpdScore`, `TrackerEntity` |
| Classes Python | `PascalCase` | `RegexPiiDetector` |
| Interfaces TypeScript | `IPascalCase` | `ITrackerRepository` |
| ABCs Python | `PascalCaseABC` | `PiiDetectorABC` |
| Variables / fonctions | `camelCase` (TS) / `snake_case` (Py) | `sessionId` / `session_id` |
| Constantes | `SCREAMING_SNAKE_CASE` | `JWT_SECRET`, `MAX_RETRIES` |
| Branches Git | `type/description` | `feat/pii-detection`, `fix/badge-update` |
| Tags Git | `v*.*.*` | `v1.0.0`, `v1.2.3` |

---

## Commandes de démarrage

```bash
# Installation
git clone https://github.com/your-org/trackshield
cd trackshield
pnpm install

# Démarrage infrastructure locale
docker-compose up -d

# Migration DB (Flyway)
pnpm db:migrate

# Générer le client Prisma après migration
pnpm db:generate

# Compilation des bases trackers
pnpm lists:compile

# Développement (tous les services en parallèle)
pnpm dev

# Tests
pnpm test

# Build production
pnpm build
```
