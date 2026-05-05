---
name: deploy
description: Use when setting up deployment for any template in this project. Delegates to the appropriate sub-project skill based on the template being deployed.
---

# Skill: Deploy

Deployment is handled per-template. Each template has its own skill(s) covering the full setup — Dockerfile (where applicable) and GitHub Actions workflow.

---

## NestJS Template (`nest-template/`)

| Task | Skill |
|------|-------|
| Generate a multi-stage Dockerfile | `nest-template/.claude/skills/write-dockerfile/SKILL.md` |
| Create a GitHub Actions workflow (Docker → SSH deploy) | `nest-template/.claude/skills/github-workflow-docker-deploy/SKILL.md` |

**Pattern:** Two-stage Docker build → push to GHCR → SSH deploy → run migrations → restart container.

---

## Next.js Template (`next-template/`)

| Task | Skill |
|------|-------|
| Generate a multi-stage Dockerfile | `next-template/.claude/skills/write-dockerfile/SKILL.md` |
| Create a GitHub Actions workflow (Docker → SSH deploy) | `next-template/.claude/skills/github-workflow-docker-deploy/SKILL.md` |

**Pattern:** Two-stage Docker build using Next.js `standalone` output → push to GHCR → SSH deploy → restart container. No migrations.

---

## React Template (`react-template/`)

| Task | Skill |
|------|-------|
| Create a GitHub Actions workflow (SCP → nginx deploy) | `react-template/.claude/skills/github-workflow-deploy/SKILL.md` |

**Pattern:** Vite builds `dist/` → `.env` fetched from server before build → SCP `dist/` to server → nginx serves static files. No Docker needed.

---

## Which skill to use?

| Template | Has Dockerfile? | Deploy target |
|----------|----------------|---------------|
| `nest-template` | Yes — required | Docker container on Ubuntu |
| `next-template` | Yes — required | Docker container on Ubuntu |
| `react-template` | No | nginx on Ubuntu (static files via SCP) |
