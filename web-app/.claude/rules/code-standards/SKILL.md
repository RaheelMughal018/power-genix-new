---
name: code-standards
description: Rules for component size, naming conventions, file structure, TypeScript strictness, and no magic strings. Apply when creating any component, naming files, or reviewing code.
---

# Rules: Code Standards

---

## Rule 1: Component Size Limit (300–350 lines max)

**CRITICAL:** A single component file must never exceed 300–350 lines of code.

If a component is growing beyond this limit, apply one or more of these strategies:

| Strategy | How |
|---|---|
| Extract sub-components | Move sections into separate `*.tsx` files in the same folder |
| Move logic to a hook | Extract `useState`, `useEffect`, handlers → `useYourFeature.ts` in `_shared/lib/hooks/` |
| Split large forms | Each field group becomes its own component file |
| Extract utilities | Pure helper functions → `_shared/lib/utils/` |

```
// ❌ One giant file
app/_shared/components/forms/checkoutForm/checkoutForm.tsx  (600 lines)

// ✅ Split into focused pieces
app/_shared/components/forms/checkoutForm/
├── checkoutForm.tsx          (70 lines  — orchestrator only)
├── shippingFields.tsx        (80 lines)
├── paymentFields.tsx         (90 lines)
├── orderSummary.tsx          (60 lines)
└── useCheckoutForm.ts        (80 lines  — all logic + state)
```

---

## Rule 2: Naming Conventions (camelCase)

**CRITICAL:** All component folders and filenames must use **camelCase**.

```
// ✅ Correct — camelCase
app/_shared/components/ui/button/button.tsx
app/_shared/components/ui/themeToggle/themeToggle.tsx
app/_shared/components/ui/fileUpload/fileUpload.tsx
app/_shared/components/forms/loginForm/loginForm.tsx
app/_shared/components/forms/loginForm/emailField.tsx

// ❌ Wrong — PascalCase folders/files
app/_shared/components/ui/Button/Button.tsx
app/_shared/components/forms/LoginForm/LoginForm.tsx

// ❌ Wrong — kebab-case
app/_shared/components/ui/theme-toggle/theme-toggle.tsx
app/_shared/components/forms/login-form/login-form.tsx
```

> The React component **exported from the file** is still PascalCase (e.g. `export const ThemeToggle`). Only the **file and folder names** use camelCase.

---

## Rule 3: Component File Structure

Follow this order within every component file:

```typescript
'use client'; // (if needed)

// 1. External imports
import { useState } from 'react';
import Image from 'next/image';

// 2. Internal imports (styles last)
import { ROUTES } from '@/app/_shared/lib/config/routes';
import { images } from '@/public/images';
import styles from './componentName.module.scss';

// 3. TypeScript interface
interface ComponentNameProps {
  label: string;
  variant?: 'primary' | 'secondary';
  onChange?: (value: string) => void;
}

// 4. Component
export const ComponentName = ({ label, variant = 'primary', onChange }: ComponentNameProps) => {
  // State
  const [value, setValue] = useState('');

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange?.(e.target.value);
  };

  // Render
  return (
    <div className={[styles.component, styles[`component--${variant}`]].filter(Boolean).join(' ')}>
      ...
    </div>
  );
};
```

---

## Rule 4: Conditional Class Names

Use `filter(Boolean).join(' ')` — never template literals with ternaries for multiple classes:

```typescript
// ✅ Clean
className={[
  styles.button,
  styles[`button--${variant}`],
  disabled ? styles['button--disabled'] : '',
  className,
].filter(Boolean).join(' ')}

// ❌ Messy
className={`${styles.button} ${styles[`button--${variant}`]} ${disabled ? styles['button--disabled'] : ''}`}
```

---

## Rule 5: TypeScript Strictness

- All component props must have a TypeScript interface
- Prefer `interface` over `type` for component props
- Use `as const` for enum-like objects
- Avoid `any` — use `unknown` and narrow the type instead

---

## Rule 7: Keep Functions Short — Split Instead of Branching

If a function is growing long due to `if/else` or conditional logic, split it into separate focused functions rather than one long branching function.

```typescript
// ❌ One long function with branches
const handleSubmit = async (type: 'create' | 'update') => {
  if (type === 'create') {
    // 20 lines of create logic
  } else {
    // 20 lines of update logic
  }
};

// ✅ Two focused functions
const handleCreate = async () => {
  // create logic only
};

const handleUpdate = async () => {
  // update logic only
};
```

---

## Rule 6: No Magic Strings

- Route strings → always use `ROUTES.*` (see `.claude/skills/routes/SKILL.md`)
- Asset paths → always use `images.*` / `icons.*` (see `.claude/skills/rules/assets/SKILL.md`)
- API endpoints → define as constants, not inline strings
