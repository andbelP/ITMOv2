# Tasks: Problem Search by Title (Backend)

**Input**: Design documents from `specs/002-problem-search-backend/` (`plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/problems-search-api.md`, `quickstart.md`), harmonized with `specs/001-problem-search-ui/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/problems-search-api.md`, `quickstart.md`  
**Tests**: Unit tests are included per Constitution Principle III and project testing guidelines.  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Every task includes exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline verification before modifications

- [X] T001 Verify backend environment and baseline tests via `./scripts/verify-tests.sh`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model and interface abstractions that MUST be completed before any user story can be implemented

**⚠️ CRITICAL**: Foundational tasks must be completed before user story tasks begin

- [X] T002 Define `ProblemFilter` struct with `Query string`, `Difficulty Difficulty`, `Category string`, `Limit int`, `Offset int` in `backend/internal/models/problem.go`
- [X] T003 [P] Implement `IsEmpty() bool` and `Matches(p Problem) bool` helper methods in `backend/internal/models/problem.go`
- [X] T004 [P] Add unit tests for `ProblemFilter` matching logic in `backend/internal/models/models_test.go`
- [X] T005 Update `Database` interface to include `GetProblems(filter models.ProblemFilter, includeHidden bool) ([]models.Problem, error)` in `backend/internal/handlers/interfaces.go`
- [X] T006 Update `MockDB` in `backend/internal/handlers/api_test.go` to implement `GetProblems` and delegate `GetAllProblems`

**Checkpoint**: Foundation ready — user story implementation can now proceed.

---

## Phase 3: User Story 1 - Find Problems by Title Substring via Backend API (Priority: P1) 🎯 MVP

**Goal**: Enable API clients (including AlgoPlace UI `apiService.getProblems`) to pass a search query (`?q=` or `?query=`) to `GET /api/problems` and receive problems whose title contains the substring (case-insensitive).

**Independent Test**: Send `GET /api/problems?q=Two` and assert that only "Two Sum" is returned in the response list with status 200 OK.

### Implementation for User Story 1

- [X] T007 [P] [US1] Implement `GetFiltered(filter models.ProblemFilter) []models.Problem` in `backend/internal/repository/problems.go`
- [X] T008 [P] [US1] Add unit tests for `ProblemRepository.GetFiltered` title matching in `backend/internal/repository/problems_test.go`
- [X] T009 [US1] Implement parameterized `GetProblems` query with `ILIKE` in `backend/internal/repository/postgres.go`
- [X] T010 [US1] Parse query parameter `q` (and alias `query`) into `ProblemFilter` and invoke `db.GetProblems` in `backend/internal/handlers/api.go`
- [X] T011 [US1] Add unit tests for `GET /api/problems?q=...` title search and case insensitivity in `backend/internal/handlers/api_test.go`

**Checkpoint**: User Story 1 (MVP) is fully functional and independently testable against the shared contract.

---

## Phase 4: User Story 2 - Extensible Query & Filter Architecture (Priority: P2)

**Goal**: Guarantee an extensible architecture supporting future filter criteria while maintaining 100% backward compatibility for callers omitting query parameters.

**Independent Test**: Call `GET /api/problems` without query parameters and verify all problems are returned identically to legacy behavior.

### Implementation for User Story 2

- [X] T012 [P] [US2] Update `PostgresDB.GetAllProblems` to delegate to `GetProblems(models.ProblemFilter{}, includeHidden)` in `backend/internal/repository/postgres.go`
- [X] T013 [P] [US2] Update `ProblemRepository.GetAll` to delegate to `GetFiltered(models.ProblemFilter{})` in `backend/internal/repository/problems.go`
- [X] T014 [US2] Add unit tests verifying backward compatibility when query parameters are omitted in `backend/internal/handlers/api_test.go`
- [X] T015 [US2] Document extensibility points and ensure unpopulated filter fields are ignored in `backend/internal/models/problem.go`

**Checkpoint**: User Stories 1 and 2 work independently with full backwards compatibility.

---

## Phase 5: User Story 3 - Empty Results and Input Normalization (Priority: P3)

**Goal**: Ensure robust query normalization (whitespace trimming, length limits, special character safety) and standard empty array `[]` responses when no titles match.

**Independent Test**: Query with leading/trailing whitespace (`?q=%20Two%20Sum%20`) and non-matching title (`?q=NonExistent123`), verifying normalized match and `[]` empty response.

### Implementation for User Story 3

- [X] T016 [US3] Add whitespace trimming (`strings.TrimSpace`) and length limitation (max 200 characters) in `backend/internal/handlers/api.go`
- [X] T017 [US3] Ensure non-matching search queries return an empty JSON array `[]` rather than `null` in `backend/internal/handlers/api.go`
- [X] T018 [US3] Add unit tests for whitespace trimming, empty queries, special characters, and zero matches in `backend/internal/handlers/api_test.go`
- [X] T019 [US3] Add unit tests verifying hidden problem protection is preserved during search in `backend/internal/handlers/api_test.go`

**Checkpoint**: All user stories (P1, P2, P3) are complete, normalized, and protected.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation, performance check, and mandatory repository verification

- [X] T020 Run full validation scenarios from `specs/002-problem-search-backend/quickstart.md`
- [X] T021 Execute mandatory project verification suite via `./scripts/verify-tests.sh`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can run immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1); BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2).
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) or can run in parallel on repository delegation.
- **User Story 3 (Phase 5)**: Depends on User Story 1 (Phase 3).
- **Polish (Phase 6)**: Depends on all user stories (Phase 3, 4, 5) completed.

### Parallel Opportunities

- **Phase 2**: `T003` (`IsEmpty`/`Matches`) and `T004` (model tests) can run in parallel once `T002` struct is defined.
- **Phase 3**: `T007` (in-memory repo) and `T008` (repo tests) can run in parallel with `T009` (postgres repo).
- **Phase 4**: `T012` and `T013` can run in parallel.
- **Phase 5**: `T018` and `T019` tests can run in parallel after handler adjustments.
