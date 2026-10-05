import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { QuestionType } from './question-type.enum.js';

/**
 * A single answer from someone attempting a quiz.
 *
 * The answer fields are deliberately optional at the DTO level: the client may
 * skip a question. `AnswerTypeRulesPipe` enforces that the field matching the
 * question's type is actually present.
 */
export class SubmitAnswerDto {
  @IsUUID('4', { message: 'questionId must be a valid question id' })
  questionId: string;

  @ValidateIf((o: SubmitAnswerDto) => o.type === QuestionType.BOOLEAN)
  @IsBoolean({ message: 'booleanAnswer is required for BOOLEAN questions' })
  booleanAnswer?: boolean;

  @ValidateIf((o: SubmitAnswerDto) => o.type === QuestionType.INPUT)
  @IsString({ message: 'textAnswer is required for INPUT questions' })
  @MaxLength(500, { message: 'textAnswer must be at most 500 characters' })
  textAnswer?: string;

  @ValidateIf((o: SubmitAnswerDto) => o.type === QuestionType.CHECKBOX)
  @IsArray({ message: 'optionIds is required for CHECKBOX questions' })
  @ArrayNotEmpty({ message: 'optionIds must contain at least one option' })
  @IsUUID('4', { each: true, message: 'optionIds must contain valid option ids' })
  @ArrayMaxSize(50, { message: 'optionIds must contain at most 50 options' })
  optionIds?: string[];

  /**
   * Echoed back by the client so the pipe can validate shape without a database
   * round-trip. Ignored by the service, which trusts the stored question type.
   */
  @IsOptional()
  @IsString()
  type?: QuestionType;
}