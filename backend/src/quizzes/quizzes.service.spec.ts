import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { QuizzesService } from './quizzes.service.js';
import { CreateQuizDto } from './dto/create-quiz.dto.js';
import { QuestionType } from './dto/question-type.enum.js';

const mockPrismaService = {
  quiz: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
};

describe('QuizzesService', () => {
  let service: QuizzesService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a quiz with boolean, input, and checkbox questions', async () => {
      const dto: CreateQuizDto = {
        title: 'Test Quiz',
        questions: [
          { type: QuestionType.BOOLEAN, text: 'Is JS typed?', booleanAnswer: false },
          { type: QuestionType.INPUT, text: 'What is HTTP?', textAnswer: 'HyperText Transfer Protocol' },
          {
            type: QuestionType.CHECKBOX,
            text: 'Select primitives',
            options: [
              { text: 'string', isCorrect: true },
              { text: 'number', isCorrect: true },
              { text: 'float', isCorrect: false },
            ],
          },
        ],
      };

      const expectedQuiz = { id: 'uuid-1', title: 'Test Quiz', questions: dto.questions };
      prisma.quiz.create.mockResolvedValue(expectedQuiz);

      const result = await service.create(dto);

      expect(prisma.quiz.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Quiz',
          questions: {
            create: [
              { type: 'BOOLEAN', text: 'Is JS typed?', booleanAnswer: false, textAnswer: null, order: 0, options: undefined },
              { type: 'INPUT', text: 'What is HTTP?', booleanAnswer: null, textAnswer: 'HyperText Transfer Protocol', order: 1, options: undefined },
              {
                type: 'CHECKBOX',
                text: 'Select primitives',
                booleanAnswer: null,
                textAnswer: null,
                order: 2,
                options: {
                  create: [
                    { text: 'string', isCorrect: true },
                    { text: 'number', isCorrect: true },
                    { text: 'float', isCorrect: false },
                  ],
                },
              },
            ],
          },
        },
        include: {
          questions: {
            include: { options: true },
            orderBy: { order: 'asc' },
          },
        },
      });
      expect(result).toEqual(expectedQuiz);
    });

    it('should respect custom order values', async () => {
      const dto: CreateQuizDto = {
        title: 'Ordered Quiz',
        questions: [
          { type: QuestionType.BOOLEAN, text: 'Q1', booleanAnswer: true, order: 2 },
          { type: QuestionType.BOOLEAN, text: 'Q2', booleanAnswer: false, order: 0 },
        ],
      };
      prisma.quiz.create.mockResolvedValue({ id: 'uuid-2', title: 'Ordered Quiz', questions: dto.questions });

      await service.create(dto);

      expect(prisma.quiz.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          questions: {
            create: [
              expect.objectContaining({ order: 2 }),
              expect.objectContaining({ order: 0 }),
            ],
          },
        }),
      }));
    });
  });

  describe('findAll', () => {
    it('should return quizzes with question counts ordered by createdAt desc', async () => {
      const quizzes = [
        { id: '1', title: 'Quiz A', createdAt: new Date('2024-01-02'), _count: { questions: 3 } },
        { id: '2', title: 'Quiz B', createdAt: new Date('2024-01-01'), _count: { questions: 2 } },
      ];
      prisma.quiz.findMany.mockResolvedValue(quizzes);

      const result = await service.findAll();

      expect(prisma.quiz.findMany).toHaveBeenCalledWith({
        select: { id: true, title: true, createdAt: true, _count: { select: { questions: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(quizzes);
    });
  });

  describe('findOne', () => {
    it('should return quiz with ordered questions and options', async () => {
      const quiz = {
        id: 'quiz-1',
        title: 'Detail Quiz',
        questions: [
          { id: 'q1', type: 'CHECKBOX', text: 'Q1', order: 0, options: [{ text: 'A', isCorrect: true }] },
        ],
      };
      prisma.quiz.findUnique.mockResolvedValue(quiz);

      const result = await service.findOne('quiz-1');

      expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
        where: { id: 'quiz-1' },
        include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } },
      });
      expect(result).toEqual(quiz);
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('missing-id')).rejects.toThrow('Quiz with id "missing-id" not found');
    });
  });

  describe('remove', () => {
    it('should delete quiz and return success', async () => {
      prisma.quiz.findUnique.mockResolvedValue({ id: 'del-1' });
      prisma.quiz.delete.mockResolvedValue({ id: 'del-1' });

      const result = await service.remove('del-1');

      expect(prisma.quiz.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'del-1' } }));
      expect(prisma.quiz.delete).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'del-1' } }));
      expect(result).toEqual({ success: true, id: 'del-1' });
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneForPlay', () => {
    it('should strip the answer key so it cannot leak to the client', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        id: 'quiz-1',
        title: 'Playable',
        questions: [
          {
            id: 'q1',
            type: 'BOOLEAN',
            text: 'Is it true?',
            booleanAnswer: true,
            textAnswer: null,
            order: 0,
            options: [],
          },
          {
            id: 'q2',
            type: 'CHECKBOX',
            text: 'Pick one',
            booleanAnswer: null,
            textAnswer: null,
            order: 1,
            options: [
              { id: 'o1', text: 'Right', isCorrect: true },
              { id: 'o2', text: 'Wrong', isCorrect: false },
            ],
          },
        ],
      });

      const result = await service.findOneForPlay('quiz-1');

      expect(result.questions[0]).toEqual({
        id: 'q1',
        type: 'BOOLEAN',
        text: 'Is it true?',
        order: 0,
        options: [],
      });
      // Options are reduced to id + text: no isCorrect.
      expect(result.questions[1]!.options).toEqual([
        { id: 'o1', text: 'Right' },
        { id: 'o2', text: 'Wrong' },
      ]);
      expect(JSON.stringify(result)).not.toContain('isCorrect');
      expect(JSON.stringify(result)).not.toContain('booleanAnswer');
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.findOneForPlay('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('submit', () => {
    const quizFixture = {
      id: 'quiz-1',
      title: 'Graded',
      questions: [
        { id: 'q1', type: 'BOOLEAN', text: 'Q1', booleanAnswer: true, textAnswer: null, order: 0, options: [] },
        { id: 'q2', type: 'INPUT', text: 'Q2', booleanAnswer: null, textAnswer: 'Paris', order: 1, options: [] },
        {
          id: 'q3',
          type: 'CHECKBOX',
          text: 'Q3',
          booleanAnswer: null,
          textAnswer: null,
          order: 2,
          options: [
            { id: 'o1', text: 'A', isCorrect: true },
            { id: 'o2', text: 'B', isCorrect: true },
            { id: 'o3', text: 'C', isCorrect: false },
          ],
        },
      ],
    };

    it('should grade every question type correctly', async () => {
      prisma.quiz.findUnique.mockResolvedValue(quizFixture);

      const result = await service.submit('quiz-1', {
        answers: [
          { questionId: 'q1', type: QuestionType.BOOLEAN, booleanAnswer: true },
          { questionId: 'q2', type: QuestionType.INPUT, textAnswer: 'paris' },
          { questionId: 'q3', type: QuestionType.CHECKBOX, optionIds: ['o2', 'o1'] },
        ],
      });

      expect(result.totalQuestions).toBe(3);
      expect(result.correctCount).toBe(3);
      expect(result.score).toBe(100);
      expect(result.results.every((r) => r.correct)).toBe(true);
    });

    it('should mark wrong answers and report partial checkbox picks', async () => {
      prisma.quiz.findUnique.mockResolvedValue(quizFixture);

      const result = await service.submit('quiz-1', {
        answers: [
          { questionId: 'q1', type: QuestionType.BOOLEAN, booleanAnswer: false },
          { questionId: 'q2', type: QuestionType.INPUT, textAnswer: 'London' },
          // Only one of the two correct options ticked, plus a wrong one.
          { questionId: 'q3', type: QuestionType.CHECKBOX, optionIds: ['o1', 'o3'] },
        ],
      });

      expect(result.correctCount).toBe(0);
      expect(result.score).toBe(0);
      const checkbox = result.results.find((r) => r.questionId === 'q3');
      expect(checkbox?.correct).toBe(false);
      expect(checkbox?.incorrectOptionIds).toEqual(['o3']);
    });

    it('should ignore casing and extra whitespace when grading text answers', async () => {
      prisma.quiz.findUnique.mockResolvedValue(quizFixture);

      const result = await service.submit('quiz-1', {
        answers: [{ questionId: 'q2', type: QuestionType.INPUT, textAnswer: '  PaRis  ' }],
      });

      expect(result.results.find((r) => r.questionId === 'q2')?.correct).toBe(true);
    });

    it('should count unanswered questions as incorrect', async () => {
      prisma.quiz.findUnique.mockResolvedValue(quizFixture);

      const result = await service.submit('quiz-1', { answers: [] });

      expect(result.totalQuestions).toBe(3);
      expect(result.correctCount).toBe(0);
      expect(result.results).toHaveLength(3);
    });

    it('should reject answers for questions outside the quiz', async () => {
      prisma.quiz.findUnique.mockResolvedValue(quizFixture);

      await expect(
        service.submit('quiz-1', {
          answers: [{ questionId: 'not-in-quiz', type: QuestionType.BOOLEAN, booleanAnswer: true }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate answers for the same question', async () => {
      prisma.quiz.findUnique.mockResolvedValue(quizFixture);

      await expect(
        service.submit('quiz-1', {
          answers: [
            { questionId: 'q1', type: QuestionType.BOOLEAN, booleanAnswer: true },
            { questionId: 'q1', type: QuestionType.BOOLEAN, booleanAnswer: false },
          ],
        }),
      ).rejects.toThrow(/Duplicate answer/);
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.submit('missing', { answers: [] })).rejects.toThrow(NotFoundException);
    });
  });
});