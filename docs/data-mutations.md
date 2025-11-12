# Data Mutations Guidelines

## CRITICAL: Server Actions Only

**ALL data mutations (create, update, delete) in this application MUST be done exclusively via Server Actions.**

This is a fundamental architectural requirement. Do NOT deviate from this pattern.

## Architecture Overview

```
┌─────────────────────────────────────┐
│ Client Component (form/button)     │
│                                     │
│ 1. Calls Server Action             │
│    await createWorkoutAction()     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Server Action (actions.ts)         │
│                                     │
│ 2. Validates input with Zod        │
│ 3. Calls data helper function      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Helper Function (/data/xxx.ts)     │
│                                     │
│ 4. Gets user session               │
│ 5. Mutates with Drizzle ORM        │
│ 6. Enforces user data isolation    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Database (with user isolation)      │
└─────────────────────────────────────┘
```

## Server Actions Requirements

### 1. File Location

All Server Actions MUST be in colocated files named `actions.ts`:

```
app/
  workouts/
    page.tsx
    actions.ts       ✅ Server Actions for workout mutations
  exercises/
    page.tsx
    actions.ts       ✅ Server Actions for exercise mutations
  profile/
    page.tsx
    actions.ts       ✅ Server Actions for profile mutations
```

### 2. File Structure

Every `actions.ts` file MUST start with the `'use server'` directive:

```tsx
// app/workouts/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createWorkout, updateWorkout, deleteWorkout } from '@/data/workouts';

// Server Actions below...
```

### 3. Typed Parameters (NO FormData)

**CRITICAL: Server Actions MUST NOT use the FormData type.**

All parameters must be explicitly typed with TypeScript types or Zod schemas.

```tsx
// ✅ CORRECT: Typed parameters
export async function createWorkoutAction(data: {
  name: string;
  date: string;
  notes?: string;
}) {
  // Implementation...
}

// ✅ CORRECT: Using Zod schema type
const CreateWorkoutSchema = z.object({
  name: z.string().min(1),
  date: z.string(),
  notes: z.string().optional(),
});

export async function createWorkoutAction(
  data: z.infer<typeof CreateWorkoutSchema>
) {
  // Implementation...
}

// ❌ WRONG: Using FormData
export async function createWorkoutAction(formData: FormData) {
  // DO NOT DO THIS
}
```

### 4. Zod Validation (MANDATORY)

**ALL Server Actions MUST validate their arguments using Zod.**

Every Server Action must validate input before calling data helper functions.

```tsx
// app/workouts/actions.ts
'use server';

import { z } from 'zod';
import { createWorkout } from '@/data/workouts';
import { revalidatePath } from 'next/cache';

// Define Zod schema
const CreateWorkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  notes: z.string().max(500).optional(),
});

// ✅ CORRECT: Validates with Zod
export async function createWorkoutAction(data: {
  name: string;
  date: string;
  notes?: string;
}) {
  // Validate input
  const validated = CreateWorkoutSchema.parse(data);

  // Call data helper
  const workout = await createWorkout(validated);

  // Revalidate cache
  revalidatePath('/workouts');

  return { success: true, workout };
}

// ❌ WRONG: No validation
export async function createWorkoutActionWrong(data: {
  name: string;
  date: string;
}) {
  // Missing Zod validation!
  const workout = await createWorkout(data);
  return { success: true, workout };
}
```

### 5. Navigation and Redirects

**CRITICAL: Server Actions MUST NOT use the `redirect()` function.**

Navigation after mutations should always be handled client-side after the Server Action resolves.

```tsx
// ❌ WRONG: Using redirect() in Server Action
'use server';

import { redirect } from 'next/navigation';
import { createWorkout } from '@/data/workouts';

export async function createWorkoutAction(data: { name: string }) {
  const workout = await createWorkout(data);
  redirect('/dashboard'); // DO NOT DO THIS - causes NEXT_REDIRECT error
}

// ✅ CORRECT: Return success response, redirect client-side
'use server';

import { createWorkout } from '@/data/workouts';
import { revalidatePath } from 'next/cache';

export async function createWorkoutAction(data: { name: string }) {
  const workout = await createWorkout(data);
  revalidatePath('/dashboard');
  return { success: true, workout }; // Let client handle navigation
}
```

**Client-side navigation after Server Action:**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { createWorkoutAction } from './actions';

export function CreateWorkoutForm() {
  const router = useRouter();

  async function handleSubmit(data: { name: string }) {
    const result = await createWorkoutAction(data);

    if (result.success) {
      // ✅ CORRECT: Navigate client-side after success
      router.push('/dashboard');
    } else {
      // Handle error
      console.error(result.error);
    }
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Why this matters:**
- Using `redirect()` in Server Actions throws a `NEXT_REDIRECT` error in the client
- Client-side navigation provides better error handling
- Allows the client to show loading states during navigation
- Gives more control over the user experience

### 6. Error Handling

Server Actions should handle errors gracefully and return structured responses:

```tsx
'use server';

import { z } from 'zod';
import { createWorkout } from '@/data/workouts';
import { revalidatePath } from 'next/cache';

const CreateWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function createWorkoutAction(data: {
  name: string;
  date: string;
}) {
  try {
    // Validate
    const validated = CreateWorkoutSchema.parse(data);

    // Call data helper
    const workout = await createWorkout(validated);

    // Revalidate
    revalidatePath('/workouts');

    return { success: true, workout };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        issues: error.issues,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### 7. Cache Revalidation

Always use `revalidatePath` or `revalidateTag` to update the cache after mutations:

```tsx
import { revalidatePath, revalidateTag } from 'next/cache';

export async function createWorkoutAction(data: CreateWorkoutInput) {
  const validated = CreateWorkoutSchema.parse(data);
  const workout = await createWorkout(validated);

  // Revalidate specific path
  revalidatePath('/workouts');

  // Or revalidate by tag
  revalidateTag('workouts');

  return { success: true, workout };
}
```

## Data Helper Functions in `/data` Directory

All Server Actions MUST call helper functions from the `/data` directory. These helpers wrap Drizzle ORM database calls.

### Directory Structure

```
data/
  workouts.ts    # Workout mutations
  exercises.ts   # Exercise mutations
  users.ts       # User mutations
```

### Helper Function Requirements

1. **Must use Drizzle ORM** (never raw SQL)
2. **Must enforce user data isolation** (always filter by session user ID)
3. **Must validate authentication** (check session before mutation)
4. **Must return typed results**

### Create Operations

```tsx
// data/workouts.ts
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { auth } from '@/lib/auth';

export type NewWorkout = {
  name: string;
  date: string;
  notes?: string;
};

// ✅ CORRECT: Enforces user isolation
export async function createWorkout(data: NewWorkout) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Always set userId from session, never from client input
  const result = await db
    .insert(workouts)
    .values({
      ...data,
      userId: session.user.id, // CRITICAL: Force user ownership
    })
    .returning();

  return result[0];
}

// ❌ WRONG: Trusting client-provided userId
export async function createWorkoutWrong(data: NewWorkout & { userId: string }) {
  const result = await db
    .insert(workouts)
    .values(data) // Client could provide any userId!
    .returning();

  return result[0];
}

// ❌ WRONG: No user isolation
export async function createWorkoutWrong2(data: NewWorkout) {
  // Missing authentication check!
  const result = await db
    .insert(workouts)
    .values(data)
    .returning();

  return result[0];
}
```

### Update Operations

```tsx
// data/workouts.ts
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// ✅ CORRECT: Verify ownership before update
export async function updateWorkout(
  workoutId: string,
  data: Partial<NewWorkout>
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Update only if the workout belongs to the current user
  const result = await db
    .update(workouts)
    .set(data)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, session.user.id) // CRITICAL: User isolation
      )
    )
    .returning();

  if (result.length === 0) {
    throw new Error('Workout not found or unauthorized');
  }

  return result[0];
}

// ❌ WRONG: No user isolation check
export async function updateWorkoutWrong(
  workoutId: string,
  data: Partial<NewWorkout>
) {
  const result = await db
    .update(workouts)
    .set(data)
    .where(eq(workouts.id, workoutId)) // Missing user ID check!
    .returning();

  return result[0];
}
```

### Delete Operations

```tsx
// data/workouts.ts
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// ✅ CORRECT: Verify ownership before delete
export async function deleteWorkout(workoutId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Delete only if the workout belongs to the current user
  const result = await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, session.user.id) // CRITICAL: User isolation
      )
    )
    .returning();

  if (result.length === 0) {
    throw new Error('Workout not found or unauthorized');
  }

  return result[0];
}

// ❌ WRONG: No user isolation check
export async function deleteWorkoutWrong(workoutId: string) {
  const result = await db
    .delete(workouts)
    .where(eq(workouts.id, workoutId)) // Missing user ID check!
    .returning();

  return result[0];
}
```

## Complete Example

Here's a complete example showing the full flow:

### 1. Data Helper (`data/workouts.ts`)

```tsx
// data/workouts.ts
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export type NewWorkout = {
  name: string;
  date: string;
  notes?: string;
};

export async function createWorkout(data: NewWorkout) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const result = await db
    .insert(workouts)
    .values({
      ...data,
      userId: session.user.id,
    })
    .returning();

  return result[0];
}

export async function updateWorkout(
  workoutId: string,
  data: Partial<NewWorkout>
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const result = await db
    .update(workouts)
    .set(data)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, session.user.id)
      )
    )
    .returning();

  if (result.length === 0) {
    throw new Error('Workout not found or unauthorized');
  }

  return result[0];
}

export async function deleteWorkout(workoutId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const result = await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, session.user.id)
      )
    )
    .returning();

  if (result.length === 0) {
    throw new Error('Workout not found or unauthorized');
  }

  return result[0];
}
```

### 2. Server Actions (`app/workouts/actions.ts`)

```tsx
// app/workouts/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createWorkout, updateWorkout, deleteWorkout } from '@/data/workouts';

// Zod schemas
const CreateWorkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  notes: z.string().max(500).optional(),
});

const UpdateWorkoutSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
});

// Create action
export async function createWorkoutAction(data: {
  name: string;
  date: string;
  notes?: string;
}) {
  try {
    const validated = CreateWorkoutSchema.parse(data);
    const workout = await createWorkout(validated);
    revalidatePath('/workouts');
    return { success: true, workout };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        issues: error.issues,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Update action
export async function updateWorkoutAction(
  workoutId: string,
  data: {
    name?: string;
    date?: string;
    notes?: string;
  }
) {
  try {
    const validated = UpdateWorkoutSchema.parse(data);
    const workout = await updateWorkout(workoutId, validated);
    revalidatePath('/workouts');
    return { success: true, workout };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        issues: error.issues,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Delete action
export async function deleteWorkoutAction(workoutId: string) {
  try {
    await deleteWorkout(workoutId);
    revalidatePath('/workouts');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### 3. Client Component Usage

```tsx
// app/workouts/create-workout-form.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createWorkoutAction } from './actions';
import { useState } from 'react';

export function CreateWorkoutForm() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = await createWorkoutAction({ name, date });

    if (result.success) {
      // Reset form
      setName('');
      setDate('');
      alert('Workout created!');
    } else {
      alert(`Error: ${result.error}`);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Workout name"
        required
      />
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <Button type="submit">Create Workout</Button>
    </form>
  );
}
```

## Summary

| Requirement | Rule |
|------------|------|
| **Mutation Location** | Server Actions in colocated `actions.ts` files |
| **Parameter Types** | Must be explicitly typed, NO FormData |
| **Validation** | MUST use Zod for all inputs |
| **Data Access** | Through `/data` helper functions only |
| **ORM** | Drizzle ORM only, never raw SQL |
| **User Isolation** | MUST filter by session user ID |
| **Authentication** | MUST validate session before mutations |
| **Cache** | MUST revalidate after mutations |
| **Error Handling** | Return structured success/error responses |

## Key Principles

1. **Server Actions Only**: All mutations happen via Server Actions, never Route Handlers or Client Components
2. **Typed Parameters**: No FormData - always explicit TypeScript types
3. **Zod Validation**: Every Server Action MUST validate input with Zod
4. **Data Helpers**: Server Actions call `/data` helpers which wrap Drizzle ORM
5. **User Data Isolation**: Every mutation MUST filter by the current user's session ID
6. **Session Validation**: Always validate the user session before any mutation
7. **Never Trust Client Input**: User IDs always come from the session, never from client requests
8. **Cache Revalidation**: Always revalidate cache after mutations

These principles are non-negotiable and exist to ensure security, data integrity, and maintainability.
