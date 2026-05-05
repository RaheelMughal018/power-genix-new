---
name: styling
description: Use when adding styles to components, creating SCSS modules, working with dark mode, using CSS custom properties, or extending the theme.
---

# Skill: Styling System

---

## Overview

This project uses a **hybrid styling system**: Tailwind CSS v4 for utility classes and SCSS modules for component-scoped styles. Both systems share the same CSS custom properties defined in `app/globals.css`.

---

## CSS Custom Properties (`app/globals.css`)

All theme tokens are defined as CSS variables. Dark mode is applied via the `.dark` class on `<html>`.

### Color Tokens

```css
/* Primary palette */
--color-primary-50 through --color-primary-900

/* Semantic background */
--color-bg-primary        /* Main page background */
--color-bg-secondary      /* Cards, panels */
--color-bg-tertiary       /* Hover states, subtle backgrounds */

/* Semantic text */
--color-text-primary      /* Headings, body */
--color-text-secondary    /* Subtitles, labels */
--color-text-tertiary     /* Placeholders, disabled */
--color-text-inverse      /* Text on dark/colored backgrounds */

/* Borders */
--color-border            /* Default border */
--color-border-focus      /* Focus ring */

/* Status colors */
--color-success-*         /* Green variants */
--color-warning-*         /* Yellow/orange variants */
--color-error-*           /* Red variants */
--color-info-*            /* Blue variants */
```

### Spacing Tokens

```css
--spacing-xs    /* 4px */
--spacing-sm    /* 8px */
--spacing-md    /* 16px */
--spacing-lg    /* 24px */
--spacing-xl    /* 32px */
--spacing-2xl   /* 48px */
```

### Other Tokens

```css
--radius-sm / --radius-md / --radius-lg / --radius-xl / --radius-full
--shadow-sm / --shadow-md / --shadow-lg / --shadow-xl
--transition-fast / --transition-base / --transition-slow
```

---

## Tailwind CSS v4

Setup in `app/globals.css`:

```css
@import "tailwindcss";

@theme inline {
  /* Token overrides registered here */
}
```

Use standard Tailwind utility classes for layout and spacing. When referencing CSS custom properties in Tailwind classes, use the modern v4 syntax:

```html
<!-- ✅ Tailwind v4 CSS variable syntax -->
<div class="bg-(--color-bg-primary) text-(--color-text-primary) border-(--color-border)">

<!-- ❌ Old bracket syntax (generates lint warnings) -->
<div class="bg-[var(--color-bg-primary)]">
```

---

## SCSS Modules

Every component that needs custom styles gets a co-located `.module.scss` file.

### File Structure

```
app/_shared/components/ui/button/
├── button.tsx
└── button.module.scss       ← co-located module
```

### Importing Globals

```scss
// At the top of any .module.scss file
@use '@/app/_shared/styles/globals' as *;
// Or just:
@use '@/app/_shared/styles/_variables' as *;
@use '@/app/_shared/styles/_mixins' as *;
```

### Available SCSS Mixins (`app/_shared/styles/_mixins.scss`)

```scss
@include flex-center;         // display:flex; align-items:center; justify-content:center
@include flex-between;        // display:flex; align-items:center; justify-content:space-between
@include text-truncate;       // overflow:hidden; white-space:nowrap; text-overflow:ellipsis
@include custom-scrollbar;    // Styled scrollbar with theme colors
```

### Pattern for Component SCSS

```scss
.component {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  transition: all var(--transition-fast);

  &:hover {
    background-color: var(--color-bg-secondary);
  }

  // Dark mode (via next-themes .dark class on <html>)
  :global(.dark) & {
    background-color: var(--color-gray-800);
    border-color: var(--color-gray-700);
  }
}
```

### Using SCSS Modules in Components

```typescript
import styles from './button.module.scss';

// Single class
<button className={styles.button}>

// Conditional classes
<button className={[
  styles.button,
  styles[`button--${variant}`],
  disabled ? styles['button--disabled'] : '',
].filter(Boolean).join(' ')}>
```

---

## Dark Mode

Dark mode is handled by `next-themes`. The `.dark` class is toggled on `<html>`.

- All CSS variables automatically switch values under `.dark` (defined in `globals.css`)
- In SCSS modules use `:global(.dark) &` for any dark-specific overrides
- In Tailwind use `dark:` prefix utilities as normal
- Use `useTheme()` hook to read/toggle theme in components:

```typescript
import { useTheme } from '@/app/_shared/lib/hooks/useTheme';
const { theme, toggleTheme } = useTheme();
```
