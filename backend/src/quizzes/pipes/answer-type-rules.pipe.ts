import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { QuestionType } from '../dto/question-type.enum.js';
import type { SubmitQuizDto } from '../dto/submit-quiz.dto.js';

/**
 * Enforces that each submitted answer carries the field required by its
 * question type, and that no answer smuggles in fields for other types.
 *
 * Runs after class-validator, so it can rely on the DTO shape being sane.
 */
@Injectable()
export class AnswerTypeRulesPipe implements PipeTransform<SubmitQuizDto, SubmitQuizDto> {
  transform(payload: SubmitQuizDto): SubmitQuizDto {
    const answers = payload.answers ?? [];

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i]!;
      const prefix = `answers[${i}]`;
      const type = answer.type;

      // The client may omit `type`; the service re-derives it from storage.
      if (type === undefined) continue;

      switch (type) {
        case QuestionType.BOOLEAN:
          if (typeof answer.booleanAnswer !== 'boolean') {
            throw new BadRequestException(
              `${prefix}: BOOLEAN answer requires booleanAnswer (true or false)`,
            );
          }
          break;

        case QuestionType.INPUT:
          if (typeof answer.textAnswer !== 'string') {
            throw new BadRequestException(`${prefix}: INPUT answer requires textAnswer`);
          }
          break;

        case QuestionType.CHECKBOX:
          if (!Array.isArray(answer.optionIds)) {
            throw new BadRequestException(
              `${prefix}: CHECKBOX answer requires optionIds to be an array`,
            );
          }
          break;

        default:
          throw new BadRequestException(
            `${prefix}: Unknown question type "${String(type)}". Allowed: BOOLEAN, INPUT, CHECKBOX`,
          );
      }
    }

    return payload;
  }
}