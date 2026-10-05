import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from './question-type.enum.js';
import { OptionDto } from './option.dto.js';

export class CreateQuestionDto {
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  text: string;

  @ValidateIf((o) => o.type === QuestionType.BOOLEAN)
  @IsBoolean({ message: 'booleanAnswer is required and must be a boolean for BOOLEAN type' })
  booleanAnswer?: boolean;

  @ValidateIf((o) => o.type === QuestionType.INPUT)
  @IsString({ message: 'textAnswer is required and must be a non-empty string for INPUT type' })
  textAnswer?: string;

  @ValidateIf((o) => o.type === QuestionType.CHECKBOX)
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options?: OptionDto[];

  @IsOptional()
  @IsInt()
  order?: number;
}