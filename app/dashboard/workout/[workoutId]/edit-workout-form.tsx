'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { updateWorkoutAction } from '../actions';
import { useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

type Workout = {
  id: string;
  name: string | null;
  startedAt: Date;
  completedAt: Date | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export function EditWorkoutForm({ workout }: { workout: Workout }) {
  const router = useRouter();
  const [name, setName] = useState(workout.name || '');
  const [startedAt, setStartedAt] = useState(
    format(new Date(workout.startedAt), "yyyy-MM-dd'T'HH:mm")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateWorkoutAction(workout.id, {
        name: name.trim() || null,
        startedAt,
      });

      if (result.success) {
        // Redirect client-side on success
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to update workout');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Details</CardTitle>
        <CardDescription>
          Update the name and start time for your workout
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Workout Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Workout Name (Optional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Morning Leg Day"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              Leave blank for a default name
            </p>
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="startedAt">Start Time</Label>
            <Input
              id="startedAt"
              type="datetime-local"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              When did you start this workout?
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
