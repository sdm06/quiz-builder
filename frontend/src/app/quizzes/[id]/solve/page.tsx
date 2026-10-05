import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SolveQuiz } from "@/components/solve-quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getQuizForPlay } from "@/lib/api";

interface SolvePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function SolveQuizPage({ params }: SolvePageProps) {
  const { id } = await params;
  const quiz = await getQuizForPlay(id);

  if (!quiz) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container-page py-8 sm:py-10 max-w-3xl">
        <div className="mb-6 sm:mb-8 flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
            <Link href={`/quizzes/${id}`} aria-label="Back to quiz details">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
              {quiz.title}
            </h1>
            <p className="text-muted-foreground">
              {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""} · answers
              are graded on the server
            </p>
          </div>
        </div>

        {quiz.questions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <h3 className="text-lg font-semibold mb-2">Nothing to solve</h3>
              <p className="text-muted-foreground mb-6">
                This quiz has no questions yet, so there is nothing to attempt.
              </p>
              <Button asChild variant="secondary">
                <Link href={`/quizzes/${id}`}>Back to details</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <SolveQuiz quiz={quiz} />
        )}
      </main>
    </div>
  );
}