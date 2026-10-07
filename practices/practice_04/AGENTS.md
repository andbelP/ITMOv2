# AlgoPlace Agent Architecture Guidelines

This repository contains the files and environment setup for **Practice 4** of the ITMO AI Engineering Tools course, integrating the **AlgoPlace** platform configurations.

## Architecture & Conventions

1. **Frontend (`frontend/`)**:
   - Stack: React 19, TypeScript, Tailwind CSS, Monaco Editor, Lucide Icons.
   - Build Tool: Vite.
   - Static builds are deployed behind Nginx.

2. **Backend (`backend/`)**:
   - Stack: Go (Golang) using standard library `net/http` for zero-dependency routing.
   - Standard Endpoints:
     - `GET /api/health` - health check.
     - `GET /api/problems` - retrieve list of algorithmic problems.
     - `GET /api/problems/{slug}` - retrieve specific problem details and template.
     - `POST /api/submissions/run` - run sample testcases.
     - `POST /api/submissions/submit` - run entire test suite.
   - Sandbox environment isolation utilizing OS process limits and timeouts.

## Mandatory Run Verification Hooks
Always execute the verification runner before declaring tasks complete to prevent regressions:
```bash
./scripts/verify-tests.sh
```
This tests both TypeScript build compilation and Go backend unit/sandbox test passes.
