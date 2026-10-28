# Feature Specification: Problem Search by Title (Backend)

**Feature Branch**: `002-problem-search-backend`

**Harmonized Contract**: [specs/002-problem-search-backend/contracts/problems-search-api.md](contracts/problems-search-api.md) | [specs/001-problem-search-ui/contracts/problem-list-search.md](../001-problem-search-ui/contracts/problem-list-search.md)

**Created**: 2026-10-28

**Status**: Aligned & Harmonized

**Input**: User description: "давай сделаем поиск по задачам. пока что только backend составляющую. я хочу иметь возможность искать задачи по названию. и все. но заложи расширяемость." (Harmonized with Frontend Feature 001)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find Problems by Title Substring via Backend API (Priority: P1)

As an API client (such as the AlgoPlace frontend `apiService.getProblems(query)`), I want to pass a title search query when requesting problems from the backend, so that only problems whose titles contain the query substring are returned.

**Why this priority**: Delivers the primary business value requested by the user — the ability to search problems by title on the backend.

**Independent Test**: Can be fully tested by sending an HTTP `GET /api/problems?q=<query>` request and asserting that only problems containing `<query>` in their title are returned in the response list.

**Acceptance Scenarios**:

1. **Given** a problem catalog containing "Two Sum", "Reverse Linked List", and "Valid Palindrome", **When** an API client requests `GET /api/problems?q=Two`, **Then** the response contains only "Two Sum" with status 200 OK.
2. **Given** a problem catalog with mixed-case titles, **When** an API client requests `GET /api/problems?q=two` (lowercase), **Then** "Two Sum" is included in the results (case-insensitive matching).
3. **Given** multiple problems sharing words (e.g., "Binary Tree Inorder Traversal" and "Binary Search"), **When** an API client requests `GET /api/problems?q=Binary`, **Then** both problems are returned.

---

### User Story 2 - Extensible Query & Filter Architecture (Priority: P2)

As a backend engineer maintaining AlgoPlace, I want the problem search mechanism and repository layer to be structured around an extensible filter criteria model, so that future criteria (such as difficulty, tags/categories, sorting, or pagination) can be added seamlessly without breaking existing title search functionality.

**Why this priority**: Directly satisfies the user's explicit requirement: "но заложи расширяемость" (ensure extensibility).

**Independent Test**: Can be verified by inspecting the repository and handler filter contract, demonstrating that additional criteria fields can be integrated without modifying the title matching signature or breaking existing callers.

**Acceptance Scenarios**:

1. **Given** a search request with no query parameter (`GET /api/problems`), **When** handled by the backend, **Then** all accessible problems are returned with 100% backwards compatibility.
2. **Given** a filter criteria model, **When** new optional filter parameters are introduced in the future, **Then** existing queries specifying only title search continue to work unmodified.

---

### User Story 3 - Empty Results and Input Normalization (Priority: P3)

As an API client submitting various user inputs, I want whitespace to be trimmed and non-matching queries to return clean, empty result sets, so that client applications receive predictable and consistent responses.

**Why this priority**: Ensures robust input handling, prevents false misses caused by extraneous whitespace, and standardizes empty response payloads.

**Independent Test**: Can be tested by sending requests with queries that match nothing or contain leading/trailing spaces, verifying normalized behavior and clean empty list responses.

**Acceptance Scenarios**:

1. **Given** a search query with leading/trailing whitespace (e.g. `GET /api/problems?q=%20Two%20Sum%20`), **When** processed by the backend, **Then** whitespace is trimmed and "Two Sum" is successfully matched.
2. **Given** a search query that matches no problem titles (e.g. `GET /api/problems?q=NonExistent123`), **When** processed by the backend, **Then** an empty JSON array `[]` is returned with status 200 OK (not an error).
3. **Given** a query string composed entirely of whitespace (e.g. `GET /api/problems?q=%20%20`), **When** processed by the backend, **Then** it is treated as an empty query and returns the full problem list.

---

### Edge Cases

- **Special Characters and Punctuation**: Query strings containing punctuation (e.g., hyphens, brackets, or apostrophes) MUST be matched safely as literal substrings without causing syntax errors, regex crashes, or injection risks.
- **Empty Query String**: A request with `?q=` MUST behave identically to a request without any `q` parameter, returning all accessible problems.
- **Role-Based Problem Visibility**: Problems flagged as hidden MUST only be searchable and accessible by authenticated administrators; regular users and unauthenticated clients MUST NEVER see hidden problems in search results.
- **Very Long Query Strings**: Query strings exceeding reasonable lengths (e.g., > 200 characters) MUST be handled gracefully without server panics or memory exhaustion.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The backend `GET /api/problems` endpoint MUST accept an optional query parameter (`q` or `query`) to filter problems by title.
- **FR-002**: Title filtering MUST perform case-insensitive substring matching against the problem's title.
- **FR-003**: The backend MUST normalize incoming search queries by trimming leading and trailing whitespace prior to evaluation.
- **FR-004**: If the search parameter is omitted, empty, or consists solely of whitespace, the backend MUST return all accessible problems without filtering.
- **FR-005**: When no problems match the search query, the backend MUST return an empty JSON array `[]` with HTTP status 200 OK.
- **FR-006**: The backend repository and handler layer MUST encapsulate search and filter parameters in an extensible criteria struct/interface, enabling future additions (e.g., difficulty, category, pagination, sorting) without breaking backward compatibility.
- **FR-007**: Existing problem visibility rules (hidden problems restricted to administrators) MUST remain strictly enforced across all search results.
- **FR-008**: All responses MUST adhere to standard JSON format, and any unexpected server error MUST return a standardized JSON error message (`{"error": "message"}`).

### Key Entities *(include if feature involves data)*

- **ProblemFilter**: Represents search and filtering criteria parsed from HTTP requests. Currently encapsulates `Query` (string for title matching) with extension points for future filters (`Difficulty`, `Category`, `Limit`, `Offset`, `SortBy`).
- **Problem**: Algorithmic problem entity containing `ID`, `Slug`, `Title`, `Difficulty`, `Category`, and visibility attributes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of title search queries return only problems whose title contains the specified query substring (case-insensitive).
- **SC-002**: Problem search requests respond in under 50ms under typical operating conditions.
- **SC-003**: 100% backwards compatibility: existing API clients calling `GET /api/problems` without query parameters experience zero change in response structure or content.
- **SC-004**: Zero test regressions across backend unit and sandbox test suites verified via `./scripts/verify-tests.sh`.

## Assumptions

- **Harmonized Contract**: Frontend UI integration is specified in companion feature `001-problem-search-ui`, which directly consumes this endpoint via `apiService.getProblems(query)` over the shared contract (`GET /api/problems?q=<query>`).
- **Matching Algorithm**: Substring matching (`strings.Contains` / `ILIKE`) is sufficient for v1; complex fuzzy matching and Levenshtein distance calculations are not required at this stage.
- **Endpoint Design**: The search parameter is added directly to `GET /api/problems` via query string (e.g. `?q=...`), keeping RESTful conventions and avoiding superfluous new routes.
- **Storage Compatibility**: The filtering criteria abstraction must work identically across both the in-memory repository (used in tests and fallback) and the PostgreSQL repository.
