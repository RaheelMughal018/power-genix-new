# Next.js Production-Ready Template

A complete, production-ready Next.js template with authentication, form validation, theming, and scalable architecture.

## Features

- **Next.js 16** with App Router
- **React 19** with latest features
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **SCSS/Sass** support with mixins and variables
- **Redux Toolkit** for state management
- **next-themes** for dark/light mode
- **Formik + Yup** for form handling and validation
- **Axios** with token refresh and request queue
- **Authentication** with middleware protection
- **Route groups** for organized code structure

## Project Structure

```
app/
├── (pages)/
│   ├── (auth)/             # Auth route group (login, register, etc.)
│   │   ├── login/
│   │   └── layout.tsx
│   └── (dashboard)/        # Protected route group
│       ├── dashboard/
│       └── layout.tsx
├── _shared/                # Shared code (components, lib, hooks, assets)
│   ├── assets/
│   │   ├── icons/          # SVG icons with index.ts export
│   │   ├── images/         # Images with index.ts export
│   │   └── fonts/          # Fonts with index.ts export
│   ├── components/
│   │   ├── ui/             # Reusable UI components (button, input, themeToggle)
│   │   ├── forms/          # Form-specific components
│   │   └── providers/      # StoreProvider, ThemeProvider
│   └── lib/
│       ├── api/            # Axios configuration with token refresh
│       ├── config/         # Route configuration (ROUTES constants)
│       ├── hooks/          # Custom React hooks (useAuth, useTheme, useRedux)
│       ├── store/          # Redux store and slices
│       ├── utils/          # Utility functions (storage, assets)
│       ├── validations/    # Yup validation schemas
│       └── types/          # TypeScript types
├── api/                    # API routes
├── layout.tsx              # Root layout
├── page.tsx                # Landing page
├── globals.css             # Global styles with CSS variables
├── error.tsx               # Error boundary
├── loading.tsx             # Loading UI
└── not-found.tsx           # 404 page

public/
└── favicon.ico             # Root-served static files (favicon, robots.txt, etc.)

styles/
├── _variables.scss         # SCSS variables
├── _mixins.scss            # SCSS mixins
└── globals.scss            # SCSS entry point

proxy.ts                    # Next.js proxy for auth (replaces middleware in v16)
```

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd template
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Update the values in `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=Next.js Template
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## Authentication

The template includes a complete authentication system:

### Route Configuration

All routes are defined in `app/_shared/lib/config/routes.ts`. **Never hardcode route strings** - always use the `ROUTES` constant:

```typescript
import { ROUTES } from '@/app/_shared/lib/config/routes';

// Use ROUTES constant for navigation
router.push(ROUTES.DASHBOARD);
redirect(ROUTES.LOGIN);
```

### Protected Routes

Add routes to `PROTECTED_ROUTES` in `app/_shared/lib/config/routes.ts`:

```typescript
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.PROFILE,
  ROUTES.SETTINGS,
];
```

### Public Routes

Add routes that don't require authentication to `PUBLIC_ROUTES`:

```typescript
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
];
```

### Auth Hooks

Use the `useAuth` hook for authentication operations:

```typescript
import { useAuth } from '@/app/_shared/lib/hooks/useAuth';

function MyComponent() {
  const { isLoggedIn, user, login, logout } = useAuth();

  // ...
}
```

## Form Validation

The template uses Formik + Yup for form handling:

```typescript
import { useFormik } from 'formik';
import { loginSchema } from '@/app/_shared/lib/validations/schemas';

const formik = useFormik({
  initialValues: {
    email: '',
    password: '',
  },
  validationSchema: loginSchema,
  onSubmit: async (values) => {
    // Handle form submission
  },
});
```

### Available Schemas

- `loginSchema` - Email and password validation
- `registerSchema` - Registration form validation
- `forgotPasswordSchema` - Forgot password validation
- `resetPasswordSchema` - Reset password validation
- `profileSchema` - Profile update validation
- `changePasswordSchema` - Change password validation
- `contactSchema` - Contact form validation

## Theming

The template includes dark/light mode support via `next-themes`:

### Theme Toggle

```typescript
import { ThemeToggle } from '@/app/_shared/components/ui/themeToggle/themeToggle';

function Header() {
  return (
    <header>
      <ThemeToggle />
    </header>
  );
}
```

### Custom Theme Hook

```typescript
import { useTheme } from '@/app/_shared/lib/hooks/useTheme';

function MyComponent() {
  const { theme, toggleTheme, isDark } = useTheme();
  // ...
}
```

### CSS Custom Properties

Theme colors are defined in `app/globals.css`:

```css
:root {
  --color-primary-500: #3b82f6;
  --color-bg-primary: #ffffff;
  --color-text-primary: #111827;
  /* ... */
}

.dark {
  --color-bg-primary: #111827;
  --color-text-primary: #f9fafb;
  /* ... */
}
```

## API Configuration

Axios is configured with automatic token refresh:

```typescript
import axiosInstance from '@/app/_shared/lib/api/axios';
import { apiClient } from '@/app/_shared/lib/api/axios';

// Using the axios instance
const response = await axiosInstance.get('/users');

// Using the API client methods
const users = await apiClient.get('/users');
const user = await apiClient.post('/users', { name: 'John' });
```

### Token Refresh

The axios instance automatically:
- Adds auth tokens to requests
- Refreshes expired tokens
- Queues requests during token refresh
- Redirects to login on refresh failure

## State Management

Redux Toolkit is configured for global state:

```typescript
import { useAppDispatch, useAppSelector } from '@/app/_shared/lib/hooks/useRedux';
import { login, logout } from '@/app/_shared/lib/store/slices/authSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const user = useAppSelector((state) => state.user.user);

  // ...
}
```

## UI Components

**Naming Convention:** All component folders and files use **camelCase** (e.g., `button/button.tsx`, `themeToggle/themeToggle.tsx`).

### Button

```typescript
import { Button } from '@/app/_shared/components/ui/button/button';

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>
```

Props:
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean
- `fullWidth`: boolean

### Input

```typescript
import { Input } from '@/app/_shared/components/ui/input/input';

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errorMessage}
  helpText="We'll never share your email"
/>
```

Props:
- `label`: string
- `error`: string
- `helpText`: string
- `size`: 'sm' | 'md' | 'lg'
- `leftIcon`: React.ReactNode
- `rightIcon`: React.ReactNode

## Asset Management

All static assets (images, icons, fonts) live in `app/_shared/assets/` and must be exported through their respective `index.ts` files before use. The `public/` folder is reserved only for root-served files such as `favicon.ico` and `robots.txt`.

### Adding Assets

1. Place the asset file in the appropriate folder under `app/_shared/assets/` (`icons/`, `images/`, or `fonts/`)
2. Export the path in the corresponding `index.ts` file
3. Import from the index file in your components

```typescript
// app/_shared/assets/images/index.ts
export const images = {
  heroBanner: '/images/hero-banner.jpg',
  userAvatar: '/images/user-avatar.png',
} as const;

// Usage in component
import { images } from '@/app/_shared/assets/images';
import Image from 'next/image';

<Image src={images.heroBanner} alt="Hero" width={800} height={400} />
```

### Using Next.js Image

**Always use the Next.js `Image` component** for displaying images. Never use the native `<img>` tag.

```typescript
// ❌ Don't use native img tag
<img src="/images/hero.jpg" alt="Hero" />

// ❌ Don't import from the old public/ location
import { images } from '@/public/images';

// ✅ Use Next.js Image with the correct import path
import Image from 'next/image';
import { images } from '@/app/_shared/assets/images';

<Image src={images.heroBanner} alt="Hero" width={800} height={400} priority />
```

## Code Quality Standards

### Component Size Limit

Component files must **never exceed 300-350 lines** of code. If a component grows beyond this limit:
- Extract sub-components into separate files
- Move logic to custom hooks in `app/_shared/lib/hooks/`
- Split large forms into field components

```
✅ Good structure:
app/_shared/components/forms/loginForm/
├── loginForm.tsx        # Main component (80 lines)
├── emailField.tsx       # Sub-component (40 lines)
├── passwordField.tsx    # Sub-component (45 lines)
└── useLoginForm.ts      # Custom hook (60 lines)
```

### Modals & Dialogs

Every modal or dialog must live in its own dedicated component file. Never inline modal content inside a parent component.

```
✅ Good structure:
app/_shared/components/ui/confirmDeleteModal/
├── confirmDeleteModal.tsx
└── confirmDeleteModal.module.scss

// Usage in parent
import { ConfirmDeleteModal } from '@/app/_shared/components/ui/confirmDeleteModal/confirmDeleteModal';

<ConfirmDeleteModal isOpen={isOpen} onClose={() => setIsOpen(false)} onConfirm={handleDelete} />
```

## SCSS Support

The template includes SCSS with mixins and variables:

```scss
// In your component styles
.my-component {
  @include flex-center;
  @include container;

  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
}
```

### Available Mixins

- `flex-center` - Center with flexbox
- `flex-between` - Space between with flexbox
- `absolute-center` - Absolute positioning center
- `text-truncate` - Truncate text with ellipsis
- `sr-only` - Screen reader only content
- `custom-scrollbar` - Custom styled scrollbar

## Path Aliases

The `@/*` alias maps to the project root. Common import patterns:

```typescript
// Shared utilities
import { useAuth } from '@/app/_shared/lib/hooks/useAuth';
import { ROUTES } from '@/app/_shared/lib/config/routes';

// Components
import { Button } from '@/app/_shared/components/ui/button/button';

// Assets
import { images } from '@/app/_shared/assets/images';
import { icons } from '@/app/_shared/assets/icons';
```

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t nextjs-template .
docker run -p 3000:3000 nextjs-template
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this template for any project.
