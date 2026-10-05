import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { QuestionType } from '../dto/question-type.enum.js';
import type { CreateQuizDto } from '../dto/create-quiz.dto.js';

@Injectable()
export class QuestionTypeRulesPipe implements PipeTransform<CreateQuizDto, CreateQuizDto> {
  transform(quiz: CreateQuizDto, _metadata: ArgumentMetadata): CreateQuizDto {
    const questions = quiz.questions ?? [];
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      const prefix = `questions[${i}]`;

      switch (q.type) {
        case QuestionType.BOOLEAN:
          if (q.booleanAnswer === undefined || q.booleanAnswer === null) {
            throw new BadRequestException(
              `${prefix}: BOOLEAN question requires a non-null booleanAnswer (true or false)`,
            );
          }
          break;

        case QuestionType.INPUT:
          if (!q.textAnswer || q.textAnswer.trim() === '') {
            throw new BadRequestException(
              `${prefix}: INPUT question requires a non-empty textAnswer`,
            );
          }
          break;

        case QuestionType.CHECKBOX:
          if (!q.options || q.options.length < 2) {
            throw new BadRequestException(
              `${prefix}: CHECKBOX question requires at least two options`,
            );
          }
          const hasCorrect = q.options.some((opt) => opt.isCorrect === true);
          if (!hasCorrect) {
            throw new BadRequestException(
              `${prefix}: CHECKBOX question requires at least one option with isCorrect = true`,
            );
          }
          break;

        default:
          throw new BadRequestException(
            `${prefix}: Unknown question type "${q.type}". Allowed: BOOLEAN, INPUT, CHECKBOX`,
          );
      }
    }
    return quiz;
  }
}