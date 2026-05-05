---
name: auth
description: Use when implementing login/logout, protecting routes, working with tokens, modifying the proxy, handling API auth errors, or adding new protected/public pages.
---

# Skill: Authentication Architecture

---

## Overview

Authentication is implemented across three layers:
1. **`proxy.ts`** — edge-level route protection
2. **Axios interceptor** — attaches tokens to requests, handles refresh
3. **Redux auth slice** — persists login state client-side

---

## Proxy (`proxy.ts`)

Runs on every request at the Next.js edge layer.

**Logic:**
- Reads `token` cookie
- Unauthenticated user on a protected route → redirect to `/login`
- Authenticated user on an auth route (e.g. `/login`) → redirect to `/dashboard`
- All other cases → pass through

**To change protection rules:** modify `PROTECTED_ROUTES` and `AUTH_ROUTES` in `app/_shared/lib/config/routes.ts` (see `.claude/skills/routes/SKILL.md`).

> Note: This file is named `proxy.ts` (not `middleware.ts`) as per Next.js 16 conventions.

---

## Axios Interceptor (`app/_shared/lib/api/axios.ts`)

```
Request → attach Bearer token from cookies
                          ↓
Response 401 → queue pending requests (max 100)
                          ↓
              POST /auth/refresh with refreshToken
                          ↙          ↘
              Success               Failure
         retry queued reqs     clear cookies + redirect /login
```

**Key behaviors:**
- Token read from cookies via `storage.ts` utilities
- A single refresh request is made even if multiple 401s occur simultaneously (queue pattern)
- On refresh success: all queued requests are retried with the new token
- On refresh failure: `isLoggedIn` and both tokens are cleared, user sent to login

---

## API Client (`app/_shared/lib/api/client.ts`)

Pre-configured Axios instance. Use this for all API calls:

```typescript
import { apiClient } from '@/app/_shared/lib/api/client';

const response = await apiClient.get('/users/me');
const response = await apiClient.post('/auth/login', { email, password });
```

---

## Auth Hook (`app/_shared/lib/hooks/useAuth.ts`)

```typescript
import { useAuth } from '@/app/_shared/lib/hooks/useAuth';

const { isLoggedIn, token, user, login, logout } = useAuth();
```

---

## Redux Auth Slice (`app/_shared/lib/store/slices/authSlice.ts`)

Persisted fields: `isLoggedIn`, `token`, `refreshToken`

```typescript
import { useAppDispatch, useAppSelector } from '@/app/_shared/lib/hooks/useRedux';
import { setToken, clearAuth } from '@/app/_shared/lib/store/slices/authSlice';

const dispatch = useAppDispatch();
dispatch(setToken({ token: 'abc', refreshToken: 'xyz' }));
dispatch(clearAuth());
```

---

## Storage Utilities (`app/_shared/lib/utils/storage.ts`)

Cookie helpers used by both the interceptor and auth slice:

```typescript
import { storage } from '@/app/_shared/lib/utils/storage';

storage.getToken()           // Read token cookie
storage.setToken(token)      // Write token cookie
storage.clear()              // Remove all auth cookies
```

Cookie `secure` flag is set based on `NODE_ENV`.

---

## Login Flow (End-to-End)

```
1. User submits login form (Formik + loginSchema)
2. POST /auth/login via apiClient
3. On success: dispatch setToken() → persist to cookies
4. router.push(ROUTES.DASHBOARD)

Proxy redirects any visit to /login back to /dashboard
once the token cookie is present.
```

---

## Form Validation Schemas (`app/_shared/lib/validations/schemas.ts`)

Pre-built Yup schemas:

| Schema | Use case |
|---|---|
| `loginSchema` | Email + password login |
| `registerSchema` | Full registration |
| `forgotPasswordSchema` | Email only |
| `resetPasswordSchema` | New + confirm password |
| `profileSchema` | Name, bio, etc. |
| `changePasswordSchema` | Current + new password |
| `contactSchema` | Name, email, message |

```typescript
import { loginSchema } from '@/app/_shared/lib/validations/schemas';
// Use with Formik: validationSchema: loginSchema
```
