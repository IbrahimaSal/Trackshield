# Trackshield — Checklist de mise en production

> Document de référence à utiliser quand le déploiement devient prioritaire.
> Les fichiers de configuration (deploy.yml, Dockerfile, docker-compose.yml) existent déjà.
> Ce qui reste à faire : provisionner les services et configurer les secrets.

---

## 1. Hébergement — Provisionner les services

### NestJS API → Vercel

- [ ] Créer un compte / projet sur [vercel.com](https://vercel.com)
- [ ] Importer le repo GitHub, sélectionner `apps/api` comme racine
- [ ] Récupérer les identifiants du projet :
  - `VERCEL_TOKEN` → Account Settings → Tokens
  - `VERCEL_ORG_ID` → Team Settings → General → Team ID
  - `VERCEL_PROJECT_ID` → Project Settings → General → Project ID

### FastAPI Analyzer → Railway

- [ ] Créer un compte / service sur [railway.app](https://railway.app)
- [ ] Créer un service depuis le Dockerfile `apps/analyzer/Dockerfile`
- [ ] Nommer le service `trackshield-analyzer` (référencé dans `deploy.yml`)
- [ ] Récupérer : `RAILWAY_TOKEN` → Account Settings → Tokens

### Base de données → Supabase PostgreSQL

- [ ] Créer un projet sur [supabase.com](https://supabase.com)
- [ ] Copier la `DATABASE_URL` (mode "Transaction pooler" pour Vercel serverless)
- [ ] Appliquer les migrations Flyway : `pnpm db:migrate`

### Cache → Upstash Redis

- [ ] Créer une base sur [upstash.com](https://upstash.com)
- [ ] Copier la `REDIS_URL` (TLS)

---

## 2. Variables d'environnement — Production

### Vercel (NestJS API)

Configurer dans Project Settings → Environment Variables :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL Supabase (Transaction pooler) |
| `REDIS_URL` | URL Upstash (TLS) |
| `JWT_SECRET` | Générer : `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | Générer : `openssl rand -base64 64` |
| `ANALYZER_URL` | URL Railway du service Analyzer |
| `ANALYZER_HMAC_SECRET` | Générer : `openssl rand -base64 32` |
| `NODE_ENV` | `production` |

### Railway (FastAPI Analyzer)

Configurer dans le service Railway → Variables :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL Supabase (si l'analyzer en a besoin) |
| `ANALYZER_HMAC_SECRET` | Même valeur que côté NestJS |

---

## 3. GitHub Secrets — Pipeline CI/CD

Configurer dans GitHub → Settings → Secrets and variables → Actions :

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Token Vercel |
| `VERCEL_ORG_ID` | ID de l'organisation Vercel |
| `VERCEL_PROJECT_ID` | ID du projet API sur Vercel |
| `RAILWAY_TOKEN` | Token Railway |

---

## 4. Vérifications avant premier déploiement

- [ ] `pnpm typecheck` → 0 erreur
- [ ] `pnpm test` → tous les tests verts
- [ ] Migrations Flyway appliquées sur la base de prod
- [ ] Variables d'environnement configurées sur Vercel et Railway
- [ ] Secrets GitHub configurés
- [ ] Push sur `main` → vérifier que le workflow "CI" passe, puis "Deploy" se déclenche

---

## 5. Fichiers déjà prêts (ne pas toucher)

| Fichier | Rôle |
|---|---|
| `.github/workflows/ci.yml` | Pipeline CI (typecheck + lint + tests) |
| `.github/workflows/deploy.yml` | Pipeline CD (Vercel + Railway, déclenché après CI vert) |
| `apps/analyzer/Dockerfile` | Image Docker du FastAPI Analyzer |
| `docker-compose.yml` | PostgreSQL + Redis pour le dev local |
| `.env.example` | Template des variables d'environnement |
| `flyway/sql/V1__init_schema.sql` | Migration initiale de la base |
