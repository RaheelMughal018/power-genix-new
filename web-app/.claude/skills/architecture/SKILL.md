---
name: architecture
description: Use when setting up new pages/routes, understanding folder structure, configuring Next.js, adding new path aliases, or navigating the codebase for the first time.
---

# Skill: Project Architecture

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS v4 + SCSS/Sass modules |
| State | Redux Toolkit + redux-persist |
| Theme | next-themes (dark/light) |
| Forms | Formik + Yup |
| HTTP | Axios with token refresh |

---

## Project Structure

```
app/
├── (pages)/
│   ├── (auth)/                   # Unauthenticated route group
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   └── (dashboard)/              # Authenticated route group
│       ├── dashboard/page.tsx
│       └── layout.tsx            # Wraps with auth check
├── _shared/                      # All shared code lives here
│   ├── components/
│   │   ├── ui/                   # Reusable UI primitives
│   │   ├── forms/                # Form-level components
│   │   └── providers/            # StoreProvider, ThemeProvider, ToastProvider
│   └── lib/
│       ├── api/                  # Axios instance + interceptors
│       ├── config/               # routes.ts (ROUTES, PUBLIC_ROUTES, etc.)
│       ├── hooks/                # useAuth, useTheme, useRedux, useToast
│       ├── store/                # Redux slices + store config
│       ├── types/                # Global TypeScript types
│       ├── utils/                # storage.ts (cookies), assets.ts
│       └── validations/          # Yup schemas
├── api/                          # Next.js API routes
├── layout.tsx                    # Root layout (StoreProvider, ThemeProvider)
├── globals.css                   # Tailwind + CSS custom properties
├── error.tsx                     # Global error boundary
├── loading.tsx                   # Global loading UI
└── not-found.tsx                 # 404 page

public/
├── icons/index.ts
├── images/index.ts
└── fonts/index.ts

proxy.ts                          # Auth protection + redirects (Next.js 16)
```

---

## Path Aliases

The `@/*` alias maps to the **project root**.

```typescript
@/app/_shared/lib/*           // Utilities, hooks, store, API
@/app/_shared/components/*    // Shared components
@/app/_shared/lib/config/routes   // Route configuration
@/app/_shared/lib/hooks/useAuth   // Auth hook
@/app/_shared/lib/store/store     // Redux store
@/app/_shared/lib/utils/storage   // Cookie utilities
@/public/images                   // Image asset exports
@/public/icons                    // Icon asset exports
```

> Always use `@/app/_shared/` prefix when importing from shared folders. Never use relative paths like `../../lib/`.

---

## Next.js Configuration (`next.config.ts`)

- `output: "standalone"` — Docker/container-ready builds
- Root redirect: `/` → `/dashboard` when `token` cookie exists
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
- Images: WebP/AVIF auto-format, all HTTPS remote patterns allowed

---

## Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NODE_ENV=development
```

- `NEXT_PUBLIC_API_BASE_URL` — used in `app/_shared/lib/api/axios.ts`
- `NODE_ENV` — affects cookie `secure` flag in `app/_shared/lib/utils/storage.ts`

---

## Adding New Pages

1. Create route folder inside the appropriate route group:
   - Auth pages → `app/(pages)/(auth)/your-page/page.tsx`
   - Protected pages → `app/(pages)/(dashboard)/your-page/page.tsx`
2. Add the route constant to `app/_shared/lib/config/routes.ts`
3. Update `PUBLIC_ROUTES`, `PROTECTED_ROUTES`, or `AUTH_ROUTES` in `routes.ts` as needed
