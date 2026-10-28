# Feature Specification: Problem Search by Title (UI)

**Feature Branch**: `001-problem-search-ui`

**Harmonized Contract**: [specs/001-problem-search-ui/contracts/problem-list-search.md](contracts/problem-list-search.md) | [specs/002-problem-search-backend/contracts/problems-search-api.md](../002-problem-search-backend/contracts/problems-search-api.md)

**Created**: 2026-10-28

**Status**: Aligned & Harmonized

**Input**: User description: "давай сделаем поиск по задачам. пока что только UI. я хочу иметь возможность искать задачи по названию. и все" (Harmonized with Backend Feature 002)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find Problems by Title Substring (Priority: P1)

As a user browsing the problem catalog, I want to quickly find specific problems by entering part of their title into a search box, so that I can practice the exact problem I am looking for without scrolling through the entire list.

**Why this priority**: Core value of the feature. Enables immediate discovery of problems by name.

**Independent Test**: Can be fully tested by entering a partial problem title into the search box and observing that only matching problems are shown in the list, querying the backend `GET /api/problems?q=<query>` with debouncing and falling back gracefully if offline.

**Acceptance Scenarios**:

1. **Given** a problem catalog containing "Two Sum", "Reverse Linked List", and "Valid Palindrome", **When** the user types "Two" into the search box, **Then** only "Two Sum" is displayed in the problem list.
2. **Given** a problem catalog with titles in varying cases, **When** the user types "two" (lowercase) into the search box, **Then** "Two Sum" is displayed (matching is case-insensitive).
3. **Given** a problem catalog containing multiple problems with similar words (e.g. "Binary Tree Inorder Traversal" and "Binary Search"), **When** the user types "Binary", **Then** both problems remain visible in the list.

---

### User Story 2 - Reset and Clear Search Filter (Priority: P2)

As a user who has filtered the list with a search query, I want to easily clear the search input, so that the full catalog of problems is restored.

**Why this priority**: Essential navigation flow. Users must be able to return to the unfiltered view without refreshing the page.

**Independent Test**: Can be tested by searching for a specific problem and then clearing the search field via the clear button or Escape key, verifying that all original problems reappear immediately.

**Acceptance Scenarios**:

1. **Given** a search box populated with "Two Sum" and showing 1 result, **When** the user deletes all text from the search box or clicks the clear button, **Then** all available problems are displayed in the list again.
2. **Given** an empty search box, **When** the user types and immediately deletes characters, **Then** the catalog reverts to showing all problems without delay.

---

### User Story 3 - Visual Feedback for Unmatched Queries (Priority: P3)

As a user searching for a problem that does not exist in the catalog, I want to see a clear "no problems found" message, so that I understand why the list is empty rather than suspecting a system malfunction.

**Why this priority**: Polishes the user experience and provides clear feedback on empty search states.

**Independent Test**: Can be tested by entering a non-existent title query (e.g., "NonExistentProblem999") and confirming an intuitive empty state message is shown with a clear button.

**Acceptance Scenarios**:

1. **Given** a problem catalog with no problems containing "xyz123", **When** the user types "xyz123" into the search box, **Then** the list displays an empty state indicator stating that no problems match the search criteria.

---

### Edge Cases

- **Leading and trailing whitespace**: What happens when a user types "  Two Sum  "? The search trims extraneous surrounding whitespace and still matches "Two Sum".
- **Special characters and punctuation**: What happens when a problem title contains punctuation (e.g., "3Sum Closest", "LRU Cache")? Punctuation within the query is matched literally and safely URL-encoded (`encodeURIComponent`).
- **Accidental fast typing or deletions**: What happens when a user types rapidly? The search input debounces outgoing API requests (250–300ms) to prevent network storms while maintaining fluid typing.
- **Single character queries**: What happens when a single character (e.g., "a") is entered? The search filters and displays all problem titles containing that character.
- **Offline / Network Disconnection**: If the backend service is offline, the client falls back to filtering local `MOCK_PROBLEMS` using the same case-insensitive title substring logic.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an accessible text search input field on the problem list page with `placeholder="Search problems by title..."` and `aria-label="Search problems by title"`.
- **FR-002**: The search filter MUST match against problem titles using case-insensitive substring matching.
- **FR-003**: The frontend MUST integrate with the backend `GET /api/problems?q=<query>` endpoint via `apiService.getProblems(query)`, while supporting client-side fallback against `MOCK_PROBLEMS` when the backend is offline.
- **FR-004**: When the search query is empty (or contains only whitespace), the system MUST display the full, unfiltered list of problems (`GET /api/problems`).
- **FR-005**: When no problems match the search query, the system MUST display an informative message indicating that no matching problems were found along with a "Clear search" action.
- **FR-006**: The search input MUST support clearing via a dedicated clear button (`X`) and via the `Escape` keyboard shortcut.
- **FR-007**: Rapid user input MUST be debounced (250–300ms) prior to dispatching backend network requests to prevent request flooding.

### Key Entities

- **Problem Item**: Represents a practice task in the catalog, containing at minimum a display Title, unique Identifier, Category, and Difficulty level.
- **Search Query**: Represents the user-entered text string used to filter Problem Items by their Title.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can locate any known problem by typing a portion of its title in under 3 seconds.
- **SC-002**: The search input debounces backend calls by 250–300ms, eliminating redundant HTTP requests during typing.
- **SC-003**: 100% of problems whose titles contain the query string (regardless of character casing) are correctly included in the filtered view.
- **SC-004**: If the backend is unreachable, 100% of search interactions continue operating smoothly via client-side mock fallback.
- **SC-005**: 100% of users testing the clear/reset action can return to the full catalog without needing to reload the webpage.

## Assumptions

- The frontend search is harmonized with the backend `002-problem-search-backend` contract (`GET /api/problems?q=<query>`).
- Matching is performed strictly on the problem title; searching by tags, descriptions, or problem IDs is isolated from the title search box.
- The UI search input works uniformly across desktop and mobile screen sizes.
