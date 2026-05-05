---
name: routes
description: Use when navigating programmatically, linking between pages, adding new routes, updating access control, or working with proxy.ts.
---

# Skill: Route Management

---

## Rule: Never Hardcode Route Strings

**CRITICAL:** Routes must never be written as string literals in components or pages. Always import from `ROUTES`.

```typescript
// ❌ NEVER
router.push('/dashboard');
redirect('/login');
<Link href="/profile">Profile</Link>

// ✅ ALWAYS
import { ROUTES } from '@/app/_shared/lib/config/routes';
router.push(ROUTES.DASHBOARD);
redirect(ROUTES.LOGIN);
<Link href={ROUTES.PROFILE}>Profile</Link>
```

---

## Route Configuration (`app/_shared/lib/config/routes.ts`)

```typescript
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROFILE: '/dashboard/profile',
  // ... all routes defined here
} as const;

// Route group arrays (used by proxy.ts for access control)
export const PUBLIC_ROUTES = [ROUTES.HOME] as const;
export const PROTECTED_ROUTES = [ROUTES.DASHBOARD, ROUTES.PROFILE] as const;
export const AUTH_ROUTES = [ROUTES.LOGIN] as const;

// O(1) lookup helpers
export const isPublicRoute = (path: string): boolean => ...
export const isProtectedRoute = (path: string): boolean => ...
export const isAuthRoute = (path: string): boolean => ...
```

---

## Adding a New Route

1. Add the constant to `ROUTES`:

```typescript
export const ROUTES = {
  // ...existing routes
  SETTINGS: '/dashboard/settings',
} as const;
```

2. Add the page file:
   - Protected page → `app/(pages)/(dashboard)/settings/page.tsx`
   - Auth page → `app/(pages)/(auth)/register/page.tsx`
   - Public page → `app/(pages)/about/page.tsx`

3. Add to the correct route group array:
   - `PROTECTED_ROUTES` — requires authentication
   - `AUTH_ROUTES` — redirects away if already authenticated
   - `PUBLIC_ROUTES` — accessible to everyone

---

## Navigation in Components

```typescript
// Client-side navigation (in 'use client' components)
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/app/_shared/lib/config/routes';

const router = useRouter();
router.push(ROUTES.DASHBOARD);
router.replace(ROUTES.LOGIN);

// Link component
import Link from 'next/link';
<Link href={ROUTES.DASHBOARD}>Go to Dashboard</Link>

// Server-side redirect (in Server Components / API routes)
import { redirect } from 'next/navigation';
redirect(ROUTES.LOGIN);
```

---

## Why This Pattern?

| Benefit | Explanation |
|---|---|
| Refactoring safety | Change a URL in one place — all usages update automatically |
| Type safety | TypeScript catches `ROUTES.DASHBORD` (typo) at compile time |
| IDE autocompletion | `ROUTES.` shows all valid routes |
| Access control | `PROTECTED_ROUTES` array is the single source of truth for proxy.ts |
| No broken links | Impossible to have a mismatched path between navigation and the actual page |
