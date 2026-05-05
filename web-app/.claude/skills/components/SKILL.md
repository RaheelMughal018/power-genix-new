---
name: components
description: Use when using any existing UI component, building a new UI component, or understanding component patterns and conventions.
---

# Skill: UI Components

---

## Location & Conventions

All UI primitives live in `app/_shared/components/ui/`.

- **Naming:** camelCase folders and files (e.g. `fileUpload/fileUpload.tsx`)
- **Styles:** Co-located SCSS module (e.g. `fileUpload/fileUpload.module.scss`)
- **Size:** Never exceed 300–350 lines per file
- **Types:** TypeScript interface for all props
- **Theme:** Dark mode via CSS variables + `:global(.dark) &` in SCSS

---

## Available Components

### Layout & Navigation
| Component | Import path | Key props |
|---|---|---|
| `Accordion` | `ui/accordion/accordion` | `defaultExpanded`, `allowMultiple` |
| `Modal` | `ui/modal/modal` | `isOpen`, `onClose`, `size` |
| `Tabs` | `ui/tabs/tabs` | `defaultTab` |
| `Pagination` | `ui/pagination/pagination` | `currentPage`, `totalPages`, `onPageChange` |

### Forms & Inputs
| Component | Import path | Key props |
|---|---|---|
| `Button` | `ui/button/button` | `variant`, `size`, `loading`, `disabled` |
| `Input` | `ui/input/input` | `label`, `error`, `helpText`, `leftIcon`, `rightIcon` |
| `TextArea` | `ui/textArea/textArea` | `label`, `rows`, `maxLength`, `showCount`, `resize` |
| `Checkbox` | `ui/checkbox/checkbox` | `label`, `checked`, `indeterminate`, `onChange` |
| `ToggleSwitch` | `ui/toggleSwitch/toggleSwitch` | `label`, `checked`, `onChange` |
| `PhoneInput` | `ui/phoneInput/phoneInput` | `value`, `onChange`, `defaultCountry`, `label` |
| `FileUpload` | `ui/fileUpload/fileUpload` | `multiple`, `maxFiles`, `maxSize`, `accept`, `onFilesChange` |
| `Dropdown` | `ui/dropdown/dropdown` | `trigger`, children |

### Feedback & Display
| Component | Import path | Key props |
|---|---|---|
| `Alert` | `ui/alert/alert` | `variant`, `title`, `onClose` |
| `Badge` | `ui/badge/badge` | `variant`, `size`, `pill` |
| `Tooltip` | `ui/tooltip/tooltip` | `content`, `position` |
| `Spinner` | `ui/spinner/spinner` | `size`, `variant` |
| `NoContentCard` | `ui/noContentCard/noContentCard` | `title`, `description`, `action`, `icon` |
| `Toast` | `ui/toast/toast` | via `useToast()` hook + `ToastProvider` |

---

## Usage Examples

### Accordion

```typescript
import { Accordion } from '@/app/_shared/components/ui/accordion/accordion';

<Accordion defaultExpanded={['item-1']} allowMultiple>
  <Accordion.Item id="item-1">
    <Accordion.Trigger>Section 1</Accordion.Trigger>
    <Accordion.Content>Content 1</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item id="item-2">
    <Accordion.Trigger>Section 2</Accordion.Trigger>
    <Accordion.Content>Content 2</Accordion.Content>
  </Accordion.Item>
</Accordion>
```

### Modal

```typescript
import { Modal } from '@/app/_shared/components/ui/modal/modal';
import { Button } from '@/app/_shared/components/ui/button/button';

const [isOpen, setIsOpen] = useState(false);

// Full modal with header + footer
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
  <Modal.Header
    title="Confirm Action"
    showBack={false}
    showClose={true}
    onClose={() => setIsOpen(false)}
  />
  <Modal.Content>
    <p>Are you sure you want to proceed?</p>
  </Modal.Content>
  <Modal.Footer>
    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button onClick={handleConfirm}>Confirm</Button>
  </Modal.Footer>
</Modal>

// Content-only modal (no header/footer)
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="sm">
  <Modal.Content>
    <p>Simple content only...</p>
  </Modal.Content>
</Modal>
```

**Modal sizes:** `sm` | `md` | `lg` | `xl` | `full`
**Modal.Header props:** `title?`, `showBack?`, `showClose?`, `onBack?`, `onClose?`

### Alert

```typescript
import { Alert } from '@/app/_shared/components/ui/alert/alert';

<Alert variant="success" title="Saved!" onClose={() => setVisible(false)}>
  Your changes have been saved successfully.
</Alert>
// variants: info | success | warning | error
```

### Badge

```typescript
import { Badge } from '@/app/_shared/components/ui/badge/badge';

<Badge variant="primary" pill>New</Badge>
<Badge variant="success" size="sm">Active</Badge>
// variants: primary | secondary | success | warning | error | info
```

### Button

```typescript
import { Button } from '@/app/_shared/components/ui/button/button';

<Button variant="primary" size="md" onClick={handleClick}>Save</Button>
<Button variant="outline" loading={isLoading} disabled={isLoading}>Submit</Button>
// variants: primary | secondary | outline | ghost | danger
// sizes: sm | md | lg
```

### Checkbox

```typescript
import { Checkbox } from '@/app/_shared/components/ui/checkbox/checkbox';

<Checkbox
  label="Accept terms and conditions"
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
/>
```

### Dropdown

```typescript
import { Dropdown } from '@/app/_shared/components/ui/dropdown/dropdown';
import { Button } from '@/app/_shared/components/ui/button/button';

<Dropdown trigger={<Button variant="outline">Options</Button>}>
  <Dropdown.Item onClick={handleEdit}>Edit</Dropdown.Item>
  <Dropdown.Item onClick={handleDuplicate}>Duplicate</Dropdown.Item>
  <Dropdown.Divider />
  <Dropdown.Item destructive onClick={handleDelete}>Delete</Dropdown.Item>
</Dropdown>
```

### FileUpload

```typescript
import { FileUpload } from '@/app/_shared/components/ui/fileUpload/fileUpload';

<FileUpload
  multiple
  maxFiles={5}
  maxSize={5 * 1024 * 1024}  // 5MB
  accept="image/*,.pdf"
  onFilesChange={(files) => setFiles(files)}
/>
```

### Pagination

```typescript
import { Pagination } from '@/app/_shared/components/ui/pagination/pagination';

<Pagination
  currentPage={currentPage}
  totalPages={20}
  onPageChange={(page) => setCurrentPage(page)}
/>
```

### PhoneInput

```typescript
import { PhoneInput } from '@/app/_shared/components/ui/phoneInput/phoneInput';

<PhoneInput
  value={phone}
  onChange={setPhone}
  defaultCountry="US"
  label="Phone Number"
/>
```

### Tabs

```typescript
import { Tabs } from '@/app/_shared/components/ui/tabs/tabs';

<Tabs defaultTab="overview">
  <Tabs.List>
    <Tabs.Tab id="overview">Overview</Tabs.Tab>
    <Tabs.Tab id="details">Details</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="overview">Overview content</Tabs.Panel>
  <Tabs.Panel id="details">Details content</Tabs.Panel>
</Tabs>
```

### TextArea

```typescript
import { TextArea } from '@/app/_shared/components/ui/textArea/textArea';

<TextArea
  label="Description"
  rows={6}
  maxLength={500}
  showCount
  resize="vertical"
  placeholder="Enter description..."
/>
```

### ToggleSwitch

```typescript
import { ToggleSwitch } from '@/app/_shared/components/ui/toggleSwitch/toggleSwitch';

<ToggleSwitch
  label="Enable notifications"
  checked={enabled}
  onChange={(e) => setEnabled(e.target.checked)}
/>
```

### Tooltip

```typescript
import { Tooltip } from '@/app/_shared/components/ui/tooltip/tooltip';

<Tooltip content="More information here" position="top">
  <span>Hover me</span>
</Tooltip>
// positions: top | bottom | left | right
```

### NoContentCard

```typescript
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { Button } from '@/app/_shared/components/ui/button/button';

<NoContentCard
  title="No items found"
  description="Try adjusting your search filters or create a new item."
  action={<Button onClick={handleCreate}>Create Item</Button>}
/>
```

### Spinner

```typescript
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';

<Spinner size="md" variant="primary" />
// sizes: sm | md | lg | xl
// variants: primary | secondary | white
```

### Toast

```typescript
// 1. Wrap your layout/page with ToastProvider
import { ToastProvider } from '@/app/_shared/components/ui/toast/toast';

<ToastProvider position="top-right">
  <YourApp />
</ToastProvider>

// 2. Use the hook in any child component
import { useToast } from '@/app/_shared/components/ui/toast/toast';

const { addToast } = useToast();

addToast({
  title: 'Success',
  description: 'Your changes have been saved.',
  variant: 'success',   // info | success | warning | error
  duration: 4000,       // ms, optional
});
```

---

## Creating a New Component

Follow this checklist:

1. Create folder: `app/_shared/components/ui/yourComponent/` (camelCase)
2. Create `yourComponent.tsx` (max 300–350 lines)
3. Create `yourComponent.module.scss` (co-located styles)
4. Define TypeScript interface for props
5. Use CSS custom properties (`var(--color-*)`) for all colors
6. Add dark mode support via `:global(.dark) &` in SCSS
7. Export the component as a named export (not default)
8. Add to this skills file under the appropriate category
9. Add demo to `app/page.tsx` homepage showcase
