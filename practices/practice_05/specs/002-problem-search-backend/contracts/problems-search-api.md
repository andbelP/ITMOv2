# Unified API Contract: Problem Search by Title (Backend)

**Related Frontend Contract**: [specs/001-problem-search-ui/contracts/problem-list-search.md](../../001-problem-search-ui/contracts/problem-list-search.md)

---

## 1. Endpoint Definition

- **Method**: `GET`
- **Path**: `/api/problems`
- **Authentication**: Optional (Unauthenticated users receive public problems; authenticated administrators also receive hidden test cases / admin views).

---

## 2. Query Parameters

| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `q` | `string` | No | Substring to search against problem title (case-insensitive, whitespace trimmed). Primary parameter used by `apiService.getProblems(query)`. | `?q=two+sum` |
| `query` | `string` | No | Alias for `q`. If both `q` and `query` are provided, `q` takes precedence. | `?query=reverse` |

---

## 3. Request Headers

| Header | Type | Description |
|---|---|---|
| `Authorization` | `string` (optional) | Bearer JWT token (`Bearer <token>`) |
| `Accept` | `string` | `application/json` |

---

## 4. Frontend Client Integration Contract

- **Consumer**: `frontend/src/services/api.ts` (`apiService.getProblems(query?: string)`)
- **Query Encoding**: The frontend MUST pass values sanitized via `encodeURIComponent(query.trim())`.
- **Client Debounce**: UI clients SHOULD debounce search input (recommended 250–300ms) to reduce server load during active typing.
- **Client Fallback**: If the backend is unavailable, the frontend client falls back to filtering local `MOCK_PROBLEMS` using the same case-insensitive title substring semantics.

---

## 5. Response Scenarios

### 1. Successful Query with Matches (HTTP 200 OK)

**Request**:
```http
GET /api/problems?q=two HTTP/1.1
Host: localhost:8080
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "1",
    "slug": "two-sum",
    "title": "Two Sum",
    "difficulty": "Easy",
    "category": "Arrays & Hashing",
    "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
    "examples": [
      {
        "input": "nums = [2,7,11,15], target = 9",
        "output": "[0,1]",
        "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
      }
    ],
    "starterCode": {
      "cpp": "...",
      "python": "...",
      "javascript": "..."
    },
    "sampleTestCases": [
      {
        "id": "tc-1",
        "input": "4\n2 7 11 15\n9",
        "expectedOutput": "0 1"
      }
    ]
  }
]
```

### 2. Successful Query with Zero Matches (HTTP 200 OK)

**Request**:
```http
GET /api/problems?q=NonExistentProblemTitle HTTP/1.1
Host: localhost:8080
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

[]
```

*(Note: Returns an empty JSON array `[]`, NEVER null, 404, or an error object).*

### 3. Omitted or Empty Query String (HTTP 200 OK)

**Request**:
```http
GET /api/problems HTTP/1.1
Host: localhost:8080
```

or

```http
GET /api/problems?q=%20%20 HTTP/1.1
Host: localhost:8080
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  { "id": "1", "title": "Two Sum", ... },
  { "id": "2", "title": "Reverse Linked List", ... },
  { "id": "3", "title": "Valid Palindrome", ... }
]
```

*(Note: 100% backwards-compatible with existing clients).*

### 4. Internal Server Error (HTTP 500 Internal Server Error)

**Response**:
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "Failed to query problems"
}
```

---

## 6. Extensibility Contract Notes

Future filter parameters MAY be added to `GET /api/problems` as additional query parameters without breaking this contract:
- `difficulty=Easy`
- `category=Two+Pointers`
- `limit=20&offset=0`
- `sort=title:asc`

Clients omitting these future parameters will continue to receive title-only filtered or unfiltered results without disruption.
