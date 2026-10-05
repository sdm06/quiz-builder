import { getQuizzes } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { QuizCard } from "@/components/quiz-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  const quizzes = await getQuizzes();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container-page py-8 sm:py-10 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
            <p className="text-muted-foreground">Manage your quiz collection</p>
          </div>
          <Button asChild className="gap-2 self-start sm:self-auto shrink-0">
            <Link href="/quizzes/create">
              <Plus className="h-4 w-4" />
              Create Quiz
            </Link>
          </Button>
        </div>

        {quizzes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
              <p className="text-muted-foreground mb-6">Create your first quiz to get started.</p>
              <Button asChild className="gap-2 mx-auto">
                <Link href="/quizzes/create">
                  <Plus className="h-4 w-4" />
                  Create Quiz
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}