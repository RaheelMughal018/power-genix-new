---
name: create-tests
description: Guides test creation across the full stack. Identifies what needs testing, presents edge cases, and generates tests following each sub-project's conventions.
---

# Create Tests (Full-Stack)

## Overview

This skill guides you through creating tests for a feature across the entire stack. It follows each sub-project's testing conventions and patterns.

## Step 1: Identify What Needs Testing

Ask the user:

1. **What feature or module?** — name of the feature to test
2. **Which layers?** — backend only, frontend only, or both?

## Step 2: Backend Tests

Follow the backend `CLAUDE.md` testing conventions. Three layers:

| Layer | File pattern | Location |
|-------|-------------|----------|
| Unit | `*.spec.ts` | Inside provider folder alongside source |
| Controller | `*.controller.spec.ts` | Next to controller file |
| E2E | `*.e2e-spec.ts` | `test/` directory |

### Before writing any tests:

1. Read the source code for the module being tested
2. Identify all edge cases grouped by category:
   - Validation, Auth/Authorization, Business logic, Database, Error handling, Boundary conditions, Response format
3. Present the edge case matrix to the user
4. Ask: "Are there any edge cases I'm missing?"
5. Only proceed after confirmation

### Mocking conventions:

- Use `Test.createTestingModule` with provider overrides
- Mock repositories with `getRepositoryToken(Entity)`
- Never mock the class under test
- Reset mocks in `beforeEach`

## Step 3: Frontend Tests

Follow the frontend conventions:

1. Component tests — verify rendering, user interactions, state changes
2. Integration tests — verify API calls, Redux state updates
3. Use the project's configured test runner

## Step 4: Run and Verify

1. Run backend tests: `npm run test --workspace=backend`
2. Run frontend tests: `npm run test --workspace=frontend` (if applicable)
3. Run e2e tests: `npm run test:e2e --workspace=backend` (if applicable)
4. Verify all pass with no regressions

## Standalone Projects

Run only the relevant test suite for the project type.
