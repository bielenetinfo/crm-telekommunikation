# FUNCTION_QA_REPORT.md

## Test Environment
- **Start Command**: `source ~/.zshrc && npm run dev`
- **URL**: `http://localhost:5174` (Port 5173 was in use)
- **Database**: Simulated LocalStorage (`bielenet-sdk.js`)
- **Seeds**: `mockData.js` + `bielenet-sdk.js` `seed()` function.
- **Test User**: `admin@bielenet.de` / `admin`

## Functional Modules Overview
Das System ist als "Single Page Application" (SPA) aufgebaut.
Implementierte Module:
1.  **Auth**: Login, Logout, Session Management (LocalStorage).
2.  **Dashboard**: KPI Widgets, Activity Feed.
3.  **Kunden**: Liste, Suche, Erstellen (Wizard), Details, Bearbeiten.
4.  **Verträge**: Liste, Details, Erstellen.
5.  **VVL**: Dashboard für Vertragsverlängerungen.
6.  **Historie/Aufgaben**: Timeline, Quick-Add.
7.  **Dokumente**: DSGVO Upload Logik.

## Testlauf – Funktionsabdeckung

### 1. Authentication & Session
| Feature | Input | Expected | Actual | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Login | `admin@bielenet.de` / `admin` | Dashboard Load | Dashboard geladen | ✅ PASS | Redirect funktioniert korrekt. |
| Logout | Klick Profil -> Abmelden | Login Page | Login Page | ✅ PASS | Session wird bereinigt. |
| Session Persist | Seite neu laden | Bleibt eingeloggt | Bleibt eingeloggt | ✅ PASS | - |

### 2. Kunden (Customers)
| Feature | Input | Expected | Actual | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Create Customer | Form Step 1 (Basisdaten) | Button "Weiter" active | Button bleibt disabled | 🔴 FAIL | **CRITICAL BLOCKER**: Formular validiert nicht. Ursache: Fehlende `branches` Daten verhindern Auswahl der Pflicht-Filiale. |
| Customer List | Navigation | Liste laden | Liste geladen (9 Kunden) | ✅ PASS | Mock-Daten werden korrekt angezeigt. |
| Search | "Mustermann" | Filtered List | Filtered List | ✅ PASS | Suche funktioniert. |
| Detail View | Klick auf Kunde | Detail Page | Detail Page | ✅ PASS | - |

### 3. Verträge (Contracts)
| Feature | Input | Expected | Actual | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| List View | Navigation | Liste Verträge | Liste geladen | ✅ PASS | - |
| Create Contract | Via Customer Detail | Form open | - | ⚠️ BLOCKED | Blockiert durch Customer Creation Issues (Test konnte nicht vollständig durchgeführt werden). |

### 4. VVL & Dashboard
| Feature | Input | Expected | Actual | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Dashboard | Load | Stats Widgets | Stats sichtbar | ✅ PASS | Daten aus Mock korrekt aggregiert. |
| VVL Checks | Navigation | VVL Pipeline | Page geladen | ✅ PASS | - |

---

## Bugs & Auffälligkeiten

### 🟥 P1: Kunden-Anlage blockiert (Seeding Bug)
*   **Priorität**: **CRITICAL**
*   **Problem**: Im Formular "Neuer Kunde" bleibt der Button "Weiter zu DSGVO" deaktiviert, selbst wenn alle sichtbaren Felder ausgefüllt sind.
*   **Ursache**: Das Feld `Filiale` (`branch_id`) ist Pflicht. Die Dropdown-Liste ist jedoch leer, weil die `seed()`-Funktion in `bielenet-sdk.js` **nur läuft, wenn `customers` leer sind**.
    *   Szenario: Wenn Kunden existieren (z.B. aus MockData oder persistiert), aber `branches` noch nicht initialisiert wurden (Daten-Inkonsistenz), wird `branches` nie befüllt.
    *   Folge: User kann keine Filiale wählen -> Formular invalid -> Button disabled.
*   **Repro**: `localStorage` mit Kunden befüllen, aber `branches` leer lassen -> Neuer Kunde -> Filiale Dropdown ist leer.
*   **Fix**: `seed()` Logik anpassen, sodass `branches` separat geprüft/gefüllt werden, auch wenn Kunden existieren.

### 🟧 P2: Fehlende UI-Validierungshinweise
*   **Priorität**: **HIGH**
*   **Problem**: Wenn der "Weiter"-Button disabled ist, gibt es keinerlei Hinweis darauf, *welches* Feld fehlt.
*   **Verbesserung**: Button nicht disablen, sondern bei Klick Validierungsfehler anzeigen (Toast oder Field-Highlight).

### 🟨 P3: Google Maps API Missing
*   **Priorität**: **MEDIUM**
*   **Problem**: Konsole zeigt `Google Maps API Key fehlt` oder `Date not loaded`.
*   **Folge**: Adress-Autocomplete funktioniert nicht (Fallback auf manuelle Eingabe geht, ist aber weniger komfortabel).
*   **Fix**: `.env` Variable `VITE_GOOGLE_MAPS_API_KEY` prüfen/setzen.

---

## Fazit
Das System ist funktional grundsätzlich lauffähig (Auth, Listing, Details), jedoch ist der **Kernprozess "Neuer Kunde" aktuell durch einen Logik-Fehler im Data-Seeding blockiert**. Dies verhindert effektiv das Onboarding neuer Kunden in einer Umgebung mit bestehenden Altdaten.

**Empfohlene nächste Schritte für Entwickler:**
1.  **Hotfix Seeding**: `src/lib/bielenet-sdk.js` anpassen, damit `branches` robust initialisiert werden.
2.  **UX Fix Formular**: Validation-Feedback verbessern (Button immer klickbar machen -> Check -> Error anzeigen).
