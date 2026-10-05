import { Module } from '@nestjs/common';
import { QuizzesController } from './quizzes.controller.js';
import { QuizzesService } from './quizzes.service.js';
import { QuestionTypeRulesPipe } from './pipes/question-type-rules.pipe.js';

@Module({
  controllers: [QuizzesController],
  providers: [QuizzesService, QuestionTypeRulesPipe],
})
export class QuizzesModule {}