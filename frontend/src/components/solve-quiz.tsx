"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QuestionBadge } from "@/components/question-badge";
import { submitQuizAction } from "@/app/actions/quizzes";
import type { PlayableQuestion, PlayableQuiz, SubmittedAnswer, SubmitResult } from "@/lib/api";

type Draft = {
  booleanAnswer?: boolean;
  textAnswer?: string;
  optionIds?: string[];
};

function scoreTone(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

function verdict(score: number) {
  if (score >= 80) return "Excellent work";
  if (score >= 50) return "Good effort";
  return "Keep practising";
}

export function SolveQuiz({ quiz }: { quiz: PlayableQuiz }) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = quiz.questions.length;
  const answeredCount = useMemo(() => {
    return quiz.questions.filter((question) => {
      const draft = drafts[question.id];
      if (!draft) return false;
      if (question.type === "BOOLEAN") return typeof draft.booleanAnswer === "boolean";
      if (question.type === "INPUT") return (draft.textAnswer ?? "").trim() !== "";
      return (draft.optionIds?.length ?? 0) > 0;
    }).length;
  }, [drafts, quiz.questions]);

  const setDraft = (questionId: string, patch: Draft) => {
    setDrafts((current) => ({ ...current, [questionId]: { ...current[questionId], ...patch } }));
  };

  const toggleOption = (questionId: string, optionId: string) => {
    const selected = drafts[questionId]?.optionIds ?? [];
    const next = selected.includes(optionId)
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];
    setDraft(questionId, { optionIds: next });
  };

  const handleSubmit = () => {
    setError(null);
    const answers: SubmittedAnswer[] = [];

    for (const question of quiz.questions) {
      const draft = drafts[question.id];
      if (!draft) continue;

      if (question.type === "BOOLEAN" && typeof draft.booleanAnswer === "boolean") {
        answers.push({ questionId: question.id, type: "BOOLEAN", booleanAnswer: draft.booleanAnswer });
      } else if (question.type === "INPUT" && (draft.textAnswer ?? "").trim() !== "") {
        answers.push({ questionId: question.id, type: "INPUT", textAnswer: draft.textAnswer!.trim() });
      } else if (question.type === "CHECKBOX" && (draft.optionIds?.length ?? 0) > 0) {
        answers.push({ questionId: question.id, type: "CHECKBOX", optionIds: draft.optionIds! });
      }
    }

    startTransition(async () => {
      const { result: graded, error: submitError } = await submitQuizAction(quiz.id, answers);
      if (submitError) {
        setError(submitError);
        return;
      }
      setResult(graded ?? null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const handleRetry = () => {
    setResult(null);
    setDrafts({});
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (result) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className={`text-5xl font-bold tabular-nums ${scoreTone(result.score)}`}>
              {result.score}%
            </p>
            <p className="text-lg font-medium">{verdict(result.score)}</p>
            <p className="text-muted-foreground">
              {result.correctCount} of {result.totalQuestions} correct
            </p>
            <Progress value={result.score} className="max-w-sm mx-auto" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Try again
            </Button>
            <Button asChild variant="secondary">
              <Link href="/quizzes">Back to quizzes</Link>
            </Button>
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold">Review</h2>
        <div className="space-y-4">
          {result.results.map((entry, index) => {
            const question = quiz.questions.find((q) => q.id === entry.questionId);
            if (!question) return null;

            return (
              <Card key={entry.questionId}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-muted-foreground text-sm bg-muted px-2 py-0.5 rounded shrink-0">
                        #{index + 1}
                      </span>
                      <QuestionBadge type={question.type} />
                    </div>
                    <Badge
                      variant="secondary"
                      className={`gap-1 shrink-0 ${
                        entry.correct ? "bg-success-soft text-success-fg" : "bg-danger-soft text-danger-fg"
                      }`}
                    >
                      {entry.correct ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {entry.correct ? "Correct" : "Incorrect"}
                    </Badge>
                  </div>

                  <p className="font-medium">{question.text}</p>

                  <Separator />

                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Your answer</p>
                    <p className="font-medium">{describeAnswer(entry, question)}</p>
                    {!entry.correct && (
                      <p className="text-muted-foreground">
                        Correct answer:{" "}
                        <span className="font-medium text-foreground">
                          {describeExpected(entry)}
                        </span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="sticky top-16 z-40">
        <CardContent className="py-3 flex items-center gap-4">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {answeredCount} of {total} answered
          </span>
          <Progress value={total === 0 ? 0 : (answeredCount / total) * 100} className="flex-1" />
        </CardContent>
      </Card>

      {quiz.questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          index={index}
          question={question}
          draft={drafts[question.id] ?? {}}
          onBooleanChange={(value) => setDraft(question.id, { booleanAnswer: value })}
          onTextChange={(value) => setDraft(question.id, { textAnswer: value })}
          onToggleOption={(optionId) => toggleOption(question.id, optionId)}
        />
      ))}

      {error && (
        <p className="text-sm text-destructive text-center" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t">
        <Button asChild variant="secondary">
          <Link href={`/quizzes/${quiz.id}`}>Back to details</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={isPending || total === 0} className="gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Grading..." : "Submit answers"}
        </Button>
      </div>
    </div>
  );
}

function QuestionCard({
  index,
  question,
  draft,
  onBooleanChange,
  onTextChange,
  onToggleOption,
}: {
  index: number;
  question: PlayableQuestion;
  draft: Draft;
  onBooleanChange: (value: boolean) => void;
  onTextChange: (value: string) => void;
  onToggleOption: (optionId: string) => void;
}) {
  const inputId = `question-${question.id}`;

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-muted-foreground text-sm bg-muted px-2 py-0.5 rounded">
            #{index + 1}
          </span>
          <QuestionBadge type={question.type} />
        </div>

        <Label htmlFor={inputId} className="text-base font-medium block leading-snug break-words">
          {question.text}
        </Label>

        {question.type === "BOOLEAN" && (
          <RadioGroup
            value={typeof draft.booleanAnswer === "boolean" ? String(draft.booleanAnswer) : ""}
            onValueChange={(value) => onBooleanChange(value === "true")}
            className="flex items-center gap-6"
          >
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="true" id={`${inputId}-true`} />
              True
            </Label>
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="false" id={`${inputId}-false`} />
              False
            </Label>
          </RadioGroup>
        )}

        {question.type === "INPUT" && (
          <Input
            id={inputId}
            value={draft.textAnswer ?? ""}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="Type your answer"
            autoComplete="off"
          />
        )}

        {question.type === "CHECKBOX" && (
          <div className="space-y-3">
            {question.options.map((option, optionIndex) => {
              const optionId = `${inputId}-option-${option.id}`;
              const checked = (draft.optionIds ?? []).includes(option.id);
              return (
                <Label
                  key={option.id}
                  htmlFor={optionId}
                  className="flex items-start gap-3 rounded-lg border p-3 font-normal hover:bg-accent/50 cursor-pointer"
                >
                  <Checkbox
                    id={optionId}
                    checked={checked}
                    onCheckedChange={() => onToggleOption(option.id)}
                    className="mt-0.5"
                  />
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-mono text-muted-foreground">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="flex-1 break-words">{option.text}</span>
                </Label>
              );
            })}
            <p className="text-xs text-muted-foreground">Select every option that applies.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type ResultEntry = SubmitResult["results"][number];

function describeAnswer(entry: ResultEntry, question: PlayableQuestion): string {
  if (question.type === "BOOLEAN") {
    const submitted = entry.submitted as { booleanAnswer?: boolean | null } | null;
    if (typeof submitted?.booleanAnswer !== "boolean") return "Not answered";
    return submitted.booleanAnswer ? "True" : "False";
  }

  if (question.type === "INPUT") {
    const submitted = entry.submitted as { textAnswer?: string | null } | null;
    return submitted?.textAnswer ? submitted.textAnswer : "Not answered";
  }

  const submitted = entry.submitted as { optionIds?: string[] } | null;
  const ids = submitted?.optionIds ?? [];
  if (ids.length === 0) return "Not answered";
  const labels = ids
    .map((id) => question.options.find((option) => option.id === id)?.text)
    .filter(Boolean);
  return labels.length > 0 ? labels.join(", ") : `${ids.length} option(s)`;
}

function describeExpected(entry: ResultEntry): string {
  if (entry.type === "BOOLEAN") {
    return entry.expected.booleanAnswer ? "True" : "False";
  }
  if (entry.type === "INPUT") {
    return entry.expected.textAnswer || "(empty)";
  }
  return `${entry.expected.optionIds?.length ?? 0} correct option(s)`;
}