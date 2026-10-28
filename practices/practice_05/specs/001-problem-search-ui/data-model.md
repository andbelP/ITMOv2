# Data Model: Problem Search by Title (UI)

## Overview

The Problem Search UI feature coordinates user input state, debounced network requests, and problem list filtering, harmonized with the backend `ProblemFilter` criteria contract.

## Entities & Interfaces

### 1. Problem (Domain Entity)

Represents an algorithmic problem item displayed in the catalog.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique numerical or UUID identifier |
| `slug` | `string` | Yes | URL-friendly unique identifier |
| `title` | `string` | Yes | Primary name of the problem (target for search matching) |
| `difficulty` | `'Easy' \| 'Medium' \| 'Hard'` | Yes | Problem difficulty level |
| `category` | `string` | Yes | Topic category (e.g., "Arrays & Hashing", "Two Pointers") |
| `description` | `string` | Yes | Problem statement markdown/text |
| `constraints` | `string[]` | Yes | List of constraints |
| `starterCode` | `Record<string, string>` | Yes | Starter code templates |
| `sampleTestCases` | `TestCase[]` | Yes | Test cases for runner execution |

---

### 2. SearchFilterState (Component & Orchestration State)

Represents the active search criteria maintained in the problem list view and parent container.

| Field | Type | Default | Description |
|---|---|---|---|
| `searchTerm` | `string` | `""` | Raw input string typed by user in real time |
| `debouncedQuery` | `string` | `""` | Debounced value (250–300ms) dispatched to `apiService.getProblems(query)` |
| `isSearching` | `boolean` | `false` | Indicates an active search API fetch is in progress |
| `selectedDifficulty` | `Difficulty \| 'All'` | `'All'` | Active difficulty filter |
| `selectedCategory` | `string` | `'All'` | Active category filter |

---

### 3. API Request Model Mapping

| UI Field | HTTP Query Parameter | Transform / Encoding |
|---|---|---|
| `debouncedQuery` | `?q=` | `${encodeURIComponent(debouncedQuery.trim())}` (omitted if empty) |

---

## Filtering Logic & Invariants

```typescript
export const isTitleMatch = (title: string, query: string): boolean => {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return true;
  return title.toLowerCase().includes(normalized);
};
```

### Invariants:
1. **Empty Query Invariant**: If `searchTerm.trim() === ""`, all accessible problems MUST be displayed (`GET /api/problems` called without `?q=`).
2. **Case Insensitivity**: Matching is invariant under case transformation (`"two" === "TWO" === "Two"`).
3. **Substring Matching**: Any contiguous character match within `problem.title` evaluates to `true`.
4. **Boundary Trimming**: Surrounding whitespace in `searchTerm` is stripped prior to URL encoding and matching.
5. **No Cross-Field Contamination**: Problem categories, tags, descriptions, or IDs MUST NOT match in the title search input.
6. **Graceful Degradation**: When network is unavailable, filtering falls back locally to `MOCK_PROBLEMS.filter(p => isTitleMatch(p.title, query))`.

---

## State Transitions & Debounce Lifecycle

```
[User Types in Search Input]
        │
        ├─► Instant: Update local `searchTerm` & show Clear Button (X)
        │
        ▼ (Debounce Timer: 250-300ms)
[Dispatch API Request: GET /api/problems?q=...]
        │
        ├──► [Success 200 OK: Matching Problems] ──► Update Problem List Table
        │
        ├──► [Success 200 OK: Empty Array `[]`]  ──► Render Empty State Notice
        │
        └──► [Network Failure / Offline]         ──► Fallback to filtered MOCK_PROBLEMS
```
