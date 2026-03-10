# Branch-Schutzregeln (GitHub)

Diese Regeln stellen sicher, dass nur mit **grünen Checks** in `main` gemergt werden kann.

## Empfohlene Regeln für `main`

1. **Require a pull request before merging** aktivieren.
2. **Require status checks to pass before merging** aktivieren.
3. Als verpflichtende Checks eintragen:
   - `Lint, Typecheck & Build`
   - `E2E (Playwright)`
4. **Require branches to be up to date before merging** aktivieren.
5. Optional (empfohlen):
   - `Require conversation resolution before merging`
   - `Require linear history`
   - `Include administrators`

## Einrichtung per GitHub UI

`Settings -> Branches -> Branch protection rules -> Add rule`

Pattern: `main`

## Einrichtung per GitHub CLI (Beispiel)

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/<owner>/<repo>/branches/main/protection \
  -f required_status_checks.strict=true \
  -F required_status_checks.contexts[]='Lint, Typecheck & Build' \
  -F required_status_checks.contexts[]='E2E (Playwright)' \
  -f enforce_admins=true \
  -f required_pull_request_reviews.required_approving_review_count=1 \
  -f restrictions='null'
```
