# Incident Runbook (Kurzfassung)

## 1) Wiederherstellung aus Backup
1. In **Backup** wechseln.
2. Letztes verifiziertes JSON-Backup auswählen und importieren.
3. System-Neustart abwarten.
4. Stichproben durchführen: Login, Kundenliste, Verträge.
5. Audit-Log auf `BACKUP_RESTORED` prüfen.

## 2) Benutzer-Sperrung / kompromittierter Account
1. Betroffenen Benutzer in **Benutzerverwaltung** öffnen.
2. Rolle auf minimale Rechte setzen (z. B. `viewer`) oder temporär Passwort ändern.
3. Benutzer informieren und 2FA neu aufsetzen.
4. Audit-Log auf `USER_RIGHTS_CHANGED` prüfen.

## 3) Rollback nach fehlerhafter Änderung
1. Fehlerzeitpunkt bestimmen (Ticket/Monitoring/Audit).
2. Vorheriges Backup (vor Fehlerzeitpunkt) importieren.
3. Kritische Datensätze validieren (Kunden, Verträge, Aufgaben).
4. Änderungsursache beheben und erst dann erneut deployen.

## 4) Health-Checks
- API-Fehlerquote > 10% => Incident eröffnen.
- Fehlgeschlagene Logins > 20/24h => Security-Review starten.
- Antwortzeiten signifikant erhöht => Client-/Storage-Analyse durchführen.
