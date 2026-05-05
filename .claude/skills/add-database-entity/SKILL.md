---
name: add-database-entity
description: Creates a new database entity in the backend with CRUD API endpoints and corresponding frontend pages. Use when adding a new data model to the project.
---

# Add Database Entity

## Overview

This skill creates a complete entity with CRUD operations across the stack. It follows the backend's module structure and the frontend's page conventions.

## Step 1: Ask the User

Before writing any code, ask:

1. **Entity name** — singular, PascalCase (e.g., `Product`, `Order`)
2. **Fields** — name, type, constraints (required, unique, default, etc.)
3. **Relations** — does it relate to other entities? (OneToMany, ManyToOne, etc.)
4. **Auth** — which endpoints need authentication? Which are admin-only?
5. **Frontend pages** — which CRUD pages are needed? (list, detail, create, edit)

## Step 2: Backend — Create the Module

Work inside `backend/`. Follow the backend `CLAUDE.md` module structure.

1. Create the module folder: `src/<entity-plural>/`
2. Create the entity file with TypeORM decorators
3. Create DTOs: `create-<entity>.dto.ts`, `update-<entity>.dto.ts`, `<entity>-query.dto.ts`
4. Create the service provider with CRUD operations
5. Create the controller with REST endpoints and Swagger decorators
6. Register the module in `app.module.ts`
7. Write unit tests for the service
8. Write controller tests

**Note:** Do not generate migrations for development. TypeORM `synchronize: true` handles schema changes. Migrations are only needed for staging/production and should be generated on explicit request.

## Step 3: Frontend — Create Pages

Work inside `frontend/`. Follow the frontend `CLAUDE.md` conventions.

1. Add API functions for the CRUD endpoints
2. Create Redux slice if needed
3. Create the list page with table/grid and pagination
4. Create the detail page
5. Create create/edit forms with validation (Formik + Yup)
6. Add routes to the route config
7. Run `npm run build` to verify

## Standalone Backend Projects

Skip Step 3 entirely. Only create the backend module.

## Standalone Frontend Projects

Skip Step 2. Assume the API already exists and create the frontend pages against it.
