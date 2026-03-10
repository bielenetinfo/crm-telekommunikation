# Merge-Regel

Ein Pull Request darf nur gemerged werden, wenn der GitHub-Check **CI / quality** erfolgreich (grün) ist.

## Empfohlene GitHub-Einstellung

In den Branch-Protection- oder Ruleset-Einstellungen für den Ziel-Branch:

1. **Require status checks to pass before merging** aktivieren.
2. Den Status-Check **CI / quality** als required check hinzufügen.
3. Optional: **Require branches to be up to date before merging** aktivieren.
