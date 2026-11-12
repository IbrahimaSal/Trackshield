---
id: FREE-002
titre: Jalon v0 — clôturer les 4 tickets restants et figer un périmètre démontrable
module: Transverse
checklist: —
priorité: P0
statut: À faire
auteur: Plan d'action freelance (dc/PLAN_ACTION_PROJETS.md)
---

## Objectif

Figer une v0 démontrable : une extension installable en mode développeur qui, sur un site réel,
affiche des trackers **nommés en clair**, les données personnelles détectées **avec leur explication**,
et un score RGPD. L'API NestJS et l'analyseur FastAPI tournent en local via `docker compose`.

Ce ticket ne porte pas de code : il regroupe et ordonne les tickets existants. Chacun garde son
propre fichier et ses propres critères d'acceptation.

## Hors périmètre v0

- Le déploiement cloud (Vercel, Railway, Supabase, Upstash). `DEPLOIEMENT.md` existe déjà et
  documente la démarche : provisionner les services ne prouve rien de plus et coûte une demi-journée.
- TS-021 (fingerprinting) et TS-024 (trackers CNAME-cloakés), qui restent en cadrage. Les laisser
  visibles dans l'INDEX est un atout : ils montrent que le sujet est maîtrisé plus loin que ce qui est livré.

## Ordre de traitement

| # | Ticket | Pourquoi dans cet ordre | Effort |
|---|---|---|---|
| 1 | [TS-022](TS-022.md) | Produit la base `KNOWN_COOKIES` avec propriétaire et catégorie, dont TS-026 a besoin pour nommer les trackers. Déjà commencé dans le répertoire de travail (`known-cookies.ts`, `cookie-detector.test.ts`) | 3 h |
| 2 | [TS-026](TS-026.md) | P0 critique : c'est la proposition de valeur du produit. Tant que l'écran affiche `doubleclick.net`, la démonstration ne prouve rien | 6 h |
| 3 | [TS-025](TS-025.md) | Essentiellement de la rédaction : les champs `label` et `description` existent déjà dans `PiiDetection` | 2 h |
| 4 | [BUG-002](BUG-002.md) | Sans controller d'authentification, le contrat inter-services est cassé et la synchronisation cloud est inopérante | 1 h |
| 5 | Clôture | `/check` complet, tests verts, typecheck, commits propres, `INDEX.md` à jour | 2 h |

Total : 14 heures. Cible : semaines 48 et 49 (du 23 novembre au 6 décembre 2026).

## Critères d'acceptation du jalon

- [ ] TS-022, TS-026, TS-025 et BUG-002 sont au statut `Fait` dans `INDEX.md`
- [ ] `pnpm turbo typecheck` et `pnpm turbo test` passent sur l'ensemble du monorepo
- [ ] `mypy apps/analyzer/src` passe en mode strict
- [ ] L'extension se charge en mode développeur et, sur un site d'actualité grand public, affiche :
      au moins un tracker avec un nom commercial, une catégorie et une description lisible ;
      au moins une détection PII avec son label et sa phrase d'impact ; un score RGPD
- [ ] Trois captures d'écran sont produites pour le README (voir FREE-003)
- [ ] Le `README.md` indique l'état réel : ce qui marche, ce qui n'est pas fait, les limites connues

## Dépend de

[FREE-001](FREE-001.md) — le dépôt doit d'abord être sauvé et poussé.
