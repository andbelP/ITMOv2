# Research & Technical Decisions: Problem Search by Title (UI)

## 1. Search Query Scope & Matching Algorithm

- **Decision**: Implement case-insensitive substring matching strictly on the `title` property of each problem (`problem.title.toLowerCase().includes(query.trim().toLowerCase())`), removing category/tag matching from the search box.
- **Rationale**: The user requirement specifically constrained search scope to title only (*"я хочу иметь возможность искать задачи по названию. и все"*). Filtering only by title eliminates false positive matches where category names overlap with problem names (e.g. searching "Tree" should only match problem titles containing "Tree", rather than all problems categorized under "Trees").
- **Alternatives considered**:
  - *Full-text search across title, description, and tags*: Rejected because user explicitly specified title-only search, and descriptions are large text blocks that cause unexpected matches.
  - *Fuzzy search (Levenshtein / Fuse.js)*: Rejected because substring containment is deterministic, predictable, zero-dependency, and instantly matches what users type without unexpected reorderings.
  - *Regex-based search*: Rejected due to potential ReDoS risks and unexpected behavior when users type special characters like `(`, `[`, `*`.

## 2. Input Handling, Debouncing & Performance Optimization

- **Decision**: Use controlled input state (`useState`) with debounced API dispatch (250–300ms) to the backend `apiService.getProblems(query)` or `onSearchChange`, coupled with synchronous local typing state.
- **Rationale**: While local in-memory filtering takes < 1ms, communicating with the backend over HTTP requires debouncing to prevent issuing a network request on every single keystroke. A 250–300ms debounce interval provides an optimal balance: imperceptible delay to the user upon finishing a word, while cutting redundant network traffic by > 80%.
- **Alternatives considered**:
  - *No debouncing (fetch on every keypress)*: Floods the backend server and reverse-proxy with redundant HTTP requests on rapid typing.
  - *Throttling*: May execute a request mid-typing rather than waiting for the user to pause, causing race conditions in response order.

## 3. UI Controls & Accessibility (a11y)

- **Decision**: Provide an explicit `aria-label="Search problems by title"`, updated placeholder text (`"Search problems by title..."`), a clear button (`X`) when a query is present, and support for keyboard escape to clear the search.
- **Rationale**: Meets WCAG accessibility standards and Constitution Principle V (Modern, Responsive & Accessible UI), enabling keyboard and screen-reader users to search and quickly reset their queries.
- **Alternatives considered**:
  - *Relying only on browser-native `type="search"` styling*: Browser-native clear icons render inconsistently across browsers (Safari vs Chromium vs Firefox) and cannot be styled cleanly with Tailwind CSS. A custom clear button provides consistent UI across all browsers.

## 4. Backend & Network Contract Alignment

- **Decision**: Harmonize with backend feature `002-problem-search-backend` using `GET /api/problems?q=<query>` via `apiService.getProblems(query)`, while implementing graceful fallback to filtering `MOCK_PROBLEMS` when offline.
- **Rationale**: Aligns the UI and Backend into a cohesive, production-ready system. Calling the backend search parameter guarantees that server-side database querying, role-based visibility checks, and future pagination/filters are respected, while the offline fallback guarantees developer and test resilience.
- **Alternatives considered**:
  - *Client-only search with zero backend integration*: Works when all problems are pre-loaded, but fails when the backend enforces pagination or dynamic problem catalogs. Harmonizing with `?q=` provides an extensible, unified contract.
