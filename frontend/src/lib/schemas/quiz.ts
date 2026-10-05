import { z } from "zod";

export const questionTypeEnum = z.enum(["BOOLEAN", "INPUT", "CHECKBOX"]);

export const optionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
});

export const booleanQuestionSchema = z.object({
  type: z.literal("BOOLEAN"),
  text: z.string().min(1, "Question text is required"),
  booleanAnswer: z.boolean(),
  order: z.number().int().nonnegative().default(0),
});

export const inputQuestionSchema = z.object({
  type: z.literal("INPUT"),
  text: z.string().min(1, "Question text is required"),
  textAnswer: z.string().min(1, "Answer key is required"),
  order: z.number().int().nonnegative().default(0),
});

export const checkboxQuestionSchema = z.object({
  type: z.literal("CHECKBOX"),
  text: z.string().min(1, "Question text is required"),
  options: z.array(optionSchema).min(2, "At least two options are required"),
  order: z.number().int().nonnegative().default(0),
});

export const questionSchema = z.discriminatedUnion("type", [
  booleanQuestionSchema,
  inputQuestionSchema,
  checkboxQuestionSchema,
]);

// Form schema - order is optional in input (has default)
export const quizFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  questions: z.array(questionSchema).min(1, "At least one question is required"),
});

// API payload schema - order is required number
export const createQuizPayloadSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("BOOLEAN"),
    text: z.string().min(1),
    booleanAnswer: z.boolean(),
    order: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("INPUT"),
    text: z.string().min(1),
    textAnswer: z.string().min(1),
    order: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("CHECKBOX"),
    text: z.string().min(1),
    options: z.array(optionSchema).min(2, "At least two options required"),
    order: z.number().int().nonnegative(),
  }),
]);

export const createQuizApiSchema = z.object({
  title: z.string().min(3),
  questions: z.array(createQuizPayloadSchema).min(1),
});

// Type exports
export type QuestionType = z.infer<typeof questionTypeEnum>;
export type Option = z.infer<typeof optionSchema>;
export type BooleanQuestion = z.infer<typeof booleanQuestionSchema>;
export type InputQuestion = z.infer<typeof inputQuestionSchema>;
export type CheckboxQuestion = z.infer<typeof checkboxQuestionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuizFormValues = z.input<typeof quizFormSchema>;
export type CreateQuizPayload = z.infer<typeof createQuizPayloadSchema>;
export type CreateQuizApi = z.infer<typeof createQuizApiSchema>;

export function toCreateQuizPayload(values: QuizFormValues): CreateQuizApi {
  const payloadQuestions: CreateQuizPayload[] = values.questions.map((q) => {
    switch (q.type) {
      case "BOOLEAN":
        return {
          type: "BOOLEAN" as const,
          text: q.text,
          booleanAnswer: q.booleanAnswer,
          order: q.order ?? 0,
        };
      case "INPUT":
        return {
          type: "INPUT" as const,
          text: q.text,
          textAnswer: q.textAnswer,
          order: q.order ?? 0,
        };
      case "CHECKBOX":
        return {
          type: "CHECKBOX" as const,
          text: q.text,
          options: q.options ?? [],
          order: q.order ?? 0,
        };
    }
  });
  return { title: values.title, questions: payloadQuestions };
}