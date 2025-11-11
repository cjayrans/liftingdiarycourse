# UI Coding Standards

This document outlines the UI development standards for this project. **All developers must strictly adhere to these guidelines.**

## Component Library

### shadcn/ui Components

**ONLY shadcn/ui components should be used for the UI in this project.**

- All UI components must come from the [shadcn/ui](https://ui.shadcn.com/) library
- **ABSOLUTELY NO custom components should be created**
- If a component is needed, first check if shadcn/ui provides it
- All shadcn/ui components should be installed via the CLI: `npx shadcn@latest add [component-name]`

### Available shadcn/ui Components

Common components include:
- `Button`
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`
- `Dialog`, `Sheet`, `Popover`, `Tooltip`
- `Table`, `DataTable`
- `Form` (with react-hook-form integration)
- `Badge`, `Avatar`, `Separator`
- `Tabs`, `Accordion`, `Collapsible`
- `Alert`, `Toast`, `AlertDialog`
- And many more - see [shadcn/ui docs](https://ui.shadcn.com/docs/components)

### Component Composition

While custom components are not allowed, you can compose shadcn/ui components together:

```tsx
// ✅ CORRECT: Composing shadcn/ui components
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Action</Button>
      </CardContent>
    </Card>
  );
}

// ❌ INCORRECT: Creating custom components
function CustomButton({ children }: { children: React.ReactNode }) {
  return <button className="custom-styles">{children}</button>;
}
```

## Date Formatting

### date-fns Library

All date formatting must be done using the [date-fns](https://date-fns.org/) library.

```bash
npm install date-fns
```

### Standard Date Format

Dates should be formatted using the following pattern:

- `1st Sep 2025`
- `2nd Aug 2025`
- `3rd Jan 2026`
- `4th Jun 2024`

### Implementation

Use the `format` function from date-fns with the following format string:

```tsx
import { format } from 'date-fns';

const formattedDate = format(new Date(), 'do MMM yyyy');

// Examples:
// new Date('2025-09-01') → "1st Sep 2025"
// new Date('2025-08-02') → "2nd Aug 2025"
// new Date('2026-01-03') → "3rd Jan 2026"
// new Date('2024-06-04') → "4th Jun 2024"
```

### Date Format Breakdown

- `do` - Day of month with ordinal (1st, 2nd, 3rd, 4th, etc.)
- `MMM` - Month abbreviation (Jan, Feb, Mar, etc.)
- `yyyy` - Full year (2025, 2026, etc.)

### Usage Example

```tsx
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function WorkoutCard({ date }: { date: Date }) {
  const formattedDate = format(date, 'do MMM yyyy');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout - {formattedDate}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  );
}
```

## Summary

1. **Components**: ONLY use shadcn/ui components - NO custom components
2. **Dates**: Use date-fns with format `'do MMM yyyy'`
3. **Composition**: Compose shadcn/ui components together as needed
4. **Installation**: Add components via `npx shadcn@latest add [component-name]`

These standards ensure consistency and maintainability across the entire project.
