<!--
SYNC IMPACT REPORT
==================
Version Change: Initial Template -> 1.0.0
Modified Principles:
  - [PRINCIPLE_1_NAME] -> I. Strict Execution Sandboxing & Security (NON-NEGOTIABLE)
  - [PRINCIPLE_2_NAME] -> II. Zero-External-Dependency Idiomatic Backend
  - [PRINCIPLE_3_NAME] -> III. Mandatory Automated Verification (NON-NEGOTIABLE Quality Gate)
  - [PRINCIPLE_4_NAME] -> IV. Seamless Dual-Mode Online Judge Protocol
  - [PRINCIPLE_5_NAME] -> V. Modern, Responsive & Accessible Monaco-Centric UI
Added Sections:
  - Security, Isolation & Environmental Constraints
  - Development Workflow & Quality Gates
Removed Sections:
  - None
Follow-up TODOs:
  - None
-->

# AlgoPlace Constitution

## Core Principles

### I. Strict Execution Sandboxing & Security (NON-NEGOTIABLE)
All user code execution requests (`/api/submissions/run` and `/api/submissions/submit`) MUST run in strict OS-level process isolation using temporary directories, immutable context deadlines (maximum 5 seconds timeout), and bounded resource limits. User code MUST NEVER be passed through raw shell strings; arguments MUST be passed directly as separate arguments to `exec.CommandContext` to prevent command injection. Sandbox environments MUST clean up temporary artifacts immediately after execution.
*Rationale*: As a multi-language online judge running untrusted code (C++, Python, JavaScript), process isolation, strict execution timeouts, and injection prevention are the primary defensive boundaries against host compromise and denial of service.

### II. Zero-External-Dependency Idiomatic Backend
The backend service MUST be implemented in Go using standard library primitives (specifically `net/http` for routing and HTTP handling) without external web frameworks. Core logic MUST follow modular package boundaries: `models` for domain representations, `handlers` for HTTP transport, `repository` for data persistence, `runner` for execution sandboxing, and `auth` for authentication. All API endpoints MUST return consistent, standardized JSON payloads with uniform error structures.
*Rationale*: Eliminating external HTTP framework dependencies keeps the backend lightweight, highly secure, and maintainable with minimal supply-chain attack surface while maximizing standard Go idioms.

### III. Mandatory Automated Verification (NON-NEGOTIABLE Quality Gate)
Every code change, feature addition, or bugfix MUST pass the full verification suite via `./scripts/verify-tests.sh` prior to conclusion. Verification includes frontend strict TypeScript compilation (`tsc -b`), production asset bundling (`vite build`), and backend unit and sandbox execution tests (`go test -v ./...`). Regressions in tests or failing builds are strictly non-permissible.
*Rationale*: Automated full-stack verification prevents regressions, validates compiler/interpreter sandboxes, and guarantees that deployed releases remain stable and performant.

### IV. Seamless Dual-Mode Online Judge Protocol
The platform MUST maintain two distinct submission flows: "Run" (`POST /api/submissions/run`) for rapid feedback against public/sample test cases, and "Submit" (`POST /api/submissions/submit`) for comprehensive evaluation against both sample and hidden test cases with formal verdicts (Accepted, Wrong Answer, Time Limit Exceeded, Runtime Error, Compile Error). Both modes MUST support C++ (GCC `g++`), Python 3 (`python3`), and JavaScript (`node`) with identical execution semantics and uniform verdict reporting.
*Rationale*: Differentiating between sample testing and full submission optimizes student practice workflow, guards hidden test integrity, and mirrors competitive programming standards.

### V. Modern, Responsive & Accessible Monaco-Centric UI
The frontend MUST be built with React 19, TypeScript, and Tailwind CSS, featuring an integrated Monaco Editor with multi-language syntax highlighting, starter code templates, and real-time execution feedback. The interface MUST be responsive, provide clear visual indicators for test results, execution status, and error traces, and maintain clean separation between presentation and API communication layers.
*Rationale*: An algorithm practice platform relies fundamentally on developer ergonomics; the code editing and evaluation experience must be smooth, reliable, and frictionless.

## Security, Isolation & Environmental Constraints

- **Execution Limits**: All runner executions MUST enforce a hard timeout cap of 5 seconds (`context.WithTimeout`). Sandbox memory and process guards MUST prevent fork bombs and runaway resource consumption.
- **Process Spawning**: Commands MUST pass binary arguments directly via `exec.CommandContext(ctx, binary, args...)`. Shell wrapping (such as `sh -c` or `bash -c` with string concatenation) is strictly forbidden for user submissions.
- **Technology Stack**:
  - **Backend**: Go (standard library `net/http`, modular packages in `internal/`).
  - **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Monaco Editor, Lucide Icons.
  - **Database**: PostgreSQL 16 Alpine via `DATABASE_URL`.
  - **Supported Judge Compilers/Runtimes**: GCC `g++`, Python 3 (`python3`), Node.js (`node`).
- **Containerization & Deployment**: Docker Compose network bridge (`algoplace-net`) connects `algoplace-frontend`, `algoplace-backend`, and `algoplace-db`. Nginx acts as reverse proxy routing `/api/` traffic to backend port 8080 and serving static assets on port 80.

## Development Workflow & Quality Gates

- **Mandatory Pre-Completion Verification**: Running `./scripts/verify-tests.sh` is mandatory for all code modifications. It MUST exit with code 0 before any change is finalized.
- **Modular Architecture Compliance**: Handlers MUST NOT contain business or sandbox execution logic; the runner package encapsulates OS process management; repository packages encapsulate database access.
- **Error Handling**: API endpoints MUST return standardized JSON responses (`{"error": "message"}`) with appropriate HTTP status codes. Raw internal stack traces or database error messages MUST NOT leak to client responses.
- **Test Integrity**: All new API endpoints or runner features MUST include unit and integration tests covering successful paths as well as edge/error cases (timeouts, compilation failures, malformed input).

## Governance

The AlgoPlace Constitution is the authoritative governance specification for the project and supersedes all informal conventions:
- All Pull Requests, architectural designs, and automated agent outputs MUST conform to the Core Principles and Constraints established herein.
- Amendments to this constitution require an explicit proposal with documented rationale, version bump, and an update to the Sync Impact Report.
- Versioning follows Semantic Versioning:
  - **MAJOR**: Incompatible principle removals or foundational architecture shifts.
  - **MINOR**: Adding new principles, runtime languages, or substantially expanding architectural requirements.
  - **PATCH**: Clarifications, wording corrections, and non-semantic refinements.
- Operational agent instructions and deployment configuration are referenced in `AGENTS.md`.

**Version**: 1.0.0 | **Ratified**: 2026-10-28 | **Last Amended**: 2026-10-28
