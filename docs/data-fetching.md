# Data Fetching Guidelines

## CRITICAL: Server Components Only

**ALL data fetching in this application MUST be done exclusively via Server Components.**

This is a fundamental architectural requirement. Do NOT deviate from this pattern.

### ✅ Allowed: Server Components

```tsx
// app/workouts/page.tsx
import { getUserWorkouts } from '@/data/workouts';

export default async function WorkoutsPage() {
  // Data fetching happens directly in the Server Component
  const workouts = await getUserWorkouts();

  return (
    <div>
      {workouts.map(workout => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
}
```

### ❌ NEVER: Route Handlers

```tsx
// app/api/workouts/route.ts
// ❌ DO NOT CREATE ROUTE HANDLERS FOR DATA FETCHING
export async function GET() {
  const workouts = await getUserWorkouts();
  return Response.json(workouts);
}
```

### ❌ NEVER: Client Components

```tsx
'use client';
// ❌ DO NOT FETCH DATA IN CLIENT COMPONENTS
export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    fetch('/api/workouts')
      .then(res => res.json())
      .then(setWorkouts);
  }, []);

  return <div>{/* ... */}</div>;
}
```

## Database Queries via `/data` Directory

All database queries MUST be performed through helper functions located in the `/data` directory.

### Directory Structure

```
data/
  workouts.ts    # Workout-related queries
  exercises.ts   # Exercise-related queries
  users.ts       # User-related queries
```

### Using Drizzle ORM

**ALL database queries MUST use Drizzle ORM. Raw SQL is strictly prohibited.**

```tsx
// data/workouts.ts
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function getUserWorkouts() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // ✅ Use Drizzle ORM
  return await db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, session.user.id));
}

// ❌ NEVER use raw SQL
export async function getUserWorkoutsWrong() {
  const session = await auth();
  return await db.execute(
    sql`SELECT * FROM workouts WHERE user_id = ${session.user.id}`
  );
}
```

## CRITICAL: User Data Isolation

**Every database query MUST enforce user data isolation.**

A logged-in user can ONLY access their own data. They MUST NOT be able to access any other user's data.

### Security Requirements

1. **Always get the current user session** before any database query
2. **Always filter by user ID** in the WHERE clause
3. **Never trust client-provided user IDs** - always use the session user ID
4. **Validate authorization** before returning any data

### Example: Proper User Data Isolation

```tsx
// data/workouts.ts
import { db } from '@/db';
import { workouts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// ✅ CORRECT: Enforces user data isolation
export async function getWorkoutById(workoutId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Filter by BOTH workout ID AND user ID
  const result = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, session.user.id) // CRITICAL: User isolation
      )
    )
    .limit(1);

  return result[0] ?? null;
}

// ❌ WRONG: No user isolation - security vulnerability!
export async function getWorkoutByIdWrong(workoutId: string) {
  const result = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId)) // Missing user ID check!
    .limit(1);

  return result[0] ?? null;
}
```

### Example: Creating Data

```tsx
// data/workouts.ts

// ✅ CORRECT: Always associate with current user
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
      userId: session.user.id // Force user ownership
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
```

### Example: Updating Data

```tsx
// data/workouts.ts

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
```

### Example: Deleting Data

```tsx
// data/workouts.ts

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
```

## Server Component Data Flow

```
┌─────────────────────────────────────┐
│ Server Component (page.tsx)        │
│                                     │
│ 1. Fetches data via helper         │
│    const data = await getData()    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Helper Function (/data/xxx.ts)     │
│                                     │
│ 2. Gets user session               │
│ 3. Queries with Drizzle ORM        │
│ 4. Filters by user ID              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Database (with user isolation)      │
└─────────────────────────────────────┘
```

## When You Need Mutations

For mutations (create, update, delete), use Server Actions:

```tsx
// app/workouts/actions.ts
'use server';

import { createWorkout } from '@/data/workouts';
import { revalidatePath } from 'next/cache';

export async function createWorkoutAction(formData: FormData) {
  const name = formData.get('name') as string;
  const date = formData.get('date') as string;

  // Call the data helper function
  const workout = await createWorkout({ name, date });

  // Revalidate to show new data
  revalidatePath('/workouts');

  return { success: true, workout };
}
```

Then use it in a Client Component:

```tsx
'use client';

import { createWorkoutAction } from './actions';

export function CreateWorkoutForm() {
  return (
    <form action={createWorkoutAction}>
      <input name="name" required />
      <input name="date" type="date" required />
      <button type="submit">Create Workout</button>
    </form>
  );
}
```

## Summary

| Method | Allowed? | Purpose |
|--------|----------|---------|
| Server Components | ✅ YES | Data fetching (queries) |
| Server Actions | ✅ YES | Mutations (create/update/delete) |
| `/data` helpers with Drizzle | ✅ YES | Database queries |
| Route Handlers | ❌ NO | Not for data fetching |
| Client Components | ❌ NO | Not for data fetching |
| Raw SQL | ❌ NO | Use Drizzle ORM instead |

## Key Principles

1. **Server Components Only**: All data fetching happens in Server Components
2. **Drizzle ORM Only**: All database queries use Drizzle ORM, never raw SQL
3. **User Data Isolation**: Every query MUST filter by the current user's ID
4. **Session Validation**: Always validate the user session before any database operation
5. **Never Trust Client Input**: User IDs always come from the session, never from client requests

These principles are non-negotiable and exist to ensure security, performance, and maintainability.
