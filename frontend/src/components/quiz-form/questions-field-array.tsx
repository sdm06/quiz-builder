"use client";

import { useFormContext } from "react-hook-form";
import { useFieldArray, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { QuestionTypeSelector } from "./question-type-selector";
import { BooleanQuestionFields } from "./boolean-question-fields";
import { InputQuestionFields } from "./input-question-fields";
import { CheckboxQuestionFields } from "./checkbox-question-fields";

export function QuestionsFieldArray() {
  const { control, watch, setValue } = useFormContext();
  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: "questions",
  });

  const handleMove = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < fields.length) {
      swap(index, newIndex);
    }
  };

  return (
    <div className="space-y-4">
      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No questions yet. Click &quot;Add Question&quot; to get started.</p>
        </div>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="border rounded-lg p-4 space-y-4 bg-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => handleMove(index, "up")}
                disabled={index === 0}
                aria-label="Move question up"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => handleMove(index, "down")}
                disabled={index === fields.length - 1}
                aria-label="Move question down"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <span className="font-mono text-muted-foreground text-sm">#{index + 1}</span>
              <Controller
                control={control}
                name={`questions.${index}.text`}
                rules={{ required: "Question text is required" }}
                render={({ field }) => (
                  <Textarea
                    placeholder="Enter question text..."
                    className="flex-1 min-h-[80px] resize-none"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive shrink-0"
              onClick={() => remove(index)}
              disabled={fields.length <= 1}
              aria-label={`Remove question ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          <QuestionTypeSelector
            value={watch(`questions.${index}.type`) || "BOOLEAN"}
            onChange={(value) => setValue(`questions.${index}.type`, value, { shouldDirty: true, shouldTouch: true })}
          />

          <Separator />

          <Controller
            control={control}
            name={`questions.${index}.type`}
            render={({ field }) => {
              const type = field.value || "BOOLEAN";
              switch (type) {
                case "BOOLEAN":
                  return <BooleanQuestionFields name={`questions.${index}`} />;
                case "INPUT":
                  return <InputQuestionFields name={`questions.${index}`} />;
                case "CHECKBOX":
                  return <CheckboxQuestionFields name={`questions.${index}`} />;
                default:
                  return <div />;
              }
            }}
          />
        </div>
      ))}

      <Button type="button" variant="outline" onClick={() => append({ type: "BOOLEAN", text: "", booleanAnswer: true, order: fields.length })} className="w-full gap-2">
        <Plus className="h-4 w-4" />
        Add Question
      </Button>
    </div>
  );
}