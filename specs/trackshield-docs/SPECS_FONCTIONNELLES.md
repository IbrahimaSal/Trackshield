# Trackshield — Spécifications Fonctionnelles

**Version** : 1.0  
**Date** : Juin 2025  
**Statut** : Draft  
**Cible** : Grand public non-technique  
**Auteur** : Ibrahima SALL  

---

## Table des matières

1. [Contexte et vision](#1-contexte-et-vision)
2. [Périmètre V1](#2-périmètre-v1)
3. [Profil utilisateur](#3-profil-utilisateur)
4. [Fonctionnalités détaillées](#4-fonctionnalités-détaillées)
5. [Sync cloud opt-in](#5-sync-cloud-opt-in)
6. [Interface utilisateur](#6-interface-utilisateur)
7. [User stories](#7-user-stories)
8. [Critères de validation](#8-critères-de-validation)
9. [Glossaire](#9-glossaire)

---

## 1. Contexte et vision

### 1.1 Problème adressé

De nombreux sites web collectent des données personnelles des utilisateurs sans que ceux-ci en soient clairement informés : numéros de téléphone, adresses e-mail, comportements de navigation, identifiants publicitaires — transmis silencieusement à des tiers (Meta, Google, DoubleClick, etc.).

Les outils existants sont soit trop techniques (DevTools, mitmproxy), soit trop limités (Privacy Badger, uBlock) pour répondre à trois besoins fondamentaux :

- Savoir **quelles données** quittent le navigateur
- Savoir **vers qui** elles sont transmises
- Obtenir un **jugement clair** sur la conformité RGPD du site visité

### 1.2 Vision produit

> Trackshield agit comme un **témoin transparent** de la navigation : il observe silencieusement, détecte les collectes de données, et les explique en langage simple à l'utilisateur — sans qu'il ait besoin de compétences techniques.

### 1.3 Proposition de valeur unique

La fonctionnalité clé qui différencie Trackshield : **la cartographie donnée → destinataire**.

Exemple concret : l'utilisateur saisit son numéro de téléphone sur `siteauhasard.com`. Trackshield détecte que ce numéro est transmis à `pixel.facebook.com` et affiche une alerte immédiate : *"Votre numéro de téléphone vient d'être envoyé à Facebook"*.

---

## 2. Périmètre V1

### 2.1 Dans le scope

| Module | Description | Priorité |
|---|---|---|
| Détection trackers | Scripts de tracking connus (Google, Meta, TikTok…) | P0 |
| Analyse cookies | Liste, catégorie, durée de vie | P0 |
| Détection PII | Email, téléphone, nom dans les requêtes sortantes | P0 |
| Cartographie des flux | Donnée → site destinataire avec icône entreprise | P0 |
| Score RGPD | Note A→F calculée automatiquement | P1 |
| Alertes temps réel | Notification lors de collecte sensible | P1 |
| Rapport par site | Résumé exportable PDF ou HTML | P1 |
| Sync cloud opt-in | Sauvegarde chiffrée optionnelle (PostgreSQL) | P1 |
| Historique navigation | Journal 30 jours des sites visités | P2 |

### 2.2 Hors scope V1

- Application desktop compagnon (prévu V2)
- Interception corps de réponses HTTP
- Analyse flux WebSocket
- Support Firefox / Safari
- Dashboard web multi-appareils
- Modèle ML de classification (V2)
- Mode multi-utilisateurs / entreprise

---

## 3. Profil utilisateur

### 3.1 Persona principal

**Prénom** : Marie, 34 ans, chargée de communication  
**Profil** : Utilisatrice non-technique, navigue 6h/jour, soucieuse de sa vie privée sans savoir comment se protéger  
**Besoins** : Comprendre ce qui se passe sans lire du code ou du jargon  
**Frustration actuelle** : Les bannières cookies ne lui disent pas vraiment ce qui est collecté

### 3.2 Persona secondaire

**Prénom** : Thomas, 28 ans, développeur freelance  
**Profil** : Technique, utilise Trackshield pour auditer les sites de ses clients et vérifier leur conformité RGPD  
**Besoins** : Export de rapport structuré, données précises sur les flux

---

## 4. Fonctionnalités détaillées

### 4.1 Détection des trackers

**Description**  
Le plugin analyse chaque requête réseau émise par la page visitée et la compare à des listes de trackers connus.

**Comportement attendu**

1. Lors du chargement de chaque page, le plugin intercepte toutes les requêtes HTTP/S sortantes via l'API `webRequest`
2. Chaque URL est comparée aux bases EasyList, Disconnect.me et EasyPrivacy (embarquées en JSON)
3. Les trackers détectés sont classés par catégorie :
   - **Publicitaire** — ciblage et retargeting
   - **Analytique** — mesure d'audience
   - **Social** — boutons de partage, pixels sociaux
   - **Fingerprinting** — empreinte navigateur
4. Le badge de l'extension affiche le nombre total de trackers sur la page courante
5. Un indicateur coloré synthétise le niveau de risque : vert (0–2), orange (3–9), rouge (10+)

**Critères d'acceptation**

- Le badge se met à jour en moins de 500ms après chargement de page
- La classification distingue au minimum 4 catégories de trackers
- Les bases de trackers sont mises à jour automatiquement toutes les 24h via l'API NestJS
- Recall ≥ 90% sur un corpus de test de 50 sites référence

---

### 4.2 Détection des données personnelles (PII)

**Description**  
Le plugin inspecte les paramètres des requêtes sortantes (URL, headers, corps des formulaires POST) pour y détecter la présence de données personnelles identifiables.

**Types de données détectées**

| Type | Méthode de détection | Exemple affiché |
|---|---|---|
| Adresse e-mail | Regex RFC 5322 | `j••••@gmail.com → google.com` |
| Numéro de téléphone | Regex E.164 + formats FR/EU | `+336••••5678 → facebook.com` |
| Nom / prénom | Heuristique + champs formulaire | `Champ 'firstname' → adtech.io` |
| Adresse IP | Détection dans payloads JSON | `192.168.x.x → analytics.com` |
| Identifiant publicitaire | Patterns GCLID, FBCLID, _fbp… | `_fbp=xxx → facebook.com` |
| Localisation | Paramètres lat/lng, zip | `lat=43.7 → maps.google.com` |

**Format d'affichage**

```
Votre numéro de téléphone a été envoyé à : facebook.com, doubleclick.net
```

**Critères d'acceptation**

- Faux positifs < 5% sur corpus de test de 100 sites
- Les valeurs détectées sont affichées tronquées (`+336••••5678`)
- Chaque détection PII est horodatée et enregistrée dans l'historique local
- Précision ≥ 95% sur jeu de test de 500 requêtes

---

### 4.3 Cartographie des flux de données

**Description**  
Pour chaque site visité, le plugin construit une carte lisible des flux : quelle donnée a été envoyée, à quel moment, vers quel domaine tiers — avec identification de l'entreprise derrière le domaine.

**Comportement attendu**

1. Agrégation de toutes les requêtes contenant PII ou paramètres de tracking
2. Regroupement par domaine destinataire
3. Enrichissement avec métadonnées : nom de l'entreprise, pays du serveur, catégorie RGPD
4. Affichage du flux source → destinations avec tags colorés par type de donnée

**Maquette conceptuelle**

| Donnée collectée | Tag | Envoyée à | Entreprise | Pays |
|---|---|---|---|---|
| `+336••••5678` | `TEL` | pixel.facebook.com | Meta Inc. | USA |
| `j••••@gmail.com` | `EMAIL` | doubleclick.net | Google | USA |
| Comportement nav. | `COMPORTEMENT` | analytics.google.com | Google | USA |
| ID publicitaire | `ID_PUB` | ct.pinterest.com | Pinterest | USA |

---

### 4.4 Score de conformité RGPD

**Description**  
Chaque site visité reçoit un score RGPD calculé automatiquement, exprimé en lettre (A à F).

**Critères de calcul**

| Critère | Description | Poids |
|---|---|---|
| Trackers tiers | Nombre et catégorie | 30% |
| PII exposées | Données personnelles envoyées | 35% |
| Cookies | Durée de vie et catégorie | 20% |
| Destinations | Pays des serveurs (UE vs. hors UE) | 15% |

**Grille de notation**

| Note | Score | Signification | Couleur |
|---|---|---|---|
| A | ≥ 90 | Aucune collecte problématique | Vert `#1FCC7A` |
| B | ≥ 75 | Collectes mineures et conformes | Vert clair |
| C | ≥ 55 | Quelques points à surveiller | Orange `#FFB020` |
| D | ≥ 35 | Collectes significatives | Rouge `#FF3B5C` |
| F | < 35 | Collectes massives ou non conformes | Rouge foncé |

---

### 4.5 Alertes en temps réel

**Déclencheurs**

- Détection d'un numéro de téléphone ou email dans une requête sortante → alerte **critique** (rouge)
- Envoi de données vers un pays hors Union Européenne → alerte **avertissement** (orange)
- Détection d'un tracker de fingerprinting → alerte **info** (rose)
- Score RGPD inférieur à D → alerte **critique** (rouge)

**Format de l'alerte**

- Titre court : *"Votre email vient d'être partagé"*
- Corps : *"Envoyé à facebook.com — cliquez pour en savoir plus"*
- Actions : "Voir le détail" / "Ignorer"
- Disparition automatique après 6 secondes si aucune action
- Paramétrable par catégorie dans les paramètres

---

### 4.6 Rapport d'audit par site

**Contenu du rapport**

1. En-tête : URL, date, score RGPD obtenu, 4 KPIs (trackers, PII, entreprises, % hors UE)
2. Tableau des données personnelles exposées (type, valeur masquée, destinataire, pays)
3. Tableau des trackers détectés (nom, catégorie, nombre de requêtes)
4. Résumé en langage naturel généré automatiquement par FastAPI
5. Recommandations contextuelles (3 niveaux : action immédiate, conseil, info)

**Exemple de résumé automatique**

> *Lors de votre visite sur siteauhasard.com, votre numéro de téléphone et votre email ont été transmis à 3 entreprises situées aux États-Unis : Facebook, Google et DoubleClick. 14 trackers publicitaires ont été détectés. Score RGPD : D.*

**Formats d'export** : PDF (WeasyPrint via FastAPI) · HTML autonome

---

## 5. Sync cloud opt-in

### 5.1 Principe

Par défaut, **toutes les données restent locales** dans `chrome.storage.local`. L'utilisateur peut activer la synchronisation cloud dans les paramètres, avec un consentement explicite.

### 5.2 Flux de consentement

1. L'utilisateur ouvre les paramètres → section "Sync cloud"
2. Il active le toggle "Synchronisation"
3. Une modale affiche clairement : quelles données sont synchronisées, où elles sont stockées (PostgreSQL · Supabase · EU), comment les supprimer
4. L'utilisateur confirme → sync activée
5. Un lien "Supprimer mes données" est toujours accessible

### 5.3 Données synchronisées (si opt-in)

- Historique des sessions (site, score, timestamp)
- Détections PII anonymisées (type + domaine, jamais la valeur brute)
- Préférences et paramètres
- **Jamais** : valeurs PII en clair, mots de passe, données bancaires

---

## 6. Interface utilisateur

### 6.1 Design system

- **Palette** : blaugrana — bleu marine `#004D98` + bordeaux `#A50044`
- **Sémantique** : rouge `#FF3B5C` (alertes uniquement), vert `#1FCC7A` (OK), orange `#FFB020` (attention)
- **Typographie** : DM Sans (UI) + DM Mono (données techniques)
- **Thème** : dark mode uniquement

### 6.2 Écrans

| # | Écran | Accès |
|---|---|---|
| 01 | Badge + Popup principal | Clic sur l'icône dans Chrome |
| 02 | Trackers live | Menu latéral |
| 03 | Carte des flux | Menu latéral |
| 04 | Alertes | Menu latéral |
| 05 | Rapport d'audit | Menu latéral |
| 06 | Paramètres | Menu latéral |

### 6.3 Principes UX

- Langage simple, sans jargon technique
- Chaque terme technique est accompagné d'une infobulle explicative
- Le popup s'ouvre en moins de 200ms
- Toutes les valeurs PII sont masquées dans l'affichage
- Le score RGPD est toujours visible dans le badge sans ouvrir le popup

### 6.4 Accessibilité

- Contraste minimum AA (WCAG 2.1)
- Navigation clavier complète dans le popup
- Labels ARIA sur tous les éléments interactifs

---

## 7. User stories

### US-01 — Utilisateur grand public
> En tant qu'utilisateur, je veux voir en un coup d'œil si le site que je visite collecte mes données, afin de décider si je continue ma navigation.

**Critères d'acceptation**
- Le badge affiche un score coloré sans que j'ouvre le popup
- Le popup s'affiche en moins de 200ms au clic
- Le score est exprimé en lettre (A–F) avec une phrase explicative

---

### US-02 — Alerte PII
> En tant qu'utilisateur, je veux être alerté immédiatement si mon numéro de téléphone ou mon email est envoyé à un tiers, afin de savoir si mes données personnelles sont partagées à mon insu.

**Critères d'acceptation**
- L'alerte apparaît dans les 2 secondes après la détection
- Elle indique clairement quel type de donnée et quel destinataire
- Je peux accéder au détail complet en un clic

---

### US-03 — Rapport d'audit
> En tant qu'utilisateur, je veux pouvoir générer un rapport simple sur un site, afin de le partager ou le conserver comme preuve.

**Critères d'acceptation**
- Le rapport est généré en moins de 5 secondes
- Il est téléchargeable en PDF ou HTML
- Il contient un résumé en langage naturel compréhensible sans formation

---

### US-04 — Cas d'usage clé : détection PII de bout en bout

**Scénario** : l'utilisateur remplit un formulaire de contact sur siteauhasard.com avec son numéro de téléphone.

1. L'utilisateur saisit `+33 6 12 34 56 78` dans le formulaire
2. Il clique sur "Envoyer"
3. Le plugin détecte le pattern téléphonique dans la requête POST sortante
4. Il identifie que la requête est redirigée vers `pixel.facebook.com`
5. Une alerte apparaît : *"Votre numéro de téléphone vient d'être envoyé à Facebook"*
6. Le badge passe en rouge avec le score F
7. L'historique enregistre : `+336••••5678 → pixel.facebook.com — 14:32:07`

---

### US-05 — Sync cloud
> En tant qu'utilisateur, je veux pouvoir synchroniser mon historique sur plusieurs appareils, en choisissant explicitement d'activer cette fonctionnalité.

**Critères d'acceptation**
- La sync est désactivée par défaut
- Un consentement explicite avec description claire est requis avant activation
- Je peux supprimer toutes mes données cloud depuis les paramètres
- Les valeurs PII ne sont jamais envoyées en clair vers le cloud

---

## 8. Critères de validation — Definition of Done

### 8.1 Critères fonctionnels

| Critère | Méthode de test | Seuil |
|---|---|---|
| Détection trackers — recall | Test automatisé Playwright (50 sites) | ≥ 90% |
| Détection PII — précision | Jeu de données test (500 requêtes) | ≥ 95% |
| Affichage popup | Chrome Performance API | P95 < 200ms |
| Badge mis à jour après chargement | Test chronométré | P95 < 500ms |
| Score RGPD cohérent | Audit manuel (20 sites référence) | ≥ 85% cohérence |
| Export rapport PDF | Test end-to-end | 100% des cas |
| Alerte PII après détection | Test end-to-end | < 2 secondes |

### 8.2 Critères non-fonctionnels

- Aucune donnée utilisateur ne transite vers un serveur externe sans consentement
- Overhead CPU du plugin < 2% en navigation normale
- Installation possible par un utilisateur non-technique en < 2 minutes
- Interface compréhensible sans formation préalable (test utilisateur ≥ 80% de compréhension)
- Taille du plugin compilé < 10 MB

---

## 9. Glossaire

| Terme | Définition |
|---|---|
| Tracker | Script ou pixel invisible enregistrant le comportement de l'utilisateur pour un tiers |
| Cookie | Fichier stocké par le navigateur contenant des informations de session ou d'identité |
| PII | Personally Identifiable Information — toute donnée permettant d'identifier une personne |
| RGPD | Règlement Général sur la Protection des Données — réglementation européenne (2018) |
| Payload | Corps d'une requête HTTP contenant les données transmises |
| Fingerprinting | Identification d'un navigateur via ses caractéristiques uniques, sans cookie |
| webRequest API | API Chrome permettant à une extension d'observer les requêtes réseau |
| Manifest V3 | Format actuel des plugins Chrome, avec sécurité et isolation renforcées |
| EasyList | Base de données publique listant les domaines de tracking connus |
| Disconnect.me | Base de données catégorisant les trackers par entreprise et usage |
| Score RGPD | Note synthétique A–F calculée sur 4 critères (trackers, PII, cookies, destinations) |
| Sync opt-in | Fonctionnalité de synchronisation cloud activable volontairement par l'utilisateur |
