"use client";

import { format, differenceInMinutes } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Set {
  id: string;
  setNumber: number;
  weight: string;
  reps: number;
}

interface Exercise {
  id: string;
  name: string;
  order: number;
  sets: Set[];
}

interface Workout {
  id: string;
  name: string | null;
  startedAt: Date;
  completedAt: Date | null;
  exercises: Exercise[];
}

interface WorkoutsListProps {
  workouts: Workout[];
  selectedDate: Date;
}

export function WorkoutsList({ workouts, selectedDate }: WorkoutsListProps) {
  const formattedDate = format(selectedDate, "do MMM yyyy");

  const calculateDuration = (startedAt: Date, completedAt: Date | null) => {
    if (!completedAt) return "In progress";
    const minutes = differenceInMinutes(new Date(completedAt), new Date(startedAt));
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatTime = (date: Date) => {
    return format(new Date(date), "h:mm a");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Workouts</h2>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>
        <Button>Add Workout</Button>
      </div>

      {/* Workout Cards */}
      {workouts.length > 0 ? (
        <div className="grid gap-4">
          {workouts.map((workout) => (
            <Card key={workout.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{workout.name || "Untitled Workout"}</CardTitle>
                    <CardDescription>
                      {workout.completedAt
                        ? `Completed at ${formatTime(workout.completedAt)} • ${calculateDuration(workout.startedAt, workout.completedAt)}`
                        : `Started at ${formatTime(workout.startedAt)} • In progress`}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {workout.exercises.length > 0 ? (
                  <div className="space-y-3">
                    {workout.exercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <span className="font-medium">{exercise.name}</span>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>
                            {exercise.sets.length} {exercise.sets.length === 1 ? 'set' : 'sets'}
                          </span>
                          {exercise.sets.length > 0 && (
                            <span className="font-medium text-foreground">
                              {exercise.sets[0].weight} lbs × {exercise.sets[0].reps} reps
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No exercises logged
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No workouts logged for this date
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Add Workout" to log your first workout
            </p>
            <Button className="mt-4">Add Your First Workout</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
