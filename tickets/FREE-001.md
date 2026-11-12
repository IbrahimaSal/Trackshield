---
id: FREE-001
titre: Dépôt — sauver les 5 commits orphelins et créer le remote GitHub
module: Dépôt / Git
checklist: —
priorité: P0 — CRITIQUE
statut: À faire
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

- [ ] `git branch --show-current` renvoie `main`, plus de `HEAD` détaché
- [ ] `git log --oneline main` contient les 5 commits, du plus ancien `a4a6d79` au plus récent `29e646e`
- [ ] Les 11 fichiers en cours sont soit commités, soit rangés dans un stash nommé, soit supprimés sciemment
- [ ] `git remote -v` renvoie un remote `origin` sur GitHub
- [ ] `git push` passe et le dépôt est visible sur github.com/IbrahimaSal
- [ ] `.gitignore` couvre toujours `.env` et `.env.local` (vérifié : seul `.env.example` est suivi)

## Dépend de

Aucune dépendance. C'est le premier ticket à traiter, avant tout développement.
