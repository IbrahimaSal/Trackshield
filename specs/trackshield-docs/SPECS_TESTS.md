# Trackshield — Stratégie de test & TDD

**Version** : 1.0
**Date** : Juin 2025
**Statut** : Draft
**Auteur** : Ibrahima SALL

---

## Table des matières

1. [Philosophie TDD dans Trackshield](#1-philosophie-tdd-dans-trackshield)
2. [Cartographie des risques](#2-cartographie-des-risques)
3. [La pyramide de test](#3-la-pyramide-de-test)
4. [Outils par service](#4-outils-par-service)
5. [Couche 1 — Tests unitaires](#5-couche-1--tests-unitaires)
6. [Couche 2 — Tests de mutation](#6-couche-2--tests-de-mutation)
7. [Couche 3 — Tests d'intégration](#7-couche-3--tests-dintégration)
8. [Couche 4 — Tests de contrat](#8-couche-4--tests-de-contrat)
9. [Couche 5 — Tests E2E](#9-couche-5--tests-e2e)
10. [Couche 6 — Tests de chaos](#10-couche-6--tests-de-chaos)
11. [Pipeline CI](#11-pipeline-ci)
12. [Ce qu'on ne teste pas et pourquoi](#12-ce-quon-ne-teste-pas-et-pourquoi)

---

## 1. Philosophie TDD dans Trackshield

### 1.1 Le cycle Red → Green → Refactor

Le TDD (Test-Driven Development) n'est pas une stratégie de test — c'est une **méthode de conception**. On écrit le test avant le code, ce qui force à réfléchir à l'interface publique d'un composant avant de penser à son implémentation.

```
RED     → Écrire un test qui échoue pour la fonctionnalité souhaitée
GREEN   → Écrire le minimum de code pour faire passer ce test
REFACTOR→ Améliorer le code sans casser les tests existants
```

> **Pourquoi TDD est particulièrement adapté à Trackshield ?**
>
> Trackshield a deux zones où un bug silencieux a des conséquences réelles sur la vie privée des utilisateurs : la **détection PII** et le **calcul du score RGPD**. En TDD, ces comportements sont spécifiés sous forme de tests avant d'exister — le code est une conséquence du test, pas l'inverse. Il est impossible d'oublier un cas limite quand on commence par l'écrire.
>
> De plus, l'architecture hexagonale (ports & adapters) est naturellement compatible avec le TDD : les use cases dépendent d'interfaces (ports), pas d'implémentations concrètes. On peut tester un use case complet sans base de données ni réseau en injectant des adaptateurs de test.

### 1.2 Règles TDD du projet

Ces règles s'appliquent à tout le code métier (domaine + use cases) :

1. **Aucun code de production sans test rouge qui l'appelle.** Si on écrit une méthode sans test préalable, c'est une violation TDD.
2. **Un test ne doit tester qu'une seule chose.** Un test qui vérifie trois comportements est trois tests.
3. **Le nom du test est une phrase lisible.** `it('détecte un email dans un corps de requête POST encodé en URL')` — pas `it('test email')`.
4. **Le cycle est court.** Un test → quelques lignes de code → refactor. Pas d'accumulation de code non testé.
5. **Les tests du domaine sont zéro-infrastructure.** Aucun `new PrismaClient()`, aucun `fetch()`, aucun `chrome.*` dans les tests unitaires du domaine.

### 1.3 Ce qu'on teste en TDD vs ce qu'on teste après

| Code | Approche |
|---|---|
| Entités domaine, Value Objects | **TDD strict** — test avant code |
| Use cases | **TDD strict** — test avant code |
| Regex de détection PII | **TDD strict** — corpus de cas avant implémentation |
| Algorithme de scoring RGPD | **TDD strict** — seuils spécifiés en tests avant code |
| Controllers / routes | **Test après** — infrastructure, pas logique métier |
| Composants React du popup | **Test après** — tests de snapshot sur composants existants |
| Migrations Flyway | **Pas de test direct** — couvertes par les tests d'intégration |

---

## 2. Cartographie des risques

Avant de définir la couverture, on identifie le coût d'un bug par zone. La stratégie de test est proportionnelle au risque.

| Zone | Service | Coût d'un bug | Justification |
|---|---|---|---|
| Détection PII — faux négatif | Plugin + FastAPI | **Critique** | Une PII transmise à Facebook sans alerte = trahison de la promesse produit |
| Détection PII — faux positif | Plugin + FastAPI | **Élevé** | Alerte fausse = perte de confiance utilisateur |
| Calcul score RGPD | NestJS + FastAPI | **Critique** | Score faux = utilisateur mal informé sur la conformité d'un site |
| Masquage des valeurs PII | Plugin + NestJS | **Critique** | Valeur brute affichée ou stockée = violation RGPD |
| Idempotence des events | NestJS | **Élevé** | Doublons en base = scores faussés, alertes en double |
| Circuit breaker FastAPI | NestJS | **Élevé** | Sans fallback testé, une panne FastAPI fait tomber toute l'API |
| HMAC inter-services | NestJS + FastAPI | **Élevé** | Signature mal validée = FastAPI accessible sans authentification |
| Seuils de notation A→F | NestJS + FastAPI | **Élevé** | Un décalage de frontière (`>=` vs `>`) change la note d'un site |
| Matching des trackers (trie) | Plugin | **Modéré** | Un faux positif est gênant mais pas dangereux |
| Sync cloud opt-in | NestJS | **Modéré** | Données envoyées sans consentement = bug RGPD |
| Popup React | Plugin | **Faible** | Bug visuel, pas d'impact sur les données |

**Règle** : toute zone marquée **Critique** doit atteindre 100% de couverture de branches ET passer les tests de mutation avec un score ≥ 85%.

---

## 3. La pyramide de test

```
                      ┌──────────────┐
                      │     E2E      │  5–10 tests
                      │  Playwright  │  Parcours critiques uniquement
                    ┌─┴──────────────┴─┐
                    │     Contrat      │  ~10 contrats
                    │      Pact        │  Interfaces inter-services
                  ┌─┴──────────────────┴─┐
                  │    Intégration        │  ~30–50 tests
                  │ Supertest + pytest    │  Use cases + vraie infra
                ┌─┴──────────────────────┴─┐
                │   Mutation (ciblée)        │  Zones critiques uniquement
                │   Stryker + mutmut         │  PII + Score RGPD
              ┌─┴────────────────────────────┴─┐
              │          Unitaires              │  ~200–300 tests
              │     Vitest + pytest             │  Domaine pur, rapides
              └─────────────────────────────────┘
```

**Ratio cible** : 70% unitaires · 15% intégration · 10% contrat · 5% E2E

---

## 4. Outils par service

### Plugin Chrome (TypeScript)

| Besoin | Outil | Raison |
|---|---|---|
| Tests unitaires | **Vitest** | Natif avec Vite, même config que le build |
| Tests de mutation | **Stryker** | Standard TypeScript, intégration Vitest native |
| Tests E2E extension | **Playwright** | Seul outil supportant le chargement d'extensions Chrome en headless |
| Mock Chrome APIs | **vitest-chrome** | Simule `chrome.storage`, `chrome.runtime`, `chrome.webRequest` |

```bash
pnpm --filter plugin add -D vitest @vitest/coverage-v8 vitest-chrome
pnpm --filter plugin add -D @stryker-mutator/core @stryker-mutator/vitest-runner
pnpm --filter plugin add -D @playwright/test
```

### NestJS API (TypeScript)

| Besoin | Outil | Raison |
|---|---|---|
| Tests unitaires | **Vitest** | Cohérence avec le reste du monorepo |
| Tests d'intégration | **Supertest + Vitest** | Requêtes HTTP sur l'app NestJS réelle |
| Tests de contrat | **Pact** | Standard consumer-driven contract testing |
| Tests de chaos | **nock + Vitest** | Simule la panne de FastAPI |

```bash
pnpm --filter api add -D vitest @vitest/coverage-v8 supertest @types/supertest
pnpm --filter api add -D @pact-foundation/pact
pnpm --filter api add -D nock
pnpm --filter api add -D @stryker-mutator/core @stryker-mutator/vitest-runner
```

### FastAPI Analyzer (Python)

| Besoin | Outil | Raison |
|---|---|---|
| Tests unitaires | **pytest** | Standard Python |
| Tests d'intégration | **pytest + httpx** | Client async natif FastAPI |
| Tests de mutation | **mutmut** | Mutation testing Python léger |
| Tests property-based | **Hypothesis** | Génère automatiquement des cas limites pour les regex |
| Couverture | **pytest-cov** | Rapport de couverture intégré |

```bash
uv add --dev pytest pytest-asyncio pytest-cov httpx hypothesis mutmut
```

---

## 5. Couche 1 — Tests unitaires

### 5.1 Workflow TDD — exemple complet sur `RgpdScore`

On suit le cycle exact Red → Green → Refactor.

**Étape 1 — RED : écrire les tests avant toute implémentation**

```typescript
// apps/api/src/shared/domain/__tests__/rgpd-score.value-object.spec.ts

import { describe, it, expect } from 'vitest';
import { RgpdScore } from '../rgpd-score.value-object';

describe('RgpdScore', () => {

  describe('calculate()', () => {
    // Cas nominaux — un par seuil
    it('retourne la note A pour un score ≥ 90', () => {
      const score = RgpdScore.calculate({ trackerCount: 0, piiCount: 0, cookieScore: 0, euPercentage: 100 });
      expect(score.grade).toBe('A');
    });

    it('retourne la note B pour un score entre 75 et 89', () => {
      const score = RgpdScore.calculate({ trackerCount: 2, piiCount: 0, cookieScore: 2, euPercentage: 80 });
      expect(score.grade).toBe('B');
    });

    it('retourne la note F pour un score < 35', () => {
      const score = RgpdScore.calculate({ trackerCount: 20, piiCount: 5, cookieScore: 10, euPercentage: 0 });
      expect(score.grade).toBe('F');
    });

    // Cas limites — les bugs se cachent aux frontières exactes
    it('retourne A (pas B) pour un score exactement égal à 90', () => {
      // Ce test force à utiliser >= 90 et non > 90 dans l'implémentation
      const score = RgpdScore.calculate({ trackerCount: 0, piiCount: 0, cookieScore: 1, euPercentage: 100 });
      expect(score.value).toBeGreaterThanOrEqual(90);
      expect(score.grade).toBe('A');
    });

    it('retourne F (pas D) pour un score exactement égal à 34', () => {
      const score = RgpdScore.calculate({ trackerCount: 15, piiCount: 3, cookieScore: 8, euPercentage: 10 });
      expect(score.value).toBeLessThan(35);
      expect(score.grade).toBe('F');
    });

    // Robustesse — ne doit jamais retourner une valeur invalide
    it('le score ne peut pas être négatif', () => {
      const score = RgpdScore.calculate({ trackerCount: 999, piiCount: 999, cookieScore: 999, euPercentage: 0 });
      expect(score.value).toBeGreaterThanOrEqual(0);
    });

    it('le score ne peut pas dépasser 100', () => {
      const score = RgpdScore.calculate({ trackerCount: 0, piiCount: 0, cookieScore: 0, euPercentage: 100 });
      expect(score.value).toBeLessThanOrEqual(100);
    });

    // Comportement du composant PII — clampé à 0
    it('le composant PII ne devient pas négatif avec de nombreuses PII', () => {
      // 4 PII × 10 pts = -5 avant clamp — doit être 0
      const withManyPii    = RgpdScore.calculate({ trackerCount: 0, piiCount: 10, cookieScore: 0, euPercentage: 100 });
      const withSinglePii  = RgpdScore.calculate({ trackerCount: 0, piiCount: 4,  cookieScore: 0, euPercentage: 100 });
      // Les deux doivent avoir le même composant PII (tous les deux à 0)
      expect(withManyPii.value).toBe(withSinglePii.value);
    });
  });

  describe('isCritical()', () => {
    it('retourne true pour un score inférieur à 35', () => {
      const score = RgpdScore.calculate({ trackerCount: 20, piiCount: 5, cookieScore: 10, euPercentage: 0 });
      expect(score.isCritical()).toBe(true);
    });

    it('retourne false pour un score égal à 35', () => {
      // Frontière : 35 n'est pas critique
      const score = RgpdScore.calculate({ trackerCount: 10, piiCount: 2, cookieScore: 6, euPercentage: 30 });
      if (score.value === 35) expect(score.isCritical()).toBe(false);
    });
  });
});
```

Ces tests échouent tous à ce stade — `RgpdScore` n'existe pas encore. C'est le **RED**.

**Étape 2 — GREEN : minimum de code pour faire passer les tests**

```typescript
// apps/api/src/shared/domain/rgpd-score.value-object.ts

export class RgpdScore {
  private constructor(private readonly _value: number) {}

  static calculate(data: ScoreInput): RgpdScore {
    const trackerComponent = (1 - Math.min(data.trackerCount / 20, 1)) * 30;
    const piiComponent     = data.piiCount === 0 ? 35 : Math.max(0, 35 - data.piiCount * 10);
    const cookieComponent  = (1 - Math.min(data.cookieScore / 10, 1)) * 20;
    const geoComponent     = (data.euPercentage / 100) * 15;

    const raw = trackerComponent + piiComponent + cookieComponent + geoComponent;
    return new RgpdScore(Math.round(Math.max(0, Math.min(100, raw))));
  }

  get value(): number { return this._value; }

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

**Étape 3 — REFACTOR** : tous les tests passent. On peut extraire des constantes, renommer, sans risque.

---

### 5.2 TDD sur la détection PII — corpus de cas

La détection PII mérite une approche par **corpus** : on définit d'abord la liste exhaustive des cas à détecter et à ne pas détecter, puis on implémente les regex.

```typescript
// apps/plugin/src/background/__tests__/pii-detector.spec.ts

import { describe, it, expect } from 'vitest';
import { scanRequest } from '../pii-detector';

// ─── Corpus de détection attendue ────────────────────────────────────────────

const SHOULD_DETECT: Array<{ label: string; input: string; type: string }> = [
  // Emails
  { label: 'email en query param',            input: 'https://t.co/p?email=john@gmail.com',       type: 'EMAIL' },
  { label: 'email encodé URL',                input: 'https://t.co/p?e=john%40gmail.com',          type: 'EMAIL' },
  { label: 'email dans body JSON',            input: '{"user":"alice@company.fr"}',                type: 'EMAIL' },
  { label: 'email avec sous-domaine',         input: 'user=test@mail.company.co.uk',               type: 'EMAIL' },

  // Téléphones FR
  { label: 'numéro FR +33',                   input: 'phone=%2B33612345678',                       type: 'PHONE' },
  { label: 'numéro FR 06',                    input: 'tel=0612345678',                             type: 'PHONE' },
  { label: 'numéro FR 0033',                  input: 'num=0033612345678',                          type: 'PHONE' },

  // Téléphones internationaux
  { label: 'numéro intl +1',                  input: 'phone=%2B14155552671',                       type: 'PHONE_INTL' },
  { label: 'numéro intl +44',                 input: 'phone=%2B447911123456',                      type: 'PHONE_INTL' },

  // IP
  { label: 'IP en query param',               input: 'https://t.co/?ip=192.168.1.1',               type: 'IP' },
  { label: 'IP dans payload JSON',            input: '{"client_ip":"203.0.113.42"}',               type: 'IP' },
];

// ─── Corpus de non-détection (faux positifs à éviter) ────────────────────────

const SHOULD_NOT_DETECT: Array<{ label: string; input: string }> = [
  { label: 'email sans TLD valide',           input: 'user=test@localhost' },
  { label: 'email sans @',                    input: 'user=notanemail.com' },
  { label: 'numéro trop court',               input: 'num=061234567' },           // 8 chiffres
  { label: 'numéro trop long',                input: 'num=06123456789012' },       // 13 chiffres
  { label: 'IP partielle',                    input: 'version=192.168.1' },        // 3 octets seulement
  { label: 'numéro dans une URL de version',  input: 'v=1.2.3.4' },              // ressemble à IP
  { label: 'URL sans données sensibles',      input: 'https://analytics.google.com/collect?t=pageview&tid=UA-123' },
];

// ─── Tests générés depuis les corpus ─────────────────────────────────────────

describe('scanRequest — détections attendues', () => {
  SHOULD_DETECT.forEach(({ label, input, type }) => {
    it(`détecte ${label}`, () => {
      const detections = scanRequest('https://pixel.facebook.com/tr', input);
      expect(detections.some(d => d.type === type)).toBe(true);
    });
  });
});

describe('scanRequest — faux positifs interdits', () => {
  SHOULD_NOT_DETECT.forEach(({ label, input }) => {
    it(`ne détecte pas de PII dans : ${label}`, () => {
      const detections = scanRequest('https://example.com', input);
      expect(detections).toHaveLength(0);
    });
  });
});

// ─── Invariants de masquage — garanties produit ───────────────────────────────

describe('masquage des valeurs', () => {
  it('ne retourne jamais la valeur brute d\'un email', () => {
    const detections = scanRequest('https://t.co', 'email=john@gmail.com');
    detections.forEach(d => {
      expect(d.maskedValue).not.toContain('john@gmail.com');
      expect(d.maskedValue).toContain('••••');
    });
  });

  it('ne retourne jamais la valeur brute d\'un téléphone', () => {
    const detections = scanRequest('https://t.co', 'phone=0612345678');
    detections.forEach(d => {
      expect(d.maskedValue).not.toBe('0612345678');
      expect(d.maskedValue).toContain('••••');
    });
  });

  it('le masque d\'email conserve les 2 premiers caractères et le domaine', () => {
    const detections = scanRequest('https://t.co', 'email=johndoe@gmail.com');
    const emailDetection = detections.find(d => d.type === 'EMAIL');
    expect(emailDetection?.maskedValue).toMatch(/^jo/);
    expect(emailDetection?.maskedValue).toContain('@gmail.com');
  });
});
```

```python
# apps/analyzer/tests/test_regex_pii_detector.py

import pytest
from hypothesis import given, strategies as st, settings
from src.adapters.regex_pii_detector import RegexPiiDetector

detector = RegexPiiDetector()

# ─── Corpus structuré ────────────────────────────────────────────────────────

SHOULD_DETECT = [
    ("email query param",   "email=alice@gmail.com",           "EMAIL"),
    ("email JSON body",     '{"user": "bob@company.fr"}',      "EMAIL"),
    ("tel FR +33",          "phone=%2B33612345678",             "PHONE"),
    ("tel FR 06",           "tel=0612345678",                   "PHONE"),
    ("tel intl +1",         "phone=%2B14155552671",             "PHONE_INTL"),
]

SHOULD_NOT_DETECT = [
    ("email sans TLD",      "user=test@localhost"),
    ("numéro trop court",   "num=061234567"),
    ("URL propre GA",       "https://www.google-analytics.com/collect?t=pageview"),
]

@pytest.mark.parametrize("label,payload,expected_type", SHOULD_DETECT)
def test_detects(label, payload, expected_type):
    detections = detector.detect("https://pixel.facebook.com/tr", payload)
    types = [d.pii_type for d in detections]
    assert expected_type in types, f"Attendait {expected_type} dans '{label}'"

@pytest.mark.parametrize("label,payload", SHOULD_NOT_DETECT)
def test_no_false_positive(label, payload):
    detections = detector.detect("https://example.com", payload)
    assert len(detections) == 0, f"Faux positif sur : {label}"

# ─── Invariant : valeur masquée jamais identique à la valeur brute ────────────

def test_masked_value_never_equals_raw():
    detections = detector.detect("https://t.co", "email=john@gmail.com")
    for d in detections:
        assert d.masked_value != "john@gmail.com"
        assert "••••" in d.masked_value

# ─── Tests property-based — Hypothesis génère des cas limites automatiquement ─
# Hypothesis va générer des centaines d'emails/strings aléatoires et vérifier
# que l'invariant "la valeur masquée ≠ valeur brute" tient toujours.

@given(st.emails())
@settings(max_examples=500)
def test_email_always_masked(email: str):
    detections = detector.detect("https://t.co", f"e={email}")
    for d in detections:
        assert d.masked_value != email
        assert "••••" in d.masked_value
```

> **Pourquoi Hypothesis (property-based testing) sur les regex ?**
>
> Les tests paramétrés vérifient les cas qu'on a pensé à écrire. Hypothesis génère automatiquement des centaines de cas que personne n'aurait imaginés — emails avec des caractères unicode, numéros avec des espaces insécables, chaînes qui ressemblent à des emails mais n'en sont pas. C'est le filet de sécurité contre les cas limites oubliés dans les regex.

---

### 5.3 Tests unitaires des use cases NestJS

En TDD, les use cases sont testés avec des **faux adaptateurs** (doubles de test), jamais avec Prisma ni HTTP réel.

```typescript
// apps/api/src/modules/pii/application/use-cases/__tests__/record-pii-detection.usecase.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordPiiDetectionUseCase } from '../record-pii-detection.usecase';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Faux adaptateur en mémoire — remplace Prisma sans aucune dépendance
class InMemoryPiiRepository implements IPiiRepository {
  private store: PiiDetection[] = [];
  async save(d: PiiDetection) { this.store.push(d); }
  async findBySession(id: string) { return this.store.filter(d => d.sessionId === id); }
  get all() { return this.store; }
}

describe('RecordPiiDetectionUseCase', () => {
  let useCase: RecordPiiDetectionUseCase;
  let repo: InMemoryPiiRepository;
  let emitter: EventEmitter2;

  beforeEach(() => {
    repo = new InMemoryPiiRepository();
    emitter = new EventEmitter2();
    useCase = new RecordPiiDetectionUseCase(repo, emitter);
  });

  it('persiste la détection en base', async () => {
    const result = await useCase.execute({
      sessionId: 'sess_1',
      piiType: 'EMAIL',
      maskedValue: 'jo••••@gmail.com',
      destination: 'pixel.facebook.com',
    });

    expect(result.isOk()).toBe(true);
    expect(repo.all).toHaveLength(1);
    expect(repo.all[0].maskedValue).toBe('jo••••@gmail.com');
  });

  it('émet un événement pii.exposed après la persistance', async () => {
    const handler = vi.fn();
    emitter.on('pii.exposed', handler);

    await useCase.execute({ sessionId: 'sess_1', piiType: 'PHONE', maskedValue: '+336••••5678', destination: 'pixel.facebook.com' });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toMatchObject({ piiType: 'PHONE' });
  });

  it('retourne une erreur si sessionId est absent', async () => {
    const result = await useCase.execute({ sessionId: '', piiType: 'EMAIL', maskedValue: 'x', destination: 'y' });
    expect(result.isFail()).toBe(true);
  });

  it('ne persiste rien si la validation échoue', async () => {
    await useCase.execute({ sessionId: '', piiType: 'EMAIL', maskedValue: 'x', destination: 'y' });
    expect(repo.all).toHaveLength(0);
  });

  it('n\'émet pas d\'événement si la persistance échoue', async () => {
    vi.spyOn(repo, 'save').mockRejectedValue(new Error('DB error'));
    const handler = vi.fn();
    emitter.on('pii.exposed', handler);

    await useCase.execute({ sessionId: 'sess_1', piiType: 'EMAIL', maskedValue: 'x', destination: 'y' });

    expect(handler).not.toHaveBeenCalled();
  });
});
```

---

## 6. Couche 2 — Tests de mutation

> **Pourquoi les tests de mutation ?**
>
> La couverture de code (coverage) mesure quelles lignes sont **exécutées** par les tests. Elle ne mesure pas si les tests **vérifient** vraiment le comportement. Un test qui exécute `score.grade` sans faire d'assertion dessus est compté comme couvert — mais il ne détecterait pas un bug.
>
> Les tests de mutation modifient automatiquement le code source (changent `>=` en `>`, inversent des conditions, suppriment des retours) et vérifient que les tests existants détectent ces modifications. Un mutant qui **survit** (que les tests ne détectent pas) révèle un comportement non testé, même si la couverture est à 100%.
>
> On applique les tests de mutation **uniquement sur les zones critiques** (PII + score) — pas sur tout le codebase, car ils sont lents et coûteux en CI.

### 6.1 Configuration Stryker (TypeScript)

```javascript
// apps/plugin/stryker.config.mjs
export default {
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',

  // Uniquement les fichiers à risque critique
  mutate: [
    'src/background/pii-detector.ts',
    'src/background/tracker-matcher.ts',
  ],

  thresholds: {
    high: 85,   // CI vert si score ≥ 85%
    low: 75,    // CI orange si entre 75% et 85%
    break: 70,  // CI rouge (bloquant) si score < 70%
  },

  // Exclure les mutants sur les messages d'erreur et les logs — sans valeur
  excludedMutations: ['StringLiteral'],
};

// apps/api/stryker.config.mjs
export default {
  testRunner: 'vitest',
  mutate: [
    'src/shared/domain/rgpd-score.value-object.ts',
    'src/modules/pii/domain/masked-value.value-object.ts',
  ],
  thresholds: { high: 85, low: 75, break: 70 },
};
```

### 6.2 Configuration mutmut (Python)

```toml
# apps/analyzer/pyproject.toml
[tool.mutmut]
paths_to_mutate = "src/domain/"
tests_dir = "tests/"
# Seuil : 0 mutant survivant toléré sur rgpd_scorer.py
```

```bash
# Lancement ciblé sur le scorer uniquement
mutmut run --paths-to-mutate src/domain/rgpd_scorer.py
mutmut results

# Affiche les mutants survivants pour correction
mutmut show <id>
```

---

## 7. Couche 3 — Tests d'intégration

Les tests d'intégration vérifient que les **use cases fonctionnent avec la vraie infrastructure** — vraie base PostgreSQL, vrai Redis. Ils tournent dans le pipeline CI avec des services Docker.

> **Pourquoi ne pas mocker la base dans les tests d'intégration ?**
>
> Mocker Prisma dans les tests d'intégration crée une fausse sécurité. Le mock retourne exactement ce qu'on lui dit de retourner — il ne teste pas que la requête SQL est correcte, que les index existent, que les contraintes sont respectées. Des migrations Flyway incomplètes ou des contraintes manquantes ne seraient jamais détectées. La base de test est réinitialisée avant chaque test : c'est la seule façon d'être certain que ce qu'on teste ressemble à la production.

### 7.1 Setup NestJS

```typescript
// apps/api/tests/integration/setup.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/shared/infrastructure/prisma/prisma.service';

export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  const prisma = app.get(PrismaService);
  return { app, prisma };
}

// Nettoyage entre chaque test — ordre respectant les FK
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$transaction([
    prisma.piiDetection.deleteMany(),
    prisma.tracker.deleteMany(),
    prisma.request.deleteMany(),
    prisma.session.deleteMany(),
    prisma.userPreference.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
```

### 7.2 Test d'idempotence

```typescript
// apps/api/tests/integration/idempotence.spec.ts

describe('POST /api/events — idempotence', () => {
  it('deux envois avec la même clé ne créent qu\'un seul tracker en base', async () => {
    const key = crypto.randomUUID();
    const payload = {
      events: [{ type: 'TRACKER_DETECTED', domain: 'google.com', category: 'ANALYTICS' }],
    };

    // Premier envoi
    await request(app.getHttpServer())
      .post('/api/events')
      .set('x-idempotency-key', key)
      .send(payload)
      .expect(201);

    // Second envoi — même clé
    await request(app.getHttpServer())
      .post('/api/events')
      .set('x-idempotency-key', key)
      .send(payload)
      .expect(201); // pas d'erreur, mais rien inséré

    const count = await prisma.tracker.count();
    expect(count).toBe(1); // pas 2
  });

  it('deux envois avec des clés différentes créent bien deux entrées', async () => {
    const payload = { events: [{ type: 'TRACKER_DETECTED', domain: 'google.com', category: 'ANALYTICS' }] };

    await request(app.getHttpServer()).post('/api/events').set('x-idempotency-key', 'key-1').send(payload);
    await request(app.getHttpServer()).post('/api/events').set('x-idempotency-key', 'key-2').send(payload);

    const count = await prisma.tracker.count();
    expect(count).toBe(2);
  });
});
```

### 7.3 Test de consentement RGPD

```typescript
// apps/api/tests/integration/rgpd-consent.spec.ts

describe('Sync cloud — consentement opt-in', () => {
  it('n\'envoie aucun event si syncEnabled est false', async () => {
    const user = await prisma.user.create({ data: { email: 'test@test.com', passwordHash: '...', syncEnabled: false } });

    const syncClientSpy = vi.spyOn(syncClient, 'send');

    // Simule une détection PII
    await piiUseCase.execute({ sessionId: 'sess_1', piiType: 'EMAIL', maskedValue: 'x', destination: 'y' });

    expect(syncClientSpy).not.toHaveBeenCalled();
  });

  it('supprime toutes les données en cascade via DELETE /api/users/me/data', async () => {
    // Crée utilisateur avec données
    const user = await createUserWithData(prisma);

    await request(app.getHttpServer())
      .delete('/api/users/me/data')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const sessions    = await prisma.session.count({ where: { userId: user.id } });
    const detections  = await prisma.piiDetection.count();
    expect(sessions).toBe(0);
    expect(detections).toBe(0);
  });
});
```

### 7.4 Tests d'intégration FastAPI

```python
# apps/analyzer/tests/integration/test_analyze_route.py

import pytest
from httpx import AsyncClient
from src.main import app
from tests.helpers import make_hmac_headers

@pytest.mark.asyncio
async def test_detects_phone_in_post_body():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/analyze",
            json={"url": "https://pixel.facebook.com/tr", "method": "POST", "payload": "phone=%2B33612345678"},
            headers=make_hmac_headers(),
        )

    assert response.status_code == 200
    detections = response.json()["pii_detections"]
    assert any(d["pii_type"] == "PHONE" for d in detections)

@pytest.mark.asyncio
async def test_rejects_request_without_hmac():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/analyze", json={"url": "https://example.com", "method": "GET"})
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_rejects_expired_hmac():
    """Une signature vieille de 60s doit être rejetée (fenêtre max = 30s)."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/analyze",
            json={"url": "https://example.com", "method": "GET"},
            headers=make_hmac_headers(timestamp_offset=-60),  # simulé 60s dans le passé
        )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_masked_value_never_raw_in_response():
    """Invariant absolu : la réponse ne doit jamais contenir la valeur PII brute."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/analyze",
            json={"url": "https://t.co", "method": "POST", "payload": "email=john@gmail.com"},
            headers=make_hmac_headers(),
        )

    body = response.text
    assert "john@gmail.com" not in body
```

---

## 8. Couche 4 — Tests de contrat

> **Pourquoi les tests de contrat ?**
>
> En architecture distribuée, les services évoluent indépendamment. NestJS peut changer le format de `EventBatchDto` sans que le plugin soit mis à jour — tout compile, les tests unitaires passent, mais en production les events sont silencieusement ignorés car le format a changé.
>
> Un test de contrat vérifie que le **consommateur** (le plugin) et le **producteur** (NestJS) s'accordent sur la même interface, sans avoir besoin de les déployer ensemble. Le consommateur définit ses attentes sous forme de contrat, le producteur prouve qu'il les respecte.
>
> L'outil standard est **Pact** (consumer-driven contract testing). Le contrat est un fichier JSON versionné en Git — toute modification d'interface qui le casse est détectée en CI avant tout déploiement.

### 8.1 Plugin (consumer) → NestJS (provider)

```typescript
// apps/plugin/tests/contracts/events.pact.spec.ts

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
const { like, eachLike, regex } = MatchersV3;

const provider = new PactV3({
  consumer: 'trackshield-plugin',
  provider: 'trackshield-api',
  dir: './pacts',
});

describe('Contrat Plugin → NestJS', () => {
  it('accepte un batch d\'events valide et retourne 201', async () => {
    await provider
      .given('utilisateur avec sync activée')
      .uponReceiving('un batch d\'events de tracking')
      .withRequest({
        method: 'POST',
        path: '/api/events',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': regex({ generate: 'Bearer token123', matcher: 'Bearer .+' }),
          'x-idempotency-key': like('a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
        },
        body: {
          events: eachLike({
            type: like('TRACKER_DETECTED'),
            domain: like('google.com'),
            category: like('ANALYTICS'),
            timestamp: like(1718000000000),
          }),
        },
      })
      .willRespondWith({ status: 201, body: { received: like(1) } })
      .executeTest(async (mockServer) => {
        const client = new SyncClient(mockServer.url);
        client.enqueue({ type: 'TRACKER_DETECTED', domain: 'google.com', category: 'ANALYTICS', timestamp: Date.now() });
        await client.flush();
      });
  });
});
```

```typescript
// apps/api/tests/contracts/events.provider.spec.ts
// NestJS prouve qu'il respecte le contrat généré par le plugin

import { Verifier } from '@pact-foundation/pact';

describe('Vérification contrat NestJS (provider)', () => {
  it('respecte le contrat défini par le plugin', async () => {
    const verifier = new Verifier({
      provider: 'trackshield-api',
      providerBaseUrl: `http://localhost:${TEST_PORT}`,
      pactUrls: ['./pacts/trackshield-plugin-trackshield-api.json'],
      stateHandlers: {
        'utilisateur avec sync activée': async () => {
          // Crée les données de test nécessaires
          await prisma.user.create({ data: { email: 'contract@test.com', syncEnabled: true, ... } });
        },
      },
    });

    await verifier.verifyProvider();
  });
});
```

### 8.2 NestJS (consumer) → FastAPI (provider)

```typescript
// apps/api/tests/contracts/fastapi-analyze.pact.spec.ts

describe('Contrat NestJS → FastAPI', () => {
  it('POST /analyze retourne la structure attendue', async () => {
    await provider
      .given('service opérationnel')
      .uponReceiving('une requête d\'analyse')
      .withRequest({
        method: 'POST', path: '/analyze',
        headers: { 'x-timestamp': like('1718000000'), 'x-signature': like('abc123') },
        body: {
          url: like('https://pixel.facebook.com/tr'),
          method: like('POST'),
          payload: like('phone=%2B33612345678'),
        },
      })
      .willRespondWith({
        status: 200,
        body: {
          pii_detections: eachLike({
            pii_type: like('PHONE'),
            masked_value: like('+336••••5678'),
            destination: like('pixel.facebook.com'),
            confidence: like(0.95),
          }),
          tracker_match: { name: like('Meta Pixel'), category: like('SOCIAL') },
          analyzed_at: like('2025-06-15T14:32:07Z'),
        },
      })
      .executeTest(async (mockServer) => {
        const adapter = new FastApiAnalyzerAdapter(httpService, mockServer.url);
        const result = await adapter.analyze(testSession);
        expect(result.pii_detections).toBeDefined();
      });
  });
});
```

---

## 9. Couche 5 — Tests E2E

Les tests E2E couvrent uniquement les **parcours critiques** — les scénarios dont l'échec aurait un impact direct sur l'utilisateur ou les données.

### 9.1 Parcours critiques à couvrir

| # | Parcours | Pourquoi critique |
|---|---|---|
| P1 | Détection PII de bout en bout : formulaire → alerte popup | Promesse produit centrale |
| P2 | Score RGPD affiché correctement dans le badge | Indicateur principal en un coup d'œil |
| P3 | Rapport d'audit généré et téléchargeable | Fonctionnalité différenciante |
| P4 | Sync cloud : consentement → données envoyées → suppression | Conformité RGPD |

### 9.2 Setup Playwright avec extension Chrome

```typescript
// apps/plugin/tests/e2e/setup.ts

import { chromium, BrowserContext } from '@playwright/test';
import path from 'path';

export async function launchWithExtension(): Promise<BrowserContext> {
  const pluginPath = path.join(__dirname, '../../dist');

  const context = await chromium.launchPersistentContext('', {
    headless: false, // Playwright ne supporte pas les extensions en headless complet
    args: [
      `--disable-extensions-except=${pluginPath}`,
      `--load-extension=${pluginPath}`,
      '--no-sandbox',
    ],
  });

  return context;
}

export async function getExtensionId(context: BrowserContext): Promise<string> {
  // Récupère l'ID de l'extension depuis la page d'extensions Chrome
  const page = await context.newPage();
  await page.goto('chrome://extensions');
  // Extrait l'ID via le DOM de la page extensions
  const extensionId = await page.evaluate(() => {
    const items = document.querySelectorAll('extensions-item');
    return items[0]?.getAttribute('id') ?? '';
  });
  await page.close();
  return extensionId;
}
```

```typescript
// apps/plugin/tests/e2e/pii-detection.e2e.spec.ts

import { test, expect } from '@playwright/test';
import { launchWithExtension, getExtensionId } from './setup';

test.describe('P1 — Détection PII de bout en bout', () => {

  test('affiche une alerte quand un téléphone est soumis dans un formulaire', async () => {
    const context = await launchWithExtension();
    const extensionId = await getExtensionId(context);

    // Page de test locale avec un formulaire contenant un champ téléphone
    const page = await context.newPage();
    await page.goto('http://localhost:3001/fixture-form'); // serveur de fixture local

    // Remplit et soumet le formulaire
    await page.fill('input[name="phone"]', '0612345678');
    await page.click('button[type="submit"]');

    // Ouvre le popup Trackshield
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);

    // Vérifie l'alerte
    await expect(popup.locator('.pii-box')).toBeVisible({ timeout: 3000 });
    await expect(popup.locator('.pii-box')).toContainText('••••'); // masqué
    await expect(popup.locator('.pii-box')).not.toContainText('0612345678'); // jamais brut

    await context.close();
  });

  test('le badge passe en rouge quand une PII est détectée', async () => {
    // Vérifie l'état visuel du badge via chrome.action
    // ...
  });
});
```

---

## 10. Couche 6 — Tests de chaos

> **Pourquoi les tests de chaos ?**
>
> Le circuit breaker et le mode dégradé ne valent rien s'ils n'ont jamais été exécutés en conditions réelles. Un code de fallback jamais testé est un code mort — il peut contenir un bug qui ne se manifestera qu'en production, au pire moment. Les tests de chaos simulent la panne de FastAPI pour vérifier que NestJS résiste et que le fallback est correct.

```typescript
// apps/api/tests/chaos/circuit-breaker.spec.ts

import nock from 'nock';

describe('Circuit breaker FastAPI', () => {

  afterEach(() => nock.cleanAll());

  it('retourne un score dégradé si FastAPI est indisponible', async () => {
    // Simule FastAPI qui ne répond pas (timeout)
    nock(FASTAPI_URL).post('/analyze').delay(5000).reply(200, {});

    const response = await request(app.getHttpServer())
      .get(`/api/sessions/${sessionId}`)
      .timeout(4000)
      .expect(200);

    expect(response.body.score.degraded).toBe(true);
    expect(response.body.score.grade).toBeDefined(); // pas de 500
  });

  it('ouvre le circuit après le seuil d\'erreurs configuré', async () => {
    // Simule 5 erreurs consécutives de FastAPI
    nock(FASTAPI_URL).post('/analyze').times(5).replyWithError('Connection refused');

    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer()).get(`/api/sessions/${sessionId}`);
    }

    // La 6e requête doit être court-circuitée instantanément (< 100ms)
    const start = Date.now();
    await request(app.getHttpServer()).get(`/api/sessions/${sessionId}`).expect(200);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100); // circuit ouvert = pas d'attente réseau
  });

  it('referme le circuit quand FastAPI revient', async () => {
    // Ouvre le circuit
    nock(FASTAPI_URL).post('/analyze').times(5).replyWithError('down');
    for (let i = 0; i < 5; i++) await request(app.getHttpServer()).get(`/api/sessions/${sessionId}`);

    // FastAPI revient
    nock(FASTAPI_URL).post('/analyze').reply(200, { pii_detections: [], cookieScore: 2, euPercentage: 80 });

    // Attend le resetTimeout (simulé en test avec un timeout court)
    await new Promise(r => setTimeout(r, CIRCUIT_RESET_TIMEOUT_MS));

    const response = await request(app.getHttpServer()).get(`/api/sessions/${sessionId}`).expect(200);
    expect(response.body.score.degraded).toBeUndefined(); // score complet à nouveau
  });
});
```

---

## 11. Pipeline CI

### 11.1 Ordre d'exécution et règles de blocage

```yaml
# .github/workflows/ci.yml

jobs:

  # ── Étape 1 : Rapide, bloquant — < 1 min ──────────────────────────────────
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo typecheck          # tsc --noEmit
      - run: cd apps/analyzer && mypy src/ # mypy strict

  lint:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm turbo lint
      - run: cd apps/analyzer && ruff check src/

  # ── Étape 2 : Tests unitaires — < 2 min ───────────────────────────────────
  unit-tests:
    needs: [typecheck, lint]
    runs-on: ubuntu-latest
    steps:
      - run: pnpm turbo test --filter=plugin --filter=api -- --coverage
      - run: cd apps/analyzer && pytest tests/unit/ --cov=src/domain --cov-fail-under=100
      - uses: actions/upload-artifact@v4
        with: { name: coverage, path: '**/coverage/' }

  # ── Étape 3 : Tests de mutation — < 5 min (zones critiques) ───────────────
  mutation-tests:
    needs: [unit-tests]
    runs-on: ubuntu-latest
    steps:
      - run: pnpm --filter plugin stryker run
      - run: pnpm --filter api stryker run
      - run: cd apps/analyzer && mutmut run --paths-to-mutate src/domain/ && mutmut junitxml > mutmut-results.xml
    # Bloquant : le build échoue si le score de mutation < 70%

  # ── Étape 4 : Tests d'intégration — < 3 min ───────────────────────────────
  integration-tests:
    needs: [unit-tests]
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env: { POSTGRES_DB: trackshield_test, POSTGRES_USER: trackshield, POSTGRES_PASSWORD: test }
        options: --health-cmd pg_isready --health-interval 5s --health-retries 5
      redis:
        image: redis:7-alpine
        options: --health-cmd "redis-cli ping" --health-interval 5s
    steps:
      - run: flyway -url=jdbc:postgresql://localhost:5432/trackshield_test migrate
      - run: pnpm turbo test:integration --filter=api
      - run: cd apps/analyzer && pytest tests/integration/

  # ── Étape 5 : Tests de contrat — < 2 min ──────────────────────────────────
  contract-tests:
    needs: [integration-tests]
    runs-on: ubuntu-latest
    steps:
      - run: pnpm --filter plugin vitest run tests/contracts/
        # Génère les fichiers pact/*.json
      - run: pnpm --filter api vitest run tests/contracts/
        # Vérifie que NestJS respecte les contrats générés

  # ── Étape 6 : Tests de chaos — < 3 min ────────────────────────────────────
  chaos-tests:
    needs: [integration-tests]
    runs-on: ubuntu-latest
    steps:
      - run: pnpm --filter api vitest run tests/chaos/

  # ── Étape 7 : Tests E2E — < 10 min, uniquement sur main ───────────────────
  e2e-tests:
    needs: [contract-tests, chaos-tests]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - run: pnpm turbo build --filter=plugin
      - run: pnpm --filter plugin playwright test tests/e2e/
```

### 11.2 Seuils de couverture par zone

| Zone | Couverture branches | Score mutation | Règle |
|---|---|---|---|
| `pii-detector.ts` | **100%** | **≥ 85%** | Bloquant en CI |
| `rgpd-score.value-object.ts` | **100%** | **≥ 85%** | Bloquant en CI |
| `rgpd_scorer.py` | **100%** | **≥ 85%** | Bloquant en CI |
| `regex_pii_detector.py` | **100%** | **≥ 85%** | Bloquant en CI |
| Use cases NestJS | **≥ 90%** | Non mesuré | Bloquant en CI |
| Controllers NestJS | **≥ 70%** | Non mesuré | Informatif |
| Composants React | **≥ 60%** | Non mesuré | Informatif |

---

## 12. Ce qu'on ne teste pas et pourquoi

| Ce qu'on ne teste pas | Raison |
|---|---|
| Les listes EasyList / Disconnect | Données tierces. On teste le **matcher** (l'algorithme), pas les données |
| Les migrations Flyway individuellement | Elles sont validées implicitement par les tests d'intégration qui tournent sur la DB migrée |
| Les snapshots React de chaque composant à 100% | Risque faible. Les tests de snapshot couvrent les régressions visuelles critiques |
| La logique interne de `chrome.webRequest` | C'est une API navigateur — on teste la logique qui **consomme** ses événements, pas l'API elle-même |
| Les bibliothèques tierces (Prisma, FastAPI, Pydantic) | Elles ont leurs propres tests. On teste notre **utilisation** d'elles |
| Les routes FastAPI de génération PDF (WeasyPrint) | Test E2E suffisant — la logique métier en amont est couverte unitairement |
