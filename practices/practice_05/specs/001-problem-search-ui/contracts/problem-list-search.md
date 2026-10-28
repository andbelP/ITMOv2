# Unified Contract: Problem Search by Title (Frontend & UI)

**Related Backend Contract**: [specs/002-problem-search-backend/contracts/problems-search-api.md](../../002-problem-search-backend/contracts/problems-search-api.md)

---

## 1. Unified HTTP & Service Contract

### Endpoint
- **Method**: `GET`
- **Path**: `/api/problems`
- **Query Parameter**: `q` (string, optional, case-insensitive title substring; alias: `query`)
- **Headers**: Standard `Authorization: Bearer <token>` (optional), `Accept: application/json`

### Frontend Service Signature (`frontend/src/services/api.ts`)
```typescript
interface ApiService {
  getProblems(query?: string): Promise<Problem[]>;
}
```

- When `query` is provided and non-empty (after `query.trim()`):
  - Dispatches `GET ${API_BASE_URL}/api/problems?q=${encodeURIComponent(query.trim())}`
- When `query` is empty or omitted:
  - Dispatches `GET ${API_BASE_URL}/api/problems`
- **Offline / Error Fallback**:
  - If the backend is unreachable or returns a network error, `apiService.getProblems(query)` gracefully falls back to filtering `MOCK_PROBLEMS` locally by case-insensitive title substring (`isTitleMatch(p.title, query)`).

---

## 2. UI Component Contract: `ProblemList`

### Props Contract

```typescript
interface ProblemListProps {
  problems: Problem[];
  onSelectProblem: (problem: Problem) => void;
  onSearchChange?: (query: string) => void;
  isSearching?: boolean;
}
```

### Search Input Elements & Attributes

| Element | Selector / Role | Attributes | Behavior |
|---|---|---|---|
| Search Input | `input[type="text"]` | `placeholder="Search problems by title..."`<br>`aria-label="Search problems by title"`<br>`value={searchTerm}` | Updates `searchTerm` on `onChange`. Debounces call to `onSearchChange` (250–300ms). |
| Search Icon | `svg` (`Search` icon) | `aria-hidden="true"` | Visual ornament on the left. Shows subtle spinner or indicator when `isSearching === true`. |
| Clear Button | `button[aria-label="Clear search"]` | Rendered only when `searchTerm.length > 0` | Resets `searchTerm` to `""` and immediately fires `onSearchChange("")` without debounce. |

### Event Handling & Keybindings

- **`onChange(e)`**: Synchronously updates local `searchTerm` state; dispatches debounced `onSearchChange(trimmedValue)` (250ms).
- **`onKeyDown(e)`**: If key is `Escape` while focused on the search input, resets `searchTerm` to `""`, restores the full catalog, and immediately invokes `onSearchChange?.("")`.
- **Clear Button `onClick()`**: Resets `searchTerm` to `""` and immediately restores the full problem catalog.

---

## 3. Visual State Specification

1. **Populated Matching State**:
   - Renders table rows matching the title query.
   - Title match is case-insensitive substring on `problem.title`.
2. **Searching / Debounce State**:
   - When an API request is pending, an unobtrusive loading pulse/spinner may appear in the search bar.
3. **Empty Match State**:
   - When `filteredProblems.length === 0`:
   - Renders a single row spanning all columns (`colSpan={5}`).
   - Displays clear text: `"No problems found matching \"<searchTerm>\""`.
   - Includes a quick action button `"Clear search"` to reset the filter.
