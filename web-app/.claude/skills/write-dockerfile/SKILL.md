---
name: write-dockerfile
description: Use when creating or updating a Dockerfile for this Next.js project. Covers multi-stage build, Next.js standalone output, static asset copying, and correct runtime configuration for containerized deployment.
---

# Write Dockerfile — Next.js

## Overview

This project uses `output: "standalone"` in `next.config.ts`, which produces a self-contained `.next/standalone/` bundle. The Docker build has two stages: a `builder` stage that runs `next build`, and a `production` stage that copies only the standalone output and serves it with `node server.js`.

## Step 0: Ask the User

Before writing any files, ask these two questions one at a time:

1. **App name** — what is the name of this project? (e.g. `my-app`) — used as the Docker container name and in example commands
2. **Port number** — what port should the app listen on? (default: `3000`) — used in `EXPOSE`, `ENV PORT`, and the `-p` host mapping

Use the answers to replace `<APP_NAME>` and `<PORT>` throughout before writing any files.

## Key Facts About This Project

| Detail           | Value                                                              |
| ---------------- | ------------------------------------------------------------------ |
| Node version     | 22 (Alpine)                                                        |
| Build command    | `npm run build` → `next build`                                     |
| Build output     | `.next/standalone/` (self-contained bundle, set via `next.config`) |
| Start command    | `node server.js` (inside standalone dir)                           |
| Default port     | `3000`                                                             |
| Static assets    | `.next/static/` and `public/` must be copied manually             |
| Env files        | Not baked in — injected at runtime via `--env-file`               |
| No migrations    | Pure frontend app, no database                                     |

## Dockerfile

```dockerfile
# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Copy the standalone bundle (includes node_modules it needs)
COPY --from=builder /app/.next/standalone ./

# Copy static assets — required separately (not included in standalone)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=<PORT>
ENV HOSTNAME="0.0.0.0"

EXPOSE <PORT>

CMD ["node", "server.js"]
```

## .dockerignore

Always create alongside the Dockerfile:

```
node_modules
.next
.git
.env*
!.env.example
coverage
*.log
.DS_Store
```

## Critical Details

**Standalone output must be enabled** — confirm `next.config.ts` has `output: "standalone"`. This project already has it set. Without it, the multi-stage pattern above will not work.

**Three COPY steps are required in production stage:**
1. `.next/standalone` → the runnable app with its own `node_modules`
2. `.next/static` → JS chunks, CSS, and other static assets
3. `public/` → favicon, robots.txt, and any public-served files

Skipping either of the last two produces a running container with broken styles or missing assets.

**`HOSTNAME="0.0.0.0"` is mandatory** — without it, Next.js binds to `127.0.0.1` inside the container, making it unreachable from outside.

**Never use `next start` in Docker** — `next start` requires the full `node_modules` and Next.js package. In standalone mode, use `node server.js` directly.

**Never COPY `.env.*` files into the image** — inject at runtime:

```bash
docker run --env-file .env.production -p <PORT>:<PORT> <APP_NAME>
```

## Common Mistakes

| Mistake                                        | Fix                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| Not copying `.next/static`                     | Styles and JS bundles will be missing — always copy it              |
| Not copying `public/`                          | favicon, robots.txt, and static files will 404                      |
| Missing `HOSTNAME=0.0.0.0`                     | Container runs but is unreachable — port mapping won't work         |
| Using `next start` as CMD                      | Requires full Next.js install; use `node server.js` in standalone   |
| Copying `node_modules` from builder            | Standalone bundle includes its own — no extra copy needed           |
| Forgetting `output: "standalone"` in config    | Build won't produce `.next/standalone/`; check `next.config.ts`     |
| Baking `.env.*` into the image                 | Never. Inject at runtime via `--env-file`                           |

## File Creation

After all questions are answered and placeholders are filled in, write these two files to the project root:

1. **`Dockerfile`** — the full two-stage Dockerfile above with `<PORT>` replaced
2. **`.dockerignore`** — the `.dockerignore` block above (no substitutions needed)

Use the Write tool for both files.
