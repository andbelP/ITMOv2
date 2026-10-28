# Quickstart Validation Guide: Problem Search by Title (Backend)

This document provides step-by-step procedures to validate the backend problem title search and extensible filter criteria feature, harmonized with the frontend API contract.

---

## Prerequisites

- Go 1.22+ installed
- Working directory: repository root (`/home/andbel/Projects/AlgoPlace`)

---

## Automated Test Verification

Run the Go backend test suite targeting handler, repository, and model search capabilities:

```bash
cd backend
go test -v ./internal/handlers -run TestGetProblems_Search
go test -v ./internal/repository -run TestProblemSearch
go test -v ./internal/models -run TestProblemFilter
```

### Expected Outcome:
- All unit tests pass with `PASS` status.
- Specific scenarios verified:
  1. Title substring match (e.g., query `"Two"` matches `"Two Sum"`).
  2. Case-insensitivity (e.g., query `"two"` or `"TWO"` matches `"Two Sum"`).
  3. Whitespace trimming (e.g., query `"  Two  "` matches `"Two Sum"`).
  4. Empty query or absent query parameter returns all problems without filtering.
  5. Negative query (e.g., `"NonExistentXYZ"`) returns an empty JSON slice `[]` (HTTP 200).
  6. Query alias support (`?query=` operates identically to `?q=`).
  7. Hidden problem protection (hidden problems remain inaccessible to non-admin callers during search).

---

## Full Repository Verification Suite

Execute the mandatory repository verification hook:

```bash
./scripts/verify-tests.sh
```

### Expected Outcome:
- Frontend builds cleanly via `vite build` (`tsc -b`).
- Backend unit and sandbox execution tests all pass.
- Script outputs `[HOOK PASSED] All tests & builds passed!`.

---

## Manual HTTP / cURL Verification

1. Start the backend server locally:
   ```bash
   cd backend && go run cmd/server/main.go
   ```

2. Test title search with query parameter `q` (as invoked by `frontend/src/services/api.ts`):
   ```bash
   curl -s "http://localhost:8080/api/problems?q=Two" | jq .
   ```
   *Expected*: Array containing only problems whose title contains "Two".

3. Test case-insensitivity:
   ```bash
   curl -s "http://localhost:8080/api/problems?q=two" | jq .
   ```
   *Expected*: Identical results to uppercase query.

4. Test empty query (backwards compatibility):
   ```bash
   curl -s "http://localhost:8080/api/problems" | jq 'length'
   ```
   *Expected*: Total count of all accessible problems.

5. Test negative match:
   ```bash
   curl -s "http://localhost:8080/api/problems?q=DoesNotExistAtAll" | jq .
   ```
   *Expected*: `[]` (empty JSON array).
