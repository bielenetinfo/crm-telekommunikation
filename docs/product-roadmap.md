# Product Roadmap

## Ziel des Dokuments
Diese Roadmap priorisiert die Entwicklung entlang eines klaren Go-to-Market-Pfads für ein CRM im Telekommunikationsvertrieb. Fokus ist: erst den vertrieblichen Kern stabil in Produktion bringen, danach automatisieren und anschließend skalieren.

---

## Phase 1 – Vertriebs-Kern

### Zielgruppe
- Vertriebsmitarbeitende im operativen Tagesgeschäft
- Teamleitungen, die Pipeline und Aktivität überwachen
- Backoffice, das Kundendaten und Verträge pflegt

### Must-have Features
- **Kundenverwaltung**: Kunden anlegen, suchen, filtern, bearbeiten, Detailansicht.
- **Vertragsverwaltung**: Verträge anlegen, Laufzeiten/Status pflegen, Detailansicht.
- **Aufgabenmanagement**: Aufgaben erstellen, zuweisen, priorisieren, Status nachverfolgen.
- **Dashboard**: Überblick über Tagesgeschäft (offene Aufgaben, wichtige Kennzahlen, nächste Aktionen).
- **VVL-Basisansicht** (aus Navigation abgeleitet): Fällige Verlängerungen sichtbar und bearbeitbar.
- **Stabile mobile Kernnavigation** über die Haupt-Tabs (Start, Kunden, VVL, Verträge, Mehr).

### Seiten, die in Phase 1 produktionsreif sein müssen (abgeleitet aus Navigation)
Aus der Routing-Definition und mobilen Bottom-Navigation ergeben sich folgende produktionskritische Seiten:
- `/` (**Dashboard**) – primärer Einstieg.
- `/customers` inkl. Detailfluss (`/customers/:id` bzw. Detailansicht innerhalb der Seite).
- `/contracts` inkl. Detailseiten (`/contracts/:id`).
- `/vvl` (**VvlDashboard**) – eigener Haupt-Tab in Mobile.
- `/tasks` – unter „Mehr“ als Kernfunktion für operative Arbeit.
- `/settings` – erreichbar über „Mehr“, mindestens stabil für Basis-Konfiguration/Navigation.

> Begründung: Diese Bereiche sind entweder direkt als Haupt-Tabs in `BottomTabBar` verankert oder im zentralen Routing als Kernpfade hinterlegt und damit Teil der täglichen Primärnutzung.

### Exit-Kriterien („done when …“)
Phase 1 ist abgeschlossen, **wenn**:
1. Alle oben genannten Kernseiten ohne Blocker erreichbar sind (Desktop + Mobile).
2. Kritische Kernflows Ende-zu-Ende funktionieren:
   - Kunde anlegen/finden/öffnen,
   - Vertrag anlegen/öffnen,
   - Aufgabe erstellen/abschließen,
   - VVL-Fall identifizieren und als bearbeitet markieren.
3. Dashboard zeigt verlässliche, aktuelle Basiskennzahlen.
4. Es existieren keine Sev-1/Sev-2 Bugs in den Kernflows.
5. Mindestens ein internes Pilotteam arbeitet täglich produktiv ausschließlich in diesen Flows.

---

## Phase 2 – Automatisierung

### Zielgruppe
- Bestehende Vertriebsteams aus Phase 1
- Teamleitungen mit Fokus auf Prozessqualität und Nachverfolgung

### Must-have Features
- **Reminder-System** für Fristen, Rückrufe, Verlängerungen.
- **VVL-Prozesse** mit klaren Status-Übergängen und Wiedervorlagen.
- **Vorlagen/PDF** für standardisierte Kommunikation und Dokumente.
- **Teilautomatisierte Aufgabenanlage** aus Triggern (z. B. nahendes Vertragsende).

### Exit-Kriterien („done when …“)
Phase 2 ist abgeschlossen, **wenn**:
1. Reminder zuverlässig und nachvollziehbar ausgelöst werden.
2. VVL-Prozess als standardisierter Workflow in der Fläche genutzt wird.
3. Vorlagen/PDFs ohne manuelle Nacharbeit in realen Fällen einsetzbar sind.
4. Mindestens 30–40 % weniger manuelle Wiederholungsarbeit im Vergleich zu Phase 1 anfällt (intern gemessen).

---

## Phase 3 – Skalierung

### Zielgruppe
- Wachsende Organisationen mit mehreren Teams/Standorten
- Admins, Compliance-Verantwortliche, Operations

### Must-have Features
- **Rollen/Rechte** mit sauberer Zugriffstrennung (Least Privilege).
- **Auditing**: revisionssichere Änderungs- und Zugriffshistorie.
- **Integrationen**: Anbindung externer Systeme (z. B. Telefonie, E-Mail, DMS, ERP/Abrechnung).
- **Mandanten-/Teamfähigkeit** (falls organisatorisch erforderlich).

### Exit-Kriterien („done when …“)
Phase 3 ist abgeschlossen, **wenn**:
1. Rollenmodell produktiv aktiv ist und unberechtigte Zugriffe verhindert.
2. Relevante Aktionen auditierbar protokolliert sind.
3. Kern-Integrationen stabil laufen und operative Doppelpflege reduzieren.
4. Onboarding neuer Teams/Standorte ohne Sonderprozesse möglich ist.

---

## Not-now-Backlog (bewusst geparkt)
Diese Themen werden **nicht spontan** umgesetzt, solange sie nicht priorisiert und einer Phase zugeordnet sind:

- KI-Features (Lead-Scoring, automatische Gesprächszusammenfassungen)
- Gamification im Vertrieb
- Vollständige BI-/Data-Warehouse-Initiative
- Komplexe Marketing-Automation
- White-Labeling/Mehrmarkenfähigkeit
- Individuelle Sonderworkflows pro Team ohne gemeinsamen Standard
- Native Mobile Apps (iOS/Android), solange Web-App Kernanforderungen erfüllt
- Experimentelle UI-Redesigns ohne klaren Business Case

## Priorisierungsregel für neue Ideen
Neue Ideen werden nur umgesetzt, wenn sie:
1. einem aktiven Phasenziel dienen,
2. ein definiertes Exit-Kriterium verbessern,
3. und in Kapazität/Impact gegen bestehende Prioritäten bestehen.

Ansonsten wandern sie in das Not-now-Backlog mit kurzer Begründung und Review-Termin.
