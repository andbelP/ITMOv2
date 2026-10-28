# Data Model: Problem Search by Title (Backend)

## Overview

The backend Problem Search feature introduces an extensible filter criteria model (`ProblemFilter`) to encapsulate search parameters and options, interacting with the existing `Problem` domain entity across HTTP handlers, the `Database` interface, and persistence repositories, harmonized with the frontend client (`frontend/src/services/api.ts`).

---

## Entities & Structs

### 1. `ProblemFilter` (Criteria Model)

Encapsulates search and filtering criteria parsed from HTTP requests or internal services.

| Field | Type | Required | Description |
|---|---|---|---|
| `Query` | `string` | No | Sanitized, trimmed substring query to match against problem titles (case-insensitive). |
| `Difficulty` | `models.Difficulty` | No | Optional difficulty filter (`"Easy"`, `"Medium"`, `"Hard"`) for future extensibility. |
| `Category` | `string` | No | Optional category/tag filter (e.g., `"Arrays & Hashing"`) for future extensibility. |
| `Limit` | `int` | No | Optional pagination limit for future extensibility (0 = no limit). |
| `Offset` | `int` | No | Optional pagination offset for future extensibility. |

#### Methods & Invariants

```go
// IsEmpty returns true if no search or filter criteria are specified.
func (f ProblemFilter) IsEmpty() bool {
    return strings.TrimSpace(f.Query) == "" &&
           f.Difficulty == "" &&
           strings.TrimSpace(f.Category) == ""
}

// Matches returns true if a given problem satisfies all active filter criteria.
func (f ProblemFilter) Matches(p Problem) bool {
    q := strings.TrimSpace(strings.ToLower(f.Query))
    if q != "" && !strings.Contains(strings.ToLower(p.Title), q) {
        return false
    }
    if f.Difficulty != "" && p.Difficulty != f.Difficulty {
        return false
    }
    if cat := strings.TrimSpace(f.Category); cat != "" && !strings.EqualFold(p.Category, cat) {
        return false
    }
    return true
}
```

---

### 2. `Problem` (Existing Domain Entity)

The core problem representation in AlgoPlace.

| Field | Type | Description |
|---|---|---|
| `ID` | `string` | Unique identifier (e.g. `"1"`, `"2"`) |
| `Slug` | `string` | URL-safe slug (e.g. `"two-sum"`) |
| `Title` | `string` | Human-readable title (primary target for `Query` matching) |
| `Difficulty` | `Difficulty` | Difficulty level (`Easy`, `Medium`, `Hard`) |
| `Category` | `string` | Problem category |
| `Description` | `string` | Markdown problem statement |
| `Constraints` | `[]string` | Algorithmic constraints |
| `Examples` | `[]Example` | Sample inputs and outputs |
| `StarterCode` | `StarterCode` | Starter code snippets for C++, Python, JavaScript |
| `SampleTestCases` | `[]TestCase` | Public sample test cases |
| `HiddenTestCases` | `[]TestCase` | Private test cases (only accessible when `includeHidden=true`) |

---

## Validation & Normalization Rules

1. **Whitespace Trimming**: Incoming query parameters MUST be trimmed of leading and trailing whitespace (`strings.TrimSpace`).
2. **Length Boundary**: Query strings exceeding 200 characters MUST be rejected or capped to 200 characters to prevent memory exhaustion and excessive processing.
3. **Punctuation & Wildcards**: Special characters in `Query` (e.g., `%`, `_`, `'`, `"`) MUST NOT be treated as SQL wildcards or pattern delimiters; in SQL queries they must be escaped or passed as literal values into bound parameters.
4. **Empty Query Invariant**: If `Query` is empty or only whitespace, all accessible problems MUST be returned.
5. **Visibility Guard**: Hidden test cases and unreleased problems MUST remain guarded by role permissions regardless of search filters applied.

---

## Data Flow & Processing Lifecycle

```
[HTTP Request from Frontend: GET /api/problems?q=two]
                  │
                  ▼
[Handler: ParseQuery -> ProblemFilter{Query: "two"}]
                  │
                  ▼
[Database Interface: GetProblems(filter, includeHidden)]
        ┌─────────┴─────────┐
        ▼                   ▼
[PostgresDB: SQL ILIKE]  [MockDB / In-Memory: filter.Matches()]
        └─────────┬─────────┘
                  ▼
[Handler: Encode JSON Response ([]models.Problem)]
                  │
                  ▼
[Frontend: apiService.getProblems() -> ProblemList Table Render]
```
