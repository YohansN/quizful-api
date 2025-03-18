import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizGateway } from './quiz.gateway';
import { LlmService } from 'src/llm/llm.service';

@Module({
  providers: [QuizGateway, QuizService, LlmService],
})
export class QuizModule {}
