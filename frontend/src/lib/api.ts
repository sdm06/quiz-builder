// Read at runtime on the server only. Must not use the NEXT_PUBLIC_ prefix:
// those are inlined at build time, so a container-runtime value would be ignored.
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const QUIZZES_TAG = "quizzes";

export function quizTag(id: string) {
  return `quiz:${id}`;
}

export type QuestionType = "BOOLEAN" | "INPUT" | "CHECKBOX";

export type QuizSummary = {
  id: string;
  title: string;
  createdAt: string;
  _count: { questions: number };
};

export type QuizDetail = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  questions: Array<{
    id: string;
    type: QuestionType;
    text: string;
    booleanAnswer: boolean | null;
    textAnswer: string | null;
    order: number;
    options: Array<{ id: string; text: string; isCorrect: boolean }>;
  }>;
};

/** Quiz shape for attempting: deliberately carries no answer key. */
export type PlayableQuestion = {
  id: string;
  type: QuestionType;
  text: string;
  order: number;
  options: Array<{ id: string; text: string }>;
};

export type PlayableQuiz = {
  id: string;
  title: string;
  questions: PlayableQuestion[];
};

export type SubmittedAnswer =
  | { questionId: string; type: "BOOLEAN"; booleanAnswer: boolean }
  | { questionId: string; type: "INPUT"; textAnswer: string }
  | { questionId: string; type: "CHECKBOX"; optionIds: string[] };

export type QuestionResult = {
  questionId: string;
  type: QuestionType;
  correct: boolean;
  expected: { booleanAnswer?: boolean | null; textAnswer?: string | null; optionIds?: string[] };
  submitted: { booleanAnswer?: boolean | null; textAnswer?: string | null; optionIds?: string[] } | string | null;
  incorrectOptionIds?: string[];
};

export type SubmitResult = {
  quizId: string;
  title: string;
  totalQuestions: number;
  correctCount: number;
  score: number;
  results: QuestionResult[];
};

async function fetchApi<T>(
  path: string,
  options?: RequestInit & { tags?: string[]; allowNotFound?: boolean },
): Promise<T | null> {
  const { tags, allowNotFound, ...init } = options ?? {};

  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init.headers },
    ...init,
    next: init.method === "GET" || !init.method ? { tags: tags ?? [QUIZZES_TAG] } : undefined,
  });

  if (res.status === 404 && allowNotFound) return null;

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function getQuizzes() {
  const quizzes = await fetchApi<QuizSummary[]>("/quizzes");
  return quizzes ?? [];
}

/** Returns null when the quiz does not exist, so callers can call notFound(). */
export async function getQuiz(id: string) {
  return fetchApi<QuizDetail>(`/quizzes/${id}`, {
    tags: [quizTag(id)],
    allowNotFound: true,
  });
}

/** Answer-free quiz used by the solve flow. Null when the quiz does not exist. */
export async function getQuizForPlay(id: string) {
  return fetchApi<PlayableQuiz>(`/quizzes/${id}/play`, {
    tags: [`play:${id}`],
    allowNotFound: true,
  });
}

export async function submitQuiz(id: string, answers: SubmittedAnswer[]) {
  const result = await fetchApi<SubmitResult>(`/quizzes/${id}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
  return result as SubmitResult;
}

export async function createQuiz(payload: unknown) {
  return fetchApi<{ id: string; title: string; createdAt: string; questions: unknown[] }>("/quizzes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteQuiz(id: string) {
  return fetchApi<{ success: boolean; id: string }>(`/quizzes/${id}`, { method: "DELETE" });
}