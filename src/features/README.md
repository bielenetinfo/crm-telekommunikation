# Feature-Ordner (Domain-first Struktur)

Diese Struktur trennt Seiten-Orchestrierung (`src/pages`) von fachlicher Implementierung (`src/features`).

## Kernbereiche

- `customers`
- `contracts`
- `users`
- `branches`
- `tasks`

Jedes Feature kann folgende Unterordner nutzen:

- `queries/` – React-Query Hooks und Query-Keys
- `api/` – optionale API-Adapter
- `model/` oder `lib/` – fachliche Transformationen, Formatter, Berechnungen
- `components/` – UI-Bausteine des Features
- `hooks/` – wiederverwendbare Form-/View-Hooks

## Referenzmigration: `customers`

1. `src/pages/Customers.jsx` und `src/pages/CustomerDetail.jsx` sind nur noch schlanke Wrapper.
2. Die eigentliche Umsetzung liegt in `src/features/customers/components/*`.
3. Datenzugriffe laufen über React-Query Hooks in `src/features/customers/queries/customerQueries.js`.
4. Wiederverwendbare Formularlogik wurde in `useCustomerForm` ausgelagert.

## Team-Konvention

- Keine direkten `base44.entities.*` Aufrufe mehr in `src/pages/*`.
- Neue Feature-Logik zuerst im passenden Feature-Ordner implementieren.
- Seiten unter `src/pages` dienen nur Routing, Layout und Zusammensetzung von Feature-Komponenten.
