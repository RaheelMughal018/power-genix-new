---
name: workflow-guide
description: Reference for the feature-driven development pipeline. Use when starting any new work to understand the full process from requirements to deployment.
---

# Workflow Guide

## The Pipeline

Every project follows these stages in order. Do not skip stages.

---

### Stage 1: Requirements & Specification

- Brainstorm requirements with user/client
- Create `docs/requirements/` — split into numbered module files:
  - `00-project-overview.md`
  - `01-authentication.md`
  - `02-<module>.md` etc.
- Create `docs/SPECIFICATION.md` — plain language, readable by non-technical clients (no jargon)
- Refine both until client approves
- **Gate:** Do not proceed until client signs off on specification

---

### Stage 2: Data Modeling

- Create `docs/ERD.md` with entity-relationship diagram
- Define all data models before designing screens — UI must match data shape
- Identify relationships, constraints, and key fields

---

### Stage 3: Theme Definition

- Define before building any components:
  - Color palette (primary, secondary, neutrals, semantic colors)
  - Typography (font families, scale, weights)
  - Spacing scale and layout rules
- Configure in the project (Tailwind config, CSS variables, etc.)

---

### Stage 4: Design Approach (choose one)

#### Option A: Custom Design (Figma-first)
- Wait for Figma designs to be completed
- Once Figma is ready, walk through every screen and define a design spec

#### Option B: Build-While-Designing
- Define every screen in a design spec without waiting for Figma
- Describe what each screen does and how it should look

**For both options — create `docs/design.spec.md`:**

For each screen, define:
- **States:** default, loading, error, empty, success, network_error, auth_failure, etc.
- **Navigation:** where the screen leads to and comes from
- **Fields/Data:** what data is shown or collected, with validation rules
- **Components used:** which shared and screen-specific components

---

### Stage 5: Reusable Components

- Agent walks through all screens in design spec and suggests shared components
- User reviews suggestions:
  - Confirm which to make shared components
  - Mark which are screen-specific only
  - Add any components the agent missed
- Output: confirmed list of shared components to build before screen work begins

---

### Stage 6: Per Feature/Screen — Build Cycle

Repeat for each feature/screen:

#### 6a. Document
Create `docs/plans/<feature>.md` covering:
- API contracts needed (endpoints, request/response shape)
- Third-party libraries/services needed
- Use cases (business logic flows)
- Test cases (business logic only — not appearance)

#### 6b. Build UI
- Visual first — get it looking right with hot reload
- No TDD during UI creation — UI is judged visually
- Build shared components first, then wire into screen

#### 6c. Integrate APIs
- Connect data layer per use case defined in 6a
- Handle all states: loading, error, empty, success

#### 6d. Test
- Run against the test cases written in 6a
- Test business logic — not appearance
- Write test cases per feature while context is fresh, not all upfront

---

## Principles

- No TDD during UI creation — UI is judged visually
- Test business logic, not appearance
- Write test cases per feature when context is fresh, not all upfront
- Screen specs must include all states and edge cases — not just happy paths
- Define data models before screens — UI must match data shape
- Identify navigation structure upfront to avoid rework
- Everything in plain text markdown — readable by humans and Claude
