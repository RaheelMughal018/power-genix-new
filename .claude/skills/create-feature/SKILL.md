---
name: create-feature
description: End-to-end guide for adding a feature that spans frontend and backend. Use when adding any new feature that requires changes in both sub-projects.
---

# Create Feature (Full-Stack)

## Overview

This skill guides you through adding a feature across both the frontend and backend. Always start with the API contract, then build backend, then frontend.

## Step 1: Define the API Contract

Before writing any code, define:

1. **Endpoint(s)** — HTTP method, path, request body, response shape
2. **Entity changes** — new entities or modifications to existing ones
3. **Auth requirements** — public, authenticated, or admin-only

Present this to the user for approval before proceeding.

## Step 2: Backend Implementation

Work inside `backend/`. Follow the backend `CLAUDE.md` conventions.

1. Create or update the entity in the appropriate module
2. Create DTOs for request validation
3. Create the provider(s) with business logic
4. Create or update the controller with endpoints
5. Add Swagger decorators
6. Write unit tests for providers
7. Write controller tests
8. Run `npm run test` in the backend workspace to verify

## Step 3: Frontend Implementation

Work inside `frontend/`. Follow the frontend `CLAUDE.md` conventions.

1. Add API function(s) in the appropriate service file
2. Create or update Redux slice if state management is needed
3. Create the page/component following the project's component patterns
4. Wire up routing if a new page is needed
5. Handle loading, error, and empty states
6. Run `npm run build` in the frontend workspace to verify

## Step 4: Integration Verification

1. Start both frontend and backend dev servers
2. Test the full flow end-to-end manually
3. Verify error handling works correctly

## Standalone Projects

If the project is frontend-only or backend-only, follow only the relevant section above. Skip cross-project steps.
