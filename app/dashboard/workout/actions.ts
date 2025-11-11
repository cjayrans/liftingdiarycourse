'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createWorkout } from '@/data/workouts';

// Zod schema for workout creation
const CreateWorkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).nullable(),
  startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Invalid datetime format'),
});

// Create workout action
export async function createWorkoutAction(data: {
  name: string | null;
  startedAt: string;
}) {
  try {
    // Validate input
    const validated = CreateWorkoutSchema.parse(data);

    // Convert startedAt string to Date
    const workoutData = {
      name: validated.name,
      startedAt: new Date(validated.startedAt),
    };

    // Call data helper
    const workout = await createWorkout(workoutData);

    // Revalidate cache
    revalidatePath('/dashboard');

    return {
      success: true,
      workout,
    };
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
