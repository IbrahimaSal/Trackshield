# Tickets Trackshield

> Dernière mise à jour par `/progress` — 2026-04-06
> Score global : **66/66 (100%)** — checklist de base complète

| ID | Titre | Module | Checklist | Priorité | Statut |
|---|---|---|---|---|---|
| [TS-020](TS-020.md) | Plugin — Détection via localStorage et cookies first-party | Plugin / Background | — | P1 | À faire |
| [TS-022](TS-022.md) | Plugin — Détection cookies tiers dans headers réseau | Plugin / Background | — | P1 | À faire |
| [TS-021](TS-021.md) | Cadrage — Détection de fingerprinting navigateur | Plugin / Background | — | P2 | Cadrage requis |
| [TS-001](TS-001.md) | API NestJS — PrismaService (connexion PostgreSQL) | API NestJS | 8.6 | P0 | Fait |
| [TS-004](TS-004.md) | API NestJS — Module Events + câblage AppModule | API NestJS | 8.4, 8.1 | P0 | Fait |
| [TS-007](TS-007.md) | Plugin — Vue Trackers Live (LiveFeed) | Plugin / Vues | 3.2 | P0 | Fait |
| [TS-008](TS-008.md) | Plugin — Vue Carte des Flux (FluxView) | Plugin / Vues | 3.3 | P0 | Fait |
| [TS-012](TS-012.md) | tracker-lists — Compilation EasyList / Disconnect / EasyPrivacy | tracker-lists | 11.2, 11.3, 11.4, 11.5 | P0 | Fait |
| [TS-014](TS-014.md) | Plugin — Compléter les tests du détecteur PII (≥5 cas) | Plugin / Tests | 7.1 | P0 | Fait |
| [TS-015](TS-015.md) | API NestJS — Tests HTTP controllers (Supertest + SWC) | API NestJS | — | P0 | Fait |
| [TS-017](TS-017.md) | Plugin — Base de connaissance paramètres URL trackers connus | Plugin / Background | — | P0 | Fait |
| [TS-018](TS-018.md) | Plugin — Détection certaine via formulaires (content script) | Plugin / Content Script | — | P0 | Fait |
| [TS-002](TS-002.md) | API NestJS — Module Auth (JWT) | API NestJS | 8.2 | P1 | Fait |
| [TS-003](TS-003.md) | API NestJS — Module Users (inscription / profil) | API NestJS | 8.3 | P1 | Fait |
| [TS-005](TS-005.md) | API NestJS — Module Sync (accès historique cloud) | API NestJS | 8.5 | P1 | Fait |
| [TS-006](TS-006.md) | Analyzer FastAPI — Route rapport d'audit (HTML) | Analyzer FastAPI | 9.4 | P1 | Fait |
| [TS-009](TS-009.md) | Plugin — Vue Alertes (AlertsView) | Plugin / Vues | 3.4 | P1 | Fait |
| [TS-010](TS-010.md) | Plugin — Vue Rapport d'audit (ReportView) | Plugin / Vues | 3.5 | P1 | Fait |
| [TS-011](TS-011.md) | Plugin — Vue Paramètres (SettingsView) | Plugin / Vues | 3.6 | P1 | Fait |
| [TS-016](TS-016.md) | Plugin — Dédupliquer les détections PII dans le popup | Plugin / Vues + Stores | — | P1 | Fait |
| [TS-019](TS-019.md) | Plugin — Affinage regex PII (réduire faux positifs) | Plugin / Background | — | P1 | Fait |
| [TS-023](TS-023.md) | Plugin — Conformité visuelle popup aux specs design | Plugin / Vues | — | P1 | Fait |
| [TS-013](TS-013.md) | CI/CD — Pipeline de déploiement automatique | Infrastructure & CI/CD | 12.3 | P2 | Fait |

## Bugs détectés

| ID | Description | Anomalie | Priorité | Statut | Détecté le |
|---|---|---|---|---|---|
| [BUG-001](BUG-001.md) | shared-types — PiiDetection manque certainty/source/label/description | CHECK 2 — typecheck plugin | P1 | Corrigé | 2026-04-03 |
| [BUG-002](BUG-002.md) | API — Auth controller manquant (pas de POST /auth/login) | C1 — Route /auth/login absente | P1 | À corriger | 2026-04-03 |
