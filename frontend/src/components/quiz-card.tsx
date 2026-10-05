"use client";

import Link from "next/link";
import { format } from "date-fns";
import { FileText, PlayCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteQuizButton } from "./delete-quiz-button";

type Quiz = {
  id: string;
  title: string;
  createdAt: string;
  _count: { questions: number };
};

export function QuizCard({ quiz }: { quiz: Quiz }) {
  return (
    <Card className="h-full flex flex-col transition-shadow hover:shadow-md relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* The stretched pseudo-element makes the whole card clickable
                without nesting the delete button inside the link. */}
            <CardTitle className="truncate">
              <Link
                href={`/quizzes/${quiz.id}`}
                title={quiz.title}
                className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
              >
                {quiz.title}
              </Link>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Created {format(new Date(quiz.createdAt), "PPP")}
            </p>
          </div>
          <DeleteQuizButton quizId={quiz.id} quizTitle={quiz.title} />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            {quiz._count.questions} question{quiz._count.questions !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t">
        {/* Sits above the stretched link so it stays clickable. */}
        <Link
          href={`/quizzes/${quiz.id}/solve`}
          className="relative z-10 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <PlayCircle className="h-3.5 w-3.5" />
          Solve quiz
        </Link>
      </CardFooter>
    </Card>
  );
}