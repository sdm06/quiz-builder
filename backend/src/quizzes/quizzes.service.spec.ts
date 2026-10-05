import { NotFoundException } from '@nestjs/common';
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
});