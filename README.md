# CRM Telekommunikation

Lokales CRM-System für Telekommunikations-Vertrieb (Kunden, Verträge, VVL, Aufgaben).

## Voraussetzungen

- Node.js **20.x** (empfohlen)
- npm **10.x** oder neuer

## Lokale Entwicklung

### 1) Abhängigkeiten installieren

```bash
npm ci
```

### 2) Dev-Server starten

```bash
npm run dev
```

Standardmäßig läuft Vite lokal (typisch auf `http://localhost:5173`).

### 3) Login im Dev-Modus

Für lokale Entwicklung ist ein Dev-Bypass implementiert:

- E-Mail: `admin@bielenet.de`
- Passwort: `admin`

## Qualitätschecks (lokal wie in CI)

### Lint

```bash
npm run lint
```

### Typecheck

```bash
npm run typecheck
```

### Production Build

```bash
npm run build
```

## E2E-Tests (Playwright)

Es gibt einen minimalen E2E-Flow für:

1. Login
2. Kunde anlegen
3. Vertrag erstellen

Datei: `tests/e2e/crm-flows.spec.js`.

### E2E lokal ausführen

```bash
npm run e2e
```

Optional mit sichtbarem Browser:

```bash
npm run e2e:headed
```

> Hinweis: Der Test seeded die LocalStorage-DB (inkl. Filiale + Provider), damit der Flow in einer frischen Umgebung stabil läuft.

## CI (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

Pipeline-Jobs:

- **Lint, Typecheck & Build**
  - `npm ci`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
- **E2E (Playwright)**
  - Browser-Installation (Chromium)
  - `npm run e2e`

## Pull-Request-Prozess

- PR-Template mit Checkliste: `.github/pull_request_template.md`
- Branch-Protection-Doku: `docs/branch-protection.md`

Empfehlung: Merge in `main` nur mit grünen Pflichtchecks.
