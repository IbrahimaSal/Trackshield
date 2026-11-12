---
id: FREE-003
titre: Dépôt — README public, captures d'écran et licence
module: Documentation
checklist: —
priorité: P1
statut: À faire
auteur: Plan d'action freelance (dc/PLAN_ACTION_PROJETS.md)
---

## Objectif

Rendre le dépôt lisible en trois minutes par un lead technique qui ne connaît pas le projet.
Aujourd'hui il n'y a aucun `README.md` à la racine et aucune licence.

## Contexte

Le lecteur cible est un décideur technique qui évalue une candidature freelance. Il ne lira pas
les 170 000 caractères de specs. Il regarde une capture, un schéma, la stack, et une ou deux
décisions d'ingénierie. Le reste sert à prouver que le premier niveau n'est pas du vernis.

## Contenu attendu du README

Dans cet ordre, c'est l'ordre de lecture réel :

1. Une phrase sur ce que fait le produit, sans jargon. Reprendre la formulation des specs
   fonctionnelles : « témoin transparent de la navigation ».
2. Une capture du popup, immédiatement. L'exemple « votre numéro de téléphone vient d'être
   envoyé à Facebook » est plus parlant que n'importe quelle description.
3. Le schéma d'architecture. Celui de `specs/trackshield-docs/SPECS_TECHNIQUES.md` section 1.1
   est déjà en ASCII et peut être repris tel quel.
4. La stack, une ligne par service : extension Manifest V3, API NestJS, analyseur FastAPI, PostgreSQL, Redis.
5. Deux ou trois décisions d'ingénierie avec leur pourquoi **et l'alternative rejetée** :
   le choix d'une architecture distribuée à deux services plutôt qu'un monolithe ou des
   microservices complets ; FastAPI comme seul calculateur du score RGPD ; le typage strict
   bloquant en CI des deux côtés, TypeScript et Python.
6. Comment lancer en local, en commandes copiables qui fonctionnent vraiment.
7. L'état réel du projet : v0 fonctionnelle en local, déploiement cloud cadré mais non réalisé,
   fingerprinting et CNAME-cloaking en cadrage. Un périmètre assumé inspire plus confiance
   qu'un projet présenté comme terminé alors qu'il ne l'est pas.
8. Les chiffres vérifiables : 26 tickets suivis, 17 fichiers de tests, typage strict vérifié en CI.

Le README de `prono/` (« Mon Petit Prono »), avec sa section « Limites connues », est le modèle
de ton à reprendre.

## Actions

- [ ] Écrire `README.md` à la racine selon le plan ci-dessus
- [ ] Produire 3 captures : vue Flux avec des trackers nommés, vue Alertes, vue Rapport avec le score RGPD
- [ ] Les stocker dans `docs/screenshots/` et les référencer en chemins relatifs
- [ ] Ajouter une licence (MIT) et l'en-tête correspondant
- [ ] Vérifier qu'aucune capture ne contient de donnée personnelle réelle : utiliser un compte de test
      et masquer les valeurs comme le fait déjà le produit
- [ ] Basculer le dépôt en public

## Critères d'acceptation

- [ ] Le README affiche une capture dans les 30 premières lignes
- [ ] Un lecteur qui ne connaît pas le projet sait en trois minutes ce que fait le produit, avec quoi
      c'est construit, et ce qui n'est pas terminé
- [ ] Les commandes de lancement local ont été rejouées depuis un clone neuf
- [ ] Aucune donnée personnelle réelle dans les captures
- [ ] Le dépôt est public et la licence est présente

## Dépend de

[FREE-002](FREE-002.md) — les captures doivent montrer les trackers nommés de TS-026, sinon elles
illustrent l'état d'avant la v0.
