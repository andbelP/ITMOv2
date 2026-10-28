# Implementation Plan: Problem Search by Title (UI)

**Branch**: `001-problem-search-ui` | **Date**: 2026-10-28 | **Spec**: [specs/001-problem-search-ui/spec.md](spec.md)

**Harmonized Contract**: [specs/001-problem-search-ui/contracts/problem-list-search.md](contracts/problem-list-search.md) | [specs/002-problem-search-backend/contracts/problems-search-api.md](../002-problem-search-backend/contracts/problems-search-api.md)

**Input**: Feature specification from `/specs/001-problem-search-ui/spec.md` (harmonized with Backend Feature 002)

## Summary

Implement problem search by title within the AlgoPlace frontend. The search coordinates with the backend `GET /api/problems?q=<query>` endpoint via an updated `apiService.getProblems(query)` client method, employs debouncing (250–300ms) to prevent network storms during typing, provides robust offline/fallback filtering against `MOCK_PROBLEMS`, equips the `ProblemList` component with accessible controls (`aria-label`, placeholder, Escape key support, `X` clear button), and renders an intuitive empty state when no titles match.

## Technical Context

**Language/Version**: TypeScript 5.8+ / React 19

**Primary Dependencies**: React 19, Lucide React (Search, X, Sparkles icons), Tailwind CSS (v4)

**Storage / State**: React component state (`useState`, `useCallback`, `useTransition` / debounce timer)

**Testing**: Vitest 3.x, `@testing-library/react`, `@testing-library/jest-dom`

**Target Platform**: Modern Web Browsers (Chromium, Firefox, Safari)

**Project Type**: Web application (Frontend UI component & API client)

**Performance Goals**: Instant query typing response, debounced backend requests (250–300ms), zero UI stutter or latency

**Constraints**: Strict title-only search matching (excluding categories/tags), URL parameter encoding (`encodeURIComponent`), 100% backward compatibility when search query is empty

**Scale/Scope**: Frontend catalog search interacting with backend REST API and offline mock store

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Requirement | Status | Evaluation |
|---|---|---|---|
| **I. Execution Sandboxing** | Untrusted code isolated, timeouts capped | PASS | UI and API client search; no untrusted code execution |
| **II. Zero-Dependency Backend** | Go standard library, no unnecessary endpoints | PASS | Consumes standard `GET /api/problems?q=` without custom frameworks |
| **III. Mandatory Verification** | `./scripts/verify-tests.sh` passes code 0 | PASS | Full suite verified; Vitest component tests and Go backend tests pass |
| **IV. Dual-Mode Judge** | Run & Submit flows preserved | PASS | Problem navigation, workspace, and runner execution remain untouched |
| **V. Modern & Accessible UI** | React 19, Tailwind CSS, accessible controls | PASS | Uses accessible `aria-label`, placeholder, clear button, and keyboard Escape navigation |

## Project Structure

### Documentation (this feature)

```text
specs/001-problem-search-ui/
├── plan.md              # Implementation plan (this file)
├── research.md          # Technical research & harmonized decisions
├── data-model.md        # Component state, API parameters, and data flows
├── quickstart.md        # Validation & test execution guide
├── contracts/           # Component interface & unified search contract
│   └── problem-list-search.md
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── ProblemList.tsx       # Search input, debounce, clear button & table rendering
│   │   └── ProblemList.test.tsx  # Unit, debouncing, & interaction tests
│   ├── services/
│   │   └── api.ts                # getProblems(query?: string) with ?q= & mock fallback
│   ├── App.tsx                   # App integration with search query state & loadProblems
│   └── types/
│       └── problem.ts            # Problem model definition
```

**Structure Decision**: Frontend modifications across `frontend/src/services/api.ts` (API client), `frontend/src/components/ProblemList.tsx` (UI controls & rendering), and `frontend/src/App.tsx` (search query orchestration).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | N/A |
