"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MinusCircle, Type } from "lucide-react";

export function QuestionBadge({ type }: { type: "BOOLEAN" | "INPUT" | "CHECKBOX" }) {
  const config = {
    BOOLEAN: {
      label: "True / False",
      icon: MinusCircle,
      className: "bg-info-soft text-info-fg",
    },
    INPUT: {
      label: "Short Text",
      icon: Type,
      className: "bg-success-soft text-success-fg",
    },
    CHECKBOX: {
      label: "Multiple Choice",
      icon: CheckCircle2,
      className: "bg-purple-soft text-purple-fg",
    },
  };

  const { label, icon: Icon, className } = config[type];

  return (
    <Badge variant="secondary" className={`${className} gap-1.5`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}