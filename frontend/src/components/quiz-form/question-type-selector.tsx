"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MinusCircle, Type, CheckCircle2 } from "lucide-react";

export function QuestionTypeSelector({
  value,
  onChange,
}: {
  value: "BOOLEAN" | "INPUT" | "CHECKBOX";
  onChange: (value: "BOOLEAN" | "INPUT" | "CHECKBOX") => void;
}) {
  const types = [
    { value: "BOOLEAN" as const, label: "True / False", icon: MinusCircle, desc: "Single correct answer: true or false" },
    { value: "INPUT" as const, label: "Short Text", icon: Type, desc: "Free-text answer with exact match key" },
    { value: "CHECKBOX" as const, label: "Multiple Choice", icon: CheckCircle2, desc: "Multiple options, one or more correct" },
  ];

  return (
    <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-3 gap-3">
      {types.map(({ value, label, icon: Icon, desc }) => (
        <RadioGroupItem key={value} value={value} className="relative flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all hover:border-primary/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5">
          <div className="flex flex-col items-center gap-2">
            <Icon className="h-5 w-5" />
            <span className="font-medium">{label}</span>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">{desc}</p>
        </RadioGroupItem>
      ))}
    </RadioGroup>
  );
}