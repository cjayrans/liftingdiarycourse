# Routing Standards

## Overview

This document outlines the routing architecture and standards for the lifting diary application. All application routes are organized under the `/dashboard` namespace and protected via Next.js middleware.

## Route Structure

### Dashboard Namespace

**All application routes MUST be accessed via the `/dashboard` prefix.**

```
/dashboard              # Main dashboard page
/dashboard/workout      # Workout-related pages
/dashboard/exercises    # Exercise management
/dashboard/progress     # Progress tracking
/dashboard/settings     # User settings
```

### File Structure

Routes follow Next.js App Router conventions:

```
app/
  dashboard/
    page.tsx                    # /dashboard
    layout.tsx                  # Dashboard layout wrapper
    workout/
      page.tsx                  # /dashboard/workout
      [workoutId]/
        page.tsx                # /dashboard/workout/[workoutId]
    exercises/
      page.tsx                  # /dashboard/exercises
    progress/
      page.tsx                  # /dashboard/progress
```

## Route Protection

### Middleware-Based Authentication

**All `/dashboard` routes and sub-routes are protected via Next.js middleware.**

#### Implementation

Route protection is implemented in `middleware.ts` at the project root:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check authentication status
  const isAuthenticated = // ... auth check logic

  // Protect all /dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      // Redirect to login page
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};
```

#### Key Requirements

1. **Middleware Location**: Place `middleware.ts` at the project root (same level as `app/`)
2. **Matcher Configuration**: Use `/dashboard/:path*` to protect all dashboard routes
3. **Authentication Check**: Verify user session/token before allowing access
4. **Redirect Logic**: Unauthenticated users should be redirected to login page
5. **Protected by Default**: All routes under `/dashboard` are automatically protected

### Authentication State

- Use session cookies, JWT tokens, or authentication library (e.g., NextAuth.js, Clerk)
- Check authentication state in middleware before rendering any dashboard pages
- Maintain consistent auth state across all protected routes

## Route Conventions

### Naming

- Use lowercase for route segments
- Use kebab-case for multi-word routes (e.g., `/dashboard/workout-history`)
- Use descriptive, RESTful route names

### Dynamic Routes

```
/dashboard/workout/[workoutId]     # Single workout detail
/dashboard/exercises/[exerciseId]  # Single exercise detail
```

- Use square brackets `[]` for dynamic segments
- Keep dynamic segment names singular and descriptive
- Validate dynamic parameters in the page component

### Route Groups (Optional Organization)

```
app/
  dashboard/
    (management)/        # Route group (not in URL)
      workout/
      exercises/
    (tracking)/
      progress/
      analytics/
```

- Use parentheses `()` for route groups (won't appear in URL)
- Organize related routes without affecting URL structure

## Navigation

### Link Components

Use Next.js `<Link>` component for client-side navigation:

```tsx
import Link from 'next/link';

<Link href="/dashboard/workout">View Workouts</Link>
```

### Programmatic Navigation

Use `useRouter` hook for programmatic navigation:

```tsx
'use client';
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/dashboard/workout');
```

### Navigation Patterns

1. **Always use absolute paths** starting with `/dashboard`
2. **Avoid hardcoded URLs** - consider creating route constants
3. **Handle navigation errors** gracefully with error boundaries

## Route Constants (Recommended)

Create a centralized route configuration:

```typescript
// lib/routes.ts
export const ROUTES = {
  DASHBOARD: '/dashboard',
  WORKOUT: '/dashboard/workout',
  WORKOUT_DETAIL: (id: string) => `/dashboard/workout/${id}`,
  EXERCISES: '/dashboard/exercises',
  PROGRESS: '/dashboard/progress',
  SETTINGS: '/dashboard/settings',
} as const;
```

Usage:

```tsx
import { ROUTES } from '@/lib/routes';

<Link href={ROUTES.WORKOUT}>Workouts</Link>
<Link href={ROUTES.WORKOUT_DETAIL('123')}>Workout 123</Link>
```

## Public Routes

### Root and Authentication Routes

Routes outside `/dashboard` that should remain public:

```
/                # Landing page (public)
/login           # Login page (public)
/signup          # Signup page (public)
/forgot-password # Password reset (public)
```

These routes should NOT be protected by middleware and should redirect authenticated users to `/dashboard`.

## Error Handling

### Not Found Pages

Create custom 404 pages for dashboard routes:

```tsx
// app/dashboard/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Page Not Found</h2>
      <Link href="/dashboard">Return to Dashboard</Link>
    </div>
  );
}
```

### Unauthorized Access

Handle unauthorized access attempts in middleware:

```typescript
if (!isAuthenticated && pathname.startsWith('/dashboard')) {
  // Preserve intended destination
  const redirectUrl = new URL('/login', request.url);
  redirectUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(redirectUrl);
}
```

After login, redirect to original destination:

```typescript
const redirect = searchParams.get('redirect') || '/dashboard';
router.push(redirect);
```

## Best Practices

1. **Consistent Protection**: Never bypass middleware for sensitive routes
2. **Centralized Auth Logic**: Keep authentication logic in middleware, not individual pages
3. **Loading States**: Implement loading UI for protected routes during auth check
4. **Server Components**: Use Server Components by default for dashboard pages
5. **Client Components**: Only use `"use client"` when needed for interactivity
6. **SEO**: Protected routes don't need SEO optimization (not publicly accessible)
7. **Metadata**: Set appropriate metadata for dashboard pages in `layout.tsx` or `page.tsx`

## Testing Routes

### Protected Route Tests

```typescript
// Verify middleware protection
test('redirects unauthenticated users from /dashboard', async () => {
  const response = await fetch('/dashboard');
  expect(response.redirected).toBe(true);
  expect(response.url).toContain('/login');
});

// Verify authenticated access
test('allows authenticated users to access /dashboard', async () => {
  const response = await fetch('/dashboard', {
    headers: { Cookie: 'auth-token=valid-token' }
  });
  expect(response.status).toBe(200);
});
```

## Migration Notes

When adding new dashboard routes:

1. Create page under `app/dashboard/`
2. No additional middleware config needed (auto-protected)
3. Test authentication flow
4. Add route constant to `lib/routes.ts` if using centralized routing

---

**Last Updated**: 2025-11-11
