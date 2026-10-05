"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createQuizAction } from "@/app/actions/quizzes";
import { quizFormSchema, type QuizFormValues, toCreateQuizPayload } from "@/lib/schemas/quiz";
import { QuestionsFieldArray } from "@/components/quiz-form/questions-field-array";

export default function CreateQuizPage() {
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      questions: [{ type: "BOOLEAN", text: "", booleanAnswer: true, order: 0 }],
    },
  });

  const onSubmit = async (values: QuizFormValues) => {
    try {
      const payload = toCreateQuizPayload(values);
      const formData = new FormData();
      formData.append("payload", JSON.stringify(payload));
      await createQuizAction(formData);
    } catch (error) {
      if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
      toast.error("Failed to create quiz");
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="container-page py-8 sm:py-10 max-w-3xl">
          <div className="mb-6 sm:mb-8 flex items-center gap-4">
            <Link
              href="/quizzes"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Back to quizzes"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Quiz</h1>
              <p className="text-muted-foreground">Build your quiz with multiple question types</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter quiz title (min 3 characters)"
                  {...form.register("title")}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Questions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <QuestionsFieldArray />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/quizzes">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="gap-2">
              Create Quiz
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}