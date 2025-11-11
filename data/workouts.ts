import { db } from '@/db';
import { workouts, workoutExercises, exercises, sets } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { startOfDay, endOfDay } from 'date-fns';

export async function getUserWorkoutsByDate(date: Date) {
  const session = await auth();
  if (!session?.userId) {
    throw new Error('Unauthorized');
  }

  // Get start and end of the selected date
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Query workouts for the user on the selected date with all related data
  const userWorkouts = await db
    .select({
      id: workouts.id,
      name: workouts.name,
      startedAt: workouts.startedAt,
      completedAt: workouts.completedAt,
      userId: workouts.userId,
    })
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, session.userId),
        gte(workouts.startedAt, dayStart),
        lte(workouts.startedAt, dayEnd)
      )
    )
    .orderBy(workouts.startedAt);

  // For each workout, get the exercises and sets
  const workoutsWithDetails = await Promise.all(
    userWorkouts.map(async (workout) => {
      const workoutExerciseData = await db
        .select({
          workoutExerciseId: workoutExercises.id,
          exerciseId: exercises.id,
          exerciseName: exercises.name,
          order: workoutExercises.order,
        })
        .from(workoutExercises)
        .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .where(eq(workoutExercises.workoutId, workout.id))
        .orderBy(workoutExercises.order);

      // For each exercise, get all sets
      const exercisesWithSets = await Promise.all(
        workoutExerciseData.map(async (exercise) => {
          const exerciseSets = await db
            .select({
              id: sets.id,
              setNumber: sets.setNumber,
              weight: sets.weight,
              reps: sets.reps,
            })
            .from(sets)
            .where(eq(sets.workoutExerciseId, exercise.workoutExerciseId))
            .orderBy(sets.setNumber);

          return {
            id: exercise.exerciseId,
            name: exercise.exerciseName,
            order: exercise.order,
            sets: exerciseSets,
          };
        })
      );

      return {
        ...workout,
        exercises: exercisesWithSets,
      };
    })
  );

  return workoutsWithDetails;
}
