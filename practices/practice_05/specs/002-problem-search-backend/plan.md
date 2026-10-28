# Implementation Plan: Problem Search by Title (Backend)

**Branch**: `002-problem-search-backend` | **Date**: 2026-10-28 | **Spec**: [specs/002-problem-search-backend/spec.md](spec.md)

**Harmonized Contract**: [specs/002-problem-search-backend/contracts/problems-search-api.md](contracts/problems-search-api.md) | [specs/001-problem-search-ui/contracts/problem-list-search.md](../001-problem-search-ui/contracts/problem-list-search.md)

**Input**: Feature specification from `specs/002-problem-search-backend/spec.md` (harmonized with Frontend Feature 001)

## Summary

Implement backend search for problems by title substring on `GET /api/problems?q=<query>`. The technical approach introduces an extensible `ProblemFilter` criteria model in `internal/models`, updates the repository abstraction (`internal/repository` and `internal/handlers/interfaces.go`) to accept filtering options, and wires parameter parsing into `APIHandler.GetProblems` with case-insensitive matching, whitespace normalization, and 100% backwards compatibility when queries are omitted. This endpoint serves as the backend provider for the frontend search UI specified in `specs/001-problem-search-ui`.

## Technical Context

**Language/Version**: Go 1.22+  
**Primary Dependencies**: None (Standard Library `net/http`, `strings`, `database/sql`, `encoding/json` per Constitution Principle II)  
**Storage**: PostgreSQL 16 (`internal/repository/postgres.go`) with in-memory `ProblemRepository` (`internal/repository/problems.go`) fallback/test doubles  
**Testing**: Go standard testing package (`testing`, `net/http/httptest`)  
**Target Platform**: Linux (Docker container `algoplace-backend` / Linux host)  
**Project Type**: REST API Web Service  
**Performance Goals**: < 50ms response for problem search queries  
**Constraints**: Zero-external web frameworks, parameterized SQL queries preventing SQL injection, standardized JSON responses, preserve role-based access control.  
**Scale/Scope**: Current catalog ~10-100 problems, extensible to 10,000+ problems without schema alterations.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | Notes |
|---|:---:|---|
| **I. Strict Execution Sandboxing & Security** | PASS | Does not execute untrusted code; all database queries use parameterized inputs (`$1`) to eliminate SQL injection vulnerabilities. |
| **II. Zero-External-Dependency Idiomatic Backend** | PASS | Implemented strictly in standard Go (`net/http`) within existing modular package boundaries (`models`, `handlers`, `repository`). |
| **III. Mandatory Automated Verification** | PASS | All changes verified via `./scripts/verify-tests.sh` prior to conclusion. |
| **IV. Seamless Dual-Mode Online Judge Protocol** | PASS | Runner execution protocols and submission endpoints are unaffected. |
| **V. Modern, Responsive UI** | PASS | Decoupled REST contract; directly supplies the frontend search UI with debounced query results. |

## Project Structure

### Documentation (this feature)

```text
specs/002-problem-search-backend/
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 decisions & alternatives
├── data-model.md        # Phase 1 data entities and validation rules
├── quickstart.md        # Phase 1 validation and run guide
├── contracts/           # Phase 1 API specifications & client integration
│   └── problems-search-api.md
├── checklists/
    └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 task checklist
```

### Source Code Layout

```text
backend/
├── internal/
│   ├── models/
│   │   ├── problem.go          # ProblemFilter criteria model and matching logic
│   │   └── models_test.go      # Model serialization & filter logic tests
│   ├── handlers/
│   │   ├── api.go              # Query parameter parsing (?q=, ?query=) in GetProblems
│   │   ├── interfaces.go       # Database interface updated with GetProblems(filter, includeHidden)
│   │   └── api_test.go         # API handler unit tests for search matching and edge cases
│   └── repository/
│       ├── postgres.go         # Parameterized ILIKE search implementation for PostgreSQL
│       ├── problems.go         # In-memory ProblemRepository search method
│       └── problems_test.go    # Unit tests for repository filtering
```

**Structure Decision**: Modular backend packages in `backend/internal/` adhering to standard Go idiomatic patterns and Constitution Principle II.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | N/A | N/A |
