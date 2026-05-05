---
name: add-authentication
description: Wires up authentication across frontend and backend. Connects backend JWT auth to frontend auth context, login/signup pages, token management, and protected routes.
---

# Add Authentication (Full-Stack)

## Overview

This skill connects the backend authentication system to the frontend. The backend template already includes JWT auth with access/refresh tokens. This skill wires up the frontend to consume it.

## Prerequisites

- Backend must have the auth module set up (included in nest-template by default)
- Frontend must have the API layer configured (included in react-template and next-template by default)

## Step 1: Verify Backend Auth Endpoints

Check that the backend has these endpoints available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | Login with email/password, returns access + refresh tokens |
| `/auth/refresh` | POST | Refresh the access token |
| `/auth/forgot-password` | POST | Send password reset email |
| `/auth/reset-password` | POST | Reset password with token |
| `/users/signup` | POST | Register a new user |
| `/users/profile` | GET | Get current user profile |

If any are missing, create them following the backend `CLAUDE.md` conventions before proceeding.

## Step 2: Frontend — API Layer

1. Configure the Axios instance base URL to point to the backend
2. Set up the request interceptor to attach the access token
3. Set up the response interceptor for token refresh on 401
4. Create auth API functions: `login`, `signup`, `refreshToken`, `forgotPassword`, `resetPassword`, `getProfile`

## Step 3: Frontend — State Management

1. Create or verify the auth Redux slice with: `user`, `isAuthenticated`, `isLoading` state
2. Add async thunks: `loginUser`, `signupUser`, `refreshAuth`, `logoutUser`
3. Set up redux-persist for the auth slice

## Step 4: Frontend — Auth Pages

1. Create login page with form (email + password)
2. Create signup page with form
3. Create forgot password page
4. Create reset password page
5. Use Formik + Yup for form handling and validation

## Step 5: Frontend — Route Protection

1. Verify route guards redirect unauthenticated users to login
2. Verify authenticated users are redirected away from auth pages
3. Test the full auth flow: signup → login → access protected page → logout

## Standalone Projects

For backend-only: skip Steps 2-5, just verify the auth module works via Swagger.
For frontend-only: skip Step 1, implement Steps 2-5 against the expected API contract.
