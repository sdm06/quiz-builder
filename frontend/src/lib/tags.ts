// Shared cache tags - keep this file simple to avoid circular imports
export const QUIZZES_TAG = "quizzes";

export function quizTag(id: string) {
  return `quiz:${id}`;
}