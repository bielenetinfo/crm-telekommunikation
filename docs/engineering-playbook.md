# Engineering Playbook

Dieses Dokument definiert verbindliche Qualitäts- und Delivery-Standards für das CRM-Projekt.

## 1) Testpyramide

Wir nutzen eine verbindliche Testpyramide mit klaren Verantwortlichkeiten:

### Unit-Tests (Basis, hoher Anteil)
- **Ziel:** Utilities, Validierungen, Mapper, Domain-/Business-Logik.
- **Geschwindigkeit:** sehr schnell, lokal bei jeder Änderung.
- **Ownership:** Entwickler:in des Features.
- **Scope-Beispiele:** Tarifberechnung, Status-Transitionen, Pflichtfeldlogik, SLA-Berechnungen.

### Integrationstests (mittlerer Anteil)
- **Ziel:** Formflows über mehrere Komponenten/Schichten.
- **Fokus:** Datenfluss, Validierungen, API-Interaktionen (gemockt), Fehlerfälle.
- **Scope-Beispiele:** Lead-Formular mit Pflichtfeldern, Vertragsformular inklusive Plausibilisierung.

### E2E-Tests (kleiner, kritischer Anteil)
- **Ziel:** Kernprozesse aus Anwendersicht.
- **Verpflichtender Kernprozess:** **Kunde anlegen → Vertrag erstellen → Task erzeugen**.
- **Fokus:** Produktive User Journey, Rechte/Rollen, kritische Regressionen.

### Zielverteilung (Richtwert)
- Unit: **~70%**
- Integration: **~20%**
- E2E: **~10%**

## 2) Definition of Done (DoD) pro Feature

Ein Feature gilt erst als „Done“, wenn **alle** Punkte erfüllt sind:

1. **Tests**
   - Relevante Unit-/Integrations-Tests ergänzt oder angepasst.
   - Betroffener E2E-Pfad aktualisiert, falls Kernprozess berührt wird.
2. **UX-Check**
   - Visuelle Konsistenz mit bestehendem UI.
   - Leerer/Fehler-/Loading-State geprüft.
3. **Rechtecheck**
   - Rollen-/Berechtigungslogik validiert (kein unautorisierter Zugriff).
4. **Logging & Observability**
   - Relevante Ereignisse/Fehler werden nachvollziehbar geloggt.
5. **Changelog**
   - Nutzerrelevante Änderung in `CHANGELOG.md` ergänzt.

## 3) CI-Pipeline (Pflichtchecks vor Merge)

Jeder Pull Request muss erfolgreich durch folgende Pflichtchecks laufen:

1. **Lint** (`npm run lint`)
2. **Typecheck** (`npm run typecheck`)
3. **Build** (`npm run build`)
4. **Tests** (`npm run test`)

Regel: **Kein Merge bei rotem Check**.

## 4) Monatliche Bug-Triage

Es gibt eine feste, monatliche Bug-Triage mit folgenden Pflichtfeldern:

- **Schweregrad:**
  - `S1 Kritisch` (Produktion blockiert / Datenverlust)
  - `S2 Hoch` (Kernfunktion gestört, Workaround eingeschränkt)
  - `S3 Mittel` (eingeschränkte Funktion, Workaround vorhanden)
  - `S4 Niedrig` (kosmetisch/geringe Auswirkung)
- **SLA je Schweregrad:**
  - S1: 24h bis Erstmaßnahme
  - S2: 3 Arbeitstage
  - S3: 10 Arbeitstage
  - S4: nach Kapazität
- **Verantwortliche:**
  - Jede Bug-Karte erhält einen klaren Owner (Engineering) + Reviewer (Product/QA).

Triage-Output:
- Priorisierte Bug-Liste für den nächsten Sprint.
- Eskalationsliste für SLA-Verstöße.

## 5) Feature-Planung in vertikalen Scheiben

Features werden nicht als technische Großumbauten geplant, sondern als **kleine vertikale End-to-End-Slices**:

- Pro Sprint: mindestens **ein kompletter Workflow-Endpunkt** (UI → Logik → Persistenz/Integration).
- Jede Scheibe liefert direkt nutzbaren Kundennutzen.
- Große Refactorings nur flankierend und mit klarer Nutzenhypothese.

Beispiel:
- Statt „komplettes Vertragsmodul neu bauen“
- lieber „Vertragsanlage für Segment X inkl. Validierung und Task-Erstellung vollständig auslieferbar“.
