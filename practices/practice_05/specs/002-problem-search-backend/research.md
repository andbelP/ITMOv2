# Research & Architecture Decisions: Problem Search by Title (Backend)

**Feature**: `002-problem-search-backend`  
**Date**: 2026-10-28  
**Status**: Completed (Harmonized with Frontend Feature 001)

---

## Technical Unknowns & Investigations

### 1. HTTP Query Parameter Convention for Problem Search

- **Context**: The existing endpoint for listing problems is `GET /api/problems`. We need to enable searching problems by title while keeping URL ergonomics simple and aligned with standard REST APIs and the companion frontend client (`frontend/src/services/api.ts`).
- **Decision**: Support `q` as the primary search query parameter (e.g., `GET /api/problems?q=two+sum`), with `query` supported as an optional alias.
- **Rationale**:
  - `q` is the universal de facto industry standard for query strings across web APIs (e.g., GitHub, Google, Algolia).
  - Supporting `query` as an alias provides developer ergonomics without adding complexity.
  - Omission of both `q` and `query` preserves identical legacy behavior (returns all accessible problems).
  - Seamlessly consumed by `apiService.getProblems(query)` using `encodeURIComponent(query.trim())`.
- **Alternatives Considered**:
  - `title`: Too restrictive for future extensibility when search might cover tags or descriptions.
  - Dedicated search endpoint (`GET /api/problems/search`): Unnecessary route fragmentation; REST best practices recommend using query filters on collection resources (`GET /api/problems?q=...`).

---

### 2. Extensible Filter Model Design (`ProblemFilter`)

- **Context**: The user explicitly requested: *"я хочу иметь возможность искать задачи по названию. и все. но заложи расширяемость."* We must ensure the design allows future filter dimensions (difficulty, category, pagination, tags, sorting) without breaking the contract or requiring major refactoring.
- **Decision**: Introduce a dedicated `ProblemFilter` struct in `internal/models/problem.go` passed across handlers and repository layers:
  ```go
  type ProblemFilter struct {
      Query      string     // Substring match on title (case-insensitive)
      Difficulty Difficulty // Optional future extension
      Category   string     // Optional future extension
  }
  ```
  Provide helper methods such as `IsEmpty() bool` and `Matches(p Problem) bool` for in-memory evaluation.
- **Rationale**:
  - Decouples HTTP query parameter parsing from business logic and database queries.
  - Adding future filter fields (e.g. `Category`, `Difficulty`, `Limit`, `Offset`) only requires adding fields to `ProblemFilter` without altering function signatures across interfaces.
- **Alternatives Considered**:
  - Passing `query string` directly into repository methods: Violates open/closed principle; every new filter parameter would force updating the repository interface and all implementations.

---

### 3. Repository & Database Interface Evolution

- **Context**: AlgoPlace uses a `Database` interface in `internal/handlers/interfaces.go` with implementations in `PostgresDB` (`internal/repository/postgres.go`) and `MockDB` (`internal/handlers/api_test.go`), plus an in-memory `ProblemRepository` (`internal/repository/problems.go`).
- **Decision**: Update the repository interface and implementations to support filtering:
  - Add `GetProblems(filter models.ProblemFilter, includeHidden bool) ([]models.Problem, error)` to `Database` interface.
  - Keep `GetAllProblems(includeHidden bool)` as a convenience wrapper calling `GetProblems(models.ProblemFilter{}, includeHidden)` to guarantee 100% backward compatibility for existing callers and tests.
  - In `ProblemRepository` (in-memory), add `GetFiltered(filter models.ProblemFilter) []models.Problem`.
- **Rationale**:
  - Maintains full backward compatibility with any existing unit tests or callers invoking `GetAllProblems`.
  - Enables clean, testable filtering logic for both Postgres and in-memory mock repositories.
- **Alternatives Considered**:
  - Modifying `GetAllProblems` signature directly: Would break existing tests or require changing dozens of call sites.
  - Performing in-memory filtering inside the handler after fetching all rows: Inefficient for large databases; database queries should filter at the source when running against PostgreSQL.

---

### 4. Search Matching Logic & Security (SQL Injection Prevention)

- **Context**: Title searches must be case-insensitive substring matches and must NEVER be vulnerable to SQL injection (Principle I & Principle II).
- **Decision**:
  - **PostgreSQL**: Use parameterized `ILIKE` query with bound parameters:
    ```sql
    WHERE ($1 = '' OR title ILIKE '%' || $1 || '%')
    ```
    Arguments are passed safely via parameterized query arguments (`$1`), preventing SQL injection.
  - **In-Memory**: Use `strings.Contains(strings.ToLower(p.Title), strings.ToLower(trimmedQuery))`.
  - **Query Sanitization**: Trim leading and trailing whitespace using `strings.TrimSpace`. Cap maximum query length at 200 characters to prevent resource exhaustion.
- **Rationale**:
  - Parameterized queries are non-negotiable under project security guidelines.
  - Standard Go `strings` operations avoid regex overhead and ReDoS vulnerabilities.
- **Alternatives Considered**:
  - PostgreSQL full-text search (`to_tsvector`): Overkill for title substring matching at this scale and introduces language dictionary dependencies.
  - Regex matching (`~*` in Postgres): Susceptible to catastrophic backtracking or invalid regex errors from user input.

---

### 5. Response Protocol & Frontend Integration

- **Context**: Need standard HTTP semantics for empty search results, special characters, and empty query strings matching the frontend expectations.
- **Decision**:
  - Empty or whitespace-only query (`?q=   `): Evaluated as no filter, returning all problems (HTTP 200).
  - Zero matches (`?q=NonExistent`): Returns empty JSON array `[]` with HTTP 200 OK (never 404 or error), directly satisfying the frontend `ProblemList` empty state condition (`filteredProblems.length === 0`).
  - Special characters (e.g. `+`, `-`, `'`, `"`, `%`, `_`): Treated as literal substring characters.
  - Role-based access control: Admin-only / hidden problems are filtered using the existing `isAdmin` check before returning results.
- **Rationale**:
  - Adheres to standard REST conventions and seamlessly fulfills the unified client-server contract with Frontend Feature 001.
