import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SubmitAnswerDto } from './submit-answer.dto.js';

export class SubmitQuizDto {
  @IsArray()
  @ArrayMaxSize(200, { message: 'A submission may contain at most 200 answers' })
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];
}