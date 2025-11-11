# Authentication Standards

This document outlines the authentication standards for this project. **All developers must strictly adhere to these guidelines.**

## Authentication Provider

### Clerk

**This application uses [Clerk](https://clerk.com/) exclusively for authentication.**

- All authentication and user management MUST be handled through Clerk
- **ABSOLUTELY NO custom authentication systems should be created**
- **DO NOT use NextAuth.js, Auth.js, or any other authentication library**
- Clerk provides authentication, user management, and session handling out of the box

## Installation & Setup

### Required Packages

```bash
npm install @clerk/nextjs
```

### Environment Variables

Add the following environment variables to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Root Layout Configuration

Wrap your application with `ClerkProvider` in the root layout:

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Middleware Setup

Create a middleware file to protect routes:

```tsx
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

## Authentication Pages

### Sign In Page

```tsx
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

### Sign Up Page

```tsx
// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

## Getting User Information

### In Server Components

Use `auth()` to get the current user's session:

```tsx
// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    // This shouldn't happen if middleware is configured correctly
    return null;
  }

  return <div>Dashboard for user: {userId}</div>;
}
```

Use `currentUser()` to get full user details:

```tsx
// app/profile/page.tsx
import { currentUser } from '@clerk/nextjs/server';

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  return (
    <div>
      <h1>{user.firstName} {user.lastName}</h1>
      <p>{user.emailAddresses[0]?.emailAddress}</p>
    </div>
  );
}
```

### In Client Components

Use Clerk's React hooks:

```tsx
'use client';

import { useUser } from '@clerk/nextjs';

export function UserProfile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <p>Welcome, {user.firstName}!</p>
      <p>{user.emailAddresses[0]?.emailAddress}</p>
    </div>
  );
}
```

### User Button Component

Clerk provides a pre-built user button with account management:

```tsx
'use client';

import { UserButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header>
      <nav>
        <UserButton afterSignOutUrl="/" />
      </nav>
    </header>
  );
}
```

## Integration with Data Fetching

### Critical: Always Use Clerk Auth in Data Functions

**Every function in the `/data` directory MUST use Clerk's `auth()` to get the current user.**

```tsx
// data/workouts.ts
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserWorkouts() {
  // ✅ CORRECT: Get userId from Clerk
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId));
}

// ❌ WRONG: Not using Clerk auth
export async function getUserWorkoutsWrong() {
  // Missing authentication check!
  return await db.select().from(workouts);
}
```

### Example: Complete Data Function

```tsx
// data/workouts.ts
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getWorkoutById(workoutId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Always filter by userId to ensure data isolation
  const result = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, userId)
      )
    )
    .limit(1);

  return result[0] ?? null;
}

export async function createWorkout(data: { name: string; date: string }) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Always set userId from Clerk, never from client input
  const result = await db
    .insert(workouts)
    .values({
      ...data,
      userId, // From Clerk auth
    })
    .returning();

  return result[0];
}
```

## Server Actions

When using Server Actions, always validate authentication:

```tsx
// app/workouts/actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { createWorkout } from '@/data/workouts';
import { revalidatePath } from 'next/cache';

export async function createWorkoutAction(formData: FormData) {
  // Validate auth in the Server Action
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Unauthorized' };
  }

  const name = formData.get('name') as string;
  const date = formData.get('date') as string;

  try {
    const workout = await createWorkout({ name, date });
    revalidatePath('/workouts');
    return { success: true, workout };
  } catch (error) {
    return { error: 'Failed to create workout' };
  }
}
```

## Database Schema

### User ID Storage

Store Clerk's user IDs in your database schema:

```tsx
// db/schema.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const workouts = pgTable('workouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  name: text('name').notNull(),
  date: timestamp('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ✅ CORRECT: Use text type for Clerk user IDs
// Clerk user IDs are strings like "user_2..."
```

### Important Notes

- Clerk user IDs are strings (not UUIDs)
- Use `text` type in PostgreSQL/Drizzle for `userId` columns
- Always index the `userId` column for performance:

```tsx
import { index } from 'drizzle-orm/pg-core';

export const workouts = pgTable('workouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  date: timestamp('date').notNull(),
}, (table) => ({
  userIdIdx: index('workouts_user_id_idx').on(table.userId),
}));
```

## Protecting Routes

### Using Middleware (Recommended)

The middleware configuration already shown protects all non-public routes:

```tsx
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect(); // Redirects to sign-in if not authenticated
  }
});
```

### Manual Protection in Server Components

For additional protection or custom logic:

```tsx
// app/admin/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Additional authorization logic
  // (e.g., check if user has admin role in your database)

  return <div>Admin Dashboard</div>;
}
```

## Common Patterns

### Loading States in Client Components

```tsx
'use client';

import { useUser } from '@clerk/nextjs';

export function UserDashboard() {
  const { user, isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {user.firstName}!</div>;
}
```

### Sign Out Button

```tsx
'use client';

import { useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <Button onClick={() => signOut()}>
      Sign Out
    </Button>
  );
}
```

### Conditional Rendering Based on Auth

```tsx
'use client';

import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export function NavBar() {
  const { isSignedIn } = useAuth();

  return (
    <nav>
      {isSignedIn ? (
        <Button>Dashboard</Button>
      ) : (
        <Button>Sign In</Button>
      )}
    </nav>
  );
}
```

## Webhooks (Optional)

If you need to sync Clerk user data to your database, use webhooks:

```tsx
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET');
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    return new Response('Error: Verification failed', { status: 400 });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    await db.insert(users).values({
      id: id as string,
      email: evt.data.email_addresses[0]?.email_address,
      firstName: evt.data.first_name,
      lastName: evt.data.last_name,
    });
  }

  return new Response('Webhook received', { status: 200 });
}
```

## Summary

1. **Authentication Provider**: ONLY use Clerk - NO other auth libraries
2. **Session Retrieval**: Use `auth()` in Server Components and data functions
3. **User Data**: Use `currentUser()` for full user details, `useUser()` in Client Components
4. **Route Protection**: Configure middleware to protect non-public routes
5. **Data Isolation**: Always filter database queries by `userId` from Clerk
6. **User IDs**: Store as `text` type, Clerk IDs are strings like "user_2..."
7. **Components**: Use Clerk's pre-built components (`<SignIn />`, `<SignUp />`, `<UserButton />`)

These standards ensure secure, consistent authentication throughout the application.
