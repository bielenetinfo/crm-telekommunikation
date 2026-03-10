# Rollen- und Berechtigungsmatrix (RBAC)

## Rollen

### `admin`
- Benutzerverwaltung (`manage_users`)
- Vertragslöschung (`delete_contract`)
- Datenexport (`export_data`)
- Datenimport (`import_data`)
- System-Reset (`reset_system`)

### `user`
- Keine administrativen Sonderrechte.
- Darf nur allgemeine Funktionen ohne kritische Admin-Aktionen ausführen.

## Kritische Aktionen und Schutz

| Aktion | Permission | Frontend-Guard | Serverseitige Prüfung |
|---|---|---|---|
| Benutzerverwaltung (Users/UserDetail) | `manage_users` | `RequirePermission` in Routen + UI-Ausblendung | `auth.createUser`, `entities.User.list/get/create/delete` |
| Vertragslöschung | `delete_contract` | Delete-Buttons im `ContractDetail` nur mit Recht sichtbar | `entities.Contract.delete` |
| Export/Import/Reset | `export_data` / `import_data` / `reset_system` | Buttons in Backup deaktiviert/ausgeblendet über Rechte | `system.exportData/importData/resetData` |

## Hinweise
- Frontend-Prüfungen verbessern UX und verhindern versehentliche Klickpfade.
- Kritische Checks werden zusätzlich im SDK erzwungen (Defense-in-Depth), damit direkte API-Aufrufe ohne Recht ebenfalls blockiert werden.
