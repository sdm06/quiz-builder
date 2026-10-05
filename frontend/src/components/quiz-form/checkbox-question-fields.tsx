"use client";

import { useFormContext } from "react-hook-form";
import { useFieldArray, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GripVertical } from "lucide-react";

export function CheckboxQuestionFields({
  name,
}: {
  name: string;
}) {
  const { control } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `${name}.options`,
  });

  const hasCorrect = fields.some((f) => (f as { isCorrect?: boolean }).isCorrect);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Options (at least 2, at least 1 correct)</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ text: "", isCorrect: false })}
          className="gap-1"
        >
          <Plus className="h-3 w-3" />
          Add Option
        </Button>
      </div>

      {!hasCorrect && fields.length > 0 && (
        <p className="text-xs text-destructive">At least one option must be marked correct.</p>
      )}

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => move(index, index > 0 ? index - 1 : index + 1)}
              aria-label="Reorder"
            >
              <GripVertical className="h-4 w-4" />
            </Button>

            <Controller
              control={control}
              name={`${name}.options.${index}.text`}
              rules={{ required: "Option text is required" }}
              render={({ field }) => (
                <Input
                  placeholder={`Option ${index + 1}`}
                  className="flex-1"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />

            <Controller
              control={control}
              name={`${name}.options.${index}.isCorrect`}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label={`Mark option ${index + 1} as correct`}
                />
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => remove(index)}
              disabled={fields.length <= 2}
              aria-label={`Remove option ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}