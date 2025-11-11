"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Mock workout data for UI purposes only
  const mockWorkouts = [
    {
      id: 1,
      name: "Upper Body Strength",
      exercises: [
        { name: "Bench Press", sets: 4, reps: 8, weight: "185 lbs" },
        { name: "Overhead Press", sets: 3, reps: 10, weight: "95 lbs" },
        { name: "Pull-ups", sets: 3, reps: 12, weight: "Bodyweight" },
      ],
      duration: "45 min",
      completedAt: "10:30 AM",
    },
    {
      id: 2,
      name: "Core & Cardio",
      exercises: [
        { name: "Plank", sets: 3, reps: 1, weight: "60 sec" },
        { name: "Russian Twists", sets: 3, reps: 20, weight: "25 lbs" },
        { name: "Treadmill", sets: 1, reps: 1, weight: "20 min" },
      ],
      duration: "30 min",
      completedAt: "6:00 PM",
    },
  ];

  const formattedDate = format(selectedDate, "do MMM yyyy");

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Workout Dashboard</h1>
        <p className="text-muted-foreground">
          Track and review your daily workouts
        </p>
      </div>

      {/* Date Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
          <CardDescription>Choose a date to view workouts</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Workouts List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Workouts</h2>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          <Button>Add Workout</Button>
        </div>

        {/* Workout Cards */}
        {mockWorkouts.length > 0 ? (
          <div className="grid gap-4">
            {mockWorkouts.map((workout) => (
              <Card key={workout.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{workout.name}</CardTitle>
                      <CardDescription>
                        Completed at {workout.completedAt} • {workout.duration}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workout.exercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <span className="font-medium">{exercise.name}</span>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>
                            {exercise.sets} × {exercise.reps}
                          </span>
                          <span className="font-medium text-foreground">
                            {exercise.weight}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
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
    </div>
  );
}
