---
id: FREE-001
titre: Dépôt — sauver les 5 commits orphelins et créer le remote GitHub
module: Dépôt / Git
checklist: —
priorité: P0 — CRITIQUE
statut: Fait
auteur: Plan d'action freelance (dc/PLAN_ACTION_PROJETS.md)
---

## Objectif

Mettre le travail de Trackshield à l'abri. Aujourd'hui le projet n'existe que dans ce répertoire,
et cinq commits ne sont retenus que par un `HEAD` détaché.

## Constat (audit du 11 novembre 2026)

Le dépôt est en `HEAD` détaché depuis le 10 avril 2026. Cinq commits ne sont dans aucune branche :

```
29e646e feat(plugin): filtrer les PIIs non intelligibles dans FluxView
f5a9cb0 feat(plugin): détecter les PII transmises depuis localStorage et cookies first-party
f1c3bb3 chore(tickets): marquer TS-014/016/023 Fait, créer BUG-002 auth controller
7294fb5 wip
a4a6d79 fix(plugin): restaurer détection PII complète et corriger les régressions runtime
```

- `main` est resté sur `2328ccf` (3 avril 2026), qui est un **ancêtre** de `HEAD` : rien à fusionner, rien à arbitrer.
- 11 fichiers ne sont pas commités, dont le début de TS-022 (`apps/plugin/src/background/known-cookies.ts`,
  `apps/plugin/tests/cookie-detector.test.ts`) et les tickets TS-025 et TS-026.
- `git remote -v` ne renvoie rien : aucune copie hors de ce Mac.

## Risque

Tant que `HEAD` pointe sur `29e646e`, les commits sont atteignables. Au premier `git checkout main`
ils deviennent inatteignables, et un `git gc` peut les supprimer définitivement : ils ont plus de
sept mois, donc au-delà du délai d'expiration du reflog pour les objets non atteignables.

## Actions

```bash
cd /Users/ibrahimasall/projects/Trackshield

# 1. Constater l'état avant de toucher à quoi que ce soit
git status
git log --oneline -6

# 2. Faire rattraper main sur HEAD. Le répertoire de travail n'est pas modifié
#    (HEAD ne bouge pas de commit), les 11 fichiers en cours sont conservés.
git checkout -B main

# 3. Contrôler
git log --oneline -6          # les 5 commits sont dans main
git status                    # les 11 fichiers sont toujours là

# 4. Commiter le travail en cours, ou le ranger si TS-022 n'est pas prêt
git stash -u                  # option de repli

# 5. Créer le dépôt distant (privé dans un premier temps) et pousser
#    gh repo create IbrahimaSal/trackshield --private --source=. --remote=origin
git remote add origin https://github.com/IbrahimaSal/trackshield.git
git push -u origin main
```

## Critères d'acceptation

- [x] `git branch --show-current` renvoie `main`, plus de `HEAD` détaché
- [x] `git log --oneline main` contient les 5 commits, du plus ancien `18315c9` au plus récent `b2617f1`
- [x] Les 11 fichiers en cours sont commités, en 3 commits thématiques
- [x] `git remote -v` renvoie un remote `origin` sur GitHub
- [x] `git push` passe et le dépôt est visible sur github.com/IbrahimaSal/Trackshield
- [x] `.gitignore` couvre toujours `.env` et `.env.local` (vérifié : seul `.env.example` est suivi)

## Dépend de

Aucune dépendance. C'est le premier ticket à traiter, avant tout développement.

## Réalisé le 12 novembre 2026

Dépôt public : <https://github.com/IbrahimaSal/Trackshield>, branche par défaut `main`,
28 commits publiés, `develop` poussée également.

Déroulé :

1. `git checkout -B main` : `main` rattrape `HEAD`, les 5 commits orphelins sont dans une branche.
2. Les 11 fichiers en cours sont commités en 3 commits : détection des cookies tiers (TS-022),
   affichage du label et de la description dans FluxView, tickets du jalon v0.
3. `.claude/` est retiré de l'ensemble de l'historique (`git filter-branch --index-filter`,
   5 commits devenus vides élagués) puis ajouté au `.gitignore` avec `CLAUDE.md` : ce sont des
   outils de travail locaux, hors périmètre d'un dépôt public. Le répertoire reste sur le disque.
4. Le commit initial généré par GitHub (`3c91a23`, README de 2 lignes et `.gitignore` Python) est
   fusionné plutôt qu'écrasé, en conservant le `.gitignore` du projet. Le push est donc en
   fast-forward, sans `--force`.

Contrôles avant publication : aucun `.env` dans l'historique (seul `.env.example`, avec des
valeurs `change-me-in-production`), aucun token ni clé privée, les seules données personnelles
sont des fixtures de test (`john.doe@gmail.com`, `0612345678`). `pnpm turbo typecheck` passe sur
6 packages, `pnpm turbo test` sur 203 tests (plugin 132, API 62, tracker-lists 9).

**La réécriture d'historique a changé tous les hachages.** Les SHA cités plus haut dans ce ticket
sont ceux d'avant la purge. Correspondance pour les 5 commits sauvés :

| Avant | Après |
|---|---|
| `a4a6d79` | `18315c9` |
| `7294fb5` | `23b9155` |
| `f1c3bb3` | `7556098` |
| `f5a9cb0` | `b2b528e` |
| `29e646e` | `b2617f1` |

Reste de FREE-003 à traiter en priorité, le dépôt étant public sans README ni licence.
