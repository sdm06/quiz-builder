import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { QuestionTypeRulesPipe } from './question-type-rules.pipe.js';
import { QuestionType } from '../dto/question-type.enum.js';
import type { CreateQuizDto } from '../dto/create-quiz.dto.js';

describe('QuestionTypeRulesPipe', () => {
  let pipe: QuestionTypeRulesPipe;
  const metadata: ArgumentMetadata = { type: 'body', metatype: Object, data: '' };

  beforeEach(() => {
    pipe = new QuestionTypeRulesPipe();
  });

  const makeQuiz = (questions: CreateQuizDto['questions']): CreateQuizDto => ({
    title: 'Test Quiz',
    questions,
  });

  describe('BOOLEAN type', () => {
    it('should pass when booleanAnswer is true', () => {
      const quiz = makeQuiz([{ type: QuestionType.BOOLEAN, text: 'Test', booleanAnswer: true }]);
      expect(() => pipe.transform(quiz, metadata)).not.toThrow();
    });

    it('should pass when booleanAnswer is false', () => {
      const quiz = makeQuiz([{ type: QuestionType.BOOLEAN, text: 'Test', booleanAnswer: false }]);
      expect(() => pipe.transform(quiz, metadata)).not.toThrow();
    });

    it('should throw when booleanAnswer is missing', () => {
      const quiz = makeQuiz([{ type: QuestionType.BOOLEAN, text: 'Test' }]);
      expect(() => pipe.transform(quiz, metadata)).toThrow(BadRequestException);
    });

    it('should throw when booleanAnswer is null', () => {
      const quiz = makeQuiz([{ type: QuestionType.BOOLEAN, text: 'Test', booleanAnswer: null as unknown as boolean | undefined }]);
      expect(() => pipe.transform(quiz, metadata)).toThrow(BadRequestException);
    });
  });

  describe('INPUT type', () => {
    it('should pass when textAnswer is a non-empty string', () => {
      const quiz = makeQuiz([{ type: QuestionType.INPUT, text: 'Test', textAnswer: 'answer' }]);
      expect(() => pipe.transform(quiz, metadata)).not.toThrow();
    });

    it('should throw when textAnswer is missing', () => {
      const quiz = makeQuiz([{ type: QuestionType.INPUT, text: 'Test' }]);
      expect(() => pipe.transform(quiz, metadata)).toThrow(BadRequestException);
    });

    it('should throw when textAnswer is empty string', () => {
      const quiz = makeQuiz([{ type: QuestionType.INPUT, text: 'Test', textAnswer: '' }]);
      expect(() => pipe.transform(quiz, metadata)).toThrow(BadRequestException);
    });

    it('should throw when textAnswer is whitespace only', () => {
      const quiz = makeQuiz([{ type: QuestionType.INPUT, text: 'Test', textAnswer: '   ' }]);
      expect(() => pipe.transform(quiz, metadata)).toThrow(BadRequestException);
    });
  });

  describe('CHECKBOX type', () => {
    it('should pass with 2+ options and at least one correct', () => {
      const quiz = makeQuiz([
        {
          type: QuestionType.CHECKBOX,
          text: 'Test',
          options: [
            { text: 'A', isCorrect: true },
            { text: 'B', isCorrect: false },
          ],
        },
      ]);
      expect(() => pipe.transform(quiz, metadata)).not.toThrow();
    });

    it('should throw when options array is missing', () => {
      const quiz = makeQuiz([{ type: QuestionType.CHECKBOX, text: 'Test' }]);
      expect(() => pipe.transform(quiz, metadata)).toThrow(BadRequestException);
    });

    it('should throw when options array has less than 2 items', () => {
      const quiz = makeQuiz([{ type: QuestionType.CHECKBOX, text: 'Test', options: [{ text: 'A', isCorrect: true }] }]);
      expect(() => pipe.transform(quiz, metadata)).toThrow(BadRequestException);
    });

    it('should throw when no option is marked correct', () => {
      const quiz = makeQuiz([
        {
          type: QuestionType.CHECKBOX,
          text: 'Test',
          options: [
            { text: 'A', isCorrect: false },
            { text: 'B', isCorrect: false },
          ],
        },
      ]);
      expect(() => pipe.transform(quiz, metadata)).toThrow(BadRequestException);
    });

    it('should throw when options array is empty', () => {
      const quiz = makeQuiz([{ type: QuestionType.CHECKBOX, text: 'Test', options: [] }]);
      expect(() => pipe.transform(quiz, metadata)).toThrow(BadRequestException);
    });
  });

  describe('Unknown type', () => {
    it('should throw for unknown question type', () => {
      const quiz = makeQuiz([{ type: 'UNKNOWN' as unknown as QuestionType, text: 'Test' }]);
      expect(() => pipe.transform(quiz, metadata)).toThrow(BadRequestException);
    });
  });

  describe('Multiple questions', () => {
    it('should validate all questions and report correct index', () => {
      const quiz = makeQuiz([
        { type: QuestionType.BOOLEAN, text: 'Q1', booleanAnswer: true },
        { type: QuestionType.BOOLEAN, text: 'Q2' }, // missing booleanAnswer
      ]);
      expect(() => pipe.transform(quiz, metadata)).toThrow('questions[1]');
    });
  });
});