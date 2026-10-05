"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createQuizApiSchema } from "@/lib/schemas/quiz";
import {
  createQuiz,
  deleteQuiz,
  getQuizForPlay,
  QUIZZES_TAG,
  quizTag,
  submitQuiz,
  type SubmittedAnswer,
  type SubmitResult,
} from "@/lib/api";

export async function createQuizAction(formData: FormData) {
  const raw = JSON.parse(formData.get("payload") as string);
  const parsed = createQuizApiSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Invalid payload", issues: parsed.error.flatten() };
  }

  await createQuiz(parsed.data);
  revalidateTag(QUIZZES_TAG, "max");
  redirect("/quizzes");
}

export async function deleteQuizAction(id: string) {
  await deleteQuiz(id);
  revalidateTag(QUIZZES_TAG, "max");
  revalidateTag(quizTag(id), "max");
}

/**
 * Grades an attempt. Returns the result instead of throwing so the client can
 * render the score screen; the `error` field is for genuinely failed requests.
 */
export async function submitQuizAction(
  quizId: string,
  answers: SubmittedAnswer[],
): Promise<{ result?: SubmitResult; error?: string }> {
  try {
    return { result: await submitQuiz(quizId, answers) };
  } catch {
    return { error: "Could not submit your answers. Please try again." };
  }
}

/** Loads the answer-free quiz for the solve page. Null when it does not exist. */
export async function loadPlayableQuiz(quizId: string) {
  return getQuizForPlay(quizId);
}