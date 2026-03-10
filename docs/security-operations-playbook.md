# Security & Operations Playbook

## 1) Rollen- und Rechtekonzept

### Rollen

- **Admin**: Vollzugriff auf alle Module, Benutzerverwaltung, Backup/Restore, Exporte, Löschungen.
- **Vertrieb**: Kunden- und Vertragsbearbeitung, kein User-/Backup-Admin.
- **Backoffice**: Operative Datenpflege, Reporting, kontrollierter Export.
- **Filialleiter**: Filialweite Steuerung inkl. Reporting und Backup/Restore.

### Modulzugriff (Soll-Konzept)

| Modul | Admin | Vertrieb | Backoffice | Filialleiter |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Kunden | ✅ | ✅ | ✅ | ✅ |
| Verträge | ✅ | ✅ | ✅ | ✅ |
| Benutzer | ✅ | ❌ | ❌ | ❌ |
| Backup/Restore | ✅ | ❌ | ❌ | ✅ |
| Reporting | ✅ | ❌ | ✅ | ✅ |
| Einstellungen | ✅ | ✅ | ✅ | ✅ |

### Feldzugriff (Soll-Konzept)

| Feldgruppe | Admin | Vertrieb | Backoffice | Filialleiter |
|---|---|---|---|---|
| Kundendaten (PII) | ✅ | ✅ | ✅ | ✅ |
| Vertrags-Finanzdaten | ✅ | ✅ | ✅ | ✅ |
| Security-/Benutzerfelder | ✅ | ❌ | ❌ | ❌ |

Technisch umgesetzt über `src/lib/accessControl.js` (Rollen, Module, Feldgruppen, Action-Permissions).

---

## 2) Absicherung sensibler Aktionen

### Betroffene Aktionen

- Löschung von Kunden / Verträgen
- Backup-Export
- Backup-Restore
- Hard Reset
- Vertragsänderungen (Prozessvorgabe, siehe unten)

### Sicherheitsmechanik

Für sensible Aktionen gilt:

1. **Aktive Bestätigung** (separate Sicherheitsabfrage).
2. **Pflicht-Angabe eines Grunds** via Prompt.
3. **Audit-Log-Eintrag** mit Actor, Aktion, Kontext, Ergebnis.

Technisch umgesetzt über:

- `src/lib/sensitiveActions.js`
- `src/lib/auditLog.js`

Bereits verdrahtet in:

- `src/pages/Backup.jsx` (Export/Import/Hard Reset)
- `src/pages/CustomerDetail.jsx` (Kunden-/Vertragslöschung)

### Vertragsänderungen (organisatorisch)

Zusätzlich zu UI-Checks gilt für produktive Vertragsänderungen:

- 4-Augen-Prinzip bei rückwirkenden oder finanziell kritischen Änderungen.
- Pflichtkommentar im Änderungsdialog (als Audit-Grund).
- Tägliche Stichprobe der Audit-Einträge durch Backoffice.

---

## 3) Backup-/Restore-Prozess testen (technisch + organisatorisch)

### Testplan (monatlich)

1. **Export-Test**
   - Export im Backup-Modul ausführen.
   - Dateigröße und JSON-Validität prüfen.
2. **Restore-Test in isolierter Umgebung**
   - Leere Umgebung (separates Browser-Profil / Staging).
   - Backup importieren.
   - Datenintegrität stichprobenartig gegen Referenz prüfen (Kunden, Verträge, Historie).
3. **Rollback-Test**
   - Defekt-Szenario simulieren.
   - Restore aus letzter gültiger Sicherung.
   - Zeit bis Wiederherstellung messen (RTO).
4. **Nachweisdokumentation**
   - Testdatum, Tester, Ergebnis, Auffälligkeiten, Maßnahmen.

### Organisatorische Mindestvorgaben

- Verantwortlicher je Filiale benennen.
- Vertretungsregel dokumentieren.
- Eskalationsweg bei fehlgeschlagenem Restore definieren.

---

## 4) Monitoring

### Frontend-Fehlertracking

- Globales Error- und Promise-Rejection-Handling aktiviert.
- Persistierung aggregierter Kennzahlen in `localStorage`.

### API-Fehlerraten

- API-Aufrufe werden über einen überwachten Client-Proxy erfasst.
- Kennzahlen: Anzahl Calls, Anzahl Errors, Error-Rate, Latenz.

### Performance-KPIs

- Browser `PerformanceObserver` für:
  - LCP (Largest Contentful Paint)
  - FID (First Input Delay)
  - CLS (Layout Shift)

Technisch umgesetzt in:

- `src/lib/monitoring.js`
- `src/api/base44Client.js`
- Initialisierung in `src/main.jsx`

---

## 5) Release-Prozess mit Staging & Rollback

### Standardprozess

1. Entwicklung in Feature-Branch.
2. Merge in Staging-Branch.
3. Deploy nach Staging.
4. Smoke-Test + kritische Business-Flows.
5. Go/No-Go Entscheidung.
6. Deploy nach Produktion.

### Rollback-Regeln

Rollback wird ausgelöst bei:

- >5% API-Fehlerrate über 10 Minuten,
- kritischem Datenverlust-/Konsistenzfehler,
- Login/Vertragsabschluss nicht möglich.

Rollback-Ablauf:

1. Deployment stoppen.
2. Letzten stabilen Build redeployen.
3. Falls nötig Restore des letzten validen Backups.
4. Incident protokollieren inkl. Root-Cause-Follow-up.

### Freigabekriterien (Minimum)

- Keine blocker Bugs aus Staging-Smoketest.
- Monitoring aktiv und validiert.
- Rollback-Verantwortlicher benannt.
- Backup-Restore-Test im laufenden Monat erfolgreich.
