# Base44 App

## CI / Quality Gate
- Die Pipeline liegt in `.github/workflows/ci.yml` und führt `npm ci`, Lint, Typecheck, Build und Smoke-Tests aus.
- Für reproduzierbare Installationen wird ausschließlich `npm ci` mit `package-lock.json` verwendet.
- Branch-Protection-Konfiguration ist in `.github/settings.yml` hinterlegt (für Probot Settings App) und verlangt grüne Statuschecks vor Merge.

## Smoke-Tests
- Smoke-Tests für kritische Flows liegen in `tests/smoke-flows.test.mjs`:
  - Login-Flow
  - Kundenliste
  - Navigation zu Kundendetails
  - Navigation zu Vertragsdetails

Ausführung lokal:

```bash
npm ci
npm run test:smoke
```

## Einfaches Monitoring nach Release
`src/lib/monitoring.js` protokolliert:
- globale JavaScript-Fehler (`window.error`)
- unbehandelte Promise-Rejections (`window.unhandledrejection`)
- Session-Resume Ereignisse
- App-Start (`app.boot`)

Events werden in `localStorage` unter `crm_monitoring_events` gespeichert und zusätzlich per `console.info` ausgegeben.
