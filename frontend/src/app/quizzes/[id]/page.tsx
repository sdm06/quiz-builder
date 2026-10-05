import { notFound } from "next/navigation";
import { getQuiz } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { QuestionBadge } from "@/components/question-badge";
import { DeleteQuizButton } from "@/components/delete-quiz-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Type, MinusCircle, FileText, PlayCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface QuizPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function QuizDetailPage({ params }: QuizPageProps) {
  const { id } = await params;
  const quiz = await getQuiz(id);

  if (!quiz) {
    notFound();
  }

  const typeIcons = {
    BOOLEAN: MinusCircle,
    INPUT: Type,
    CHECKBOX: CheckCircle2,
  };

  const typeLabels = {
    BOOLEAN: "True / False",
    INPUT: "Short Text",
    CHECKBOX: "Multiple Choice",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container-page py-8 sm:py-10 max-w-3xl">
        <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-4">
          <Link
            href="/quizzes"
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Back to quizzes"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-[12rem]">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
              {quiz.title}
            </h1>
            <p className="text-muted-foreground">
              Created {format(new Date(quiz.createdAt), "PPP")} · {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm">
              <Link href={`/quizzes/${id}/solve`}>
                <PlayCircle className="h-4 w-4 mr-2" />
                Solve
              </Link>
            </Button>
            <DeleteQuizButton quizId={quiz.id} quizTitle={quiz.title} />
          </div>
        </div>

        {quiz.questions.length === 0 && (
          <Card className="border-dashed mb-6">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">This quiz has no questions yet.</p>
              <Button asChild variant="secondary" size="sm">
                <Link href="/quizzes/create">Create a quiz</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Questions</span>
              <Badge variant="outline" className="gap-1">
                <FileText className="h-3 w-3" />
                {quiz.questions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quiz.questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-mono text-muted-foreground text-sm bg-muted px-2 py-0.5 rounded">
                      #{index + 1}
                    </span>
                    <QuestionBadge type={question.type} />
                  </div>
                </div>

                <p className="text-lg font-medium">{question.text}</p>

                <Separator />

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    {(() => {
                      const Icon = typeIcons[question.type];
                      return <Icon className="h-3 w-3" />;
                    })()}
                    {typeLabels[question.type]}
                  </Badge>
                </div>

                {question.type === "BOOLEAN" && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Correct Answer:</span>
                    <Badge variant={question.booleanAnswer ? "default" : "outline"}>
                      {question.booleanAnswer ? "True" : "False"}
                    </Badge>
                  </div>
                )}

                {question.type === "INPUT" && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Answer Key:</span>
                    <code className="bg-background px-2 py-1 rounded text-sm font-mono border">
                      {question.textAnswer || "(empty)"}
                    </code>
                  </div>
                )}

                {question.type === "CHECKBOX" && question.options.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Options:</span>
                    <ul className="space-y-1 ml-4">
                      {question.options.map((option, optIndex) => (
                        <li key={option.id} className="flex items-center gap-2 text-sm">
                          <span className="flex h-5 w-5 items-center justify-center rounded border text-xs font-mono text-muted-foreground">
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span className="flex-1">{option.text}</span>
                          {option.isCorrect && (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          )}
                          {option.isCorrect && <Badge variant="default" className="ml-auto">Correct</Badge>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}