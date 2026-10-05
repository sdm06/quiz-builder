import { IsNumber, IsString } from 'class-validator';

export class ApiErrorDto {
  @IsNumber()
  statusCode: number;

  @IsString()
  message: string;

  @IsString()
  error: string;

  @IsString()
  timestamp: string;

  @IsString()
  path?: string;
}