import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateQuizDto } from './dto/create-quiz.dto.js';
import { SubmitQuizDto } from './dto/submit-quiz.dto.js';
import { QuestionType } from './dto/question-type.enum.js';

/**
 * Normalises a free-text answer before comparison so that casing, surrounding
 * whitespace and repeated inner whitespace do not affect grading.
 */
function normaliseText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function sameIdSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const left = new Set(a);
  return b.every((id) => left.has(id));
}

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuizDto) {
    const quiz = await this.prisma.quiz.create({
      data: {
        title: dto.title,
        questions: {
          create: dto.questions.map((q, index) => ({
            type: q.type,
            text: q.text,
            booleanAnswer: q.type === 'BOOLEAN' ? q.booleanAnswer : null,
            textAnswer: q.type === 'INPUT' ? q.textAnswer : null,
            order: q.order ?? index,
            options: q.type === 'CHECKBOX' && q.options?.length
              ? { create: q.options.map((opt) => ({ text: opt.text, isCorrect: opt.isCorrect })) }
              : undefined,
          })),
        },
      },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
      },
    });
    return quiz;
  }

  async findAll() {
    return this.prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!quiz) {
      throw new NotFoundException(`Quiz with id "${id}" not found`);
    }
    return quiz;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.quiz.delete({ where: { id } });
    return { success: true, id };
  }

  /**
   * Quiz shape for someone attempting it. Correct answers are stripped so they
   * never reach the browser - grading happens server-side in `submit`.
   */
  async findOneForPlay(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with id "${id}" not found`);
    }

    return {
      id: quiz.id,
      title: quiz.title,
      questions: quiz.questions.map((question) => ({
        id: question.id,
        type: question.type,
        text: question.text,
        order: question.order,
        options:
          question.type === QuestionType.CHECKBOX
            ? question.options.map((option) => ({ id: option.id, text: option.text }))
            : [],
      })),
    };
  }

  /**
   * Grades a set of answers against the stored answer key.
   *
   * Questions the attempt did not answer are reported as incorrect rather than
   * omitted, so `results.length` always equals the number of questions.
   */
  async submit(id: string, dto: SubmitQuizDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with id "${id}" not found`);
    }

    const answersByQuestion = new Map<string, SubmitQuizDto['answers'][number]>();
    for (const answer of dto.answers ?? []) {
      if (answersByQuestion.has(answer.questionId)) {
        throw new BadRequestException(`Duplicate answer for question "${answer.questionId}"`);
      }
      answersByQuestion.set(answer.questionId, answer);
    }

    const knownQuestionIds = new Set(quiz.questions.map((question) => question.id));
    for (const questionId of answersByQuestion.keys()) {
      if (!knownQuestionIds.has(questionId)) {
        throw new BadRequestException(
          `Question "${questionId}" does not belong to quiz "${id}"`,
        );
      }
    }

    const results = quiz.questions.map((question) => {
      const answer = answersByQuestion.get(question.id);

      switch (question.type) {
        case QuestionType.BOOLEAN: {
          const correct = answer?.booleanAnswer === question.booleanAnswer;
          return {
            questionId: question.id,
            type: question.type,
            correct,
            expected: { booleanAnswer: question.booleanAnswer },
            submitted: answer?.booleanAnswer ?? null,
          };
        }

        case QuestionType.INPUT: {
          const correct =
            answer?.textAnswer !== undefined &&
            normaliseText(answer.textAnswer) === normaliseText(question.textAnswer ?? '');
          return {
            questionId: question.id,
            type: question.type,
            correct,
            expected: { textAnswer: question.textAnswer },
            submitted: answer?.textAnswer ?? null,
          };
        }

        case QuestionType.CHECKBOX: {
          const correctOptionIds = question.options
            .filter((option) => option.isCorrect)
            .map((option) => option.id);
          const selectedOptionIds = answer?.optionIds ?? [];
          const selected = new Set(selectedOptionIds);

          return {
            questionId: question.id,
            type: question.type,
            correct: sameIdSet(selectedOptionIds, correctOptionIds),
            expected: { optionIds: correctOptionIds },
            submitted: { optionIds: selectedOptionIds },
            // Which of the ticked options were wrong, so the UI can highlight them.
            incorrectOptionIds: [...selected].filter(
              (optionId) => !correctOptionIds.includes(optionId),
            ),
          };
        }

        default: {
          throw new BadRequestException(`Unsupported question type "${String(question.type)}"`);
        }
      }
    });

    const correctCount = results.filter((result) => result.correct).length;
    const totalQuestions = results.length;

    return {
      quizId: quiz.id,
      title: quiz.title,
      totalQuestions,
      correctCount,
      // Guard against a quiz with no questions so the score stays a number.
      score: totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100),
      results,
    };
  }
}