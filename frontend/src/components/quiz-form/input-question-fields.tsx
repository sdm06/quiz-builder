"use client";

import { useFormContext } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InputQuestionFields({
  name,
}: {
  name: string;
}) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={`${name}.textAnswer`}
      rules={{ required: "Answer key is required" }}
      render={({ field }) => (
        <div className="space-y-2">
          <Label htmlFor={field.name}>Answer Key</Label>
          <Input
            id={field.name}
            placeholder="Enter the expected answer (exact match)"
            {...field}
            onChange={(e) => field.onChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            The student&apos;s answer must match this exactly (case-sensitive).
          </p>
        </div>
      )}
    />
  );
}