---
name: assets
description: Rules for asset management — adding images, icons, and fonts. Never reference asset paths directly; always export from index.ts and use Next.js Image component.
---

# Rules: Asset Management

---

## Rule: All Assets Go Through `index.ts`

**CRITICAL:** Never reference asset paths directly as strings in components. Every asset must be exported from its folder's `index.ts` in `app/_shared/assets/` first.

The `public/` folder is **only** for files that must be served at the root URL (e.g. `favicon.ico`, `robots.txt`). Do not place app assets there.

---

## Folder Structure

```
app/_shared/assets/
├── icons/
│   ├── index.ts      ← export all icons here
│   └── *.svg
├── images/
│   ├── index.ts      ← export all images here
│   └── *.*
└── fonts/
    ├── index.ts      ← export all fonts here
    └── *.*

public/
└── favicon.ico       ← root-served static files only
```

---

## Workflow: Adding a New Asset

### Adding an Image

```typescript
// Step 1: Place file at app/_shared/assets/images/hero-banner.jpg

// Step 2: Add to app/_shared/assets/images/index.ts
export const images = {
  heroBanner: '/images/hero-banner.jpg',
  profileAvatar: '/images/profile-avatar.png',
  // ... all other images
} as const;

// Step 3: Use in component
import Image from 'next/image';
import { images } from '@/app/_shared/assets/images';

<Image src={images.heroBanner} alt="Hero" width={800} height={400} priority />
```

### Adding an Icon

```typescript
// Step 1: Place file at app/_shared/assets/icons/close.svg

// Step 2: Add to app/_shared/assets/icons/index.ts
export const icons = {
  close: '/icons/close.svg',
  search: '/icons/search.svg',
  // ... all other icons
} as const;

// Step 3: Use in component
import { icons } from '@/app/_shared/assets/icons';
import Image from 'next/image';

<Image src={icons.close} alt="Close" width={24} height={24} />
```

---

## Rule: Always Use Next.js `<Image />`

**CRITICAL:** Never use the native `<img>` tag for displaying images. Always use the Next.js `Image` component.

```typescript
// ❌ NEVER
<img src="/images/hero.jpg" alt="Hero" />
<img src={images.hero} alt="Hero" />

// ✅ ALWAYS
import Image from 'next/image';
<Image src={images.hero} alt="Hero" width={800} height={400} />
```

### Common Image Props

```typescript
// Fixed size image
<Image src={images.logo} alt="Logo" width={120} height={40} />

// Fill parent container (parent must have position: relative + defined size)
<div style={{ position: 'relative', width: '100%', height: '300px' }}>
  <Image src={images.banner} alt="Banner" fill style={{ objectFit: 'cover' }} />
</div>

// Above-the-fold image (disables lazy loading)
<Image src={images.hero} alt="Hero" width={1200} height={600} priority />

// Responsive image with sizes hint
<Image
  src={images.card}
  alt="Card"
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, 400px"
/>
```

**Why `<Image />`?**
- Automatic WebP/AVIF format conversion
- Lazy loading by default
- Prevents layout shift (CLS)
- Responsive sizing built-in
- Better Core Web Vitals scores

---

## Anti-Patterns

```typescript
// ❌ Hardcoded path in JSX
<img src="/images/hero.jpg" />

// ❌ Path string directly in Next/Image without index.ts
<Image src="/images/hero.jpg" alt="Hero" width={800} height={400} />

// ❌ Wrong import path (old public/ location)
import { images } from '@/public/images';

// ✅ Correct pattern
import { images } from '@/app/_shared/assets/images';
<Image src={images.hero} alt="Hero" width={800} height={400} />
```
