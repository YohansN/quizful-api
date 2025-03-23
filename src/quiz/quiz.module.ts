import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizGateway } from './quiz.gateway';
import { LlmService } from 'src/llm/llm.service';
import { QuizController } from './quiz.controller';

@Module({
  providers: [QuizGateway, QuizService, LlmService],
  controllers: [QuizController],
})
export class QuizModule {}
