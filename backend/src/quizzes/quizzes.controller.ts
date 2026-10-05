import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { QuizzesService } from './quizzes.service.js';
import { CreateQuizDto } from './dto/create-quiz.dto.js';
import { SubmitQuizDto } from './dto/submit-quiz.dto.js';
import { QuestionTypeRulesPipe } from './pipes/question-type-rules.pipe.js';
import { AnswerTypeRulesPipe } from './pipes/answer-type-rules.pipe.js';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    QuestionTypeRulesPipe,
  )
  async create(@Body() dto: CreateQuizDto) {
    return this.quizzesService.create(dto);
  }

  @Get()
  async findAll() {
    return this.quizzesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.quizzesService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.quizzesService.remove(id);
  }

  /** Answer-free quiz shape for attempting a quiz. Declared after `:id` GETs
   *  so the static segment is not captured by the `:id` route. */
  @Get(':id/play')
  async findOneForPlay(@Param('id') id: string) {
    return this.quizzesService.findOneForPlay(id);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    AnswerTypeRulesPipe,
  )
  async submit(@Param('id') id: string, @Body() dto: SubmitQuizDto) {
    return this.quizzesService.submit(id, dto);
  }
}