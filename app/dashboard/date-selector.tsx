"use client";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";

interface DateSelectorProps {
  selectedDate: Date;
}

export function DateSelector({ selectedDate }: DateSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('date', date.toISOString());
      router.push(`/dashboard?${params.toString()}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Date</CardTitle>
        <CardDescription>Choose a date to view workouts</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          className="rounded-md border"
        />
      </CardContent>
    </Card>
  );
}
