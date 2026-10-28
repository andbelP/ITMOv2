# Quickstart Validation Guide: Problem Search by Title (UI)

This document provides step-by-step procedures to validate the problem title search feature in the frontend, harmonized with the backend `GET /api/problems?q=<query>` API.

## Prerequisites

- Node.js (v20+) and npm installed
- Working directory: repository root (`/home/andbel/Projects/AlgoPlace`)

## Automated Test Verification

Run the frontend test suite targeting the problem list component:

```bash
cd frontend
npm run test -- ProblemList.test.tsx
```

### Expected Outcome:
- All unit tests in `ProblemList.test.tsx` pass.
- Specific scenarios verified:
  1. Title substring match (e.g., query "Two" matches "Two Sum").
  2. Case-insensitive matching (e.g., query "palindrome" matches "Valid Palindrome").
  3. No cross-field false positives (e.g., query "Arrays" does NOT match "Two Sum" when its title does not contain "Arrays").
  4. Trimming whitespace around query.
  5. Clear button and Escape key resets search.
  6. Empty state message shown when no titles match (`"No problems found matching \"<searchTerm>\""`).
  7. Debounced search callback dispatches trimmed query.

## Full Repository Verification Suite

Run the mandatory project verification hook to ensure no regressions across frontend and backend:

```bash
./scripts/verify-tests.sh
```

### Expected Outcome:
- Frontend builds cleanly via `vite build` (`tsc -b` check passes).
- Backend unit and sandbox tests pass.
- Script outputs `[HOOK PASSED] All tests & builds passed!`.

## Manual Interactive Verification

1. Start both backend and frontend servers:
   ```bash
   # Terminal 1: Backend
   cd backend && go run cmd/server/main.go

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```
2. Open the browser at `http://localhost:5173`.
3. Locate the search box in the problem catalog table header.
4. **Test Search**: Type `"Sum"`. Verify in the browser Network tab that `GET /api/problems?q=Sum` is requested after typing pauses, and only problems with "Sum" in their title remain visible (e.g., "Two Sum").
5. **Test Case Insensitivity**: Type `"valid"`. Verify "Valid Palindrome" is displayed.
6. **Test Negative Query**: Type `"xyz123"`. Verify an empty state message is shown with a clear button.
7. **Test Clear Flow**: Click the `X` clear icon or press `Escape`. Verify input is cleared and the full catalog is restored immediately.
