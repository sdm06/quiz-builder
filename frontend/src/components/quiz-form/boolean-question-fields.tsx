"use client";

import { useFormContext } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function BooleanQuestionFields({
  name,
}: {
  name: string;
}) {
  const { setValue, watch } = useFormContext();
  return (
    <div className="space-y-3">
      <Label className="block">
        <RadioGroup
          onValueChange={(value) => setValue(`${name}.booleanAnswer`, value === "true", { shouldDirty: true, shouldTouch: true })}
          value={watch(`${name}.booleanAnswer`) ? "true" : "false"}
          className="flex items-center gap-6"
        >
          <RadioGroupItem value="true" className="flex items-center gap-2">
            <span className="font-medium">True</span>
          </RadioGroupItem>
          <RadioGroupItem value="false" className="flex items-center gap-2">
            <span className="font-medium">False</span>
          </RadioGroupItem>
        </RadioGroup>
      </Label>
      <p className="text-xs text-muted-foreground">Select the correct answer for this true/false question.</p>
    </div>
  );
}