import { getUserWorkoutsByDate } from "@/data/workouts";
import { DateSelector } from "./date-selector";
import { WorkoutsList } from "./workouts-list";

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const selectedDate = params.date ? new Date(params.date) : new Date();

  // Fetch workouts for the selected date
  const workouts = await getUserWorkoutsByDate(selectedDate);

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
      <DateSelector selectedDate={selectedDate} />

      {/* Workouts List Section */}
      <WorkoutsList workouts={workouts} selectedDate={selectedDate} />
    </div>
  );
}
