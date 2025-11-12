import { getWorkoutById } from '@/data/workouts';
import { notFound } from 'next/navigation';
import { EditWorkoutForm } from './edit-workout-form';

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;

  // Fetch workout data - Server Component
  const workout = await getWorkoutById(workoutId);

  if (!workout) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Edit Workout</h1>
          <p className="text-muted-foreground">
            Update your workout details
          </p>
        </div>

        {/* Client Component Form */}
        <EditWorkoutForm workout={workout} />
      </div>
    </div>
  );
}
