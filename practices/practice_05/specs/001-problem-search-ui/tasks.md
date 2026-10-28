# Tasks: Problem Search by Title (UI)

**Input**: Design documents from `/specs/001-problem-search-ui/` (harmonized with `specs/002-problem-search-backend/`)
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/problem-list-search.md](contracts/problem-list-search.md), [quickstart.md](quickstart.md)
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- File paths are exact repository-relative paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify the current frontend testing and build environment.

- [X] T001 Verify baseline frontend testing and build environment by running tests in `frontend/src/components/ProblemList.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish core title search utility predicate and update API client with search parameter support.

**⚠️ CRITICAL**: Foundational logic and API client updates must be established before user story UI features are finalized.

- [X] T002 Refactor search matching logic in `frontend/src/components/ProblemList.tsx` to isolate `isTitleMatch` predicate (matching case-insensitive trimmed query on `problem.title`) and decouple search term from category/tag fields
- [X] T003 Update `apiService.getProblems(query?: string)` in `frontend/src/services/api.ts` to append `?q=${encodeURIComponent(query.trim())}` when a query is provided, with local fallback filtering against `MOCK_PROBLEMS`

**Checkpoint**: Core title matching predicate and API client method ready — user story implementation can proceed.

---

## Phase 3: User Story 1 - Find Problems by Title Substring (Priority: P1) 🎯 MVP

**Goal**: Enable users to search problems strictly by title substring (case-insensitive) with debounced backend queries and instant UI responsiveness.

**Independent Test**: Enter partial title into search box (e.g. "Two", "palindrome", "Binary"); verify `GET /api/problems?q=...` is queried after debounce, only matching problem titles appear, and categories do not cause false positives.

### Tests for User Story 1 ⚠️

- [X] T004 [P] [US1] Add unit tests in `frontend/src/components/ProblemList.test.tsx` verifying case-insensitive title matching, whitespace trimming, input debouncing, and asserting that category names do NOT trigger matches

### Implementation for User Story 1

- [X] T005 [US1] Update search input element in `frontend/src/components/ProblemList.tsx` with `placeholder="Search problems by title..."`, `aria-label="Search problems by title"`, debounced `onSearchChange` callback, and title-only filtering
- [X] T006 [US1] Wire debounced search query state in `frontend/src/App.tsx` to invoke `loadProblems(query)` when search query changes

**Checkpoint**: User Story 1 is functional and testable as an MVP with backend API integration.

---

## Phase 4: User Story 2 - Reset and Clear Search Filter (Priority: P2)

**Goal**: Allow users to instantly clear search query via dedicated clear button or Escape key and restore all problems.

**Independent Test**: Type a search query, click the clear icon or press Escape; verify input resets to empty string and all problems reappear immediately.

### Tests for User Story 2 ⚠️

- [X] T007 [P] [US2] Add unit tests in `frontend/src/components/ProblemList.test.tsx` for clear button click and Escape keydown event resetting the search input and triggering immediate reload

### Implementation for User Story 2

- [X] T008 [US2] Implement clear button (`X` icon with `aria-label="Clear search"`) and `onKeyDown` Escape handler in `frontend/src/components/ProblemList.tsx`

**Checkpoint**: User Stories 1 and 2 work independently and seamlessly together.

---

## Phase 5: User Story 3 - Visual Feedback for Unmatched Queries (Priority: P3)

**Goal**: Render an informative empty state when no problems match search query, including an inline action to clear the search.

**Independent Test**: Type non-matching query (e.g. "XYZ_NO_MATCH"); verify empty table row displays query feedback and a "Clear search" action.

### Tests for User Story 3 ⚠️

- [X] T009 [P] [US3] Add unit tests in `frontend/src/components/ProblemList.test.tsx` verifying empty state messaging with search query and functional reset button

### Implementation for User Story 3

- [X] T010 [US3] Update empty results state in `frontend/src/components/ProblemList.tsx` to display unmatched query notice (`"No problems found matching \"<searchTerm>\""`) and interactive "Clear search" button

**Checkpoint**: All three user stories are complete and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and full test suite verification.

- [X] T011 Run quickstart validation test scenarios via `npm test -- ProblemList.test.tsx` in `frontend/`
- [X] T012 Execute mandatory project verification hook `./scripts/verify-tests.sh` to ensure clean TypeScript compilation, Vite production build, and backend test passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — runs first.
- **Foundational (Phase 2)**: Depends on T001 — blocks all user stories.
- **User Stories (Phase 3-5)**: Depend on Foundational (Phase 2).
  - Can proceed sequentially (US1 → US2 → US3) or in parallel.
- **Polish (Phase 6)**: Depends on completion of desired user stories.

### User Story Dependencies

- **User Story 1 (P1)**: Starts immediately after Phase 2; standalone MVP.
- **User Story 2 (P2)**: Extends search input controls with clear trigger; independently testable.
- **User Story 3 (P3)**: Enhances empty state rendering; independently testable.
