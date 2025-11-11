import { pgTable, uuid, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Exercises table - Master list of exercises
export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Workouts table - Individual workout sessions
export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // Clerk user ID
  name: text("name"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"), // null if workout in progress
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Workout Exercises table - Junction table for exercises within a workout
export const workoutExercises = pgTable("workout_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  order: integer("order").notNull(), // maintains exercise order in workout
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sets table - Individual sets for each exercise
export const sets = pgTable("sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutExerciseId: uuid("workout_exercise_id")
    .notNull()
    .references(() => workoutExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(), // e.g., 1, 2, 3
  weight: numeric("weight").notNull(), // allows decimals like 135.5
  reps: integer("reps").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const workoutsRelations = relations(workouts, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(
  workoutExercises,
  ({ one, many }) => ({
    workout: one(workouts, {
      fields: [workoutExercises.workoutId],
      references: [workouts.id],
    }),
    exercise: one(exercises, {
      fields: [workoutExercises.exerciseId],
      references: [exercises.id],
    }),
    sets: many(sets),
  })
);

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));
